import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import NumberTicker from '../ui/NumberTicker';
import { CIRCUIT } from '../../data/circuit';
import { CIRCUIT_COPY } from '../../data/home';
import CircuitTrace from '../CircuitTrace';
import IMAGES from '../../data/images';

export default function Circuit() {
  const figures = [
    { ...CIRCUIT.lap, display: CIRCUIT.lap.value },
    { ...CIRCUIT.strip, display: CIRCUIT.strip.value },
    { ...CIRCUIT.elevation, display: CIRCUIT.elevation.value },
    { ...CIRCUIT.speed, display: CIRCUIT.speed.value },
  ];

  return (
    <Section
      id="circuit"
      surface="light"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
        {/* Left column: Heading, stats, copy */}
        <div className="lg:col-span-6 flex flex-col">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-10 lg:mb-12"
          >
            {CIRCUIT_COPY.heading}
          </motion.h2>

          {/* Four-figure row */}
          <div className="flex flex-wrap gap-x-8 gap-y-6 sm:gap-x-10 xl:gap-x-12 mb-10 lg:mb-12">
            {figures.map((fig) => (
              <motion.div
                key={fig.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="font-serif text-[clamp(2rem,3.2vw,3.5rem)] font-light leading-none inline-flex items-baseline gap-1">
                  {fig.prefix && (
                    <span className="text-[0.55em] ink-faint">{fig.prefix}</span>
                  )}
                  <NumberTicker value={fig.display} decimalPlaces={fig.unit === 'km' && fig.value < 10 ? 1 : 0} />
                  <span className="text-[0.5em] ink-muted ml-1 uppercase">{fig.unit}</span>
                </span>
                <span className="text-[0.68rem] tracking-widest uppercase ink-faint mt-2 block">
                  {fig.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Body copy */}
          <div className="max-w-measure flex flex-col gap-5">
            {CIRCUIT_COPY.body.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="font-sans text-[clamp(0.85rem,1.15vw,0.95rem)] font-light leading-[1.75] ink-muted"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Right column: Circuit trace */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="lg:col-span-6 flex items-center justify-center w-full"
        >
          <CircuitTrace label={IMAGES.circuitTrace.alt} className="w-full" />
        </motion.div>
      </div>
    </Section>
  );
}
