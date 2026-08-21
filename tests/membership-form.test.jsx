import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from './helpers/ui.js';
import MembershipModal from '../src/components/MembershipModal';
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';
import { headersFor } from './helpers/appsScript.js';

/**
 * The club membership request.
 *
 * A separate form from the enquiry one, on separate stock, writing to a
 * separate tab, and asking for two things the enquiry form does not. It is
 * reached from five places; which of them opened it is checked in
 * entry-points.test.js.
 */

const open = (props = {}) =>
  render(<MembershipModal isOpen onClose={() => {}} {...props} />);

const fill = async (
  user,
  {
    name = 'Ayesha Khan',
    phone = '+91 98888 88888',
    email = 'ayesha@example.com',
    vehicle = 'Porsche 911 GT3, 2023',
    code = 'REF-9',
  } = {}
) => {
  await user.type(screen.getByPlaceholderText('Your name'), name);
  await user.type(screen.getByPlaceholderText('+91 90000 00000'), phone);
  await user.type(screen.getByPlaceholderText('your@email.com'), email);
  if (vehicle) await user.type(screen.getByPlaceholderText(/Make, Model/), vehicle);
  if (code) await user.type(screen.getByPlaceholderText(/Member referral code/), code);
};

const submit = (user) => user.click(screen.getByRole('button', { name: /Submit Request/i }));

describe('the panel', () => {
  it('stays out of the way until it is opened', () => {
    render(<MembershipModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByPlaceholderText('Your name')).toBeNull();
  });

  it('asks for the five things the club needs', () => {
    open();

    expect(screen.getByPlaceholderText('Your name')).toBeTruthy();
    expect(screen.getByPlaceholderText('+91 90000 00000')).toBeTruthy();
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Make, Model/)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Member referral code/)).toBeTruthy();
  });

  it('requires the three it cannot follow up without, and no more', () => {
    open();

    expect(screen.getByPlaceholderText('Your name').required).toBe(true);
    expect(screen.getByPlaceholderText('+91 90000 00000').required).toBe(true);
    expect(screen.getByPlaceholderText('your@email.com').required).toBe(true);
    expect(screen.getByPlaceholderText(/Make, Model/).required).toBe(false);
    expect(screen.getByPlaceholderText(/Member referral code/).required).toBe(false);
  });

  it('can be closed', async () => {
    const user = setupUser();
    const onClose = vi.fn();
    render(<MembershipModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Close modal/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('what it submits', () => {
  it('routes to the membership tab, not the enquiry one', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls[0].payload.form).toBe('membership'));
  });

  it('sends exactly the keys that tab has columns for', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open({ source: 'Navbar' });

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    const expected = headersFor('membership').filter(
      (h) => !['Timestamp', 'Submitted From', 'Referrer'].includes(h)
    );
    expect(Object.keys(fieldsOf(calls))).toEqual(expect.arrayContaining(expected));
  });

  it('sends what the applicant typed', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user);
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)).toMatchObject({
      'Full Name': 'Ayesha Khan',
      'Phone/WhatsApp': '+91 98888 88888',
      'Email Address': 'ayesha@example.com',
      'Primary Performance Vehicle': 'Porsche 911 GT3, 2023',
      'Invitation Code / Referral': 'REF-9',
    });
  });

  it('sends the optional fields as blank when they are left alone', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user, { vehicle: '', code: '' });
    await submit(user);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)['Primary Performance Vehicle']).toBe('');
    expect(fieldsOf(calls)['Invitation Code / Referral']).toBe('');
  });

  it('records which call to action opened it', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open({ source: 'Club · Final scene' });

    await fill(user);
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Opened Via']).toBe('Club · Final scene'));
  });

  it('keeps a phone number exactly as typed, plus and all', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user, { phone: '+91 00000 00000' });
    await submit(user);

    await waitFor(() => expect(fieldsOf(calls)['Phone/WhatsApp']).toBe('+91 00000 00000'));
  });
});

describe('when it will not submit', () => {
  it('does nothing on a name of only spaces', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user, { name: '  ' });
    await submit(user);

    expect(calls).toHaveLength(0);
  });

  it('does nothing on an email of only spaces', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    open();

    await fill(user, { email: '  ' });
    await submit(user);

    expect(calls).toHaveLength(0);
  });
});

describe('after it is sent', () => {
  it('confirms the request was made', async () => {
    const user = setupUser();
    stubEndpoint();
    open();

    await fill(user);
    await submit(user);

    expect(await screen.findByText(/Invitation Requested/i)).toBeTruthy();
  });

  it('does not still show the form underneath the confirmation', async () => {
    const user = setupUser();
    stubEndpoint();
    open();

    await fill(user);
    await submit(user);
    await screen.findByText(/Invitation Requested/i);

    expect(screen.queryByPlaceholderText('Your name')).toBeNull();
  });
});

describe('when the server refuses', () => {
  it('says so rather than confirming a request that was not made', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    open();

    await fill(user);
    await submit(user);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/Invitation Requested/i)).toBeNull();
  });

  it('keeps the answers so they are not asked for twice', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    open();

    await fill(user);
    await submit(user);
    await screen.findByRole('alert');

    expect(screen.getByPlaceholderText('Your name').value).toBe('Ayesha Khan');
    expect(screen.getByPlaceholderText(/Make, Model/).value).toBe('Porsche 911 GT3, 2023');
  });

  it('offers the club address as a way round', async () => {
    const user = setupUser();
    stubEndpoint({ status: 500 });
    open();

    await fill(user);
    await submit(user);

    expect((await screen.findByRole('alert')).textContent).toMatch(/club\.one@marque\.one/);
  });
});
