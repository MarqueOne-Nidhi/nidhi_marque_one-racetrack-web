import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import BlurFadeText from '../ui/BlurFadeText';
import LiquidButton from '../ui/LiquidButton';
import { surfaceProps } from '../ui/Section';
import { HERO } from '../../data/home';
import { useContactModal } from '../ContactModal';

const HERO_VIDEOS = [
  { src: '/assets/videos/home_lambo.mp4', label: 'Circuit Drive' },
  { src: '/assets/videos/home_social_events.mp4', label: 'Social & Racing' },
];

export default function HomeHero() {
  const openContact = useContactModal();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState({});
  const [durations, setDurations] = useState({});
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  const nextVideo = useCallback(() => {
    setActiveVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
  }, []);

  // Dynamically set timer based on the actual video duration (max 5s, or exact duration if < 5s)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const videoDuration = durations[activeVideoIndex];
    // If video is shorter than 5s (e.g. 4s), use its exact duration; otherwise max out at 5s
    const targetDurationSec = videoDuration ? Math.min(videoDuration, 5) : 5;

    timerRef.current = setTimeout(() => {
      nextVideo();
    }, targetDurationSec * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeVideoIndex, durations, nextVideo]);

  const isAnyVideoLoaded = Object.values(loadedVideos).some(Boolean);

  // Fallback canvas particle animation (until video loads)
  useEffect(() => {
    if (isAnyVideoLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;

    const resize = () => {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const hy = height * 0.55;
      const sky = ctx.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, '#050505');
      sky.addColorStop(1, '#251613');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, hy);

      const ground = ctx.createLinearGradient(0, hy, 0, height);
      ground.addColorStop(0, '#100e0d');
      ground.addColorStop(1, '#050505');
      ctx.fillStyle = ground;
      ctx.fillRect(0, hy, width, height - hy);

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 241, 232, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnyVideoLoaded]);

  const handleMetadataLoaded = (index, duration) => {
    setLoadedVideos((prev) => ({ ...prev, [index]: true }));
    if (duration && !isNaN(duration)) {
      setDurations((prev) => ({ ...prev, [index]: duration }));
    }
  };

  const activeDurationSec = durations[activeVideoIndex]
    ? Math.min(durations[activeVideoIndex], 5)
    : 5;

  return (
    <section
      id="home-hero"
      {...surfaceProps('dark')}
      className="relative w-full h-[100svh] min-h-[600px] flex items-end overflow-hidden"
    >
      {/* Background Video Slideshow with Dynamic Duration & Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {HERO_VIDEOS.map((video, idx) => {
          const isActive = idx === activeVideoIndex;
          return (
            <video
              key={video.src}
              src={video.src}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => handleMetadataLoaded(idx, e.target.duration)}
              onEnded={isActive ? nextVideo : undefined}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 2 : 1,
              }}
            />
          );
        })}

        {!isAnyVideoLoaded && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
        )}

        {/* Gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 w-full px-gutter pb-section-xs flex flex-col justify-end">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="max-w-measure-xl">
            <h1 className="font-serif text-[clamp(2.6rem,6.5vw,6.5rem)] font-light leading-[0.95] tracking-tight text-ivory">
              <BlurFadeText text={HERO.headline} as="span" />
            </h1>

            <p className="font-sans text-[clamp(0.85rem,1.4vw,1.1rem)] font-light text-ivory/70 mt-5 max-w-measure leading-relaxed">
              {HERO.sub}
            </p>

            <div className="flex flex-wrap gap-4 items-center mt-8">
              <LiquidButton onClick={() => openContact('Drive')}>{HERO.cta1}</LiquidButton>
              <LiquidButton variant="ghost" onClick={() => openContact('Business')}>
                {HERO.cta2}
              </LiquidButton>
            </div>
          </div>

          {/* Video Indicator Progress Bars (Dynamic duration indicator) */}
          <div className="flex flex-col items-start md:items-end gap-2 z-20">
            <span className="text-[0.6rem] tracking-widest uppercase text-ivory/40">
              FEATURED REELS
            </span>
            <div className="flex items-center gap-2">
              {HERO_VIDEOS.map((video, idx) => {
                const isActive = idx === activeVideoIndex;
                return (
                  <button
                    key={video.src}
                    onClick={() => setActiveVideoIndex(idx)}
                    className="group relative cursor-pointer border-none bg-transparent p-1 focus:outline-none"
                    aria-label={`Switch to video: ${video.label}`}
                  >
                    <div
                      className={`h-1 transition-all duration-500 rounded-full overflow-hidden ${
                        isActive ? 'w-12 bg-ivory' : 'w-6 bg-ivory/30 group-hover:bg-ivory/60'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          key={activeVideoIndex}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: activeDurationSec, ease: 'linear' }}
                          className="h-full bg-brand"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <span className="text-[0.65rem] font-mono tracking-wider text-ivory/60 transition-all duration-300">
              0{activeVideoIndex + 1} / 0{HERO_VIDEOS.length} · {HERO_VIDEOS[activeVideoIndex].label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
