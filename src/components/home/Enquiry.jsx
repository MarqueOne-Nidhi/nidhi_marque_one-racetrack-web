import React from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import EnquiryForm from '../EnquiryForm';
import { ENQUIRY } from '../../data/home';

/**
 * The enquiry section: a heading, a promise, and the shared form under them.
 * The fields and the submit live in EnquiryForm, which the contact popover
 * renders too, so the two cannot drift apart.
 */
export default function Enquiry({ initialType = 'Drive', heading = ENQUIRY.heading, sub = ENQUIRY.sub }) {
  return (
    <Section
      id="enquiry"
      surface="dark"
      measure="lg"
      className="pt-section pb-[6vh]"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.6rem,6vw,5rem)] font-light leading-[1] tracking-tight mb-3"
      >
        {heading}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light text-ivory/60 mb-10"
      >
        {sub}
      </motion.p>

      <EnquiryForm initialType={initialType} />
    </Section>
  );
}
