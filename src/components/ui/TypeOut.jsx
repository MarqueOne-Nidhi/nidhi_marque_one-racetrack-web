import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Text that types itself in, with a caret that keeps blinking after it stops.
 *
 * ── Why it does not tick ─────────────────────────────────────────────────
 * A constant interval does not read as typing, it reads as a teleprinter.
 * Nobody hits keys on a metronome. Three things break the grid:
 *
 *   jitter     every keystroke lands somewhere in a window around the base
 *              rate rather than exactly on it
 *   dwell      a full stop is held far longer than a letter, because an
 *              ellipsis is a pause; a space is held a little longer, because
 *              that is where a hand actually hesitates
 *   run-in     the first few characters are slower, the way a hand settles
 *              before it gets going
 *
 * ── Why it replays ───────────────────────────────────────────────────────
 * It types whenever it comes into view, not once per page load. A visitor
 * scrolling back to a section expects to see the thing that made it worth
 * scrolling back to. It resets when the section leaves, so the next arrival
 * starts from nothing rather than from a finished line.
 *
 * ── Accessibility ────────────────────────────────────────────────────────
 * The animation is hidden from assistive technology and the whole string is
 * exposed on the wrapper, so a screen reader hears the line once rather than
 * a growing fragment on every keystroke. Under reduced motion it renders the
 * finished text and never runs at all.
 */

// Multipliers on the base rate, keyed by the character just typed.
const DWELL = { '.': 3.2, '…': 3.2, ',': 2.2, '?': 3, '!': 3, ' ': 1.45 };

// How far a keystroke may drift either side of the base rate.
const JITTER = 0.45;

// The first few characters are slower, easing into the rate rather than
// starting at it.
const RUN_IN = 4;

export default function TypeOut({
  text,
  className = '',
  speed = 78,
  startDelay = 320,
  caret = true,
  caretClassName = '',
}) {
  const ref = useRef(null);
  // No `once`. Leaving the section resets it so the next arrival retypes.
  const inView = useInView(ref, { margin: '-12% 0px -12% 0px' });
  const reduce = useReducedMotion();

  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  useEffect(() => {
    if (reduce) {
      setShown(text.length);
      return undefined;
    }

    if (!inView) {
      // Back to nothing, ready to type again on the way past next time.
      setShown(0);
      return undefined;
    }

    let timer;
    let cancelled = false;

    const delayAfter = (index) => {
      // The character just typed decides the wait, so a pause lands after the
      // mark rather than before it.
      const previous = text.charAt(index - 1);
      const dwell = DWELL[previous] || 1;
      const easing = index <= RUN_IN ? 1 + (RUN_IN - index) * 0.28 : 1;
      const jitter = 1 - JITTER + Math.random() * JITTER * 2;
      return speed * dwell * easing * jitter;
    };

    const step = (index) => {
      if (cancelled) return;
      setShown(index);
      if (index >= text.length) return;
      timer = setTimeout(() => step(index + 1), index === 0 ? startDelay : delayAfter(index));
    };

    step(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inView, reduce, text, speed, startDelay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {caret && (
        <span
          aria-hidden="true"
          className={`inline-block w-[0.06em] align-baseline ${caretClassName}`}
          style={{
            // Sized to the text beside it rather than to a fixed pixel height,
            // so it stays a caret at every clamp() step.
            height: '0.85em',
            backgroundColor: 'currentColor',
            marginLeft: '0.08em',
            transform: 'translateY(0.06em)',
            // Blinks only once the line has finished. A caret that blinks
            // while it is still typing reads as a fault.
            animation: done && !reduce ? 'caret-blink 1.1s step-end infinite' : 'none',
            opacity: reduce ? 0 : 1,
          }}
        />
      )}
    </span>
  );
}
