import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Text that types itself in, with a caret that keeps blinking after it stops.
 *
 * Three things worth knowing:
 *
 * 1. It types on scroll into view, not on mount. A section that has already
 *    typed itself out before the reader arrives has not animated at all, it
 *    has just been slow to appear.
 *
 * 2. A full stop dwells. Typing "Coming soon..." at one rate runs the three
 *    dots out in a third of a second and they read as a stutter; held three
 *    times as long they read as a pause, which is what an ellipsis is.
 *
 * 3. The animation is hidden from assistive technology and the whole string
 *    is exposed on the wrapper instead. Otherwise a screen reader announces a
 *    growing fragment on every keystroke.
 *
 * Under reduced motion it renders the finished text and never runs.
 */

const DWELL = { '.': 3, ',': 2.2, '…': 3 };

export default function TypeOut({
  text,
  className = '',
  speed = 85,
  startDelay = 300,
  caret = true,
  caretClassName = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduce = useReducedMotion();

  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  useEffect(() => {
    if (reduce) {
      setShown(text.length);
      return undefined;
    }
    if (!inView) return undefined;

    let timer;
    let cancelled = false;

    const step = (index) => {
      if (cancelled) return;
      setShown(index);
      if (index >= text.length) return;

      // The delay before the NEXT character is decided by the one just typed,
      // so a pause lands after the mark rather than before it.
      const previous = text.charAt(index - 1);
      const wait = index === 0 ? startDelay : speed * (DWELL[previous] || 1);
      timer = setTimeout(() => step(index + 1), wait);
    };

    step(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inView, reduce, text, speed, startDelay]);

  return (
    <span ref={ref} className={className} aria-label={text} role="text">
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {caret && (
        <span
          aria-hidden="true"
          className={`inline-block w-[0.06em] self-stretch align-baseline ${caretClassName}`}
          style={{
            // Sized to the text it sits beside rather than to a fixed pixel
            // height, so it stays a caret at every clamp() step.
            height: '0.85em',
            backgroundColor: 'currentColor',
            marginLeft: '0.08em',
            transform: 'translateY(0.06em)',
            // Blinks only once it has finished; a caret that blinks while
            // typing reads as a fault.
            animation: done && !reduce ? 'caret-blink 1.1s step-end infinite' : 'none',
            opacity: reduce ? 0 : 1,
          }}
        />
      )}
    </span>
  );
}
