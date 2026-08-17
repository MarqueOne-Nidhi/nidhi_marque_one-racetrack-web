import React from 'react';
import { Section } from '../components/ui/Section';
import { motion } from 'framer-motion';
import ImageSlot from '../components/ImageSlot';
import IMAGES from '../data/images';

export default function About() {
  const businesses = [
    {
      id: 'club',
      title: (
        <>
          Marque <span className="accent">One</span> Motorsports Club
        </>
      ),
      desc: 'The 219-acre motorsport estate. Circuit, drag strip, off-road course, skid pan, wet handling track, clubhouse, rooms, and storage.',
    },
    {
      id: 'garage',
      title: (
        <>
          Marque <span className="accent">One</span> Garage
        </>
      ),
      desc: 'Precision maintenance, restoration, track preparation, and storage for performance, luxury, and vintage automobiles in Bengaluru.',
    },
    {
      id: 'classifieds',
      title: (
        <>
          Marque <span className="accent">One</span> Classifieds
        </>
      ),
      desc: 'Curated sales, sourcing, and brokerage for verified high-performance and collector motorcars.',
    },
  ];

  const people = [
    {
      name: 'Anush Chakravarthi',
      role: 'Founder & Director',
      bio: (
        <>
          Automotive enthusiast, circuit driver, and entrepreneur behind Nidhi Marque{' '}
          <span className="accent">One</span> Motors. Spearheading the design and execution of India’s premier private motorsport destination.
        </>
      ),
    },
    {
      name: 'Shana Parmeshwar',
      role: 'Director & Co-Founder',
      bio: 'Collector, driver, and motorsport advocate. Bringing global automotive experience and lifestyle curation to the estate’s hospitality and community.',
    },
    {
      name: 'M. G. Chakravarthi Rajan',
      role: 'Founder, Nidhi Group',
      bio: 'Visionary behind Anuadi Constructions (est. 1991) and the Nidhi Group, providing the foundational civil engineering and land development heritage powering the 219-acre estate.',
    },
  ];

  const partners = [
    {
      name: 'Driven International',
      role: 'Circuit Architecture & Master Planning',
      desc: 'World-renowned motorsport venue designers (Abu Dhabi, Kari Motor Speedway, Nanoli) who authored the 3.2 km FIA-graded circuit layout.',
    },
    {
      name: 'Autocar India',
      role: 'Media & Track Test Partner',
      desc: 'India’s leading automotive publication, partnering on vehicle testing, performance benchmarking, and press launches at the estate.',
    },
    {
      name: 'Anuadi Constructions',
      role: 'Civil Engineering & Execution',
      desc: 'Three decades of large-scale infrastructure development across South India, managing earthworks, asphalt layout, and structural builds.',
    },
  ];

  return (
    // No page-level ground: each section carries its own, alternating family
    // so that no two touching blocks read as one. See ui/Section.jsx.
    <div className="w-full">
      {/* 1. Header */}
      <Section
        surface="light"
        rhythm="none"
        className="pt-[120px] pb-section-xs"
      >
        <span className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3">
          ABOUT MARQUE <span className="accent">ONE</span>
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.95] tracking-tight mb-8 max-w-measure-xl"
        >
          Built by people with a record.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed"
        >
          Marque <span className="accent">One</span> was founded to create spaces and services for people who take driving seriously. What began as a specialist performance workshop has grown into a 219-acre motorsport sanctuary.
        </motion.p>
      </Section>

      {/* Header Image — a dark band, so the photograph is framed rather than
          floating in the same ivory as the text above it. */}
      <Section
        surface="dark"
        rhythm="tight"
        innerClassName="rounded-sm"
      >
        <ImageSlot
          src={IMAGES.aboutHeader.src}
          alt={IMAGES.aboutHeader.alt}
          caption={IMAGES.aboutHeader.caption}
          aspect="21/9"
          className="w-full"
        />
      </Section>

      {/* 2. Three Businesses, One Name */}
      <Section
        surface="light"
        rhythm="tight"
      >
        <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1] tracking-tight mb-12">
          Three businesses, one name
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {businesses.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="surface-raised p-8 rounded-sm flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <h3 className="font-serif text-[1.4rem] font-light mb-3">{b.title}</h3>
                <p className="font-sans text-[0.85rem] font-light ink-muted leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 3. The People */}
      <Section
        surface="dark"
        rhythm="tight"
      >
        <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1] tracking-tight mb-12">
          Leadership
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {people.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <span className="text-[0.65rem] tracking-widest uppercase accent block mb-1">
                {p.role}
              </span>
              <h3 className="font-serif text-[1.5rem] font-light mb-3">{p.name}</h3>
              <p className="font-sans text-[0.85rem] font-light ink-muted leading-relaxed">
                {p.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 4. Partners */}
      <Section
        surface="light"
        rhythm="tight"
      >
        <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1] tracking-tight mb-12">
          Partners
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {partners.map((pt, i) => (
            <motion.div
              key={pt.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="border-l-2 rule pl-6"
            >
              <h3 className="font-serif text-[1.4rem] font-light mb-1">{pt.name}</h3>
              <span className="text-[0.68rem] tracking-wider uppercase ink-faint block mb-3">
                {pt.role}
              </span>
              <p className="font-sans text-[0.85rem] font-light ink-muted leading-relaxed">
                {pt.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
