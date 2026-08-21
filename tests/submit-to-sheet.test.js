import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';
import { submitToSheet } from '../src/lib/submitToSheet.js';
import { GOOGLE_SHEET_SCRIPT_URL } from '../src/config.js';

/**
 * The transport every form on the site posts through.
 *
 * The interesting cases are all failure ones. An earlier version posted with
 * mode: 'no-cors', which delivers but makes the response opaque: no status, no
 * body, no way to tell a successful write from a deleted deployment. It
 * reported success either way, so a broken endpoint looked exactly like a
 * working one while every enquiry was lost.
 */

const FIELDS = { 'Full Name': 'Ravi Menon', 'Email Address': 'ravi@example.com' };

beforeEach(() => {
  // A direct visit has no referrer; individual tests override this.
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
});

describe('what it sends', () => {
  it('posts to the configured endpoint', async () => {
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(GOOGLE_SHEET_SCRIPT_URL);
    expect(calls[0].method).toBe('POST');
  });

  it('sends JSON as text/plain, so the browser skips the preflight', async () => {
    // Apps Script cannot answer a preflight OPTIONS request. text/plain is a
    // "simple" content type, so no preflight is sent. application/json would
    // be rejected before the request was ever made.
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(calls[0].contentType).toBe('text/plain;charset=utf-8');
    expect(() => JSON.parse(calls[0].raw)).not.toThrow();
  });

  it('follows the redirect Apps Script answers a POST with', async () => {
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(calls[0].redirect).toBe('follow');
  });

  it('names the form so the script knows which tab to write to', async () => {
    const calls = stubEndpoint();
    await submitToSheet('membership', FIELDS);

    expect(calls[0].payload.form).toBe('membership');
  });

  it('passes the caller fields through untouched', async () => {
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(fieldsOf(calls)).toMatchObject(FIELDS);
  });

  it('adds the page the form was submitted from', async () => {
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(fieldsOf(calls)['Submitted From']).toBe(window.location.href);
  });

  it('adds the referrer when there is one', async () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://www.instagram.com/',
    });
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(fieldsOf(calls).Referrer).toBe('https://www.instagram.com/');
  });

  it('sends an empty referrer rather than omitting it on a direct visit', async () => {
    // Blank means unknown, not none: a direct visit, a typed URL and a
    // stripped referrer all look the same from here.
    const calls = stubEndpoint();
    await submitToSheet('enquiry', FIELDS);

    expect(fieldsOf(calls)).toHaveProperty('Referrer', '');
  });

  it('does not let a caller field be overwritten by the two it adds', async () => {
    const calls = stubEndpoint();
    await submitToSheet('enquiry', { ...FIELDS, 'Opened Via': 'Navbar' });

    expect(fieldsOf(calls)['Opened Via']).toBe('Navbar');
  });
});

describe('what it reports back', () => {
  it('succeeds on a 200', async () => {
    stubEndpoint({ body: '{"ok":true,"row":2,"notified":true}' });
    await expect(submitToSheet('enquiry', FIELDS)).resolves.toEqual({ ok: true });
  });

  it('reports the status when the server refuses', async () => {
    stubEndpoint({ status: 500, body: 'boom' });
    const result = await submitToSheet('enquiry', FIELDS);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it('surfaces an error the script itself reports', async () => {
    stubEndpoint({ body: '{"ok":false,"error":"Unknown form: newsletter"}' });
    const result = await submitToSheet('newsletter', FIELDS);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Unknown form: newsletter');
  });

  it('still succeeds when the reply is not JSON at all', async () => {
    // A write that worked is a write that worked, even if the body is odd.
    stubEndpoint({ body: '<html>redirected</html>' });
    await expect(submitToSheet('enquiry', FIELDS)).resolves.toEqual({ ok: true });
  });

  it('does not claim success when the write is unconfirmed', async () => {
    const calls = stubEndpoint({ throws: new TypeError('Failed to fetch') });
    const result = await submitToSheet('enquiry', FIELDS);

    expect(calls).toHaveLength(2);
    expect(result).toMatchObject({ ok: true, unconfirmed: true });
  });

  it('reposts blind rather than losing the submission when the read is blocked', async () => {
    const calls = stubEndpoint({ throws: new TypeError('Failed to fetch') });
    await submitToSheet('enquiry', FIELDS);

    expect(calls[1].mode).toBe('no-cors');
    expect(calls[1].payload).toEqual(calls[0].payload);
  });

  it('gives up honestly when even the blind repost fails', async () => {
    stubEndpoint({
      throws: new TypeError('Failed to fetch'),
      thenThrows: new TypeError('Failed to fetch'),
    });
    const result = await submitToSheet('enquiry', FIELDS);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Could not reach/);
  });
});

describe('with no endpoint configured', () => {
  it('refuses without touching the network', async () => {
    vi.resetModules();
    vi.doMock('../src/config.js', () => ({ GOOGLE_SHEET_SCRIPT_URL: '' }));
    const { submitToSheet: unconfigured } = await import('../src/lib/submitToSheet.js');

    const calls = stubEndpoint();
    const result = await unconfigured('enquiry', FIELDS);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No submission endpoint/);
    expect(calls).toHaveLength(0);

    vi.doUnmock('../src/config.js');
    vi.resetModules();
  });
});
