import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import CursorLens from './components/CursorLens';
import GlobalAudioButton from './components/GlobalAudioButton';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembershipModal from './components/MembershipModal';
import { ContactModalProvider } from './components/ContactModal';
import LightboxModal from './components/LightboxModal';
import ScrollToTop from './components/ScrollToTop';
import SiteIntro from './components/SiteIntro';

import Home from './pages/Home';
import About from './pages/About';
import Business from './pages/Business';
import Club from './pages/Club';

export default function App() {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  // Which call to action opened the membership request, recorded against the
  // submission as `Opened Via`. onOpenModal takes it as an argument rather
  // than being bound per call site, so a bare `onClick={onOpenModal}` further
  // down would pass a click event and land a PointerEvent in the sheet. Every
  // call site therefore wraps it and names itself.
  const [membershipSource, setMembershipSource] = useState('');
  const openMembership = (from = '') => {
    setMembershipSource(from);
    setIsMembershipOpen(true);
  };
  const [lightboxData, setLightboxData] = useState({ isOpen: false, src: '', caption: '' });
  
  const location = useLocation();
  const isClubRoute = location.pathname.startsWith('/club');

  // The navbar takes its theme from the section directly beneath it.
  //
  // This used to observe every [data-tone] section at threshold 0.25 and call
  // setActiveTheme for each intersecting entry, which meant the last entry in
  // the batch won rather than the relevant one. On any page that opens with a
  // short light section above a tall dark one, both cleared 0.25 at rest, the
  // dark one came last, and the navbar went dark while the strip it occupies
  // was still ivory — rendering the white logo invisible on Contact and About.
  //
  // The observer now only reports that something near the top changed; the
  // section under the navbar is then resolved geometrically, which cannot be
  // ambiguous the way a ratio test is.
  useEffect(() => {
    const NAV_HEIGHT = 76;
    const sections = Array.from(document.querySelectorAll('[data-tone]'));

    if (!sections.length) {
      setActiveTheme(isClubRoute ? 'dark' : 'light');
      return;
    }

    const resolveTone = () => {
      const probeY = NAV_HEIGHT / 2;
      const under = sections.find((sec) => {
        const { top, bottom } = sec.getBoundingClientRect();
        return top <= probeY && bottom > probeY;
      });
      const tone = under?.getAttribute('data-tone');
      if (tone) setActiveTheme(tone);
    };

    resolveTone();

    const observer = new IntersectionObserver(resolveTone, {
      threshold: [0, 0.01, 0.5, 1],
    });
    sections.forEach((sec) => observer.observe(sec));

    window.addEventListener('scroll', resolveTone, { passive: true });
    window.addEventListener('resize', resolveTone, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', resolveTone);
      window.removeEventListener('resize', resolveTone);
    };
  }, [location.pathname, isClubRoute]);

  const handleOpenLightbox = (src, caption) => {
    setLightboxData({ isOpen: true, src, caption });
  };

  const handleCloseLightbox = () => {
    setLightboxData((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ContactModalProvider>
      <div className="relative min-h-screen bg-dark text-ivory">
        {/* Brand Opening Animation */}
        <SiteIntro />

        <ScrollToTop />

        {/* Custom cursor lens & audio — Club-only per §5 */}
        {isClubRoute && <CursorLens />}
        {isClubRoute && <GlobalAudioButton />}

        <Navbar
          activeTheme={activeTheme}
          onOpenModal={() => openMembership('Navbar')}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/business" element={<Business />} />
          <Route path="/about" element={<About />} />
          <Route path="/club" element={<Club onOpenModal={openMembership} />} />
        </Routes>

        <Footer onOpenModal={() => openMembership('Footer')} />

        <MembershipModal
          isOpen={isMembershipOpen}
          source={membershipSource}
          onClose={() => setIsMembershipOpen(false)}
        />

        <LightboxModal
          isOpen={lightboxData.isOpen}
          src={lightboxData.src}
          caption={lightboxData.caption}
          onClose={handleCloseLightbox}
        />
      </div>
    </ContactModalProvider>
  );
}
