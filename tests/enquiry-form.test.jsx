import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from './helpers/ui.js';
import EnquiryForm from '../src/components/EnquiryForm';
import { ENQUIRY } from '../src/data/home';
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';
import { headersFor } from './helpers/appsScript.js';

/**
 * The enquiry form, driven the way a visitor drives it.
 *
 * It is rendered in two frames, the contact popover and the Enquiry section on
 * the Business page, so these tests use it bare. What the frames add is
 * covered in entry-points.test.js.
 */

const fill = async (user, { name = 'Ravi Menon', email = 'ravi@example.com', phone = '+91 90000 00000', message = 'A weekend in October.' } = {}) => {
  const fields = screen.getAllByRole('textbox');
  await user.type(screen.getByPlaceholderText('Your name'), name);
  await user.type(screen.getByPlaceholderText('your@email.com'), email);
  await user.type(screen.getByPlaceholderText('+91 90000 00000'), phone);
  if (message) await user.type(screen.getByPlaceholderText(/Tell us dates/), message);
  return fields;
};

const submit = (user) => user.click(screen.getByRole('button', { name: /Send Enquiry/i }));

describe('the fields it offers', () => {
  it('asks for a name, an email, a phone and what they have in mind', () => {
    render(<EnquiryForm />);

    expect(screen.getByPlaceholderText('Your name')).toBeTruthy();
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('+91 90000 00000')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Tell us dates/)).toBeTruthy();
  });

  it('marks the three it will not submit without as required', () => {
    render(<EnquiryForm />);

    expect(screen.getByPlaceholderText('Your name').required).toBe(true);
    expect(screen.getByPlaceholderText('your@email.com').required).toBe(true);
    expect(screen.getByPlaceholderText('+91 90000 00000').required).toBe(true);
    expect(screen.getByPlaceholderText(/Tell us dates/).required).toBe(false);
  });

  it('offers one toggle per enquiry type', () => {
    render(<EnquiryForm />);

    for (const toggle of ENQUIRY.toggles) {
      expect(screen.getByRole('button', { name: toggle })).toBeTruthy();
    }
  });

  it('uses the right input types, so a phone keypad appears on a phone', () => {
    render(<EnquiryForm />);

    expect(screen.getByPlaceholderText('your@email.com').type).toBe('email');
    expect(screen.getByPlaceholderText('+91 90000 00000').type).toBe('tel');
  });
});

describe('what it submits', () => {
  it('sends exactly the keys the Enquiry tab has columns for', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm source="Navbar" />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));

    // Timestamp is stamped by the server; the other two are added by the
    // transport. Everything else must come from this form.
    const expected = headersFor('enquiry').filter(
      (h) => !['Timestamp', 'Submitted From', 'Referrer'].includes(h)
    );
    expect(Object.keys(fieldsOf(calls))).toEqual(
      expect.arrayContaining(expected)
    );
  });

  it('routes to the enquiry form, not the membership one', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls[0].payload.form).toBe('enquiry'));
  });

  it('sends what the visitor typed', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user, { name: 'Priya Nair', email: 'priya@example.com', phone: '+91 97777 77777', message: 'A launch for 60.' });
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)).toMatchObject({
      'Full Name': 'Priya Nair',
      'Email Address': 'priya@example.com',
      'Phone/WhatsApp': '+91 97777 77777',
      'What you have in mind': 'A launch for 60.',
    });
  });

  it('records which call to action opened it', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm source="Club · The house" />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Opened Via']).toBe('Club · The house'));
  });

  it('sends an empty source rather than undefined when opened without one', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)['Opened Via']).toBe('');
  });

  it('sends a message that was left blank as blank', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user, { message: '' });
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)['What you have in mind']).toBe('');
  });
});

describe('the enquiry type', () => {
  it('defaults to Drive', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Enquiry Type']).toBe('Drive'));
  });

  it.each(ENQUIRY.toggles)('can be preselected as %s by the caller', async (type) => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm initialType={type} />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Enquiry Type']).toBe(type));
  });

  it.each(ENQUIRY.toggles)('can be changed to %s by the visitor', async (type) => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm initialType="Drive" />);

    await user.click(screen.getByRole('button', { name: type }));
    await fill(user);
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Enquiry Type']).toBe(type));
  });
});

describe('when it will not submit', () => {
  it('does nothing on a name of only spaces', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user, { name: '   ' });
    await submit(user);

    expect(calls).toHaveLength(0);
    expect(screen.queryByText(/Enquiry Received/i)).toBeNull();
  });

  it('does nothing on a phone of only spaces', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(<EnquiryForm />);

    await fill(user, { phone: '  ' });
    await submit(user);

    expect(calls).toHaveLength(0);
  });
});

describe('after it is sent', () => {
  it('confirms rather than leaving the visitor guessing', async () => {
    const user = setupUser();
    stubEndpoint();
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    expect(await screen.findByText(/Enquiry Received/i)).toBeTruthy();
  });

  it('offers a way to send another, which clears the fields', async () => {
    const user = setupUser();
    stubEndpoint();
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);
    await screen.findByText(/Enquiry Received/i);

    await user.click(screen.getByRole('button', { name: /Send another message/i }));

    expect(screen.getByPlaceholderText('Your name').value).toBe('');
    expect(screen.getByPlaceholderText('your@email.com').value).toBe('');
  });
});

describe('when the server refuses', () => {
  it('says so instead of claiming it was received', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/Enquiry Received/i)).toBeNull();
  });

  it('keeps what the visitor typed, so it is not asked for twice', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    render(<EnquiryForm />);

    await fill(user, { name: 'Ravi Menon' });
    await submit(user);
    await screen.findByRole('alert');

    expect(screen.getByPlaceholderText('Your name').value).toBe('Ravi Menon');
    expect(screen.getByPlaceholderText(/Tell us dates/).value).toBe('A weekend in October.');
  });

  it('offers the email address as a way round', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);

    expect((await screen.findByRole('alert')).textContent).toContain(ENQUIRY.email);
  });

  it('lets the visitor try again', async () => {
    const user = setupUser();
    const calls = stubEndpoint({ status: 500 });
    render(<EnquiryForm />);

    await fill(user);
    await submit(user);
    await screen.findByRole('alert');
    await submit(user);

    await waitFor(() => expect(calls.length).toBeGreaterThan(1));
  });
});
