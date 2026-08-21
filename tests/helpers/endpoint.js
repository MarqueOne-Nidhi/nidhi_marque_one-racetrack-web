import { vi } from 'vitest';

/**
 * Replaces `fetch` for one test and records what the site tried to send.
 *
 * Returns the recorder rather than the mock, because what the tests care
 * about is the payload: which form, which fields, which content type. See
 * tests/setup.js for why an unstubbed fetch throws.
 *
 * @param {object} [options]
 * @param {number} [options.status]  HTTP status to answer with
 * @param {string} [options.body]    response body
 * @param {Error}  [options.throws]  throw instead of answering, which is what
 *                                   a CORS failure looks like from fetch
 * @param {Error}  [options.thenThrows] throw only on the second call, which is
 *                                   the blind no-cors retry
 */
export function stubEndpoint({ status = 200, body = '{"ok":true}', throws, thenThrows } = {}) {
  const calls = [];

  global.fetch = vi.fn(async (url, options = {}) => {
    const record = {
      url: String(url),
      method: options.method,
      mode: options.mode,
      redirect: options.redirect,
      contentType: options.headers && options.headers['Content-Type'],
      raw: options.body,
    };
    try {
      record.payload = JSON.parse(options.body);
    } catch {
      record.payload = null;
    }
    calls.push(record);

    if (throws && calls.length === 1) throw throws;
    if (thenThrows && calls.length === 2) throw thenThrows;
    return new Response(body, { status });
  });

  return calls;
}

/** The fields of the nth submission, defaulting to the first. */
export const fieldsOf = (calls, n = 0) => calls[n].payload.fields;
