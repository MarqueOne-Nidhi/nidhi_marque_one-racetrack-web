import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NumberTicker from '../src/components/ui/NumberTicker';
import { CIRCUIT } from '../src/data/circuit';

/**
 * The counting figures.
 *
 * This is here for one bug. The component used to render an empty span and
 * wait for the first frame of its spring to write the number into it, and the
 * spring only started once an IntersectionObserver said the span was on
 * screen. That observer was inset 50px on all four sides, including the left,
 * and the page gutter on a phone is 23px — so a figure at the start of a line
 * was outside the shrunken root, never came into view, never counted, and was
 * therefore never printed at all. `5.2 KM LAP` read as `KM LAP` on every
 * phone, while every desktop, whose gutter is 5vw, was fine.
 *
 * Nothing here checks the animation. What is checked is that the figure in
 * the data reaches the page, which is the part that failed.
 */

const original = global.IntersectionObserver;

/** An observer that reports whatever the test says, as soon as it is asked. */
const observerReporting = (isIntersecting) =>
  class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {
      this.callback([{ isIntersecting, target, intersectionRatio: isIntersecting ? 1 : 0 }], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

afterEach(() => {
  global.IntersectionObserver = original;
  window.IntersectionObserver = original;
});

const setObserver = (isIntersecting) => {
  const Fake = observerReporting(isIntersecting);
  global.IntersectionObserver = Fake;
  window.IntersectionObserver = Fake;
};

/** The one <span> a ticker renders. */
const figure = (container) => container.querySelector('span');

describe('a figure that has not been scrolled to yet', () => {
  it('is on the page rather than blank', () => {
    setObserver(false);
    const { container } = render(<NumberTicker value={5.2} decimalPlaces={1} />);

    expect(figure(container).textContent).not.toBe('');
  });

  it('shows the figure it counts from, formatted as the figure it counts to', () => {
    setObserver(false);
    const { container } = render(<NumberTicker value={5.2} decimalPlaces={1} />);

    expect(figure(container).textContent).toBe('0.0');
  });

  it('counting down, starts at the value itself', () => {
    setObserver(false);
    const { container } = render(<NumberTicker value={25} direction="down" />);

    expect(figure(container).textContent).toBe('25');
  });
});

describe('a reader who has asked for less motion', () => {
  const reduceMotion = () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
  };

  it('is given the figure outright, not a count', () => {
    reduceMotion();
    setObserver(true);
    const { container } = render(<NumberTicker value={5.2} decimalPlaces={1} />);

    expect(figure(container).textContent).toBe('5.2');
    vi.restoreAllMocks();
  });

  it('gets the thousands separator with it', () => {
    reduceMotion();
    setObserver(true);
    const { container } = render(<NumberTicker value={1000} />);

    expect(figure(container).textContent).toBe('1,000');
    vi.restoreAllMocks();
  });
});

describe('the circuit figures', () => {
  it('every one of them prints something', () => {
    setObserver(false);
    for (const [name, fig] of Object.entries(CIRCUIT)) {
      const { container, unmount } = render(
        <NumberTicker
          value={fig.value}
          decimalPlaces={fig.unit === 'km' && fig.value < 10 ? 1 : 0}
        />
      );

      expect(figure(container).textContent, `${name} is blank`).not.toBe('');
      unmount();
    }
  });
});
