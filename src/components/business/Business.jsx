import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../ui/Section';
import CardCylinder, { SCROLL_VH_PER_CARD, scrollTrackHeight } from '../ui/CardCylinder';
import CylinderMarkers from '../ui/CylinderMarkers';
import { BUSINESS } from '../../data/business';

/**
 * Business: the same cylinder the home page uses for hospitality, turned by
 * the page scroll instead of by itself.
 *
 * The section pins for a few screens and the scroll through it is the
 * position on the cylinder, so a reader who simply keeps scrolling is shown
 * all four programmes and then let go. Nothing has to be dragged or clicked
 * to see the whole set, which is the difference from the home page: there the
 * cylinder turns on its own beside a section a reader may pass in a second.
 *
 * ── The anchors ──────────────────────────────────────────────────────────
 * The navbar deep-links to each programme, /business#team-testing and the
 * rest, and those anchors used to be the four blocks of a grid. With the grid
 * gone they are zero-sized marks placed down the scroll track instead, one
 * every SCROLL_VH_PER_CARD, which is exactly the spacing the cylinder reads.
 * So the browser's own anchor scrolling lands on the scroll position where
 * that card is at the front, with no scripting involved.
 *
 * ── When it does not pin ─────────────────────────────────────────────────
 * Under reduced motion, and on a narrow screen, the blocks are laid out as a
 * plain grid and nothing pins. Both cases are the same judgement: pinning a
 * section for three screens is only reasonable if something is moving to
 * justify it. Under reduced motion nothing may, and on a phone the stage is
 * small, the copy stacks under it, and mobile browser chrome resizing the
 * viewport mid-pin is a well-known way to make sticky sections lurch. The
 * grid also keeps the anchors working without any of the arithmetic above.
 */

const CARDS = BUSINESS.blocks.map((block) => ({
  key: block.anchor,
  title: block.title,
  line: block.body,
  src: block.image,
  alt: block.alt,
}));

function useMatches(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export default function Business() {
  const [active, setActive] = useState(0);
  const track = useRef(null);
  const cylinder = useRef(null);

  // Only reduced motion falls back to the flat grid now. A phone used to as
  // well, which left the section reading as four blocks in a list there and
  // as a stack of cards everywhere else: no eyebrow, no count, no card at the
  // front. It takes the same cards and the same scroll drive at every width.
  const reduced = useMatches('(prefers-reduced-motion: reduce)');
  const asGrid = reduced;

  const activeCard = CARDS[active];

  return (
    <>
      {/* Opens the Business page, so it takes the interior-page header shape:
          light ground, and explicit top padding to clear the fixed navbar
          rather than relying on the 14vh rhythm to do it. */}
      <Section
        id="business"
        surface="light"
        rhythm="none"
        className="pt-[120px] pb-section-xs"
      >
        <span className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3">
          MARQUE.<span style={{ color: '#cc0000' }}>ONE</span> FOR BUSINESS
        </span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.95] tracking-tight mb-6"
        >
          {BUSINESS.heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed"
        >
          {BUSINESS.intro}
        </motion.p>
      </Section>

      {asGrid ? (
        <Section surface="dark" measure="frame">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {BUSINESS.blocks.map((block, i) => (
              <motion.div
                key={block.title}
                id={block.anchor}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="group flex flex-col"
              >
                {block.image && (
                  <div className="relative w-full aspect-[16/9] rounded-sm overflow-hidden mb-6 bg-black/20">
                    <img
                      src={block.image}
                      alt={block.alt || block.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="border-t rule pt-5 flex-1 flex flex-col">
                  <h2 className="font-serif text-[clamp(1.3rem,1.8vw,1.6rem)] font-light mb-3">
                    {block.title}
                  </h2>
                  <p className="font-sans text-[0.88rem] font-light leading-[1.7] ink-muted">
                    {block.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      ) : (
        // The tall element. Its height is the only thing that decides how long
        // the pin lasts, and CardCylinder reads the same constant to turn a
        // position inside it into a position on the cylinder, so the two
        // cannot disagree about how long the section is.
        <div ref={track} className="relative" style={{ height: scrollTrackHeight(CARDS.length) }}>
          {/* One mark per card, at the scroll offset where that card is at the
              front. Zero-sized and invisible; they exist to be jumped to. */}
          {CARDS.map((card, i) => (
            <span
              key={card.key}
              id={card.key}
              aria-hidden="true"
              className="absolute left-0 w-px h-px"
              style={{ top: `${i * SCROLL_VH_PER_CARD}vh` }}
            />
          ))}

          <div className="sticky top-0 h-[100svh] overflow-hidden">
            {/* The pin holds one screen, so on a phone the stack has to fit
                inside it: the label, the cards, what the front one is, and
                the markers. The bar is fixed and 76px tall and this section
                is pinned to the top of the screen, so the top padding clears
                it rather than letting the label sit underneath. */}
            <Section
              surface="dark"
              rhythm="none"
              className="h-full flex items-center max-md:pb-4 max-md:pt-[calc(76px+0.5rem)] md:py-[clamp(4rem,10vh,8rem)]"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-col items-center w-full">
                <CardCylinder
                  ref={cylinder}
                  cards={CARDS}
                  drive="scroll"
                  // Mirrored against the home page: here the cards rise as
                  // the page goes down, so the stack runs against the scroll
                  // rather than with it.
                  spin="up"
                  scrollRef={track}
                  onActiveChange={setActive}
                  className="md:col-span-6 h-[clamp(150px,32svh,240px)] md:h-[clamp(440px,68vh,760px)]"
                />

                {/* `contents` on a phone, so these two join the section's own
                    grid and can be ordered around the cards: what the section
                    is goes above them, and what the card at the front is goes
                    below. The same arrangement as Hospitality on the home
                    page. From md up this is a column again. */}
                <div className="contents md:block md:col-span-5 md:col-start-8">
                  {/* The header has scrolled away by the time the pin starts,
                      so the section says what it is on its own. The wording is
                      the navbar's own label for this group. */}
                  <span className="order-first block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3 md:order-none">
                    WHAT WE HOST
                  </span>

                  <div>
                  {/* Held to a fixed height so the longest block cannot shove
                      the row of markers down and up as the cylinder turns. */}
                  <div className="min-h-[150px] md:min-h-[188px]">
                    <span className="block text-[0.6rem] tracking-ultra uppercase ink-faint mb-3">
                      {String(active + 1).padStart(2, '0')} /{' '}
                      {String(CARDS.length).padStart(2, '0')}
                    </span>
                    {/* Keyed on the active card, so a change remounts these
                        two and replays their entry rather than swapping the
                        text in place. */}
                    <motion.h2
                      key={`t-${active}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="font-serif text-[clamp(1.6rem,2.6vw,2.4rem)] font-light leading-[1.1] mb-3"
                    >
                      {activeCard.title}
                    </motion.h2>
                    <motion.p
                      key={`l-${active}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="font-sans text-[0.88rem] font-light leading-[1.7] ink-muted max-w-measure-sm"
                    >
                      {activeCard.line}
                    </motion.p>
                  </div>

                  {/* On a screen too short to hold the label, the cards and
                      what the front one is, the markers are what goes: the
                      cards advance by scrolling at every width now, so they
                      are a shortcut rather than the only way through. */}
                  <CylinderMarkers
                    cards={CARDS}
                    active={active}
                    onSelect={(i) => cylinder.current?.goTo(i)}
                    className="mt-6 max-md:[@media(max-height:620px)]:hidden md:mt-8"
                  />
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}
