import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import LiquidButton from './ui/LiquidButton';
import { ENQUIRY } from '../data/home';
import { submitToSheet } from '../lib/submitToSheet';

/**
 * The enquiry form itself, with no ground and no heading of its own.
 *
 * It is rendered in two places that agree on the fields but not on the frame:
 * the Enquiry section on the Business page, and the contact popover. Both used
 * to mean maintaining the same five inputs and the same submit twice, which is
 * how two copies of a form drift apart. The frame stays with the caller; only
 * what is inside it lives here.
 *
 * `compact` is for the popover. The breakpoint prefixes below are viewport
 * queries, not container queries, so on a desktop the side-by-side name/email
 * row would happily split itself across a 520px drawer. Compact keeps every
 * field on its own line regardless of how wide the window is.
 */
export default function EnquiryForm({
  initialType = 'Drive',
  compact = false,
  // Which call to action opened this, recorded against the submission as
  // `Opened Via`. The form has no way to work this out for itself, so it is
  // passed down from the button that was pressed.
  source = '',
  // Which LiquidButton variant the submit takes. The rest of the form reads
  // the ground from CSS variables, but that component predates them.
  tone = 'dark',
}) {
  const [activeToggle, setActiveToggle] = useState(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
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
    setError('');

    // Keys are the sheet's column headings. They have to match the Enquiry
    // list in docs/apps-script/Code.gs exactly, or the value lands nowhere.
    const result = await submitToSheet('enquiry', {
      'Enquiry Type': activeToggle,
      'Full Name': formData.name,
      'Email Address': formData.email,
      'Phone/WhatsApp': formData.phone,
      'What you have in mind': formData.message,
      'Opened Via': source,
    });

    setIsSubmitting(false);

    if (result.ok) {
      setIsSubmitted(true);
    } else {
      // Kept on the form with their answers intact: a failure that clears the
      // fields costs the visitor the whole enquiry a second time.
      setError(`${result.error} Please try again, or email ${ENQUIRY.email}.`);
    }
  };

  // See .paper-field in index.css: everything colour-bearing comes from the
  // surface variables, so this form prints correctly on any stock.
  const field = 'paper-field py-2 text-[0.95rem]';
  const label = 'text-[0.65rem] tracking-widest uppercase ink-faint';

  if (isSubmitted) {
    return (
      <div className={`flex flex-col items-start gap-4 ${compact ? '' : 'py-12'}`}>
        <span className={label}>RECEIVED</span>
        <h3 className="font-serif text-[2.4rem] font-light leading-none">
          Enquiry Received
        </h3>
        <p className="text-[0.8rem] tracking-widest uppercase ink-muted leading-relaxed max-w-measure-sm">
          Thank you. The Marque.<span style={{ color: '#cc0000' }}>One</span> team will review your
          enquiry and reach out shortly.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', phone: '', message: '' });
          }}
          className="mt-4 text-[0.75rem] tracking-widest uppercase hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
        >
          Send another message →
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Toggles */}
      <div className="flex items-center gap-2 mb-10 border-b rule pb-4">
        {ENQUIRY.toggles.map((toggle) => (
          <button
            key={toggle}
            type="button"
            onClick={() => setActiveToggle(toggle)}
            className={`px-5 py-2 text-[0.75rem] tracking-widest uppercase font-sans cursor-pointer transition-all duration-300 border-none ${
              activeToggle === toggle
                ? 'bg-[var(--ink)] text-[var(--surface)] font-medium'
                : 'bg-transparent ink-faint hover:opacity-100'
            }`}
          >
            {toggle}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={compact ? 'flex flex-col gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Name</label>
            <input
              type="text"
              required
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={field}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Email</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Phone</label>
          <input
            type="tel"
            required
            placeholder="+91 90000 00000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>What you have in mind</label>
          <textarea
            rows={3}
            placeholder="Tell us dates, vehicles, or ideas..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className={`${field} resize-none`}
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

        <div
          className={`mt-4 flex gap-6 ${
            compact
              ? 'flex-col items-start'
              : 'flex-col md:flex-row items-start md:items-center justify-between'
          }`}
        >
          <LiquidButton
            type="submit"
            variant={tone === 'light' ? 'secondary' : 'default'}
            size="lg"
            disabled={isSubmitting}
            className={compact ? 'w-full rounded-none' : 'min-w-[180px]'}
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
            className="text-[0.8rem] tracking-widest uppercase ink-faint hover:text-[var(--accent)] transition-colors"
          >
            {ENQUIRY.email}
          </a>
        </div>
      </form>
    </>
  );
}
