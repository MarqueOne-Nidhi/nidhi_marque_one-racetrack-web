import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from './helpers/ui.js';
import EnquiryForm from '../src/components/EnquiryForm';
import MembershipModal from '../src/components/MembershipModal';
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';
import { loadAppsScript, makeBook, headersFor } from './helpers/appsScript.js';
import { cleanup } from '@testing-library/react';

/**
 * The agreement between the site and the spreadsheet.
 *
 * The site posts an object keyed by column name. Nothing enforces that those
 * names are the ones the script has columns for: a key with no column is
 * accepted, written nowhere, and lost in silence. That is not a hypothetical.
 * The live membership tab ended up with two columns for the same thing because
 * "Primary Performance Vehicle (Optional)" and "Primary Performance Vehicle"
 * were compared as raw strings and judged different.
 *
 * So rather than compare two hardcoded lists, these tests drive the real forms
 * to see what they actually send, and check it against the real headers in
 * Code.gs, through the real matching function the script uses to decide.
 */

let normaliseHeader;
let sent;

const collect = async (form) => {
  const calls = stubEndpoint();
  const user = setupUser();

  if (form === 'enquiry') {
    render(<EnquiryForm source="Navbar" />);
    await user.type(screen.getByPlaceholderText('Your name'), 'Ravi Menon');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ravi@example.com');
    await user.type(screen.getByPlaceholderText('+91 90000 00000'), '+91 90000 00000');
    await user.type(screen.getByPlaceholderText(/Tell us dates/), 'A weekend.');
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }));
  } else {
    render(<MembershipModal isOpen source="Navbar" onClose={() => {}} />);
    await user.type(screen.getByPlaceholderText('Your name'), 'Ayesha Khan');
    await user.type(screen.getByPlaceholderText('+91 90000 00000'), '+91 98888 88888');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ayesha@example.com');
    await user.type(screen.getByPlaceholderText(/Make, Model/), 'Porsche 911 GT3');
    await user.type(screen.getByPlaceholderText(/Member referral code/), 'REF-9');
    await user.click(screen.getByRole('button', { name: /Submit Request/i }));
  }

  await waitFor(() => expect(calls).toHaveLength(1));
  const payload = calls[0].payload;
  cleanup();
  return { form: payload.form, fields: fieldsOf(calls) };
};

beforeAll(async () => {
  normaliseHeader = loadAppsScript(makeBook()).api.normaliseHeader;
  sent = {
    enquiry: await collect('enquiry'),
    membership: await collect('membership'),
  };
}, 30000);

describe.each(['enquiry', 'membership'])('the %s form', (form) => {
  it('posts under the name the script routes on', () => {
    expect(sent[form].form).toBe(form);
  });

  it('sends nothing the sheet has no column for', () => {
    const columns = headersFor(form).map(normaliseHeader);
    const orphans = Object.keys(sent[form].fields).filter(
      (key) => !columns.includes(normaliseHeader(key))
    );

    expect(orphans, 'a field with no column is written nowhere and lost').toEqual([]);
  });

  it('fills every column the script declares, apart from the timestamp', () => {
    const keys = Object.keys(sent[form].fields).map(normaliseHeader);
    const unfilled = headersFor(form).filter(
      (header) =>
        normaliseHeader(header) !== 'timestamp' && !keys.includes(normaliseHeader(header))
    );

    expect(unfilled, 'a column nothing writes to is a column of blanks').toEqual([]);
  });

  it('sends each key exactly once, with no two collapsing onto one column', () => {
    // Two keys that normalise the same would race for one cell, and which one
    // won would depend on object key order.
    const normalised = Object.keys(sent[form].fields).map(normaliseHeader);

    expect(new Set(normalised).size).toBe(normalised.length);
  });

  it('declares each column exactly once', () => {
    const normalised = headersFor(form).map(normaliseHeader);

    expect(new Set(normalised).size).toBe(normalised.length);
  });

  it('reaches the sheet with every value under the header it was meant for', () => {
    // The whole path in one assertion: what the form sent, written by the
    // real script, read back by column name.
    const book = makeBook();
    const env = loadAppsScript(book);
    const result = env.post(form, sent[form].fields);
    const tab = book.tab(result.sheet);
    const row = tab.records()[0];

    expect(result.ok).toBe(true);
    for (const [key, value] of Object.entries(sent[form].fields)) {
      expect(row[key], `column "${key}"`).toBe(value);
    }
  });
});

describe('the context the transport adds', () => {
  it.each(['enquiry', 'membership'])('is recorded by the %s tab', (form) => {
    const columns = headersFor(form).map(normaliseHeader);

    for (const key of ['Submitted From', 'Referrer']) {
      expect(sent[form].fields, `${key} should be sent`).toHaveProperty(key);
      expect(columns, `${key} needs a column`).toContain(normaliseHeader(key));
    }
  });

  it.each(['enquiry', 'membership'])('records which button opened the %s form', (form) => {
    expect(sent[form].fields['Opened Via']).toBe('Navbar');
    expect(headersFor(form).map(normaliseHeader)).toContain(normaliseHeader('Opened Via'));
  });
});

describe('the two forms stay distinguishable', () => {
  it('writes to different tabs', () => {
    const book = makeBook();
    const env = loadAppsScript(book);

    expect(env.post('enquiry', sent.enquiry.fields).sheet).not.toBe(
      env.post('membership', sent.membership.fields).sheet
    );
  });

  it('asks the enquiry form for an intent and the membership form for a vehicle', () => {
    expect(sent.enquiry.fields).toHaveProperty('Enquiry Type');
    expect(sent.enquiry.fields).not.toHaveProperty('Primary Performance Vehicle');
    expect(sent.membership.fields).toHaveProperty('Primary Performance Vehicle');
    expect(sent.membership.fields).not.toHaveProperty('Enquiry Type');
  });

  it('agrees on the fields they do share', () => {
    const shared = ['Full Name', 'Email Address', 'Phone/WhatsApp', 'Opened Via'];

    for (const key of shared) {
      expect(sent.enquiry.fields, `enquiry ${key}`).toHaveProperty(key);
      expect(sent.membership.fields, `membership ${key}`).toHaveProperty(key);
    }
  });
});
