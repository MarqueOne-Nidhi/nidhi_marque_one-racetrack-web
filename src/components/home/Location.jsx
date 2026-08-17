import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { LOCATION } from '../../data/home';
import ImageSlot from '../ImageSlot';
import IMAGES from '../../data/images';

export default function Location() {
  return (
    <Section
      id="location"
      surface="light"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-8"
          >
            {LOCATION.heading}
          </motion.h2>

          <div className="flex flex-col gap-5 max-w-measure-sm">
            {LOCATION.body.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light leading-[1.7] ink-muted"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Stylised map graphics placeholder frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="rounded-sm overflow-hidden shadow-sm"
        >
          <ImageSlot
            src={IMAGES.locationMap.src}
            alt={IMAGES.locationMap.alt}
            caption={IMAGES.locationMap.caption}
            aspect="16/9"
            placeholderLabel={IMAGES.locationMap.placeholder}
            className="w-full"
          />
        </motion.div>
      </div>
    </Section>
  );
}
