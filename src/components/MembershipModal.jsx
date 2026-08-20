import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import LiquidButton from './ui/LiquidButton';
import PaperSurface from './ui/PaperSurface';
import { submitToSheet } from '../lib/submitToSheet';

export default function MembershipModal({ isOpen, onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle: '',
    code: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) return;

    setIsSubmitting(true);
    setError('');

    // Keys are the sheet's column headings, and must match the membership
    // list in docs/apps-script/Code.gs exactly. This used to build its own
    // request here rather than going through lib/submitToSheet, which is how
    // it ended up posting different header names than the shared helper.
    const result = await submitToSheet('membership', {
      'Full Name': formData.name,
      'Phone/WhatsApp': formData.phone,
      'Email Address': formData.email,
      'Primary Performance Vehicle': formData.vehicle,
      'Invitation Code / Referral': formData.code,
    });

    setIsSubmitting(false);

    if (result.ok) {
      setIsSubmitted(true);
    } else {
      setError(`${result.error} Please try again, or email club.one@marque.one.`);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setError('');
      setFormData({ name: '', phone: '', email: '', vehicle: '', code: '' });
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-dark/88 backdrop-blur-md"
          />

          {/* Centred sheet, on the luxury board. The club's request is the
              heavier stock of the two on purpose: same construction as the
              contact panel, a grade up in weight and colour. */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative z-10 w-full max-w-[560px] max-h-[92svh]"
          >
            <PaperSurface
              variant="luxury"
              className="rounded-[2px] max-h-[92svh]"
              innerClassName="max-h-[92svh] overflow-y-auto scrollbar-hide p-[8vw] sm:p-12"
              style={{
                boxShadow:
                  '0 48px 90px -36px rgba(0,0,0,0.95), 0 2px 10px -4px rgba(0,0,0,0.7)',
              }}
            >

            {!isSubmitted ? (
              <div>
                <div className="mb-8">
                  <span className="text-[0.72rem] tracking-[0.24em] ink-faint block mb-3">
                    <span style={{ color: '#cc0000' }}>ONE</span>.CLUB
                  </span>
                  <h3 className="font-serif text-[clamp(2rem,5vw,2.8rem)] font-light leading-[1.02] tracking-tight">
                    Request Membership
                  </h3>
                  <p className="text-[0.65rem] tracking-widest uppercase ink-faint mt-2">
                    Private Motorsport Sanctuary · Bengaluru
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Full Name (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase ink-faint">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="paper-field py-2 text-[0.95rem]"
                    />
                  </div>

                  {/* Phone / WhatsApp (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase ink-faint">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 90000 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="paper-field py-2 text-[0.95rem]"
                    />
                  </div>

                  {/* Email Address (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase ink-faint">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="paper-field py-2 text-[0.95rem]"
                    />
                  </div>

                  {/* Primary Performance Vehicle (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase ink-faint">
                      Primary Performance Vehicle (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Make, Model & Year"
                      value={formData.vehicle}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                      className="paper-field py-2 text-[0.95rem]"
                    />
                  </div>

                  {/* Invitation Code / Referral (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase ink-faint">
                      Invitation Code / Referral (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Member referral code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="paper-field py-2 text-[0.95rem]"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="text-[0.78rem] leading-relaxed"
                      style={{ color: 'var(--accent)' }}
                    >
                      {error}
                    </p>
                  )}

                  <div className="mt-4">
                    <LiquidButton
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full rounded-none"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        'Submit Request →'
                      )}
                    </LiquidButton>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-4">
                <span className="text-[0.65rem] tracking-widest uppercase ink-faint">
                  RECEIVED
                </span>
                <h3 className="font-serif text-[clamp(2rem,5vw,2.8rem)] font-light leading-[1.02] tracking-tight">
                  Invitation Requested
                </h3>
                <p className="text-[0.7rem] tracking-widest uppercase ink-muted leading-relaxed">
                  The Marque.<span className="accent">One</span> team will review your application and reach out privately.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 text-[0.8rem] tracking-widest uppercase hover:opacity-70 transition-opacity cursor-pointer bg-transparent border-none"
                >
                  Close →
                </button>
              </div>
            )}
            </PaperSurface>

            {/* Outside the sheet, so it cannot scroll away with the
                content, and above it in the stack. */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 p-2 bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: '#F2EDE3' }}
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
