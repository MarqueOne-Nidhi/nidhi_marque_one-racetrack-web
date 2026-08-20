import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import EnquiryForm from './EnquiryForm';
import PaperSurface from './ui/PaperSurface';
import { ENQUIRY } from '../data/home';

/**
 * Contact, as a popover rather than a page.
 *
 * It is reached from twelve places: the navbar on every route, the footer, the
 * two hero buttons, and six calls to action spread through the Club page. That
 * is why this is a context and not a prop. The membership modal is passed down
 * by hand from App, which works because it has three call sites all one level
 * deep; the same approach here would have meant threading a callback through
 * Club into TheDrive, TheCar, TheHouse, Membership and FinalScene, none of
 * which otherwise care that a modal exists.
 *
 *   const openContact = useContactModal();
 *   <button onClick={() => openContact('Stay')}>…</button>
 *
 * The argument preselects the enquiry type, which is what the old
 * `/contact?type=stay` query parameter did for the page this replaces.
 *
 * The panel is centred and printed on the premium stock from ui/PaperSurface.
 * It was a right-hand drawer, matching the membership one; both are sheets of
 * paper now, and paper is set down in front of you rather than slid in from
 * the side of the room.
 */
const ContactModalContext = createContext(() => {});

export function useContactModal() {
  return useContext(ContactModalContext);
}

export function ContactModalProvider({ children }) {
  const [type, setType] = useState('Drive');
  const [isOpen, setIsOpen] = useState(false);
  // Remounts EnquiryForm on each open, so a half-typed message or a "received"
  // state from a previous enquiry is not still sitting there the next time.
  const [instance, setInstance] = useState(0);

  const open = useCallback((nextType = 'Drive') => {
    setType(ENQUIRY.toggles.includes(nextType) ? nextType : 'Drive');
    setInstance((n) => n + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ContactModalContext.Provider value={open}>
      {children}
      <ContactModal isOpen={isOpen} type={type} instance={instance} onClose={close} />
    </ContactModalContext.Provider>
  );
}

function ContactModal({ isOpen, type, instance, onClose }) {
  // Escape closes it, and the page underneath does not scroll while it is
  // open: the drawer has its own scroll, and two scrollable planes at once is
  // how a reader loses their place on the page they were reading.
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/85 backdrop-blur-md"
          />

          {/* Centred, and rising rather than sliding in from an edge. A sheet
              of paper is put down in front of you; it does not arrive from
              off-stage. */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative z-10 w-full max-w-[560px] max-h-[90svh]"
          >
            <PaperSurface
              variant="premium"
              className="rounded-[2px] max-h-[90svh]"
              innerClassName="max-h-[90svh] overflow-y-auto scrollbar-hide p-[8vw] sm:p-12"
              style={{
                // A printed sheet, not a floating card: a long soft shadow for
                // the drop and a tight dark one for where it meets the ground.
                boxShadow:
                  '0 48px 90px -36px rgba(0,0,0,0.85), 0 2px 10px -4px rgba(0,0,0,0.6)',
              }}
            >
              <div className="mb-9 pr-10">
                <span className="text-[0.6rem] tracking-ultra uppercase ink-faint block mb-3">
                  MARQUE.<span className="accent">ONE</span> MOTORSPORT CLUB
                </span>
                <h3 className="font-serif text-[clamp(2rem,5vw,2.8rem)] font-light leading-[1.02] tracking-tight">
                  {ENQUIRY.heading}
                </h3>
                <p className="font-sans text-[0.88rem] font-light ink-muted mt-3 leading-relaxed">
                  {ENQUIRY.sub}
                </p>
              </div>

              <EnquiryForm key={instance} initialType={type} compact tone="light" />
            </PaperSurface>

            {/* Outside the sheet, so it cannot scroll away with the
                content, and above it in the stack. */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: '#14140F' }}
              aria-label="Close contact form"
            >
              <X size={22} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
