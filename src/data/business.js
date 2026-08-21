// ─── Business ─────────────────────────────────────────────────────────────
//
// Copy for the Business page. This was part of home.js while both blocks sat
// on the home page; it moved out with them so the page and its words stay in
// one place.
//
// `anchor` on a block makes it a link target for the sub-navigation, declared
// beside the copy rather than in navigation.js so a renamed block is one edit.

export const BUSINESS = {
  heading: 'Business',
  intro: 'The club takes bookings, hosts events, and builds programmes with partners who bring their own idea of what to do with a circuit.',
  blocks: [
    {
      title: 'Events and race meetings',
      anchor: 'events-and-race-meetings',
      image: '/assets/images/business/events_race.jpg',
      alt: 'Starting grid and pit paddock during a premier motorsport race meeting',
      body: 'The circuit, the paddock and the club for a competitive weekend, a series round, a club meeting or a format that does not exist yet. Bring the event. We have the ground.',
    },
    {
      title: 'Launches and press',
      anchor: 'launches-and-press',
      image: '/assets/images/business/launches_press.jpg',
      alt: 'Automotive media unveiling and track press launch at Marque.One',
      body: 'Elevation, surface and straight enough to make the numbers real, with garages and hospitality for a journalist group. Marque.One works in partnership with Autocar India.',
    },
    {
      title: 'Corporate and dealer programmes',
      anchor: 'corporate-programmes',
      image: '/assets/images/business/corporate_programmes.jpg',
      alt: 'Trackside corporate hospitality terrace and fleet drive experience',
      body: 'Customer drive days, product launches, dealer training and incentive weekends, with rooms and dining on site so the programme need not break for the night.',
    },
    {
      title: 'Team testing',
      anchor: 'team-testing',
      image: '/assets/images/business/team_testing.jpg',
      alt: 'Professional racing team engineers and prototype race car in pit garage',
      body: 'Full circuit access, pit lane and garages, on an FIA-graded layout.',
    },
  ],
};

export const IN_CONFIDENCE = {
  heading: 'In confidence',
  blocks: [
    {
      title: 'Exclusive booking',
      body: 'Book the entire venue exclusively. No other guests, no public access, and complete privacy for your team or event.',
    },
    {
      title: 'Full facility access',
      body: 'Use the race track, drag strip, off-road course, and skid pan, with pit garages, workshop bays, timing gear, and race control.',
    },
    {
      title: 'Complete privacy',
      body: 'A secure, gated location away from city crowds, ensuring 100% confidentiality for private testing and events.',
    },
  ],
};
