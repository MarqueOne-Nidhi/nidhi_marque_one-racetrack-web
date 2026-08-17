import React from 'react';

export default function ShinyText({ text, className = '' }) {
  return (
    <span
      className={`relative inline-block bg-gradient-to-r from-ivory via-white to-ivory/70 bg-clip-text text-transparent ${className}`}
    >
      {text}
    </span>
  );
}
