import React from 'react';

/**
 * The row of strokes beside a CardCylinder: one per card, upright, on a
 * common baseline, the current one taller and in the brand red.
 *
 * Each is a real button, so every card is reachable without a pointer, and
 * the hit area is padded well past the hairline it draws. That matters more
 * than it looks: the mark itself is one pixel wide.
 */
export default function CylinderMarkers({ cards, active, onSelect, className = '' }) {
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      {cards.map((card, i) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Show ${card.title}`}
          aria-current={i === active ? 'true' : undefined}
          className="group flex items-end h-10 px-2 py-1 bg-transparent border-none cursor-pointer"
        >
          <span
            className={`block w-px transition-all duration-500 ${
              i === active
                ? 'h-8 bg-brand'
                : 'h-4 bg-ivory/25 group-hover:h-6 group-hover:bg-ivory/60'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
