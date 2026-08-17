import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { WITH_PEOPLE } from '../../data/home';
import ImageSlot from '../ImageSlot';
import IMAGES from '../../data/images';

export default function WithPeople() {
  return (
    <Section
      id="with-people"
      surface="light"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-12"
      >
        {WITH_PEOPLE.heading}
      </motion.h2>

      {/* Wide image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mb-14 rounded-sm overflow-hidden"
      >
        <ImageSlot
          src={IMAGES.withPeople.src}
          alt={IMAGES.withPeople.alt}
          caption={IMAGES.withPeople.caption}
          aspect="16/9"
          className="w-full"
        />
      </motion.div>

      {/* Three sub-blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        {WITH_PEOPLE.blocks.map((block, i) => (
          <motion.div
            key={block.title}
            id={block.anchor}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <h3 className="font-serif text-[clamp(1.2rem,1.6vw,1.4rem)] font-light mb-3">
              {block.title}
            </h3>
            <p className="font-sans text-[0.85rem] font-light leading-[1.7] ink-muted">
              {block.body}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
