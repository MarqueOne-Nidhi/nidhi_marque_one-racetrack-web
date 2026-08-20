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
 *    submission will write its row and then fail on the email.
 *
 * 3. Run `setUpSheets` to lay out both tabs without waiting for a form.
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

function who(fields) {
  return String(fields['Full Name'] || '').trim() || 'an unnamed visitor';
}

// ─── Request handling ──────────────────────────────────────────────────────

function doPost(e) {
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

    var row = headers.map(function (header) {
      if (header === 'Timestamp') return new Date();
      var value = fields[header];
      return value === undefined || value === null ? '' : value;
    });

    target.sheet.appendRow(row);

    // A raw date renders as an unreadable serial number in some locales, and
    // the format is per cell rather than per column once rows exist.
    var written = target.sheet.getLastRow();
    if (headers[0] === 'Timestamp') {
      target.sheet.getRange(written, 1).setNumberFormat('d mmm yyyy, h:mm am/pm');
    }

    // The row is already safe on disk. If the mail fails, and quota is the
    // usual reason, that is worth recording but is not worth telling the
    // visitor their enquiry was lost, because it was not.
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

    return json({ ok: true, sheet: config.sheet, row: written, notified: notified });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  }
}

// Opening the /exec URL in a browser should say something useful rather than
// throwing, so a deployment can be checked without sending a test payload.
// It reports whether mail is on, but not the address: this URL answers to
// anyone, and that is not a thing to hand out.
function doGet() {
  return json({
    ok: true,
    status: 'ready',
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

/**
 * Finds the tab, creating it if missing, and returns the header row that is
 * actually on it.
 *
 * Actually on it, rather than the list above, because the two can disagree.
 * A tab written by an earlier version of this script has that version of the
 * columns; if a row were laid out against the current list, every value after
 * the first new column would land one place to the left of where it belongs.
 * So new columns are appended to the right of whatever is already there, and
 * the row is aligned to the result. Old rows keep their columns, and no
 * column is ever moved out from under the data sitting in it.
 */
function getSheet(config) {
  var book = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!book) {
    throw new Error(
      'No spreadsheet found. Bind this script to the sheet through ' +
        'Extensions and Apps Script, or set SHEET_ID at the top of this file.'
    );
  }

  var sheet = book.getSheetByName(config.sheet);
  if (!sheet) sheet = book.insertSheet(config.sheet);

  if (sheet.getLastRow() === 0) {
    layOutHeaders(sheet, config.headers);
    return { sheet: sheet, headers: config.headers.slice() };
  }

  var headers = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map(function (h) {
      return String(h);
    });

  // getLastColumn() measures the widest row, not the header row, so a wide
  // data row leaves empty strings on the end of this.
  while (headers.length && headers[headers.length - 1] === '') headers.pop();

  var missing = config.headers.filter(function (h) {
    return headers.indexOf(h) === -1;
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
  sheet.setColumnWidth(1, 165);
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
