import { describe, it, expect } from 'vitest';
import {
  loadAppsScript,
  makeBook,
  makeSheet,
  headersFor,
  runnableFunctions,
} from './helpers/appsScript.js';

/**
 * The intake script: docs/apps-script/Code.gs.
 *
 * Everything here runs the real file, not a copy of its logic. It is the one
 * part of the submission path that cannot be exercised from the site and
 * cannot be checked in a browser, so it gets the most attention.
 */

const MEMBERSHIP = {
  'Full Name': 'Priya Nair',
  'Phone/WhatsApp': '+91 90000 00000',
  'Email Address': 'priya@example.com',
  'Primary Performance Vehicle': 'Porsche 911 GT3, 2023',
  'Invitation Code / Referral': 'REF-9',
  'Opened Via': 'Navbar',
  'Submitted From': 'https://marque.one/club',
  Referrer: 'https://www.instagram.com/',
};

const ENQUIRY = {
  'Enquiry Type': 'Stay',
  'Full Name': 'Ravi Menon',
  'Email Address': 'ravi@example.com',
  'Phone/WhatsApp': '+91 98888 88888',
  'What you have in mind': 'A weekend in October.',
  'Opened Via': 'Club · The house',
  'Submitted From': 'https://marque.one/club',
  Referrer: '',
};

/** The membership tab as the previous version of the script left it. */
const OLD_MEMBERSHIP_HEADERS = [
  'Timestamp',
  'Full Name',
  'Phone/WhatsApp',
  'Email Address',
  'Primary Performance Vehicle (Optional)',
  'Invitation Code/Referral (Optional)',
];

/** The membership tab after exact matching forked two of its columns. */
const FORKED_HEADERS = [
  ...OLD_MEMBERSHIP_HEADERS,
  'Primary Performance Vehicle',
  'Invitation Code / Referral',
  'Opened Via',
  'Submitted From',
  'Referrer',
];

const forkedTab = () =>
  makeSheet('One.Club-Membership', [
    FORKED_HEADERS.slice(),
    [new Date('2026-08-12T16:14:02'), 'hi', 12345678, 'a@dnsink.com', 'N/A', 'N/A', '', '', '', '', ''],
    [new Date('2026-08-12T16:23:56'), 'john', 123456, 'b@dnsink.com', 'N/A', 'N/A', '', '', '', '', ''],
    [
      new Date('2026-08-21T10:58:00'),
      'TEST MEMBERSHIP',
      '#ERROR!',
      'no-reply@example.com',
      '',
      '',
      'Automated test, not a real vehicle',
      'TEST-CODE',
      'Footer',
      'http://localhost:5177/',
      '',
    ],
  ]);

describe('routing', () => {
  it('sends an enquiry to the Enquiry tab', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = env.post('enquiry', ENQUIRY);

    expect(result.ok).toBe(true);
    expect(result.sheet).toBe('Enquiry');
    expect(book.tab('Enquiry')).toBeTruthy();
    expect(book.tab('One.Club-Membership')).toBeFalsy();
  });

  it('sends a membership request to its own tab', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = env.post('membership', MEMBERSHIP);

    expect(result.ok).toBe(true);
    expect(result.sheet).toBe('One.Club-Membership');
    expect(book.tab('Enquiry')).toBeFalsy();
  });

  it('is not case sensitive about the form name', () => {
    const env = loadAppsScript(makeBook());
    expect(env.post('MEMBERSHIP', MEMBERSHIP).sheet).toBe('One.Club-Membership');
  });

  it('rejects a form it does not know, without creating a tab', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = env.post('newsletter', { 'Full Name': 'X' });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown form/);
    expect(book._sheets.size).toBe(0);
  });

  it('still accepts a form-encoded body, for an older build or a curl test', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = env.postForm({ form: 'enquiry', 'Full Name': 'Legacy' });

    expect(result.ok).toBe(true);
    expect(book.tab('Enquiry').records()[0]['Full Name']).toBe('Legacy');
  });

  it('says what is wrong when the script is not bound to a spreadsheet', () => {
    const env = loadAppsScript(null);
    const result = env.post('enquiry', ENQUIRY);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/SHEET_ID/);
  });
});

describe('writing a row', () => {
  it('puts every value under its own header', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', ENQUIRY);
    const row = book.tab('Enquiry').records()[0];

    for (const [key, value] of Object.entries(ENQUIRY)) {
      expect(row[key], `column "${key}"`).toBe(value);
    }
  });

  it('stamps the time itself rather than trusting the payload', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', { ...ENQUIRY, Timestamp: 'not a date' });
    const stamp = book.tab('Enquiry')._cells[1][0];

    expect(stamp.constructor.name).toBe('Date');
  });

  it('lays out a new tab with frozen, filtered headers', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', ENQUIRY);
    const tab = book.tab('Enquiry');

    expect(tab.headers()).toEqual(headersFor('enquiry'));
    expect(tab._meta.frozen).toBe(1);
    expect(tab._meta.filter).toBe(true);
  });

  it('reports the row it wrote', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    expect(env.post('enquiry', ENQUIRY).row).toBe(2);
    expect(env.post('enquiry', ENQUIRY).row).toBe(3);
  });

  it('leaves a field the form did not send blank rather than undefined', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', { 'Full Name': 'Only a name' });
    const row = book.tab('Enquiry').records()[0];

    expect(row['What you have in mind']).toBe('');
    expect(row.Referrer).toBe('');
  });
});

describe('phone numbers, which Sheets will parse if allowed to', () => {
  it('stores a number beginning with + as the string it was typed as', () => {
    // A leading plus is a formula in Sheets. This landed in the live tab as
    // #ERROR! until the cell was formatted as text before the write.
    const book = makeBook();
    loadAppsScript(book).post('membership', MEMBERSHIP);
    const tab = book.tab('One.Club-Membership');

    expect(tab.records()[0]['Phone/WhatsApp']).toBe('+91 90000 00000');
    expect(tab._formats['2:3']).toBe('@');
  });

  it('does not turn a number with a leading zero into a number', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', { ...ENQUIRY, 'Phone/WhatsApp': '09876543210' });
    const value = book.tab('Enquiry').records()[0]['Phone/WhatsApp'];

    expect(typeof value).toBe('string');
    expect(value).toBe('09876543210');
  });

  it('formats every cell but the timestamp as text', () => {
    const book = makeBook();
    loadAppsScript(book).post('enquiry', ENQUIRY);
    const tab = book.tab('Enquiry');
    const width = tab.headers().length;

    expect(tab._formats['2:1']).toMatch(/mmm/);
    for (let c = 2; c <= width; c++) {
      expect(tab._formats[`2:${c}`], `column ${c}`).toBe('@');
    }
  });
});

describe('a tab the previous script created', () => {
  it('fills its existing columns instead of appending near-duplicates', () => {
    // "Primary Performance Vehicle (Optional)" and "Primary Performance
    // Vehicle" are the same column. Comparing the raw strings said otherwise
    // and forked the live tab.
    const tab = makeSheet('One.Club-Membership', [
      OLD_MEMBERSHIP_HEADERS.slice(),
      [new Date('2026-08-12'), 'hi', '12345678', 'a@dnsink.com', 'N/A', 'N/A'],
    ]);
    loadAppsScript(makeBook([tab])).post('membership', MEMBERSHIP);

    const headers = tab.headers();
    expect(headers.filter((h) => /vehicle/i.test(h))).toHaveLength(1);
    expect(headers.filter((h) => /invitation/i.test(h))).toHaveLength(1);
    expect(headers).toHaveLength(9);

    const row = tab._cells[2];
    expect(row[4]).toBe('Porsche 911 GT3, 2023');
    expect(row[5]).toBe('REF-9');
  });

  it('appends only the columns that are genuinely new, on the right', () => {
    const tab = makeSheet('One.Club-Membership', [
      OLD_MEMBERSHIP_HEADERS.slice(),
      [new Date('2026-08-12'), 'hi', '1', 'a@b.com', 'N/A', 'N/A'],
    ]);
    loadAppsScript(makeBook([tab])).post('membership', MEMBERSHIP);

    expect(tab.headers().slice(6)).toEqual(['Opened Via', 'Submitted From', 'Referrer']);
  });

  it('never moves a column out from under the rows already in it', () => {
    const tab = makeSheet('One.Club-Membership', [
      OLD_MEMBERSHIP_HEADERS.slice(),
      [new Date('2026-08-12'), 'hi', '12345678', 'a@dnsink.com', 'N/A', 'N/A'],
    ]);
    const before = tab._cells[1].slice();
    loadAppsScript(makeBook([tab])).post('membership', MEMBERSHIP);

    expect(tab._cells[1].slice(0, before.length)).toEqual(before);
  });

  it('trims trailing blanks when a data row is wider than the header row', () => {
    const tab = makeSheet('Enquiry', [
      ['Timestamp', 'Enquiry Type', 'Full Name', 'Email Address', 'Phone/WhatsApp', 'What you have in mind'],
      [new Date(), 'Drive', 'X', 'x@e.com', '1', 'y', 'stray', 'stray'],
    ]);
    loadAppsScript(makeBook([tab])).post('enquiry', ENQUIRY);

    expect(tab.headers()).toEqual(headersFor('enquiry'));
  });
});

describe('repairSheets', () => {
  it('folds a duplicated column back into the one that holds the history', () => {
    const tab = forkedTab();
    const env = loadAppsScript(makeBook([tab]));
    env.api.repairSheets();

    expect(tab.headers()).toEqual(headersFor('membership'));
    expect(tab.headers().filter((h) => /vehicle/i.test(h))).toHaveLength(1);
  });

  it('recovers values that were stranded in the duplicate', () => {
    const tab = forkedTab();
    loadAppsScript(makeBook([tab])).api.repairSheets();
    const test = tab.records()[2];

    expect(test['Primary Performance Vehicle']).toBe('Automated test, not a real vehicle');
    expect(test['Invitation Code / Referral']).toBe('TEST-CODE');
  });

  it('loses no rows and moves nothing else', () => {
    const tab = forkedTab();
    loadAppsScript(makeBook([tab])).api.repairSheets();
    const rows = tab.records();

    expect(rows).toHaveLength(3);
    expect(rows[0]['Full Name']).toBe('hi');
    expect(rows[1]['Full Name']).toBe('john');
    expect(rows[0]['Primary Performance Vehicle']).toBe('N/A');
    expect(rows[2]['Opened Via']).toBe('Footer');
    expect(rows[2]['Submitted From']).toBe('http://localhost:5177/');
  });

  it('keeps the older value when both columns of a pair hold data', () => {
    const tab = forkedTab();
    tab._cells[1][4] = 'Original';
    tab._cells[1][6] = 'From the duplicate';
    loadAppsScript(makeBook([tab])).api.repairSheets();

    expect(tab.records()[0]['Primary Performance Vehicle']).toBe('Original');
  });

  it('deletes columns right to left, so indices do not shift underneath it', () => {
    const tab = forkedTab();
    loadAppsScript(makeBook([tab])).api.repairSheets();

    expect(tab._meta.deleted).toHaveLength(2);
    expect(tab._meta.deleted[0]).toBeGreaterThan(tab._meta.deleted[1]);
  });

  it('is safe to run twice', () => {
    const tab = forkedTab();
    const env = loadAppsScript(makeBook([tab]));
    env.api.repairSheets();
    const after = JSON.stringify(tab._cells);
    env.api.repairSheets();

    expect(JSON.stringify(tab._cells)).toBe(after);
    expect(tab._meta.deleted).toHaveLength(2);
  });

  it('leaves the tab writable, with every value under its own header', () => {
    const tab = forkedTab();
    const env = loadAppsScript(makeBook([tab]));
    env.api.repairSheets();
    env.post('membership', MEMBERSHIP);

    const row = tab.records().at(-1);
    expect(tab.headers()).toHaveLength(9);
    for (const [key, value] of Object.entries(MEMBERSHIP)) {
      expect(row[key], `column "${key}"`).toBe(value);
    }
  });

  it('says so rather than throwing when there is nothing to repair', () => {
    const env = loadAppsScript(makeBook());
    expect(() => env.api.repairSheets()).not.toThrow();
    expect(env.logs.join('\n')).toMatch(/nothing there to repair/);
  });
});

describe('the notification', () => {
  it('leads an enquiry subject with the intent the visitor chose', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', ENQUIRY);

    expect(env.sent[0].subject).toBe('Marque One · Stay enquiry from Ravi Menon');
  });

  it('names a membership request as one', () => {
    const env = loadAppsScript(makeBook());
    env.post('membership', MEMBERSHIP);

    expect(env.sent[0].subject).toBe('One.club · Membership request from Priya Nair');
  });

  it('falls back rather than leaving a blank where a name should be', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', { 'Enquiry Type': 'Drive' });

    expect(env.sent[0].subject).toBe('Marque One · Drive enquiry from an unnamed visitor');
  });

  it('calls an enquiry with no type General', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', { 'Full Name': 'Ravi Menon' });

    expect(env.sent[0].subject).toBe('Marque One · General enquiry from Ravi Menon');
  });

  it('replies to the visitor, not to the owner of the script', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', ENQUIRY);

    expect(env.sent[0].replyTo).toBe('ravi@example.com');
    expect(env.sent[0].to).toBe(env.api.NOTIFY);
  });

  it('drops an unusable reply-to rather than letting sendEmail throw on it', () => {
    const env = loadAppsScript(makeBook());
    const result = env.post('enquiry', { ...ENQUIRY, 'Email Address': 'not an address' });

    expect(env.sent[0].replyTo).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it('carries every answer, and omits the blanks', () => {
    const env = loadAppsScript(makeBook());
    env.post('membership', { ...MEMBERSHIP, 'Invitation Code / Referral': '', Referrer: '' });
    const mail = env.sent[0];

    expect(mail.body).toContain('Priya Nair');
    expect(mail.body).toContain('Porsche 911 GT3, 2023');
    expect(mail.body).not.toContain('Invitation Code / Referral');
    expect(mail.body).not.toContain('Referrer:');
  });

  it('sends a plain text twin with no markup in it', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', ENQUIRY);

    expect(env.sent[0].body).not.toContain('<');
    expect(env.sent[0].htmlBody).toContain('<table');
  });

  it('escapes what the visitor typed, because it is landing in an inbox', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', { ...ENQUIRY, 'Full Name': '<script>alert(1)</script>' });

    expect(env.sent[0].htmlBody).toContain('&lt;script&gt;');
    expect(env.sent[0].htmlBody).not.toContain('<script>alert');
  });

  it('formats the timestamp rather than dumping a raw date into the mail', () => {
    const env = loadAppsScript(makeBook());
    env.post('enquiry', ENQUIRY);

    expect(env.sent[0].body).toMatch(/Timestamp: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('keeps the row and reports the failure when the mail throws', () => {
    // An ungranted mail scope and an exhausted quota both look like this.
    const book = makeBook();
    const env = loadAppsScript(book, () => {
      throw new Error('You do not have permission to call MailApp.sendEmail');
    });
    const result = env.post('enquiry', ENQUIRY);

    expect(result.ok).toBe(true);
    expect(result.notified).toBe(false);
    expect(book.tab('Enquiry').records()).toHaveLength(1);
    expect(env.errors.join('\n')).toMatch(/Notification failed/);
  });

  it('reports notified true when it goes out', () => {
    const env = loadAppsScript(makeBook());
    expect(env.post('enquiry', ENQUIRY).notified).toBe(true);
  });
});

describe('operating it by hand', () => {
  it('answers a GET without leaking the notify address', () => {
    const env = loadAppsScript(makeBook());
    const status = env.get();

    expect(status).toMatchObject({ ok: true, status: 'ready', notify: true });
    expect(status.forms.sort()).toEqual(['enquiry', 'membership']);
    expect(JSON.stringify(status)).not.toContain('@');
  });

  it('reports a version, so a stale deployment can be spotted from outside', () => {
    // Saving in the editor does not update the live URL, and the difference is
    // otherwise invisible until a submission behaves oddly.
    const env = loadAppsScript(makeBook());

    expect(env.get().version).toBe(env.api.VERSION);
    expect(env.api.VERSION).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('offers only safe functions first in the editor Run list', () => {
    // The Run control defaults to the first declaration in the file. It used
    // to be `who`, a one line helper, which threw when run with no argument.
    const declared = runnableFunctions();

    expect(declared[0]).toBe('doPost');
    expect(declared).not.toContain('who');
    expect(declared).not.toContain('normaliseHeader');
  });

  it('refuses to run doPost by hand rather than writing a blank row', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = JSON.parse(env.api.doPost()._body);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sendTestEmail/);
    expect(result.error).toMatch(/repairSheets/);
    expect(book._sheets.size).toBe(0);
  });

  it('survives the internal helpers being run with no arguments', () => {
    const env = loadAppsScript(makeBook());

    expect(() => env.api.who()).not.toThrow();
    expect(env.api.who()).toBe('an unnamed visitor');
    expect(() => env.api.normaliseHeader()).not.toThrow();
  });

  it('sends one test message and writes nothing', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    env.api.sendTestEmail();

    expect(env.sent).toHaveLength(1);
    expect(env.sent[0].to).toBe(env.api.NOTIFY);
    expect(book._sheets.size).toBe(0);
  });

  it('lays out both tabs from setUpSheets', () => {
    const book = makeBook();
    const env = loadAppsScript(book);
    env.api.setUpSheets();

    expect(book.tab('Enquiry').headers()).toEqual(headersFor('enquiry'));
    expect(book.tab('One.Club-Membership').headers()).toEqual(headersFor('membership'));
  });
});

describe('header normalisation', () => {
  const cases = [
    ['Primary Performance Vehicle (Optional)', 'Primary Performance Vehicle'],
    ['Invitation Code/Referral (Optional)', 'Invitation Code / Referral'],
    ['Phone/WhatsApp', 'Phone / WhatsApp'],
    ['full name', 'Full Name'],
    ['Submitted  From', 'Submitted From'],
  ];

  it.each(cases)('treats %s and %s as the same column', (a, b) => {
    const { api } = loadAppsScript(makeBook());
    expect(api.normaliseHeader(a)).toBe(api.normaliseHeader(b));
  });

  it('still tells genuinely different columns apart', () => {
    const { api } = loadAppsScript(makeBook());
    expect(api.normaliseHeader('Opened Via')).not.toBe(api.normaliseHeader('Submitted From'));
    expect(api.normaliseHeader('Referrer')).not.toBe(api.normaliseHeader('Referral'));
  });
});
