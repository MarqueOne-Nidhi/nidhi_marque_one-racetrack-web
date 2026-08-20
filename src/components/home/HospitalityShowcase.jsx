import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../ui/Section';
import { HOSPITALITY, HOSPITALITY_CARDS } from '../../data/home';
import IMAGES from '../../data/images';

/**
 * ─── Hospitality: a cylinder of cards on a horizontal axis ────────────────
 *
 * The cards travel vertically and tilt away from the reader. Drag the stack
 * to turn it, click any card that is not at the front to bring it forward, or
 * use the markers beside the copy. Left alone it turns by itself.
 *
 * Three things here are deliberate and easy to undo by accident:
 *
 * 1. No card passes 90 degrees, so a back face is never in view and none is
 *    built. Turning further would show the reverse of every card above and
 *    below the front one.
 *
 * 2. Position is linear in `progress`: one whole number is one card, and
 *    nothing eases the mapping. The dwell at the front comes from varying the
 *    auto-advance *rate* near a whole number instead. Easing the position
 *    would make a drag fight the pointer, barely moving near a card and then
 *    lurching, and would jump the moment the drag was released.
 *
 * 3. Only cards near the front take pointer events, and the front card is not
 *    a click target because there is nowhere for it to go. Without that, a
 *    card behind catches the click meant for the one in front: they are
 *    large, steeply tilted boxes and they overlap.
 *
 * One rAF loop writes transforms straight to the DOM. React renders the cards
 * once and stays out of it; per-frame state would re-render every card and
 * slice sixty times a second. The only state the loop sets is which card is
 * at the front, and only on the frame that changes.
 */

const PERSPECTIVE = 1350;

// Waypoints at offset 0 (front), 1 (adjacent), 2 (leaving), 3 (gone).
// The whole depth of the stack is these two rows.
const Z = [400, 220, -60, -250];
const ROT = [0, 55, 72, 80]; // degrees, and must stay under 90: see note 1

// Base progress per frame, before the dwell factor in the tick.
const AUTO_SPEED = 0.0028;

// Pointer travel that turns the cylinder by one card, as a share of card
// height. Lower drags faster.
const DRAG_PER_CARD = 0.9;

// ── Release ───────────────────────────────────────────────────────────────
// A flick carries. Where it would coast to under friction decides which card
// it settles on, and a spring seeded with the release velocity takes it there,
// so the throw and the settle are one continuous movement rather than a
// throw that is cut off and replaced by a glide.
//
// PROJECTION is the sum of the friction series, 1 + f + f² + …, which is how
// far the current velocity would carry if left to decay on its own.
const RELEASE_FRICTION = 0.94;
const PROJECTION = 1 / (1 - RELEASE_FRICTION);

// The arrival: a share of whatever distance is left, every frame. Because the
// step is proportional to what remains, it is fast while there is ground to
// cover and slows continuously into the card, and it cannot overshoot. A
// spring was tried here first and would not do both: tuned to carry a flick it
// sailed 5 to 14 per cent past the card and came back, which reads as a bounce
// rather than an arrival.
const EASE_RATE = 0.09;

// Close enough to call it arrived. Any smaller and the last hundredth of a
// pixel costs another quarter second of nothing visibly happening.
const SETTLED = 0.0015;

// A violent flick should not spin most of the cylinder before it stops.
const MAX_FLICK_CARDS = 3;

// Slice offsets in px: back plate, core, face.
const THICKNESS = [-1.3, 0, 1.3];

const smoothstep = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export default function HospitalityShowcase() {
  const cards = HOSPITALITY_CARDS;
  const cardCount = cards.length;

  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const frameId = useRef(0);
  const progress = useRef(0);

  // While this holds a number the loop glides towards it and then hands
  // control back: how a chosen card is reached, and how a drag settles.
  const target = useRef(null);

  // Cards per frame. Written by the drag, then spent by the spring.
  const velocity = useRef(0);
  const drag = useRef({
    active: false,
    startY: 0,
    startProgress: 0,
    moved: false,
    lastT: 0,
  });
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const [metrics, setMetrics] = useState({ cardW: 300, cardH: 188, stageH: 480 });
  const metricsRef = useRef(metrics);

  // ── Measure ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;

      const cardW = Math.round(Math.min(340, Math.max(190, width * 0.74)));
      const cardH = Math.round(cardW / 1.5925);
      const next = { cardW, cardH, stageH: Math.round(height) };

      metricsRef.current = next;
      setMetrics(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // ── Cursor parallax ─────────────────────────────────────────────────────
  // Measured against the stage, not the window: this fills half a section, so
  // window-centre would leave the cards tilted whenever the cursor sat on the
  // copy beside them.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleMove = (e) => {
      const rect = stage.getBoundingClientRect();
      const rx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ry = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      pointer.current.targetX = Math.max(-1, Math.min(1, rx));
      pointer.current.targetY = Math.max(-1, Math.min(1, ry));
    };

    const handleLeave = () => {
      pointer.current.targetX = 0;
      pointer.current.targetY = 0;
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // ── The loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const layout = () => {
      const { cardH, stageH } = metricsRef.current;
      const D = PERSPECTIVE;
      const gap = Math.round(cardH * 0.12);
      const peek = -Math.round(cardH * 0.26);

      const p = progress.current;
      const front = ((Math.round(p) % cardCount) + cardCount) % cardCount;
      if (front !== activeRef.current) {
        activeRef.current = front;
        setActive(front);
      }

      for (let i = 0; i < cardCount; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // Nearest wrapped representation, so card 0 can sit just below card 4
        // rather than travelling the whole cylinder to reach it.
        let offset = i - p;
        const half = cardCount / 2;
        while (offset > half) offset -= cardCount;
        while (offset < -half) offset += cardCount;

        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        if (absOffset > 3) {
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          continue;
        }
        el.style.visibility = 'visible';

        // See note 3. Past the adjacent pair a card is inert, so it cannot
        // catch a click meant for one in front of it.
        const isFront = absOffset < 0.5;
        el.style.pointerEvents = absOffset > 1.6 ? 'none' : 'auto';
        el.style.cursor = drag.current.active
          ? 'grabbing'
          : isFront
          ? 'grab'
          : 'pointer';

        let y;
        let z;
        let rot;

        if (absOffset <= 1) {
          const t = smoothstep(absOffset);
          y = -sign * t * (cardH + gap);
          z = lerp(Z[0], Z[1], t);
          rot = lerp(ROT[0], ROT[1], t);
        } else if (absOffset <= 2) {
          const t = smoothstep(absOffset - 1);

          // Perspective-aware, so the card's edge lands on the stage boundary
          // rather than near it: at depth z a card is scaled by D / (D - z),
          // so that factor has to be divided back out of the offset.
          const scaleEnd = D / (D - Z[2]);
          const yEnd = (stageH / 2 - peek) / scaleEnd - cardH / 2;

          y = -sign * lerp(cardH + gap, yEnd, t);
          z = lerp(Z[1], Z[2], t);
          rot = lerp(ROT[1], ROT[2], t);
        } else {
          const t = smoothstep(Math.min(absOffset - 2, 1));

          const scaleStart = D / (D - Z[2]);
          const yStart = (stageH / 2 - peek) / scaleStart - cardH / 2;

          // Clear of the stage entirely, so nothing vanishes with a corner
          // still showing.
          const scaleEnd = D / (D - Z[3]);
          const yEnd = (stageH / 2 + 100) / scaleEnd + cardH / 2;

          y = -sign * lerp(yStart, yEnd, t);
          z = lerp(Z[2], Z[3], t);
          rot = lerp(ROT[2], ROT[3], t);
        }

        // Tilt belongs to the card at the front. The ones turning away are
        // already showing an edge, and tilting those reads as a wobble.
        const centreFactor = Math.max(0, 1 - absOffset);
        const tiltX = -pointer.current.y * 12 * centreFactor;
        const tiltY = pointer.current.x * 15 * centreFactor;

        // Offset into positive territory: a card at z -250 would otherwise
        // take a negative z-index and fall behind the stage itself.
        el.style.zIndex = String(Math.round(z) + 1000);
        el.style.transform =
          `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) ` +
          `rotateX(${(-sign * rot + tiltX).toFixed(2)}deg) ` +
          `rotateY(${tiltY.toFixed(2)}deg) rotateZ(-3deg)`;
      }
    };

    const tick = () => {
      if (drag.current.active) {
        // progress is being written by the pointer
      } else if (target.current !== null) {
        const remaining = target.current - progress.current;

        // Two claims on the frame: what is left of the throw, and the ease
        // into the card. The throw wins while it is still the faster of the
        // two and still heading the right way; as it decays the ease takes
        // over. So a flick travels at its own speed and then hands off to a
        // deceleration that runs all the way to the stop, with no seam and no
        // sudden change of rate.
        const eased = remaining * EASE_RATE;
        velocity.current *= RELEASE_FRICTION;

        const throwLeads =
          Math.abs(velocity.current) > Math.abs(eased) &&
          velocity.current > 0 === remaining > 0;

        progress.current += throwLeads ? velocity.current : eased;

        if (Math.abs(target.current - progress.current) < SETTLED) {
          progress.current = target.current;
          target.current = null;
          velocity.current = 0;
        }
      } else {
        // Dwell at the front, then move on. See note 2: this varies the rate,
        // never the position.
        const frac = Math.abs(progress.current - Math.round(progress.current));
        const dwell = 0.18 + 0.82 * Math.pow(Math.min(1, frac * 2), 1.2);
        progress.current += AUTO_SPEED * dwell;
      }

      pointer.current.x += (pointer.current.targetX - pointer.current.x) * 0.08;
      pointer.current.y += (pointer.current.targetY - pointer.current.y) * 0.08;
      layout();
      frameId.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frameId.current) return;
      frameId.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frameId.current);
      frameId.current = 0;
    };

    // Place them once up front, or the first painted frame has every card
    // stacked at the origin waiting on the first rAF callback.
    layout();

    if (reduced.matches) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    observer.observe(stage);

    const handleVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
  }, [cardCount]);

  // ── Drag ────────────────────────────────────────────────────────────────
  // Pointer only. On a touch screen a vertical drag is how the page itself is
  // scrolled, and claiming it here would trap a reader inside the section;
  // touch gets the markers and the cards instead.
  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    drag.current = {
      active: true,
      startY: e.clientY,
      startProgress: progress.current,
      moved: false,
      lastT: performance.now(),
    };
    // Catching it stops it: cancel any settle in flight and kill the
    // velocity, so the stack sits still under the hand.
    target.current = null;
    velocity.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!drag.current.active) return;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dy) > 4) drag.current.moved = true;

    // Dragging down pulls the next card down from above, the direction the
    // stack travels on its own.
    const perCard = Math.max(90, metricsRef.current.cardH * DRAG_PER_CARD);
    const next = drag.current.startProgress + dy / perCard;

    // Velocity in cards per frame, measured against real elapsed time and
    // then smoothed. Taking the raw last-sample delta would hand the release
    // whatever the final stray pointer event happened to be, including the
    // zero from a pointer that stopped moving a moment before letting go.
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    const sample = ((next - progress.current) / dt) * 16.667;
    velocity.current = velocity.current * 0.7 + sample * 0.3;

    progress.current = next;
    drag.current.lastT = now;
  };

  const handlePointerUp = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    // Where the throw would coast to, rounded to a card, and never more than
    // a few away however hard it was thrown.
    const rounded = Math.round(progress.current);
    const projected = Math.round(progress.current + velocity.current * PROJECTION);
    target.current = Math.max(
      rounded - MAX_FLICK_CARDS,
      Math.min(rounded + MAX_FLICK_CARDS, projected)
    );
  };

  // Turn by the shorter arc: card 4 to card 0 is one step forward, not four
  // steps back.
  const goTo = (index) => {
    const rounded = Math.round(progress.current);
    const front = ((rounded % cardCount) + cardCount) % cardCount;

    let delta = index - front;
    const half = cardCount / 2;
    while (delta > half) delta -= cardCount;
    while (delta < -half) delta += cardCount;

    target.current = rounded + delta;
  };

  const activeCard = cards[active];

  return (
    <Section
      id="hospitality"
      surface="dark"
      rhythm="none"
      // Fills the viewport, but on a minimum rather than a fixed height: on a
      // phone the stage and the copy stack, and a hard 100svh would crop the
      // second one instead of letting the section grow.
      className="min-h-[100svh] flex items-center py-[clamp(4rem,10vh,8rem)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-col items-center w-full">
        {/* ── Left: the cylinder ─────────────────────────────────────────── */}
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="md:col-span-6 relative w-full h-[clamp(320px,46vh,460px)] md:h-[clamp(440px,68vh,760px)] flex items-center justify-center overflow-hidden select-none touch-pan-y"
          style={{ perspective: `${PERSPECTIVE}px` }}
        >
          {/* The stage clips, so a card leaving the top or bottom ends on a
              hard horizontal cut. These wash that edge back into the section's
              own ground, reading --surface rather than a literal colour so
              they follow the section if its ground ever changes. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[18%] z-[2000] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, var(--surface), transparent)' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[18%] z-[2000] pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }}
          />

          <div
            className="absolute"
            style={{
              width: `${metrics.cardW}px`,
              height: `${metrics.cardH}px`,
              transformStyle: 'preserve-3d',
            }}
          >
            {cards.map((card, i) => {
              const image = IMAGES[card.key];
              return (
                <div
                  key={card.key}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  // Suppressed after a drag, so releasing the pointer over a
                  // card does not also count as choosing it.
                  onClick={() => {
                    if (!drag.current.moved) goTo(i);
                  }}
                  className="absolute inset-0"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {THICKNESS.map((zOffset, layer) => {
                    const isFace = layer === THICKNESS.length - 1;

                    // Everything but the face is edge: solid plates only ever
                    // seen a millimetre wide, since no card turns far enough
                    // to show one of them flat on.
                    if (!isFace) {
                      return (
                        <div
                          key={layer}
                          className={`absolute inset-0 rounded-[14px] pointer-events-none ${
                            layer === 0 ? 'bg-[#141412]' : 'bg-[#8a8a85]'
                          }`}
                          style={{ transform: `translateZ(${zOffset}px)` }}
                        />
                      );
                    }

                    return (
                      <div
                        key={layer}
                        className="absolute inset-0 rounded-[14px] border border-ivory/15 overflow-hidden bg-[#0f0f0f] pointer-events-none"
                        style={{
                          transform: `translateZ(${zOffset}px)`,
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
                        }}
                      >
                        <img
                          src={image?.src}
                          alt={image?.alt || card.title}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

                        <span className="absolute left-5 bottom-4 font-serif text-[1.05rem] font-light text-ivory">
                          {card.title}
                        </span>
                        <span className="absolute right-5 top-4 text-[0.6rem] tracking-[0.2em] uppercase text-ivory/60">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: what the front card is ──────────────────────────────── */}
        <div className="md:col-span-5 md:col-start-8">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3"
          >
            HOSPITALITY
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-6"
          >
            {HOSPITALITY.heading}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light ink-muted leading-relaxed max-w-measure-sm mb-12"
          >
            {HOSPITALITY.intro}
          </motion.p>

          {/* Held to a fixed height so the longest line cannot shove the row
              of markers down and up as the cylinder turns. */}
          <div className="min-h-[104px]">
            <span className="block text-[0.6rem] tracking-ultra uppercase ink-faint mb-3">
              {String(active + 1).padStart(2, '0')} / {String(cardCount).padStart(2, '0')}
            </span>
            {/* Keyed on the active card, so a change remounts these two and
                replays their entry rather than swapping the text in place. */}
            <motion.h3
              key={`t-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[1.5rem] font-light mb-2"
            >
              {activeCard.title}
            </motion.h3>
            <motion.p
              key={`l-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-[0.85rem] font-light leading-[1.7] ink-muted max-w-measure-xs"
            >
              {activeCard.line}
            </motion.p>
          </div>

          {/* Upright strokes on a common baseline. Each is a real button, so
              every card is reachable without a pointer, and the hit area is
              padded well past the hairline it draws. */}
          <div className="flex items-end gap-1 mt-8">
            {cards.map((card, i) => (
              <button
                key={card.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${card.title}`}
                aria-current={i === active ? 'true' : undefined}
                className="group flex items-end h-10 px-2 py-1 bg-transparent border-none cursor-pointer"
              >
                <span
                  className={`block w-px transition-all duration-500 ${
                    i === active
                      ? 'h-8 bg-brand'
                      : 'h-4 bg-ivory/25 group-hover:h-6 group-hover:bg-ivory/60'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
