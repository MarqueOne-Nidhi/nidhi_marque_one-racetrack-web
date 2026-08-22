import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidButton from './ui/LiquidButton';
import SectionLink from './ui/SectionLink';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import { NAV_LINKS } from '../data/navigation';
import { useContactModal } from './ContactModal';
import { holdScroll } from '../lib/scrollLock';

/**
 * The drawer's motion.
 *
 * Opening, the rows arrive from the right edge one after another and settle;
 * closing, they leave the way they came, in reverse order so the list empties
 * from the bottom up rather than unravelling from the top. The panel itself
 * only fades: two things sliding at once reads as the whole page moving.
 *
 * Exiting is quicker than entering, and on a sharper curve. A reader who has
 * asked to close something has already decided, and watching it leave at the
 * pace it arrived is the part that feels slow.
 */
const DRAWER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, staggerChildren: 0.055, delayChildren: 0.06 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, delay: 0.12, staggerChildren: 0.04, staggerDirection: -1 },
  },
};

const ROW = {
  hidden: { opacity: 0, x: 56 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: 56, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
};

/**
 * The bar.
 *
 * The desktop menu is Base UI through ui/navigation-menu. That replaced a
 * hand-rolled panel which existed mostly to do things Base UI does on its
 * own: a close timer so the pointer could cross the gap between item and
 * panel, a measured viewport x so the panel could draw an arrow under the
 * open item, a ref to every item to measure from, and a resize listener to
 * re-aim it all. None of that is here now.
 *
 * A Base UI trigger is a button by default, which would leave Home, The Club
 * and Business as handles for their panels and nothing else: no way to reach
 * the page itself except through a section of it. Each one is given its `to`
 * and rendered as a link instead, so hovering opens the panel and clicking
 * goes to the page. About has no panel and is a link outright.
 */
export default function Navbar({ onOpenModal, activeTheme }) {
  const openContact = useContactModal();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileNav, setOpenMobileNav] = useState(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const location = useLocation();

  // The club has its own way in. Offering a general Contact button on the one
  // page whose whole purpose is membership sends the visitor to the wrong
  // form, so on /club the CTA changes label and target together: a button
  // that says Join has to open the membership request, not an enquiry.
  const isClubRoute = location.pathname.startsWith('/club');
  const ctaLabel = isClubRoute ? 'Join ONE.CLUB' : 'Contact';
  const onCta = isClubRoute ? onOpenModal : () => openContact('Drive', 'Navbar');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the drawer on route change, and on the way up to desktop.
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMobileNav(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The drawer covers the phone from the bar down, so the page underneath
  // has to stop moving: it was scrolling behind the menu, which is how you
  // open the menu, close it, and find yourself somewhere else on the page.
  // Escape closes it too, as it does the panels.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);

    const release = holdScroll();

    return () => {
      window.removeEventListener('keydown', handleKey);
      release();
    };
  }, [isMobileMenuOpen]);

  const isLight = activeTheme === 'light';

  // The bar takes its colour from the section under it, except while the
  // drawer is open. The drawer is dark whatever that section is, and the bar
  // stands on top of it, so on a light section the mark and the close cross
  // were being drawn in ink on a black panel: both simply disappeared.
  const barIsLight = isLight && !isMobileMenuOpen;

  const logoSrc = isLogoHovered
    ? '/logo-red.svg'
    : barIsLight
    ? '/logo-black.svg'
    : '/logo-white.svg';

  const textColorClass = isLight ? 'text-dark' : 'text-ivory';
  const barTextColorClass = barIsLight ? 'text-dark' : 'text-ivory';

  // No dividing line under the bar. The tint and the blur already separate it
  // from whatever is scrolling underneath, and the hairline was the only hard
  // edge on an otherwise edgeless bar, so it read as a seam across the page.
  // Nothing of its own while the drawer is open: the drawer is the ground
  // there, and a tinted strip across the top of it reads as a seam.
  const navBgClass = isMobileMenuOpen
    ? 'bg-transparent'
    : isScrolled
    ? isLight
      ? 'bg-[#F5F1E8]/85 backdrop-blur-md'
      : 'bg-[#090909]/85 backdrop-blur-md'
    : 'bg-transparent';

  /** Every section link behind a top-level item, however it is grouped. */
  const sectionsOf = ({ items, groups }) =>
    items || (groups ? groups.flatMap((g) => g.items) : []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full h-[76px] px-[5vw] flex items-center justify-between z-50 transition-all duration-500 ${navBgClass}`}
      >
        <Link
          to="/"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          className="tap-target flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          aria-label="Marque One Home"
        >
          <img
            src={logoSrc}
            alt="Marque One Motorsport Club"
            className="h-7 w-auto transition-all duration-300"
          />
        </Link>

        {/* ── Desktop ──────────────────────────────────────────────────── */}
        {/* tone, not a CSS variable on the bar: the panel is portalled out of
            here, so it cannot inherit anything the bar publishes. */}
        <NavigationMenu
          className={`hidden md:flex ${textColorClass}`}
          tone={isLight ? 'light' : 'dark'}
          delay={120}
        >
          <NavigationMenuList className="gap-[1.2vw]">
            {NAV_LINKS.map((link) => {
              const sections = sectionsOf(link);

              if (!sections.length) {
                return (
                  <NavigationMenuItem key={link.path}>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      render={<NavLink to={link.path} end={link.path === '/'} />}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              }

              return (
                <NavigationMenuItem key={link.path}>
                  <NavigationMenuTrigger to={link.path}>{link.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {/* No heading. It only ever repeated the trigger sitting
                        directly above it, which is now the link to the page
                        as well, so there is nothing left for it to say. */}
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                      {sections.map((item) => (
                        <li key={item.path}>
                          <NavigationMenuLink render={<SectionLink to={item.path} />}>
                            {item.label}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden md:flex items-center">
          <LiquidButton variant={isLight ? 'secondary' : 'default'} onClick={onCta}>
            {ctaLabel}
          </LiquidButton>
        </div>

        {/* The right of the bar on a phone: the call to action, then the
            control that opens the drawer. `md:contents` dissolves this
            wrapper from md up, where both of its children are hidden anyway
            and an empty third item would push the desktop bar's
            space-between around. */}
        <div className="flex items-center gap-2 md:contents">
          {/* The same call to action the wide bar carries, which a phone
              could reach only by opening the drawer first. It stands down
              while the drawer is open, where the drawer offers it again at
              the bottom of the list and two of them a screen apart is one
              too many. */}
          {!isMobileMenuOpen && (
            <LiquidButton
              size="sm"
              variant={barIsLight ? 'secondary' : 'default'}
              onClick={onCta}
              className="md:hidden"
            >
              {ctaLabel}
            </LiquidButton>
          )}

          {/* The two marks are one control, so they turn into each other rather
              than cutting: the bars rotate out to the left as the cross rotates
              in from the right, which is the direction the drawer behind them
              is travelling. `close-x` adds the quarter turn under a finger that
              the close mark on both panels has. */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className={`close-x tap-target md:hidden p-2 bg-transparent border-none cursor-pointer ${barTextColorClass}`}
            aria-label="Toggle Navigation"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="relative block h-6 w-6">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={isMobileMenuOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: isMobileMenuOpen ? -90 : 90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: isMobileMenuOpen ? 90 : -90, scale: 0.7 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 block"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </div>
      </nav>

      {/* ── Mobile ─────────────────────────────────────────────────────────
          Its own drawer rather than the same menu at a smaller size. A hover
          menu has nothing to open it on a touch screen, and the panel wants
          the whole width here rather than a positioned popup. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={DRAWER}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 md:hidden overflow-y-auto bg-dark px-[6vw] pb-8 pt-[calc(76px+2rem)]"
          >
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {NAV_LINKS.map((link) => {
                const sections = sectionsOf(link);
                const isOpen = openMobileNav === link.path;

                return (
                  <motion.li
                    key={link.path}
                    variants={ROW}
                    className="border-b border-ivory/10"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 py-4 font-sans text-[0.95rem] tracking-widest uppercase text-ivory no-underline"
                      >
                        {link.label}
                      </Link>

                      {sections.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpenMobileNav(isOpen ? null : link.path)}
                          aria-label={`${isOpen ? 'Hide' : 'Show'} ${link.label} sections`}
                          aria-expanded={isOpen}
                          className="tap-target cursor-pointer border-none bg-transparent p-3 text-ivory/60"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && sections.length > 0 && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="m-0 list-none overflow-hidden p-0 pb-3 pl-3"
                        >
                          {sections.map((item) => (
                            <li key={item.path}>
                              <SectionLink
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-2 font-sans text-[0.82rem] font-light text-ivory/70 no-underline"
                              >
                                {item.label}
                              </SectionLink>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div variants={ROW} className="mt-8">
              <LiquidButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onCta();
                }}
              >
                {ctaLabel} →
              </LiquidButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
