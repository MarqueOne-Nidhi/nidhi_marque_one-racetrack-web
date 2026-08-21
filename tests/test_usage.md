# Using and extending the form tests

`README.md` in this folder says what the tests cover and why. This one is the
practical half: how to run them, and what to write when the forms change.

---

## Running them

```bash
npm test                              # everything, once
npm run test:watch                    # re-run on save

npx vitest run tests/contract.test.jsx        # one file
npx vitest run -t "records which call"        # one test, by name
npx vitest run -t "membership"                # anything matching
npx vitest run --reporter=verbose             # list every test name
```

The whole suite takes about five seconds. There is no reason to run less than
all of it before committing.

**Nothing in `npm test` touches the network.** See the trap about unstubbed
`fetch` below. To send a real submission on purpose, use the next section.

---

## Sending a real one

```bash
npm run test:live                       # both forms, for real
npm run test:live -- --check            # only ask if the endpoint is ready
npm run test:live -- --form=enquiry     # just one
```

This writes actual rows into the spreadsheet and sends actual email. It is a
separate command from `npm test` for that reason, and every row it writes says
`TEST` and asks to be deleted.

It reports back what the script replied:

```
ok    enquiry
      HTTP 200
      reply {"ok":true,"sheet":"Enquiry","row":3,"notified":true}
      wrote row 3 of Enquiry
      phone sent as "+91 90000 00000"
      emailed
```

Three things to read in that:

- **`"ok": true`** with a row number means the row is on disk.
- **`notified`**. `false` means the row is safe but the email threw, which is
  almost always the mail scope not having been granted. Run `sendTestEmail`
  from the Apps Script editor and approve the prompt.
- **`version`**, printed in the header. Saving in the editor does *not* update
  the live URL; only Deploy, Manage deployments, pencil, New version does, and
  until now that difference was invisible until a submission behaved oddly.
  `doGet` reports `VERSION` from `Code.gs`, and this script compares it with
  the copy in the repo and says so when the deployment is behind.

The phone number it sends starts with `+91` deliberately. A leading plus is a
formula in Sheets, and that is what put `#ERROR!` in the tab. After a run, the
phone column should read `+91 …`, not `#ERROR!` and not a right-aligned plain
number.

---

## The two helpers

### `stubEndpoint(options)` — from `helpers/endpoint.js`

Replaces `fetch` for one test and records what the site tried to send. Returns
the recording, not the mock, because the payload is what the tests care about.

```js
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';

const calls = stubEndpoint();
// ...drive the form...
expect(calls).toHaveLength(1);
expect(calls[0].payload.form).toBe('enquiry');
expect(fieldsOf(calls)['Full Name']).toBe('Ravi Menon');
```

| option | what it simulates |
| --- | --- |
| `status: 500` | the script erroring |
| `body: '{"ok":false,"error":"…"}'` | the script refusing a submission |
| `throws: new TypeError(…)` | CORS blocking the read, so the blind retry runs |
| `thenThrows: …` | the blind retry failing too |

Each recorded call has `url`, `method`, `mode`, `contentType`, `raw` and
`payload`.

### `loadAppsScript(book, onSendMail)` — from `helpers/appsScript.js`

Evaluates the real `docs/apps-script/Code.gs` against a fake spreadsheet.

```js
import { loadAppsScript, makeBook, makeSheet, headersFor } from './helpers/appsScript.js';

const book = makeBook();                 // empty spreadsheet
const env = loadAppsScript(book);

env.post('enquiry', { 'Full Name': 'Ravi Menon' });   // as the site posts
env.postForm({ form: 'enquiry', ... });               // as an older build posts
env.get();                                            // opening the /exec URL

env.sent;      // messages MailApp was asked to send
env.logs;      // console.log from the script
env.errors;    // console.error from the script
env.api;       // the script's globals: call repairSheets(), read FORMS, …
```

Simulate a mail failure, which is what an ungranted scope or an exhausted
quota looks like:

```js
const env = loadAppsScript(book, () => {
  throw new Error('You do not have permission to call MailApp.sendEmail');
});
expect(env.post('enquiry', fields).notified).toBe(false);
```

Start from a tab that already has history in it:

```js
const tab = makeSheet('One.Club-Membership', [
  ['Timestamp', 'Full Name', 'Phone/WhatsApp'],   // row 1 is the header row
  [new Date('2026-08-12'), 'hi', '12345678'],
]);
loadAppsScript(makeBook([tab])).post('membership', fields);

tab.headers();   // header row, trailing blanks trimmed
tab.records();   // data rows as objects keyed by header
tab._formats;    // "row:col" -> number format, for the phone-as-text checks
tab._meta;       // frozen, filter, deleted columns, widths
```

`headersFor('enquiry' | 'membership')` reads the declared column order out of
`Code.gs` itself, so a test never hardcodes it.

---

## Recipes

### Adding a field to a form

Three edits, then two tests.

1. Add the column to `FORMS[form].headers` in `docs/apps-script/Code.gs`.
2. Send the same string as a key from the form component.
3. Add the input.

`contract.test.jsx` will fail until 1 and 2 agree, in both directions: it fails
if the form sends a key with no column, **and** if a column exists that nothing
writes to. That is usually the only test you need, but add one to the form file
for the input itself:

```js
it('sends the new field', async () => {
  const user = setupUser();
  const calls = stubEndpoint();
  render(<EnquiryForm />);

  await fill(user);
  await user.type(screen.getByPlaceholderText('…'), 'a value');
  await submit(user);

  await waitFor(() => expect(fieldsOf(calls)['New Column']).toBe('a value'));
});
```

### Adding a call to action

Pass a source, and nothing else is required:

```jsx
onClick={() => openContact('Drive', 'Club · The paddock')}
```

`entry-points.test.jsx` scans the source and fails on any call site that
forgets, so a new button is covered the moment it is written. If it is a new
*kind* of place rather than another button in an existing one, add it to the
list in `covers the places a visitor actually starts from`.

Sources must read as a name, matching `/^[A-Z][A-Za-z0-9 ·.]+$/`, because they
are read by a person scanning a spreadsheet column.

### Adding a whole form

1. A new entry in `FORMS` in `Code.gs`.
2. Add its name to the `describe.each` at the top of `contract.test.jsx` and to
   the two `it.each` blocks below it. That gives the new form the full contract
   check for free.
3. A new `<name>-form.test.jsx`, modelled on `membership-form.test.jsx`.

### Renaming a sheet column

Header matching ignores case, punctuation and a trailing `(Optional)`, so
`Invitation Code/Referral (Optional)` and `Invitation Code / Referral` are the
same column. A rename within those bounds needs no migration.

A rename **outside** them is a new column, and the old one stays where it is
with its data in it. `repairSheets` only merges columns that normalise the
same, so it will not help. Move the data by hand.

---

## Things that will catch you out

**An unstubbed `fetch` throws on purpose.** `src/config.js` carries a live Apps
Script URL as a fallback, so a test that forgot to stub the network would not
fail: it would write a row into the real spreadsheet and send a real email.
`tests/setup.js` installs a `fetch` that refuses. If you see

> A test tried to reach https://script.google.com/… without stubbing the endpoint

then call `stubEndpoint()` first.

**Use `setupUser()`, not `userEvent.setup()`.** The default types one character
at a time with a real delay, which took the enquiry file from 4 seconds to 27.
`helpers/ui.js` turns it off.

**Submitting is asynchronous.** The click returns before the request is made.
Always wait:

```js
await waitFor(() => expect(calls).toHaveLength(1));
```

Asserting straight after the click reads an empty array and passes for the
wrong reason.

**The Apps Script vm is a separate realm.** A `Date` built inside `Code.gs` is
not `instanceof` the `Date` out here. Check `constructor.name`, or assert on
something the script derived from the date.

**Source-scanning tests ignore comments.** This codebase documents its own
hazards, and `App.jsx` explains in prose why `onClick={onOpenModal}` would be a
bug. `stripComments` in `entry-points.test.jsx` blanks comments while keeping
line numbers, so the explanation is not mistaken for the thing it warns about.

**jsdom does not implement everything.** `matchMedia`, `ResizeObserver`,
`IntersectionObserver` and `scrollTo` are stubbed in `tests/setup.js`. If a
component reaches for something else, stub it there rather than in the test.

---

## Checking your test can fail

A test that cannot fail is not a test. Before trusting a new one, break the
thing it covers and confirm it goes red:

```bash
# make the change you expect to be caught, then:
npx vitest run tests/your.test.jsx
# it must FAIL. undo the change; it must PASS.
```

Every test in this suite was checked that way. `README.md` lists the seven
shipped bugs that were reintroduced against the finished suite, and how many
tests each one broke.
