'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = {
  es: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
};

const ALTO = 1000;           // viewport height
const PAD = 61;              // html{scroll-padding-top:61px}
const ANCLAS = [2000, 5000, 9000];
const PUNTO = 5000 - PAD;    // where the browser parks the 5000px anchor

function montar(source, { quieto = false } = {}) {
  const script = source.match(/<script>\s*(\/\* Ajuste de scroll que no pelea[\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'snap script not found');
  let now = 0;
  let listener = null;
  const timers = [];
  const R = { style: {}, classList: { contains: (c) => quieto && c === 'a11y-quieto' } };
  const window = {
    scrollY: 0,
    innerHeight: ALTO,
    onscroll: null,
    addEventListener: (type, fn) => { if (type === 'scroll') listener = fn; },
    matchMedia: () => ({ matches: false }),
  };
  const anclas = ANCLAS.map((top) => ({ getBoundingClientRect: () => ({ top: top - window.scrollY }) }));
  vm.runInNewContext(script, {
    window,
    document: { documentElement: R, querySelectorAll: () => anclas },
    performance: { now: () => now },
    setTimeout: (fn, ms) => timers.push({ fn, at: now + ms }),
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].fn = null; },
    getComputedStyle: () => ({ scrollPaddingTop: `${PAD}px` }),
    matchMedia: window.matchMedia,
  });

  // Ends a gesture at `y` moving `paso` px per 50 ms, then lets the release timer fire.
  return function soltarEn(y, paso = 10) {
    window.scrollY = y - paso; now += 50; listener();
    window.scrollY = y; now += 50; listener();
    now += 60;
    for (const t of timers) if (t.fn && t.at <= now) { const fn = t.fn; t.fn = null; fn(); }
    return R.style.scrollSnapType;
  };
}

for (const [lang, source] of Object.entries(pages)) {
  it(`${lang}: snaps when released within 20% of the viewport before an anchor`, () => {
    assert.equal(montar(source)(PUNTO - 0.15 * ALTO), 'y proximity');
  });

  it(`${lang}: snaps when released within 20% of the viewport past an anchor`, () => {
    assert.equal(montar(source)(PUNTO + 0.15 * ALTO), 'y proximity');
  });

  it(`${lang}: snaps back to the top when released within 20% of it`, () => {
    assert.equal(montar(source)(0.15 * ALTO), 'y proximity');
  });

  it(`${lang}: does not snap when released farther than 20% from every anchor`, () => {
    assert.equal(montar(source)(PUNTO - 0.35 * ALTO), 'none');
    assert.equal(montar(source)(PUNTO + 0.35 * ALTO), 'none');
  });

  it(`${lang}: still never snaps after a fast gesture or in quiet mode`, () => {
    assert.equal(montar(source)(PUNTO - 0.1 * ALTO, 200), 'none');
    assert.equal(montar(source, { quieto: true })(PUNTO - 0.1 * ALTO), 'none');
  });
}
