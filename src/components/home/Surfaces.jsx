import React from 'react';
import { motion } from 'framer-motion';
import { SURFACES } from '../../data/home';
import { surfaceProps } from '../ui/Section';
import ImageSlot from '../ImageSlot';
import IMAGES from '../../data/images';

const cardImages = [
  IMAGES.surfaceCircuit,
  IMAGES.surfaceOffroad,
  IMAGES.surfaceSkidpan,
  IMAGES.surfaceKickplate,
  IMAGES.surfaceWetTrack,
];

export default function Surfaces() {
  return (
    // Not built with <Section>: the cards scroll horizontally past the page
    // measure, so the inner container would clip them.
    <section
      id="surfaces"
      {...surfaceProps('light-deep')}
      className="w-full py-section overflow-hidden"
    >
      <div className="px-gutter mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight"
        >
          {SURFACES.heading}
        </motion.h2>
      </div>

      {/* Horizontal scroll on desktop → stacked on mobile */}
      <div className="flex md:flex-row flex-col gap-6 md:gap-col px-gutter md:overflow-x-auto md:pb-4 scrollbar-hide">
        {SURFACES.cards.map((card, idx) => {
          const img = cardImages[idx];
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className="md:flex-none md:w-[clamp(280px,28vw,400px)] flex flex-col group"
            >
              <div className="overflow-hidden rounded-sm mb-4">
                <ImageSlot
                  src={img?.src}
                  alt={img?.alt || card.title}
                  aspect="3/2"
                  placeholderLabel={img?.placeholder || card.title}
                  className="w-full group-hover:scale-[1.03] transition-transform duration-700"
                />
              </div>
              <h3 className="font-serif text-[clamp(1.2rem,1.8vw,1.5rem)] font-light mb-2">
                {card.title}
              </h3>
              <p className="font-sans text-[0.85rem] font-light leading-[1.65] ink-muted">
                {card.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
