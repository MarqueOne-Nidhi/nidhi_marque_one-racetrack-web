import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const BUBBLE = 42; // resting diameter of the trailing bubble
const DOT = 10; // diameter of the dot that tracks the pointer directly
const HOVER_SCALE = 2; // what the bubble opens to over a link

// How far the bubble's centre sits from the pointer, as a multiple of its own
// current radius, so the gap stays proportional as it opens over a link rather
// than the bubble swallowing the pointer at 2x. It has to clear the squash as
// well as the circle: at full stretch the long axis reaches 1.45 radii, and a
// pass in the wrong direction points that axis straight back at the pointer.
// 1.7 leaves 5.2px at rest and 10.5px hovered, worst case.
const OFFSET_RATIO = 1.7;
const OFFSET_AXIS = ((BUBBLE / 2) * OFFSET_RATIO) / Math.SQRT2; // ~25px per axis

/**
 * The custom cursor: a dot that tracks the pointer directly, and a larger
 * bubble that trails it on a loose spring, carried off to one side, and
 * squashes along its direction of travel. The bubble never contains the
 * pointer — it rides beside it, so it never covers the thing being pointed at.
 *
 * The squash is a spring that rests at 1 — a circle — and is only ever kicked
 * off it by movement. Recovery deliberately does not depend on receiving
 * another mousemove: an idle timer returns it to 1 once the pointer stops.
 * Clearing the deformation only on a later slow event leaves the bubble stuck
 * as an ellipse, because the last event before the pointer halts is nearly
 * always a fast one, and a pointer that has stopped — or left the window, or
 * lost the tab — sends nothing further to correct it.
 *
 * Size is driven by scale on a fixed box rather than by animating width and
 * height, so deformation and hover compose into one GPU transform and neither
 * triggers layout. Both elements are centred with negative margins: Framer
 * Motion writes `transform` itself for x/y/scale/rotate, so a Tailwind
 * `-translate-x-1/2` would be silently overwritten and leave the cursor
 * sitting half its own width off the pointer.
 */
export default function CursorLens() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const reduceMotion = useReducedMotion();

  // Fast, near-critically damped spring for the inner dot.
  const dotSpringConfig = { damping: 40, stiffness: 1000, mass: 0.1 };
  const dotX = useSpring(-100, dotSpringConfig);
  const dotY = useSpring(-100, dotSpringConfig);

  // Looser spring for the outer bubble, so it trails and overshoots.
  const bubbleSpringConfig = { damping: 14, stiffness: 240, mass: 0.5 };
  const bubbleX = useSpring(-100, bubbleSpringConfig);
  const bubbleY = useSpring(-100, bubbleSpringConfig);

  const stretch = useSpring(1, { damping: 18, stiffness: 300, mass: 0.4 });
  const hover = useSpring(1, { damping: 12, stiffness: 260, mass: 0.5 });
  const rotate = useMotionValue(0);

  // Squash on one axis, spread on the other, both scaled by the hover size.
  const scaleX = useTransform([hover, stretch], ([h, s]) => h * s);
  const scaleY = useTransform([hover, stretch], ([h, s]) => h / Math.sqrt(s));

  // The bubble is carried down-right off the pointer so the pointer is never
  // inside it and whatever it is over stays visible. Added after the spring
  // rather than folded into its target, so trailing and overshoot happen
  // around the offset position and cannot cancel it.
  const offset = useTransform(hover, (h) => OFFSET_AXIS * h);
  const bubbleRenderX = useTransform([bubbleX, offset], ([x, o]) => x + o);
  const bubbleRenderY = useTransform([bubbleY, offset], ([y, o]) => y + o);

  const prevMouse = useRef({ x: -100, y: -100, time: 0 });
  const idle = useRef(null);

  useEffect(() => {
    hover.set(isHovered ? HOVER_SCALE : 1);
  }, [isHovered, hover]);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    setIsPointerFine(media.matches);

    const relax = () => stretch.set(1);

    const handleMouseMove = (e) => {
      const now = performance.now();
      const dt = Math.max((now - prevMouse.current.time) / 1000, 0.008);
      const vx = (e.clientX - prevMouse.current.x) / dt;
      const vy = (e.clientY - prevMouse.current.y) / dt;
      const speed = Math.hypot(vx, vy);

      dotX.set(e.clientX);
      dotY.set(e.clientY);
      bubbleX.set(e.clientX);
      bubbleY.set(e.clientY);

      if (!reduceMotion) {
        if (speed > 120) {
          // Below this the direction is mostly jitter and not worth following.
          rotate.set(Math.atan2(vy, vx) * (180 / Math.PI));
          stretch.set(Math.min(1 + speed / 2500, 1.45));
        } else {
          relax();
        }

        // The guarantee that it always comes back round, independent of
        // whether another event ever arrives.
        clearTimeout(idle.current);
        idle.current = setTimeout(relax, 90);
      }

      prevMouse.current = { x: e.clientX, y: e.clientY, time: now };
    };

    const isInteractive = (target) =>
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.closest('a') ||
      target.closest('button') ||
      target.classList?.contains('hover-invert') ||
      target.classList?.contains('cursor-expand') ||
      target.closest('.club-card') ||
      target.closest('.hotspot');

    const handleMouseEnter = (e) => {
      if (isInteractive(e.target)) setIsHovered(true);
    };

    const handleMouseLeave = (e) => {
      if (isInteractive(e.target)) setIsHovered(false);
    };

    // Leaving the window is the other way the pointer goes quiet mid-squash.
    const handleWindowOut = (e) => {
      if (!e.relatedTarget) relax();
    };

    if (media.matches) {
      window.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseover', handleMouseEnter);
      document.addEventListener('mouseout', handleMouseLeave);
      document.addEventListener('mouseout', handleWindowOut);
      window.addEventListener('blur', relax);
    }

    return () => {
      clearTimeout(idle.current);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('mouseout', handleWindowOut);
      window.removeEventListener('blur', relax);
    };
  }, [dotX, dotY, bubbleX, bubbleY, stretch, rotate, reduceMotion]);

  if (!isPointerFine) return null;

  return (
    <>
      {/* Outer trailing bubble */}
      <motion.div
        className="fixed top-0 left-0 rounded-full bg-white pointer-events-none z-[9998] mix-blend-difference"
        style={{
          x: bubbleRenderX,
          y: bubbleRenderY,
          rotate,
          scaleX,
          scaleY,
          width: BUBBLE,
          height: BUBBLE,
          marginLeft: -BUBBLE / 2,
          marginTop: -BUBBLE / 2,
        }}
      />

      {/* Main centre cursor dot */}
      <motion.div
        className="fixed top-0 left-0 rounded-full bg-white pointer-events-none z-[9999] mix-blend-difference shadow-sm"
        style={{
          x: dotX,
          y: dotY,
          width: DOT,
          height: DOT,
          marginLeft: -DOT / 2,
          marginTop: -DOT / 2,
        }}
      />
    </>
  );
}
