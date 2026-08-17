import React, { useState } from 'react';
import { Section } from '../ui/Section';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import LiquidButton from '../ui/LiquidButton';
import { ENQUIRY } from '../../data/home';
import { submitToSheet } from '../../lib/submitToSheet';

export default function Enquiry({ initialType = 'Drive' }) {
  const [activeToggle, setActiveToggle] = useState(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);

    await submitToSheet({
      'Enquiry Type': activeToggle,
      'Full Name': formData.name,
      'Email Address': formData.email,
      'Phone/WhatsApp': formData.phone,
      'What you have in mind': formData.message,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <Section
      id="enquiry"
      surface="dark"
      measure="lg"
      className="pt-section pb-[6vh]"
    >
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[clamp(2.6rem,6vw,5rem)] font-light leading-[1] tracking-tight mb-3"
      >
        {ENQUIRY.heading}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-sans text-[clamp(0.9rem,1.3vw,1.05rem)] font-light text-ivory/60 mb-10"
      >
        {ENQUIRY.sub}
      </motion.p>

      {/* Toggles */}
      <div className="flex items-center gap-2 mb-10 border-b border-ivory/10 pb-4">
        {ENQUIRY.toggles.map((toggle) => (
          <button
            key={toggle}
            type="button"
            onClick={() => setActiveToggle(toggle)}
            className={`px-5 py-2 text-[0.75rem] tracking-widest uppercase font-sans cursor-pointer transition-all duration-300 border-none ${
              activeToggle === toggle
                ? 'bg-ivory text-dark font-medium'
                : 'bg-transparent text-ivory/50 hover:text-ivory'
            }`}
          >
            {toggle}
          </button>
        ))}
      </div>

      {/* Form or Submitted State */}
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
                Name
              </label>
              <input
                type="text"
                required
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-transparent border-b border-ivory/20 py-2 text-[#F5F1E8] text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-transparent border-b border-ivory/20 py-2 text-[#F5F1E8] text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
              Phone
            </label>
            <input
              type="tel"
              required
              placeholder="+91 90000 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-transparent border-b border-ivory/20 py-2 text-[#F5F1E8] text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
              What you have in mind
            </label>
            <textarea
              rows={3}
              placeholder="Tell us dates, vehicles, or ideas..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-transparent border-b border-ivory/20 py-2 text-[#F5F1E8] text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20 resize-none"
            />
          </div>

          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <LiquidButton
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Enquiry →'
              )}
            </LiquidButton>

            <a
              href={`mailto:${ENQUIRY.email}`}
              className="text-[0.8rem] tracking-widest uppercase text-ivory/40 hover:text-brand-tint transition-colors"
            >
              {ENQUIRY.email}
            </a>
          </div>
        </form>
      ) : (
        <div className="py-12 flex flex-col items-start gap-4">
          <span className="text-[0.65rem] tracking-widest uppercase text-ivory/50">
            RECEIVED
          </span>
          <h3 className="font-serif text-[2.4rem] font-light text-ivory leading-none">
            Enquiry Received
          </h3>
          <p className="text-[0.8rem] tracking-widest uppercase text-ivory/60 leading-relaxed max-w-measure-sm">
            Thank you. The Marque <span className="accent">One</span> team will review your enquiry and reach out shortly.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ name: '', email: '', phone: '', message: '' });
            }}
            className="mt-4 text-[0.75rem] tracking-widest uppercase text-ivory hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
          >
            Send another message →
          </button>
        </div>
      )}
    </Section>
  );
}
