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
          Marque.<span style={{ color: '#cc0000' }}>One</span> Motorsports Club
        </>
      ),
      desc: 'The 219-acre motorsport club. Circuit, drag strip, off-road course, skid pan, wet handling track, clubhouse, rooms, and storage.',
      link: '/',
    },
    {
      id: 'garage',
      title: (
        <>
          Marque.<span style={{ color: '#cc0000' }}>One</span> Garage
        </>
      ),
      desc: 'Precision maintenance, restoration, track preparation, and storage for performance, luxury, and vintage automobiles.',
      link: 'https://www.marqueone.in/',
    },
    {
      id: 'classifieds',
      title: (
        <>
          Marque.<span style={{ color: '#cc0000' }}>One</span> Classifieds
        </>
      ),
      desc: 'Curated sales, sourcing, and brokerage for verified high-performance and collector motorcars.',
      link: 'https://www.instagram.com/marqueone.classifieds',
    },
  ];

  const people = [
    {
      name: 'Anush Chakravarthi',
      role: 'Founder & Director',
      bio: (
        <>
          Automotive enthusiast, circuit driver, and entrepreneur behind Nidhi Marque.{' '}
          <span style={{ color: '#cc0000' }}>One</span> Motors. Spearheading the design and execution of India’s premier private motorsport destination.
        </>
      ),
    },
    {
      name: 'Shana Parmeshwar',
      role: 'Director & Co-Founder',
      bio: 'Collector, driver, and motorsport advocate. Bringing global automotive experience and lifestyle curation to the club’s hospitality and community.',
    },
    {
      name: 'M. G. Chakravarthi Rajan',
      role: 'Founder, Nidhi Group',
      bio: 'Visionary behind Anuadi Constructions (est. 1991) and the Nidhi Group, providing the foundational civil engineering and land development heritage powering the 219-acre club.',
    },
  ];

  const projectCredits = [
    {
      name: 'Driven International',
      role: 'Circuit Architecture & Master Planning',
      desc: 'UK-based motorsport venue designers specialising in FIA-graded circuit layouts, driving facilities, and race track master planning.',
    },
    {
      name: 'Anuadi Constructions',
      role: 'Civil Engineering',
      desc: 'Civil engineering and infrastructure development firm established in 1991, executing site earthworks, track paving, and facility structures.',
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
          ABOUT MARQUE.<span style={{ color: '#cc0000' }}>ONE</span>
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.95] tracking-tight mb-8 max-w-measure-xl"
        >
          Built by Racers.
          <br />
          For Drivers.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light ink-muted max-w-measure leading-relaxed"
        >
          Marque.<span style={{ color: '#cc0000' }}>One</span> was founded to create spaces and services for people who take driving seriously. What began as a specialist performance workshop has grown into a 219-acre motorsport sanctuary.
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

              {b.link && (
                <a
                  href={b.link}
                  target={b.link.startsWith('http') ? '_blank' : undefined}
                  rel={b.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 text-[0.72rem] tracking-widest uppercase ink-faint hover:text-[#cc0000] hover:translate-x-1 transition-all mt-6 font-medium group cursor-pointer"
                >
                  <span>Visit</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </a>
              )}
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

      {/* 4. Investor */}
      <Section
        surface="light"
        rhythm="tight"
      >
        <div className="max-w-measure">
          <span className="block text-[0.7rem] tracking-ultra uppercase ink-faint mb-3">
            INVESTOR
          </span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1.05] tracking-tight mb-4">
            Backed by House of Jindal.
          </h2>
          <p className="font-sans text-[clamp(0.95rem,1.4vw,1.1rem)] font-light ink-muted leading-relaxed">
            Supported by strategic investment from House of Jindal, backing the development of India’s premier private motorsport destination.
          </p>
        </div>
      </Section>
    </div>
  );
}
