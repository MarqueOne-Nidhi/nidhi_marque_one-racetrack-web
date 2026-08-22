import { describe, it, expect } from 'vitest';
import { soloOpacity, scrollFraction } from '../src/components/ui/CardCylinder';

/**
 * The scroll-driven stack on the Business page shows one card at a time.
 *
 * The cards still travel and tilt as they change, but a neighbour is faded
 * out before it would reach the edge of the stage and peek past the card at
 * the front, which is what it used to do: the section rested with two cards
 * half-showing above and below the one being read.
 *
 * What is checked here is the invariant, not the look: wherever the stack
 * comes to rest, exactly one card is drawn.
 */

describe('one card at a time', () => {
  it('draws the card at the front in full', () => {
    expect(soloOpacity(0)).toBe(1);
  });

  it('holds it in full through the first of the travel', () => {
    expect(soloOpacity(0.2)).toBe(1);
  });

  it('has the neighbours gone by the time they would peek', () => {
    expect(soloOpacity(1)).toBe(0);
    expect(soloOpacity(2)).toBe(0);
    expect(soloOpacity(3)).toBe(0);
  });

  it('draws exactly one card at every place the stack can rest', () => {
    // A settled stack sits at whole offsets: 0 at the front, the rest at 1, 2
    // and so on around the cylinder.
    for (const cardCount of [4, 5, 6]) {
      const drawn = [];
      for (let i = 0; i < cardCount; i++) {
        let offset = i;
        const half = cardCount / 2;
        while (offset > half) offset -= cardCount;
        drawn.push(soloOpacity(Math.abs(offset)));
      }
      expect(drawn.filter((o) => o > 0.01)).toHaveLength(1);
    }
  });

  it('fades rather than cuts, so the change is visible on the way', () => {
    const mid = soloOpacity(0.55);

    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('never asks for an opacity outside what an element can take', () => {
    for (let a = 0; a <= 4; a += 0.05) {
      expect(soloOpacity(a)).toBeGreaterThanOrEqual(0);
      expect(soloOpacity(a)).toBeLessThanOrEqual(1);
    }
  });
});

describe('where the settle reads the position from', () => {
  const vh = 900;

  it('is 0 with the track at the top of the screen', () => {
    // Negating a top of 0 gives -0, which is 0 for every purpose here but
    // not for Object.is, which is what toBe uses.
    expect(scrollFraction({ top: 0, height: 3060 }, vh)).toBeCloseTo(0, 10);
  });

  it('is 1 once the track has finished passing', () => {
    expect(scrollFraction({ top: -2160, height: 3060 }, vh)).toBe(1);
  });

  it('puts the halfway point where a settle has to choose', () => {
    const p = scrollFraction({ top: -1080, height: 3060 }, vh) * 3;

    expect(p).toBeCloseTo(1.5, 5);
    // Round is what the settle does with it, and 1.5 has to land somewhere.
    expect(Math.round(p)).toBe(2);
  });
});
