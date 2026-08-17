import React, { useEffect, useRef } from 'react';

/**
 * AudioWaveButton
 * - Idle: circle with a static horizontal line inside
 * - Playing: circle with a continuously travelling sine wave (canvas rAF)
 */
export default function AudioWaveButton({ isPlaying, onClick }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const SIZE = 40; // logical px — matches w-10 h-10
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(DPR, DPR);

    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const drawIdle = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      // horizontal line
      ctx.beginPath();
      ctx.moveTo(10, cy);
      ctx.lineTo(SIZE - 10, cy);
      ctx.strokeStyle = 'rgba(245,241,232,0.55)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawWave = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const amplitude = 5.5;
      const frequency = (2 * Math.PI) / 20; // one full cycle over 20px
      const xStart = 9;
      const xEnd = SIZE - 9;

      ctx.beginPath();
      for (let x = xStart; x <= xEnd; x += 0.5) {
        const y = cy + amplitude * Math.sin(frequency * (x - xStart) + phaseRef.current);
        if (x === xStart) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245,241,232,0.90)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // advance phase → wave travels left-to-right
      phaseRef.current -= 0.12;
      rafRef.current = requestAnimationFrame(drawWave);
    };

    cancelAnimationFrame(rafRef.current);

    if (isPlaying) {
      drawWave();
    } else {
      drawIdle();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return (
    <button
      onClick={onClick}
      aria-label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
      style={{ background: 'rgba(9,9,9,0.35)', backdropFilter: 'blur(10px)' }}
      className="relative w-10 h-10 flex items-center justify-center rounded-full border border-ivory/30 hover:border-ivory/60 transition-all duration-300 p-0 cursor-pointer overflow-hidden shadow-lg"
    >
      <canvas ref={canvasRef} className="block" />
    </button>
  );
}
