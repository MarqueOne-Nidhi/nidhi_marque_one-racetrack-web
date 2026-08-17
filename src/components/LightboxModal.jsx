import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function LightboxModal({ isOpen, src, caption, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[2000] bg-dark/95 backdrop-blur-xl flex items-center justify-center p-[4vw]"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-ivory/60 hover:text-ivory p-2 transition-colors z-10"
          >
            <X size={32} />
          </button>

          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
          >
            <img
              src={src}
              alt={caption || 'ONE.CLUB visual'}
              className="max-w-[90vw] max-h-[75vh] object-contain rounded-sm shadow-2xl"
            />
            {caption && (
              <p className="font-serif text-[clamp(1.6rem,3vw,2.5rem)] text-ivory/90 text-center mt-4 font-light">
                {caption}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
