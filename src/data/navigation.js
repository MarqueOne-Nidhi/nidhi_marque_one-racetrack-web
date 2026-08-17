// ─── Navigation ───────────────────────────────────────────────────────────
//
// The sub-navigation is grouped by the reason someone is here. Naming the
// categories is the whole point: a visitor should find their own column in one
// pass without reading every link. The categories gather the sections — they
// never hide them. Every rail entry is itself a link, and every pane is open
// to anyone who hovers it, so a driver can read the business column and a
// business visitor can read the weekend one.
//
// Each `path` is a real element id on the page it points at. Section ids live
// on the section components; sub-topic ids are declared beside their copy in
// `home.js` as `anchor`, and rendered from there — so a renamed block is one
// edit, not two files out of step.

/** Home — six ways in, from what the place is to how you book it. */
export const HOME_GROUPS = [
  {
    label: 'The place',
    path: '/#definition',
    items: [
      { label: 'What this is', path: '/#definition' },
      { label: 'How it works', path: '/#how-it-works' },
      { label: 'The circuit', path: '/#circuit' },
      { label: 'The land', path: '/#surfaces' },
      { label: 'Who comes here', path: '/#fork' },
    ],
  },
  {
    label: 'For drivers',
    path: '/#on-your-own',
    items: [
      { label: 'First time', path: '/#first-time' },
      { label: 'Instruction', path: '/#instruction' },
      { label: 'Storage', path: '/#storage' },
      { label: 'Safety', path: '/#safety' },
    ],
  },
  {
    label: 'For groups',
    path: '/#with-people',
    items: [
      { label: 'The weekend', path: '/#the-weekend' },
      { label: 'Your group, your circuit', path: '/#your-group' },
      { label: 'Not everyone drives', path: '/#not-everyone-drives' },
    ],
  },
  {
    label: 'For business',
    path: '/#business',
    items: [
      { label: 'Events and race meetings', path: '/#events-and-race-meetings' },
      { label: 'Launches and press', path: '/#launches-and-press' },
      { label: 'Corporate programmes', path: '/#corporate-programmes' },
      { label: 'Team testing', path: '/#team-testing' },
      { label: 'In confidence', path: '/#in-confidence' },
    ],
  },
  {
    label: 'For the weekend',
    path: '/#hospitality',
    items: [
      { label: 'Around the road', path: '/#hospitality' },
      { label: 'The clubhouse', path: '/#the-clubhouse' },
      { label: 'Spa and gym', path: '/#spa-and-gym' },
      { label: 'Not the lap', path: '/#weekend-not-lap' },
    ],
  },
  {
    label: 'Practical',
    path: '/#location',
    items: [
      { label: 'Getting here', path: '/#location' },
      { label: 'FAQs', path: '/#questions' },
      { label: 'Enquire', path: '/#enquiry' },
    ],
  },
];

/** The Club — what it is, what is on the ground, and the way in. */
export const CLUB_GROUPS = [
  {
    label: 'The idea',
    path: '/club#hook',
    items: [
      { label: 'Why this exists', path: '/club#hook' },
      { label: 'The club', path: '/club#club' },
    ],
  },
  {
    label: 'On the estate',
    path: '/club#drive',
    items: [
      { label: 'The drive', path: '/club#drive' },
      { label: 'Storage', path: '/club#car' },
      { label: 'The house', path: '/club#house' },
      { label: 'A day here', path: '/club#experience' },
    ],
  },
  {
    label: 'Joining',
    path: '/club#membership',
    items: [
      { label: 'Membership', path: '/club#membership' },
      { label: 'Enquire', path: '/club#final-scene' },
    ],
  },
];

export const NAV_LINKS = [
  { label: 'Home', path: '/', groups: HOME_GROUPS },
  { label: 'About', path: '/about' },
  { label: 'The Club', path: '/club', groups: CLUB_GROUPS },
];

export default NAV_LINKS;
