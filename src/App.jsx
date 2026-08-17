import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import CursorLens from './components/CursorLens';
import GlobalAudioButton from './components/GlobalAudioButton';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembershipModal from './components/MembershipModal';
import LightboxModal from './components/LightboxModal';
import ScrollToTop from './components/ScrollToTop';
import SiteIntro from './components/SiteIntro';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Club from './pages/Club';

export default function App() {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
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
    <div className="relative min-h-screen bg-dark text-ivory">
      {/* Brand Opening Animation */}
      <SiteIntro />

      <ScrollToTop />

      {/* Custom cursor lens & audio — Club-only per §5 */}
      {isClubRoute && <CursorLens />}
      {isClubRoute && <GlobalAudioButton />}

      <Navbar
        activeTheme={activeTheme}
        onOpenModal={() => setIsMembershipOpen(true)}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/club" element={<Club onOpenModal={() => setIsMembershipOpen(true)} />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer onOpenModal={() => setIsMembershipOpen(true)} />

      <MembershipModal
        isOpen={isMembershipOpen}
        onClose={() => setIsMembershipOpen(false)}
      />

      <LightboxModal
        isOpen={lightboxData.isOpen}
        src={lightboxData.src}
        caption={lightboxData.caption}
        onClose={handleCloseLightbox}
      />
    </div>
  );
}
