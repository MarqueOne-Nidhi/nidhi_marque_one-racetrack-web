import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { DEFINITION } from '../../data/home';

export default function Definition() {
  return (
    <Section
      id="definition"
      surface="light"
      measure="lg"
      innerClassName="text-center"
    >
      {/* Name and descriptor move together as one block, so the ten-unit
          gap to the body copy is measured from the pair rather than from the
          name with the descriptor floating loose inside it. */}
      <div className="mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight"
        >
          Marque.<span style={{ color: '#cc0000' }}>One</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 text-[0.7rem] tracking-ultra uppercase ink-faint"
        >
          {DEFINITION.subheading}
        </motion.p>
      </div>

      <div className="flex flex-col gap-6">
        {DEFINITION.body.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light leading-[1.75] ink-muted"
          >
            {para}
          </motion.p>
        ))}
      </div>
    </Section>
  );
}
