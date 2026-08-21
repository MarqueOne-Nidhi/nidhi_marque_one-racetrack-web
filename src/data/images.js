// ─── Image Manifest ───
// Maps every image slot on the estate site.
// Home, About, and Contact pages use dedicated, distinct images
// separated entirely from the Club page visuals.

const IMAGES = {
  // §1 Hero
  homeHero: {
    src: '/assets/videos/home_lambo.mp4',
    type: 'video',
    aspect: '16/9',
    alt: 'Aerial motion view of Marque One motorsport club',
    section: 'HomeHero',
  },

  // §3 Circuit
  circuitTrace: {
    src: '/assets/images/estate/home_circuit_layout_1786898968534.png',
    aspect: '21/9',
    alt: 'Circuit layout: 5.2 km FIA-graded layout and elevation contours',
    section: 'Circuit',
  },

  // §4 Surfaces
  surfaceCircuit: {
    src: '/assets/images/estate/surface_circuit_strip_1786899961622.png',
    aspect: '3/2',
    alt: 'Circuit and 1000m integrated drag strip',
    section: 'Surfaces',
  },
  surfaceOffroad: {
    src: '/assets/images/estate/surface_offroad_crawl_1786899978673.png',
    aspect: '3/2',
    alt: 'Off-road and rock-crawl course',
    section: 'Surfaces',
  },
  surfaceSkidpan: {
    src: '/assets/images/estate/surface_skidpan_drift_1786899998994.png',
    aspect: '3/2',
    alt: 'Skid pan: low-grip surface drift control',
    section: 'Surfaces',
  },
  surfaceKickplate: {
    src: '/assets/images/estate/surface_kickplate_test_1786900022264.png',
    aspect: '3/2',
    alt: 'Kick plate: lateral destabilisation training',
    section: 'Surfaces',
  },
  surfaceWetTrack: {
    src: '/assets/images/estate/surface_wet_handling_1786900394783.png',
    aspect: '3/2',
    alt: 'Wet handling track with sprinklers',
    section: 'Surfaces',
  },

  // §6 On your own
  onYourOwn: {
    src: '/assets/images/estate/home_on_your_own_1786900631841.png',
    aspect: '16/9',
    alt: 'Single driver instruction in pit lane garage',
    caption: 'Most people who drive here have never been on a circuit before. A road-legal car and a driving licence are the whole entry requirement.',
    section: 'OnYourOwn',
  },

  // §7 With people
  withPeople: {
    src: '/assets/images/estate/home_with_people_1786900653081.png',
    aspect: '16/9',
    alt: 'Group of friends on trackside terrace at twilight',
    caption: 'Take the club for a weekend with the garages, the marshals and the gate closed behind you.',
    section: 'WithPeople',
  },

  // §10 Hospitality
  hospitalityClubhouse: {
    src: '/assets/images/estate/home_hospitality_clubhouse_1786900669787.png',
    aspect: '16/9',
    alt: 'Modern clubhouse facing circuit and skyline',
    caption: 'The clubhouse stands above the circuit. You can watch the track from the pool without standing beside it.',
    section: 'Hospitality',
  },
  hospitalityPool: {
    src: '/assets/images/estate/home_hospitality_pool_1786900861087.png',
    aspect: '4/3',
    alt: 'Infinity pool overlooking winding circuit',
    section: 'Hospitality',
  },
  hospitalityDining: {
    src: '/assets/images/estate/home_hospitality_dining_1786902150737.png',
    aspect: '4/3',
    alt: 'Contemporary trackside fine dining',
    section: 'Hospitality',
  },
  hospitalitySpa: {
    src: '/assets/images/estate/home_hospitality_spa_1786950697112.jpg',
    aspect: '4/3',
    alt: 'Spa and wellness gym with scenic views',
    section: 'Hospitality',
  },
  hospitalityWeekend: {
    src: '/assets/images/estate/home_hospitality_weekend_1786950925476.jpg',
    aspect: '4/3',
    alt: 'Luxury guest suite overlooking the circuit at sunset',
    section: 'Hospitality',
  },

  // §12 Location
  locationMap: {
    src: '/assets/images/estate/home_circuit_layout_1786898968534.png',
    aspect: '16/9',
    alt: 'Location map: 2 hours from Bengaluru airport',
    // Contact.jsx sets LOCATION.body beside this same image, so the caption is
    // used on the homepage only — printing both would say the distance twice.
    caption: 'Two hours by road from Kempegowda International Airport. The club keeps no public gate, so nobody arrives by accident.',
    section: 'Location',
  },

  // About page header
  aboutHeader: {
    src: '/assets/images/estate/home_hospitality_clubhouse_1786900669787.png',
    aspect: '21/9',
    alt: 'The Marque One club grounds',
    caption: '219 acres: a 5.2 km FIA-graded circuit, a 1000-metre drag strip integrated into the lap, and the clubhouse above them.',
    section: 'About',
  },
};

export default IMAGES;
