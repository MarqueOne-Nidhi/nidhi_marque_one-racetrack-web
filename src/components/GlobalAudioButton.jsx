import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioWaveButton from './ui/AudioWaveButton';

/**
 * GlobalAudioButton
 * Plays Tranquility.mp3 soundtrack.
 *
 * Fixed in the bottom-right corner. It used to travel between two anchors,
 * top-right over the hero and bottom-centre once past it, which is why the
 * position was driven by x/y transforms against a measured viewport. A control
 * that stays put needs none of that: the corner is offsets on a fixed box, so
 * the resize listener, the hero observer and the travel easing all went with
 * it. Bottom-centre also sat in the path of anything anchored to the foot of
 * the page; the corner does not.
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


export default function GlobalAudioButton() {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const gainRef = useRef(null);
  const graphFailedRef = useRef(false);
  const pauseTimerRef = useRef(null);
  // What the *user* asked for, independent of whether we're currently ducked
  // for a hidden tab. Drives the button UI and the resume-on-return decision.
  const wantsAudioRef = useRef(false);

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

      {/* Offsets rather than a transform, so the corner holds on any viewport
          without measuring one. Bottom is a safe-area inset on phones with a
          home bar, which would otherwise sit on top of it. */}
      <div
        className="fixed right-[5vw] z-[60]"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <AudioWaveButton isPlaying={isAudioPlaying} onClick={toggleAudio} />
      </div>
    </>
  );
}
