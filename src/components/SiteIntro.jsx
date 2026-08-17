import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Marque.One — Cinematic Brand Intro with Dust-Led Website Reveal
 *
 * Master Timeline:
 *   0.00s       ── Pure black screen (100% opaque layer, website fully concealed)
 *   0.05s–0.60s ── Red geometric mark constructs (twin ribbon paths draw)
 *   0.60s–0.85s ── Symbol completes & locks in solid crimson with physical micro-settle
 *   0.75s–1.15s ── MARQUE.ONE wordmark unmasks from baseline
 *   1.15s–1.50s ── Full brand presence & The "Breath" (stillness hold over 100% black)
 *   1.50s–1.85s ── Dust disintegration: particles break away left-to-right over black
 *   1.85s–2.25s ── Dust-led reveal: black curtain sweeps left-to-right behind the moving dust
 *   2.25s–2.35s ── Final trailing dust particles dissipate over the revealed website
 *   2.35s+      ── Intro complete, unmounted cleanly with zero flash
 */

export default function SiteIntro({ onComplete }) {
  const [phase, setPhase] = useState('initial'); // 'initial' | 'drawing' | 'locked' | 'wordmark' | 'hold' | 'disintegrating' | 'done'
  const [shouldPlay, setShouldPlay] = useState(true);

  const containerRef = useRef(null);
  const curtainRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const forceReplay = searchParams.get('replay') === '1' || searchParams.get('intro') === '1';
    const seen = sessionStorage.getItem('marqueIntroSeen');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setShouldPlay(true);
      const timer = setTimeout(() => {
        sessionStorage.setItem('marqueIntroSeen', 'true');
        setPhase('done');
        onComplete?.();
      }, 400);
      return () => clearTimeout(timer);
    }

    if (seen && !forceReplay) {
      setShouldPlay(false);
      onComplete?.();
      return;
    }

    // Lock page scrolling while intro plays
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Master Timeline Choreography
    const t1 = setTimeout(() => setPhase('drawing'), 50);
    const t2 = setTimeout(() => setPhase('locked'), 600);
    const t3 = setTimeout(() => setPhase('wordmark'), 780);
    const t4 = setTimeout(() => setPhase('hold'), 1150);
    const t5 = setTimeout(() => {
      setPhase('disintegrating');
      startDisintegration();
    }, 1500); // 1.50s: The Breath ends -> disintegration wave begins

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete]);

  // Master Disintegration & Dust-Led Curtain Reveal
  const startDisintegration = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const curtain = curtainRef.current;
    if (!canvas || !container || !curtain) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Create an offscreen canvas to sample the exact rendered logo and typography
    const targetRect = container.getBoundingClientRect();
    const offscreen = document.createElement('canvas');
    offscreen.width = rect.width;
    offscreen.height = rect.height;
    const offCtx = offscreen.getContext('2d');

    // Render exact logo geometry onto offscreen canvas
    const symbolWidth = Math.min(targetRect.width * 0.4, 130);
    const symbolHeight = symbolWidth;
    const symbolX = targetRect.left + (targetRect.width - symbolWidth) / 2;
    const symbolY = targetRect.top;

    // Draw symbol paths
    offCtx.save();
    offCtx.translate(symbolX, symbolY);
    const scale = symbolWidth / 406;
    offCtx.scale(scale, scale);
    offCtx.fillStyle = '#cc0000';

    const pLeft = new Path2D(
      'M 0 259 L 143 0 L 203 101 L 286 259 L 203 404 L 203 334 L 248 259 L 203 177 L 143 75 L 49.5 259 Z'
    );
    const pRight = new Path2D(
      'M 406 259 L 263 0 L 203 101 L 120 259 L 203 404 L 203 334 L 158 259 L 203 177 L 263 75 L 356.5 259 Z'
    );
    offCtx.fill(pLeft);
    offCtx.fill(pRight);
    offCtx.restore();

    // Draw MARQUE.ONE wordmark
    offCtx.save();
    const wordmarkY = symbolY + symbolHeight + 42;
    const fontSize = Math.max(34, Math.min(rect.width * 0.052, 54));
    offCtx.font = `700 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
    offCtx.textBaseline = 'middle';

    const textMarque = 'MARQUE';
    const textDotOne = '.ONE';
    const widthMarque = offCtx.measureText(textMarque).width;
    const widthDotOne = offCtx.measureText(textDotOne).width;
    const totalTextWidth = widthMarque + widthDotOne;
    const textStartX = targetRect.left + (targetRect.width - totalTextWidth) / 2;

    offCtx.fillStyle = '#F5F1E8';
    offCtx.fillText(textMarque, textStartX, wordmarkY);
    offCtx.fillStyle = '#FF4D4D';
    offCtx.fillText(textDotOne, textStartX + widthMarque + 1, wordmarkY);

    // Draw descriptor
    const descY = wordmarkY + fontSize * 0.55 + 8;
    const descSize = Math.max(9, Math.min(rect.width * 0.012, 12));
    offCtx.font = `600 ${descSize}px Inter, sans-serif`;
    offCtx.fillStyle = 'rgba(245, 241, 232, 0.65)';
    const descText = 'MOTORSPORT ESTATE';
    const descWidth = offCtx.measureText(descText).width;
    offCtx.fillText(descText, targetRect.left + (targetRect.width - descWidth) / 2, descY);
    offCtx.restore();

    // Sample pixels to generate particles
    const imgData = offCtx.getImageData(0, 0, rect.width, rect.height);
    const data = imgData.data;
    const particles = [];
    const isMobile = rect.width < 768;
    const step = isMobile ? 4 : 3;

    let minX = rect.width,
      maxX = 0;

    for (let y = Math.floor(symbolY) - 5; y < Math.floor(descY) + 20; y += step) {
      for (let x = Math.floor(targetRect.left) - 10; x < Math.floor(targetRect.right) + 10; x += step) {
        const idx = (y * rect.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const rand = Math.random();
          let size = 1.1 + Math.random() * 0.6;
          if (rand > 0.85) size = 1.9 + Math.random() * 0.7;
          if (rand > 0.97) size = 2.7 + Math.random() * 0.9;

          particles.push({
            originX: x,
            originY: y,
            x: x,
            y: y,
            color: `rgba(${r}, ${g}, ${b}, ${alpha / 255})`,
            size,
            baseVx: 4.2 + Math.random() * 4.6, // Strong horizontal wind velocity
            vx: 0,
            vy: (Math.random() - 0.48) * 1.4,
            turbulence: Math.random() * Math.PI * 2,
            turbSpeed: 0.05 + Math.random() * 0.05,
            active: false,
            alpha: 1,
            decay: 0.015 + Math.random() * 0.012, // Long travel flight (~500–650ms)
          });
        }
      }
    }

    const logoWidth = Math.max(maxX - minX, 1);
    const startTime = performance.now();

    // Key timeline durations (in ms from t=1500ms):
    // 0ms – 320ms: Logo disintegrates into dust from left to right (over 100% black)
    // 350ms – 750ms: Dust travels rightward; black curtain peels away left-to-right behind it
    // 750ms – 850ms: Trailing dust finishes dissipating over the fully revealed website
    // 850ms: Complete and clean unmount
    const logoDisintegrateDuration = 320;
    const curtainRevealDelay = 350; // Website reveal starts ONLY after dust has established travel momentum
    const curtainRevealDuration = 400; // Curtain sweeps away left-to-right behind the dust front
    const totalDuration = 860;

    const animate = (now) => {
      const elapsed = now - startTime;

      // 1. Logo Disintegration Wave (Left -> Right)
      const logoProgress = Math.min(elapsed / logoDisintegrateDuration, 1);
      if (container) {
        container.style.clipPath = `inset(0 0 0 ${logoProgress * 100}%)`;
      }

      // 2. Black Curtain Reveal Wave (Left -> Right following the dust front)
      if (curtain) {
        if (elapsed < curtainRevealDelay) {
          curtain.style.clipPath = 'inset(0 0 0 0%)'; // 100% black, website completely hidden
        } else {
          const revealElapsed = elapsed - curtainRevealDelay;
          const revealProgress = Math.min(revealElapsed / curtainRevealDuration, 1);
          // Eased left-to-right sweep
          const easedReveal = 1 - Math.pow(1 - revealProgress, 2.5);
          curtain.style.clipPath = `inset(0 0 0 ${easedReveal * 100}%)`;
        }
      }

      // 3. Render Particles on top Canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Activate particle as disintegration wave crosses its position
        const normalizedX = (p.originX - minX) / logoWidth;
        if (!p.active && logoProgress >= normalizedX) {
          p.active = true;
          p.vx = p.baseVx + (logoProgress - normalizedX) * 2.5;
        }

        if (p.active) {
          p.x += p.vx;
          p.vx += 0.14; // Gradual aerodynamic acceleration
          p.y += p.vy + Math.sin(p.turbulence) * 0.35;
          p.turbulence += p.turbSpeed;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            aliveCount++;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.rect(p.x, p.y, p.size, p.size);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;

      if (elapsed < totalDuration || aliveCount > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Complete transition only after all particles and reveal are 100% finished
        sessionStorage.setItem('marqueIntroSeen', 'true');
        document.body.style.overflow = '';
        setPhase('done');
        onComplete?.();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  if (!shouldPlay || phase === 'done') {
    return null;
  }

  // Exact vector closed paths for the two interlocking Marque One ribbons
  const leftRibbonPath =
    'M 0 259 L 143 0 L 203 101 L 286 259 L 203 404 L 203 334 L 248 259 L 203 177 L 143 75 L 49.5 259 Z';

  const rightRibbonPath =
    'M 406 259 L 263 0 L 203 101 L 120 259 L 203 404 L 203 334 L 158 259 L 203 177 L 263 75 L 356.5 259 Z';

  const isDrawing = phase === 'drawing';
  const isFilledOrLater = ['locked', 'wordmark', 'hold', 'disintegrating'].includes(phase);
  const isWordmarkOrLater = ['wordmark', 'hold', 'disintegrating'].includes(phase);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden">
      {/* 
        LAYER 1: Opaque Black Curtain (z-10)
        Covers 100% of viewport. During disintegration, clips left-to-right BEHIND the dust front
      */}
      <div
        ref={curtainRef}
        className="absolute inset-0 bg-[#050505] flex items-center justify-center pointer-events-none overflow-hidden z-10"
      >
        {/* Subtle architectural atmosphere */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#F5F1E8_1px,transparent_1px)] [background-size:28px_28px]" />

        {/* Precision drafting registration lines */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: isDrawing ? 0.14 : 0,
            scaleY: isDrawing ? 1 : 0.8,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#F5F1E8] to-transparent -translate-x-1/2 pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{
            opacity: isDrawing ? 0.14 : 0,
            scaleX: isDrawing ? 1 : 0.8,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#F5F1E8] to-transparent -translate-y-1/2 pointer-events-none"
        />

        {/* Central Brand Composition Container */}
        <div
          ref={containerRef}
          className="relative z-10 flex flex-col items-center justify-center px-4"
        >
          {/* 1. Geometric Red Symbol Container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-6 sm:mb-8">
            <svg
              viewBox="0 0 406 406"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Construction Outline Strokes (Drawn with pathLength) */}
              <motion.path
                d={leftRibbonPath}
                stroke="#D40000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="miter"
                strokeMiterlimit="10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: phase !== 'initial' ? 1 : 0,
                  opacity: phase === 'drawing' ? 0.95 : isFilledOrLater ? 0 : 0,
                }}
                transition={{
                  pathLength: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.2 },
                }}
              />
              <motion.path
                d={rightRibbonPath}
                stroke="#D40000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="miter"
                strokeMiterlimit="10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: phase !== 'initial' ? 1 : 0,
                  opacity: phase === 'drawing' ? 0.95 : isFilledOrLater ? 0 : 0,
                }}
                transition={{
                  pathLength: { duration: 0.55, delay: 0.04, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.2 },
                }}
              />

              {/* Solid Logo Ribbons (Resolves & Locks in with Stillness) */}
              <motion.g
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{
                  opacity: isFilledOrLater ? 1 : 0,
                  scale: isFilledOrLater ? 1 : 0.985,
                }}
                transition={{
                  opacity: { duration: 0.25, ease: 'easeOut' },
                  scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                }}
              >
                {/* Left Ribbon */}
                <path d={leftRibbonPath} fill="#cc0000" />
                {/* Right Ribbon */}
                <path d={rightRibbonPath} fill="#cc0000" />
              </motion.g>
            </svg>
          </div>

          {/* 2. MARQUE.ONE Wordmark Reveal */}
          <div className="overflow-hidden flex flex-col items-center justify-center">
            <div className="overflow-hidden flex items-baseline justify-center h-12 sm:h-14 md:h-16">
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{
                  y: isWordmarkOrLater ? '0%' : '100%',
                  opacity: isWordmarkOrLater ? 1 : 0,
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-baseline justify-center"
              >
                {/* MARQUE */}
                <motion.span
                  initial={{ letterSpacing: '0.22em', opacity: 0 }}
                  animate={{
                    letterSpacing: isWordmarkOrLater ? '0.14em' : '0.22em',
                    opacity: isWordmarkOrLater ? 0.95 : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-bold text-[#F5F1E8] leading-none uppercase"
                >
                  MARQUE
                </motion.span>

                {/* . (Dot) & ONE (Red brand accent) */}
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{
                    opacity: isWordmarkOrLater ? 1 : 0,
                    x: isWordmarkOrLater ? 0 : -4,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-bold text-[#FF4D4D] leading-none uppercase ml-[0.02em] tracking-[0.14em]"
                >
                  .ONE
                </motion.span>
              </motion.div>
            </div>

            {/* Subtle descriptor */}
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{
                opacity: isWordmarkOrLater ? 0.65 : 0,
                y: isWordmarkOrLater ? 0 : 4,
              }}
              transition={{
                duration: 0.4,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="block font-sans text-[0.65rem] sm:text-[0.75rem] md:text-[0.8rem] font-semibold tracking-[0.36em] uppercase text-[#F5F1E8] mt-3"
            >
              MOTORSPORT ESTATE
            </motion.span>
          </div>
        </div>
      </div>

      {/* 
        LAYER 2: Particle Canvas (z-20)
        Sits ABOVE the black curtain and website, so dust continues traveling over the emerging page
      */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-20"
      />
    </div>
  );
}
