#!/usr/bin/env node
/**
 * Sends a real submission to the live Apps Script endpoint.
 *
 * Deliberately not part of `npm test`. The suite stubs the network on purpose,
 * because a test that forgot to would write into the real spreadsheet and send
 * a real email; this is the other half of that decision, a way to do it on
 * purpose when you want to see a row land.
 *
 *   npm run test:live                  both forms
 *   npm run test:live -- --form=enquiry
 *   npm run test:live -- --form=membership
 *   npm run test:live -- --check       only ask whether the endpoint is ready
 *
 * Every row it writes says TEST and asks to be deleted, and the phone number
 * is a real +91 one, because a leading plus is a formula in Sheets and getting
 * that wrong is what put #ERROR! in the tab in the first place.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const has = (flag) => args.some((a) => a === flag || a.startsWith(`${flag}=`));
const value = (flag) => {
  const found = args.find((a) => a.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : null;
};

/**
 * src/config.js reads import.meta.env, which only exists under Vite, so the
 * URL is lifted out of the source rather than imported.
 */
function endpoint() {
  if (process.env.VITE_GOOGLE_SHEET_URL) return process.env.VITE_GOOGLE_SHEET_URL;

  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'config.js'), 'utf8');
  const match = source.match(/['"](https:\/\/script\.google\.com\/[^'"]+)['"]/);
  if (!match) {
    throw new Error('No endpoint in src/config.js and no VITE_GOOGLE_SHEET_URL set.');
  }
  return match[1];
}

/** The VERSION constant in the copy of Code.gs kept in this repo. */
function localVersion() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'docs', 'apps-script', 'Code.gs'),
    'utf8'
  );
  const match = source.match(/var VERSION = '([^']+)'/);
  return match ? match[1] : 'unknown';
}

const stamp = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const SUBMISSIONS = {
  enquiry: {
    'Enquiry Type': 'Drive',
    'Full Name': `TEST ENQUIRY ${stamp}, please delete`,
    'Email Address': 'no-reply@example.com',
    // The case that used to land as #ERROR!.
    'Phone/WhatsApp': '+91 90000 00000',
    'What you have in mind': 'Live check from npm run test:live. Safe to delete.',
    'Opened Via': 'Live check',
    'Submitted From': 'https://marque.one/',
    Referrer: 'https://www.instagram.com/',
  },
  membership: {
    'Full Name': `TEST MEMBERSHIP ${stamp}, please delete`,
    'Phone/WhatsApp': '+91 98888 88888',
    'Email Address': 'no-reply@example.com',
    'Primary Performance Vehicle': 'Not a real vehicle',
    'Invitation Code / Referral': 'TEST-CODE',
    'Opened Via': 'Live check',
    'Submitted From': 'https://marque.one/club',
    Referrer: '',
  },
};

/** Posts exactly the way src/lib/submitToSheet.js does. */
async function post(url, form, fields) {
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ form, fields }),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* left null, and reported as the raw body below */
  }
  return { status: response.status, parsed, text };
}

const tick = (ok) => (ok ? 'ok  ' : 'FAIL');

async function main() {
  const url = endpoint();
  console.log(`\nEndpoint  ${url.slice(0, 62)}…\n`);

  const ready = await fetch(url).then((r) => r.json());
  console.log(`${tick(ready.ok)}  deployment answers`);
  console.log(`      forms: ${ready.forms.join(', ')}`);
  console.log(`      email: ${ready.notify ? 'switched on' : 'switched OFF (NOTIFY is empty)'}`);

  // Saving in the editor does not update the live URL. This is the only way
  // to tell from outside whether the deployment is running the current file.
  const local = localVersion();
  if (!ready.version) {
    console.log(`      version: not reported, so the deployment predates VERSION`);
    console.log(`               the file here is ${local}. Redeploy: Deploy,`);
    console.log(`               Manage deployments, pencil, New version.`);
  } else if (ready.version !== local) {
    console.log(`      version: live is ${ready.version}, this repo has ${local}`);
    console.log(`               the deployment is behind. Redeploy a New version.`);
  } else {
    console.log(`      version: ${ready.version}, matching this repo`);
  }

  if (has('--check')) {
    console.log('\n--check given, so nothing was sent.\n');
    return;
  }

  const only = value('--form');
  const forms = only ? [only] : ['enquiry', 'membership'];
  let failures = 0;

  for (const form of forms) {
    if (!SUBMISSIONS[form]) {
      console.log(`\nFAIL  unknown form "${form}"`);
      failures++;
      continue;
    }

    const fields = SUBMISSIONS[form];
    const { status, parsed, text } = await post(url, form, fields);
    const body = parsed || text.slice(0, 200);
    const wrote = parsed && parsed.ok === true;

    console.log(`\n${tick(wrote)}  ${form}`);
    console.log(`      HTTP ${status}`);
    console.log(`      reply ${JSON.stringify(body)}`);

    if (!wrote) {
      failures++;
      continue;
    }

    console.log(`      wrote row ${parsed.row} of ${parsed.sheet}`);
    console.log(`      phone sent as "${fields['Phone/WhatsApp']}"`);

    if (parsed.notified === true) {
      console.log('      emailed');
    } else if (parsed.notified === false) {
      failures++;
      console.log('      NOT emailed. The row is safe, the notification threw.');
      console.log('      Run sendTestEmail from the Apps Script editor and');
      console.log('      approve the prompt: that is what grants the mail scope.');
    } else {
      console.log('      email switched off, NOTIFY is empty');
    }
  }

  console.log(
    `\nCheck the sheet. Rows written by this say TEST and ask to be deleted.` +
      `\nThe phone column should read +91 …, not #ERROR! and not a plain number.\n`
  );

  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error('\nFAIL  could not reach the endpoint\n     ', error.message, '\n');
  process.exit(1);
});
