import React from 'react';

/**
 * ─── Paper ────────────────────────────────────────────────────────────────
 *
 * A sheet of stock for a panel to be printed on. Two grades:
 *
 *   premium  a warm white cotton rag, for the contact form
 *   luxury   a deep petrol board, for the club's membership request
 *
 * Built the way the reference does it, with feTurbulence rather than a noise
 * PNG. That is not only to avoid hosting a file: a tile has one fixed
 * resolution, so on a 2x display it either doubles in size or gets resampled
 * and turns to mush, while a filter is resolution independent and costs
 * nothing to retune.
 *
 * What separates this from grey noise over a flat colour is that it is three
 * passes, not one:
 *
 *   fibre     coarse, low frequency, the cloudiness of pulp in the sheet
 *   tooth     fine, high frequency, the surface the ink would actually sit on
 *   light     a broad raking highlight with the edges falling into shade
 *
 * All three blend rather than paint. `soft-light` and `overlay` push a pixel
 * up or down from whatever is under it, so the base tone is preserved exactly
 * and the sheet does not go grey. Painting mid-grey noise at 8 per cent over
 * ivory quietly darkens the whole panel, which is the usual tell.
 *
 * The sheet publishes the site's surface variables, so anything inside it
 * reads --ink, --rule and the rest and lands correctly on the stock without
 * knowing which grade it is standing on. See ui/Section.jsx for the same
 * contract applied to page sections.
 */

const noise = (freq, octaves, contrast) => {
  // feTurbulence writes independent noise into R, G, B *and* A. Used raw that
  // is coloured noise with mottled transparency, and at a low frequency it
  // reads as soft rainbow staining rather than paper. The colour matrix takes
  // the luminance of the noise into all three channels and forces alpha to 1,
  // which is what turns it into the grey speckle this actually wants.
  //
  // color-interpolation-filters='sRGB' because the SVG default is linearRGB,
  // where the same numbers come out considerably lighter.
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>` +
    `<filter id='n' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${freq}' ` +
    `numOctaves='${octaves}' stitchTiles='stitch' result='t'/>` +
    `<feColorMatrix in='t' type='matrix' values='` +
    `0.2126 0.7152 0.0722 0 0 ` +
    `0.2126 0.7152 0.0722 0 0 ` +
    `0.2126 0.7152 0.0722 0 0 ` +
    `0 0 0 0 1' result='g'/>` +
    // fractalNoise clusters tightly around mid grey, and mid grey is the
    // no-op value for both blend modes used here, so the raw output leaves an
    // almost perfectly flat sheet. This stretches the values away from the
    // centre: slope about the midpoint, so the mean is untouched and only the
    // deviation grows.
    `<feComponentTransfer in='g'>` +
    `<feFuncR type='linear' slope='${contrast}' intercept='${(1 - contrast) / 2}'/>` +
    `<feFuncG type='linear' slope='${contrast}' intercept='${(1 - contrast) / 2}'/>` +
    `<feFuncB type='linear' slope='${contrast}' intercept='${(1 - contrast) / 2}'/>` +
    `</feComponentTransfer>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const PAPERS = {
  // Cotton rag. Warm rather than optically white, which is what separates a
  // good sheet from copier paper.
  premium: {
    tone: 'light',
    base: '#F6F3EC',
    raised: '#EAE5DA',
    ink: '#14140F',
    inkMuted: 'rgba(20, 20, 15, 0.72)',
    inkFaint: 'rgba(20, 20, 15, 0.46)',
    rule: 'rgba(20, 20, 15, 0.16)',
    accent: '#cc0000',
    // Cold-press tooth: high frequency, one octave. Octaves stack progressively
    // coarser copies, so adding them to a grain layer turns speckle into cloud.
    tooth: { freq: 0.9, oct: 1, contrast: 2.6, size: 170, opacity: 0.3, blend: 'overlay' },
    // A whisper of thickness variation under it. Still well above the
    // frequency that produced staining, and at a fraction of the strength.
    fibre: { freq: 0.14, oct: 3, contrast: 1.7, size: 420, opacity: 0.12, blend: 'overlay' },
    light: 0.34,
    vignette: 0.1,
  },

  // Deep petrol board. Near black at a glance, with enough cool in it that a
  // warm ivory reads as warm against it.
  luxury: {
    tone: 'dark',
    base: '#141D22',
    raised: '#1C272D',
    ink: '#F2EDE3',
    inkMuted: 'rgba(242, 237, 227, 0.74)',
    inkFaint: 'rgba(242, 237, 227, 0.5)',
    rule: 'rgba(242, 237, 227, 0.16)',
    accent: '#FF4D4D',
    // Heavier on dark stock: a dark board shows its texture as highlights
    // catching the tops of the fibres, so it needs `overlay`, which pushes
    // further from the base than soft-light in both directions.
    tooth: { freq: 0.85, oct: 1, contrast: 2.6, size: 180, opacity: 0.34, blend: 'overlay' },
    fibre: { freq: 0.12, oct: 3, contrast: 1.7, size: 460, opacity: 0.16, blend: 'overlay' },
    light: 0.1,
    vignette: 0.4,
  },
};

export default function PaperSurface({
  variant = 'premium',
  className = '',
  innerClassName = '',
  style,
  children,
}) {
  const p = PAPERS[variant] ?? PAPERS.premium;

  const layer = (spec) => ({
    backgroundImage: noise(spec.freq, spec.oct, spec.contrast),
    backgroundSize: `${spec.size}px ${spec.size}px`,
    opacity: spec.opacity,
    mixBlendMode: spec.blend,
  });

  return (
    <div
      data-tone={p.tone}
      // `isolate` keeps the blending inside the sheet. Without it the passes
      // blend against whatever is behind the panel, and the texture changes
      // depending on what the sheet happens to be lying on.
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        backgroundColor: p.base,
        color: p.ink,
        '--surface': p.base,
        '--surface-raised': p.raised,
        '--ink': p.ink,
        '--ink-muted': p.inkMuted,
        '--ink-faint': p.inkFaint,
        '--rule': p.rule,
        '--accent': p.accent,
        ...style,
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={layer(p.fibre)} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={layer(p.tooth)} />

      {/* The light. Raking from above rather than centred, the way a sheet on
          a desk is lit, with the far edges falling away. soft-light so it
          shapes the stock instead of washing it out. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            `radial-gradient(ellipse 120% 90% at 50% 8%,` +
            ` rgba(255,255,255,${p.light}) 0%,` +
            ` rgba(255,255,255,0) 55%,` +
            ` rgba(0,0,0,${p.vignette}) 100%)`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* A single hairline of light along the top edge: the thickness of the
          sheet catching the same light. It is what stops the panel reading as
          a rectangle of colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            p.tone === 'dark'
              ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.16), transparent)'
              : 'linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)',
        }}
      />

      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </div>
  );
}
