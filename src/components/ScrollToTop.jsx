import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToId } from '../lib/anchors';

/**
 * Decides where a new location starts.
 *
 * Ordinarily at the top: without this, going from the bottom of Home to
 * /about lands the reader mid-page.
 *
 * A section link says otherwise, and says it in the location state rather
 * than in a fragment, so the address bar stays on the page (lib/anchors has
 * the reasoning). A fragment is still read when one arrives from outside, in
 * a pasted or bookmarked link, and is cleared once it has been acted on.
 */
export default function ScrollToTop() {
  const { pathname, hash, key, state } = useLocation();

  useEffect(() => {
    const id = state?.scrollTo || hash.slice(1);

    if (!id) {
      window.scrollTo(0, 0);
      return;
    }

    return scrollToId(id);
    // `key` is in here so that re-clicking the same section link scrolls again.
  }, [pathname, hash, key, state]);

  return null;
}
