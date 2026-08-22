import { describe, it, expect } from 'vitest';
import { tabulate, CIRCUIT_D } from '../src/components/CircuitTrace';

/**
 * The circuit's lookup table.
 *
 * The beam is drawn by sampling points along the circuit, and it used to get
 * them from `getPointAtLength`. On a path of 260-odd cubic segments the
 * browser walks the whole thing to answer each call, at nearly a millisecond
 * a call, so the 1800 samples the beam wants froze a throttled phone for nine
 * seconds before the section could be looked at.
 *
 * `tabulate` reads the same points out of the path data in about two
 * milliseconds. What is protected here is that it agrees with the browser
 * about where the circuit is — checked against getPointAtLength in a real
 * browser at 0.024 units of worst-case error, on a line drawn 7 units wide —
 * and that it refuses paths it cannot read, so the slow path still catches
 * them.
 */

// Measured by the browser on this exact path, via getTotalLength.
const BROWSER_LENGTH = 4741.8;

describe('reading the circuit out of its path data', () => {
  it('measures the lap the same length the browser does', () => {
    const { length } = tabulate(CIRCUIT_D, 1800);

    expect(Math.abs(length - BROWSER_LENGTH)).toBeLessThan(1);
  });

  it('starts where the path starts', () => {
    const { lut } = tabulate(CIRCUIT_D, 1800);

    expect(lut[0][0]).toBeCloseTo(621.6, 1);
    expect(lut[0][1]).toBeCloseTo(21.6, 1);
  });

  it('returns the number of samples asked for', () => {
    expect(tabulate(CIRCUIT_D, 600).lut).toHaveLength(600);
    expect(tabulate(CIRCUIT_D, 1800).lut).toHaveLength(1800);
  });

  it('spaces them evenly along the lap, which is what the beam assumes', () => {
    const { lut, length } = tabulate(CIRCUIT_D, 900);
    const step = length / 900;

    const gaps = lut.map((p, i) => {
      const q = lut[(i + 1) % lut.length];
      return Math.hypot(q[0] - p[0], q[1] - p[1]);
    });

    // Chords, so every gap is a shade under the arc it stands for, never over.
    gaps.forEach((g) => expect(g).toBeLessThan(step * 1.02));
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(mean).toBeGreaterThan(step * 0.97);
  });

  it('closes the loop, so the beam does not jump at the line', () => {
    const { lut } = tabulate(CIRCUIT_D, 1800);
    const first = lut[0];
    const last = lut[lut.length - 1];

    expect(Math.hypot(last[0] - first[0], last[1] - first[1])).toBeLessThan(5);
  });

  it('is quick enough to do at mount', () => {
    const started = performance.now();
    tabulate(CIRCUIT_D, 1800);

    expect(performance.now() - started).toBeLessThan(60);
  });
});

describe('a path it cannot read', () => {
  it('gives up rather than guessing, so the browser is asked instead', () => {
    // Arcs, quadratics and relative commands are all beyond it.
    expect(tabulate('M0 0 A 50 50 0 0 1 100 100 Z', 100)).toBeNull();
    expect(tabulate('M0 0 Q 50 50 100 0 Z', 100)).toBeNull();
    expect(tabulate('M0 0 L 100 0 Z', 100)).toBeNull();
  });

  it('gives up on an empty one', () => {
    expect(tabulate('', 100)).toBeNull();
  });
});
