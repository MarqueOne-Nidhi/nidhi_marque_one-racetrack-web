/**
 * ─── Nidhi-MqO-Motorsport-Club · form intake ──────────────────────────────
 *
 * One endpoint, two destinations. The site posts JSON; this routes it to the
 * right tab by the `form` field, writes a header row the first time a tab is
 * used, and appends each submission aligned to those headers.
 *
 * Aligned to headers, not appended in object order, is the important part.
 * Object key order is not guaranteed and the site will gain fields over time;
 * if rows were written in whatever order the payload arrived, one new field
 * would silently shift every column from that day forward and the sheet would
 * be quietly wrong rather than obviously broken.
 *
 * ── Deploying ────────────────────────────────────────────────────────────
 * 1. In the spreadsheet: Extensions → Apps Script.
 * 2. Delete whatever is in Code.gs, paste this, save.
 * 3. Deploy → New deployment → type: Web app.
 *      Execute as:        Me
 *      Who has access:    Anyone
 *    "Anyone" is required: the site posts without a Google login. The script
 *    only ever appends, and never reads anything back out.
 * 4. Authorise when prompted, copy the /exec URL.
 * 5. Put it in the site's .env as VITE_GOOGLE_SHEET_URL, or replace the
 *    fallback in src/config.js.
 *
 * Editing this later: after any change you must Deploy → Manage deployments
 * → edit → New version. Saving alone does not update the live URL, which is
 * the usual reason a change appears to do nothing.
 */

// Tab name per form, and the column order for each. Add a field by adding it
// here and in the site; existing rows keep their columns.
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
      'Submitted From',
    ],
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
      'Submitted From',
    ],
  },
};

// Set to an address to be emailed on every submission. Leave '' for none.
var NOTIFY = '';

function doPost(e) {
  try {
    var payload = parseBody(e);
    var key = String(payload.form || '').toLowerCase();
    var config = FORMS[key];

    if (!config) {
      return json({ ok: false, error: 'Unknown form: ' + key });
    }

    var sheet = getSheet(config);
    var row = config.headers.map(function (header) {
      if (header === 'Timestamp') return new Date();
      var value = payload.fields ? payload.fields[header] : undefined;
      return value === undefined || value === null || value === '' ? '' : value;
    });

    sheet.appendRow(row);

    if (NOTIFY) {
      MailApp.sendEmail(
        NOTIFY,
        'New ' + key + ' submission',
        config.headers
          .map(function (h, i) {
            return h + ': ' + row[i];
          })
          .join('\n')
      );
    }

    return json({ ok: true, sheet: config.sheet });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Opening the /exec URL in a browser should say something useful rather than
// throwing, so the deployment can be checked without sending a test payload.
function doGet() {
  return json({ ok: true, status: 'ready', forms: Object.keys(FORMS) });
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

/** Finds the tab, creating it if missing, and guarantees the header row. */
function getSheet(config) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(config.sheet);

  if (!sheet) sheet = book.insertSheet(config.sheet);

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, config.headers.length)
      .setValues([config.headers])
      .setFontWeight('bold')
      .setBackground('#1b1d21')
      .setFontColor('#f5f1e8');
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, config.headers.length).createFilter();
    // Timestamps are the one column that is unreadable at default width.
    sheet.setColumnWidth(1, 160);
    for (var c = 2; c <= config.headers.length; c++) sheet.setColumnWidth(c, 190);
  }

  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Run once from the editor to lay out both tabs without waiting for a form. */
function setUpSheets() {
  Object.keys(FORMS).forEach(function (k) {
    getSheet(FORMS[k]);
  });
}
