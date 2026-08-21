# Marque One Multi-page Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-page `ONE.CLUB` scroll site into a four-route estate site whose homepage runs eleven alternating two-column sections.

**Architecture:** `react-router-dom` with a shared shell (Navbar + Footer + modals) wrapping four page components. A single `SplitSection` primitive owns the two-column layout for every section that uses it; media side alternates by data, not by hand. All copy and all circuit figures live in `src/data/`, so words and specs are edited in one file each rather than across fourteen components. Motion is centralised in `src/lib/motion.js` and gated globally by a `useReducedMotion` hook.

**Tech Stack:** Vite 6 · React 18 · Tailwind 3 · framer-motion 11 · react-router-dom 6 · Radix UI (accordion, tabs) · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-08-16-marque-one-multipage-design.md`

---

## Global Constraints

Every task's requirements implicitly include this section.

**Circuit figures — the only permitted values.** These are launch-blocking accuracy. Copy verbatim:
- Lap: `3.2 km`
- Drag strip: `800 m`, **integrated into the circuit**
- Elevation: `±25 m` (with the `±` sign, never converted to a range)
- Rated: `230 km/h` ("rated beyond")
- Grade wording: `FIA-graded` — never "built to FIA standards"
- **No corner count is published anywhere.**

**Forbidden strings — must never appear in shipped source.** These describe a different circuit or a superseded figure: `5.5 km`, `18 corners`, `1.1 km`, `40 m` elevation, `13 corners`, `3.3 km`, `India's longest`.

**Design tokens.** `dark #090909` · `dark-secondary #121210` · `ivory #F5F1E8` · `ivory-darker #EDE8DE` · `oxblood #6B1F2A` · `oxblood-deep #4A1520`. Serif is Cormorant Garamond 300, sans is Inter.

**Motion.** House easing `cubic-bezier(0.16, 1, 0.3, 1)`. Reveal 700ms, wipe 900ms, stagger 80ms, accordion 250ms, tabs 200ms, hover 400ms, tap 120ms. Viewport `{ once: true, margin: '-15%' }`. Animate `transform`, `opacity`, `filter` only.

**Layout.** Split ratio 48/52. Gutter `clamp(2.5rem, 5vw, 6rem)`. Stacks below `1024px`. Media always first in DOM order. Content column caps at `62ch`. Media side alternates and never repeats consecutively.

**Copy rules.** One `<h2>` per section. No block past four lines. Figures stay live text, never images.

**Out of scope.** Terms page and liability waiver. Any change to Club page content or layout.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `src/lib/utils.js` | `cn()` class merger |
| `src/lib/motion.js` | Shared easings, durations, viewport config, variant factories |
| `src/lib/submitToSheet.js` | Single Google Apps Script POST, used by every form |
| `src/hooks/useReducedMotion.js` | Reads and watches `prefers-reduced-motion` |
| `src/hooks/useSectionTone.js` | Observes `[data-tone]` to drive navbar colour |
| `src/data/circuit.js` | The circuit figures — single source of truth |
| `src/data/home.js` | All homepage copy |
| `src/data/about.js` | All About copy |
| `src/data/images.js` | Image slot manifest |
| `src/data/layout.js` | Ordered split sections + media sides (enforces alternation) |
| `src/components/layout/SplitSection.jsx` | The two-column primitive |
| `src/components/ui/BlurFade.jsx` | Primary scroll reveal |
| `src/components/ui/BoxReveal.jsx` | Oxblood wipe on media |
| `src/components/ui/ScrollProgress.jsx` | Top progress line |
| `src/components/ui/TextReveal.jsx` | Word-by-word reveal, §2 only |
| `src/components/ui/StickyScrollReveal.jsx` | Pinned media, §4 only |
| `src/components/ui/ImageSlot.jsx` | Image or labelled placeholder |
| `src/components/ui/accordion.jsx` | Radix accordion, styled |
| `src/components/ui/tabs.jsx` | Radix tabs, styled |
| `src/components/home/*.jsx` | Fourteen section components |
| `src/pages/Home.jsx` `About.jsx` `Contact.jsx` `Club.jsx` | Route pages |
| `src/components/ScrollToTop.jsx` | Resets scroll on route change |
| `public/_redirects` · `vercel.json` | SPA fallback |
| `IMAGE-MANIFEST.md` | Client-facing photography brief |

**Modified:** `src/App.jsx` (becomes shell) · `src/index.css` (cursor scoping, reduced motion) · `src/components/Navbar.jsx` (router links) · `src/components/Footer.jsx` (router links, oxblood token) · `src/components/MembershipModal.jsx` (use shared submit) · `src/components/ui/FlickeringGrid.jsx` + `Hero.jsx` (pause canvas off-screen) · `tailwind.config.js` · `vite.config.js` · `index.html` · `package.json`

---

## Task 1: Foundation — git, test harness, tokens, `cn()`

**Files:**
- Create: `.gitignore`, `src/lib/utils.js`, `src/test/setup.js`, `src/lib/utils.test.js`
- Modify: `vite.config.js`, `tailwind.config.js`, `package.json`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.js`
- Produces: tailwind tokens `oxblood`, `oxblood-deep`; `npm test` script

- [ ] **Step 1: Initialise git and ignore build output**

```bash
git init
git branch -M main
```

Create `.gitignore`:

```
node_modules
dist
.vite
*.local
.DS_Store
```

- [ ] **Step 2: Install test tooling**

```bash
npm i -D vitest@^3 jsdom@^26 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

- [ ] **Step 3: Wire vitest into vite.config.js**

Replace `vite.config.js` entirely. **Note `base` changes from `'./'` to `'/'`** — relative base breaks asset resolution on nested routes.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  }
});
```

- [ ] **Step 4: Create the test setup file**

`src/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest';

// jsdom implements neither of these; framer-motion and our hooks both need them.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

window.scrollTo = () => {};
```

- [ ] **Step 5: Add the test script to package.json**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Write the failing test for `cn()`**

`src/lib/utils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });

  it('lets a later tailwind class win over an earlier conflicting one', () => {
    expect(cn('px-2 py-1', 'px-6')).toBe('py-1 px-6');
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npm test -- src/lib/utils.test.js`
Expected: FAIL — `Failed to resolve import "./utils"`

- [ ] **Step 8: Implement `cn()`**

`src/lib/utils.js`:

```js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npm test -- src/lib/utils.test.js`
Expected: PASS, 3 tests

- [ ] **Step 10: Add the oxblood tokens**

In `tailwind.config.js`, inside `theme.extend.colors`, add alongside the existing `dark` and `ivory` entries:

```js
        oxblood: {
          DEFAULT: "#6B1F2A",
          deep: "#4A1520",
        },
```

- [ ] **Step 11: Confirm the build still runs**

Run: `npm run build`
Expected: succeeds, no errors

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: init repo, add vitest harness, cn() helper and oxblood tokens"
```

---

## Task 2: Circuit figures — single source of truth

The launch-blocking accuracy guard. The test here is the most valuable in the suite: it fails if a superseded figure ever reappears.

**Files:**
- Create: `src/data/circuit.js`, `src/data/circuit.test.js`

**Interfaces:**
- Produces: `CIRCUIT` object with `figures: Array<{ value: string, label: string }>`, plus `grade`, `designer`, `elevationProse`, `stripProse`, `faqLength`, `faqSurfaces`

- [ ] **Step 1: Write the failing test**

`src/data/circuit.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { CIRCUIT } from './circuit';

const FORBIDDEN = ['5.5 km', '18 corners', '1.1 km', '40 m', '13 corners', '3.3 km', "India's longest"];

describe('CIRCUIT', () => {
  it('publishes exactly four figures in order', () => {
    expect(CIRCUIT.figures.map((f) => f.value)).toEqual(['3.2 km', '800 m', '±25 m', '230 km/h']);
    expect(CIRCUIT.figures.map((f) => f.label)).toEqual(['lap', 'drag strip', 'elevation', 'rated beyond']);
  });

  it('writes elevation with the ± sign, never as a range', () => {
    expect(CIRCUIT.figures[2].value).toBe('±25 m');
    expect(CIRCUIT.elevationProse).toContain('either side of level');
  });

  it('says FIA-graded, not built to FIA standards', () => {
    expect(CIRCUIT.grade).toBe('FIA-graded');
    expect(JSON.stringify(CIRCUIT)).not.toContain('built to FIA standards');
  });

  it('publishes no corner count', () => {
    expect(JSON.stringify(CIRCUIT)).not.toMatch(/corner count|\d+ corners/i);
  });

  it('states the drag strip is integrated into the circuit', () => {
    expect(CIRCUIT.stripProse).toContain('on the circuit itself');
  });

  it('contains no superseded or rejected figure', () => {
    const blob = JSON.stringify(CIRCUIT);
    FORBIDDEN.forEach((bad) => expect(blob).not.toContain(bad));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/data/circuit.test.js`
Expected: FAIL — cannot resolve `./circuit`

- [ ] **Step 3: Implement the data file**

`src/data/circuit.js`:

```js
// The circuit specification. Single source of truth.
//
// Client-supplied 16 Aug 2026, and authoritative. It supersedes both the
// figures measured from the master plan and the 2020 Autocar press figures.
// See docs/superpowers/specs/2026-08-16-marque-one-multipage-design.md §2.
//
// Do not add a corner count. Do not convert ±25 m to a range.

export const CIRCUIT = {
  figures: [
    { value: '3.2 km',   label: 'lap' },
    { value: '800 m',    label: 'drag strip' },
    { value: '±25 m',    label: 'elevation' },
    { value: '230 km/h', label: 'rated beyond' },
  ],

  grade: 'FIA-graded',
  designer: 'Driven International',

  elevationProse:
    'The road climbs and drops twenty-five metres either side of level. It goes blind over crests. It is never flat and never twice the same.',

  stripProse:
    'The drag strip runs on the circuit itself — eight hundred metres from a standing start, timed to the thousandth.',

  gradeProse:
    'An FIA-graded circuit, with race-grade asphalt run-off, permanent barriers and full trackside electronics. Designed by Driven International.',

  faqLength:
    '3.2 kilometres, with an 800-metre drag strip integrated into the lap and ±25 metres of elevation.',

  faqSurfaces:
    'An off-road and rock-crawl course, a skid pan, a kick plate and a wet handling track. The drag strip runs on the circuit itself.',
};
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/data/circuit.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/data/circuit.js src/data/circuit.test.js
git commit -m "feat: add circuit spec as single source of truth with accuracy guards"
```

---

## Task 3: Routing — react-router, four pages, SPA fallback

Moves the entire current site into `pages/Club.jsx` untouched, and turns `App.jsx` into a shell.

**Files:**
- Create: `src/pages/Club.jsx`, `src/pages/Home.jsx`, `src/pages/About.jsx`, `src/pages/Contact.jsx`, `src/components/ScrollToTop.jsx`, `public/_redirects`, `vercel.json`, `src/App.test.jsx`
- Modify: `src/main.jsx`, `src/App.jsx`, `index.html`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: routes `/`, `/about`, `/club`, `/contact`; `App` renders `<Outlet/>`-style children via `<Routes>`; page components accept `{ onOpenModal }` where they need the membership drawer

- [ ] **Step 1: Install react-router-dom**

```bash
npm i react-router-dom@^6
```

- [ ] **Step 2: Write the failing routing test**

`src/App.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('routing', () => {
  it('renders the homepage at /', () => {
    renderAt('/');
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
  });

  it('renders about at /about', () => {
    renderAt('/about');
    expect(screen.getByTestId('page-about')).toBeInTheDocument();
  });

  it('renders the club at /club', () => {
    renderAt('/club');
    expect(screen.getByTestId('page-club')).toBeInTheDocument();
  });

  it('renders contact at /contact', () => {
    renderAt('/contact');
    expect(screen.getByTestId('page-contact')).toBeInTheDocument();
  });

  it('falls back to the homepage on an unknown path', () => {
    renderAt('/nonsense');
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test -- src/App.test.jsx`
Expected: FAIL — `page-home` not found

- [ ] **Step 4: Move the current site into `pages/Club.jsx`**

Create `src/pages/Club.jsx`. Take the **exact** JSX currently inside `App.jsx`'s `<main>`, in its existing order, plus `CursorLens` and `GlobalAudioButton`. Content is unchanged — only its location moves. The `.club-page` wrapper is what scopes the custom cursor in Task 4.

Drop the old IntersectionObserver effect from `App.jsx` entirely — Step 5 replaces it with `data-tone` attributes.

```jsx
import React from 'react';
import CursorLens from '../components/CursorLens';
import GlobalAudioButton from '../components/GlobalAudioButton';
import Hero from '../components/Hero';
import TheHook from '../components/TheHook';
import TheClub from '../components/TheClub';
import TheDrive from '../components/TheDrive';
import TheCar from '../components/TheCar';
import TheHouse from '../components/TheHouse';
import TheExperience from '../components/TheExperience';
import Membership from '../components/Membership';
import FinalScene from '../components/FinalScene';

export default function Club({ onOpenModal }) {
  return (
    <div className="club-page" data-testid="page-club">
      <CursorLens />
      <GlobalAudioButton />
      <main>
        <Hero onOpenModal={onOpenModal} />
        <TheHook />
        <TheClub />
        <TheDrive onOpenModal={onOpenModal} />
        <TheCar onOpenModal={onOpenModal} />
        <TheHouse onOpenModal={onOpenModal} />
        <TheExperience />
        <Membership onOpenModal={onOpenModal} />
        <FinalScene onOpenModal={onOpenModal} />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Tag the Club page's light sections**

In `src/components/TheHook.jsx`, add `data-tone="light"` to the root `<section>`:

```jsx
<section id="hook" data-tone="light" className="w-full bg-ivory text-dark py-[14vh] px-[6vw]">
```

In `src/components/TheHouse.jsx`, find the root `<section id="house" …>` and add `data-tone="light"` the same way. Add `data-tone="dark"` to the root section of `Hero.jsx`, `TheClub.jsx`, `TheDrive.jsx`, `TheCar.jsx`, `TheExperience.jsx`, `Membership.jsx` and `FinalScene.jsx`.

- [ ] **Step 6: Create the three new page stubs**

`src/pages/Home.jsx`:

```jsx
import React from 'react';

export default function Home() {
  return <div data-testid="page-home" />;
}
```

`src/pages/About.jsx`:

```jsx
import React from 'react';

export default function About() {
  return <div data-testid="page-about" />;
}
```

`src/pages/Contact.jsx`:

```jsx
import React from 'react';

export default function Contact() {
  return <div data-testid="page-contact" />;
}
```

- [ ] **Step 7: Create ScrollToTop**

`src/components/ScrollToTop.jsx`:

```jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Without this, navigating from the bottom of Home to /about lands mid-page.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
```

- [ ] **Step 8: Rewrite App.jsx as the shell**

`src/App.jsx`:

```jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembershipModal from './components/MembershipModal';
import LightboxModal from './components/LightboxModal';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Club from './pages/Club';

export default function App() {
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState({ isOpen: false, src: '', caption: '' });

  const openModal = () => setIsMembershipOpen(true);

  return (
    <div className="relative min-h-screen bg-dark text-ivory">
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home onOpenModal={openModal} />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/club" element={<Club onOpenModal={openModal} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />

      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
      <LightboxModal
        isOpen={lightboxData.isOpen}
        src={lightboxData.src}
        caption={lightboxData.caption}
        onClose={() => setLightboxData((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
```

`Navbar` and `Footer` temporarily lose their props here; Task 5 restores what they need.

- [ ] **Step 9: Wrap main.jsx in BrowserRouter**

`src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 10: Strip the `file://` loader from index.html**

Client-side routing cannot work from `file://`. Replace the `<script type="module">` block at the bottom of `index.html` with:

```html
  <script type="module" src="/src/main.jsx"></script>
```

Also remove the `<link rel="stylesheet" crossorigin href="./assets/bundle/index-xsk69x0_.css">` line from `<head>` — it points at a stale prebuilt bundle.

- [ ] **Step 11: Add SPA fallback config**

`public/_redirects` (Netlify):

```
/*    /index.html   200
```

`vercel.json` (repo root):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 12: Run the tests**

Run: `npm test -- src/App.test.jsx`
Expected: PASS, 5 tests

- [ ] **Step 13: Verify the real app boots**

Run: `npm run dev`, open `http://localhost:5173/club`
Expected: the existing site renders exactly as before. Then check `/`, `/about`, `/contact` render blank pages with navbar and footer.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: add react-router with four routes, move club page, add SPA fallback"
```

---

## Task 4: Theme plumbing — tone observer and cursor scoping

**Files:**
- Create: `src/hooks/useSectionTone.js`, `src/hooks/useSectionTone.test.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `useSectionTone(): 'light' | 'dark'` — observes every `[data-tone]` element on the page

- [ ] **Step 1: Write the failing test**

`src/hooks/useSectionTone.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import useSectionTone from './useSectionTone';

let observerCallback;

beforeEach(() => {
  observerCallback = null;
  window.IntersectionObserver = class {
    constructor(cb) { observerCallback = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function Probe() {
  const tone = useSectionTone();
  return (
    <>
      <span data-testid="tone">{tone}</span>
      <section data-tone="dark">a</section>
      <section data-tone="light">b</section>
    </>
  );
}

describe('useSectionTone', () => {
  it('defaults to dark', () => {
    render(<Probe />);
    expect(screen.getByTestId('tone')).toHaveTextContent('dark');
  });

  it('switches to light when a light section is the intersecting one', () => {
    render(<Probe />);
    const light = document.querySelector('[data-tone="light"]');
    observerCallback([{ isIntersecting: true, target: light, intersectionRatio: 0.9 }]);
    expect(screen.getByTestId('tone')).toHaveTextContent('light');
  });

  it('switches back to dark when a dark section takes over', () => {
    render(<Probe />);
    const light = document.querySelector('[data-tone="light"]');
    const dark = document.querySelector('[data-tone="dark"]');
    observerCallback([{ isIntersecting: true, target: light, intersectionRatio: 0.9 }]);
    observerCallback([
      { isIntersecting: false, target: light, intersectionRatio: 0 },
      { isIntersecting: true, target: dark, intersectionRatio: 0.9 },
    ]);
    expect(screen.getByTestId('tone')).toHaveTextContent('dark');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/hooks/useSectionTone.test.jsx`
Expected: FAIL — cannot resolve `./useSectionTone`

- [ ] **Step 3: Implement the hook**

`src/hooks/useSectionTone.js`:

```js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Replaces the old hardcoded `#hook, #house` query in App.jsx, which only
// described the Club page. Sections now declare their own tone, so adding
// or reordering a section never requires editing the navbar.
export default function useSectionTone() {
  const [tone, setTone] = useState('dark');
  const { pathname } = useLocation();

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-tone]'));
    if (sections.length === 0) {
      setTone('dark');
      return;
    }

    const ratios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let best = null;
        let bestRatio = 0;
        ratios.forEach((ratio, el) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = el;
          }
        });

        setTone(best ? best.getAttribute('data-tone') : 'dark');
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-76px 0px -60% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  return tone;
}
```

The `rootMargin` offsets the 76px navbar and weights the decision toward the top of the viewport — the tone that matters is the one *behind the navbar*, not the one filling the screen.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/hooks/useSectionTone.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 5: Scope the custom cursor to the Club page**

In `src/index.css`, replace the global cursor block:

```css
/* Custom Cursor Hide on Desktop — Club page only.
   CursorLens renders only on /club; applying this globally would leave the
   homepage with an invisible pointer and no visible error. */
@media (pointer: fine) {
  .club-page,
  .club-page a,
  .club-page button {
    cursor: none !important;
  }
}
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Expected: `/club` has the custom lens cursor and no system pointer. `/` and `/about` have a normal system pointer. **This is a silent failure if wrong — it must actually be looked at.**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: generic data-tone observer, scope custom cursor to club page"
```

---

## Task 5: Navbar and Footer — router links

**Files:**
- Modify: `src/components/Navbar.jsx`, `src/components/Footer.jsx`
- Create: `src/components/Navbar.test.jsx`

**Interfaces:**
- Consumes: `useSectionTone()` from Task 4
- Produces: `Navbar` takes no props; `Footer` takes no props

- [ ] **Step 1: Write the failing test**

`src/components/Navbar.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNav = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar', () => {
  it('links to the three pages', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'The Club' })).toHaveAttribute('href', '/club');
  });

  it('puts Contact in the CTA position', () => {
    renderNav();
    expect(screen.getByTestId('nav-cta')).toHaveAttribute('href', '/contact');
  });

  it('no longer advertises membership in the nav', () => {
    renderNav();
    expect(screen.queryByText(/join the club/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/Navbar.test.jsx`
Expected: FAIL — no link named "Home"

- [ ] **Step 3: Rewrite the Navbar link data and CTA**

In `src/components/Navbar.jsx`:

Replace the imports and `NAV_LINKS`, and delete `scrollToSection` entirely:

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidButton from './ui/LiquidButton';
import useSectionTone from '../hooks/useSectionTone';

const NAV_LINKS = [
  { label: 'Home',     to: '/'      },
  { label: 'About',    to: '/about' },
  { label: 'The Club', to: '/club'  },
];
```

Change the signature and derive tone internally:

```jsx
export default function Navbar() {
  const activeTheme = useSectionTone();
```

Replace the desktop link list:

```jsx
        <ul className="hidden md:flex items-center gap-[2.4vw] list-none m-0 p-0">
          {NAV_LINKS.map(({ label, to }) => (
            <li key={to}>
              <Link
                to={to}
                className={`text-[0.75rem] tracking-[0.14em] uppercase opacity-70 hover:opacity-100 transition-opacity duration-300 font-sans ${textColorClass}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
```

Replace the desktop CTA:

```jsx
        <div className="hidden md:flex items-center">
          <Link to="/contact" data-testid="nav-cta">
            <LiquidButton variant={isLight ? 'secondary' : 'default'}>
              Contact
            </LiquidButton>
          </Link>
        </div>
```

Replace the brand logo button with a `Link` to `/`:

```jsx
        <Link
          to="/"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          className="flex items-center gap-2"
          aria-label="Marque One home"
        >
          <img src={logoSrc} alt="Marque One" className="h-7 w-auto transition-all duration-300" />
        </Link>
```

In the mobile drawer, replace the buttons with links and the CTA:

```jsx
            <div className="flex flex-col gap-6">
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-serif text-[clamp(2.2rem,8vw,3.2rem)] font-light tracking-tight hover:opacity-50 transition-opacity text-left text-ivory w-full"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-ivory/10 pt-6">
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <LiquidButton variant="default" size="lg" className="w-full">
                  Contact →
                </LiquidButton>
              </Link>
              <span className="text-[0.65rem] tracking-widest uppercase text-ivory/40 text-center">
                BENGALURU · INDIA
              </span>
            </div>
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/components/Navbar.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 5: Re-point the Footer's link lists**

In `src/components/Footer.jsx`, replace the four data arrays and delete `scrollToSection`:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail } from 'lucide-react';
import FlickeringGrid from './ui/FlickeringGrid';

const EXPLORE = [
  { label: 'Home',     to: '/'        },
  { label: 'About',    to: '/about'   },
  { label: 'The Club', to: '/club'    },
  { label: 'Contact',  to: '/contact' },
];

const ENQUIRIES = [
  { label: 'General',         href: 'mailto:project.motorclub@marque.one' },
  { label: 'project.motorclub@marque.one', href: 'mailto:project.motorclub@marque.one', accent: true },
];

const SOCIALS = [
  { Icon: Facebook,  href: '#', label: 'Facebook'  },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Youtube,   href: '#', label: 'YouTube'   },
  { Icon: Mail,      href: 'mailto:project.motorclub@marque.one', label: 'Email' },
];
```

Change the signature to `export default function Footer() {` and replace the EXPLORE column body:

```jsx
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/30 mb-1">Explore</span>
              {EXPLORE.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-[0.82rem] font-light text-ivory/60 hover:text-ivory transition-colors font-sans tracking-wide"
                >
                  {label}
                </Link>
              ))}
            </div>
```

Replace the ENQUIRIES column body:

```jsx
            <div className="flex flex-col gap-4">
              <span className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/30 mb-1">Enquiries</span>
              {ENQUIRIES.map(({ label, href, accent }) => (
                <a
                  key={label}
                  href={href}
                  className={`text-[0.82rem] font-light transition-colors tracking-wide ${
                    accent ? 'text-oxblood hover:text-oxblood/80' : 'text-ivory/60 hover:text-ivory'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
```

Leave the LEGAL column's labels as they are — the Terms page is out of scope, so they stay non-navigating.

Replace the logo button with a `Link to="/"`, and migrate the two remaining raw red classes to the token: `text-red-600` → `text-oxblood` in the wordmark, and `text-red-700/60` → `text-oxblood/70` in the copyright line.

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Expected: nav links move between pages without a full reload; footer links work; the accent red is now oxblood, visibly deeper than before.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: route navbar and footer links across pages, migrate accent to oxblood"
```

---

## Task 6: Motion foundation — tokens, reduced motion, BlurFade, BoxReveal, ScrollProgress

**Files:**
- Create: `src/lib/motion.js`, `src/hooks/useReducedMotion.js`, `src/hooks/useReducedMotion.test.jsx`, `src/components/ui/BlurFade.jsx`, `src/components/ui/BlurFade.test.jsx`, `src/components/ui/BoxReveal.jsx`, `src/components/ui/ScrollProgress.jsx`
- Modify: `src/index.css`, `src/App.jsx`

**Interfaces:**
- Produces: `EASE_EXPO`, `DUR`, `VIEWPORT`, `revealVariants(reduced)` from `src/lib/motion.js`
- Produces: `useReducedMotion(): boolean`
- Produces: `<BlurFade delay={0} className="" as="div">`, `<BoxReveal direction="left"|"right">`, `<ScrollProgress />`

- [ ] **Step 1: Create the motion token file**

`src/lib/motion.js`:

```js
// House easing, already used across the Club page. Expo-out.
export const EASE_EXPO = [0.16, 1, 0.3, 1];

export const DUR = {
  reveal: 0.7,
  wipe: 0.9,
  stagger: 0.08,
  accordion: 0.25,
  tab: 0.2,
  hover: 0.4,
  tap: 0.12,
};

// Fire slightly before the section enters, so nothing pops after it is
// already on screen.
export const VIEWPORT = { once: true, margin: '-15%' };

// Paired columns in a SplitSection share these, so media and content read
// as one thing arriving rather than two.
export function revealVariants(reduced) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.15 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: DUR.reveal, ease: EASE_EXPO },
    },
  };
}
```

- [ ] **Step 2: Write the failing reduced-motion test**

`src/hooks/useReducedMotion.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import useReducedMotion from './useReducedMotion';

function mockMatchMedia(matches) {
  window.matchMedia = (query) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

function Probe() {
  return <span data-testid="reduced">{String(useReducedMotion())}</span>;
}

describe('useReducedMotion', () => {
  it('is false when the user has expressed no preference', () => {
    mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('is true when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test -- src/hooks/useReducedMotion.test.jsx`
Expected: FAIL — cannot resolve `./useReducedMotion`

- [ ] **Step 4: Implement the hook**

`src/hooks/useReducedMotion.js`:

```js
import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export default function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npm test -- src/hooks/useReducedMotion.test.jsx`
Expected: PASS, 2 tests

- [ ] **Step 6: Write the failing BlurFade test**

`src/components/ui/BlurFade.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlurFade from './BlurFade';

describe('BlurFade', () => {
  it('renders its children', () => {
    render(<BlurFade><p>Never flat</p></BlurFade>);
    expect(screen.getByText('Never flat')).toBeInTheDocument();
  });

  it('passes className through', () => {
    render(<BlurFade className="mt-4"><p>x</p></BlurFade>);
    expect(screen.getByTestId('blur-fade')).toHaveClass('mt-4');
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npm test -- src/components/ui/BlurFade.test.jsx`
Expected: FAIL — cannot resolve `./BlurFade`

- [ ] **Step 8: Implement BlurFade**

`src/components/ui/BlurFade.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { VIEWPORT, revealVariants } from '../../lib/motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export default function BlurFade({ children, delay = 0, className, ...props }) {
  const reduced = useReducedMotion();
  const variants = revealVariants(reduced);

  return (
    <motion.div
      data-testid="blur-fade"
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={variants}
      transition={{ delay: reduced ? 0 : delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npm test -- src/components/ui/BlurFade.test.jsx`
Expected: PASS, 2 tests

- [ ] **Step 10: Implement BoxReveal**

`src/components/ui/BoxReveal.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { EASE_EXPO, DUR, VIEWPORT } from '../../lib/motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

// An oxblood panel wipes off the media. One per section — used on every
// element it stops being punctuation and becomes wallpaper.
export default function BoxReveal({ children, direction = 'left', className }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={cn('relative overflow-hidden', className)}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: DUR.wipe, ease: EASE_EXPO }}
        style={{ transformOrigin: direction === 'left' ? 'right' : 'left' }}
        className="absolute inset-0 z-10 bg-oxblood pointer-events-none"
      />
    </div>
  );
}
```

- [ ] **Step 11: Implement ScrollProgress**

`src/components/ui/ScrollProgress.jsx`:

```jsx
import React from 'react';
import { motion, useScroll } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-oxblood z-[60] pointer-events-none"
    />
  );
}
```

- [ ] **Step 12: Mount ScrollProgress in the shell**

In `src/App.jsx`, add the import and render it directly after `<ScrollToTop />`:

```jsx
import ScrollProgress from './components/ui/ScrollProgress';
```

```jsx
      <ScrollToTop />
      <ScrollProgress />
```

- [ ] **Step 13: Add the global reduced-motion CSS fallback**

Append to `src/index.css`. This catches anything not driven by framer-motion — CSS transitions, the audio bar keyframes, hover scales.

```css
/* Reduced motion — global fallback for anything not gated by
   useReducedMotion. framer-motion components handle themselves. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Hover affordances must not fire on first tap. */
@media (hover: hover) and (pointer: fine) {
  .hover-lift {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-lift:hover {
    transform: scale(1.03);
  }
}
```

- [ ] **Step 14: Run the whole suite**

Run: `npm test`
Expected: PASS, all tests green

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: motion tokens, reduced-motion gating, BlurFade, BoxReveal, ScrollProgress"
```

---

## Task 7: `SplitSection` — the two-column primitive

**Files:**
- Create: `src/components/layout/SplitSection.jsx`, `src/components/layout/SplitSection.test.jsx`

**Interfaces:**
- Consumes: `BlurFade`, `BoxReveal`, `cn`, `useReducedMotion`
- Produces: `<SplitSection id tone="light"|"dark" media="left"|"right" mediaNode ratio="portrait"|"wide" className>{content}</SplitSection>`

- [ ] **Step 1: Write the failing test**

`src/components/layout/SplitSection.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SplitSection from './SplitSection';

const setup = (props = {}) =>
  render(
    <SplitSection
      id="probe"
      tone="light"
      media="left"
      mediaNode={<img alt="circuit" src="/x.png" />}
      {...props}
    >
      <h2>Heading</h2>
    </SplitSection>
  );

describe('SplitSection', () => {
  it('exposes its tone for the navbar observer', () => {
    setup();
    expect(screen.getByTestId('split-probe')).toHaveAttribute('data-tone', 'light');
  });

  it('carries its id as an anchor target', () => {
    setup();
    expect(screen.getByTestId('split-probe')).toHaveAttribute('id', 'probe');
  });

  it('puts media before content in DOM order, so it stacks on top on mobile', () => {
    setup();
    const root = screen.getByTestId('split-probe');
    const media = screen.getByTestId('split-media');
    const content = screen.getByTestId('split-content');
    const order = Array.from(root.querySelectorAll('[data-testid^="split-"]'));
    expect(order.indexOf(media)).toBeLessThan(order.indexOf(content));
  });

  it('orders media first on desktop when media is left', () => {
    setup({ media: 'left' });
    expect(screen.getByTestId('split-media')).toHaveClass('lg:order-1');
    expect(screen.getByTestId('split-content')).toHaveClass('lg:order-2');
  });

  it('orders media second on desktop when media is right', () => {
    setup({ media: 'right' });
    expect(screen.getByTestId('split-media')).toHaveClass('lg:order-2');
    expect(screen.getByTestId('split-content')).toHaveClass('lg:order-1');
  });

  it('caps the content measure', () => {
    setup();
    expect(screen.getByTestId('split-content')).toHaveClass('max-w-[62ch]');
  });

  it('renders without media', () => {
    render(
      <SplitSection id="noimg" tone="dark" media="left">
        <h2>Just words</h2>
      </SplitSection>
    );
    expect(screen.queryByTestId('split-media')).not.toBeInTheDocument();
    expect(screen.getByText('Just words')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/layout/SplitSection.test.jsx`
Expected: FAIL — cannot resolve `./SplitSection`

- [ ] **Step 3: Implement SplitSection**

`src/components/layout/SplitSection.jsx`:

```jsx
import React from 'react';
import BlurFade from '../ui/BlurFade';
import BoxReveal from '../ui/BoxReveal';
import { DUR } from '../../lib/motion';
import { cn } from '../../lib/utils';

const TONE = {
  light: 'bg-ivory text-dark',
  dark: 'bg-dark text-ivory',
};

const RATIO = {
  portrait: 'aspect-[4/5]',
  wide: 'aspect-[16/9]',
};

// The two-column primitive. Owns the ratio, gutter, alignment, stack order
// and reveal choreography for every split section on the site.
//
// Media is always first in DOM order so it stacks above its content on
// mobile — a heading landing under its own image reads as a caption.
// Desktop side is set with lg:order-*.
export default function SplitSection({
  id,
  tone = 'light',
  media = 'left',
  mediaNode,
  ratio = 'portrait',
  className,
  children,
}) {
  const mediaFirst = media === 'left';

  return (
    <section
      id={id}
      data-tone={tone}
      data-testid={`split-${id}`}
      className={cn('w-full py-[12vh] px-[6vw]', TONE[tone], className)}
    >
      <div
        className="max-w-[1440px] mx-auto grid grid-cols-1 items-center lg:grid-cols-[48fr_52fr]"
        style={{ gap: 'clamp(2.5rem, 5vw, 6rem)' }}
      >
        {mediaNode && (
          <div
            data-testid="split-media"
            className={cn('w-full', mediaFirst ? 'lg:order-1' : 'lg:order-2')}
          >
            <BoxReveal direction={media} className={cn('w-full', RATIO[ratio])}>
              {mediaNode}
            </BoxReveal>
          </div>
        )}

        <BlurFade
          delay={DUR.tap}
          data-testid="split-content"
          className={cn(
            'w-full max-w-[62ch]',
            mediaFirst ? 'lg:order-2' : 'lg:order-1',
            mediaNode ? '' : 'lg:col-span-2'
          )}
        >
          {children}
        </BlurFade>
      </div>
    </section>
  );
}
```

`delay={DUR.tap}` is the 120ms content offset. Media and content otherwise share duration and easing so the section arrives as one thing.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/components/layout/SplitSection.test.jsx`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SplitSection two-column primitive"
```

---

## Task 8: Layout order data — alternation made enforceable

Encoding the alternation in data rather than in fourteen hand-written props is what lets a test prove the build note "the alternation never breaks."

**Files:**
- Create: `src/data/layout.js`, `src/data/layout.test.js`

**Interfaces:**
- Produces: `SPLIT_ORDER: Array<{ id: string, media: 'left'|'right' }>` and `mediaSideFor(id): 'left'|'right'`

- [ ] **Step 1: Write the failing test**

`src/data/layout.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { SPLIT_ORDER, mediaSideFor } from './layout';

describe('SPLIT_ORDER', () => {
  it('never places two consecutive sections media on the same side', () => {
    for (let i = 1; i < SPLIT_ORDER.length; i += 1) {
      expect(
        SPLIT_ORDER[i].media,
        `${SPLIT_ORDER[i].id} repeats the side of ${SPLIT_ORDER[i - 1].id}`
      ).not.toBe(SPLIT_ORDER[i - 1].media);
    }
  });

  it('covers every split section in page order', () => {
    expect(SPLIT_ORDER.map((s) => s.id)).toEqual([
      'circuit', 'surfaces', 'on-your-own', 'with-people',
      'business', 'in-confidence',
      'hospitality-rooms', 'hospitality-clubhouse', 'hospitality-spa',
      'safety', 'location',
    ]);
  });

  it('resolves a side by id', () => {
    expect(mediaSideFor('circuit')).toBe('left');
    expect(mediaSideFor('surfaces')).toBe('right');
  });

  it('throws on an unknown id rather than silently defaulting', () => {
    expect(() => mediaSideFor('nope')).toThrow(/nope/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/data/layout.test.js`
Expected: FAIL — cannot resolve `./layout`

- [ ] **Step 3: Implement the layout data**

`src/data/layout.js`:

```js
// The media side for every two-column section, in page order.
//
// The alternation is the thing that stops eleven side-by-side sections
// reading as a spreadsheet. It is data rather than a per-section prop so
// that layout.test.js can prove it never breaks.
//
// §1 Hero, §2 Definition and §5 Fork are deliberately absent — they stay
// single-column. See the spec, Section 6.
export const SPLIT_ORDER = [
  { id: 'circuit',               media: 'left'  },
  { id: 'surfaces',              media: 'right' },
  { id: 'on-your-own',           media: 'left'  },
  { id: 'with-people',           media: 'right' },
  { id: 'business',              media: 'left'  },
  { id: 'in-confidence',         media: 'right' },
  { id: 'hospitality-rooms',     media: 'left'  },
  { id: 'hospitality-clubhouse', media: 'right' },
  { id: 'hospitality-spa',       media: 'left'  },
  { id: 'safety',                media: 'right' },
  { id: 'location',              media: 'left'  },
];

export function mediaSideFor(id) {
  const found = SPLIT_ORDER.find((s) => s.id === id);
  if (!found) throw new Error(`No media side defined for split section "${id}"`);
  return found.media;
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/data/layout.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: encode split-section alternation as testable data"
```

---

## Task 9: Image manifest and `ImageSlot`

**Files:**
- Create: `src/data/images.js`, `src/components/ui/ImageSlot.jsx`, `src/components/ui/ImageSlot.test.jsx`, `IMAGE-MANIFEST.md`

**Interfaces:**
- Produces: `IMAGES: Record<string, { src: string|null, alt: string, ratio: 'portrait'|'wide', brief: string }>` and `<ImageSlot slot="hospitality.rooms" className="" />`

- [ ] **Step 1: Write the failing test**

`src/components/ui/ImageSlot.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageSlot from './ImageSlot';

describe('ImageSlot', () => {
  it('renders an img when the slot has a file', () => {
    render(<ImageSlot slot="surfaces.circuit" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/assets/images/racetrack_drive.png');
    expect(img.getAttribute('alt')).not.toBe('');
  });

  it('renders a labelled placeholder when the slot has no file', () => {
    render(<ImageSlot slot="surfaces.skidPan" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('image-placeholder')).toHaveTextContent(/skid pan/i);
  });

  it('throws on an unknown slot rather than rendering nothing', () => {
    expect(() => render(<ImageSlot slot="nope.nope" />)).toThrow(/nope\.nope/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/ui/ImageSlot.test.jsx`
Expected: FAIL — cannot resolve `./ImageSlot`

- [ ] **Step 3: Create the manifest**

`src/data/images.js`:

```js
// Image slot manifest. `src: null` means the photograph has not been
// supplied yet; ImageSlot renders a labelled placeholder in its place so
// the layout is final before any photography arrives.
//
// Client-facing version of this list lives in IMAGE-MANIFEST.md.

export const IMAGES = {
  'hero.main': {
    src: null, ratio: 'wide',
    alt: 'The circuit from altitude at low sun',
    brief: 'Hero — circuit from altitude at low sun, or the clubhouse with the road behind it. Must show both halves of the offer.',
  },
  'surfaces.circuit': {
    src: '/assets/images/racetrack_drive.png', ratio: 'portrait',
    alt: 'The circuit, empty, from trackside',
    brief: 'The circuit and the strip.',
  },
  'surfaces.offRoad': {
    src: null, ratio: 'portrait',
    alt: 'The off-road and rock-crawl course',
    brief: 'Off-road and rock crawl — natural rock and elevation, a vehicle at an unlikely angle, low speed.',
  },
  'surfaces.skidPan': {
    src: null, ratio: 'portrait',
    alt: 'The skid pan',
    brief: 'Skid pan — a car mid-slide on a wet low-grip surface, ideally from above.',
  },
  'surfaces.kickPlate': {
    src: null, ratio: 'portrait',
    alt: 'The kick plate',
    brief: 'Kick plate — the moment the car is thrown sideways.',
  },
  'surfaces.wet': {
    src: null, ratio: 'portrait',
    alt: 'The wet handling track',
    brief: 'Wet handling track — standing water, spray, instruction under way.',
  },
  'onYourOwn.main': {
    src: '/assets/images/carousel_push.png', ratio: 'portrait',
    alt: 'A driver being instructed at the circuit',
    brief: 'A person, not only a car. First-timer receiving instruction.',
  },
  'withPeople.main': {
    src: '/assets/images/carousel_stay.png', ratio: 'portrait',
    alt: 'A group at the estate in the evening',
    brief: 'A group, cars parked, evening. Warmer than the On your own image.',
  },
  'business.main': {
    src: '/assets/images/clubhouse_architectural.png', ratio: 'portrait',
    alt: 'The paddock and garages set up for an event',
    brief: 'Paddock or garages during an event. Capability, not lifestyle.',
  },
  'inConfidence.main': {
    src: '/assets/images/final_road.png', ratio: 'portrait',
    alt: 'The empty circuit at first light',
    brief: 'An empty circuit at first light. No people, no cars. The quietest image on the site.',
  },
  'hospitality.rooms': {
    src: '/assets/images/stay_club.png', ratio: 'wide',
    alt: 'A room above the circuit',
    brief: 'One of the forty rooms, showing the aspect — mountains or road visible through the window.',
  },
  'hospitality.clubhouse': {
    src: '/assets/images/hotspot_pool.png', ratio: 'wide',
    alt: 'The pool looking out over the circuit',
    brief: 'The pool with the circuit visible beyond it. This single image carries the whole hospitality proposition.',
  },
  'hospitality.spa': {
    src: null, ratio: 'wide',
    alt: 'The spa treatment rooms',
    brief: 'Spa or gym. Calm, unpeopled, warm light.',
  },
  'safety.main': {
    src: null, ratio: 'portrait',
    alt: 'Marshals trackside',
    brief: 'Marshals or the medical facility. Understated and factual — reassurance, not drama.',
  },
  'location.map': {
    src: null, ratio: 'portrait',
    alt: 'Stylised map showing the estate relative to Bengaluru',
    brief: 'Stylised line map, oxblood on ivory. Not a screenshot of Google Maps.',
  },
};

export function imageSlot(key) {
  const found = IMAGES[key];
  if (!found) throw new Error(`Unknown image slot "${key}"`);
  return found;
}
```

- [ ] **Step 4: Implement ImageSlot**

`src/components/ui/ImageSlot.jsx`:

```jsx
import React from 'react';
import { imageSlot } from '../../data/images';
import { cn } from '../../lib/utils';

export default function ImageSlot({ slot, className }) {
  const { src, alt, brief } = imageSlot(slot);

  if (!src) {
    return (
      <div
        data-testid="image-placeholder"
        className={cn(
          'w-full h-full flex flex-col justify-end gap-2 p-6',
          'border border-current/15 bg-current/[0.04]',
          className
        )}
      >
        <span className="text-[0.6rem] tracking-[0.22em] uppercase opacity-40">Image pending</span>
        <span className="font-serif text-[1.15rem] font-light leading-tight opacity-70">{alt}</span>
        <span className="text-[0.7rem] font-light leading-snug opacity-40">{brief}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn('w-full h-full object-cover', className)}
    />
  );
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npm test -- src/components/ui/ImageSlot.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 6: Write the client-facing manifest**

`IMAGE-MANIFEST.md`:

```markdown
# Marque One — Photography Manifest

Drop files into `public/assets/images/` using the filename in the Save as
column, then set `src` for that slot in `src/data/images.js`.

Any slot still marked **Pending** renders an in-theme labelled placeholder,
so the site is complete and shippable at every stage.

| Section | Slot | Save as | Ratio | What it needs to show | Status |
|---|---|---|---|---|---|
| §1 Hero | `hero.main` | `home_hero.jpg` | 16:9 | Circuit from altitude at low sun, or the clubhouse with the road behind it. Must show both halves of the offer | **Pending** |
| §4 Surfaces | `surfaces.circuit` | — | 4:5 | The circuit and the strip | Supplied |
| §4 Surfaces | `surfaces.offRoad` | `surface_offroad.jpg` | 4:5 | Natural rock and elevation, a vehicle at an unlikely angle, low speed | **Pending** |
| §4 Surfaces | `surfaces.skidPan` | `surface_skidpan.jpg` | 4:5 | A car mid-slide on wet low-grip surface, ideally from above | **Pending** |
| §4 Surfaces | `surfaces.kickPlate` | `surface_kickplate.jpg` | 4:5 | The moment the car is thrown sideways | **Pending** |
| §4 Surfaces | `surfaces.wet` | `surface_wet.jpg` | 4:5 | Standing water, spray, instruction under way | **Pending** |
| §6 On your own | `onYourOwn.main` | — | 4:5 | A person, not only a car | Supplied |
| §7 With people | `withPeople.main` | — | 4:5 | A group, cars parked, evening | Supplied |
| §8 Business | `business.main` | — | 4:5 | Paddock or garages during an event | Supplied |
| §9 In confidence | `inConfidence.main` | — | 4:5 | Empty circuit at first light, no people | Supplied |
| §10 Hospitality | `hospitality.rooms` | — | 16:9 | A room showing its aspect through the window | Supplied |
| §10 Hospitality | `hospitality.clubhouse` | — | 16:9 | The pool with the circuit visible beyond | Supplied |
| §10 Hospitality | `hospitality.spa` | `hospitality_spa.jpg` | 16:9 | Spa or gym — calm, unpeopled, warm light | **Pending** |
| §11 Safety | `safety.main` | `safety_marshals.jpg` | 4:5 | Marshals or the medical facility. Factual, not dramatic | **Pending** |
| §12 Location | `location.map` | `location_map.svg` | 4:5 | Stylised line map, oxblood on ivory. **Not** a Google Maps screenshot | **Pending** |

## The one that matters most

`hospitality.clubhouse` — the pool with the circuit beyond it. §10 carries the
newest and least-proven part of the proposition. With a weak image the section
reads as a claim rather than as a place.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: image slot manifest with in-theme placeholders"
```

---

## Task 10: Homepage copy data

**Files:**
- Create: `src/data/home.js`, `src/data/home.test.js`

**Interfaces:**
- Produces: `HOME` — keyed by section: `hero`, `definition`, `circuit`, `surfaces`, `fork`, `onYourOwn`, `withPeople`, `business`, `inConfidence`, `hospitality`, `safety`, `location`, `questions`, `enquiry`

- [ ] **Step 1: Write the failing test**

`src/data/home.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { HOME } from './home';

const FORBIDDEN = ['5.5 km', '18 corners', '1.1 km', "India's longest", 'built to FIA standards'];

describe('HOME copy', () => {
  it('leads with the approved headline', () => {
    expect(HOME.hero.h1).toBe('219 acres. Drive all of it, or none of it.');
  });

  it('says out loud that no membership is needed', () => {
    expect(HOME.definition.body[1]).toContain('You do not need a membership');
    expect(HOME.onYourOwn.emphasis).toBe('No membership required. No competition licence. No race car.');
  });

  it('lists exactly five surfaces, matching its own header', () => {
    expect(HOME.surfaces.heading).toBe('Five ways to use the land');
    expect(HOME.surfaces.items).toHaveLength(5);
    expect(HOME.surfaces.items[0].title).toBe('The circuit and the strip');
  });

  it('offers exactly four doors in the fork', () => {
    expect(HOME.fork.items).toHaveLength(4);
  });

  it('splits hospitality into three rows for three photographs', () => {
    expect(HOME.hospitality.rows).toHaveLength(3);
  });

  it('publishes travel time and no conflicting kilometre figure', () => {
    const blob = JSON.stringify(HOME.location);
    expect(blob).toContain('Two hours by road');
    expect(blob).not.toMatch(/\d+\s?km/);
  });

  it('groups the questions into three', () => {
    expect(HOME.questions.groups.map((g) => g.title)).toEqual([
      'Coming to drive', 'Coming for the weekend', 'Business',
    ]);
  });

  it('offers three enquiry types', () => {
    expect(HOME.enquiry.types).toEqual(['Drive', 'Stay', 'Business']);
  });

  it('contains no rejected or superseded claim', () => {
    const blob = JSON.stringify(HOME);
    FORBIDDEN.forEach((bad) => expect(blob).not.toContain(bad));
  });

  it('keeps every prose block to four lines or fewer', () => {
    const blob = JSON.stringify(HOME);
    const overlong = (blob.match(/[^"]{460,}/g) || []).length;
    expect(overlong).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/data/home.test.js`
Expected: FAIL — cannot resolve `./home`

- [ ] **Step 3: Implement the copy file**

`src/data/home.js`. Copy verbatim from the spec, Section 7.

```js
import { CIRCUIT } from './circuit';

export const HOME = {
  hero: {
    overline: 'MARQUE ONE MOTOR CLUB',
    h1: '219 acres. Drive all of it, or none of it.',
    sub: 'A motorsport estate two hours from Bengaluru. Open to drivers, to groups, to business — and to anyone who simply wants the weekend.',
    ctas: [
      { label: 'Plan a visit', to: '/contact', variant: 'default' },
      { label: 'For business', to: '/contact', variant: 'ghost' },
    ],
  },

  definition: {
    heading: 'What this is',
    body: [
      'A motorsport estate across 219 acres — a circuit, a drag strip, an off-road course, a skid pan, a wet handling track, and a clubhouse built to make a weekend of it.',
      'You do not need a membership, a licence or a fast car. You need a day, and something you want to do with it.',
      'Members hold standing access. Everyone else books.',
    ],
  },

  circuit: {
    heading: 'The circuit',
    figures: CIRCUIT.figures,
    body: [CIRCUIT.elevationProse, CIRCUIT.stripProse, CIRCUIT.gradeProse],
  },

  surfaces: {
    heading: 'Five ways to use the land',
    items: [
      { title: 'The circuit and the strip', slot: 'surfaces.circuit',
        body: 'No traffic, no oncoming, no speed limit. Standing start, timed to the thousandth.' },
      { title: 'Off-road and rock crawl', slot: 'surfaces.offRoad',
        body: 'A course cut through natural rock and elevation. Low range, low speed, no margin.' },
      { title: 'Skid pan', slot: 'surfaces.skidPan',
        body: 'A deliberately low-grip surface. Where the limit of the car reveals itself at a speed that cannot punish you for finding it.' },
      { title: 'Kick plate', slot: 'surfaces.kickPlate',
        body: 'A plate that throws the car sideways without warning. First you learn to catch it. Then you learn to catch it every time.' },
      { title: 'Wet handling track', slot: 'surfaces.wet',
        body: 'The same instruction, under water.' },
    ],
  },

  fork: {
    heading: 'Who comes here',
    items: [
      { title: 'On your own',  body: 'Your car, the circuit, and someone to teach you how to use it.', href: '#on-your-own' },
      { title: 'With people',  body: 'A weekend for a group, with the site closed behind you.',        href: '#with-people' },
      { title: 'For business', body: 'Events, launches, hospitality, and days built with us.',         href: '#business' },
      { title: 'In confidence',body: 'Manufacturer testing, sole use, gate shut.',                     href: '#in-confidence' },
    ],
  },

  onYourOwn: {
    heading: 'On your own',
    slot: 'onYourOwn.main',
    blocks: [
      { title: 'First time',  body: 'Most people who drive here have never been on a circuit. That is the ordinary case, not the exception. You bring a road-legal car and a driving licence. Everything else is taught on the day.' },
      { title: 'Instruction', body: 'A motorsport academy on the estate. Most drivers who arrive wanting to be quick discover they were never taught how — a fault that answers to a weekend.' },
      { title: 'Storage',     body: 'Secure, temperature-controlled storage on site. The car waits where the road is.' },
    ],
    emphasis: 'No membership required. No competition licence. No race car.',
  },

  withPeople: {
    heading: 'With people',
    slot: 'withPeople.main',
    blocks: [
      { title: 'The weekend',            body: 'Arrive Friday. Drive Saturday and Sunday. Sleep twenty minutes from the car rather than two hours.' },
      { title: 'Your group, your circuit', body: 'Take the road for the day with the garages, the marshals and the gate closed behind you. Car clubs, birthdays, reunions, anything that improves for being held somewhere nobody else can reach.' },
      { title: 'Not everyone drives',    body: 'Some of the party will want the pool and the table instead. That is a complete visit here, not a consolation.' },
    ],
  },

  business: {
    heading: 'Business',
    slot: 'business.main',
    intro: 'The estate takes bookings, hosts events, and builds programmes with partners who bring their own idea of what to do with a circuit.',
    blocks: [
      { title: 'Events and race meetings',      body: 'The circuit, the paddock and the estate for a competitive weekend, a series round, a club meeting or a format that does not exist yet. Bring the event. We have the ground.' },
      { title: 'Launches and press',            body: 'Elevation, surface and straight enough to make the numbers real, with garages and hospitality for a journalist group. Marque One works in partnership with Autocar India.' },
      { title: 'Corporate and dealer programmes', body: 'Customer drive days, product launches, dealer training and incentive weekends, with rooms and dining on site so the programme need not break for the night.' },
      { title: 'Team testing',                  body: 'Full circuit access, pit lane and garages, on an FIA-graded layout.' },
    ],
  },

  inConfidence: {
    heading: 'In confidence',
    slot: 'inConfidence.main',
    blocks: [
      { title: 'Sole use',           body: 'The estate takes one client at a time. For the duration of the booking there is no second party on site, and no public gate to close because there is not one.' },
      { title: 'What is available',  body: 'Circuit, strip, off-road and rock-crawl course, skid pan and wet handling track, in any combination a programme requires. Trackside timing and electronics throughout. Pit garages, workshop space and race control.' },
      { title: 'Distance',           body: 'Two hours from an international airport, and far enough from everything else that nobody arrives by accident.' },
    ],
  },

  hospitality: {
    heading: 'Around the road',
    rows: [
      { id: 'hospitality-rooms',     slot: 'hospitality.rooms',     title: 'Forty rooms',
        body: 'Forty rooms above the circuit, each one different, each one facing either the mountains or the road.' },
      { id: 'hospitality-clubhouse', slot: 'hospitality.clubhouse', title: 'The clubhouse',
        body: 'A pool that looks out over the circuit. Dining that runs long. Somewhere to sit and watch the road without standing beside it.' },
      { id: 'hospitality-spa',       slot: 'hospitality.spa',       title: 'Spa and gym',
        body: 'Treatment rooms, and a gym that keeps its hours whether or not anyone is driving.' },
    ],
    close: {
      title: 'Coming for the weekend, not the lap',
      body: 'Guests who never sit in a car have a full weekend here. The circuit is the reason the place exists. It is not the only reason to arrive.',
    },
  },

  safety: {
    heading: 'Safety',
    slot: 'safety.main',
    body: [
      'Race-grade asphalt run-off, permanent barriers and marshalled sessions throughout.',
      'A medical facility operates on the estate, with trained staff on site whenever the circuit is live.',
    ],
  },

  location: {
    heading: 'Getting here',
    slot: 'location.map',
    body: [
      'Two hours by road from Kempegowda International Airport, Bengaluru.',
      'Far enough from a city to be quiet. Close enough to reach before noon.',
    ],
  },

  questions: {
    heading: 'Questions',
    groups: [
      {
        title: 'Coming to drive',
        items: [
          { q: 'Do I need to be a member?',        a: 'No. Members hold standing access; everyone else books a day.' },
          { q: 'Do I need racing experience?',     a: 'No. Most people who drive here have never been on a circuit.' },
          { q: 'Do I need a competition licence?', a: 'No. A valid driving licence is enough.' },
          { q: 'What car do I need?',              a: 'A road-legal car in sound mechanical condition. Not a fast one — a normal car driven properly teaches more than a fast car driven badly.' },
          { q: 'Is instruction available?',        a: 'There is a motorsport academy on the estate.' },
          { q: 'How long is the circuit?',         a: CIRCUIT.faqLength },
          { q: 'What else is there besides the circuit?', a: CIRCUIT.faqSurfaces },
          { q: 'Can I keep my car here?',          a: 'Secure, temperature-controlled storage is on site.' },
          { q: 'Is there medical cover?',          a: 'A medical facility operates on the estate, staffed whenever the circuit is live.' },
        ],
      },
      {
        title: 'Coming for the weekend',
        items: [
          { q: 'Can I come without driving?',        a: 'Yes. Rooms, pool, spa, gym and dining make a full weekend on their own.' },
          { q: "Can I bring people who don't drive?", a: 'Yes. It is a complete visit for them, not a wait.' },
          { q: 'Can I stay overnight?',              a: 'Forty rooms on the estate, above the circuit.' },
          { q: 'Is there somewhere to watch?',       a: 'Viewing from the clubhouse and the pool, across the circuit.' },
        ],
      },
      {
        title: 'Business',
        items: [
          { q: 'Can we hold an event here?',            a: 'Yes — race meetings, launches, corporate programmes and formats built with us.' },
          { q: 'Can the site be taken privately?',      a: 'Yes. Sole use means one client on the estate for the duration.' },
          { q: 'What is available for testing?',        a: 'Circuit, strip, off-road course, skid pan and wet handling track, with trackside timing and electronics.' },
          { q: 'Are there garages and workshop space?', a: 'Pit garages, workshop space and race control are on site.' },
          { q: 'Can a programme run across several days?', a: 'Rooms and dining are on the estate.' },
        ],
      },
    ],
  },

  enquiry: {
    heading: 'Come and see it.',
    sub: 'Tell us what you intend to do. We will tell you how it works.',
    types: ['Drive', 'Stay', 'Business'],
    email: 'project.motorclub@marque.one',
    fields: {
      Drive:    [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'phone', label: 'Phone', type: 'tel', required: true }, { name: 'car', label: 'What you drive', type: 'text' }, { name: 'notes', label: 'What you have in mind', type: 'textarea' }],
      Stay:     [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'phone', label: 'Phone', type: 'tel', required: true }, { name: 'party', label: 'How many of you', type: 'text' }, { name: 'notes', label: 'What you have in mind', type: 'textarea' }],
      Business: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'phone', label: 'Phone', type: 'tel', required: true }, { name: 'company', label: 'Company', type: 'text' }, { name: 'notes', label: 'What you have in mind', type: 'textarea' }],
    },
  },
};
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/data/home.test.js`
Expected: PASS, 10 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add homepage copy as data"
```

---

## Task 11: shadcn primitives — Accordion and Tabs

**Files:**
- Create: `components.json`, `src/components/ui/accordion.jsx`, `src/components/ui/tabs.jsx`, `src/components/ui/accordion.test.jsx`
- Modify: `tailwind.config.js`

**Interfaces:**
- Produces: `Accordion, AccordionItem, AccordionTrigger, AccordionContent`; `Tabs, TabsList, TabsTrigger, TabsContent`

- [ ] **Step 1: Install Radix primitives**

```bash
npm i @radix-ui/react-accordion @radix-ui/react-tabs
```

- [ ] **Step 2: Add components.json so future shadcn adds land correctly**

`components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": false
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

- [ ] **Step 3: Add the accordion keyframes to tailwind**

In `tailwind.config.js`, inside `theme.extend`, add:

```js
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
```

- [ ] **Step 4: Write the failing accordion test**

`src/components/ui/accordion.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

const setup = () =>
  render(
    <Accordion type="single" collapsible>
      <AccordionItem value="q1">
        <AccordionTrigger>Do I need to be a member?</AccordionTrigger>
        <AccordionContent>No. Members hold standing access.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

describe('Accordion', () => {
  it('is closed by default', () => {
    setup();
    expect(screen.queryByText(/standing access/)).not.toBeInTheDocument();
  });

  it('opens on click', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /member/i }));
    expect(screen.getByText(/standing access/)).toBeVisible();
  });

  it('exposes expanded state to assistive tech', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', { name: /member/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `npm test -- src/components/ui/accordion.test.jsx`
Expected: FAIL — cannot resolve `./accordion`

- [ ] **Step 6: Implement the accordion**

`src/components/ui/accordion.jsx`:

```jsx
import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b border-current/10', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between gap-4 py-5 text-left',
        'font-sans text-[0.95rem] font-light tracking-wide',
        'transition-opacity duration-300 hover:opacity-60',
        '[&[data-state=open]>svg]:rotate-45',
        className
      )}
      {...props}
    >
      {children}
      <Plus size={16} className="shrink-0 opacity-40 transition-transform duration-250 ease-out" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-6 pr-8 text-[0.9rem] font-light leading-relaxed opacity-70', className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

- [ ] **Step 7: Run it and confirm it passes**

Run: `npm test -- src/components/ui/accordion.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 8: Implement the tabs**

`src/components/ui/tabs.jsx`:

```jsx
import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('inline-flex items-center gap-2', className)} {...props} />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'px-6 py-2.5 border font-sans text-[0.75rem] tracking-widest uppercase',
      'transition-colors duration-200 ease-out',
      'border-ivory/30 text-ivory/60 hover:text-ivory',
      'data-[state=active]:bg-ivory data-[state=active]:text-dark data-[state=active]:border-ivory',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-8 focus-visible:outline-none', 'animate-in fade-in duration-200', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

Remove the `animate-in fade-in duration-200` classes if `tailwindcss-animate` is not installed — the cross-fade is optional and Radix mounts the panel either way.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Radix accordion and tabs styled to the house system"
```

---

## Task 12: `§1` Hero and `§2` Definition

**Files:**
- Create: `src/components/ui/TextReveal.jsx`, `src/components/home/HomeHero.jsx`, `src/components/home/Definition.jsx`, `src/components/home/Definition.test.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `HOME`, `BlurFade`, `ImageSlot`, `LiquidButton`
- Produces: `<HomeHero />`, `<Definition />`, `<TextReveal text="" className="" />`

- [ ] **Step 1: Implement TextReveal**

§2 gives up its image, so it gets the page's one distinctive type treatment instead.

`src/components/ui/TextReveal.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { EASE_EXPO, VIEWPORT } from '../../lib/motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export default function TextReveal({ text, className }) {
  const reduced = useReducedMotion();

  if (reduced) return <p className={cn(className)}>{text}</p>;

  return (
    <motion.p
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ show: { transition: { staggerChildren: 0.022 } } }}
    >
      {text.split(' ').map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          variants={{
            hidden: { opacity: 0.15 },
            show: { opacity: 1, transition: { duration: 0.5, ease: EASE_EXPO } },
          }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.p>
  );
}
```

- [ ] **Step 2: Implement HomeHero**

`src/components/home/HomeHero.jsx`:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { HOME } from '../../data/home';
import { imageSlot } from '../../data/images';
import BlurFade from '../ui/BlurFade';
import LiquidButton from '../ui/LiquidButton';

export default function HomeHero() {
  const { overline, h1, sub, ctas } = HOME.hero;
  const hero = imageSlot('hero.main');

  return (
    <section
      id="hero"
      data-tone="dark"
      className="relative w-full h-[100svh] min-h-[600px] flex items-end overflow-hidden bg-dark"
    >
      <div className="absolute inset-0 z-0">
        {hero.src ? (
          <img src={hero.src} alt={hero.alt} className="w-full h-full object-cover" />
        ) : (
          <video src="/hero.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-[6vw] pb-[10vh] max-w-[1440px] mx-auto">
        <BlurFade>
          <span className="block text-[0.7rem] tracking-widest uppercase text-ivory/60 mb-4">
            {overline}
          </span>
          <h1 className="font-serif text-[clamp(2.6rem,7vw,6.5rem)] font-light leading-[0.98] tracking-tight max-w-[16ch]">
            {h1}
          </h1>
          <p className="font-sans text-[clamp(0.95rem,1.4vw,1.15rem)] font-light text-ivory/70 mt-6 max-w-[52ch] leading-relaxed">
            {sub}
          </p>
        </BlurFade>

        <BlurFade delay={0.12} className="flex flex-wrap gap-4 mt-10">
          {ctas.map(({ label, to, variant }) => (
            <Link key={label} to={to}>
              <LiquidButton variant={variant} size="lg">{label}</LiquidButton>
            </Link>
          ))}
        </BlurFade>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write the failing Definition test**

`src/components/home/Definition.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Definition from './Definition';

describe('Definition', () => {
  it('states the category and removes the membership assumption', () => {
    render(<Definition />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What this is');
    expect(screen.getByText(/You do not need a membership/)).toBeInTheDocument();
    expect(screen.getByText(/Everyone else books/)).toBeInTheDocument();
  });

  it('declares itself a light section', () => {
    render(<Definition />);
    expect(screen.getByTestId('section-definition')).toHaveAttribute('data-tone', 'light');
  });

  it('stays single column — no media', () => {
    render(<Definition />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm test -- src/components/home/Definition.test.jsx`
Expected: FAIL — cannot resolve `./Definition`

- [ ] **Step 5: Implement Definition**

`src/components/home/Definition.jsx`:

```jsx
import React from 'react';
import { HOME } from '../../data/home';
import BlurFade from '../ui/BlurFade';
import TextReveal from '../ui/TextReveal';

// Deliberately single-column. The deck calls this "the page pausing to
// state itself" — it works because it is the one moment the page stops
// showing and just speaks. See the spec, Section 6.
export default function Definition() {
  const { heading, body } = HOME.definition;

  return (
    <section
      id="definition"
      data-tone="light"
      data-testid="section-definition"
      className="w-full bg-ivory text-dark py-[16vh] px-[6vw]"
    >
      <div className="max-w-[60ch] mx-auto text-center">
        <BlurFade>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-10">
            {heading}
          </h2>
        </BlurFade>

        {body.map((para, i) => (
          <TextReveal
            key={i}
            text={para}
            className="font-sans text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-relaxed mb-6 last:mb-0"
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Wire both into Home.jsx**

`src/pages/Home.jsx`:

```jsx
import React from 'react';
import HomeHero from '../components/home/HomeHero';
import Definition from '../components/home/Definition';

export default function Home() {
  return (
    <div data-testid="page-home">
      <HomeHero />
      <Definition />
    </div>
  );
}
```

- [ ] **Step 7: Run the tests**

Run: `npm test -- src/components/home/Definition.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 8: Look at it**

Run: `npm run dev`, open `/`
Expected: hero video with the new headline, then an ivory centred column whose words lift from 15% to full opacity as it scrolls in. Navbar flips from ivory type to dark type as the Definition section reaches the top.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add homepage hero and definition sections"
```

---

## Task 13: `§3` Circuit and `§4` Surfaces

**Files:**
- Create: `src/components/ui/StickyScrollReveal.jsx`, `src/components/home/Circuit.jsx`, `src/components/home/Circuit.test.jsx`, `src/components/home/Surfaces.jsx`, `src/components/home/Surfaces.test.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `SplitSection`, `mediaSideFor`, `HOME`, `CIRCUIT`, `NumberTicker`, `ImageSlot`
- Produces: `<Circuit />`, `<Surfaces />`, `<StickyScrollReveal items={[{ id, slot }]} renderItem={(item, i) => node} />`

- [ ] **Step 1: Write the failing Circuit test**

`src/components/home/Circuit.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Circuit from './Circuit';

describe('Circuit', () => {
  it('publishes the four approved figures', () => {
    render(<Circuit />);
    ['3.2 km', '800 m', '±25 m', '230 km/h'].forEach((v) =>
      expect(screen.getByText(v)).toBeInTheDocument()
    );
  });

  it('publishes no corner count', () => {
    const { container } = render(<Circuit />);
    expect(container.textContent).not.toMatch(/\d+\s*corners/i);
  });

  it('says FIA-graded', () => {
    const { container } = render(<Circuit />);
    expect(container.textContent).toContain('FIA-graded');
    expect(container.textContent).not.toContain('built to FIA standards');
  });

  it('takes its media side from the alternation data', () => {
    render(<Circuit />);
    expect(screen.getByTestId('split-media')).toHaveClass('lg:order-1');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/home/Circuit.test.jsx`
Expected: FAIL — cannot resolve `./Circuit`

- [ ] **Step 3: Implement Circuit**

`src/components/home/Circuit.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import NumberTicker from '../ui/NumberTicker';
import ImageSlot from '../ui/ImageSlot';

// Figures stay live text, never images. The numeric part animates; the
// sign and unit do not, because "±25 m" is not a number.
//
// NumberTicker writes its value with ref.current.textContent, so its span
// is EMPTY until the framer-motion spring emits. That makes it invisible
// to assistive tech and untestable in jsdom. So the animated version is
// aria-hidden decoration, and the true value is always in the DOM in a
// screen-reader-only span alongside it.
function Figure({ value, label }) {
  const match = value.match(/^(±?)([\d.]+)(.*)$/);

  return (
    <div className="flex flex-col gap-1">
      <span className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-none text-oxblood">
        {match ? (
          <>
            <span aria-hidden="true">
              {match[1]}
              <NumberTicker
                value={parseFloat(match[2])}
                decimalPlaces={match[2].includes('.') ? 1 : 0}
              />
              {match[3]}
            </span>
            <span className="sr-only">{value}</span>
          </>
        ) : (
          value
        )}
      </span>
      <span className="text-[0.6rem] tracking-[0.22em] uppercase opacity-50">{label}</span>
    </div>
  );
}

export default function Circuit() {
  const { heading, figures, body } = HOME.circuit;

  return (
    <SplitSection
      id="circuit"
      tone="light"
      media={mediaSideFor('circuit')}
      mediaNode={<ImageSlot slot="surfaces.circuit" />}
    >
      <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-8">
        {heading}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10 pb-10 border-b border-current/10">
        {figures.map((f) => <Figure key={f.label} {...f} />)}
      </div>

      {body.map((para, i) => (
        <p key={i} className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75 mb-5 last:mb-0">
          {para}
        </p>
      ))}
    </SplitSection>
  );
}
```

`NumberTicker` accepts `{ value, direction, delay, className, decimalPlaces }` — verified against the existing component. The `sr-only` twin is what makes `getByText('3.2 km')` in Step 1's test resolve; without it the assertion fails, because in jsdom the spring never emits and the ticker's span stays empty.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/components/home/Circuit.test.jsx`
Expected: PASS, 4 tests

- [ ] **Step 5: Implement StickyScrollReveal**

`src/components/ui/StickyScrollReveal.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_EXPO, DUR } from '../../lib/motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import ImageSlot from './ImageSlot';
import { cn } from '../../lib/utils';

// Media column pins while the items scroll past, swapping to the image of
// whichever item is currently in range. Degrades to a plain stacked list
// under reduced motion and below lg.
export default function StickyScrollReveal({ items, renderItem, mediaSide = 'right', className }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const refs = useRef([]);

  useEffect(() => {
    if (reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = refs.current.indexOf(entry.target);
            if (i >= 0) setActive(i);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    refs.current.filter(Boolean).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduced, items.length]);

  if (reduced) {
    return (
      <div className={cn('flex flex-col gap-16', className)}>
        {items.map((item, i) => (
          <div key={item.id}>
            <div className="aspect-[4/5] w-full mb-6 overflow-hidden">
              <ImageSlot slot={item.slot} />
            </div>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('grid grid-cols-1 lg:grid-cols-[48fr_52fr]', className)}
      style={{ gap: 'clamp(2.5rem, 5vw, 6rem)' }}
    >
      {/* Carries data-testid="split-media" and the same lg:order-* classes as
          SplitSection so that Home.test.jsx's alternation check sees this
          section too. Without it the page reads as circuit(left) followed by
          on-your-own(left) and the test fails on a correct page. */}
      <div
        data-testid="split-media"
        className={cn('hidden lg:block', mediaSide === 'right' ? 'lg:order-2' : 'lg:order-1')}
      >
        <div className="sticky top-[120px] aspect-[4/5] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={items[active].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.hover, ease: EASE_EXPO }}
              className="w-full h-full"
            >
              <ImageSlot slot={items[active].slot} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className={cn('flex flex-col', mediaSide === 'right' ? 'lg:order-1' : 'lg:order-2')}>
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => { refs.current[i] = el; }}
            className="py-[8vh] first:pt-0 last:pb-0"
          >
            <div className="lg:hidden aspect-[4/5] w-full mb-6 overflow-hidden">
              <ImageSlot slot={item.slot} />
            </div>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write the failing Surfaces test**

`src/components/home/Surfaces.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Surfaces from './Surfaces';
import { HOME } from '../../data/home';

describe('Surfaces', () => {
  it('renders a card for every surface', () => {
    render(<Surfaces />);
    HOME.surfaces.items.forEach(({ title }) =>
      expect(screen.getByText(title)).toBeInTheDocument()
    );
  });

  it('has a header whose count matches its list', () => {
    render(<Surfaces />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Five ways to use the land');
    expect(HOME.surfaces.items).toHaveLength(5);
  });

  it('folds the strip into the circuit card rather than listing it separately', () => {
    render(<Surfaces />);
    expect(screen.getByText('The circuit and the strip')).toBeInTheDocument();
    expect(screen.queryByText(/^Drag strip$/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npm test -- src/components/home/Surfaces.test.jsx`
Expected: FAIL — cannot resolve `./Surfaces`

- [ ] **Step 8: Implement Surfaces**

`src/components/home/Surfaces.jsx`:

```jsx
import React from 'react';
import { HOME } from '../../data/home';
import { mediaSideFor } from '../../data/layout';
import StickyScrollReveal from '../ui/StickyScrollReveal';
import BlurFade from '../ui/BlurFade';

export default function Surfaces() {
  const { heading, items } = HOME.surfaces;
  const withIds = items.map((item, i) => ({ ...item, id: `surface-${i}` }));

  return (
    <section
      id="surfaces"
      data-tone="light"
      data-testid="section-surfaces"
      className="w-full bg-ivory text-dark py-[12vh] px-[6vw]"
    >
      <div className="max-w-[1440px] mx-auto">
        <BlurFade>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-[8vh]">
            {heading}
          </h2>
        </BlurFade>

        <StickyScrollReveal
          items={withIds}
          mediaSide={mediaSideFor('surfaces')}
          renderItem={(item) => (
            <>
              <h3 className="font-serif text-[clamp(1.5rem,2.6vw,2.2rem)] font-light mb-3">
                {item.title}
              </h3>
              <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-70 max-w-[52ch]">
                {item.body}
              </p>
            </>
          )}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npm test -- src/components/home/Surfaces.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 10: Add both to Home.jsx**

In `src/pages/Home.jsx`, import and render `<Circuit />` and `<Surfaces />` after `<Definition />`.

- [ ] **Step 11: Look at it, including at a short viewport**

Run: `npm run dev`
Expected: Circuit is two-column with media left and four oxblood figures counting up. Surfaces pins its image on the right and swaps as each surface scrolls past. **Resize the window to 700px tall and check the pinned image is not taller than the viewport** — pinning misbehaves when the sticky element exceeds window height.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add circuit and surfaces sections with sticky media"
```

---

## Task 14: `§5` Fork, `§6` On your own, `§7` With people

**Files:**
- Create: `src/components/home/Fork.jsx`, `src/components/home/OnYourOwn.jsx`, `src/components/home/WithPeople.jsx`, `src/components/home/OnYourOwn.test.jsx`, `src/components/home/Fork.test.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `SplitSection`, `mediaSideFor`, `HOME`, `BlurFade`, `ImageSlot`
- Produces: `<Fork />`, `<OnYourOwn />`, `<WithPeople />`

- [ ] **Step 1: Write the failing Fork test**

`src/components/home/Fork.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Fork from './Fork';

describe('Fork', () => {
  it('offers four doors', () => {
    render(<Fork />);
    ['On your own', 'With people', 'For business', 'In confidence'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
  });

  it('gives every panel identical classes, so none reads as primary', () => {
    render(<Fork />);
    const panels = screen.getAllByTestId('fork-panel');
    expect(panels).toHaveLength(4);
    const classes = new Set(panels.map((p) => p.className));
    expect(classes.size).toBe(1);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/home/Fork.test.jsx`
Expected: FAIL — cannot resolve `./Fork`

- [ ] **Step 3: Implement Fork**

`src/components/home/Fork.jsx`:

```jsx
import React from 'react';
import { HOME } from '../../data/home';
import BlurFade from '../ui/BlurFade';
import { DUR } from '../../lib/motion';

// Four equal doors. Deliberately NOT a SplitSection — two columns would
// imply a hierarchy among the four audiences, which is the exact thing
// this section exists to avoid. See the spec, Section 6.
export default function Fork() {
  const { heading, items } = HOME.fork;

  return (
    <section
      id="fork"
      data-tone="light"
      data-testid="section-fork"
      className="w-full bg-ivory text-dark py-[12vh] px-[6vw]"
    >
      <div className="max-w-[1440px] mx-auto">
        <BlurFade>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-[6vh]">
            {heading}
          </h2>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-current/10">
          {items.map(({ title, body, href }, i) => (
            <BlurFade key={title} delay={i * DUR.stagger}>
              <a
                href={href}
                data-testid="fork-panel"
                className="group flex flex-col justify-between gap-8 bg-ivory p-[clamp(1.75rem,3vw,2.75rem)] min-h-[clamp(200px,22vw,280px)] h-full transition-colors duration-300 hover:bg-ivory-darker"
              >
                <div>
                  <h3 className="font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] font-light mb-3">{title}</h3>
                  <p className="font-sans text-[0.92rem] font-light leading-relaxed opacity-65 max-w-[36ch]">{body}</p>
                </div>
                <span className="text-oxblood text-[0.9rem] transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/components/home/Fork.test.jsx`
Expected: PASS, 2 tests

- [ ] **Step 5: Write the failing OnYourOwn test**

`src/components/home/OnYourOwn.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnYourOwn from './OnYourOwn';

describe('OnYourOwn', () => {
  it('renders its three blocks', () => {
    render(<OnYourOwn />);
    ['First time', 'Instruction', 'Storage'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
  });

  it('gives the three-negatives line its own emphasis and does not bury it', () => {
    render(<OnYourOwn />);
    const line = screen.getByTestId('no-barriers');
    expect(line).toHaveTextContent('No membership required. No competition licence. No race car.');
    expect(line.className).toMatch(/font-serif/);
  });

  it('places media left, per the alternation', () => {
    render(<OnYourOwn />);
    expect(screen.getByTestId('split-media')).toHaveClass('lg:order-1');
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npm test -- src/components/home/OnYourOwn.test.jsx`
Expected: FAIL — cannot resolve `./OnYourOwn`

- [ ] **Step 7: Implement OnYourOwn**

`src/components/home/OnYourOwn.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

export default function OnYourOwn() {
  const { heading, slot, blocks, emphasis } = HOME.onYourOwn;

  return (
    <SplitSection
      id="on-your-own"
      tone="light"
      media={mediaSideFor('on-your-own')}
      mediaNode={<ImageSlot slot={slot} />}
    >
      <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-8">
        {heading}
      </h2>

      {blocks.map(({ title, body }) => (
        <div key={title} className="mb-8 last:mb-0">
          <h3 className="text-[0.65rem] tracking-[0.22em] uppercase opacity-50 mb-2">{title}</h3>
          <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-80">{body}</p>
        </div>
      ))}

      {/* The most important sentence in the section — it removes the three
          assumptions that stop people enquiring. Must not be buried. */}
      <p
        data-testid="no-barriers"
        className="font-serif text-[clamp(1.2rem,2vw,1.6rem)] font-light leading-snug text-oxblood mt-10 pt-8 border-t border-current/10"
      >
        {emphasis}
      </p>
    </SplitSection>
  );
}
```

- [ ] **Step 8: Run it and confirm it passes**

Run: `npm test -- src/components/home/OnYourOwn.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 9: Implement WithPeople**

`src/components/home/WithPeople.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

export default function WithPeople() {
  const { heading, slot, blocks } = HOME.withPeople;

  return (
    <SplitSection
      id="with-people"
      tone="light"
      media={mediaSideFor('with-people')}
      mediaNode={<ImageSlot slot={slot} />}
    >
      <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-8">
        {heading}
      </h2>

      {blocks.map(({ title, body }) => (
        <div key={title} className="mb-8 last:mb-0">
          <h3 className="text-[0.65rem] tracking-[0.22em] uppercase opacity-50 mb-2">{title}</h3>
          <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-80">{body}</p>
        </div>
      ))}
    </SplitSection>
  );
}
```

- [ ] **Step 10: Add all three to Home.jsx and check the zigzag**

Render `<Fork />`, `<OnYourOwn />`, `<WithPeople />` after `<Surfaces />`.

Run: `npm run dev`
Expected: scrolling §3 → §7, the images land left, right, left, right. If two land on the same side, `src/data/layout.js` is wrong and `layout.test.js` should have caught it.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add fork, on-your-own and with-people sections"
```

---

## Task 15: `§8` Business, `§9` In confidence, `§10` Hospitality

**Files:**
- Create: `src/components/home/Business.jsx`, `src/components/home/InConfidence.jsx`, `src/components/home/Hospitality.jsx`, `src/components/home/Hospitality.test.jsx`, `src/components/home/Business.test.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `SplitSection`, `mediaSideFor`, `HOME`, `ImageSlot`, `BlurFade`
- Produces: `<Business />`, `<InConfidence />`, `<Hospitality />`

- [ ] **Step 1: Write the failing Business test**

`src/components/home/Business.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Business from './Business';
import InConfidence from './InConfidence';

describe('the dark beat', () => {
  it('Business declares itself dark', () => {
    render(<Business />);
    expect(screen.getByTestId('split-business')).toHaveAttribute('data-tone', 'dark');
  });

  it('In confidence declares itself dark', () => {
    render(<InConfidence />);
    expect(screen.getByTestId('split-in-confidence')).toHaveAttribute('data-tone', 'dark');
  });

  it('keeps testing and confidential work in separate sections', () => {
    const { container } = render(<Business />);
    expect(container.textContent).not.toContain('Sole use');
  });

  it('says FIA-graded layout, not built to FIA standards', () => {
    const { container } = render(<Business />);
    expect(container.textContent).toContain('FIA-graded layout');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/components/home/Business.test.jsx`
Expected: FAIL — cannot resolve `./Business`

- [ ] **Step 3: Implement Business**

`src/components/home/Business.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

export default function Business() {
  const { heading, slot, intro, blocks } = HOME.business;

  return (
    <SplitSection
      id="business"
      tone="dark"
      media={mediaSideFor('business')}
      mediaNode={<ImageSlot slot={slot} />}
    >
      <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-6">
        {heading}
      </h2>
      <p className="font-sans text-[1rem] font-light leading-relaxed opacity-70 mb-10">{intro}</p>

      {blocks.map(({ title, body }) => (
        <div key={title} className="mb-8 last:mb-0">
          <h3 className="text-[0.65rem] tracking-[0.22em] uppercase opacity-50 mb-2">{title}</h3>
          <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-80">{body}</p>
        </div>
      ))}
    </SplitSection>
  );
}
```

- [ ] **Step 4: Implement InConfidence**

`src/components/home/InConfidence.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

// Kept separate from Business deliberately. A manufacturer running an
// unreleased car is not shopping for an events venue, and the two
// propositions weaken each other when combined.
export default function InConfidence() {
  const { heading, slot, blocks } = HOME.inConfidence;

  return (
    <SplitSection
      id="in-confidence"
      tone="dark"
      media={mediaSideFor('in-confidence')}
      mediaNode={<ImageSlot slot={slot} />}
      className="py-[16vh]"
    >
      <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight mb-10">
        {heading}
      </h2>

      {blocks.map(({ title, body }) => (
        <div key={title} className="mb-10 last:mb-0">
          <h3 className="text-[0.65rem] tracking-[0.22em] uppercase opacity-50 mb-2">{title}</h3>
          <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75">{body}</p>
        </div>
      ))}
    </SplitSection>
  );
}
```

Extra vertical padding is intentional — this is the quietest section on the page and the space is the point.

- [ ] **Step 5: Write the failing Hospitality test**

`src/components/home/Hospitality.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hospitality from './Hospitality';

describe('Hospitality', () => {
  it('renders three alternating rows, one per photograph', () => {
    render(<Hospitality />);
    expect(screen.getByTestId('split-hospitality-rooms')).toHaveAttribute('data-tone', 'light');
    expect(screen.getByTestId('split-hospitality-clubhouse')).toBeInTheDocument();
    expect(screen.getByTestId('split-hospitality-spa')).toBeInTheDocument();
  });

  it('alternates the media side across the three rows', () => {
    render(<Hospitality />);
    const sides = ['rooms', 'clubhouse', 'spa'].map((k) =>
      screen.getByTestId(`split-hospitality-${k}`).querySelector('[data-testid="split-media"]').className
    );
    expect(sides[0]).toContain('lg:order-1');
    expect(sides[1]).toContain('lg:order-2');
    expect(sides[2]).toContain('lg:order-1');
  });

  it('says a non-driving visit is complete, not a consolation', () => {
    const { container } = render(<Hospitality />);
    expect(container.textContent).toContain('It is not the only reason to arrive.');
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npm test -- src/components/home/Hospitality.test.jsx`
Expected: FAIL — cannot resolve `./Hospitality`

- [ ] **Step 7: Implement Hospitality**

`src/components/home/Hospitality.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';
import BlurFade from '../ui/BlurFade';

// Three splits rather than one. This section carries the least-proven part
// of the proposition, and three specific photographs argue better than one
// general one. Needs the strongest imagery on the site.
export default function Hospitality() {
  const { heading, rows, close } = HOME.hospitality;

  return (
    <div id="hospitality">
      <section data-tone="light" className="w-full bg-ivory text-dark pt-[12vh] px-[6vw]">
        <div className="max-w-[1440px] mx-auto">
          <BlurFade>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight">
              {heading}
            </h2>
          </BlurFade>
        </div>
      </section>

      {rows.map(({ id, slot, title, body }) => (
        <SplitSection
          key={id}
          id={id}
          tone="light"
          media={mediaSideFor(id)}
          ratio="wide"
          mediaNode={<ImageSlot slot={slot} />}
          className="py-[8vh]"
        >
          <h3 className="font-serif text-[clamp(1.5rem,2.6vw,2.2rem)] font-light mb-4">{title}</h3>
          <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75">{body}</p>
        </SplitSection>
      ))}

      <section data-tone="light" className="w-full bg-ivory text-dark pb-[12vh] px-[6vw]">
        <div className="max-w-[1440px] mx-auto">
          <BlurFade className="max-w-[62ch]">
            <h3 className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] font-light mb-4">{close.title}</h3>
            <p className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75">{close.body}</p>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 8: Run the tests**

Run: `npm test -- src/components/home/Business.test.jsx src/components/home/Hospitality.test.jsx`
Expected: PASS, 7 tests

- [ ] **Step 9: Add all three to Home.jsx and check the tonal beat**

Run: `npm run dev`
Expected: §8 and §9 run together as one continuous charcoal block, then §10 returns to ivory. The navbar flips to light type across the dark beat and back.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add business, in-confidence and hospitality sections"
```

---

## Task 16: `§11` Safety, `§12` Location, `§13` Questions

**Files:**
- Create: `src/components/home/Safety.jsx`, `src/components/home/Location.jsx`, `src/components/home/Questions.jsx`, `src/components/home/Questions.test.jsx`, `src/components/home/Location.test.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `SplitSection`, `mediaSideFor`, `HOME`, `Accordion` family, `ImageSlot`
- Produces: `<Safety />`, `<Location />`, `<Questions />`

- [ ] **Step 1: Implement Safety**

`src/components/home/Safety.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

// Placed after hospitality so it reassures without alarming. Nobody
// enquires because of this section; a number of people fail to enquire
// without it. Deliberately understated.
export default function Safety() {
  const { heading, slot, body } = HOME.safety;

  return (
    <SplitSection
      id="safety"
      tone="light"
      media={mediaSideFor('safety')}
      mediaNode={<ImageSlot slot={slot} />}
      className="py-[10vh]"
    >
      <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light leading-tight mb-6">
        {heading}
      </h2>
      {body.map((para, i) => (
        <p key={i} className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75 mb-4 last:mb-0">
          {para}
        </p>
      ))}
    </SplitSection>
  );
}
```

- [ ] **Step 2: Write the failing Location test**

`src/components/home/Location.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Location from './Location';

describe('Location', () => {
  it('publishes travel time', () => {
    const { container } = render(<Location />);
    expect(container.textContent).toContain('Two hours by road');
  });

  it('publishes no kilometre figure — the 110min/40km conflict is unresolved', () => {
    const { container } = render(<Location />);
    expect(container.textContent).not.toMatch(/\d+\s?km/);
  });

  it('does not embed a third-party map', () => {
    const { container } = render(<Location />);
    expect(container.querySelector('iframe')).toBeNull();
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test -- src/components/home/Location.test.jsx`
Expected: FAIL — cannot resolve `./Location`

- [ ] **Step 4: Implement Location**

`src/components/home/Location.jsx`:

```jsx
import React from 'react';
import SplitSection from '../layout/SplitSection';
import { mediaSideFor } from '../../data/layout';
import { HOME } from '../../data/home';
import ImageSlot from '../ui/ImageSlot';

// Stylised map, never an embed. Note: the source material's "110 minutes"
// and "40 km" contradict each other, so only the travel time is published.
// See the spec, Section 13, item 2.
export default function Location() {
  const { heading, slot, body } = HOME.location;

  return (
    <SplitSection
      id="location"
      tone="light"
      media={mediaSideFor('location')}
      mediaNode={<ImageSlot slot={slot} />}
      className="py-[10vh]"
    >
      <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light leading-tight mb-6">
        {heading}
      </h2>
      {body.map((para, i) => (
        <p key={i} className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75 mb-4 last:mb-0">
          {para}
        </p>
      ))}
    </SplitSection>
  );
}
```

- [ ] **Step 5: Write the failing Questions test**

`src/components/home/Questions.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Questions from './Questions';

describe('Questions', () => {
  it('renders three groups', () => {
    render(<Questions />);
    ['Coming to drive', 'Coming for the weekend', 'Business'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
  });

  it('starts closed', () => {
    render(<Questions />);
    expect(screen.queryByText(/Members hold standing access; everyone else books a day/)).not.toBeInTheDocument();
  });

  it('opens an answer on click', async () => {
    const user = userEvent.setup();
    render(<Questions />);
    await user.click(screen.getByRole('button', { name: /Do I need to be a member/ }));
    expect(screen.getByText(/everyone else books a day/)).toBeVisible();
  });

  it('gives the circuit length answer from the single source of truth', async () => {
    const user = userEvent.setup();
    render(<Questions />);
    await user.click(screen.getByRole('button', { name: /How long is the circuit/ }));
    expect(screen.getByText(/3\.2 kilometres/)).toBeVisible();
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npm test -- src/components/home/Questions.test.jsx`
Expected: FAIL — cannot resolve `./Questions`

- [ ] **Step 7: Implement Questions**

`src/components/home/Questions.jsx`:

```jsx
import React from 'react';
import { HOME } from '../../data/home';
import BlurFade from '../ui/BlurFade';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/accordion';

// Two-column with a sticky heading: "Questions" stays anchored while
// eighteen answers move past it.
export default function Questions() {
  const { heading, groups } = HOME.questions;

  return (
    <section
      id="questions"
      data-tone="light"
      data-testid="section-questions"
      className="w-full bg-ivory text-dark py-[12vh] px-[6vw]"
    >
      <div
        className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[48fr_52fr]"
        style={{ gap: 'clamp(2.5rem, 5vw, 6rem)' }}
      >
        <div>
          <BlurFade className="lg:sticky lg:top-[120px]">
            <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight">
              {heading}
            </h2>
          </BlurFade>
        </div>

        <div className="w-full">
          {groups.map(({ title, items }) => (
            <div key={title} className="mb-12 last:mb-0">
              <h3 className="text-[0.6rem] tracking-[0.22em] uppercase opacity-40 mb-2">{title}</h3>
              <Accordion type="single" collapsible>
                {items.map(({ q, a }) => (
                  <AccordionItem key={q} value={q}>
                    <AccordionTrigger>{q}</AccordionTrigger>
                    <AccordionContent>{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run the tests**

Run: `npm test -- src/components/home/Questions.test.jsx src/components/home/Location.test.jsx`
Expected: PASS, 7 tests

- [ ] **Step 9: Add all three to Home.jsx**

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add safety, location and questions sections"
```

---

## Task 17: `§14` Enquiry and shared form submission

**Files:**
- Create: `src/lib/submitToSheet.js`, `src/lib/submitToSheet.test.js`, `src/components/home/Enquiry.jsx`, `src/components/home/Enquiry.test.jsx`
- Modify: `src/components/MembershipModal.jsx`, `src/pages/Home.jsx`

**Interfaces:**
- Produces: `submitToSheet(fields: Record<string, string>): Promise<void>`
- Produces: `<Enquiry />`

- [ ] **Step 1: Write the failing submitToSheet test**

`src/lib/submitToSheet.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitToSheet } from './submitToSheet';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('submitToSheet', () => {
  it('posts urlencoded form data with a timestamp', async () => {
    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', fetchMock);

    await submitToSheet({ 'Full Name': 'Ada', 'Email Address': 'a@b.c' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.mode).toBe('no-cors');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(init.body).toContain('Full+Name=Ada');
    expect(init.body).toContain('Timestamp=');
  });

  it('resolves rather than throwing when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(submitToSheet({ 'Full Name': 'Ada' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/lib/submitToSheet.test.js`
Expected: FAIL — cannot resolve `./submitToSheet`

- [ ] **Step 3: Implement submitToSheet**

`src/lib/submitToSheet.js`:

```js
import { GOOGLE_SHEET_SCRIPT_URL } from '../config';

// Single Google Apps Script POST, shared by MembershipModal and Enquiry.
// Deliberately swallows failures: the endpoint is no-cors so we cannot read
// a response anyway, and blocking the user's success state on an
// unreadable result helps nobody.
export async function submitToSheet(fields) {
  if (!GOOGLE_SHEET_SCRIPT_URL) return;

  const body = new URLSearchParams();
  body.append('Timestamp', new Date().toLocaleString());
  Object.entries(fields).forEach(([k, v]) => body.append(k, v || 'N/A'));

  try {
    await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    console.warn('Sheet submission warning:', err);
  }
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/lib/submitToSheet.test.js`
Expected: PASS, 2 tests

- [ ] **Step 5: Point MembershipModal at the shared helper**

In `src/components/MembershipModal.jsx`, replace the `GOOGLE_SHEET_SCRIPT_URL` import with:

```jsx
import { submitToSheet } from '../lib/submitToSheet';
```

and replace the whole `try { … } catch { … } finally { … }` body of `handleSubmit` with:

```jsx
    await submitToSheet({
      'Enquiry Type': 'Membership',
      'Full Name': formData.name,
      'Phone/WhatsApp': formData.phone,
      'Email Address': formData.email,
      'Primary Performance Vehicle (Optional)': formData.vehicle,
      'Invitation Code/Referral (Optional)': formData.code,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
```

- [ ] **Step 6: Write the failing Enquiry test**

`src/components/home/Enquiry.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Enquiry from './Enquiry';

describe('Enquiry', () => {
  it('offers three enquiry types', () => {
    render(<Enquiry />);
    ['Drive', 'Stay', 'Business'].forEach((t) =>
      expect(screen.getByRole('tab', { name: t })).toBeInTheDocument()
    );
  });

  it('defaults to Drive', () => {
    render(<Enquiry />);
    expect(screen.getByRole('tab', { name: 'Drive' })).toHaveAttribute('aria-selected', 'true');
  });

  it('swaps the fields when the type changes', async () => {
    const user = userEvent.setup();
    render(<Enquiry />);
    expect(screen.getByLabelText('What you drive')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Business' }));
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
    expect(screen.queryByLabelText('What you drive')).not.toBeInTheDocument();
  });

  it('keeps every variant to five fields at most', () => {
    render(<Enquiry />);
    expect(screen.getAllByTestId('enquiry-field').length).toBeLessThanOrEqual(5);
  });

  it('sends the enquiry type with the submission', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', fetchMock);

    render(<Enquiry />);
    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'a@b.c');
    await user.type(screen.getByLabelText('Phone'), '9000000000');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].body).toContain('Enquiry+Type=Drive');
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npm test -- src/components/home/Enquiry.test.jsx`
Expected: FAIL — cannot resolve `./Enquiry`

- [ ] **Step 8: Implement Enquiry**

`src/components/home/Enquiry.jsx`:

```jsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HOME } from '../../data/home';
import { submitToSheet } from '../../lib/submitToSheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import LiquidButton from '../ui/LiquidButton';
import BlurFade from '../ui/BlurFade';

const INPUT =
  'w-full bg-transparent border-b border-ivory/20 py-2 text-ivory text-[0.95rem] focus:outline-none focus:border-ivory transition-colors placeholder:text-ivory/20';

export default function Enquiry() {
  const { heading, sub, types, email, fields } = HOME.enquiry;
  const [type, setType] = useState(types[0]);
  const [values, setValues] = useState({});
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    await submitToSheet({ 'Enquiry Type': type, ...values });
    setStatus('sent');
  };

  const set = (name, v) => setValues((prev) => ({ ...prev, [name]: v }));

  return (
    <section
      id="enquiry"
      data-tone="dark"
      data-testid="section-enquiry"
      className="w-full bg-dark text-ivory pt-[12vh] pb-[8vh] px-[6vw]"
    >
      <div
        className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[48fr_52fr] items-start"
        style={{ gap: 'clamp(2.5rem, 5vw, 6rem)' }}
      >
        <BlurFade>
          <h2 className="font-serif text-[clamp(2.2rem,4.5vw,3.6rem)] font-light leading-tight mb-4">
            {heading}
          </h2>
          <p className="font-sans text-[1rem] font-light leading-relaxed opacity-65 max-w-[42ch] mb-8">
            {sub}
          </p>
          <a href={`mailto:${email}`} className="text-oxblood text-[0.9rem] tracking-wide hover:opacity-70 transition-opacity">
            {email}
          </a>
        </BlurFade>

        <BlurFade delay={0.12} className="w-full">
          {status === 'sent' ? (
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] tracking-widest uppercase opacity-50">Received</span>
              <h3 className="font-serif text-[2.2rem] font-light leading-none">Enquiry sent</h3>
              <p className="text-[0.9rem] font-light opacity-65">We will come back to you directly.</p>
            </div>
          ) : (
            <Tabs value={type} onValueChange={setType}>
              <TabsList>
                {types.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
              </TabsList>

              {types.map((t) => (
                <TabsContent key={t} value={t}>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {fields[t].map(({ name, label, type: inputType, required }) => (
                      <div key={name} data-testid="enquiry-field" className="flex flex-col gap-1.5">
                        <label htmlFor={`${t}-${name}`} className="text-[0.65rem] tracking-widest uppercase opacity-60">
                          {label}
                        </label>
                        {inputType === 'textarea' ? (
                          <textarea
                            id={`${t}-${name}`} rows={3} required={required}
                            value={values[label] || ''}
                            onChange={(e) => set(label, e.target.value)}
                            className={INPUT}
                          />
                        ) : (
                          <input
                            id={`${t}-${name}`} type={inputType} required={required}
                            value={values[label] || ''}
                            onChange={(e) => set(label, e.target.value)}
                            className={INPUT}
                          />
                        )}
                      </div>
                    ))}

                    <LiquidButton type="submit" size="lg" disabled={status === 'sending'} className="mt-2 self-start">
                      {status === 'sending' ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                        </span>
                      ) : 'Send →'}
                    </LiquidButton>
                  </form>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </BlurFade>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npm test -- src/components/home/Enquiry.test.jsx`
Expected: PASS, 5 tests

- [ ] **Step 10: Add to Home.jsx as the last section**

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add enquiry section with shared sheet submission"
```

---

## Task 18: Assemble the homepage and prove the rhythm

**Files:**
- Modify: `src/pages/Home.jsx`
- Create: `src/pages/Home.test.jsx`

**Interfaces:**
- Consumes: all fourteen section components
- Produces: the finished `/` route

- [ ] **Step 1: Write the failing page test**

`src/pages/Home.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

describe('Home', () => {
  it('renders every section in deck order', () => {
    renderHome();
    const ids = Array.from(document.querySelectorAll('[data-tone]')).map((el) =>
      el.id || el.getAttribute('data-testid')
    );
    expect(ids[0]).toBe('hero');
    expect(ids).toContain('definition');
    expect(ids).toContain('circuit');
    expect(ids).toContain('fork');
    expect(ids).toContain('enquiry');
  });

  it('runs ivory-dominant with the dark beats where the deck puts them', () => {
    renderHome();
    const tones = Array.from(document.querySelectorAll('[data-tone]')).map((el) =>
      el.getAttribute('data-tone')
    );
    expect(tones.filter((t) => t === 'light').length).toBeGreaterThan(
      tones.filter((t) => t === 'dark').length
    );
  });

  it('has exactly one h2 per section', () => {
    renderHome();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    const texts = h2s.map((h) => h.textContent);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('never shows two consecutive splits with media on the same side', () => {
    renderHome();
    const sides = Array.from(document.querySelectorAll('[data-testid="split-media"]')).map((el) =>
      el.className.includes('lg:order-1') ? 'left' : 'right'
    );
    for (let i = 1; i < sides.length; i += 1) {
      expect(sides[i]).not.toBe(sides[i - 1]);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/pages/Home.test.jsx`
Expected: FAIL — sections missing

- [ ] **Step 3: Assemble Home.jsx**

`src/pages/Home.jsx`:

```jsx
import React from 'react';
import HomeHero from '../components/home/HomeHero';
import Definition from '../components/home/Definition';
import Circuit from '../components/home/Circuit';
import Surfaces from '../components/home/Surfaces';
import Fork from '../components/home/Fork';
import OnYourOwn from '../components/home/OnYourOwn';
import WithPeople from '../components/home/WithPeople';
import Business from '../components/home/Business';
import InConfidence from '../components/home/InConfidence';
import Hospitality from '../components/home/Hospitality';
import Safety from '../components/home/Safety';
import Location from '../components/home/Location';
import Questions from '../components/home/Questions';
import Enquiry from '../components/home/Enquiry';

export default function Home() {
  return (
    <main data-testid="page-home">
      <HomeHero />
      <Definition />
      <Circuit />
      <Surfaces />
      <Fork />
      <OnYourOwn />
      <WithPeople />
      <Business />
      <InConfidence />
      <Hospitality />
      <Safety />
      <Location />
      <Questions />
      <Enquiry />
    </main>
  );
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/pages/Home.test.jsx`
Expected: PASS, 4 tests

- [ ] **Step 5: Scroll the whole page, top to bottom**

Run: `npm run dev`
Expected, and **this only shows up at full length, not section by section**:
- Images zigzag left/right the whole way down with no repeat
- Only two dark stretches: §8–9, and §14 into the footer
- Navbar type colour flips correctly at every tonal boundary
- Nothing pops in after it is already on screen

- [ ] **Step 6: Check it at 1023px, 768px and 375px**

Expected: below 1024px every split stacks with the **image above** its content. No horizontal scroll at any width.

- [ ] **Step 7: Check it with reduced motion enabled**

Enable *Settings → Accessibility → Display → Reduce motion* (macOS) or *Settings → Accessibility → Visual effects → Animation effects off* (Windows 11), then hard-reload.

Expected: sections fade in plainly with no slide or blur, §4 becomes a normal stacked list with no pinning, no oxblood wipes, and the scroll progress bar is gone. **All content still reachable and readable.**

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: assemble the fourteen-section homepage"
```

---

## Task 19: About page

**Files:**
- Create: `src/data/about.js`, `src/components/about/*`, `src/pages/About.test.jsx`
- Modify: `src/pages/About.jsx`

**Interfaces:**
- Consumes: `SplitSection`, `BlurFade`, `LiquidButton`
- Produces: the finished `/about` route

- [ ] **Step 1: Create the About copy**

`src/data/about.js`:

```js
export const ABOUT = {
  header: {
    overline: 'ABOUT',
    h1: 'Four decades of building things. One of them is a racetrack.',
    sub: 'Marque One began in agriculture in the 1980s. It now runs a motorsport estate, a workshop and a car business.',
  },

  group: {
    heading: 'Marque One Group',
    body: [
      'The business started in the 1980s in agriculture — rice, sugarcane, sesame. It moved into cement and steel, then into construction and real estate, and spent thirty years building for other people.',
      'In 2016 it took the name Marque One and turned toward the thing it had always been closest to.',
      'Three businesses now carry the name.',
    ],
  },

  businesses: {
    heading: 'Three businesses, one name',
    items: [
      { name: 'Marque One Motor Club', kind: 'The estate.',
        body: 'A circuit, a drag strip and a clubhouse across 219 acres, FIA-graded and designed by Driven International. Two hours from Bengaluru.',
        cta: { label: 'The club →', to: '/club' } },
      { name: 'Marque One Garage', kind: 'The workshop.',
        body: 'A luxury and performance service centre in Bengaluru, working across sixteen marques from Porsche to Rolls-Royce. Servicing, engine and gearbox rebuilds, bodywork, paint protection and performance.',
        cta: null },
      { name: 'Marque One Classifieds', kind: 'The car business.',
        body: 'Verified listings of luxury and performance cars across India, priced and moved.',
        cta: null },
    ],
  },

  people: {
    heading: 'Behind it',
    items: [
      { name: 'Anush Chakravarthi', role: 'FOUNDER',
        body: "A mechanical engineer and racing driver. Ran his college's Formula Student team, competed in Formula LGB and Formula SAE, and was selected from roughly ten thousand entrants to represent India at Nissan's GT Academy under Karun Chandhok." },
      { name: 'Shana Parmeshwar', role: 'DIRECTOR',
        body: 'A commercial pilot who became a racing driver. Official safety driver for the K1000 rally from 2005 to 2009, has raced in Malaysia, Sweden, England and India, and holds the fastest lap by a woman in a production car at the Buddh International Circuit.' },
      { name: 'M. G. Chakravarthi Rajan', role: 'DIRECTOR',
        body: 'More than thirty years in construction and development. Founded Anuadi Constructions in 1991 — the firm building the estate.' },
    ],
  },

  partners: {
    heading: 'Built with',
    items: [
      { name: 'Driven International', body: 'The British circuit design and engineering consultancy behind the layout and the master plan. Their other Indian work includes Kari Motor Speedway and Nanoli Speedway.' },
      { name: 'Autocar India', body: 'Media partner.' },
      { name: 'Anuadi Constructions', body: 'Founded 1991. Building the estate.' },
    ],
  },

  close: { heading: 'Come and see it.', cta: { label: 'Enquire', to: '/contact' } },
};
```

- [ ] **Step 2: Write the failing About test**

`src/pages/About.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';

const renderAbout = () => render(<MemoryRouter><About /></MemoryRouter>);

describe('About', () => {
  it('resolves the three-business naming confusion', () => {
    renderAbout();
    ['Marque One Motor Club', 'Marque One Garage', 'Marque One Classifieds'].forEach((n) =>
      expect(screen.getByText(n)).toBeInTheDocument()
    );
  });

  it('names the three people', () => {
    renderAbout();
    ['Anush Chakravarthi', 'Shana Parmeshwar', 'M. G. Chakravarthi Rajan'].forEach((n) =>
      expect(screen.getByText(n)).toBeInTheDocument()
    );
  });

  it('uses the approved grade wording', () => {
    const { container } = renderAbout();
    expect(container.textContent).toContain('FIA-graded');
    expect(container.textContent).not.toContain('built to FIA standards');
  });

  it('links the club card to /club', () => {
    renderAbout();
    expect(screen.getByRole('link', { name: /The club/ })).toHaveAttribute('href', '/club');
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test -- src/pages/About.test.jsx`
Expected: FAIL — text not found

- [ ] **Step 4: Implement About**

`src/pages/About.jsx`:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ABOUT } from '../data/about';
import BlurFade from '../components/ui/BlurFade';
import LiquidButton from '../components/ui/LiquidButton';
import { DUR } from '../lib/motion';

const Section = ({ children, className = '' }) => (
  <section data-tone="light" className={`w-full bg-ivory text-dark px-[6vw] ${className}`}>
    <div className="max-w-[1440px] mx-auto">{children}</div>
  </section>
);

export default function About() {
  const { header, group, businesses, people, partners, close } = ABOUT;

  return (
    <main data-testid="page-about">
      <Section className="pt-[22vh] pb-[10vh]">
        <BlurFade>
          <span className="block text-[0.7rem] tracking-widest uppercase opacity-50 mb-4">{header.overline}</span>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,5rem)] font-light leading-[1.02] tracking-tight max-w-[18ch]">
            {header.h1}
          </h1>
          <p className="font-sans text-[1rem] font-light leading-relaxed opacity-70 mt-6 max-w-[52ch]">{header.sub}</p>
        </BlurFade>
      </Section>

      <Section className="py-[8vh]">
        <BlurFade className="max-w-[62ch]">
          <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light mb-6">{group.heading}</h2>
          {group.body.map((p, i) => (
            <p key={i} className="font-sans text-[0.95rem] font-light leading-relaxed opacity-75 mb-4 last:mb-0">{p}</p>
          ))}
        </BlurFade>
      </Section>

      <Section className="py-[8vh]">
        <BlurFade>
          <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light mb-[5vh]">{businesses.heading}</h2>
        </BlurFade>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-current/10">
          {businesses.items.map(({ name, kind, body, cta }, i) => (
            <BlurFade key={name} delay={i * DUR.stagger}>
              <div className="bg-ivory p-[clamp(1.5rem,2.5vw,2.25rem)] h-full flex flex-col gap-3">
                <h3 className="font-serif text-[1.35rem] font-light">{name}</h3>
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-oxblood">{kind}</span>
                <p className="font-sans text-[0.9rem] font-light leading-relaxed opacity-70 flex-1">{body}</p>
                {cta && (
                  <Link to={cta.to} className="text-[0.8rem] tracking-wide text-oxblood hover:opacity-70 transition-opacity mt-2">
                    {cta.label}
                  </Link>
                )}
              </div>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section className="py-[8vh]">
        <BlurFade>
          <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light mb-[5vh]">{people.heading}</h2>
        </BlurFade>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(2rem,3vw,3rem)]">
          {people.items.map(({ name, role, body }, i) => (
            <BlurFade key={name} delay={i * DUR.stagger}>
              <h3 className="font-serif text-[1.3rem] font-light mb-1">{name}</h3>
              <span className="block text-[0.6rem] tracking-[0.22em] uppercase opacity-40 mb-3">{role}</span>
              <p className="font-sans text-[0.9rem] font-light leading-relaxed opacity-70">{body}</p>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section className="py-[8vh]">
        <BlurFade>
          <h2 className="font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-light mb-[5vh]">{partners.heading}</h2>
        </BlurFade>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(2rem,3vw,3rem)]">
          {partners.items.map(({ name, body }, i) => (
            <BlurFade key={name} delay={i * DUR.stagger}>
              <h3 className="font-serif text-[1.15rem] font-light mb-2">{name}</h3>
              <p className="font-sans text-[0.9rem] font-light leading-relaxed opacity-70">{body}</p>
            </BlurFade>
          ))}
        </div>
      </Section>

      <section data-tone="dark" className="w-full bg-dark text-ivory px-[6vw] py-[14vh]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-start gap-8">
          <BlurFade>
            <h2 className="font-serif text-[clamp(2.2rem,4.5vw,3.6rem)] font-light">{close.heading}</h2>
          </BlurFade>
          <BlurFade delay={0.12}>
            <Link to={close.cta.to}><LiquidButton size="lg">{close.cta.label}</LiquidButton></Link>
          </BlurFade>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npm test -- src/pages/About.test.jsx`
Expected: PASS, 4 tests

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add about page"
```

---

## Task 20: Contact page

**Files:**
- Modify: `src/pages/Contact.jsx`
- Create: `src/pages/Contact.test.jsx`

**Interfaces:**
- Consumes: `Enquiry`, `Location`
- Produces: the finished `/contact` route

- [ ] **Step 1: Write the failing test**

`src/pages/Contact.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';

describe('Contact', () => {
  it('offers the same three enquiry types as the homepage', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>);
    ['Drive', 'Stay', 'Business'].forEach((t) =>
      expect(screen.getByRole('tab', { name: t })).toBeInTheDocument()
    );
  });

  it('publishes the enquiry address', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>);
    expect(screen.getAllByText('project.motorclub@marque.one').length).toBeGreaterThan(0);
  });

  it('shows how to get there', () => {
    const { container } = render(<MemoryRouter><Contact /></MemoryRouter>);
    expect(container.textContent).toContain('Two hours by road');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- src/pages/Contact.test.jsx`
Expected: FAIL — no tabs found

- [ ] **Step 3: Implement Contact**

`src/pages/Contact.jsx`:

```jsx
import React from 'react';
import Enquiry from '../components/home/Enquiry';
import Location from '../components/home/Location';

export default function Contact() {
  return (
    <main data-testid="page-contact" className="pt-[76px]">
      <Enquiry />
      <Location />
    </main>
  );
}
```

The `pt-[76px]` clears the fixed navbar — Contact has no full-bleed hero to sit under it.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test -- src/pages/Contact.test.jsx`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add contact page"
```

---

## Task 21: Pause off-screen canvas loops

Two `requestAnimationFrame` loops currently run forever. On a page this much longer, the footer grid burns battery while far off-screen.

**Files:**
- Modify: `src/components/ui/FlickeringGrid.jsx`, `src/components/Hero.jsx`

- [ ] **Step 1: Read the current implementation**

Open `src/components/ui/FlickeringGrid.jsx` and find where it calls `requestAnimationFrame` and stores the handle.

- [ ] **Step 2: Gate the loop on visibility**

Inside the effect that starts the animation, add a visibility flag and an observer on the canvas element. Replace the unconditional `render()` recursion with:

```jsx
    let isVisible = true;

    const visibility = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    if (canvasRef.current) visibility.observe(canvasRef.current);
```

Then, at the top of the existing `render`/`animate` function body, add:

```jsx
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
```

And add `visibility.disconnect();` to the effect's cleanup, alongside the existing `cancelAnimationFrame`.

- [ ] **Step 3: Apply the same gate to the Hero canvas**

`src/components/Hero.jsx` has an identical particle loop in its `useEffect`. Apply the same three changes: the `isVisible` flag, the early-return inside `render`, and `visibility.disconnect()` in cleanup.

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `/`, scroll to the middle of the page, then open DevTools → Performance and record five seconds.
Expected: no continuous canvas paint work while the footer and hero are both off-screen.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: pause canvas animation loops when off-screen"
```

---

## Task 22: Full verification

**Files:** none created

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: every test passes. Report the actual count.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Preview the production build and check every route**

Run: `npm run preview`
Visit `/`, `/about`, `/club`, `/contact`, and refresh on each.
Expected: all four render. **A 404 on refresh means the SPA fallback is not being applied** — that is the failure mode the spec warns about, and it will look fine in `npm run dev`.

- [ ] **Step 4: Grep the built output for forbidden claims**

```bash
grep -rE "5\.5 km|18 corners|1\.1 km|India's longest|built to FIA standards" dist/ && echo "FOUND — FIX BEFORE SHIPPING" || echo "clean"
```

Expected: `clean`

- [ ] **Step 5: Confirm the cursor scoping by eye**

Open `/` and `/about`: normal system pointer.
Open `/club`: custom lens, no system pointer.
**This fails silently — it must be looked at, not assumed.**

- [ ] **Step 6: Confirm the Club page is unchanged**

Scroll `/club` end to end. Expected: identical to before this work, including ambient audio button and all nine sections.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: full verification pass"
```

---

## Post-implementation — still open

These are tracked in the spec, Section 13. None blocks the build; all should be resolved before launch.

1. **Oxblood hex** — `#6B1F2A` / `#4A1520` assumed. Now the most-seen colour after ivory and charcoal, since it is the `BoxReveal` panel.
2. **The 110 minutes vs 40 km contradiction** — kilometre figure omitted from §12 rather than guessed.
3. **Terms page and liability waiver** — out of scope, required before anyone drives, needs a lawyer.
4. **Ambient audio** — assumed Club-only, matching the cursor.
5. **Ten unanswered FAQ questions** — omitted rather than stubbed. Each drops into `src/data/home.js` as one line.
6. **Hosting target** — Netlify and Vercel configs shipped. Any other host needs its own SPA fallback rule.
7. **Photography** — fourteen slots, seven still placeholders. See `IMAGE-MANIFEST.md`.
