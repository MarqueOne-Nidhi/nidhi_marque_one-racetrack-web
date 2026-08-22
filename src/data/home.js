// ─── Homepage Copy ─── All 14 sections in one file ───
// Edit words here, not in fourteen components.

export const HERO = {
  // There is no badge above the headline any more. It read MOTORSPORT ESTATE
  // · TWO HOURS FROM BENGALURU, which the sub already says in full a line
  // below it. The eye met the same positioning twice before reaching a
  // single new fact.
  //
  // Ogilvy: five times as many people read the headline as read anything
  // else, so it has to carry the promise, not just the mood. Two clauses now
  // rather than three: proof, then the benefit that makes it personal.
  //
  // The <br> is a hard break, not a suggestion: the two clauses are set one
  // per line at every width, rather than being left to wrap wherever the
  // viewport happens to put them. BlurFadeText turns the token into a
  // full-width flex spacer; see the note there for why a real <br> will not
  // do the job.
  //
  // Earlier versions, kept in case one is wanted back:
  //   'An FIA-graded circuit. Your car.'
  //   'An FIA-graded circuit. Your own car. No licence required.'
  //   '219 acres. Drive all of it, or none of it.'
  headline: 'FIA graded circuit. <br> Your car.',
  sub: 'A motorsport club two hours from Bengaluru. Open to drivers, to groups, to business, and to anyone who simply wants the weekend.',
  cta1: 'Plan a visit',
  cta2: 'For business',
};

export const DEFINITION = {
  // A name and its descriptor, set as a lockup rather than one long line: the
  // brand carries the heading, and what it is sits under it. The nav rail
  // uses the "What Marque.One is" label, since rail entries are allowed to
  // differ from the heading they point at, the way "How it works" points at
  // "How a day works".
  heading: 'Marque.One',
  subheading: 'Motorsport club',
  body: [
    'A motorsport club across 300+ acres: a circuit, a drag strip, an off-road course, a skid pan, a wet handling track, and a clubhouse built to make a weekend of it.',
    'You do not need a membership, a licence or a fast car. You need a day, and something you want to do with it.',
    'Members hold standing access. Everyone else books.',
  ],
};

// Answers "how does this work" before the visitor has to ask for it. The
// footnote is the objection-killer that used to sit in ON_YOUR_OWN, six
// sections down — it does more work here, where the doubt actually arises.
//
// TODO — confirm with client before launch: step 02 states that a price is
// quoted before commitment. That is a business commitment, not a copy choice.
export const HOW_IT_WORKS = {
  heading: 'How a day works',
  steps: [
    {
      n: '01',
      title: 'Tell us what you want',
      body: 'Drive, stay, or bring a group. One form. No membership application.',
    },
    {
      n: '02',
      title: 'We confirm a date',
      body: 'The date, the price and what to bring. In writing, before you commit.',
    },
    {
      n: '03',
      title: 'Arrive and drive',
      body: 'A road-legal car and a driving licence. Briefing, instruction and marshals are on the day.',
    },
  ],
  footnote: 'No membership required. No competition licence. No race car.',
};

export const CIRCUIT_COPY = {
  heading: 'The circuit',
  body: [
    'The track climbs and drops twenty-five metres either side of level. It goes blind over crests. It is never flat and never twice the same.',
    'The drag strip runs on the circuit itself: a full kilometre from a standing start, timed to the thousandth.',
    'An FIA-graded circuit, with race-grade asphalt run-off, permanent barriers and full trackside electronics. Designed by Driven International.',
  ],
};

export const SURFACES = {
  heading: 'Five ways to use the land',
  cards: [
    {
      title: 'The circuit and the strip',
      body: 'No traffic, no oncoming, no speed limit. Standing start, timed to the thousandth.',
    },
    {
      title: 'Off-road and rock crawl',
      body: 'A course cut through natural rock and elevation. Low range, low speed, no margin.',
    },
    {
      title: 'Skid pan',
      body: 'A deliberately low-grip surface. Where the limit of the car reveals itself at a speed that cannot punish you for finding it.',
    },
    {
      title: 'Kick plate',
      body: 'A plate that throws the car sideways without warning. First you learn to catch it. Then you learn to catch it every time.',
    },
    {
      title: 'Wet handling track',
      body: 'The same instruction, under water.',
    },
  ],
};

export const FORK = {
  heading: 'Who comes here',
  panels: [
    {
      title: 'On your own',
      body: 'Your car, the circuit, and someone to teach you how to use it.',
      anchor: 'on-your-own',
    },
    {
      title: 'With people',
      body: 'A weekend for a group, with the site closed behind you.',
      anchor: 'with-people',
    },
    {
      title: 'For business',
      body: 'Events, launches, hospitality, and days built with us.',
      anchor: 'business',
    },
    {
      title: 'In confidence',
      body: 'Manufacturer testing, sole use, gate shut.',
      anchor: 'in-confidence',
    },
  ],
};

// `anchor` on a block makes it a link target for the sub-navigation. It lives
// here, next to the copy, so renaming a block and orphaning a menu link is one
// edit rather than two files apart.
export const ON_YOUR_OWN = {
  heading: 'On your own',
  blocks: [
    {
      title: 'First time',
      anchor: 'first-time',
      body: 'Most people who drive here have never been on a circuit. That is the ordinary case, not the exception. You bring a road-legal car and a driving licence. Everything else is taught on the day.',
    },
    {
      title: 'Instruction',
      anchor: 'instruction',
      body: 'A motorsport academy at the club. Most drivers who arrive wanting to be quick discover they were never taught how. A fault that answers to a weekend.',
    },
    {
      title: 'Storage',
      anchor: 'storage',
      body: 'Secure, temperature-controlled storage on site. The car waits where the track is.',
    },
  ],
  callout: 'No membership required. No competition licence. No race car.',
};

export const WITH_PEOPLE = {
  heading: 'With people',
  blocks: [
    {
      title: 'The weekend',
      anchor: 'the-weekend',
      body: 'Arrive Friday. Drive Saturday and Sunday. Sleep minutes from the car on site.',
    },
    {
      title: 'Your group, your circuit',
      anchor: 'your-group',
      body: 'Take the circuit for the day with the garages, the marshals and the gate closed behind you. Car clubs, birthdays, reunions, anything that improves for being held somewhere nobody else can reach.',
    },
    {
      title: 'Not everyone drives',
      anchor: 'not-everyone-drives',
      body: 'Some of the party will want the pool and the table instead. That is a complete visit here, not a consolation.',
    },
  ],
};

// BUSINESS and IN_CONFIDENCE used to live here. They now render on the
// Business page, not the home page, so their copy moved with them to
// data/business.js, one file per page it appears on.

export const HOSPITALITY = {
  heading: 'Around the circuit',
  intro: 'Forty rooms above the circuit, each one different, each one facing either the mountains or the track.',
  blocks: [
    {
      title: 'The clubhouse',
      anchor: 'the-clubhouse',
      body: 'A pool that looks out over the circuit. Dining that runs long. Somewhere to sit and watch the track without standing beside it.',
    },
    {
      title: 'Spa and gym',
      anchor: 'spa-and-gym',
      body: 'Treatment rooms, and a gym that keeps its hours whether or not anyone is driving.',
    },
    {
      title: 'Coming for the weekend, not the lap',
      anchor: 'weekend-not-lap',
      body: 'Guests who never sit in a car have a full weekend here. The circuit is the reason the place exists. It is not the only reason to arrive.',
    },
  ],
};

// Cards for the hospitality carousel. One per image in the hospitality set,
// in the order they turn. The line is what the right-hand column reads out
// while that card is at the front, so each one has to stand alone.
export const HOSPITALITY_CARDS = [
  {
    key: 'hospitalityClubhouse',
    title: 'The clubhouse',
    line: 'It stands above the circuit, so the track can be watched without standing beside it.',
  },
  {
    key: 'hospitalityPool',
    title: 'The pool',
    line: 'It looks out over the lap. Nobody has to go near the track to use it.',
  },
  {
    key: 'hospitalityDining',
    title: 'Dining',
    line: 'A table that runs long, for people who came to stay rather than to leave at six.',
  },
  {
    key: 'hospitalitySpa',
    title: 'Spa and gym',
    line: 'Treatment rooms, and a gym that keeps its hours whether or not anyone is driving.',
  },
  {
    key: 'hospitalityWeekend',
    title: 'The rooms',
    line: 'Each one different. Each one faces either the mountains or the track.',
  },
];

export const SAFETY = {
  heading: 'Safety',
  body: [
    'Race-grade asphalt run-off, permanent barriers and marshalled sessions throughout.',
    'A medical facility operates at the club, with trained staff on site whenever the circuit is live.',
  ],
};

export const LOCATION = {
  heading: 'Getting here',
  body: [
    'Two hours by road from Kempegowda International Airport, Bengaluru.',
    'Far enough from a city to be quiet. Close enough to reach before noon.',
  ],
  // The pin, from the place's own Google listing. `share` is the short link
  // as issued, which is what a visitor should be handed for directions;
  // lat/lng are what the embedded frame is centred on.
  map: {
    label: 'Marque.One Race Track',
    lat: 13.8753038,
    lng: 78.1197967,
    zoom: 14,
    share: 'https://maps.app.goo.gl/cJGz9f4hzapxQpeZ9',
  },
};

export const FAQ = {
  groups: [
    {
      title: 'Coming to drive',
      items: [
        { q: 'Do I need to be a member?', a: 'No. Members hold standing access; everyone else books a day.' },
        { q: 'Do I need racing experience?', a: 'No. Most people who drive here have never been on a circuit.' },
        { q: 'Do I need a competition licence?', a: 'No. A valid driving licence is enough.' },
        { q: 'What car do I need?', a: 'A road-legal car in sound mechanical condition. Not a fast one. A normal car driven properly teaches more than a fast car driven badly.' },
        { q: 'Is instruction available?', a: 'There is a motorsport academy at the club.' },
        { q: 'How long is the circuit?', a: '5.5 kilometres, with a 1000-metre drag strip integrated into the lap and ±25 metres of elevation.' },
        { q: 'What else is there besides the circuit?', a: 'An off-road and rock-crawl course, a skid pan, a kick plate and a wet handling track. The drag strip runs on the circuit itself.' },
        { q: 'Can I keep my car here?', a: 'Secure, temperature-controlled storage is on site.' },
        { q: 'Is there medical cover?', a: 'A medical facility operates at the club, staffed whenever the circuit is live.' },
      ],
    },
    {
      title: 'Coming for the weekend',
      items: [
        { q: 'Can I come without driving?', a: 'Yes. Rooms, pool, spa, gym and dining make a full weekend on their own.' },
        { q: 'Can I bring people who don\'t drive?', a: 'Yes. It is a complete visit for them, not a wait.' },
        { q: 'Can I stay overnight?', a: 'Forty rooms at the club, above the circuit.' },
        { q: 'Is there somewhere to watch?', a: 'Viewing from the clubhouse and the pool, across the circuit.' },
      ],
    },
    {
      title: 'Business',
      items: [
        { q: 'Can we hold an event here?', a: 'Yes: race meetings, launches, corporate programmes and formats built with us.' },
        { q: 'Can the site be taken privately?', a: 'Yes. Sole use means one client at the club for the duration.' },
        { q: 'What is available for testing?', a: 'Circuit, strip, off-road course, skid pan and wet handling track, with trackside timing and electronics.' },
        { q: 'Are there garages and workshop space?', a: 'Pit garages, workshop space and race control are on site.' },
        { q: 'Can a programme run across several days?', a: 'Rooms and dining are at the club.' },
      ],
    },
  ],
};

export const ENQUIRY = {
  heading: 'Come and see it.',
  // Was "We will tell you how it works" — which deferred the answer until
  // after an enquiry. HOW_IT_WORKS answers it up front now, so this promises
  // the thing the visitor still doesn't have: dates and a price.
  sub: 'Tell us what you intend to do. We reply with dates and a price.',
  toggles: ['Drive', 'Stay', 'Business'],
  email: 'project.motorclub@marque.one',
};
