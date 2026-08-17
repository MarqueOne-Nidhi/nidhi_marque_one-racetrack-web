import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NAV_HEIGHT = 76;

/**
 * Resets scroll position on route change.
 * Without this, navigating from the bottom of Home to /about
 * lands the reader mid-page.
 *
 * When the location carries a hash (the Home sub-nav links do),
 * it scrolls to that section instead, offset by the fixed navbar.
 */
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // The target may not be painted yet on a cross-page jump,
    // so retry across a few frames before giving up.
    let frame;
    let attempts = 0;

    const scrollToHash = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
      if (attempts++ < 20) frame = requestAnimationFrame(scrollToHash);
    };

    frame = requestAnimationFrame(scrollToHash);
    return () => cancelAnimationFrame(frame);
    // `key` is included so re-clicking the same section link scrolls again.
  }, [pathname, hash, key]);

  return null;
}
