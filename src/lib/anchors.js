// ─── Anchors ──────────────────────────────────────────────────────────────
//
// Section links behave like links and leave nothing behind in the address
// bar.
//
// The menu points at sections, not only at pages, and a section link used to
// be a plain `<Link to="/#circuit">`. That works, but the fragment then sits
// in the address bar for the rest of the visit: the reader scrolls on and the
// URL still says `#circuit`, which is both untidy and a lie, since it names
// wherever they happened to enter the page rather than where they are. Worse,
// a reload or a shared link then reopens somewhere in the middle.
//
// So the fragment is treated as an instruction rather than as state. A click
// scrolls; the address bar keeps the page. A fragment that arrives from
// outside is still honoured, and then cleared once it has been acted on, so
// a pasted `/#circuit` lands in the right place and the address bar settles
// back to `/`.
//
// The href is left intact on the element itself, so the link is still a link:
// the status bar shows the target, and ctrl-click or middle-click opens the
// fragment in a new tab, where honouring it is exactly right.

/** Height of the fixed bar, which a section scrolled to the top would sit under. */
export const NAV_HEIGHT = 76;

/** `/business#enquiry` → `{ pathname: '/business', id: 'enquiry' }`. */
export function splitTarget(to) {
  const [pathname, id = ''] = String(to ?? '').split('#');
  return { pathname: pathname || '/', id };
}

/**
 * True for a click the browser should be left to handle itself: a new tab, a
 * new window, a download, a middle click, or one something else has already
 * claimed. Intercepting these is the usual way a single-page app breaks
 * open-in-new-tab.
 */
export function isModifiedClick(event) {
  return Boolean(
    event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
  );
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * How long to keep trying before giving up on a section, counted in animation
 * frames rather than in milliseconds.
 *
 * Frames, because a browser suspends requestAnimationFrame in a background
 * tab. A link opened in a background tab and read a minute later would blow
 * any wall-clock budget while sitting on a page that had never had a chance
 * to lay itself out; a frame count only advances while someone is looking.
 * At sixty a second this is about eight seconds of watching.
 */
const SETTLE_FRAMES = 480;

/**
 * Put a section under the bar rather than under the top of the window.
 *
 * On a cross-page jump the target is usually not painted on the frame the
 * navigation completes, so this waits for it rather than firing once at a
 * page that has not been built yet.
 *
 * The fragment is cleared here, once the scroll has been issued, rather than
 * when the click was handled: it is an instruction, and it stops being true
 * the moment it has been carried out.
 *
 * Returns a cancel function, which is what an effect wants back.
 */
export function scrollToId(id, { frames = SETTLE_FRAMES } = {}) {
  let frame;
  let waited = 0;

  const step = () => {
    const el = document.getElementById(id);

    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
      stripHash();
      return;
    }

    if (waited++ < frames) frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * Take the fragment off the address bar without telling the router.
 *
 * Deliberately `history.replaceState` rather than a `navigate(..., { replace:
 * true })`: a router navigation would be a new location, the effect that
 * called this would run again on it, and it would find no fragment and scroll
 * the reader back to the top of the page they had just been sent into.
 */
export function stripHash() {
  if (!window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', pathname + search);
}
