import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { setupUser } from './helpers/ui.js';
import Navbar from '../src/components/Navbar';
import { ContactModalProvider } from '../src/components/ContactModal';
import { NAV_LINKS } from '../src/data/navigation';
import { isModifiedClick, splitTarget, stripHash, NAV_HEIGHT } from '../src/lib/anchors';

/**
 * The navigation.
 *
 * Two things are protected here, and both were regressions rather than ideas:
 * the top-level items stopped being links when the menu was rebuilt on Base
 * UI, whose trigger is a button; and every section link left its fragment in
 * the address bar, so a reader who had once looked at the circuit carried
 * "#circuit" around for the rest of the visit.
 *
 * Neither is visible in a screenshot of the bar at rest, which is why they
 * both shipped.
 */

const location = { current: null };

function Probe() {
  location.current = useLocation();
  return null;
}

const renderNav = (initial = '/') =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <ContactModalProvider>
        <Probe />
        <Navbar onOpenModal={() => {}} activeTheme="dark" />
        <Routes>
          <Route path="*" element={<div data-testid="page" />} />
        </Routes>
      </ContactModalProvider>
    </MemoryRouter>
  );

/**
 * The top-level item for a label, as it appears on the bar.
 *
 * The mobile drawer carries the same labels, and the bar and the Base UI root
 * are both <nav>, so this is scoped to the desktop menu by its slot. jest-dom
 * is not installed here, hence the bare getAttribute calls throughout rather
 * than toHaveAttribute.
 */
const desktopMenu = () => document.querySelector('[data-slot="navigation-menu"]');

const barItem = (label) => within(desktopMenu()).getByRole('link', { name: label });

/**
 * Base UI mounts a panel only once it is opened, so a section link does not
 * exist until its item is hovered. The menu opens on a delay, which is what
 * the wait is for.
 */
const openPanel = async (user, label) => {
  await user.hover(barItem(label));
  await waitFor(() =>
    expect(document.querySelector('[data-slot="navigation-menu-popup"]')).not.toBeNull()
  );
};

const withPanel = NAV_LINKS.filter((l) => l.items || l.groups);
const sectionsOf = ({ items, groups }) => items || groups.flatMap((g) => g.items);

beforeEach(() => {
  location.current = null;
});

describe('the pages are reachable from the bar', () => {
  it('has something to check', () => {
    expect(withPanel.length).toBeGreaterThanOrEqual(3);
  });

  it.each(NAV_LINKS.map((l) => [l.label, l.path]))(
    '%s is a link to %s, not a bare button',
    (label, target) => {
      renderNav();
      const item = barItem(label);
      expect(item.tagName).toBe('A');
      expect(item.getAttribute('href')).toBe(target);
    }
  );

  it.each(withPanel.map((l) => [l.label, l.path]))(
    'clicking %s goes to %s even though it also opens a panel',
    async (label, target) => {
      const user = setupUser();
      renderNav();

      // The panel is still hung off it: a link that had lost its trigger
      // would pass the assertion below and be a different bug.
      expect(barItem(label).hasAttribute('aria-expanded')).toBe(true);

      await user.click(barItem(label));
      await waitFor(() => expect(location.current.pathname).toBe(target));
    }
  );
});

describe('the drawer on a phone', () => {
  /**
   * The drawer covers the page from the bar down, and the page under it used
   * to go on scrolling: open the menu, drag it, close it, and the page is
   * somewhere else than where it was left. See src/lib/scrollLock.
   */
  const openDrawer = async (user) => {
    renderNav('/');
    await user.click(screen.getByRole('button', { name: /toggle navigation/i }));
  };

  it('holds the page still while it is open', async () => {
    const user = setupUser();
    await openDrawer(user);

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('gives the page back when it closes', async () => {
    const user = setupUser();
    await openDrawer(user);

    await user.click(screen.getByRole('button', { name: /toggle navigation/i }));

    await waitFor(() => expect(document.body.style.position).not.toBe('fixed'));
  });

  it('closes on Escape', async () => {
    const user = setupUser();
    await openDrawer(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(document.body.style.position).not.toBe('fixed'));
  });

  /**
   * The drawer used to start below the bar and be painted at 95% on a blur,
   * so the page showed through it: on the home page the red mark behind the
   * bar sat in the middle of the open menu, cut in half by the panel's top
   * edge. It covers the screen outright now, and the bar draws over it.
   */
  it('covers the page rather than starting under the bar', async () => {
    const user = setupUser();
    await openDrawer(user);

    const panel = document.querySelector('.z-40');
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('inset-0');
    expect(panel.className).not.toContain('top-[76px]');
  });

  it('is painted solid, so nothing shows through it', async () => {
    const user = setupUser();
    await openDrawer(user);

    const panel = document.querySelector('.z-40');
    expect(panel.className).toContain('bg-dark');
    expect(panel.className).not.toContain('bg-dark/');
  });
});

describe('a section link leaves nothing in the address bar', () => {
  const cases = withPanel.flatMap((link) =>
    sectionsOf(link).map((item) => [link.label, item.label, item.path])
  );

  it('has something to check', () => {
    expect(cases.length).toBeGreaterThanOrEqual(10);
  });

  it.each(cases)('%s then %s keeps the real href', async (group, label, target) => {
    const user = setupUser();
    renderNav();
    await openPanel(user, group);

    const link = screen.getByRole('link', { name: label });
    expect(link.getAttribute('href')).toBe(target);
  });

  it('scrolls without putting the fragment in the location', async () => {
    const user = setupUser();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    renderNav('/');
    await openPanel(user, 'Home');

    const section = document.createElement('section');
    section.id = 'circuit';
    section.getBoundingClientRect = () => ({ top: 1200 });
    document.body.appendChild(section);

    await user.click(screen.getByRole('link', { name: 'The circuit' }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalled());
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 1200 - NAV_HEIGHT })
    );
    expect(location.current.hash).toBe('');
    expect(location.current.pathname).toBe('/');

    section.remove();
  });

  it('carries the section in the state on a cross-page jump', async () => {
    const user = setupUser();
    renderNav('/');
    await openPanel(user, 'Business');

    await user.click(screen.getByRole('link', { name: 'In confidence' }));

    await waitFor(() => expect(location.current.pathname).toBe('/business'));
    expect(location.current.hash).toBe('');
    expect(location.current.state).toEqual({ scrollTo: 'in-confidence' });
  });

  it('leaves a ctrl-click to the browser, so the fragment opens in a new tab', async () => {
    const user = setupUser();
    renderNav('/');
    await openPanel(user, 'Home');

    const link = screen.getByRole('link', { name: 'The circuit' });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(false);
    expect(location.current.pathname).toBe('/');
  });
});

describe('lib/anchors', () => {
  it('splits a target into a page and a section', () => {
    expect(splitTarget('/business#enquiry')).toEqual({
      pathname: '/business',
      id: 'enquiry',
    });
    expect(splitTarget('/#circuit')).toEqual({ pathname: '/', id: 'circuit' });
    expect(splitTarget('/club')).toEqual({ pathname: '/club', id: '' });
    expect(splitTarget('')).toEqual({ pathname: '/', id: '' });
  });

  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
    ['middle click', { button: 1 }],
    ['already handled', { defaultPrevented: true }],
  ])('leaves a %s alone', (_name, event) => {
    expect(isModifiedClick({ button: 0, defaultPrevented: false, ...event })).toBe(true);
  });

  it('claims a plain left click', () => {
    expect(isModifiedClick({ button: 0, defaultPrevented: false })).toBe(false);
  });

  it('takes the fragment off the address bar and leaves the page', () => {
    window.history.replaceState({ router: true }, '', '/business?ref=x#enquiry');
    stripHash();

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/business');
    expect(window.location.search).toBe('?ref=x');
    // Replacing rather than pushing: a back button that had to step over the
    // cleanup would be worse than the fragment.
    expect(window.history.state).toEqual({ router: true });

    window.history.replaceState(null, '', '/');
  });
});

/**
 * The menu points at ids, and an id is only real if some component renders it.
 * A section that is removed or renamed takes its menu entry with it, and the
 * entry left behind scrolls nowhere at all: the click appears to do nothing,
 * which reads as a broken link rather than as a missing section.
 */
describe('every section in the menu exists', () => {
  const ids = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.jsx?$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const [, id] of text.matchAll(/\bid=["']([a-z0-9-]+)["']/g)) ids.add(id);
        for (const [, id] of text.matchAll(/\banchor:\s*['"]([a-z0-9-]+)['"]/g)) ids.add(id);
      }
    }
  };
  walk(path.join(process.cwd(), 'src'));

  const targets = withPanel.flatMap((link) =>
    sectionsOf(link)
      .map((item) => [item.label, splitTarget(item.path).id])
      .filter(([, id]) => id)
  );

  it('has something to check', () => {
    expect(targets.length).toBeGreaterThanOrEqual(10);
  });

  it.each(targets)('%s points at an id that is rendered somewhere', (_label, id) => {
    expect(ids.has(id)).toBe(true);
  });
});
