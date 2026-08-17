import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { SAFETY } from '../../data/home';

export default function Safety() {
  return (
    <Section
      id="safety"
      surface="light-deep"
      measure="lg"
      rhythm="tight"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1] tracking-tight mb-8"
      >
        {SAFETY.heading}
      </motion.h2>

      <div className="flex flex-col gap-5">
        {SAFETY.body.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="font-sans text-[0.9rem] font-light leading-[1.75] ink-muted"
          >
            {para}
          </motion.p>
        ))}
      </div>
    </Section>
  );
}
