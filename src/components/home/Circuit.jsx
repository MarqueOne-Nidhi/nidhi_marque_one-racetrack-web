import React, { useEffect, useState } from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import NumberTicker from '../ui/NumberTicker';
import { CIRCUIT } from '../../data/circuit';
import { CIRCUIT_COPY } from '../../data/home';
import CircuitTrace from '../CircuitTrace';
import IMAGES from '../../data/images';

/**
 * Where each figure stands on the drawing, on a phone.
 *
 * Fractions of the trace's own box, which is why the box below is cut to the
 * exact proportions of the drawing's viewBox: at 663 by 1000 the two agree,
 * so a figure lands on the same piece of open ground whatever the screen is.
 * They are placed against the layout — outside the long left-hander, inside
 * the infield, off the end of the strip — and not against the screen edges.
 */
const PLACED = {
  lap: { left: '4%', top: '1%' },
  strip: { left: '62%', top: '25%' },
  elevation: { left: '2%', top: '44%' },
  speed: { left: '55%', top: '76%' },
};

/**
 * The phone sequence, in seconds.
 *
 * The line takes two seconds to draw itself (DRAW_DUR in CircuitTrace). The
 * figures follow it round rather than waiting for it to finish: the first
 * arrives once the pen is well away, and the rest come in behind it, so the
 * last lands just as the circuit closes.
 */
const FIRST_FIGURE = 0.85;
const BETWEEN_FIGURES = 0.2;

/**
 * True on a phone.
 *
 * A media query and two trees rather than one tree with breakpoints, because
 * CircuitTrace names its SVG filter and its gradient by fixed id, and SVG
 * references are document-global: a second copy of the drawing sitting in the
 * page behind `md:hidden` would collide with the first. One drawing exists at
 * a time, so only one of these layouts is ever built.
 */
function useIsPhone() {
  const QUERY = '(max-width: 767px)';
  // Read at mount rather than defaulting to false: starting on the desktop
  // tree and correcting a frame later would swap the whole section in view.
  const [isPhone, setIsPhone] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;

    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isPhone;
}

/**
 * One figure, rising into place as the reader reaches it.
 *
 * Set the same either way — serif numerals over tracked-out capitals — so the
 * phone reads as the same publication as the desktop. All that changes is
 * where it stands and when it arrives.
 */
function Figure({ fig, className = '', style, order = 0, phone = false }) {
  const decimals = fig.unit === 'km' && fig.value < 10 ? 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: phone ? 28 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Inset vertically only. Fifty pixels off every side would leave a
      // figure sitting in the page gutter outside the observer's root on a
      // narrow screen, and it would never arrive at all. See ui/NumberTicker,
      // where exactly that lost the lap distance on every phone.
      viewport={{ once: true, margin: '-40px 0px' }}
      transition={
        phone
          ? {
              duration: 0.7,
              delay: FIRST_FIGURE + order * BETWEEN_FIGURES,
              ease: [0.16, 1, 0.3, 1],
            }
          : { duration: 0.6 }
      }
      className={className}
      style={style}
    >
      <span className="font-serif text-[clamp(2rem,3.2vw,3.5rem)] font-light leading-none inline-flex items-baseline gap-1">
        {fig.prefix && <span className="text-[0.55em] ink-faint">{fig.prefix}</span>}
        <NumberTicker value={fig.display} decimalPlaces={decimals} />
        <span className="text-[0.5em] ink-muted ml-1 uppercase">{fig.unit}</span>
      </span>
      <span className="text-[0.68rem] tracking-widest uppercase ink-faint mt-2 block">
        {fig.label}
      </span>
    </motion.div>
  );
}

export default function Circuit() {
  const isPhone = useIsPhone();

  const figures = [
    { key: 'lap', ...CIRCUIT.lap, display: CIRCUIT.lap.value },
    { key: 'strip', ...CIRCUIT.strip, display: CIRCUIT.strip.value },
    { key: 'elevation', ...CIRCUIT.elevation, display: CIRCUIT.elevation.value },
    { key: 'speed', ...CIRCUIT.speed, display: CIRCUIT.speed.value },
  ];

  // ── The phone ────────────────────────────────────────────────────────────
  // The drawing is the section rather than an illustration under it: one
  // screen, the heading at the top, and the four figures standing in the open
  // ground of the layout. Each rises from below as the reader arrives, one
  // after another, and the three paragraphs of prose are left to the wide
  // layout — the shape of the track and four numbers say the same thing to
  // someone holding a phone.
  if (isPhone) {
    return (
      <Section
        id="circuit"
        surface="light"
        className="flex h-[100svh] items-stretch max-md:pb-[4vh] max-md:pt-[calc(76px+2vh)]"
        innerClassName="flex flex-col"
      >
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px 0px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[clamp(2.4rem,10vw,3.2rem)] font-light leading-[1] tracking-tight mb-3"
        >
          {CIRCUIT_COPY.heading}
        </motion.h2>

        {/* The stage takes whatever the heading leaves and is cut to the
            drawing's proportions, so the placements above hold and the whole
            section still ends at the bottom of the screen. The screen height
            is fixed rather than a floor: against `min-height` the column has
            no definite height of its own, so the `min(100%, …)` that caps the
            stage resolves against the content it is meant to be capping and
            a short phone runs over. The top padding
            clears the fixed bar — 76px, NAV_HEIGHT in lib/anchors — because
            this section is a menu target, and landing on it put the heading
            under the bar's backdrop blur, where it read as a smudge. */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px 0px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="circuit-stage relative"
          >
            {/* Above the figures in the stack, so the line runs across the
                numerals rather than under them: the figures are written on
                the ground and the circuit is laid over the top. */}
            <CircuitTrace
              drawOnView
              label={IMAGES.circuitTrace.alt}
              className="circuit-figure--fill pointer-events-none absolute inset-0 z-20"
            />

            {figures.map((fig, i) => (
              <Figure
                key={fig.key}
                fig={fig}
                order={i}
                phone
                className="absolute z-0"
                style={PLACED[fig.key]}
              />
            ))}
          </motion.div>
        </div>
      </Section>
    );
  }

  // ── Everything wider ─────────────────────────────────────────────────────
  return (
    <Section id="circuit" surface="light">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
        {/* Left column: Heading, stats, copy */}
        <div className="lg:col-span-6 flex flex-col">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-10 lg:mb-12"
          >
            {CIRCUIT_COPY.heading}
          </motion.h2>

          {/* Four-figure row */}
          <div className="flex flex-wrap gap-x-8 gap-y-6 sm:gap-x-10 xl:gap-x-12 mb-10 lg:mb-12">
            {figures.map((fig) => (
              <Figure key={fig.key} fig={fig} />
            ))}
          </div>

          {/* Body copy */}
          <div className="max-w-measure flex flex-col gap-5">
            {CIRCUIT_COPY.body.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="font-sans text-[clamp(0.85rem,1.15vw,0.95rem)] font-light leading-[1.75] ink-muted"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Right column: Circuit trace */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="lg:col-span-6 flex items-center justify-center w-full"
        >
          <CircuitTrace label={IMAGES.circuitTrace.alt} className="w-full" />
        </motion.div>
      </div>
    </Section>
  );
}
