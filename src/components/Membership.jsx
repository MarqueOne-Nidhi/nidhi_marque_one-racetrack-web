import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';
import LiquidButton from './ui/LiquidButton';
import { surfaceProps } from './ui/Section';

export default function Membership({ onOpenModal }) {
  return (
    <section
      id="membership"
      {...surfaceProps('dark-raised')}
      className="w-full min-h-[100svh] py-section px-gutter flex flex-col justify-center items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-measure-lg flex flex-col items-center gap-6"
      >
        <span className="text-[0.7rem] tracking-widest uppercase text-ivory/60">
          MEMBERSHIP
        </span>

        <BlurFadeText
          text="Come closer."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />

        <div className="flex gap-6 font-serif text-[clamp(1.8rem,3.5vw,3rem)] font-light text-ivory/70 my-6">
          <span>Drive.</span>
          <span>Belong.</span>
          <span>Stay.</span>
        </div>

        {/* The single sentence that separates the two paths. Without it the
            page reads as though membership were the price of entry, which the
            homepage spends three sections saying it is not. */}
        <p className="font-sans text-[0.9rem] font-light leading-[1.7] text-ivory/70 max-w-measure">
          Standing access to the circuit, the garages and the rooms, on any day the circuit is live. Membership is not what lets you drive here. It is what removes the booking.
        </p>

        <div className="flex flex-col items-center gap-4">
          <LiquidButton onClick={onOpenModal}>
            Request membership →
          </LiquidButton>
          <Link
            to="/contact?type=drive"
            className="text-[0.72rem] tracking-widest uppercase text-ivory/50 hover:text-ivory transition-colors mt-2"
          >
            Not a member? Book a day →
          </Link>
          <a
            href="mailto:club.one@marque.one"
            className="text-[0.72rem] tracking-widest uppercase text-ivory/40 hover:text-ivory transition-colors"
          >
            Membership enquiries
          </a>
        </div>
      </motion.div>
    </section>
  );
}
