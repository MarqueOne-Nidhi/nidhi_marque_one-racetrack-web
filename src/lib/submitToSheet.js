// ─── Shared form submission to Google Sheets ───
// Extracted from MembershipModal so the same call serves
// MembershipModal, Enquiry (§14) and Contact page.
import { GOOGLE_SHEET_SCRIPT_URL } from '../config';

/**
 * Submit a key-value data object to the Google Apps Script endpoint.
 * Preserves the existing behaviour exactly:
 *   POST, mode: 'no-cors', application/x-www-form-urlencoded,
 *   failure swallowed to console.warn so the UI always shows success.
 *
 * @param {Record<string, string>} data — form field names → values
 * @returns {Promise<boolean>} — always resolves true (no-cors gives opaque response)
 */
export async function submitToSheet(data) {
  try {
    if (!GOOGLE_SHEET_SCRIPT_URL) return true;

    const body = new URLSearchParams();
    body.append('Timestamp', new Date().toLocaleString());

    for (const [key, value] of Object.entries(data)) {
      body.append(key, value || 'N/A');
    }

    await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    return true;
  } catch (err) {
    console.warn('Google Sheet submission warning:', err);
    return true; // still show success to user
  }
}
