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

/**
 * Home: the sections currently on the page.
 *
 * The home page is running a reduced set of sections, so this list is reduced
 * to match: a rail entry must point at an id that actually renders. What is
 * left is one group of three, because everything else on the page is hidden.
 * Gone with their sections: For drivers (#on-your-own, #first-time,
 * #instruction, #storage, #safety), For groups (#with-people, #the-weekend,
 * #your-group, #not-everyone-drives), For the weekend
 * (#the-clubhouse, #spa-and-gym, #weekend-not-lap) and Practical (#questions,
 * #enquiry), plus the individual entries The land (#surfaces) and
 * Who comes here (#fork). Restore them here when the matching sections come
 * back in pages/Home.jsx.
 *
 * The old For business group is the one that is not coming back: that content
 * now has its own page, and its links live in BUSINESS_GROUPS below.
 */
/**
 * Home: the sections currently on the page.
 * Displayed as a direct list of section links without a side category rail.
 */
export const HOME_ITEMS = [
  { label: 'What Marque.One is', path: '/#definition' },
  { label: 'How it works', path: '/#how-it-works' },
  { label: 'The circuit', path: '/#circuit' },
  { label: 'Around the circuit', path: '/#hospitality' },
  { label: 'Getting here', path: '/#location' },
];

export const HOME_GROUPS = [
  {
    label: 'The place',
    path: '/#definition',
    items: HOME_ITEMS,
  },
];

/** Business: What we host, In confidence, and Enquiry. */
export const BUSINESS_ITEMS = [
  { label: 'What we host', path: '/business#business' },
  { label: 'In confidence', path: '/business#in-confidence' },
  { label: 'Enquiry', path: '/business#enquiry' },
];

export const BUSINESS_GROUPS = [
  {
    label: 'What we host',
    path: '/business#business',
    items: BUSINESS_ITEMS,
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
    label: 'At the club',
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
  { label: 'Home', path: '/', items: HOME_ITEMS },
  { label: 'Business', path: '/business', items: BUSINESS_ITEMS },
  { label: 'About', path: '/about' },
  { label: 'The Club', path: '/club', groups: CLUB_GROUPS },
];

export default NAV_LINKS;
