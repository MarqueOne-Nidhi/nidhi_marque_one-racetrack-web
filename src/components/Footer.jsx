import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail } from 'lucide-react';
import { surfaceProps } from './ui/Section';
import { useContactModal } from './ContactModal';
import LiquidButton from './ui/LiquidButton';

const EXPLORE = [
  { label: 'Home', path: '/' },
  { label: 'Business', path: '/business' },
  { label: 'About', path: '/about' },
  { label: 'The Club', path: '/club' },
  // Last, and in this column rather than under Enquiries, because that
  // one is buttons and this is a route.
  { label: 'FAQs', path: '/faqs' },
];

const ENQUIRIES = [
  // Contact is a popover now, so it sits with the other button here rather
  // than in EXPLORE, which is a column of routes.
  { label: 'Contact', contact: true },
  { label: 'Membership', modal: true },
  { label: 'General', href: 'mailto:project.motorclub@marque.one' },
  { label: 'project.motorclub@marque.one', href: 'mailto:project.motorclub@marque.one', accent: true },
];

const LEGAL = [
  { label: 'Privacy Policy' },
  { label: 'Terms of Service' },
  { label: 'Cookie Policy' },
];

const SOCIALS = [
  { Icon: Facebook, href: 'https://www.facebook.com/Marque-One-Motor-Club-2371764663044839/', label: 'Facebook' },
  { Icon: Instagram, href: 'https://www.instagram.com/marqueone.motorclub/', label: 'Instagram' },
  { Icon: Mail, href: 'mailto:project.motorclub@marque.one', label: 'Email' },
];

/**
 * The watermark fades out downwards, so the wordmark sinks into the foot of
 * the page rather than sitting on it.
 *
 * A mask, not a `background-clip: text` gradient. The wordmark is two colours,
 * ivory and #cc0000, and painting a gradient through it would flatten both
 * into whatever the gradient is made of. A mask leaves the colours alone and
 * only takes the alpha down.
 *
 * The percentages are read against the span's own box, which `line-height: 1`
 * makes exactly one em tall, and the letters do not fill it. Cormorant
 * Garamond is 1000 units to the em with an ascent of 881 and a descent of
 * 281, so with a one em line box the half-leading is negative and the
 * baseline lands at 0.80em from the top; the capitals, at roughly 0.66em, run
 * from about 14 per cent down to 80 per cent. Fading to zero at 100 per cent
 * would therefore leave the feet of the letters at about a fifth of their
 * alpha, which is dim but plainly still there. Zero belongs at the baseline.
 *
 * The middle stops are a smoothstep between the two ends. A single linear
 * ramp puts a visible shoulder where the fade starts and a corner where it
 * lands, and on type this faint both edges read as banding.
 */
const WATERMARK_FADE =
  'linear-gradient(to bottom,' +
  ' #000 0%,' +
  ' #000 35%,' + /* holds full strength through the top third of the caps */
  ' rgba(0,0,0,0.88) 45%,' +
  ' rgba(0,0,0,0.61) 55%,' +
  ' rgba(0,0,0,0.30) 65%,' +
  ' rgba(0,0,0,0.08) 74%,' +
  ' transparent 82%)'; /* just past the baseline */

/**
 * The footer is the one fixed point in the surface system: it is `dark-raised`
 * on every page, always. That is what lets any page end on `dark` without the
 * two running together. The corresponding constraint is that no page may end
 * on `dark-raised` — see the surface table in ui/Section.jsx.
 */
export default function Footer({ onOpenModal }) {
  const openContact = useContactModal();
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
        '--accent': '#cc0000',
      }}
      data-surface="dark"
      data-tone="dark"
      className="relative w-full overflow-hidden border-t border-ivory/20"
    >
      {/* Main content */}
      <div className="relative z-10 max-w-frame mx-auto px-gutter pt-[7vh] pb-[4vh]">
        {/* DESKTOP FOOTER (Untouched for md and above) */}
        <div className="hidden md:flex flex-row gap-0 justify-between">
          {/* LEFT: Branding */}
          <div className="flex flex-col items-center gap-5 text-center">
            <Link
              to="/"
              className="bg-transparent border-none p-0 cursor-pointer group flex items-center justify-center"
              aria-label="Marque One Home"
            >
              <img
                src="/logo-red.svg"
                alt="Marque One Motorsport Club"
                className="h-20 w-auto opacity-85 group-hover:opacity-100 transition-opacity duration-300 mx-auto"
              />
            </Link>

            <p className="font-serif text-[1.55rem] font-bold tracking-[0.14em] text-ivory/90 leading-none text-center">
              MARQUE.<span style={{ color: '#cc0000' }}>ONE</span>
            </p>

            {/* Social icons */}
            <div className="flex items-center justify-center gap-3 mt-1">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="tap-target w-8 h-8 border border-ivory/30 flex items-center justify-center text-ivory/70 hover:text-ivory hover:border-ivory/70 transition-all duration-200"
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
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/60 mb-1">
                Explore
              </span>
              {EXPLORE.map(({ label, path }) => (
                <Link
                  key={label}
                  to={path}
                  className="text-[0.82rem] font-light text-ivory/75 hover:text-ivory transition-colors font-sans tracking-wide"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* ENQUIRIES */}
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/60 mb-1">
                Enquiries
              </span>
              {ENQUIRIES.map(({ label, href, modal, contact, accent }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    className={`text-[0.82rem] font-light transition-colors tracking-wide ${
                      accent ? 'accent hover:opacity-80' : 'text-ivory/75 hover:text-ivory'
                    }`}
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    key={label}
                    onClick={contact ? () => openContact('Drive', 'Footer') : () => onOpenModal('Footer')}
                    className="text-[0.82rem] font-light text-ivory/75 hover:text-ivory transition-colors cursor-pointer bg-transparent border-none text-left font-sans tracking-wide"
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {/* LEGAL */}
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/60 mb-1">
                Legal
              </span>
              {LEGAL.map(({ label }) => (
                <button
                  key={label}
                  className="text-[0.82rem] font-light text-ivory/75 hover:text-ivory transition-colors cursor-pointer bg-transparent border-none text-left font-sans tracking-wide"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP Divider & Bottom strip */}
        <div className="hidden md:block">
          <div className="w-full h-px bg-ivory/20 mt-[5vh] mb-[3vh]" />
          <div className="flex flex-col justify-center items-center gap-2">
            <span className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/60 text-center">
              © 2026 Nidhi Marque.<span className="accent">One</span> Motors Pvt. Ltd. All rights reserved.
            </span>
          </div>
        </div>

        {/* MOBILE BENTO GRID (Visible only on < md) */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {/* Bento Tile 1: Hero Branding & Socials */}
          <div className="col-span-2 flex flex-col items-center text-center gap-3 py-4">
            <Link
              to="/"
              className="bg-transparent border-none p-0 cursor-pointer group flex flex-col items-center justify-center"
              aria-label="Marque One Home"
            >
              <img
                src="/logo-red.svg"
                alt="Marque One Motorsport Club"
                className="h-16 w-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300 mx-auto"
              />
              <p className="font-serif text-[1.45rem] font-bold tracking-[0.16em] text-ivory mt-2.5 leading-none">
                MARQUE.<span style={{ color: '#cc0000' }}>ONE</span>
              </p>
            </Link>
            <p className="text-[0.62rem] tracking-[0.22em] uppercase text-ivory/50 font-sans">
              Private Motoring Sanctuary · Bengaluru
            </p>

            {/* Social links - Desktop button format */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="tap-target w-8 h-8 border border-ivory/30 flex items-center justify-center text-ivory/70 hover:text-ivory hover:border-ivory/70 transition-all duration-200"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Bento Tile 2: Explore Navigation */}
          <div className="col-span-1 rounded-sm bg-[#0e0e0d] p-4 flex flex-col justify-between">
            <div>
              <div className="mb-3.5">
                <span className="text-[0.62rem] font-medium tracking-[0.2em] uppercase text-ivory/60">
                  Explore
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {EXPLORE.map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="group flex items-center justify-between text-[0.82rem] font-light text-ivory/80 hover:text-ivory active:text-brand transition-colors font-sans py-0.5"
                  >
                    <span>{label}</span>
                    <span className="text-[0.65rem] text-ivory/30 group-hover:text-ivory/80 group-hover:translate-x-0.5 transition-all">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bento Tile 3: Enquiries */}
          <div className="col-span-1 rounded-sm bg-[#0e0e0d] p-4 flex flex-col justify-between">
            <div>
              <div className="mb-3.5">
                <span className="text-[0.62rem] font-medium tracking-[0.2em] uppercase text-ivory/60">
                  Enquiries
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => openContact('Drive', 'Footer')}
                  className="group flex items-center justify-between text-left text-[0.82rem] font-light text-ivory/80 hover:text-ivory transition-colors font-sans py-0.5 cursor-pointer bg-transparent border-none w-full"
                >
                  <span>Contact</span>
                  <span className="text-[0.65rem] text-ivory/30 group-hover:text-ivory/80 group-hover:translate-x-0.5 transition-all">→</span>
                </button>

                <button
                  onClick={() => onOpenModal('Footer')}
                  className="group flex items-center justify-between text-left text-[0.82rem] font-light text-ivory/80 hover:text-ivory transition-colors font-sans py-0.5 cursor-pointer bg-transparent border-none w-full"
                >
                  <span>Membership</span>
                  <span className="text-[0.65rem] text-brand group-hover:translate-x-0.5 transition-all font-bold">★</span>
                </button>

                <a
                  href="mailto:project.motorclub@marque.one"
                  className="group flex items-center justify-between text-[0.82rem] font-light text-ivory/80 hover:text-ivory transition-colors font-sans py-0.5"
                >
                  <span>General</span>
                  <span className="text-[0.65rem] text-ivory/30 group-hover:text-ivory/80 group-hover:translate-x-0.5 transition-all">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bento Tile 4: Direct Concierge Line */}
          <div className="col-span-2 rounded-sm bg-[#0e0e0d] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Mail size={16} className="text-ivory/60 flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[0.58rem] tracking-[0.2em] uppercase text-ivory/50">Direct Concierge</span>
                <a
                  href="mailto:project.motorclub@marque.one"
                  className="text-[0.78rem] font-medium text-ivory hover:text-brand transition-colors font-sans break-all"
                >
                  project.motorclub@marque.one
                </a>
              </div>
            </div>
            <LiquidButton
              as="a"
              href="mailto:project.motorclub@marque.one"
              className="w-full sm:w-auto text-center"
            >
              Write to us →
            </LiquidButton>
          </div>

          {/* Bento Tile 5: Legal & Colophon */}
          <div className="col-span-2 flex flex-col items-center gap-3 text-center pt-2">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {LEGAL.map(({ label }) => (
                <button
                  key={label}
                  className="text-[0.72rem] tracking-wider text-ivory/60 hover:text-ivory transition-all font-sans cursor-pointer bg-transparent border-none p-0"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[0.58rem] tracking-[0.18em] uppercase text-ivory/40 leading-relaxed max-w-[340px] pt-1">
              © 2026 Nidhi Marque.<span className="accent">One</span> Motors Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Large watermark */}
      <div
        aria-hidden="true"
        className="relative z-10 w-full flex items-end justify-center select-none pointer-events-none pb-2"
        style={{ height: 'clamp(60px, 12vw, 140px)' }}
      >
        {/* MARQUE was ivory/5 against ONE at 20 per cent of #cc0000, and the
            two halves of one word were not reading as one word.

            Matching them is not a matter of equalising luminance: the two are
            already almost equal there, 1.078:1 against the ground versus
            1.097:1, because luminance weights red at 0.21 and so barely counts
            what makes the red half visible. Nearly all of ONE's presence is
            chroma. Matching perceived difference from the ground instead, by
            dE2000, asks for 27 per cent, but that treats a colour difference
            and a lightness difference as interchangeable, which they are not
            for large type read at a glance. 15 sits between the two measures
            and is where the halves actually match by eye. */}
        <span
          className="font-serif font-semibold text-ivory/15 leading-none whitespace-nowrap uppercase tracking-[0.02em] block"
          style={{
            fontSize: 'clamp(3.5rem, 11vw, 10rem)',
            lineHeight: 1,
            // On the span rather than the wrapper. The wrapper is a fixed
            // clamp() box that the type deliberately overflows, so a mask
            // there would be measured against the wrong height. The span's
            // box is the line box, which is what the letters actually sit in.
            maskImage: WATERMARK_FADE,
            WebkitMaskImage: WATERMARK_FADE,
            // Without these the gradient tiles beyond the box instead of
            // ending, which puts a second fade above the letters.
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
          }}
        >
          MARQUE.<span style={{ color: '#cc0000' }} className="opacity-20">ONE</span>
        </span>
      </div>
    </footer>
  );
}
