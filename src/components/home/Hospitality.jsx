import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { HOSPITALITY } from '../../data/home';
import ImageSlot from '../ImageSlot';
import IMAGES from '../../data/images';

export default function Hospitality() {
  return (
    <Section
      id="hospitality"
      surface="light"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-4"
      >
        {HOSPITALITY.heading}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed mb-14"
      >
        {HOSPITALITY.intro}
      </motion.p>

      {/* Hero image for hospitality */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mb-14 rounded-sm overflow-hidden"
      >
        <ImageSlot
          src={IMAGES.hospitalityClubhouse.src}
          alt={IMAGES.hospitalityClubhouse.alt}
          caption={IMAGES.hospitalityClubhouse.caption}
          aspect="16/9"
          className="w-full"
        />
      </motion.div>

      {/* 3 grid cards with photography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        {HOSPITALITY.blocks.map((block, i) => {
          const imgKeys = [IMAGES.hospitalityPool, IMAGES.hospitalitySpa, IMAGES.hospitalityWeekend];
          const img = imgKeys[i];
          return (
            <motion.div
              key={block.title}
              id={block.anchor}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col"
            >
              <div className="rounded-sm overflow-hidden mb-5">
                <ImageSlot
                  src={img?.src}
                  alt={img?.alt || block.title}
                  aspect="4/3"
                  placeholderLabel={img?.placeholder || block.title}
                  className="w-full"
                />
              </div>
              <h3 className="font-serif text-[clamp(1.2rem,1.6vw,1.4rem)] font-light mb-2">
                {block.title}
              </h3>
              <p className="font-sans text-[0.85rem] font-light leading-[1.65] ink-muted">
                {block.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
