import React, { useEffect, useRef, useMemo } from 'react';

export default function FlickeringGrid({
  className = '',
  squareSize = 4,
  gridGap = 6,
  color = '#6B7280',
  maxOpacity = 0.5,
  flickerChance = 0.1,
  width,
  height,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const hexToRgb = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return { r, g, b };
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setSize = () => {
      const w = width || canvas.parentElement?.clientWidth || 800;
      const h = height || canvas.parentElement?.clientHeight || 400;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      return { w, h };
    };

    let { w, h } = setSize();

    // Generate grid squares
    const cols = Math.ceil(w / (squareSize + gridGap));
    const rows = Math.ceil(h / (squareSize + gridGap));
    const total = cols * rows;

    // Each square has a current opacity
    const opacities = new Float32Array(total).map(() => Math.random() * maxOpacity);

    const { r, g, b } = hexToRgb;

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < total; i++) {
        // Randomly flicker
        if (Math.random() < flickerChance) {
          opacities[i] = Math.random() * maxOpacity;
        }

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (squareSize + gridGap);
        const y = row * (squareSize + gridGap);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacities[i]})`;
        ctx.fillRect(x, y, squareSize, squareSize);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      cancelAnimationFrame(animationRef.current);
      ({ w, h } = setSize());
      animationRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [squareSize, gridGap, maxOpacity, flickerChance, hexToRgb, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
    />
  );
}
