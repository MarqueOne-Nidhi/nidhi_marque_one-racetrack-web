import React from 'react';
import BlurFadeText from './ui/BlurFadeText';
import LiquidButton from './ui/LiquidButton';
import { surfaceProps } from './ui/Section';
import { useContactModal } from './ContactModal';

export default function FinalScene({ onOpenModal }) {
  const openContact = useContactModal();
  return (
    <section
      id="final-scene"
      {...surfaceProps('dark')}
      className="relative w-full h-[100svh] min-h-[600px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/images/final_road.png"
          alt="Aston Martin hypercar cornering on race circuit at dusk"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-gutter pb-section-xs">
        <BlurFadeText
          text="The track is waiting."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert mb-10"
        />

        <div className="flex justify-between items-end w-full gap-6">
          <span className="font-serif text-[1.1rem] tracking-wider text-ivory/60">
            <span style={{ color: '#cc0000' }}>ONE</span>.CLUB
          </span>
          <div className="flex items-center gap-6 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => openContact('Drive')}
              className="text-[0.72rem] tracking-widest uppercase text-ivory/60 hover:text-ivory transition-colors cursor-pointer"
            >
              Book a day →
            </button>
            <LiquidButton
              onClick={onOpenModal}
              variant="ghost"
              size="sm"
              className="group tracking-wider"
            >
              <span>Join the club</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </LiquidButton>
          </div>
        </div>
      </div>
    </section>
  );
}
