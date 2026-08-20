import React from 'react';
import { Section } from './ui/Section';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';

export default function TheClub() {
  const cards = [
    { title: 'ARRIVE', img: '/assets/images/arrive_club.png' },
    { title: 'MEET', img: '/assets/images/meet_club.png' },
    { title: 'STAY', img: '/assets/images/stay_club.png' },
  ];

  return (
    <Section
      id="club"
      surface="dark"
    >
      <div className="mb-16">
        <span className="block text-[0.7rem] tracking-widest uppercase ink-faint mb-2">
          THE CLUB
        </span>
        {/* "Come closer." belongs to the membership section, where the ask is.
            Running it here as well spent the line twice and said nothing
            either time. This keeps the cadence and states the member benefit. */}
        <BlurFadeText
          text="Come as often as you like."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />

        <p className="font-sans text-[0.9rem] font-light leading-[1.7] ink-muted max-w-measure mt-6">
          Arrive without booking. For members the garages, the rooms and the track are open on any day the circuit is live.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-col mb-12">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.15 }}
            className="relative aspect-[3/4] overflow-hidden rounded-sm group"
          >
            <img
              src={card.img}
              alt={card.title}
              className="w-full h-full object-cover brightness-[0.85] group-hover:brightness-100 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            <div className="absolute bottom-8 left-8 z-10">
              <span className="text-[0.72rem] tracking-[0.3em] uppercase text-ivory drop-shadow-md">
                {card.title}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <a
          href="#house"
          className="inline-flex items-center gap-2 text-[0.82rem] tracking-wider uppercase text-ivory hover:translate-x-1 transition-transform group"
        >
          <span>Explore the club</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </Section>
  );
}
