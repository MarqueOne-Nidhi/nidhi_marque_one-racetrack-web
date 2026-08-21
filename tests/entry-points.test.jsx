import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from './helpers/ui.js';
import { ContactModalProvider, useContactModal } from '../src/components/ContactModal';
import { ENQUIRY } from '../src/data/home';
import { stubEndpoint, fieldsOf } from './helpers/endpoint.js';

/**
 * Getting to a form, and arriving with the right context.
 *
 * Twelve calls to action across the site lead to one of the two forms, and the
 * only thing about a submission that only the button knows is which button it
 * was. By the time the form is open every route into it looks identical, so
 * the source has to be passed at the call site, and a call site that forgets
 * is invisible until someone reads a column of blanks in the spreadsheet.
 *
 * The first half of this file therefore reads the source rather than the
 * screen: it is the only way to assert something about call sites that have
 * not been added yet.
 */

const SRC = path.join(process.cwd(), 'src');

const sourceFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.jsx?$/.test(entry.name)) out.push(full);
    }
  };
  walk(SRC);
  return out;
};

/**
 * Blanks comments while keeping every line and column where it was, so the
 * line numbers a failure reports still point at the right place.
 *
 * Needed because this codebase documents its own hazards. App.jsx explains in
 * a comment why `onClick={onOpenModal}` would be a bug, and a scanner that
 * reads prose flags the explanation as the bug.
 */
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const WHOLE_LINE_COMMENT = /^([^\S\n]*)\/\/.*$/gm;

const stripComments = (text) =>
  text
    .replace(BLOCK_COMMENT, (block) => block.replace(/[^\n]/g, ' '))
    .replace(WHOLE_LINE_COMMENT, (line, indent) => indent);

const withSource = (pattern) => {
  const hits = [];
  for (const file of sourceFiles()) {
    const text = stripComments(fs.readFileSync(file, 'utf8'));
    for (const match of text.matchAll(pattern)) {
      hits.push({
        file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
        line: text.slice(0, match.index).split('\n').length,
        text: match[0],
        args: match[1],
      });
    }
  }
  return hits;
};

describe('every call site names itself', () => {
  it('finds all the enquiry call sites', () => {
    // A guard on the guard: if this drops to nothing the checks below would
    // pass vacuously.
    expect(withSource(/openContact\(([^)]*)\)/g).length).toBeGreaterThanOrEqual(9);
  });

  it('passes a source to openContact everywhere it is called', () => {
    const bare = withSource(/openContact\(([^)]*)\)/g).filter(
      (hit) => !/,\s*['"][^'"]+['"]/.test(hit.args)
    );

    expect(
      bare.map((h) => `${h.file}:${h.line}  ${h.text}`),
      'openContact needs a second argument naming the call to action'
    ).toEqual([]);
  });

  it('passes a source to onOpenModal everywhere it is invoked', () => {
    const bare = withSource(/onOpenModal\(([^)]*)\)/g).filter(
      (hit) => !/^['"][^'"]+['"]$/.test(hit.args.trim())
    );

    expect(
      bare.map((h) => `${h.file}:${h.line}  ${h.text}`),
      'onOpenModal takes the source as its first argument'
    ).toEqual([]);
  });

  it('never wires a handler bare, which would send a PointerEvent as the source', () => {
    // onClick={onOpenModal} passes the click event as the first argument, and
    // a PointerEvent would end up in the spreadsheet.
    const bare = withSource(/onClick=\{(onOpenModal|openContact)\}/g);

    expect(bare.map((h) => `${h.file}:${h.line}  ${h.text}`)).toEqual([]);
  });

  it('gives every source a distinct, readable name', () => {
    const sources = [
      ...withSource(/openContact\([^,)]*,\s*'([^']+)'/g),
      ...withSource(/onOpenModal\('([^']+)'/g),
    ].map((hit) => hit.args);

    expect(sources.length).toBeGreaterThanOrEqual(12);
    for (const source of sources) {
      expect(source, 'a source is read by a person scanning a column').toMatch(
        /^[A-Z][A-Za-z0-9 ·.]+$/
      );
    }
  });

  it('covers the places a visitor actually starts from', () => {
    const sources = new Set(
      [
        ...withSource(/openContact\([^,)]*,\s*'([^']+)'/g),
        ...withSource(/onOpenModal\('([^']+)'/g),
        ...withSource(/source="([^"]+)"/g),
      ].map((hit) => hit.args)
    );

    for (const expected of ['Navbar', 'Footer', 'Home hero', 'Club hero']) {
      expect([...sources], `expected a call to action named ${expected}`).toContain(expected);
    }
    expect([...sources].filter((s) => s.startsWith('Club · ')).length).toBeGreaterThanOrEqual(4);
  });
});

/** A stand-in for any button on the site that opens the contact popover. */
function Opener({ type, source, label = 'open' }) {
  const openContact = useContactModal();
  return (
    <button type="button" onClick={() => openContact(type, source)}>
      {label}
    </button>
  );
}

const fillPopover = async (user) => {
  await user.type(screen.getByPlaceholderText('Your name'), 'Ravi Menon');
  await user.type(screen.getByPlaceholderText('your@email.com'), 'ravi@example.com');
  await user.type(screen.getByPlaceholderText('+91 90000 00000'), '+91 90000 00000');
};

describe('the contact popover', () => {
  it('is not mounted until something opens it', () => {
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on request', async () => {
    const user = setupUser();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it.each([
    ['Drive', 'Navbar'],
    ['Stay', 'Club · The house'],
    ['Business', 'Home hero'],
  ])('carries %s and %s all the way to the submission', async (type, source) => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(
      <ContactModalProvider>
        <Opener type={type} source={source} />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');
    await fillPopover(user);
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)['Enquiry Type']).toBe(type);
    expect(fieldsOf(calls)['Opened Via']).toBe(source);
  });

  it('falls back to Drive when asked for a type that does not exist', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(
      <ContactModalProvider>
        <Opener type="Spaceflight" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');
    await fillPopover(user);
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(ENQUIRY.toggles).toContain(fieldsOf(calls)['Enquiry Type']);
    expect(fieldsOf(calls)['Enquiry Type']).toBe('Drive');
  });

  it('closes on Escape', async () => {
    const user = setupUser();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not leave the page scrollable underneath it', async () => {
    const user = setupUser();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('gives back the scroll when it closes', async () => {
    const user = setupUser();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
  });

  it('starts empty each time, rather than showing the last enquiry', async () => {
    const user = setupUser();
    stubEndpoint();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');
    await fillPopover(user);
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }));
    await screen.findByText(/Enquiry Received/i);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByText('open'));
    await screen.findByRole('dialog');

    expect(screen.queryByText(/Enquiry Received/i)).toBeNull();
    expect(screen.getByPlaceholderText('Your name').value).toBe('');
  });

  it('reopens with whatever the newest call to action asked for', async () => {
    const user = setupUser();
    const calls = stubEndpoint();
    render(
      <ContactModalProvider>
        <Opener type="Drive" source="Navbar" label="one" />
        <Opener type="Stay" source="Club · The house" label="two" />
      </ContactModalProvider>
    );

    await user.click(screen.getByText('one'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByText('two'));
    await screen.findByRole('dialog');
    await fillPopover(user);
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(fieldsOf(calls)['Enquiry Type']).toBe('Stay');
    expect(fieldsOf(calls)['Opened Via']).toBe('Club · The house');
  });
});
