import { describe, it, expect, beforeEach, vi } from 'vitest';
import { holdScroll } from '../src/lib/scrollLock.js';

/**
 * The lock that holds the page still behind a panel.
 *
 * Four things on this site cover the screen and want the page underneath to
 * stop moving: the site intro, the club intro, the contact form and the
 * membership one. Each of them used to reach for document.body.style.overflow
 * on its own and put back whatever it found there, which is why this is one
 * counted lock and not four.
 */

const setScroll = (y) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true });
};

let held = [];
const hold = () => {
  const release = holdScroll();
  held.push(release);
  return release;
};

beforeEach(() => {
  // Whatever the last test left holding, so this one starts on an open page.
  held.forEach((release) => release());
  held = [];
  setScroll(0);
  document.body.removeAttribute('style');
});

describe('holding the page', () => {
  it('stops it scrolling', () => {
    hold();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('pins the body rather than trusting overflow alone', () => {
    // Safari on iOS goes on scrolling a body that is only overflow:hidden.
    // Position fixed is the part that actually holds on a phone.
    hold();

    expect(document.body.style.position).toBe('fixed');
  });

  it('holds the page at the place the reader was looking', () => {
    setScroll(1240);

    hold();

    expect(document.body.style.top).toBe('-1240px');
  });

  it('puts the reader back where they were when it lets go', () => {
    setScroll(1240);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    hold()();

    expect(scrollTo).toHaveBeenCalledWith(0, 1240);
    scrollTo.mockRestore();
  });

  it('leaves no trace on the body once it lets go', () => {
    hold()();

    expect(document.body.getAttribute('style')).toBeNull();
  });
});

describe('two holders at once', () => {
  it('stays locked when the first of them lets go', () => {
    const first = hold();
    hold();

    first();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('releases when the last of them lets go', () => {
    const first = hold();
    const second = hold();

    first();
    second();

    expect(document.body.style.overflow).toBe('');
  });

  it('does not restore a page position captured while already locked', () => {
    setScroll(900);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const first = hold();
    // The body is pinned now, so anything read here is not where the reader was.
    setScroll(0);
    const second = hold();
    first();
    second();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 900);
    scrollTo.mockRestore();
  });
});

describe('a hold released twice', () => {
  it('is only released once, and does not free a page someone else holds', () => {
    // Both intros do exactly this: they release when their animation ends,
    // and again if they are ever unmounted.
    const intro = hold();
    const panel = hold();

    intro();
    intro();

    expect(document.body.style.overflow).toBe('hidden');

    panel();

    expect(document.body.style.overflow).toBe('');
  });
});
