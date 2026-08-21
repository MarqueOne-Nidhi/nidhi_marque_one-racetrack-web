import React from 'react';
import { motion } from 'framer-motion';

/**
 * `as="a"` renders the same button as a link. Elsewhere on the site a
 * LiquidButton that navigates is wrapped in a <Link>, which puts a <button>
 * inside an <a>: browsers cope, but it is invalid, and for an outbound link
 * it also costs the things an anchor gives for free, middle-click and open
 * in new tab among them. Pass href with it.
 */
export default function LiquidButton({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  fillHeight = '3px',
  hoverScale = 1.03,
  tapScale = 0.97,
  onClick,
  as = 'button',
  ...props
}) {
  const Tag = as === 'a' ? motion.a : motion.button;
  // Size styles
  const sizeStyles = {
    default: 'px-6 py-2.5 text-[0.75rem]',
    sm: 'px-4 py-1.5 text-[0.68rem]',
    lg: 'px-8 py-3.5 text-[0.82rem]',
    icon: 'p-2.5',
  };

  // Variant styles
  const variantStyles = {
    default: 'border border-ivory/30 text-ivory bg-transparent hover:text-dark',
    secondary: 'border border-dark/40 text-dark bg-transparent hover:text-ivory',
    destructive: 'border border-red-500/50 text-red-400 bg-transparent hover:text-white',
    ghost: 'border-transparent text-ivory hover:text-dark',
  };

  // Liquid fill color according to variant
  const liquidBgColor = {
    default: '#F5F1E8', // warm ivory fill on dark bg
    secondary: '#090909', // deep dark fill on light bg
    destructive: '#ef4444',
    ghost: '#F5F1E8',
  };

  return (
    <Tag
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: tapScale }}
      variants={{ rest: { scale: 1 }, hover: { scale: hoverScale } }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-none font-sans tracking-widest uppercase font-normal transition-colors duration-300 group inline-flex items-center justify-center gap-2 cursor-pointer ${sizeStyles[size] || sizeStyles.default} ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {/* Animated Liquid Background Fill (inherits hover state from the button) */}
      <motion.span
        variants={{ rest: { height: fillHeight }, hover: { height: '100%' } }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: liquidBgColor[variant] || liquidBgColor.default }}
        className="absolute bottom-0 left-0 right-0 w-full z-0 pointer-events-none rounded-none"
      />

      {/* Button Content Layered Above Liquid Fill */}
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-300">
        {children}
      </span>
    </Tag>
  );
}
