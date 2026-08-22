// ─── The scroll lock ──────────────────────────────────────────────────────
//
// One counted lock that holds the page still while something covers it.
//
// Four things on this site cover the screen: the site intro, the club intro,
// the contact form and the membership one. Each of them used to set
// `document.body.style.overflow = 'hidden'` and, on the way out, put back
// whatever it had found there. Two problems came of that.
//
// The first is that the membership panel never did it at all, so the club's
// own application form sat over a page that went on scrolling behind it.
//
// The second is that saving and restoring one global works only while a
// single owner has it. The club intro locks on entering /club and unlocks
// when its animation ends; a visitor who presses "Request membership" during
// those three seconds is holding the page with the panel while the intro's
// timer is still counting down to a restore. The intro then hands back the
// empty string it captured before it ever locked, and the page underneath the
// open form starts scrolling. A count of holders is the fix: the ground is
// only given back when the last of them lets go.
//
// A hold is taken and released through the function `holdScroll` returns,
// rather than through a matching `unlock` call, because both intros release
// twice: once when their animation finishes, and again if the component ever
// unmounts. They stay mounted and render null when they are done, so neither
// release can be dropped, and against a plain counter the second one would
// take the page back from whoever else was holding it. Releasing a hold that
// is already released does nothing.
//
// The other half is that overflow:hidden on the body is not a lock on iOS.
// Safari there keeps scrolling the page, and rubber-banding it, whatever the
// body's overflow says. Pinning the body with position:fixed does hold, at
// the cost of the page jumping to the top the moment it is pinned, so the
// offset the reader was at is written into `top` and scrolled back on release.

let holders = 0;
let restore = null;

/**
 * Hold the page still until the returned function is called.
 *
 *     useEffect(() => holdScroll(), []);
 *
 * @returns {() => void} releases this hold, and is safe to call more than once
 */
export function holdScroll() {
  take();

  let held = true;
  return function release() {
    if (!held) return;
    held = false;
    give();
  };
}

function take() {
  holders += 1;
  if (holders > 1) return;

  const { body } = document;
  const y = window.scrollY ?? window.pageYOffset ?? 0;

  const previous = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    paddingRight: body.style.paddingRight,
  };

  // Pinning the body takes the scrollbar away with it, and on a desktop that
  // is a few pixels of the page sliding sideways as the panel opens. Holding
  // the gutter open keeps the page where it was.
  const gutter = window.innerWidth - document.documentElement.clientWidth;

  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${y}px`;
  body.style.left = '0';
  body.style.right = '0';
  if (gutter > 0) {
    const existing = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${existing + gutter}px`;
  }

  restore = () => {
    Object.assign(body.style, previous);
    // Assigning '' to every property can leave an empty style attribute
    // behind, which is noise in the inspector on every page of the site.
    if (body.getAttribute('style') === '') body.removeAttribute('style');

    // index.html sets `scroll-smooth` on the root, so every programmatic
    // scroll on this site is animated — including this one, which is not a
    // journey but a correction. Left smooth, closing a panel sends the page
    // sailing from the top back to where the reader was over a full second.
    // Put back instantly and the panel simply lifts off the page it covered.
    const root = document.documentElement;
    const behaviour = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = behaviour;
  };
}

function give() {
  holders -= 1;
  if (holders > 0) return;

  restore?.();
  restore = null;
}
