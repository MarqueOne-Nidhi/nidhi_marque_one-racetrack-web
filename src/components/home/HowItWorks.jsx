import React from 'react';
import { motion } from 'framer-motion';
import { Section, Grid, Col } from '../ui/Section';
import { HOW_IT_WORKS } from '../../data/home';

/**
 * How a day works — the process answer, placed straight after Definition.
 *
 * Runs dark between two ivory sections so the one section a first-time
 * visitor most needs to find doesn't sit camouflaged among its neighbours.
 *
 * The border-t is gone: it was compensating for a #121210 ground that barely
 * separated from the ivory either side of it. A full family flip separates on
 * its own, and keeping both reads as indecision.
 */
export default function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      surface="dark"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1] tracking-tight mb-14"
      >
        {HOW_IT_WORKS.heading}
      </motion.h2>

      {/* Three equal columns of the twelve — deliberately equal weight, since
          no step matters more than the others and the eye should read across. */}
      <Grid className="gap-y-12">
        {HOW_IT_WORKS.steps.map((step, i) => (
          <Col key={step.n} span={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="border-t rule pt-5"
            >
              <span className="block font-sans text-[0.7rem] tracking-ultra uppercase ink-faint mb-4">
                {step.n}
              </span>
              <h3 className="font-serif text-[clamp(1.3rem,1.8vw,1.6rem)] font-light mb-2">
                {step.title}
              </h3>
              <p className="font-sans text-[0.88rem] font-light leading-[1.75] ink-muted">
                {step.body}
              </p>
            </motion.div>
          </Col>
        ))}
      </Grid>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="font-sans text-[0.85rem] font-light tracking-wide ink-faint mt-14"
      >
        {HOW_IT_WORKS.footnote}
      </motion.p>
    </Section>
  );
}
