import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// ─── The pointer ──────────────────────────────────────────────────────────
// The panel's top edge swells toward the item that opened it, rather than
// carrying a separate arrow. Two pieces draw it, and they must agree exactly:
// a clipped block supplies the fill and the backdrop blur inside the swell,
// and a stroke over the top supplies the border. Both come from `swell()`, so
// they cannot drift apart.
const POINT_RISE = 13; // how far the apex lifts above the flat top edge
const POINT_HALF = 54; // half-width of the swell at its base

/**
 * The swell, from its left base to its right base, apex at `cx`.
 *
 * Both control points of each half sit at the quarter point — one on the base
 * line, one at the apex — which makes the curve leave and rejoin the edge
 * horizontally. Meeting the edge at an angle would read as a chevron stuck on
 * the panel rather than the panel itself bulging.
 */
function swell(cx) {
  const q = POINT_HALF * 0.5;
  const n = (v) => Math.round(v * 100) / 100;
  return (
    `C ${n(cx - q)} ${POINT_RISE} ${n(cx - q)} 0 ${n(cx)} 0 ` +
    `C ${n(cx + q)} 0 ${n(cx + q)} ${POINT_RISE} ${n(cx + POINT_HALF)} ${POINT_RISE}`
  );
}

/** Closed outline of the swell alone — the region to fill above the top edge. */
const swellFill = (cx) =>
  `M ${cx - POINT_HALF} ${POINT_RISE} ${swell(cx)} Z`;

/** The panel's whole top edge: flat, swell, flat. This is its top border. */
const swellEdge = (cx, width) =>
  `M 0 ${POINT_RISE} L ${cx - POINT_HALF} ${POINT_RISE} ${swell(cx)} L ${width} ${POINT_RISE}`;

/**
 * A sub-nav row whose hover state is the panel inverted: the text colour
 * becomes the background, the background becomes the text, wiped in from the
 * left.
 *
 * Two stacked copies of the row do it. The lower one is the idle row. The
 * upper one carries the inverted colours and is clipped to zero width, so on
 * hover the clip opens from the left and background and text sweep across
 * together. Fading the background in under a re-coloured label would leave a
 * beat where the two match and the label disappears; wiping one finished row
 * over another never drops contrast. The clipped copy is hidden from
 * assistive tech so the label is announced once.
 *
 * `open` drives the wipe from state rather than :hover — the rail uses it to
 * hold a category inverted while the pointer is off in that category's links.
 */
function WipeRow({ open, surface, className = '', children, ...linkProps }) {
  const clip = open
    ? '[clip-path:inset(0_0_0_0)]'
    : '[clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]';

  return (
    <Link {...linkProps} className={`group relative block overflow-hidden rounded-[2px] ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className={`absolute inset-0 ${surface} ${clip} [&_[data-caret]]:opacity-50 transition-[clip-path] duration-[240ms] ease-out motion-reduce:transition-none`}
      >
        {children}
      </span>
    </Link>
  );
}

/**
 * The hover sub-navigation: a rail of categories on the left, the links
 * belonging to the hovered category on the right.
 *
 * The rail entries are links, not buttons. Hovering one reveals its pane;
 * clicking it goes to the section the category is named for. That keeps a
 * category from being a dead end you have to hover twice to escape, and it
 * gives keyboard users a real tab stop — focus reveals the pane exactly as
 * hover does, and the next Tab lands inside it.
 *
 * Only the active pane is mounted, so a screen reader reading linearly meets
 * one list of links rather than six concatenated ones.
 *
 * The panel is centred on the viewport, not on the nav item that opened it —
 * fixed, flush under the 76px bar. Anchored to the trigger it hung off to one
 * side and, for the rightmost item, ran past the edge of the screen. It stays
 * a DOM child of its <li> so the hover bridge still reads it as inside the
 * item; only its layout leaves. Centring is `inset-x-0 mx-auto` rather than a
 * translate because Framer Motion writes `transform` for the entry `y`, which
 * silently overwrites a `-translate-x-1/2` class.
 *
 * Once scrolled the bar carries `backdrop-blur`, which makes it the containing
 * block for its own fixed children — so these offsets resolve against the bar,
 * not the viewport. They agree today only because the bar is itself pinned to
 * 0,0 at full width. Give it a max-width or an inset and this panel drifts off
 * centre with nothing in this file to explain why.
 *
 * Being centred is why the pointer is needed at all: the panel does not sit
 * under the item that opened it, so its top edge swells toward that item to
 * say which one it belongs to. The swell is the panel's own silhouette, not an
 * arrow laid on top — see the notes on `swell()`.
 */
export default function NavSubPanel({ groups, isLight, onNavigate, pointerX = 0 }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = groups[activeIdx] ?? groups[0];

  // The panel's own box, so the pointer can be placed in panel-local
  // coordinates from the viewport x the bar reports.
  const panelRef = useRef(null);
  const [box, setBox] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({ left: rect.left, width: rect.width });
    };
    measure();
    // The pane swaps between categories of different lengths, so the panel
    // resizes under its own hover. Width is what the pointer needs, and it
    // only changes on viewport resize — but observing the element covers both
    // without a second listener.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the whole hill on the panel: its flat tails have to land inside the
  // corners or the curve is cut off mid-swell at the edge.
  const cx = box.width
    ? Math.max(POINT_HALF + 2, Math.min(box.width - POINT_HALF - 2, pointerX - box.left))
    : 0;

  const panelBg = isLight ? 'bg-[#F5F1E8]/95' : 'bg-[#0D0D0D]/95';
  const panelBorder = isLight ? 'border-dark/10' : 'border-white/10';
  const panelShadow = isLight
    ? 'shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]'
    : 'shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]';
  // Must match panelBorder exactly — this stroke *is* the panel's top border.
  const strokeColor = isLight ? 'rgba(9,9,9,0.1)' : 'rgba(255,255,255,0.1)';

  // The hovered row, inverted: the panel's text colour becomes its ground.
  const wipeSurface = isLight ? 'bg-dark text-ivory' : 'bg-ivory text-dark';

  const railIdle = isLight ? 'text-dark/55' : 'text-ivory/50';
  const itemIdle = isLight ? 'text-dark/60' : 'text-ivory/55';

  const dividerClass = isLight ? 'border-dark/10' : 'border-white/10';

  // Shared row geometry — both copies of a row must lay out identically or
  // the label shifts as the wipe crosses it.
  const railRow =
    'flex items-center justify-between gap-2 h-full px-3 py-2.5 text-[0.7rem] tracking-[0.14em] uppercase font-sans';
  const itemRow = 'block px-3 py-2 text-[0.7rem] tracking-[0.12em] uppercase font-sans';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      // The bar is 76px; the panel starts POINT_RISE above it so the swell has
      // somewhere to rise into, and its flat top edge still lands at 76.
      style={{ top: 76 - POINT_RISE }}
      className="fixed inset-x-0 mx-auto w-[min(92vw,520px)]"
      ref={panelRef}
    >
      {/* The swell's fill. Clipped to the curve and carrying the same ground
          and blur as the body, so the two are one surface across the seam at
          the top edge rather than two blocks that happen to touch. */}
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 backdrop-blur-md ${panelBg}`}
        style={{ height: POINT_RISE, clipPath: `path('${swellFill(cx)}')` }}
      />

      {/* The top border, following the same curve. The body has no top border
          of its own — this is it, which is why the colours must match. */}
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 top-0 w-full pointer-events-none z-10"
        height={POINT_RISE + 1}
        viewBox={`0 0 ${box.width || 1} ${POINT_RISE + 1}`}
        fill="none"
      >
        <path
          d={swellEdge(cx, box.width)}
          stroke={strokeColor}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        className={`rounded-b-sm border border-t-0 backdrop-blur-md overflow-hidden grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] ${panelBg} ${panelBorder} ${panelShadow}`}
        style={{ marginTop: POINT_RISE }}
      >
        {/* Rail — the categories */}
        <ul className="list-none m-0 p-2">
          {groups.map((group, i) => {
            const isActive = i === activeIdx;
            return (
              <li key={group.label}>
                <WipeRow
                  to={group.path}
                  open={isActive}
                  surface={wipeSurface}
                  onMouseEnter={() => setActiveIdx(i)}
                  onFocus={() => setActiveIdx(i)}
                  onClick={onNavigate}
                  aria-current={isActive ? 'true' : undefined}
                  className={railIdle}
                >
                  <span className={railRow}>
                    <span>{group.label}</span>
                    {/* Transparent on the idle copy and revealed only on the
                        inverted one, so it rides in with the wipe rather than
                        fading on its own — but still holds its width in both,
                        which is what keeps the label from shifting. */}
                    <span data-caret className="text-[0.85em] opacity-0">›</span>
                  </span>
                </WipeRow>
              </li>
            );
          })}
        </ul>

        {/* Pane — the links inside the hovered category. Keyed so it fades
            on change rather than swapping its text in place. */}
        <motion.ul
          key={active.label}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`list-none m-0 p-2 border-l ${dividerClass}`}
        >
          {active.items.map((item) => (
            <li key={item.path}>
              <WipeRow
                to={item.path}
                surface={wipeSurface}
                onClick={onNavigate}
                className={itemIdle}
              >
                <span className={itemRow}>{item.label}</span>
              </WipeRow>
            </li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}
