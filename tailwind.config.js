/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Surface tones ───────────────────────────────────────────────
      // Two families, two steps each. The step exists so that two adjacent
      // sections of the same family never read as one continuous section.
      //
      // The step has to be big enough to see. The previous pairs measured
      // 1.08:1 (ivory → ivory-darker) and 1.06:1 (dark → dark-secondary),
      // which is below the threshold at which the eye registers a change of
      // plane, so a reader met five ivory sections in a row and saw one. The
      // pairs below measure 1.29:1 and 1.25:1.
      //
      // `secondary` and `darker` are kept for component surfaces — the
      // membership drawer and the image placeholder — and are no longer used
      // as section grounds.
      colors: {
        dark: {
          DEFAULT: "#090909",
          raised: "#22221E",
          secondary: "#121210",
        },
        ivory: {
          DEFAULT: "#F5F1E8",
          deep: "#DED5C2",
          darker: "#EDE8DE",
        },
        // The brand red. `tint` is the same hue lifted to stay legible on the
        // dark grounds — #cc0000 measures 2.71:1 on #22221E, which is under
        // the 4.5:1 small text needs. Prefer the ground-aware `.accent` class
        // over either of these anywhere the surface can change.
        brand: {
          DEFAULT: "#cc0000",
          tint: "#FF4D4D",
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Askan', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
        ultra: '0.35em',
      },
      // ─── Layout system ───────────────────────────────────────────────
      // Reading measures. Each value is the most common width already in
      // use for that tier, so adopting the scale moves the fewest sites.
      maxWidth: {
        'measure-xs': '380px', // card + panel body copy
        'measure-sm': '480px', // forms, narrow side columns
        measure: '640px', // default body copy
        'measure-lg': '720px', // lead paragraphs, centred statements
        'measure-xl': '900px', // display headlines, wide lists
        frame: '1440px', // outer page container
        drawer: '520px', // slide-over panel width (not a text measure)
      },
      spacing: {
        gutter: '6vw', // page edge inset
        col: '2vw', // gap between grid columns
        section: '14vh', // vertical rhythm between sections
        'section-sm': '12vh', // tightened rhythm for adjoining sections
        'section-xs': '8vh', // rhythm between sub-sections inside one page
      },
    },
  },
  plugins: [],
}
