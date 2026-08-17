import React from 'react';

/**
 * Layout primitives.
 *
 * Every page section was independently re-declaring the same three raw values —
 * a 6vw gutter, 14vh of vertical rhythm, a 1440px frame — and inventing its own
 * reading measure, which is how eleven different max-widths accumulated. These
 * components give that structure one name so sections stop drifting off it.
 *
 *   <Section tone="light" measure="lg" className="bg-ivory text-dark">
 *     <Grid>
 *       <Col span={7}>…</Col>
 *       <Col span={5}>…</Col>
 *     </Grid>
 *   </Section>
 */

// Full literal class strings — Tailwind's scanner can't see interpolated names.
const MEASURE = {
  xs: 'max-w-measure-xs',
  sm: 'max-w-measure-sm',
  md: 'max-w-measure',
  lg: 'max-w-measure-lg',
  xl: 'max-w-measure-xl',
  frame: 'max-w-frame',
  full: '',
};

const RHYTHM = {
  default: 'py-section',
  tight: 'py-section-sm',
  none: '',
};

/**
 * ─── Surfaces ───────────────────────────────────────────────────────────
 *
 * Four grounds a section may stand on: two families, two steps each. The
 * governing rule for the whole site is that no two touching sections ever
 * carry the same value. Where the content allows it the family flips
 * outright; inside a long reading run the family holds and the step
 * alternates, so the reader is not strobed between black and ivory five
 * times while reading continuously.
 *
 * Each surface publishes its palette as custom properties, so anything
 * nested resolves against the section it happens to be sitting in rather
 * than hard-coding a colour:
 *
 *   --surface         this section's own ground
 *   --surface-raised  one step away — what cards and panels use
 *   --ink             body text
 *   --ink-muted       secondary text          (~7:1 on every ground here)
 *   --ink-faint       captions, labels, meta
 *   --rule            hairlines and dividers
 *
 * A card therefore never needs to know which section contains it: it reads
 * --surface-raised and is always exactly one step from its ground, on any
 * page, in any order. `data-tone` is deliberately the *family*, not the
 * surface, so that a shade step does not flip the navbar theme.
 */
// --accent differs by family for a reason: the brand red #cc0000 measures
// 3.38:1 on #090909 and 2.71:1 on #22221E, both under the 4.5:1 the small
// uppercase sizes the accent is used for need. On dark grounds it lifts to
// #FF4D4D — the same hue, raised the least amount that clears 4.5:1 on both
// dark surfaces (6.09:1 and 4.88:1). Light grounds carry the brand red itself.
const INK_DARK_GROUND = {
  '--ink': '#F5F1E8',
  '--ink-muted': 'rgba(245, 241, 232, 0.70)',
  '--ink-faint': 'rgba(245, 241, 232, 0.50)',
  '--rule': 'rgba(245, 241, 232, 0.12)',
  '--accent': '#FF4D4D',
};

const INK_LIGHT_GROUND = {
  '--ink': '#090909',
  '--ink-muted': 'rgba(9, 9, 9, 0.70)',
  '--ink-faint': 'rgba(9, 9, 9, 0.50)',
  '--rule': 'rgba(9, 9, 9, 0.12)',
  '--accent': '#cc0000',
};

export const SURFACES = {
  dark: {
    tone: 'dark',
    vars: { '--surface': '#090909', '--surface-raised': '#22221E', ...INK_DARK_GROUND },
  },
  'dark-raised': {
    tone: 'dark',
    vars: { '--surface': '#22221E', '--surface-raised': '#090909', ...INK_DARK_GROUND },
  },
  light: {
    tone: 'light',
    vars: { '--surface': '#F5F1E8', '--surface-raised': '#DED5C2', ...INK_LIGHT_GROUND },
  },
  'light-deep': {
    tone: 'light',
    vars: { '--surface': '#DED5C2', '--surface-raised': '#F5F1E8', ...INK_LIGHT_GROUND },
  },
};

/**
 * Props that put an element on a surface. Spread onto any element that is a
 * section but is not built with <Section> — a full-bleed hero, a horizontally
 * scrolling band, the footer. `[data-surface]` in index.css paints the
 * background and the text colour from the variables.
 */
export function surfaceProps(surface = 'dark', style) {
  const s = SURFACES[surface] ?? SURFACES.dark;
  return {
    'data-surface': surface,
    'data-tone': s.tone,
    style: { ...s.vars, ...style },
  };
}

/**
 * A full-bleed page section: the ground comes from `surface`, while the inner
 * container carries the gutter, the measure, and the centring.
 *
 * `tone` remains accepted for any caller that only wants to report a family
 * to the navbar observer without taking a ground.
 */
export function Section({
  as: Tag = 'section',
  id,
  surface,
  tone,
  measure = 'frame',
  rhythm = 'default',
  className = '',
  innerClassName = '',
  style,
  children,
  ...rest
}) {
  const ground = surface ? surfaceProps(surface, style) : { 'data-tone': tone, style };

  return (
    // Gutter sits on the outer element and the measure on the inner one. Put
    // both on the same box and `border-box` subtracts the gutter from the
    // measure, silently narrowing every section by ~173px at 1440.
    <Tag
      id={id}
      {...ground}
      className={`w-full px-gutter ${RHYTHM[rhythm] ?? RHYTHM.default} ${className}`.trim()}
      {...rest}
    >
      <div
        className={`mx-auto w-full ${MEASURE[measure] ?? MEASURE.frame} ${innerClassName}`.trim()}
      >
        {children}
      </div>
    </Tag>
  );
}

// Twelve columns: divides cleanly by 2, 3, 4 and 6, so a section can be split
// evenly or deliberately unevenly to give one element dominance.
const SPAN = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const START = {
  1: 'md:col-start-1',
  2: 'md:col-start-2',
  3: 'md:col-start-3',
  4: 'md:col-start-4',
  5: 'md:col-start-5',
  6: 'md:col-start-6',
  7: 'md:col-start-7',
  8: 'md:col-start-8',
  9: 'md:col-start-9',
  10: 'md:col-start-10',
  11: 'md:col-start-11',
  12: 'md:col-start-12',
};

/** Twelve-column grid. Collapses to a single column below `md`. */
export function Grid({ className = '', children, ...rest }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-12 gap-x-col ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A column within <Grid>. Full width on mobile; spans `span` columns from `md` up. */
export function Col({ span = 12, start, className = '', children, ...rest }) {
  return (
    <div
      className={`${SPAN[span] ?? SPAN[12]} ${start ? START[start] ?? '' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Section;
