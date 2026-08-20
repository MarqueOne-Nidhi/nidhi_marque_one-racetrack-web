import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { BUSINESS } from '../../data/business';

export default function Business() {
  return (
    // Opens the Business page, so it takes the interior-page header shape:
    // light ground, and explicit top padding to clear the fixed navbar
    // rather than relying on the 14vh rhythm to do it.
    <Section
      id="business"
      surface="light"
      rhythm="none"
      className="pt-[120px] pb-section"
    >
      <span className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3">
        MARQUE.<span style={{ color: '#cc0000' }}>ONE</span> FOR BUSINESS
      </span>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.95] tracking-tight mb-6"
      >
        {BUSINESS.heading}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed mb-16"
      >
        {BUSINESS.intro}
      </motion.p>

      {/* 4 sub-blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
        {BUSINESS.blocks.map((block, i) => (
          <motion.div
            key={block.title}
            id={block.anchor}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className="group flex flex-col"
          >
            {block.image && (
              <div className="relative w-full aspect-[16/9] rounded-sm overflow-hidden mb-6 bg-black/5">
                <img
                  src={block.image}
                  alt={block.alt || block.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
            )}
            <div className="border-t rule pt-5 flex-1 flex flex-col">
              <h3 className="font-serif text-[clamp(1.3rem,1.8vw,1.6rem)] font-light mb-3">
                {block.title}
              </h3>
              <p className="font-sans text-[0.88rem] font-light leading-[1.7] ink-muted">
                {block.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
