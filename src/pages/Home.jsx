import React from 'react';
import HomeHero from '../components/home/HomeHero';
import Definition from '../components/home/Definition';
import HowItWorks from '../components/home/HowItWorks';
import Circuit from '../components/home/Circuit';
import HospitalityShowcase from '../components/home/HospitalityShowcase';
import Location from '../components/home/Location';

// ─── Temporarily hidden ───────────────────────────────────────────────────
//
// Seven sections are held back from the home page. The components and their
// copy in data/home.js are untouched. Uncomment the import and the element
// below to bring one back. Two things must be re-checked when they return:
//
//   1. The surface run. Sections may not touch a section carrying the same
//      surface value (see the surface table in ui/Section.jsx). The page now
//      runs dark, light, dark, light and then the footer's dark-raised, so
//      anything reinstated has to alternate against its new neighbours.
//   2. The sub-navigation. HOME_GROUPS in data/navigation.js was trimmed to
//      the sections that still render; the removed groups are listed there.
//
// Business and In confidence are not in this list. They did not get hidden;
// they moved to pages/Business.jsx and are live there. Hospitality is not in
// it either: HospitalityShowcase renders that content under the circuit now,
// and components/home/Hospitality.jsx is the earlier grid version of it.
//
// import Surfaces from '../components/home/Surfaces';
// import Fork from '../components/home/Fork';
// import OnYourOwn from '../components/home/OnYourOwn';
// import WithPeople from '../components/home/WithPeople';
// import Safety from '../components/home/Safety';
// import Questions from '../components/home/Questions';
// import Enquiry from '../components/home/Enquiry';

export default function Home() {
  return (
    <div className="w-full">
      <HomeHero />
      <Definition />
      <HowItWorks />
      <Circuit />
      <HospitalityShowcase />
      <Location />
      {/* <Surfaces />       Five ways to use the land */}
      {/* <Fork />           Who comes here */}
      {/* <OnYourOwn />      On your own */}
      {/* <WithPeople />     With people */}
      {/* <Safety />         Safety */}
      {/* <Questions />      FAQs */}
      {/* <Enquiry />        Come and see it. */}
    </div>
  );
}
