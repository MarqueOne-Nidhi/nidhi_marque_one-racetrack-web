import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { BUSINESS } from '../../data/home';

export default function Business() {
  return (
    <Section
      id="business"
      surface="dark"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-6"
      >
        {BUSINESS.heading}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-sans text-[clamp(0.9rem,1.3vw,1.1rem)] font-light ink-muted max-w-measure leading-relaxed mb-16"
      >
        {BUSINESS.intro}
      </motion.p>

      {/* 4 sub-blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        {BUSINESS.blocks.map((block, i) => (
          <motion.div
            key={block.title}
            id={block.anchor}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="border-t rule pt-6"
          >
            <h3 className="font-serif text-[clamp(1.3rem,1.8vw,1.6rem)] font-light mb-3">
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
