import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Section } from '../ui/Section';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FAQ } from '../../data/home';

// Blank space held under each group, sized for the tallest answer.
// The group is locked to `collapsed height + this`, so opening an answer
// fills reserved space instead of pushing the rest of the page down.
const ANSWER_RESERVE = 104;

export default function Questions({
  // The section titles itself on the home page, where it is one block among
  // many. On /faqs the page has already said it in the h1, so the caller
  // passes null rather than having it said twice one line apart.
  heading = 'FAQs',
}) {
  // Store open state by string identifier `groupIndex-itemIndex`
  const [openItems, setOpenItems] = useState({});
  // Hover-opened answer — collapses again as soon as the pointer leaves
  const [hoveredItem, setHoveredItem] = useState(null);
  // Touch devices have no real hover; there, click alone drives the accordion
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Clicking pins an answer open; clicking again closes it even while hovered.
  // Only one stays open at a time, so the reserved space is never overrun.
  const toggleItem = (key) => {
    const willOpen = !openItems[key];
    setOpenItems(willOpen ? { [key]: true } : {});
    if (!willOpen) setHoveredItem(null);
  };

  // Lock each group to its collapsed height plus the reserve. Only measured
  // while everything is shut — an open (or still-animating) answer would
  // inflate the reading and leave the group permanently taller.
  const groupRefs = useRef([]);
  const [groupHeights, setGroupHeights] = useState({});
  const isAnyOpen = !!hoveredItem || Object.values(openItems).some(Boolean);
  const isAnyOpenRef = useRef(false);
  isAnyOpenRef.current = isAnyOpen;

  useLayoutEffect(() => {
    const measure = () => {
      if (isAnyOpenRef.current) return;
      setGroupHeights(
        groupRefs.current.reduce((acc, el, i) => {
          if (el) acc[i] = el.offsetHeight + ANSWER_RESERVE;
          return acc;
        }, {})
      );
    };

    measure();
    // Serif webfonts change the row heights once they swap in
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // With the section heading suppressed the group titles are the highest
  // level here, so they step up rather than leaving a hole in the outline
  // between the page h1 and an h3.
  const GroupTitle = heading ? 'h3' : 'h2';

  return (
    <Section
      id="questions"
      surface="light-deep"
      measure="xl"
    >
      {heading && (
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-16"
        >
          {heading}
        </motion.h2>
      )}

      <div className="flex flex-col gap-16">
        {FAQ.groups.map((group, groupIdx) => (
          <div key={group.title} className="flex flex-col">
            <GroupTitle className="font-serif text-[clamp(1.4rem,2.2vw,2rem)] font-light mb-6 border-b rule pb-3">
              {group.title}
            </GroupTitle>

            <div style={{ minHeight: groupHeights[groupIdx] }}>
              <div
                ref={(el) => {
                  groupRefs.current[groupIdx] = el;
                }}
                className="divide-y divide-[var(--rule)]"
              >
                {group.items.map((item, itemIdx) => {
                  const key = `${groupIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key] || hoveredItem === key;

                  return (
                    <div
                      key={item.q}
                      className="py-5"
                      onMouseEnter={() => canHover && setHoveredItem(key)}
                      onMouseLeave={() => canHover && setHoveredItem(null)}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="tap-target w-full flex items-center justify-between gap-4 text-left bg-transparent border-none cursor-pointer py-1 group"
                        aria-expanded={isOpen}
                      >
                        <span className="font-serif text-[clamp(1.1rem,1.5vw,1.35rem)] font-light group-hover:text-brand transition-colors">
                          {item.q}
                        </span>
                        {/* The plus rotates 45° into a cross as the answer opens */}
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="ink-faint group-hover:text-brand transition-colors flex-none inline-flex"
                        >
                          <Plus size={18} />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="font-sans text-[0.88rem] font-light leading-[1.7] ink-muted pt-3 pb-1 max-w-measure-xl">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
