import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import BlurFadeText from './ui/BlurFadeText';
import { surfaceProps } from './ui/Section';

export default function TheExperience() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const maxScrollRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartTargetRef = useRef(0);

  const slides = [
    { title: 'DRIVE', img: '/assets/images/carousel_drive.png' },
    { title: 'PUSH', img: '/assets/images/carousel_push.png' },
    { title: 'BREATHE', img: '/assets/images/carousel_breathe.png' },
    { title: 'DINE', img: '/assets/images/carousel_dine.png' },
    { title: 'STAY', img: '/assets/images/carousel_stay.png' },
  ];

  const clamp = (v) => Math.max(-maxScrollRef.current, Math.min(0, v));

  // GPU-accelerated transform loop (no layout thrash from scrollLeft writes)
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const updateMaxScroll = () => {
      maxScrollRef.current = Math.max(0, track.scrollWidth - container.clientWidth);
      targetX.current = clamp(targetX.current);
    };
    updateMaxScroll();

    const resizeObserver = new ResizeObserver(updateMaxScroll);
    resizeObserver.observe(container);
    resizeObserver.observe(track);

    let running = true;
    let frameId;
    const loop = () => {
      if (!running) return;
      const diff = targetX.current - currentX.current;
      if (Math.abs(diff) > 0.05) {
        currentX.current += diff * 0.12;
        track.style.transform = `translate3d(${currentX.current}px, 0, 0)`;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  const handleWheel = useCallback((e) => {
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const next = clamp(targetX.current - delta * 1.1);
    if (next !== targetX.current) {
      e.preventDefault();
      targetX.current = next;
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartTargetRef.current = targetX.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    targetX.current = clamp(dragStartTargetRef.current + delta);
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    // Not built with <Section>: the track scrolls horizontally past the page
    // measure, so the inner container would clip it.
    <section
      id="experience"
      {...surfaceProps('dark')}
      className="w-full py-section overflow-hidden select-none"
    >
      <div className="px-gutter mb-12 flex justify-between items-end">
        <div>
          <span className="block text-[0.7rem] tracking-widest uppercase ink-faint mb-2">
            THE EXPERIENCE
          </span>
          <BlurFadeText
            text="Built around the drive."
            className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-tight hover-invert"
          />

          <p className="font-sans text-[0.9rem] font-light leading-[1.7] ink-muted max-w-measure mt-6">
            Arrive Friday, drive Saturday and Sunday, and sleep minutes from the car.
          </p>
        </div>

        <span className="hidden md:block text-[0.7rem] tracking-widest uppercase ink-faint">
          ← SCROLL TO EXPLORE →
        </span>
      </div>

      {/* Ultra-Smooth Horizontal Track — transform-driven, no native scroll fight */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className="w-full overflow-hidden py-4 cursor-grab active:cursor-grabbing"
      >
        <div
          ref={trackRef}
          className="flex gap-[2.4vw] px-gutter w-max will-change-transform"
        >
          {slides.map((slide) => (
            <motion.div
              key={slide.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative flex-none w-[clamp(320px,46vw,680px)] aspect-[16/10] rounded-sm overflow-hidden group"
            >
              <img
                src={slide.img}
                alt={slide.title}
                draggable={false}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8 z-10 pointer-events-none">
                <span className="font-serif text-[clamp(2rem,4.5vw,4rem)] font-light text-ivory drop-shadow-lg tracking-tight">
                  {slide.title}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-gutter md:hidden text-right mt-6">
        <span className="text-[0.7rem] tracking-widest uppercase ink-faint">
          ← SWIPE TO EXPLORE →
        </span>
      </div>
    </section>
  );
}
