/**
 * ─── Nidhi-MqO-Motorsport-Club · form intake ──────────────────────────────
 *
 * One endpoint, one spreadsheet, one inbox. The site posts JSON; this routes
 * it to the right tab by the `form` field, appends the submission aligned to
 * that tab's header row, and emails NOTIFY with a subject that says which
 * form it was and what the visitor came for.
 *
 * Aligned to headers, not appended in object order, is the important part.
 * Object key order is not guaranteed and the site will gain fields over time;
 * if rows were written in whatever order the payload arrived, one new field
 * would silently shift every column from that day forward and the sheet would
 * be quietly wrong rather than obviously broken.
 *
 *
 * ── Installing ───────────────────────────────────────────────────────────
 *
 * 1. In the spreadsheet: Extensions → Apps Script. Delete whatever is in
 *    Code.gs, paste this, save.
 *
 * 2. Run `sendTestEmail` once from the editor and authorise when prompted.
 *    This step is not optional and is not only a test. A web app deployed as
 *    "Execute as: Me" runs with the permissions you granted it, and this
 *    version asks for a scope the old one did not: permission to send mail
 *    as you. Until you have granted it by running something by hand, every
 *    submission will write its row and then fail on the email, which is what
 *    a "notified": false in the reply means.
 *
 * 3. Run `repairSheets` once, then `setUpSheets`. See repairSheets for what
 *    it does and why it is needed.
 *
 * 4. Publish it.
 *
 *    If a deployment already exists, keep it. Deploy → Manage deployments →
 *    pencil icon → Version: New version → Deploy. The /exec URL does not
 *    change, so nothing on the site needs touching and there is no second
 *    deployment left behind to worry about. This is the one to use.
 *
 *    Only if there is no deployment yet: Deploy → New deployment → Web app,
 *    Execute as: Me, Who has access: Anyone. "Anyone" is required because
 *    the site posts without a Google login; the script only ever appends and
 *    never reads anything back out. Copy the /exec URL into the site .env as
 *    VITE_GOOGLE_SHEET_URL, or replace the fallback in src/config.js.
 *
 * Editing this later: Deploy → Manage deployments → pencil → New version.
 * Saving the file alone does not update the live URL, which is the usual
 * reason a change appears to have done nothing.
 */

// Where the notification goes. Leave '' to switch email off entirely and keep
// only the sheet. Consumer Gmail allows 100 of these a day.
var NOTIFY = 'project.motorclub@marque.one';

// Leave '' when this script lives inside the spreadsheet, which is the normal
// case and how the install above describes it. Set it to a spreadsheet ID
// only if the script is standalone, because getActiveSpreadsheet() returns
// nothing for a script that is not bound to a sheet.
var SHEET_ID = '';

var TIMESTAMP_FORMAT = 'd mmm yyyy, h:mm am/pm';

// Reported by doGet, so it is possible to tell from outside whether the
// deployment is running this file or an older one. Saving in the editor does
// not update the live URL; only Deploy, Manage deployments, New version does,
// and the difference is invisible until a submission behaves oddly. Bump this
// whenever the file changes. scripts/live-submission.mjs compares it.
var VERSION = '2026-08-21c';

/**
 * One entry per form. `headers` is the column order for that tab, `subject`
 * turns a submission into the line that arrives in the inbox, and `replyTo`
 * names the field holding the address of the visitor, so that a reply goes to
 * them rather than back into the script.
 *
 * Adding a field is two edits: the header here, and the same string as the
 * key the site sends. Nothing else moves, and existing rows keep their
 * columns.
 */
var FORMS = {
  membership: {
    sheet: 'One.Club-Membership',
    headers: [
      'Timestamp',
      'Full Name',
      'Phone/WhatsApp',
      'Email Address',
      'Primary Performance Vehicle',
      'Invitation Code / Referral',
      'Opened Via',
      'Submitted From',
      'Referrer',
    ],
    replyTo: 'Email Address',
    // Membership has only one intent, so the name carries the subject.
    subject: function (fields) {
      return 'One.club · Membership request from ' + who(fields);
    },
  },

  enquiry: {
    sheet: 'Enquiry',
    headers: [
      'Timestamp',
      'Enquiry Type',
      'Full Name',
      'Email Address',
      'Phone/WhatsApp',
      'What you have in mind',
      'Opened Via',
      'Submitted From',
      'Referrer',
    ],
    replyTo: 'Email Address',
    // The enquiry form asks what they want before it asks who they are, so
    // the subject leads with that: Drive, Stay, Business and so on. It is the
    // one thing worth knowing before the mail is opened.
    subject: function (fields) {
      var type = String(fields['Enquiry Type'] || '').trim() || 'General';
      return 'Marque One · ' + type + ' enquiry from ' + who(fields);
    },
  },
};

// Assigned rather than declared, deliberately. The Run control in the Apps
// Script editor lists function declarations and defaults to the first one in
// the file, which this used to be; pressing Run without touching the dropdown
// therefore called who() with no argument and threw "Cannot read properties
// of undefined (reading 'Full Name')". A one line internal helper should not
// be the thing the editor offers you first. Same reasoning below.
var who = function (fields) {
  return String((fields || {})['Full Name'] || '').trim() || 'an unnamed visitor';
};

/**
 * Headers are compared on a normalised form: lowercased, with "(optional)"
 * dropped and everything that is not a letter or a digit removed.
 *
 * Comparing the raw strings is what broke the membership tab. It already
 * existed, written by the previous script, with
 *
 *   Primary Performance Vehicle (Optional)
 *   Invitation Code/Referral (Optional)
 *
 * while the names in FORMS are "Primary Performance Vehicle" and "Invitation
 * Code / Referral". Not equal, so both were judged missing and appended to
 * the right, and the tab ended up with two columns for the vehicle and two
 * for the invitation code. A space, a slash or an "(Optional)" is not a
 * difference in meaning and must not be enough to fork a column.
 */
var normaliseHeader = function (name) {
  return String(name)
    .toLowerCase()
    .replace(/\(optional\)/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// ─── Request handling ──────────────────────────────────────────────────────

function doPost(e) {
  // Reached by pressing Run in the editor rather than by a request. Without
  // this it would read an empty body, take the defaults, and append a blank
  // row to the Enquiry tab, which is a worse outcome than an error.
  if (!e) {
    var runnable = 'sendTestEmail, repairSheets or setUpSheets';
    console.log(
      'doPost is the endpoint the site posts to and cannot be run by hand. ' +
        'Choose ' +
        runnable +
        ' from the function list beside the Run button instead.'
    );
    return json({ ok: false, error: 'No request. Run ' + runnable + ' instead.' });
  }

  try {
    var payload = parseBody(e);
    var key = String(payload.form || '').toLowerCase();
    var config = FORMS[key];

    if (!config) {
      return json({ ok: false, error: 'Unknown form: ' + key });
    }

    var fields = payload.fields || {};
    var target = getSheet(config);
    var headers = target.headers;

    // Keyed the same way the headers are compared, so a column the sheet
    // spells slightly differently still receives its value. Without this the
    // tolerant matching above would keep the old column and then leave it
    // empty for ever, which is worse than the duplicate it replaced.
    var byName = {};
    Object.keys(fields).forEach(function (k) {
      byName[normaliseHeader(k)] = fields[k];
    });

    var row = headers.map(function (header) {
      var name = normaliseHeader(header);
      if (name === 'timestamp') return new Date();
      var value = byName[name];
      return value === undefined || value === null ? '' : value;
    });

    writeRow(target.sheet, headers, row);

    // The row is already safe on disk. If the mail fails, and an ungranted
    // scope or the daily quota is the usual reason, that is worth recording
    // but is not worth telling the visitor their enquiry was lost, because
    // it was not.
    var notified = null;
    if (NOTIFY) {
      try {
        notify(config, headers, row, fields);
        notified = true;
      } catch (mailErr) {
        notified = false;
        console.error('Notification failed: ' + mailErr);
      }
    }

    return json({
      ok: true,
      sheet: config.sheet,
      row: target.sheet.getLastRow(),
      notified: notified,
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  }
}

/**
 * Appends one row, with every cell but the timestamp formatted as plain text
 * before the values go in.
 *
 * appendRow was doing this before and could not, because Sheets parses what
 * it is given. A phone number typed as "+91 00000 00000" begins with a plus,
 * which is a formula in Sheets, and it landed in the tab as #ERROR!. Shorter
 * numbers fared no better: they were stored as numbers, which silently drops
 * a leading zero. Setting the format to '@' first makes the cell take the
 * string exactly as sent, which is the only correct reading of a field a
 * person typed a phone number into.
 */
function writeRow(sheet, headers, row) {
  var index = sheet.getLastRow() + 1;
  var range = sheet.getRange(index, 1, 1, headers.length);

  range.setNumberFormats([
    headers.map(function (h) {
      return normaliseHeader(h) === 'timestamp' ? TIMESTAMP_FORMAT : '@';
    }),
  ]);
  range.setValues([row]);
}

// Opening the /exec URL in a browser should say something useful rather than
// throwing, so a deployment can be checked without sending a test payload.
// It reports whether mail is on, but not the address: this URL answers to
// anyone, and that is not a thing to hand out.
function doGet() {
  return json({
    ok: true,
    status: 'ready',
    version: VERSION,
    forms: Object.keys(FORMS),
    notify: !!NOTIFY,
  });
}

/**
 * The site posts JSON as text/plain. That is deliberate: text/plain is a
 * "simple" content type, so the browser sends it without a CORS preflight,
 * which Apps Script cannot answer. Form-encoded bodies are still accepted so
 * an older build, or a curl test, keeps working.
 */
function parseBody(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (ignored) {
      // fall through to the form-encoded reading below
    }
  }
  var params = (e && e.parameter) || {};
  var fields = {};
  Object.keys(params).forEach(function (k) {
    if (k !== 'form') fields[k] = params[k];
  });
  return { form: params.form || 'enquiry', fields: fields };
}

// ─── The sheet ─────────────────────────────────────────────────────────────

function book() {
  var file = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!file) {
    throw new Error(
      'No spreadsheet found. Bind this script to the sheet through ' +
        'Extensions and Apps Script, or set SHEET_ID at the top of this file.'
    );
  }
  return file;
}

/** The header row as it actually stands, with trailing blanks trimmed. */
function readHeaders(sheet) {
  var headers = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map(function (h) {
      return String(h);
    });

  // getLastColumn() measures the widest row, not the header row, so a wide
  // data row leaves empty strings on the end of this.
  while (headers.length && headers[headers.length - 1] === '') headers.pop();
  return headers;
}

/**
 * Finds the tab, creating it if missing, and returns the header row that is
 * actually on it.
 *
 * Actually on it, rather than the list above, because the two can disagree.
 * A tab written by an earlier version of this script has that version of the
 * columns; if a row were laid out against the current list, every value after
 * the first new column would land one place to the left of where it belongs.
 * So the row is aligned to what the sheet says, and only genuinely new
 * columns are appended to the right. Old rows keep their columns, and no
 * column is ever moved out from under the data sitting in it.
 */
function getSheet(config) {
  var file = book();
  var sheet = file.getSheetByName(config.sheet);
  if (!sheet) sheet = file.insertSheet(config.sheet);

  if (sheet.getLastRow() === 0) {
    layOutHeaders(sheet, config.headers);
    return { sheet: sheet, headers: config.headers.slice() };
  }

  var headers = readHeaders(sheet);
  var present = headers.map(normaliseHeader);

  var missing = config.headers.filter(function (h) {
    return present.indexOf(normaliseHeader(h)) === -1;
  });

  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    styleHeaders(sheet, headers.length + 1, missing.length);
    headers = headers.concat(missing);
  }

  return { sheet: sheet, headers: headers };
}

function layOutHeaders(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  styleHeaders(sheet, 1, headers.length);
  sheet.setFrozenRows(1);
  // createFilter throws rather than doing nothing if the sheet already has one.
  if (!sheet.getFilter()) sheet.getRange(1, 1, 1, headers.length).createFilter();
  setColumnFormats(sheet, headers);
}

function styleHeaders(sheet, start, count) {
  sheet
    .getRange(1, start, 1, count)
    .setFontWeight('bold')
    .setBackground('#1b1d21')
    .setFontColor('#f5f1e8')
    .setVerticalAlignment('middle');

  for (var c = start; c < start + count; c++) {
    // Two of the context columns hold URLs, which are long and are read far
    // less often than the answers the visitor typed.
    var header = String(sheet.getRange(1, c).getValue());
    sheet.setColumnWidth(
      c,
      header === 'Submitted From' || header === 'Referrer' ? 240 : 190
    );
  }
}

/** Timestamps get a date format; everything else is text. See writeRow. */
function setColumnFormats(sheet, headers) {
  var rows = sheet.getMaxRows() - 1;
  if (rows < 1) return;

  for (var c = 0; c < headers.length; c++) {
    sheet
      .getRange(2, c + 1, rows, 1)
      .setNumberFormat(
        normaliseHeader(headers[c]) === 'timestamp' ? TIMESTAMP_FORMAT : '@'
      );
  }
  sheet.setColumnWidth(1, 165);
}

// ─── The email ─────────────────────────────────────────────────────────────

/**
 * Everything the visitor typed, in the column order of the sheet, with the
 * blanks left out. Sent as HTML with a plain text twin, because a client that
 * refuses HTML should still get something readable rather than markup.
 *
 * replyTo is set to the address of the visitor, so answering the notification
 * answers the person. Without it a reply goes to the owner of the script,
 * which is whoever is already reading the mail.
 */
function notify(config, headers, row, fields) {
  var zone = Session.getScriptTimeZone();
  var lines = [];
  var cells = '';

  for (var i = 0; i < headers.length; i++) {
    var value = row[i];
    if (value === '' || value === null || value === undefined) continue;

    var text =
      value instanceof Date
        ? Utilities.formatDate(value, zone, 'd MMM yyyy, h:mm a')
        : String(value);

    lines.push(headers[i] + ': ' + text);

    cells +=
      '<tr>' +
      '<td style="padding:10px 18px 10px 30px;vertical-align:top;white-space:nowrap;' +
      'font:600 10px/1.5 Helvetica,Arial,sans-serif;letter-spacing:.09em;' +
      'text-transform:uppercase;color:#8a8578;">' +
      escapeHtml(headers[i]) +
      '</td>' +
      '<td style="padding:10px 30px 10px 0;vertical-align:top;' +
      'font:400 14px/1.5 Helvetica,Arial,sans-serif;color:#14140f;">' +
      escapeHtml(text) +
      '</td>' +
      '</tr>';
  }

  var heading = config === FORMS.membership ? 'Membership request' : 'New enquiry';

  var html =
    '<div style="background:#f5f1e8;padding:28px 0;">' +
    '<div style="max-width:600px;margin:0 auto;background:#faf8f3;' +
    'border-top:3px solid #cc0000;">' +
    '<div style="padding:26px 30px 0;">' +
    '<div style="font:600 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.22em;' +
    'text-transform:uppercase;color:#8a8578;">MARQUE.' +
    '<span style="color:#cc0000;">ONE</span></div>' +
    '<h1 style="margin:12px 0 0;font:300 27px/1.15 Georgia,serif;color:#14140f;">' +
    escapeHtml(heading) +
    '</h1></div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
    'style="width:100%;border-collapse:collapse;margin:18px 0 0;"><tbody>' +
    cells +
    '</tbody></table>' +
    '<div style="padding:22px 30px 26px;font:400 11px/1.5 Helvetica,Arial,sans-serif;' +
    'color:#8a8578;">Recorded in the ' +
    escapeHtml(config.sheet) +
    ' tab. Replying to this message replies to the sender.</div>' +
    '</div></div>';

  var options = {
    to: NOTIFY,
    subject: config.subject(fields),
    body: lines.join('\n'),
    htmlBody: html,
    name: 'Marque One',
  };

  var replyTo = String(fields[config.replyTo] || '').trim();
  // An invalid address makes sendEmail throw, which would turn a typo in one
  // field into a failed notification for the whole submission.
  if (/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(replyTo)) options.replyTo = replyTo;

  MailApp.sendEmail(options);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Helpers to run by hand ────────────────────────────────────────────────

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Lays out both tabs, and adds any new columns to tabs that already exist. */
function setUpSheets() {
  Object.keys(FORMS).forEach(function (k) {
    var target = getSheet(FORMS[k]);
    console.log(FORMS[k].sheet + ': ' + target.headers.join(' | '));
  });
}

/**
 * Run this once after installing. It is what grants the script permission to
 * send mail as you; see step 2 at the top. It sends one message to NOTIFY and
 * writes nothing to the sheet.
 */
function sendTestEmail() {
  if (!NOTIFY) {
    console.log('NOTIFY is empty, so email is switched off. Nothing sent.');
    return;
  }
  notify(
    FORMS.enquiry,
    FORMS.enquiry.headers,
    [
      new Date(),
      'Drive',
      'Test Submission',
      'no-reply@marque.one',
      '+91 90000 00000',
      'Checking that notifications arrive and are formatted correctly.',
      'Apps Script editor',
      'https://marque.one/',
      '',
    ],
    { 'Full Name': 'Test Submission', 'Enquiry Type': 'Drive' }
  );
  console.log('Sent to ' + NOTIFY + '. Nothing was written to the sheet.');
}

/**
 * Run once by hand, to undo the damage the exact header matching did.
 *
 * The membership tab has two columns for the vehicle and two for the
 * invitation code, because the version before this one compared header names
 * as raw strings and did not recognise "Primary Performance Vehicle
 * (Optional)" as the same thing as "Primary Performance Vehicle". This joins
 * each such pair back together.
 *
 * It is careful in three ways, because it is the only thing here that removes
 * anything:
 *
 *   the leftmost column of a pair is the one that stays, since that is the
 *   one holding the history;
 *
 *   a value is only copied into a cell that is empty, so nothing already
 *   recorded is ever written over;
 *
 *   the duplicate is deleted only after its contents have been moved, and
 *   deletion runs right to left so the columns still to be removed do not
 *   shift out from under their own indices.
 *
 * Take File → Make a copy first if you would rather not take my word for any
 * of that. Running it twice is harmless: the second run finds no pairs.
 */
function repairSheets() {
  Object.keys(FORMS).forEach(function (key) {
    var config = FORMS[key];
    var sheet = book().getSheetByName(config.sheet);

    if (!sheet || sheet.getLastRow() === 0) {
      console.log(config.sheet + ': nothing there to repair.');
      return;
    }

    var headers = readHeaders(sheet);
    var lastRow = sheet.getLastRow();

    // Pair every column with the first one that means the same thing.
    var firstAt = {};
    var pairs = [];
    headers.forEach(function (header, i) {
      var name = normaliseHeader(header);
      if (!name) return;
      if (firstAt[name] === undefined) {
        firstAt[name] = i;
        return;
      }
      pairs.push({ from: i, into: firstAt[name], header: header });
    });

    if (!pairs.length) {
      console.log(config.sheet + ': no duplicate columns.');
    }

    pairs.forEach(function (pair) {
      var moved = 0;
      if (lastRow > 1) {
        var height = lastRow - 1;
        var source = sheet.getRange(2, pair.from + 1, height, 1).getValues();
        var keep = sheet.getRange(2, pair.into + 1, height, 1).getValues();

        for (var r = 0; r < height; r++) {
          if (source[r][0] !== '' && keep[r][0] === '') {
            keep[r][0] = source[r][0];
            moved++;
          }
        }
        if (moved) sheet.getRange(2, pair.into + 1, height, 1).setValues(keep);
      }
      console.log(
        config.sheet +
          ': "' +
          pair.header +
          '" folded into column ' +
          (pair.into + 1) +
          ', ' +
          moved +
          ' value(s) moved.'
      );
    });

    pairs
      .map(function (pair) {
        return pair.from;
      })
      .sort(function (a, b) {
        return b - a;
      })
      .forEach(function (index) {
        sheet.deleteColumn(index + 1);
      });

    // Give the survivors the canonical spelling, so the tab reads the way
    // this file does rather than the way the old script left it.
    var canonical = {};
    config.headers.forEach(function (header) {
      canonical[normaliseHeader(header)] = header;
    });

    var remaining = readHeaders(sheet).map(function (header) {
      return canonical[normaliseHeader(header)] || header;
    });
    if (remaining.length) {
      sheet.getRange(1, 1, 1, remaining.length).setValues([remaining]);
      styleHeaders(sheet, 1, remaining.length);
      sheet.setFrozenRows(1);
      setColumnFormats(sheet, remaining);
    }

    // Anything genuinely missing still needs adding, and the tab is now in a
    // state where that will not duplicate.
    var target = getSheet(config);
    console.log(config.sheet + ' now reads: ' + target.headers.join(' | '));
  });
}
