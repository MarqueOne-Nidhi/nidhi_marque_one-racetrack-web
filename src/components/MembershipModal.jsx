import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import LiquidButton from './ui/LiquidButton';
import { GOOGLE_SHEET_SCRIPT_URL } from '../config';

export default function MembershipModal({ isOpen, onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      if (GOOGLE_SHEET_SCRIPT_URL) {
        const bodyData = new URLSearchParams();
        bodyData.append('Timestamp', new Date().toLocaleString());
        bodyData.append('Full Name', formData.name);
        bodyData.append('Phone/WhatsApp', formData.phone);
        bodyData.append('Email Address', formData.email);
        bodyData.append('Primary Performance Vehicle (Optional)', formData.vehicle || 'N/A');
        bodyData.append('Invitation Code/Referral (Optional)', formData.code || 'N/A');

        await fetch(GOOGLE_SHEET_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyData.toString(),
        });
      }
    } catch (err) {
      console.warn('Google Sheet submission warning:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setFormData({ name: '', phone: '', email: '', vehicle: '', code: '' });
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-dark/80 backdrop-blur-md"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-drawer h-full bg-dark-secondary border-l border-ivory/10 p-[8vw] md:p-[3rem] flex flex-col justify-between overflow-y-auto z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-ivory/60 hover:text-ivory p-2 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {!isSubmitted ? (
              <div className="my-auto">
                <div className="mb-8">
                  <span className="text-[0.65rem] tracking-widest uppercase text-ivory/50 block mb-2">
                    MARQUE <span className="accent">ONE</span> MOTORSPORTS CLUB
                  </span>
                  <h3 className="font-serif text-[2.4rem] font-light text-ivory leading-none">
                    Request Membership
                  </h3>
                  <p className="text-[0.65rem] tracking-widest uppercase text-ivory/50 mt-2">
                    Private Motorsport Sanctuary · Bengaluru
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Full Name (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase text-ivory/60">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
                    />
                  </div>

                  {/* Phone / WhatsApp (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase text-ivory/60">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 90000 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
                    />
                  </div>

                  {/* Email Address (Required) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase text-ivory/60">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
                    />
                  </div>

                  {/* Primary Performance Vehicle (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase text-ivory/60">
                      Primary Performance Vehicle (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Make, Model & Year"
                      value={formData.vehicle}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                      className="bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
                    />
                  </div>

                  {/* Invitation Code / Referral (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] tracking-widest uppercase text-ivory/60">
                      Invitation Code / Referral (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Member referral code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
                    />
                  </div>

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
              <div className="my-auto flex flex-col items-start gap-4">
                <span className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
                  RECEIVED
                </span>
                <h3 className="font-serif text-[2.4rem] font-light text-ivory leading-none">
                  Invitation Requested
                </h3>
                <p className="text-[0.7rem] tracking-widest uppercase text-ivory/60 leading-relaxed">
                  The Marque <span className="accent">One</span> team will review your application and reach out privately.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 text-[0.8rem] tracking-widest uppercase text-ivory hover:opacity-70 transition-opacity cursor-pointer"
                >
                  Close →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
