import React, { useEffect } from 'react';
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

export default function Club({ onOpenModal }) {
  // Ensure we can handle hash scrolling within the Club page
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const top = el.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top, behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

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
