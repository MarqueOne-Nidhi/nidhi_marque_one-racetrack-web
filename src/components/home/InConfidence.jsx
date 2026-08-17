import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { IN_CONFIDENCE } from '../../data/home';

export default function InConfidence() {
  return (
    <Section
      id="in-confidence"
      surface="dark-raised"
      measure="lg"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-14"
      >
        {IN_CONFIDENCE.heading}
      </motion.h2>

      <div className="flex flex-col gap-12">
        {IN_CONFIDENCE.blocks.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <h3 className="font-serif text-[clamp(1.3rem,1.8vw,1.6rem)] font-light mb-2">
              {block.title}
            </h3>
            <p className="font-sans text-[0.88rem] font-light leading-[1.75] ink-muted">
              {block.body}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
