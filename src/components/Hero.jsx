import React, { useState, useRef, useEffect } from 'react';
import BlurFadeText from './ui/BlurFadeText';
import ShinyText from './ui/ShinyText';
import LiquidButton from './ui/LiquidButton';
import { surfaceProps } from './ui/Section';
import { useContactModal } from './ContactModal';

export default function Hero({ onOpenModal }) {
  const openContact = useContactModal();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const canvasRef = useRef(null);

  // Fallback Canvas Particle Animation
  useEffect(() => {
    if (videoLoaded) return;
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

    let frame = 0;
    const render = () => {
      frame++;
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
  }, [videoLoaded]);

  return (
    <section
      id="hero"
      {...surfaceProps('dark')}
      className="relative w-full h-[100svh] min-h-[600px] flex items-end overflow-hidden"
    >
      {/* Background Video / Canvas */}
      <div className="absolute inset-0 z-0">
        <video
          src="/assets/videos/club_hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="w-full h-full object-cover"
        />
        {!videoLoaded && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/30 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full px-gutter pb-section-xs flex flex-col justify-end">
        <div className="mb-8">
          {/* One is set in the Estonia script face, .CLUB stays in the site
              serif — the same human/institution contrast the opening signature
              makes. Estonia's glyphs sit small on the em and carry no real
              tracking, so the span is sized up and de-tracked against the
              serif rather than inheriting the h1's metrics.

              The family is written as an arbitrary value rather than a themed
              `font-script` utility on purpose. A themed utility only exists if
              PostCSS has re-read tailwind.config.js, which it does once at
              server start — so adding the family to the theme silently did
              nothing on an already-running dev server while the arbitrary
              `text-[1.5em]` beside it applied, and the word fell back to the
              h1's serif. An arbitrary value comes from the content scan alone
              and cannot get out of step with the config. */}
          <h1 className="font-serif text-[clamp(4rem,10vw,10rem)] font-light leading-[0.92] tracking-tight hover-invert">
            <span className="accent font-[Estonia,cursive] text-[1.5em] tracking-normal pr-[0.06em]">One</span>.CLUB
          </h1>

          <p className="font-serif text-[clamp(1.4rem,3.5vw,3rem)] font-light text-ivory/90 mt-2">
            <BlurFadeText text="Drive. Belong. Stay." delay={0.2} as="span" />
          </p>

          {/* The homepage promises that no membership is required. Every CTA on
              this page used to open the membership modal, which answered the
              visitor's first question the opposite way. Both paths are stated
              here, in the same words the homepage uses. */}
          <p className="font-sans text-[0.85rem] font-light leading-[1.7] text-ivory/65 max-w-measure mt-6">
            Members hold standing access to the circuit, the garages and the rooms. Everyone else books a day. No membership is needed to drive here.
          </p>
        </div>

        <div className="flex justify-between items-end w-full gap-6">
          <div className="flex items-center gap-6 flex-wrap">
            <LiquidButton onClick={onOpenModal}>
              Request membership →
            </LiquidButton>

            <button
              type="button"
              onClick={() => openContact('Drive')}
              className="text-[0.72rem] tracking-widest uppercase text-ivory/60 hover:text-ivory transition-colors cursor-pointer"
            >
              Or book a day →
            </button>
          </div>

          <span className="hidden sm:block text-[0.68rem] tracking-widest uppercase text-ivory/50">
            BENGALURU · INDIA
          </span>
        </div>
      </div>
    </section>
  );
}
