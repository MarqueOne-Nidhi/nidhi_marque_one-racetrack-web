import React from 'react';

/**
 * ImageSlot — renders the image if it exists, or an in-theme
 * labelled placeholder frame if not.
 * No broken-image icons, no layout shift on arrival.
 *
 * `caption` renders a figcaption under the frame. Twice as many people read a
 * caption as read body copy, so a caption is written as a miniature ad — a
 * fact the surrounding copy does not already state — rather than a restatement
 * of the alt text. Images that already sit directly above a heading and a
 * paragraph (the card grids) are left uncaptioned: there, the card copy is the
 * caption, and a second one would only add noise.
 */
/**
 * The placeholder and caption take their colours from the surface the slot is
 * sitting on, so the same slot is correct on any of the four grounds. The old
 * `dark` prop is gone — nothing had to be told which section it was in.
 */
export default function ImageSlot({
  src,
  alt = '',
  aspect = '16/9',
  className = '',
  placeholderLabel,
  caption,
}) {
  // The caption sits outside the aspect-ratio frame so that hover transforms
  // and `overflow-hidden` wrappers applied via className act on the image only.
  const withCaption = (frame) => {
    if (!caption) return frame;
    return (
      <figure className="w-full m-0">
        {frame}
        <figcaption className="mt-3 font-sans text-[0.72rem] font-light leading-[1.6] tracking-wide max-w-measure ink-faint">
          {caption}
        </figcaption>
      </figure>
    );
  };

  if (src) {
    return withCaption(
      <div className={`overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return withCaption(
    <div
      className={`surface-raised border rule flex items-center justify-center ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="flex flex-col items-center gap-2 ink-faint">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <span className="text-[0.6rem] tracking-widest uppercase">
          {placeholderLabel || alt || 'Image pending'}
        </span>
      </div>
    </div>
  );
}
