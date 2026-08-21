import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidButton from './ui/LiquidButton';
import NavSubPanel from './NavSubPanel';
import { NAV_LINKS } from '../data/navigation';
import { useContactModal } from './ContactModal';

export default function Navbar({ onOpenModal, activeTheme }) {
  const openContact = useContactModal();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [openSubNav, setOpenSubNav] = useState(null);
  const [openMobileNav, setOpenMobileNav] = useState(null);
  // Viewport x of the open item's centre. The panel draws its own pointer at
  // this x and clamps it to its own width, so it is passed through raw.
  const [pointerX, setPointerX] = useState(0);
  const closeTimer = useRef(null);
  const itemRefs = useRef({});
  const location = useLocation();

  // The club has its own way in. Offering a general Contact button on the one
  // page whose whole purpose is membership sends the visitor to the wrong
  // form, so on /club the CTA changes label and target together: a button
  // that says Join has to open the membership request, not an enquiry.
  const isClubRoute = location.pathname.startsWith('/club');
  const ctaLabel = isClubRoute ? 'Join ONE.CLUB' : 'Contact';
  const onCta = isClubRoute ? onOpenModal : () => openContact('Drive', 'Navbar');

  const aimPointer = (path) => {
    const el = itemRefs.current[path];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPointerX(rect.left + rect.width / 2);
  };

  // Small close delay so the pointer can cross the gap into the panel
  const openSub = (path) => {
    clearTimeout(closeTimer.current);
    aimPointer(path);
    setOpenSubNav(path);
  };
  const closeSub = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenSubNav(null), 120);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close every menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMobileNav(null);
    setOpenSubNav(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpenSubNav(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
      // The items move with the bar, so a resize while a panel is open has to
      // re-aim the pointer or it is left aimed at where the item used to be.
      if (openSubNav) aimPointer(openSubNav);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [openSubNav]);

  const isLight = activeTheme === 'light';

  const logoSrc = isLogoHovered
    ? '/logo-red.svg'
    : isLight
    ? '/logo-black.svg'
    : '/logo-white.svg';

  const textColorClass = isLight ? 'text-dark' : 'text-ivory';

  // No dividing line under the bar. The tint and the blur already separate it
  // from whatever is scrolling underneath, and the hairline was the only hard
  // edge on an otherwise edgeless bar, so it read as a seam across the page.
  const navBgClass = isScrolled
    ? isLight
      ? 'bg-[#F5F1E8]/85 backdrop-blur-md'
      : 'bg-[#090909]/85 backdrop-blur-md'
    : 'bg-transparent';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full h-[76px] px-[5vw] flex items-center justify-between z-50 transition-all duration-500 ${navBgClass}`}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          aria-label="Marque One Home"
        >
          <img
            src={logoSrc}
            alt="Marque One Motorsport Club"
            className="h-7 w-auto transition-all duration-300"
          />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-[2.4vw] list-none m-0 p-0">
          {NAV_LINKS.map(({ label, path, groups, items }) => {
            const hasSub = Boolean(groups || items);
            return (
              <li
                key={path}
                ref={(el) => {
                  itemRefs.current[path] = el;
                }}
                className="relative"
                onMouseEnter={() => hasSub && openSub(path)}
                onMouseLeave={() => hasSub && closeSub()}
                onFocus={() => hasSub && openSub(path)}
                onBlur={(e) => {
                  if (hasSub && !e.currentTarget.contains(e.relatedTarget)) closeSub();
                }}
              >
                <NavLink
                  to={path}
                  end={path === '/'}
                  aria-haspopup={hasSub ? 'true' : undefined}
                  aria-expanded={hasSub ? openSubNav === path : undefined}
                  className={({ isActive }) =>
                    `block py-[1.4rem] text-[0.75rem] tracking-[0.14em] uppercase transition-opacity duration-300 font-sans ${textColorClass} ${
                      isActive ? 'opacity-100 font-medium' : 'opacity-70 hover:opacity-100'
                    }`
                  }
                >
                  {label}
                </NavLink>

                {/* Hover sub-navigation — desktop only */}
                {hasSub && (
                  <AnimatePresence>
                    {openSubNav === path && (
                      <NavSubPanel
                        groups={groups}
                        items={items}
                        isLight={isLight}
                        pointerX={pointerX}
                        onNavigate={() => setOpenSubNav(null)}
                      />
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA — Contact page link */}
        <div className="hidden md:flex items-center">
          <LiquidButton
            variant={isLight ? 'secondary' : 'default'}
            onClick={onCta}
          >
            {ctaLabel}
          </LiquidButton>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className={`md:hidden p-2 bg-transparent border-none cursor-pointer ${textColorClass}`}
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Full-Screen Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#090909] text-ivory z-40 flex flex-col justify-between px-[8vw] pt-[100px] pb-section-xs"
          >
            {/* Categories collapse by default. Expanded, Home alone runs to
                twenty-odd links — a drawer that opens on all of them is a wall
                of text before the reader has chosen anything. */}
            <div className="flex flex-col gap-6 overflow-y-auto">
              {NAV_LINKS.map(({ label, path, groups, items }) => {
                const hasSub = Boolean(groups || items);
                const isOpen = openMobileNav === path;
                return (
                  <div key={path} className="flex flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <Link
                        to={path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-serif text-[clamp(2.2rem,8vw,3.2rem)] font-light tracking-tight hover:opacity-50 transition-opacity text-left text-ivory"
                      >
                        {label}
                      </Link>

                      {hasSub && (
                        <button
                          onClick={() => setOpenMobileNav(isOpen ? null : path)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Hide' : 'Show'} ${label} sections`}
                          className="shrink-0 p-2 bg-transparent border-none text-ivory/50 hover:text-ivory transition-colors"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {hasSub && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-6 pt-4 pl-1 border-l border-ivory/10">
                            {items && (
                              <div className="flex flex-col gap-2">
                                {items.map((item) => (
                                  <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="pl-4 text-[0.7rem] tracking-[0.12em] uppercase font-sans text-ivory/60 hover:text-ivory transition-colors"
                                  >
                                    {item.label}
                                  </Link>
                                ))}
                              </div>
                            )}

                            {groups &&
                              groups.map((group) => (
                                <div key={group.label} className="flex flex-col gap-2">
                                  {/* A label, not a link: everything it points
                                      at is listed directly beneath it. */}
                                  <span className="pl-4 text-[0.6rem] tracking-[0.2em] uppercase text-ivory/35">
                                    {group.label}
                                  </span>
                                  {group.items.map((item) => (
                                    <Link
                                      key={item.path}
                                      to={item.path}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="pl-4 text-[0.7rem] tracking-[0.12em] uppercase font-sans text-ivory/60 hover:text-ivory transition-colors"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 border-t border-ivory/10 pt-6">
              <LiquidButton
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onCta();
                }}
              >
                {ctaLabel} →
              </LiquidButton>
              <span className="text-[0.65rem] tracking-widest uppercase text-ivory/40 text-center">
                BENGALURU · INDIA
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
