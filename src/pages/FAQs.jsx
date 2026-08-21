import React from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/ui/Section';
import Questions from '../components/home/Questions';
import LiquidButton from '../components/ui/LiquidButton';
import { useContactModal } from '../components/ContactModal';
import { ENQUIRY } from '../data/home';

/**
 * FAQs, on their own route.
 *
 * The accordion is the Questions section, unchanged. It was written for the
 * home page and is still sitting in Home.jsx commented out, so nothing here
 * forks it: the only thing this page passes is heading={null}, because the
 * title is already in the h1 above and the section should not repeat it one
 * line later. If Questions is ever uncommented on the home page, both places
 * stay in step because both are reading the same FAQ data and the same
 * component.
 *
 * Surface run: light → light-deep → dark, then the footer's dark-raised.
 * Inside the reading run the step alternates rather than the family flipping,
 * which is the rule for a long stretch of continuous reading: eighteen
 * questions should not be read against a ground that strobes between ivory
 * and black. The family flips once at the very end, which is what gives the
 * closing block its weight. See ui/Section.jsx.
 */
export default function FAQs() {
  const openContact = useContactModal();

  return (
    <div className="w-full">
      {/* Header. Same construction as the About page header, so the two
          routes open the same way. */}
      <Section surface="light" rhythm="none" className="pt-[120px] pb-section-xs">
        <span className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3">
          FAQS
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.95] tracking-tight mb-8 max-w-measure-xl"
        >
          Questions, answered.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed"
        >
          What people ask before a first visit. Most of it comes down to the
          same three things: you do not need a licence, you do not need
          experience, and you do not need to be a member.
        </motion.p>
      </Section>

      <Questions heading={null} />

      {/* A page of answers should not dead-end on the last one. */}
      <Section surface="dark" measure="lg">
        <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1.05] tracking-tight mb-4">
          Not on the list?
        </h2>
        <p className="font-sans text-[clamp(0.95rem,1.4vw,1.1rem)] font-light ink-muted leading-relaxed mb-10 max-w-measure">
          Ask us directly. Tell us what you drive, who is coming, and roughly
          when, and we will tell you what a day looks like.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Named so the sheet records which page the enquiry came off.
              See lib/submitToSheet.js and the Opened Via column. */}
          <LiquidButton onClick={() => openContact('Drive', 'FAQs page')}>
            Send an enquiry →
          </LiquidButton>
          <a
            href={`mailto:${ENQUIRY.email}`}
            className="text-[0.8rem] tracking-widest uppercase ink-faint hover:text-[var(--accent)] transition-colors"
          >
            {ENQUIRY.email}
          </a>
        </div>
      </Section>
    </div>
  );
}
