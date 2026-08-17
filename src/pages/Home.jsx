import React from 'react';
import HomeHero from '../components/home/HomeHero';
import Definition from '../components/home/Definition';
import HowItWorks from '../components/home/HowItWorks';
import Circuit from '../components/home/Circuit';
import Surfaces from '../components/home/Surfaces';
import Fork from '../components/home/Fork';
import OnYourOwn from '../components/home/OnYourOwn';
import WithPeople from '../components/home/WithPeople';
import Business from '../components/home/Business';
import InConfidence from '../components/home/InConfidence';
import Hospitality from '../components/home/Hospitality';
import Safety from '../components/home/Safety';
import Location from '../components/home/Location';
import Questions from '../components/home/Questions';
import Enquiry from '../components/home/Enquiry';

export default function Home() {
  return (
    <div className="w-full">
      <HomeHero />
      <Definition />
      <HowItWorks />
      <Circuit />
      <Surfaces />
      <Fork />
      <OnYourOwn />
      <WithPeople />
      <Business />
      <InConfidence />
      <Hospitality />
      <Safety />
      <Location />
      <Questions />
      <Enquiry />
    </div>
  );
}
