import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Circuit from '../src/components/home/Circuit';
import { CIRCUIT } from '../src/data/circuit';
import { CIRCUIT_COPY } from '../src/data/home';

/**
 * The circuit section, which is two layouts rather than one.
 *
 * On a phone the drawing is the section: the four figures stand on the track
 * itself and the three paragraphs are left to the wide layout. On anything
 * wider it is a column of prose and headline figures beside the drawing.
 *
 * They are separate trees on purpose, and that is what is protected here.
 * CircuitTrace names its SVG filter and gradient by fixed id, and SVG
 * references are document-global, so the two layouts cannot both be in the
 * page with one hidden by a breakpoint: the second copy would break the
 * first. The drawing is stubbed below because it measures a path with
 * getTotalLength, which jsdom does not implement.
 */

vi.mock('../src/components/CircuitTrace', () => ({
  default: ({ className, drawOnView }) => (
    <figure data-testid="trace" className={className} data-draws={drawOnView ? 'yes' : 'no'} />
  ),
}));

const onAPhone = (yes) =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: yes && query.includes('max-width: 767px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));

afterEach(() => vi.restoreAllMocks());

const labels = Object.values(CIRCUIT).map((f) => f.label);

describe('on a phone', () => {
  it('leaves the three paragraphs to the wide layout', () => {
    onAPhone(true);
    const { container } = render(<Circuit />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(screen.queryByText(CIRCUIT_COPY.body[0])).toBeNull();
  });

  it('still states all four figures', () => {
    onAPhone(true);
    render(<Circuit />);

    labels.forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('stands each of them on the drawing', () => {
    onAPhone(true);
    const { container } = render(<Circuit />);

    const placed = container.querySelectorAll('div[style*="left"][style*="top"]');
    expect(placed).toHaveLength(4);
  });

  it('draws the circuit once, and only once', () => {
    onAPhone(true);
    render(<Circuit />);

    expect(screen.getAllByTestId('trace')).toHaveLength(1);
  });

  it('lets the line draw itself, and lays it over the figures', () => {
    onAPhone(true);
    const { container } = render(<Circuit />);

    const trace = screen.getByTestId('trace');
    expect(trace.getAttribute('data-draws')).toBe('yes');
    // The drawing sits above the figures in the stack: the line runs across
    // the numerals rather than under them.
    expect(trace.className).toContain('z-20');
    container.querySelectorAll('div[style*="left"]').forEach((el) => {
      expect(el.className).toContain('z-0');
    });
  });
});

describe('on anything wider', () => {
  it('keeps the prose', () => {
    onAPhone(false);
    const { container } = render(<Circuit />);

    expect(container.querySelectorAll('p')).toHaveLength(CIRCUIT_COPY.body.length);
  });

  it('keeps the four figures', () => {
    onAPhone(false);
    render(<Circuit />);

    labels.forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('does not place them on the drawing', () => {
    onAPhone(false);
    const { container } = render(<Circuit />);

    expect(container.querySelectorAll('div[style*="left"][style*="top"]')).toHaveLength(0);
  });

  it('draws the circuit once, and only once', () => {
    onAPhone(false);
    render(<Circuit />);

    expect(screen.getAllByTestId('trace')).toHaveLength(1);
  });

  it('leaves the line already drawn', () => {
    onAPhone(false);
    render(<Circuit />);

    // The entrance belongs to the phone, where the drawing is the section.
    // Beside a column of prose it would only pull the eye off the words.
    expect(screen.getByTestId('trace').getAttribute('data-draws')).toBe('no');
  });
});
