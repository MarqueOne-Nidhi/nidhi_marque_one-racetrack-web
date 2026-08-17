import React from 'react';
import { Section } from './ui/Section';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';

export default function TheHook() {
  return (
    <Section
      id="hook"
      surface="light"
    >
      <div className="mb-8">
        <BlurFadeText
          text="Some cars deserve more."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />
        {/* Was a second printing of the club's name — already on the logo, the
            hero badge and the final scene. The line is worth more carrying a
            benefit than repeating the masthead. */}
        <p className="font-serif text-[clamp(1.6rem,3.5vw,2.8rem)] font-light opacity-80 mt-4 mb-6">
          Storage for the car, a circuit to use it on, and a room above both.
        </p>
        <a
          href="#club"
          className="inline-flex items-center gap-2 text-[0.82rem] tracking-wider uppercase text-dark hover:translate-x-1 transition-transform group"
        >
          <span>See what's inside</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="mt-16"
      >
        <figure className="m-0">
          <div className="w-full aspect-[16/9] overflow-hidden rounded-sm group">
            <img
              src="/assets/images/hero_club_moment.png"
              alt="ONE.CLUB Private Clubhouse Exterior"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
            />
          </div>
          <figcaption className="mt-3 font-sans text-[0.72rem] font-light leading-[1.6] tracking-wide ink-faint max-w-measure">
            The clubhouse stands above the circuit. Members arrive without booking; everyone else books a day.
          </figcaption>
        </figure>
      </motion.div>
    </Section>
  );
}
