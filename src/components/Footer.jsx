import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail } from 'lucide-react';
import FlickeringGrid from './ui/FlickeringGrid';
import { surfaceProps } from './ui/Section';

const EXPLORE = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'The Club', path: '/club' },
  { label: 'Contact', path: '/contact' },
];

const ENQUIRIES = [
  { label: 'Membership', modal: true },
  { label: 'General', href: 'mailto:info@marque.one' },
  { label: 'info@marque.one', href: 'mailto:info@marque.one', accent: true },
];

const LEGAL = [
  { label: 'Privacy Policy' },
  { label: 'Terms of Service' },
  { label: 'Cookie Policy' },
];

const SOCIALS = [
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
  { Icon: Mail, href: 'mailto:info@marque.one', label: 'Email' },
];

/**
 * The footer is the one fixed point in the surface system: it is `dark-raised`
 * on every page, always. That is what lets any page end on `dark` without the
 * two running together. The corresponding constraint is that no page may end
 * on `dark-raised` — see the surface table in ui/Section.jsx.
 */
export default function Footer({ onOpenModal }) {
  return (
    <footer
      style={{
        backgroundColor: '#050505',
        color: '#F5F1E8',
        '--surface': '#050505',
        '--surface-raised': '#0d0d0d',
        '--ink': '#F5F1E8',
        '--ink-muted': 'rgba(245, 241, 232, 0.70)',
        '--ink-faint': 'rgba(245, 241, 232, 0.50)',
        '--rule': 'rgba(245, 241, 232, 0.10)',
        '--accent': '#FF4D4D',
      }}
      data-surface="dark"
      data-tone="dark"
      className="relative w-full overflow-hidden border-t border-ivory/[0.08]"
    >
      {/* FlickeringGrid */}
      <FlickeringGrid
        className="absolute inset-0 z-0 pointer-events-none"
        squareSize={4}
        gridGap={6}
        color="#F5F1E8"
        maxOpacity={0.05}
        flickerChance={0.06}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-frame mx-auto px-gutter pt-[7vh] pb-[4vh]">
        <div className="flex flex-col md:flex-row gap-14 md:gap-0 justify-between">
          {/* LEFT: Branding */}
          <div className="flex flex-col items-center gap-5 text-center">
            <Link
              to="/"
              className="bg-transparent border-none p-0 cursor-pointer group flex items-center justify-center"
              aria-label="Marque One Home"
            >
              <img
                src="/logo-red.png"
                alt="Marque One Motorsport Estate"
                className="h-20 w-auto opacity-85 group-hover:opacity-100 transition-opacity duration-300 mx-auto"
              />
            </Link>

            <p className="font-serif text-[1.55rem] font-bold tracking-[0.14em] text-ivory/90 leading-none text-center">
              MARQUE.<span className="accent">ONE</span>
            </p>

            {/* Social icons */}
            <div className="flex items-center justify-center gap-3 mt-1">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 border border-ivory/15 flex items-center justify-center text-ivory/40 hover:text-ivory hover:border-ivory/40 transition-all duration-200"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT: Three column nav */}
          <div className="flex flex-wrap gap-12 md:gap-20">
            {/* EXPLORE */}
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/30 mb-1">
                Explore
              </span>
              {EXPLORE.map(({ label, path }) => (
                <Link
                  key={label}
                  to={path}
                  className="text-[0.82rem] font-light text-ivory/60 hover:text-ivory transition-colors font-sans tracking-wide"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* ENQUIRIES */}
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/30 mb-1">
                Enquiries
              </span>
              {ENQUIRIES.map(({ label, href, modal, accent }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    className={`text-[0.82rem] font-light transition-colors tracking-wide ${
                      accent ? 'accent hover:opacity-80' : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    key={label}
                    onClick={onOpenModal}
                    className="text-[0.82rem] font-light text-ivory/60 hover:text-ivory transition-colors cursor-pointer bg-transparent border-none text-left font-sans tracking-wide"
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {/* LEGAL */}
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/30 mb-1">
                Legal
              </span>
              {LEGAL.map(({ label }) => (
                <button
                  key={label}
                  className="text-[0.82rem] font-light text-ivory/60 hover:text-ivory transition-colors cursor-pointer bg-transparent border-none text-left font-sans tracking-wide"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-ivory/8 mt-[5vh] mb-[3vh]" />

        {/* Bottom strip */}
        <div className="flex flex-col justify-center items-center gap-2">
          <span className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/20 text-center">
            © 2026 Nidhi Marque <span className="accent opacity-80">ONE</span> Motors Pvt. Ltd. All rights reserved.
          </span>
          <span className="text-[0.55rem] tracking-[0.15em] uppercase text-ivory/15 text-center">
            Music: "Tranquility" by Project Ex
          </span>
        </div>
      </div>

      {/* Large watermark */}
      <div
        aria-hidden="true"
        className="relative z-10 w-full flex items-end justify-center select-none pointer-events-none pb-2"
        style={{ height: 'clamp(60px, 12vw, 140px)' }}
      >
        <span
          className="font-serif font-light text-ivory/5 leading-none whitespace-nowrap uppercase tracking-widest block"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)', lineHeight: 1 }}
        >
          MARQUE <span className="accent opacity-20">ONE</span>
        </span>
      </div>
    </footer>
  );
}
