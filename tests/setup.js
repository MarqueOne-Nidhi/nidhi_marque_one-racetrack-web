import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Every test starts with a `fetch` that refuses to run.
 *
 * The forms post to a real Google Apps Script endpoint whose URL is compiled
 * into the bundle as a fallback in src/config.js. A test that forgets to stub
 * the network would therefore not fail: it would quietly write a row into the
 * live spreadsheet and send a real email. Failing loudly instead is the only
 * safe default here.
 *
 * tests/helpers/endpoint.js replaces this for the duration of a test.
 */
afterEach(() => {
  cleanup();
  installGuard();
});

function installGuard() {
  global.fetch = vi.fn(async (url) => {
    throw new Error(
      'A test tried to reach ' +
        String(url) +
        ' without stubbing the endpoint. Use stubEndpoint() from ' +
        'tests/helpers/endpoint.js.'
    );
  });
}

installGuard();

// jsdom does not implement these, and framer-motion and the modals reach for
// them on mount.
if (!global.matchMedia) {
  global.matchMedia = (query) => ({
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

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!global.IntersectionObserver) {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom defines scrollTo as a stub that logs "Not implemented" on every call,
// so this overwrites rather than fills in.
window.scrollTo = () => {};
window.scrollBy = () => {};
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

expect.extend({
  /** Asserts an object has exactly these keys, in any order. */
  toHaveExactKeys(received, expected) {
    const got = Object.keys(received).sort();
    const want = [...expected].sort();
    const pass = got.length === want.length && got.every((k, i) => k === want[i]);
    return {
      pass,
      message: () =>
        pass
          ? `expected keys not to be exactly ${JSON.stringify(want)}`
          : `expected exactly ${JSON.stringify(want)}\n     but got ${JSON.stringify(got)}` +
            `\n     missing: ${JSON.stringify(want.filter((k) => !got.includes(k)))}` +
            `\n     extra:   ${JSON.stringify(got.filter((k) => !want.includes(k)))}`,
    };
  },
});
