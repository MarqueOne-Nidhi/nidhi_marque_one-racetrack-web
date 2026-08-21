import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { LOCATION } from '../../data/home';
import LocationMap from '../LocationMap';
import LiquidButton from '../ui/LiquidButton';
import TypeOut from '../ui/TypeOut';

/**
 * Getting here, held back.
 *
 * The directions and the live pin are finished and are still below, in
 * Directions(). They are not commented out: commented code is not compiled,
 * so it rots quietly and the next person to uncomment it finds it broken
 * against props that moved underneath it. Behind a flag it stays real code
 * that the build still checks.
 *
 *   const READY = true;
 *
 * is the whole of putting it back.
 *
 * The section keeps its id and its ground either way. The navbar links to
 * /#location, so removing it outright would leave a dead entry in the rail,
 * and the surface run above and below it depends on this one being light.
 */

const READY = false;

export default function Location() {
  return (
    <Section
      id="location"
      // Ivory. Its neighbours are the hospitality section above (dark) and the
      // footer below (dark-raised), so nothing it touches shares this ground
      // and the alternation still holds.
      surface="light"
    >
      {READY ? <Directions /> : <ComingSoon />}
    </Section>
  );
}

function ComingSoon() {
  return (
    // Holds roughly the height the finished section occupies, so the page
    // does not visibly shorten and lengthen when the flag is flipped.
    <div className="min-h-[46vh] flex flex-col justify-center">
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-5"
      >
        {LOCATION.heading}
      </motion.span>

      {/* Two lines and nothing else. A placeholder that explains itself at
          length is not much of a placeholder. */}
      <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight">
        <TypeOut text="Coming soon..." caretClassName="accent" />
      </h2>
    </div>
  );
}

/** The finished section. Unrendered while READY is false. */
function Directions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-8"
        >
          {LOCATION.heading}
        </motion.h2>

        <div className="flex flex-col gap-5 max-w-measure-sm">
          {LOCATION.body.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light leading-[1.7] ink-muted"
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Opens in a new tab, so a visitor reading directions does not
            lose the page they were reading them on. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10"
        >
          <LiquidButton
            as="a"
            href={LOCATION.map.share}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            Open in Maps →
          </LiquidButton>
        </motion.div>
      </div>

      {/* The live pin, replacing the circuit-layout still that used to
          stand in for it. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <LocationMap tone="light" className="w-full shadow-sm" showLink={false} />
      </motion.div>
    </div>
  );
}
