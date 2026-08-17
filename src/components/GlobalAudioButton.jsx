import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AudioWaveButton from './ui/AudioWaveButton';

/**
 * GlobalAudioButton
 * Plays Tranquility.mp3 soundtrack.
 * - While #hero is visible → top-right corner (92px top, 5vw right)
 * - After scrolling past hero → bottom-center of viewport
 *
 * Volume is never switched — it is always ramped exponentially, so the track
 * eases in and eases out instead of snapping on/off:
 * - toggling the button fades over FADE_IN / FADE_OUT
 * - leaving the tab or the window fades down to silence and pauses
 * - coming back resumes and fades up again (only if the user left it playing)
 *
 * The ramp runs on a Web Audio GainNode rather than on requestAnimationFrame,
 * because browsers freeze rAF in hidden tabs — a frame-driven fade would stall
 * the moment you switch away and the track would never actually pause.
 */

const TARGET_VOLUME = 0.5;
const SILENCE = 0.0001; // exponential ramps can't reach a true zero
const FADE_IN = 1400; // ms — deliberately slower than the fade out
const FADE_OUT = 900; // ms
const FADE_AWAY = 600; // ms — tab/window blur, wants to feel prompt
const FADE_BACK = 1100; // ms — tab/window focus

// Button travel between its two anchors. Driven by x/y transforms rather than
// top/right/left, because Framer can't interpolate a number to `auto` — those
// edges snapped instead of easing, which is what made the move feel abrupt.
const BUTTON_SIZE = 40; // px — matches w-10 h-10 on AudioWaveButton
const HERO_TOP = 92; // px from top while the hero is on screen
const HERO_RIGHT_RATIO = 0.05; // 5vw from the right edge
const DOCKED_BOTTOM = 32; // px from the bottom once docked centre-screen
const TRAVEL_MS = 1.1; // seconds — decorative, so it can take its time
// ease-in-out: leaves gently and arrives gently, so it drifts rather than darts
const TRAVEL_EASE = [0.65, 0, 0.35, 1];

export default function GlobalAudioButton() {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const gainRef = useRef(null);
  const graphFailedRef = useRef(false);
  const pauseTimerRef = useRef(null);
  // What the *user* asked for, independent of whether we're currently ducked
  // for a hidden tab. Drives the button UI and the resume-on-return decision.
  const wantsAudioRef = useRef(false);

  // Anchor positions are in px, so they have to be recomputed on resize
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 0 : window.innerWidth,
    h: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Watch hero section visibility
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  /**
   * Build the audio graph lazily, on the first user gesture — an AudioContext
   * created before one is blocked as suspended. Returns null if Web Audio is
   * unavailable, in which case we fall back to plain element volume.
   */
  const ensureGraph = useCallback(() => {
    if (gainRef.current) return gainRef.current;
    if (graphFailedRef.current || !audioRef.current) return null;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      graphFailedRef.current = true;
      return null;
    }

    try {
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();
      gain.gain.value = SILENCE;
      source.connect(gain).connect(ctx.destination);
      // Level now lives on the gain node; keep the element wide open.
      audioRef.current.volume = 1;
      ctxRef.current = ctx;
      gainRef.current = gain;
      return gain;
    } catch (e) {
      console.warn('Web Audio unavailable, falling back to element volume:', e);
      graphFailedRef.current = true;
      return null;
    }
  }, []);

  /**
   * Ramp to `target` over `duration`. Exponential rather than linear because
   * loudness is perceived logarithmically — a linear ramp lurches at the quiet
   * end. Scheduled on the audio clock, so it keeps running in a hidden tab.
   */
  const ramp = useCallback(
    (target, duration) => {
      const gain = ensureGraph();
      const to = Math.max(target, SILENCE);

      if (!gain) {
        if (audioRef.current) audioRef.current.volume = to; // no-fade fallback
        return;
      }

      const ctx = ctxRef.current;
      const now = ctx.currentTime;
      const current = Math.max(gain.gain.value, SILENCE);
      // Cancel any ramp in flight and restart from wherever it got to, so an
      // interrupted fade continues smoothly instead of jumping.
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(current, now);
      gain.gain.exponentialRampToValueAtTime(to, now + duration / 1000);
    },
    [ensureGraph]
  );

  const cancelPendingPause = useCallback(() => {
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = null;
  }, []);

  const fadeIn = useCallback(
    async (duration) => {
      const audio = audioRef.current;
      if (!audio) return;
      cancelPendingPause(); // a fade-in overrides a scheduled pause

      const gain = ensureGraph();
      if (ctxRef.current?.state === 'suspended') {
        try {
          await ctxRef.current.resume();
        } catch (e) {
          console.warn('Could not resume audio context:', e);
        }
      }
      // Start from silence only when genuinely stopped, so an interrupted
      // fade-out picks up from its current level instead of dropping out.
      if (audio.paused) {
        if (gain) {
          const now = ctxRef.current.currentTime;
          gain.gain.cancelScheduledValues(now); // drop leftovers before pinning
          gain.gain.setValueAtTime(SILENCE, now);
        } else {
          audio.volume = SILENCE;
        }
      }

      try {
        await audio.play();
      } catch (e) {
        console.warn('Audio playback error:', e);
        return;
      }
      ramp(TARGET_VOLUME, duration);
    },
    [cancelPendingPause, ensureGraph, ramp]
  );

  const fadeOutAndPause = useCallback(
    (duration) => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      cancelPendingPause();
      ramp(SILENCE, duration);
      // Time-based, not frame-based: setTimeout still fires in a hidden tab
      // (throttled to ~1s at worst, which lands well after the ramp is silent).
      pauseTimerRef.current = setTimeout(() => {
        audio.pause();
        pauseTimerRef.current = null;
      }, duration + 60);
    },
    [cancelPendingPause, ramp]
  );

  const toggleAudio = () => {
    const next = !wantsAudioRef.current;
    wantsAudioRef.current = next;
    setIsAudioPlaying(next);
    if (next) fadeIn(FADE_IN);
    else fadeOutAndPause(FADE_OUT);
  };

  // Duck away when the tab is hidden or the window loses focus; ease back on return.
  useEffect(() => {
    const leave = () => {
      if (wantsAudioRef.current) fadeOutAndPause(FADE_AWAY);
    };
    const enter = () => {
      if (wantsAudioRef.current && !document.hidden) fadeIn(FADE_BACK);
    };
    const onVisibilityChange = () => (document.hidden ? leave() : enter());

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', leave);
    window.addEventListener('focus', enter);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', enter);
      window.removeEventListener('pagehide', leave);
    };
  }, [fadeIn, fadeOutAndPause]);

  // Tear down on unmount (leaving the Club route)
  useEffect(
    () => () => {
      clearTimeout(pauseTimerRef.current);
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  return (
    <>
      <audio
        ref={audioRef}
        src="/Tranquility.mp3"
        loop
        preload="auto"
        onEnded={() => {
          wantsAudioRef.current = false;
          setIsAudioPlaying(false);
        }}
      />

      <div className="fixed inset-0 z-[60] pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 pointer-events-auto"
          style={{ willChange: 'transform' }}
          initial={false}
          animate={
            heroVisible
              ? {
                  x: viewport.w * (1 - HERO_RIGHT_RATIO) - BUTTON_SIZE,
                  y: HERO_TOP,
                }
              : {
                  x: (viewport.w - BUTTON_SIZE) / 2,
                  y: viewport.h - DOCKED_BOTTOM - BUTTON_SIZE,
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: TRAVEL_MS, ease: TRAVEL_EASE }
          }
        >
          <AudioWaveButton isPlaying={isAudioPlaying} onClick={toggleAudio} />
        </motion.div>
      </div>
    </>
  );
}
