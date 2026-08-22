import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../ui/Section';
import CardCylinder from '../ui/CardCylinder';
import CylinderMarkers from '../ui/CylinderMarkers';
import { HOSPITALITY, HOSPITALITY_CARDS } from '../../data/home';
import IMAGES from '../../data/images';

/**
 * Hospitality: the cylinder of cards, turning by itself.
 *
 * The stage and the physics are in ui/CardCylinder, which the Business page
 * also uses, driven by scroll instead. What stays here is what is particular
 * to this section: the words, and the fact that it turns on its own.
 */

// The cylinder takes a resolved src rather than a key into IMAGES, so it does
// not need to know which data file its cards came from.
const CARDS = HOSPITALITY_CARDS.map((card) => ({
  key: card.key,
  title: card.title,
  line: card.line,
  src: IMAGES[card.key]?.src,
  alt: IMAGES[card.key]?.alt,
}));

export default function HospitalityShowcase() {
  const [active, setActive] = useState(0);
  const cylinder = useRef(null);
  const activeCard = CARDS[active];

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
        <CardCylinder
          ref={cylinder}
          cards={CARDS}
          onActiveChange={setActive}
          className="md:col-span-6 h-[clamp(320px,46vh,460px)] md:h-[clamp(440px,68vh,760px)]"
        />

        {/* ── Right: what the front card is ──────────────────────────────── */}
        {/* `contents` on a phone, so the two blocks inside become items of
            the section's own grid and can be ordered around the cylinder:
            the words that introduce the cards go above them, and the caption
            for whichever card is at the front stays below. From md up the
            wrapper is a column again and nothing about the wide layout
            changes. */}
        <div className="contents md:block md:col-span-5 md:col-start-8">
          <div className="order-first md:order-none">
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
              className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light ink-muted leading-relaxed max-w-measure-sm mb-0 md:mb-12"
            >
              {HOSPITALITY.intro}
            </motion.p>
          </div>

          <div>
            {/* Held to a fixed height so the longest line cannot shove the row
                of markers down and up as the cylinder turns. */}
            <div className="min-h-[104px]">
              <span className="block text-[0.6rem] tracking-ultra uppercase ink-faint mb-3">
                {String(active + 1).padStart(2, '0')} / {String(CARDS.length).padStart(2, '0')}
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

            <CylinderMarkers
              cards={CARDS}
              active={active}
              onSelect={(i) => cylinder.current?.goTo(i)}
              className="mt-8"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
