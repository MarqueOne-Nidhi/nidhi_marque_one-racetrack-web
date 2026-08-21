// ─── Navigation ───────────────────────────────────────────────────────────
//
// One entry per route, and the sections behind it. The menu itself is Base UI
// through components/ui/navigation-menu; this file only says what is in it.
//
// Two shapes, because two of the routes are short and one is not:
//
//   items    a flat list, for a page whose sections need no sorting
//   groups   named groups, for /club, which has enough sections that a flat
//            list stops being scannable
//
// Navbar reads either through one helper, so a route can change shape by
// changing this file alone.
//
// Each `path` is a real element id on the page it points at. Section ids live
// on the section components; sub-topic ids are declared beside their copy in
// `home.js` as `anchor`, and rendered from there, so a renamed block is one
// edit rather than two files drifting apart.

/**
 * Home: the sections currently on the page, which is a reduced set.
 *
 * A menu entry must point at an id that actually renders, so this list is
 * trimmed to match. Gone with their sections: For drivers (#on-your-own,
 * #first-time, #instruction, #storage, #safety), For groups (#with-people,
 * #the-weekend, #your-group, #not-everyone-drives), For the weekend
 * (#the-clubhouse, #spa-and-gym, #weekend-not-lap), Practical (#questions,
 * #enquiry), The land (#surfaces) and Who comes here (#fork). Restore them
 * here when the matching sections come back in pages/Home.jsx.
 *
 * The old For business group is the one that is not coming back: that content
 * has its own route now, and its links are BUSINESS_ITEMS below.
 */
export const HOME_ITEMS = [
  { label: 'What Marque.One is', path: '/#definition' },
  { label: 'How it works', path: '/#how-it-works' },
  { label: 'The circuit', path: '/#circuit' },
  { label: 'Around the circuit', path: '/#hospitality' },
  { label: 'Getting here', path: '/#location' },
];

/** Business: what we host, the terms, and the way to ask. */
export const BUSINESS_ITEMS = [
  { label: 'What we host', path: '/business#business' },
  { label: 'In confidence', path: '/business#in-confidence' },
  { label: 'Enquiry', path: '/business#enquiry' },
];

/** The Club: what it is, what is on the ground, and the way in. */
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
