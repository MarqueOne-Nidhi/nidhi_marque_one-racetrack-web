import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { FORK } from '../../data/home';

export default function Fork() {
  return (
    <Section
      id="fork"
      surface="light"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-14"
      >
        {FORK.heading}
      </motion.h2>

      {/* 2×2 grid on desktop, stacked on mobile — equal visual weight. The
          1px gap is painted by the container showing through, so it takes the
          rule colour and the panels sit flush on the section's own ground. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px rule-fill">
        {FORK.panels.map((panel, idx) => (
          <motion.a
            key={panel.title}
            href={`#${panel.anchor}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.08 }}
            className="hover-raise p-[clamp(2rem,4vw,4rem)] flex flex-col justify-between min-h-[220px] group transition-colors duration-500"
          >
            <h3 className="font-serif text-[clamp(1.5rem,2.5vw,2.2rem)] font-light tracking-tight group-hover:translate-x-2 transition-transform duration-500">
              {panel.title}
            </h3>
            <p className="font-sans text-[0.85rem] font-light ink-muted leading-relaxed mt-4 max-w-measure-xs">
              {panel.body}
            </p>
            <span className="text-[0.7rem] tracking-widest uppercase ink-faint mt-6 group-hover:text-brand transition-colors duration-500">
              ↓ Learn more
            </span>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}
