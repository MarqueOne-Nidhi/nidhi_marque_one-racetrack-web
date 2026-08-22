import React from 'react';
import ClubIntro from '../components/ClubIntro';
import Hero from '../components/Hero';
import TheHook from '../components/TheHook';
import TheClub from '../components/TheClub';
import TheDrive from '../components/TheDrive';
import TheCar from '../components/TheCar';
import TheHouse from '../components/TheHouse';
import TheExperience from '../components/TheExperience';
import Membership from '../components/Membership';
import FinalScene from '../components/FinalScene';

// The page used to run its own hash-scrolling effect on mount, a second
// implementation of what ScrollToTop already does for every route, racing it
// on a 100ms timer. Both aimed at the same section, so the duplication was
// invisible rather than harmless.
export default function Club({ onOpenModal }) {
  return (
    <div className="club-page relative min-h-screen bg-dark text-ivory">
      {/* Handwritten Brand Signature Opening for ONE.CLUB */}
      <ClubIntro />

      <main>
        <Hero onOpenModal={onOpenModal} />
        <TheHook />
        <TheClub />
        {/* Driving, storage and rooms need no membership, so these three send
            visitors to the booking form and no longer take onOpenModal. */}
        <TheDrive />
        <TheCar />
        <TheHouse />
        <TheExperience />
        <Membership onOpenModal={onOpenModal} />
        <FinalScene onOpenModal={onOpenModal} />
      </main>
    </div>
  );
}
