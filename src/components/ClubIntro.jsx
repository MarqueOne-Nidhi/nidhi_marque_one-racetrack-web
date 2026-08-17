import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * ONE.CLUB — Opening Brand Signature
 *
 * An invisible pen writes "One" in the Estonia script face, ".CLUB" resolves
 * beside it, and an editorial line states the positioning before the canvas
 * dissolves into the racetrack hero.
 *
 * ─── Why the word is <text> behind a mask, not a stroked path ──────────────
 *
 * A font cannot be pathLength-drawn. The pen effect needs a centreline to
 * travel along, and a font gives you filled glyph OUTLINES — stroking those
 * traces around the edge of each letter, not along it. So the word is real
 * Estonia text, and what animates is a mask: a fat stroke following the pen's
 * route through the glyphs, growing from 0 to 1. The letterforms are genuinely
 * the typeface, ink texture and all, and the reveal still follows a real hand.
 *
 * Two things this got wrong first, both worth not repeating:
 *
 * · The mask was three subpaths, one per letter. stroke-dasharray RESTARTS at
 *   every subpath, so each letter ran its own dash cycle and all three revealed
 *   at once — at 18% the n and e were already complete. The route is now one
 *   continuous path; the joins between letters travel through empty space,
 *   where the mask reveals nothing, so they cost nothing visually.
 *
 * · maskUnits="userSpaceOnUse" changes the units of the mask REGION, whose
 *   defaults are -10%/-10%/120%/120%. In user space those percentages resolve
 *   against the viewport rather than the text, which cropped the word at
 *   roughly two thirds height. The region is stated explicitly below.
 */

// The pen's route through Estonia's glyphs, measured off the rendered type at
// font-size 160 with the text origin at (20,160): the O spans x 21–95, the n
// x 99–142, the e x 143–177, all sitting between y 86 and y 161.
const PEN =
  'M 86 100 C 84 91, 72 86, 58 86 C 40 86, 22 103, 22 123 C 22 143, 40 160, 58 160 ' +
  'C 76 160, 94 143, 94 123 C 94 112, 91 104, 86 100 C 92 104, 99 110, 102 118 ' +
  'C 102 133, 103 148, 104 158 C 106 138, 113 120, 121 120 C 130 120, 137 138, 138 158 ' +
  'C 140 155, 143 152, 145 150 C 150 140, 158 126, 166 120 C 172 116, 176 120, 173 127 ' +
  'C 168 136, 155 142, 150 146 C 148 152, 155 158, 165 156 C 170 155, 174 152, 177 148';

// Wide enough to clear Estonia's thickest strokes with margin. Verified against
// the unmasked type at full reveal — every part of every glyph is covered.
const PEN_WIDTH = 26;

/**
 * Handwriting velocity. The keyframes are the measured length fractions at each
 * landmark of the route above; the times give each stretch its own pace:
 *
 *   entry  slow  ·  O  medium  ·  joins  quick  ·  n  medium-fast
 *   e  slower (the letter that has to be read)  ·  exit  brisk, soft stop
 *
 * Easing is linear between landmarks on purpose — the rhythm lives in the
 * spacing of the times. Easing each stretch would pulse the pen to a halt at
 * every boundary. Only the first and last are eased, to set the pen down and
 * lift it off.
 */
const WRITE_KEYFRAMES = [0, 0.066, 0.448, 0.496, 0.747, 0.767, 0.971, 1];
const WRITE_TIMES = [0, 0.094, 0.476, 0.508, 0.721, 0.734, 0.974, 1];
const WRITE_EASES = ['easeIn', 'linear', 'linear', 'linear', 'linear', 'linear', 'easeOut'];
const WRITE_DURATION = 1.65;

export default function ClubIntro({ onComplete }) {
  // 'initial' | 'writing' | 'club' | 'caption' | 'exiting' | 'done'
  const [phase, setPhase] = useState('initial');
  const [shouldPlay, setShouldPlay] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const forceReplay = searchParams.get('replay') === '1' || searchParams.get('intro') === '1';
    const seen = sessionStorage.getItem('oneClubIntroSeen');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seen && !forceReplay) {
      setShouldPlay(false);
      onComplete?.();
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    let timers = [];

    const finish = () => {
      sessionStorage.setItem('oneClubIntroSeen', 'true');
      setPhase('done');
      document.body.style.overflow = originalOverflow;
      onComplete?.();
    };

    // Reduced motion still gets the brand, just not the pen: the finished
    // signature is shown at rest and then cross-fades out.
    if (prefersReducedMotion) {
      setReduced(true);
      setPhase('caption');
      timers = [setTimeout(() => setPhase('exiting'), 1400), setTimeout(finish, 2000)];
      return () => {
        timers.forEach(clearTimeout);
        document.body.style.overflow = originalOverflow;
      };
    }

    // The mask is cut to Estonia's glyphs specifically. If writing began before
    // the face had loaded, the word would lay out in the fallback and the mask
    // would reveal the wrong shapes — so the pen waits for the font, with a
    // short ceiling so a failed font request cannot stall the opening.
    const begin = () => {
      if (cancelled) return;
      setPhase('writing');
      // Relative to pen-down: word completes at 1.65s, then 270ms holding it
      // before ".CLUB", the caption, 230ms of stillness, and the dissolve.
      timers = [
        setTimeout(() => setPhase('club'), 1920),
        setTimeout(() => setPhase('caption'), 2270),
        setTimeout(() => setPhase('exiting'), 2820),
        setTimeout(finish, 3370),
      ];
    };

    const fontReady = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fontReady, new Promise((r) => setTimeout(r, 700))]).then(begin);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete]);

  if (!shouldPlay || phase === 'done') return null;

  const isWriting = ['writing', 'club', 'caption', 'exiting'].includes(phase);
  const isClub = ['club', 'caption', 'exiting'].includes(phase);
  const isCaption = ['caption', 'exiting'].includes(phase);
  const isExiting = phase === 'exiting';

  return (
    <motion.div
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center select-none pointer-events-none overflow-hidden"
    >
      {/* Calms the centre of the frame so the writing is the first thing the
          eye resolves. A gradient, not a panel — nothing reads as a box. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 46%, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      <motion.div
        animate={{ y: isExiting ? -10 : 0, opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-[92vw] px-4"
      >
        {/* Identity row — handwritten personality beside institutional type */}
        <div className="flex items-end justify-center">
          {/* Cropped close to the ink so the caption's spacing below is its own
              margin rather than empty SVG. Baseline sits at y=160. */}
          <svg
            viewBox="14 80 170 88"
            role="img"
            aria-label="One"
            className="w-[min(62vw,320px)] sm:w-[min(52vw,390px)] md:w-[460px] h-auto overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="one-pen" maskUnits="userSpaceOnUse" x="0" y="40" width="260" height="200">
                <motion.path
                  d={PEN}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={PEN_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={
                    reduced ? { pathLength: 1 } : { pathLength: isWriting ? WRITE_KEYFRAMES : 0 }
                  }
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: WRITE_DURATION, times: WRITE_TIMES, ease: WRITE_EASES }
                  }
                />
              </mask>
            </defs>

            <text
              x="20"
              y="160"
              fontFamily="Estonia, cursive"
              fontSize="160"
              fill="#F5F1E8"
              mask="url(#one-pen)"
            >
              One
            </text>
          </svg>

          {/* .CLUB — the site wordmark's typeface. Deliberately not the script:
              One is the hand, .CLUB is the institution. */}
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: isClub ? 1 : 0, x: isClub ? 0 : -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            // The row aligns on box bottoms, so this padding is what lands
            // .CLUB's baseline on the type's: the SVG's baseline sits 8/170 of
            // its width above its own bottom edge, less the serif's descender.
            className="font-serif font-light text-[#F5F1E8] leading-none tracking-[0.14em] text-[clamp(1.4rem,4.2vw,2.6rem)] pb-[max(0.9vw,0.5rem)] -ml-[0.5vw]"
          >
            .CLUB
          </motion.span>
        </div>

        {/* Editorial line. Sits well clear of the identity and never competes
            with it — light serif, generous leading, no uppercase. */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isCaption ? 1 : 0, y: isCaption ? 0 : 8 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif font-light text-center text-[#F5F1E8]/70 text-[clamp(0.9rem,1.7vw,1.15rem)] leading-[1.8] tracking-[0.04em] mt-[clamp(18px,1.8vw,26px)]"
        >
          The art of driving.
          <br />
          The privilege of belonging.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
