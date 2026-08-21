# Form submission tests

    npm test            run once
    npm run test:watch  re-run on change
    npm run test:live   send a REAL submission to the live endpoint

`npm test` never touches the network. `test:live` is the deliberate exception;
see test_usage.md.

146 tests over the whole submission path, from a visitor typing in a field to a
row landing under the right column heading.

## The files

| file | what it covers |
| --- | --- |
| `apps-script.test.js` | `docs/apps-script/Code.gs`: routing, header matching, the repair, the notification |
| `submit-to-sheet.test.js` | the transport, mostly its failure paths |
| `enquiry-form.test.jsx` | the enquiry form, driven as a visitor drives it |
| `membership-form.test.jsx` | the club membership request |
| `entry-points.test.jsx` | getting to a form, and arriving with the right context |
| `contract.test.jsx` | the agreement between what the site sends and what the sheet has columns for |

`helpers/appsScript.js` evaluates `Code.gs` under fake Google services.
`helpers/endpoint.js` replaces `fetch` and records what the site tried to send.

## Two things worth knowing

**An unstubbed `fetch` throws.** The forms post to a real Apps Script endpoint
whose URL is compiled into the bundle as a fallback in `src/config.js`. A test
that forgot to stub the network would not fail; it would quietly write a row
into the live spreadsheet and send a real email. `tests/setup.js` installs a
`fetch` that refuses, so forgetting is loud. Use `stubEndpoint()`.

**`Code.gs` is not a module.** It is a flat script of globals that Google
evaluates in its own runtime, so it cannot be imported. `loadAppsScript()`
evaluates it in a `vm` context whose globals stand in for `SpreadsheetApp`,
`MailApp` and the rest, and returns that context. The vm is a separate realm,
so a `Date` built inside `Code.gs` is not `instanceof` the `Date` out here;
check `constructor.name` instead.

## The contract test

`contract.test.jsx` is the one to keep. It does not compare two hardcoded
lists. It drives the real forms to see what they actually send, reads the real
headers out of `Code.gs`, and compares them through the same matching function
the script uses to decide. It fails if a form sends a field with no column
behind it, if a column exists that nothing ever writes to, or if two field
names would collapse onto the same column.

That last one is not hypothetical. The live membership tab ended up with two
columns for the vehicle and two for the invitation code, because
`Primary Performance Vehicle (Optional)` and `Primary Performance Vehicle` were
compared as raw strings and judged different.

## These tests are known to fail on real bugs

Every bug in the list below actually shipped. Each was reintroduced against the
finished suite to confirm it gets caught, rather than trusting that a green run
means anything.

| reintroduced bug | tests that failed |
| --- | --- |
| exact header matching, which forked the live sheet | 10 |
| `appendRow` semantics, which turned `+91 …` into `#ERROR!` | 2 |
| `no-cors` posting, which reported success for a dead endpoint | 1 |
| a renamed field key with no column behind it | 3 |
| a call to action that forgets to name itself | 1 |
| a form that stops reporting failure to the visitor | 4 |
| the membership form dropping its optional fields | 2 |

## What is not covered here

The 3D card cylinder, the circuit trace and the map are geometry and animation.
`CardCylinder` exports `cardPlacement` and `scrollFraction` as pure functions
for exactly that reason, but their tests are not in this suite yet.

Nothing here checks how anything looks.
