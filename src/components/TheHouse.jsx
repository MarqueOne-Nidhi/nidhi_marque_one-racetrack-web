import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section } from './ui/Section';
import { motion, AnimatePresence } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';
import LiquidButton from './ui/LiquidButton';

const hotspots = [
  {
    id: 'pool',
    title: 'POOL',
    detail: 'Infinity view overlooking the circuit',
    top: '64%',
    left: '33%',
    image: '/assets/images/hotspot_pool.png',
  },
  {
    id: 'dining',
    title: 'DINING',
    detail: 'Contemporary trackside hospitality',
    top: '50%',
    left: '63%',
    image: '/assets/images/hotspot_dining.png',
  },
  {
    id: 'lounge',
    title: 'LOUNGE',
    detail: 'Private members sanctuary',
    top: '38%',
    left: '46%',
    image: '/assets/images/hotspot_lounge.png',
  },
  {
    id: 'view',
    title: 'VIEW',
    detail: 'Panoramic trackside elevation',
    top: '26%',
    left: '83%',
    image: '/assets/images/hotspot_view.png',
  },
];

// Rooms are bookable by anyone, driving or not, so this section sends people
// to the stay form instead of the membership modal.
export default function TheHouse() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const active = hotspots.find((h) => h.id === hovered);

  return (
    <Section
      id="house"
      surface="light"
    >
      <div className="mb-12">
        <BlurFadeText
          text="SLOW DOWN."
          className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
        />

        <p className="font-sans text-[0.9rem] font-light leading-[1.7] ink-muted max-w-measure mt-6">
          Forty rooms above the circuit, each one different, each one facing either the mountains or the road. Guests who never sit in a car have a full weekend here.
        </p>
      </div>

      {/* Main image with hotspots */}
      <div
        className="relative w-full aspect-[16/9] rounded-sm overflow-visible mb-3 cursor-none"
        onMouseMove={handleMouseMove}
      >
        <div className="w-full h-full rounded-sm overflow-hidden">
          <img
            src="/assets/images/clubhouse_architectural.png"
            alt="ONE.CLUB Architectural Clubhouse & Infinity Pool"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hotspot dots */}
        {hotspots.map((hs) => (
          <div
            key={hs.id}
            onMouseEnter={() => setHovered(hs.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ top: hs.top, left: hs.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
          >
            {/* Ping ring */}
            <span className="absolute inset-0 rounded-full border border-white/60 animate-ping opacity-60 scale-[2.5]" />
            {/* Dot */}
            <div className="w-3 h-3 bg-white rounded-full relative z-10 group-hover:scale-[1.7] transition-transform duration-300 shadow-md" />
            {/* Label */}
            <div
              className={`absolute left-5 top-1/2 -translate-y-1/2 bg-dark/80 backdrop-blur-md text-ivory px-3 py-1 text-[0.62rem] tracking-widest uppercase whitespace-nowrap transition-all duration-200 ${
                hovered === hs.id ? 'opacity-100 left-6' : 'opacity-80'
              }`}
            >
              {hs.title}
            </div>
          </div>
        ))}

        {/* Hover preview card — follows mouse */}
        <AnimatePresence>
          {hovered && active && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-30 pointer-events-none"
              style={{
                left: mousePos.x + 24,
                top: mousePos.y - 80,
                width: 280,
              }}
            >
              <div className="overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={active.image}
                  alt={active.title}
                  className="w-full aspect-[4/3] object-cover block"
                />
                <div className="bg-dark/90 backdrop-blur-sm px-4 py-3">
                  <p className="text-[0.6rem] tracking-widest uppercase text-ivory/50 mb-0.5">{active.title}</p>
                  <p className="text-[0.78rem] text-ivory font-light">{active.detail}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption sits outside the hotspot container: that container's height is
          fixed by its aspect ratio and the markers are positioned against it,
          so anything added inside would push the markers off their landmarks. */}
      <p className="mb-12 font-sans text-[0.72rem] font-light leading-[1.6] tracking-wide ink-faint max-w-measure">
        A pool that looks out over the circuit, dining that runs long, and somewhere to sit and watch the road without standing beside it.
      </p>

      {/* CTA */}
      <LiquidButton variant="secondary" onClick={() => navigate('/contact?type=stay')}>
        Book a stay →
      </LiquidButton>
    </Section>
  );
}
