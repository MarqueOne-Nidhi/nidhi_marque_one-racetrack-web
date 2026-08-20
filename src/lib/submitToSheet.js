import { GOOGLE_SHEET_SCRIPT_URL } from '../config';

/**
 * ─── Form intake ──────────────────────────────────────────────────────────
 *
 * Every form on the site posts through here. `form` selects the tab at the
 * other end; see docs/apps-script/Code.gs, which holds the column order for
 * each and must agree with the field names used below.
 *
 * Sent as JSON with a text/plain content type. That combination looks odd and
 * is the point: text/plain is one of the three "simple" content types, so the
 * browser sends it without a CORS preflight. Apps Script cannot answer a
 * preflight OPTIONS request, so application/json would be rejected before the
 * request was ever made.
 *
 * The previous version posted with `mode: 'no-cors'`, which does deliver, but
 * makes the response opaque: there is no status, no body, and no way to tell a
 * successful write from a 500 or a deleted deployment. It always reported
 * success, so a broken endpoint would have looked exactly like a working one
 * while every enquiry was lost. This reads the reply and says what happened,
 * falling back to a blind no-cors post only if the readable one cannot be made
 * at all.
 *
 * @param {string} form                     'membership' | 'enquiry'
 * @param {Record<string, string>} fields   keyed by the sheet's column names
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function submitToSheet(form, fields) {
  if (!GOOGLE_SHEET_SCRIPT_URL) {
    return { ok: false, error: 'No submission endpoint is configured.' };
  }

  const browser = typeof window === 'undefined' ? null : window;

  const payload = {
    form,
    fields: {
      ...fields,
      // The two things the form cannot ask for and no caller should have to
      // remember. The third piece of context, `Opened Via`, is passed in by
      // the caller instead: only the button that was pressed knows which
      // button it was, and neither of these does.
      'Submitted From': browser ? browser.location.href : '',
      // Where they were before they arrived. Blank for a direct visit, a
      // typed URL, or a link sent with a referrer policy that strips it, so
      // an empty cell here means unknown rather than none.
      Referrer: browser ? browser.document.referrer : '',
    },
  };

  try {
    const response = await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      // Apps Script answers a POST with a 302 to a googleusercontent URL that
      // carries the CORS header; fetch follows it for us.
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { ok: false, error: `The server replied ${response.status}.` };
    }

    const result = await response.json().catch(() => null);
    if (result && result.ok === false) {
      return { ok: false, error: result.error || 'The server rejected it.' };
    }

    return { ok: true };
  } catch (err) {
    // Reaching here usually means CORS blocked the read, not that the write
    // failed. Repost blind so the submission is not lost, then say plainly
    // that it could not be confirmed rather than claiming success.
    console.warn('Readable submission failed, retrying blind:', err);
    try {
      await fetch(GOOGLE_SHEET_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return { ok: true, unconfirmed: true };
    } catch (fallbackErr) {
      console.warn('Blind submission failed too:', fallbackErr);
      return { ok: false, error: 'Could not reach the server.' };
    }
  }
}
