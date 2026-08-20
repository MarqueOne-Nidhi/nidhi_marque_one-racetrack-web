import React from 'react';
import { Section } from './ui/Section';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';
import LiquidButton from './ui/LiquidButton';
import { useContactModal } from './ContactModal';

// Storage is available to anyone who books it, not to members only — the
// homepage lists it under "On your own" — so this enquires rather than joins.
export default function TheCar() {
  const openContact = useContactModal();

  return (
    <Section
      id="car"
      surface="dark"
    >
      <div className="mb-12 flex flex-col">
        <BlurFadeText
          text="YOUR CAR."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />
        <BlurFadeText
          text="YOUR PLACE."
          delay={0.15}
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mb-8"
      >
        <figure className="m-0">
          <div className="w-full aspect-[16/9] overflow-hidden rounded-sm">
            <img
              src="/assets/images/storage_bay.png"
              alt="ONE.CLUB Private Vehicle Storage Vault"
              className="w-full h-full object-cover"
            />
          </div>
          <figcaption className="mt-3 font-sans text-[0.72rem] font-light leading-[1.6] tracking-wide ink-faint max-w-measure">
            Secure, temperature-controlled storage at the club. The car waits where the track is, twenty minutes from the room you sleep in.
          </figcaption>
        </figure>
      </motion.div>

      <div className="flex justify-between items-center gap-6 flex-wrap">
        {/* Three adjectives in a row proved nothing. The fact does. */}
        <span className="font-sans text-[0.85rem] font-light leading-[1.7] ink-muted max-w-measure-sm">
          Leave the car in secure storage at the club and it is always ready trackside whenever you arrive.
        </span>
        <LiquidButton
          onClick={() => openContact('Drive', 'Club · The car')}
          variant="ghost"
          size="sm"
          className="group tracking-wider"
        >
          <span>Ask about storage</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </LiquidButton>
      </div>
    </Section>
  );
}
