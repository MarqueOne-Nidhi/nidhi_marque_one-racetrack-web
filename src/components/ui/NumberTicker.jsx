import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

/**
 * A figure that counts up to itself when the reader reaches it.
 *
 * Two things here are less obvious than they look.
 *
 * The observer is inset vertically and not horizontally. `margin: '-50px'`
 * insets all four sides, which is fine for the wait it was meant to buy — a
 * figure should not start counting until it is properly on screen — but on a
 * phone the page gutter is 23px, so a figure at the start of a line sat 27px
 * to the left of the shrunken root and never came into view at all. It never
 * counted, and since the span was empty until the first frame of the spring
 * wrote into it, the figure was simply missing from the page: `5.2 KM LAP`
 * read as `KM LAP`. On a desktop the same gutter is 5vw, which clears the
 * inset, so the circuit lost its lap distance on the small screen only.
 *
 * And the number is printed by the component rather than only by the
 * animation, so that whatever happens to the spring, the figure is on the
 * page. It starts at the figure it counts from, which is what the first frame
 * used to draw anyway, and lands on the exact value rather than on wherever
 * the spring came to rest: overdamped as this one is, the last frame arrives
 * a whisker short, and 1,000 was showing as 999.
 */
const print = (value, decimalPlaces) =>
  Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(value.toFixed(decimalPlaces)));

export default function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className = '',
  decimalPlaces = 0,
  // Overdamped by default, which takes about three seconds to arrive. That
  // reads as deliberate on a headline figure the size of the ones on the wide
  // layout. Where the figure is a label rather than a display — the phone
  // layout of home/Circuit — a stale 998 sitting under `drag strip` reads as
  // a wrong number, so the caller can ask for a quicker one.
  spring = { damping: 40, stiffness: 100 },
}) {
  const ref = useRef(null);
  const from = direction === 'down' ? value : 0;
  const to = direction === 'down' ? 0 : value;
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, spring);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' });

  useEffect(() => {
    if (!isInView) return undefined;

    // A reader who has asked for less motion is shown the figure, not the
    // count. The number is the point; the counting is decoration.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      if (ref.current) ref.current.textContent = print(to, decimalPlaces);
      return undefined;
    }

    const timer = setTimeout(() => motionValue.set(to), delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, to, decimalPlaces]);

  useEffect(() => {
    const stopChange = springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = print(latest, decimalPlaces);
    });
    // The spring rests within a hair of its target rather than on it, so the
    // figure is stated outright once the counting is over.
    const stopComplete = springValue.on('animationComplete', () => {
      if (ref.current) ref.current.textContent = print(to, decimalPlaces);
    });

    return () => {
      stopChange();
      stopComplete();
    };
  }, [springValue, decimalPlaces, to]);

  return (
    <span className={className} ref={ref}>
      {print(from, decimalPlaces)}
    </span>
  );
}
