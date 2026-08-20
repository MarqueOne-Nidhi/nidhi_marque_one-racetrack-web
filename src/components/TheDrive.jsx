import React from 'react';
import { Section } from './ui/Section';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';
import NumberTicker from './ui/NumberTicker';
import LiquidButton from './ui/LiquidButton';
import { useContactModal } from './ContactModal';

// Driving here requires no membership, so this section's CTA goes to the
// booking form rather than the membership modal it used to open.
export default function TheDrive() {
  const openContact = useContactModal();

  return (
    <Section
      id="drive"
      surface="dark-raised"
    >
      <span className="block text-[0.7rem] tracking-widest uppercase ink-muted mb-2">
        THE DRIVE
      </span>

      <BlurFadeText
        text="Made for the drive."
        className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert mb-6"
      />

      <p className="font-sans text-[0.9rem] font-light leading-[1.7] ink-muted max-w-measure mb-12">
        An FIA-graded circuit designed by Driven International, with race-grade asphalt run-off and permanent barriers. No traffic, no oncoming, no speed limit.
      </p>

      <div className="flex flex-wrap gap-12 md:gap-24 my-12">
        <div>
          <span className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-none inline-flex items-baseline">
            <NumberTicker value={3.2} decimalPlaces={1} />
            <span className="ml-2">KM</span>
          </span>
          <span className="text-[0.68rem] tracking-widest uppercase ink-faint mt-2 block">
            CIRCUIT
          </span>
        </div>

        <div>
          <span className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-none inline-flex items-baseline">
            <NumberTicker value={800} />
            <span className="ml-2">M</span>
          </span>
          <span className="text-[0.68rem] tracking-widest uppercase ink-faint mt-2 block">
            DRAG STRIP
          </span>
        </div>

        <div>
          <span className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-none inline-flex items-baseline gap-2">
            <span className="text-[0.55em] ink-muted">+/−</span>
            <NumberTicker value={25} />
            <span className="ml-1">M</span>
          </span>
          <span className="text-[0.68rem] tracking-widest uppercase ink-faint mt-2 block">
            ELEVATION
          </span>
        </div>
      </div>

      <LiquidButton
        onClick={() => openContact('Drive', 'Club · The drive')}
        variant="ghost"
        size="sm"
        className="group tracking-wider mb-12"
      >
        <span>Book a day to drive</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </LiquidButton>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      >
        <figure className="m-0">
          <div className="w-full aspect-[21/9] overflow-hidden rounded-sm">
            <img
              src="/assets/images/racetrack_drive.png"
              alt="ONE.CLUB Race Circuit Aerial View"
              className="w-full h-full object-cover"
            />
          </div>
          <figcaption className="mt-3 font-sans text-[0.72rem] font-light leading-[1.6] tracking-wide ink-faint max-w-measure">
            3.2 km, climbing and dropping twenty-five metres either side of level, and blind over the crests. The 800-metre drag strip runs on the circuit itself.
          </figcaption>
        </figure>
      </motion.div>
    </Section>
  );
}
