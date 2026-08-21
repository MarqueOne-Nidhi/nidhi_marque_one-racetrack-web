import React, { useEffect, useRef } from 'react';

/**
 * The circuit, drawn as a line, with a red marker lapping it and dragging a
 * glowing beam behind.
 *
 * THE ONE IDEA THAT MAKES IT WORK
 * The trail is NOT built from the marker's recent positions. A position
 * history lags, and lag on a closed circuit means the beam cuts the corners
 * and leaves the tarmac on every hairpin. Instead the dot AND every point of
 * the trail come from a single number — `head`, a distance in path-length
 * units. The dot sits at `head`; the trail is sampled at head, head−1step,
 * head−2step … back along the path itself. Every sample is therefore exactly
 * on the racing line, and the tail is anchored to its own head by
 * construction rather than by two timers agreeing.
 *
 * Tuning lives in `src/index.css`: `--lap-trail` (beam length as a share of a
 * lap) and `--lap-trail-steps` (beam smoothness) are read from `.lap-marker`
 * at mount; LAP_DUR below sets the lap time.
 *
 * The element IDs are static because SVG `filter:` and `stroke:` references
 * are document-global and the CSS has to name them. Only one of these renders
 * at a time — one circuit, one route.
 */

const TRACE_ID = 'm1-circuit-trace';
const GLOW_ID = 'm1-lap-glow';
const FADE_ID = 'm1-lap-fade';

const LAP_DUR = 16000; // one lap, in ms. Lower = faster.
const LUT_STEPS = 1800; // resolution of the path lookup table

// Closed path of the circuit. Swap this `d` for any closed path and everything
// else adapts — every length here is measured, never hardcoded.
const CIRCUIT_D =
  'M340.8 297.7C332.5 304.6 325.4 310.6 317.1 317.5C308.8 324.4 299.6 331.9 290.9 339.1C282.1 346.3 272.9 353.7 264.6 360.6C256.3 367.5 249.2 373.5 240.9 380.4C232.6 387.4 223.4 394.8 214.9 402.3C206.4 409.7 198.5 417.6 190.1 425.1C181.7 432.6 172.7 440.3 164.5 447.3C156.3 454.3 149.2 460.3 141.0 467.3C132.7 474.2 123.5 481.7 114.8 489.0C106.1 496.2 97.1 503.8 88.9 510.9C80.8 518.0 72.9 524.2 66.1 531.6C59.2 539.0 48.2 548.1 47.9 555.2C47.5 562.2 57.1 567.4 64.1 573.9C71.0 580.3 83.3 586.1 89.8 593.9C96.3 601.8 99.8 610.9 103.0 621.0C106.3 631.0 107.2 643.1 109.6 654.1C111.9 665.0 113.3 677.6 117.2 686.7C121.1 695.7 126.7 704.3 132.7 708.3C138.7 712.2 145.6 711.1 153.4 710.1C161.1 709.2 170.4 701.8 178.9 702.3C187.5 702.9 196.2 707.9 204.6 713.6C213.0 719.3 221.1 728.8 229.3 736.5C237.5 744.3 245.5 752.2 253.7 760.0C261.9 767.8 270.6 775.8 278.4 783.3C286.2 790.8 293.2 797.0 300.6 804.9C307.9 812.7 316.3 821.3 322.5 830.5C328.8 839.8 333.6 850.1 338.1 860.4C342.6 870.6 346.0 882.1 349.6 892.2C353.2 902.4 356.1 911.2 359.7 921.4C363.3 931.6 367.4 942.7 371.3 953.4C375.1 964.0 378.1 975.8 383.1 985.0C388.0 994.2 392.8 1002.9 400.7 1008.6C408.7 1014.4 420.7 1019.2 430.9 1019.7C441.2 1020.2 453.2 1016.9 462.2 1011.6C471.2 1006.4 479.4 996.7 484.9 988.1C490.4 979.4 493.6 970.0 495.3 959.7C497.0 949.4 496.9 937.3 495.1 926.5C493.3 915.6 488.8 904.4 484.5 894.7C480.1 884.9 474.5 877.3 468.9 868.1C463.3 858.9 456.9 848.9 450.9 839.3C444.9 829.6 437.8 819.9 433.0 810.4C428.2 801.0 423.2 792.5 422.0 782.4C420.8 772.4 422.0 760.0 426.0 750.3C430.0 740.6 438.0 731.5 446.1 724.2C454.2 716.9 464.9 710.7 474.5 706.5C484.2 702.2 493.5 700.3 504.0 698.8C514.5 697.2 526.5 697.6 537.8 697.3C549.1 697.0 560.8 698.3 571.6 696.9C582.4 695.5 595.0 694.2 602.6 689.0C610.2 683.8 616.2 674.4 617.0 665.7C617.8 657.0 613.5 645.0 607.4 636.9C601.4 628.9 589.6 623.1 580.5 617.6C571.5 612.1 563.0 607.5 553.1 603.8C543.1 600.0 531.7 596.4 520.7 595.3C509.7 594.1 498.3 595.3 487.2 596.8C476.1 598.3 464.6 601.8 454.1 604.3C443.7 606.9 434.7 609.6 424.3 612.2C413.9 614.8 402.4 617.2 391.6 620.0C380.8 622.9 370.0 626.6 359.7 629.4C349.4 632.1 340.3 634.3 329.8 636.5C319.2 638.7 307.6 641.0 296.4 642.7C285.2 644.5 274.0 645.9 262.7 647.1C251.5 648.3 239.7 649.9 229.1 650.2C218.4 650.5 207.9 652.2 198.9 649.0C189.9 645.8 181.1 639.1 175.1 630.9C169.1 622.8 165.0 609.8 162.9 599.9C160.8 590.0 159.7 581.0 162.4 571.4C165.1 561.9 172.5 551.7 179.1 542.8C185.6 533.9 193.4 525.6 201.8 518.2C210.1 510.8 220.5 504.8 229.2 498.4C237.9 492.0 245.4 486.6 254.0 480.0C262.5 473.4 271.8 466.1 280.4 458.7C288.9 451.3 297.6 443.2 305.3 435.6C312.9 428.0 319.2 421.2 326.3 413.0C333.4 404.9 340.8 395.7 347.8 386.8C354.8 377.9 361.7 368.2 368.3 359.6C374.9 351.1 380.5 343.7 387.4 335.4C394.3 327.0 401.9 318.0 409.6 309.7C417.3 301.4 425.3 293.3 433.7 285.8C442.0 278.3 450.7 269.6 459.8 264.7C468.8 259.8 478.3 256.1 488.1 256.5C497.8 256.8 509.9 260.7 518.3 266.7C526.8 272.7 532.8 283.8 538.9 292.4C545.1 301.0 548.2 310.4 555.1 318.4C561.9 326.4 570.7 334.4 580.0 340.4C589.3 346.4 600.3 349.9 610.7 354.3C621.1 358.7 632.2 363.5 642.3 366.8C652.4 370.2 662.1 375.2 671.3 374.4C680.5 373.7 692.5 369.3 697.5 362.2C702.5 355.1 701.5 341.8 701.4 331.6C701.3 321.5 697.4 312.0 696.7 301.3C696.0 290.7 696.4 278.8 697.2 267.6C697.9 256.3 700.1 245.2 701.4 234.0C702.6 222.7 703.7 210.9 704.9 200.3C706.0 189.6 707.0 180.4 708.1 169.9C709.2 159.3 710.4 147.8 711.5 136.9C712.5 125.9 714.4 114.6 714.4 104.0C714.3 93.3 715.4 80.4 711.2 73.1C707.0 65.8 698.3 61.9 689.1 60.2C680.0 58.6 667.0 61.0 656.2 63.2C645.3 65.3 633.7 68.8 623.9 73.1C614.2 77.3 606.3 82.5 597.5 88.6C588.7 94.7 579.8 102.8 570.9 109.7C562.0 116.6 552.8 123.1 544.2 130.2C535.6 137.4 527.3 145.6 519.2 152.6C511.1 159.6 503.8 165.3 495.5 172.2C487.1 179.0 477.9 186.4 469.2 193.6C460.5 200.8 451.5 208.6 443.1 215.3C434.8 222.1 427.3 227.6 418.9 234.2C410.5 240.8 401.3 247.9 392.7 254.8C384.0 261.8 375.7 269.0 367.0 276.1C358.4 283.3 349.1 290.8 340.8 297.7Z';

// Start/finish — the first point of the path. Parks the dot there when JS
// hasn't run or motion is reduced, so it never renders at 0,0.
const START = { x: 340.8, y: 297.7 };

export default function CircuitTrace({ className = '', label }) {
  const figureRef = useRef(null);
  const pathRef = useRef(null);
  const markerRef = useRef(null);
  const trailRef = useRef(null);
  const dotRef = useRef(null);
  const fadeRef = useRef(null);

  useEffect(() => {
    const figure = figureRef.current;
    const path = pathRef.current;
    const marker = markerRef.current;
    const trail = trailRef.current;
    const dot = dotRef.current;
    const fade = fadeRef.current;
    if (!figure || !path || !marker || !trail || !dot || !fade) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lapLen = path.getTotalLength();

    // The two custom properties are the public tuning surface.
    const markerStyle = getComputedStyle(marker);
    const trailLen =
      (parseFloat(markerStyle.getPropertyValue('--lap-trail')) || 0.045) * lapLen;
    const trailSteps =
      parseInt(markerStyle.getPropertyValue('--lap-trail-steps'), 10) || 16;

    // getPointAtLength is the expensive call, and the trail would otherwise
    // make `trailSteps` of them every frame forever. The path never changes,
    // so walk it once — deferred to the first draw so a section far below the
    // fold doesn't pay for it during page load.
    let lut = null;
    const buildLut = () => {
      if (lut) return;
      lut = new Array(LUT_STEPS);
      for (let i = 0; i < LUT_STEPS; i++) {
        const pt = path.getPointAtLength((i / LUT_STEPS) * lapLen);
        lut[i] = [pt.x, pt.y];
      }
    };

    // Linear interpolation between LUT samples is not optional — without it
    // there is visible position quantization stutter at high refresh rates.
    const pointAt = (dist) => {
      let floatIdx = ((dist / lapLen) * LUT_STEPS) % LUT_STEPS;
      if (floatIdx < 0) floatIdx += LUT_STEPS;
      const i0 = Math.floor(floatIdx);
      const i1 = (i0 + 1) % LUT_STEPS;
      const t = floatIdx - i0;
      const p0 = lut[i0];
      const p1 = lut[i1];
      return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
    };

    let visible = false;
    let raf = null;
    const started = performance.now();

    // Wall clock rather than an accumulator: while the loop is stopped
    // off-screen no frames run, and on the way back the marker should be where
    // it would have got to, not where it left off.
    const head = () =>
      reduce ? 0 : (((performance.now() - started) % LAP_DUR) / LAP_DUR) * lapLen;

    const draw = () => {
      raf = null;
      buildLut();
      const h = head();

      // The beam: sampled backwards along the PATH from the head.
      let d = '';
      for (let i = 0; i <= trailSteps; i++) {
        const p = pointAt(h - (i / trailSteps) * trailLen);
        d += `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      }
      trail.setAttribute('d', d);

      // Same head distance that started the loop above, so the dot cannot sit
      // anywhere but on the end of its own beam.
      const headPt = pointAt(h);
      dot.setAttribute('cx', headPt[0].toFixed(1));
      dot.setAttribute('cy', headPt[1].toFixed(1));

      // Aim the fade down the beam's own tail-to-head axis. The gradient is
      // straight and the beam is not, but over this length the two agree
      // closely enough that the tail still reads as the transparent end.
      const tailPt = pointAt(h - trailLen);
      fade.setAttribute('x1', tailPt[0].toFixed(1));
      fade.setAttribute('y1', tailPt[1].toFixed(1));
      fade.setAttribute('x2', headPt[0].toFixed(1));
      fade.setAttribute('y2', headPt[1].toFixed(1));

      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };

    // Off-screen the beam still costs a filtered repaint every frame, so the
    // loop only turns over while the circuit is actually in view.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting;
          if (visible && !reduce && raf === null) {
            raf = requestAnimationFrame(draw);
          } else if (!visible && raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      },
      { threshold: 0 }
    );
    io.observe(figure);

    // Under reduced motion the observer never starts the loop, so draw the
    // parked beam once by hand — otherwise the dot arrives alone.
    if (reduce) draw();

    return () => {
      io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <figure ref={figureRef} className={`circuit-figure ${className}`.trim()}>
      <svg
        viewBox="18 30 727 1020"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label || 'Line drawing of the circuit layout'}
      >
        <defs>
          {/* Defined once, referenced by <use> below and measured directly by
              getTotalLength — a <defs> path answers that without painting. */}
          <path ref={pathRef} id={TRACE_ID} d={CIRCUIT_D} />

          {/* Stacking the blur three times under the source is what turns a
              soft edge into something that reads as emitted light rather than
              a drop shadow. The region is widened because the default
              -10%/120% clips a blur this wide and the beam would end in a
              straight cut. */}
          <filter id={GLOW_ID} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="lapBlur" />
            <feMerge>
              <feMergeNode in="lapBlur" />
              <feMergeNode in="lapBlur" />
              <feMergeNode in="lapBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* The fade that makes it a beam and not a worm. userSpaceOnUse is
              mandatory: on the default objectBoundingBox the fade could only
              ever be axis-aligned to the trail's bounding box, where this lets
              the effect aim it straight down the beam's own axis each frame. */}
          <linearGradient ref={fadeRef} id={FADE_ID} gradientUnits="userSpaceOnUse">
            <stop offset="0" className="lap-fade-tail" />
            <stop offset="1" className="lap-fade-head" />
          </linearGradient>
        </defs>

        {/* The line, once. There was a second copy over this one at full
            opacity, dashed so that a 140-unit segment of it lapped the
            circuit every seven seconds. Because it inherited currentColor it
            was drawn in the section's ink, near black against a track set at
            0.42, so it read as a dark scar sliding around the layout rather
            than as a highlight. The laser already says which way the circuit
            runs, and it says it in the brand colour. */}
        <use href={`#${TRACE_ID}`} className="circuit-trace" strokeWidth="7" opacity="0.42" />

        {/* One filter on the group covers dot and trail together, so they glow
            as a single emitted object — and the filter region stays the size
            of the beam instead of the whole circuit, which is what keeps it
            affordable. The <path> has no `d`; the effect writes it. */}
        <g ref={markerRef} className="lap-marker" aria-hidden="true">
          <path ref={trailRef} className="lap-trail" fill="none" />
          <circle ref={dotRef} className="lap-dot" r="2.6" cx={START.x} cy={START.y} />
        </g>
      </svg>
    </figure>
  );
}
