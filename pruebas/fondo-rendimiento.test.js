// Behavioral checks for the live background script (.fondo-vivo) shared by the
// home pages and the demos. The real inline script runs in a sandbox with
// stubbed browser APIs, so the tests observe what it does (frames scheduled,
// particles seeded), not how its source reads.
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pages = [
  'index.html', 'en/index.html',
  'demos/calendario/index.html', 'demos/calendar/index.html',
  'demos/expedientes/index.html', 'demos/records/index.html',
  'demos/revision/index.html', 'demos/inspection/index.html',
  'demos/qr/index.html', 'demos/qr-en/index.html',
];

function extractScript(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const start = source.indexOf("(function(){\n  var cv=document.querySelector('.fondo-vivo');");
  assert.ok(start >= 0, `${file}: fondo-vivo script present`);
  const end = source.indexOf('})();', start) + '})();'.length;
  return source.slice(start, end);
}

// A minimal browser: one <html> class list, rAF/timers queued by hand.
function boot(code, { classes = [] } = {}) {
  const cls = new Set(classes);
  const frames = [];
  const timers = new Map();
  let timerId = 0;
  let randomCalls = 0;
  let observer = null;
  const winListeners = {};
  const docListeners = {};
  const ctx = new Proxy({}, { get: () => () => {} });
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  const sandbox = {
    devicePixelRatio: 1, innerWidth: 1440, innerHeight: 900,
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => { timers.delete(id); },
    addEventListener: (type, fn) => { (winListeners[type] ||= []).push(fn); },
    MutationObserver: class { constructor(fn) { observer = fn; } observe() {} },
    Math: Object.assign(Object.create(Math), { random: () => { randomCalls++; return 0.5; } }),
    document: {
      readyState: 'loading', hidden: false,
      documentElement: { classList: { contains: (c) => cls.has(c) } },
      querySelector: (sel) => (sel === '.fondo-vivo' ? canvas : null),
      addEventListener: (type, fn) => { (docListeners[type] ||= []).push(fn); },
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox);
  const api = {
    get pendingFrames() { return frames.length; },
    get randomCalls() { return randomCalls; },
    ready() { (docListeners.DOMContentLoaded || []).forEach((fn) => fn()); },
    step() { const queued = frames.splice(0); queued.forEach((fn) => fn()); },
    setClass(c, on) { on ? cls.add(c) : cls.delete(c); observer && observer(); },
    resize(w, h) { sandbox.innerWidth = w; sandbox.innerHeight = h; (winListeners.resize || []).forEach((fn) => fn()); },
    flushTimers() { const queued = [...timers.values()]; timers.clear(); queued.forEach((fn) => fn()); },
  };
  return api;
}

for (const file of pages) {
  const code = extractScript(file);

  describe(`${file} live background script`, () => {
    it('draws when nothing turns it off', () => {
      const b = boot(code);
      b.ready();
      assert.equal(b.pendingFrames, 1);
      b.step();
      assert.equal(b.pendingFrames, 1, 'the loop keeps going');
    });

    it('never schedules a frame in quiet mode', () => {
      const b = boot(code, { classes: ['a11y-quieto'] });
      b.ready();
      assert.equal(b.pendingFrames, 0);
    });

    it('never schedules a frame while high contrast hides the canvas', () => {
      const b = boot(code, { classes: ['a11y-contraste'] });
      b.ready();
      assert.equal(b.pendingFrames, 0);
    });

    it('stops looping when high contrast turns on, and resumes when it turns off', () => {
      const b = boot(code);
      b.ready();
      b.step();
      b.setClass('a11y-contraste', true);
      b.step();
      assert.equal(b.pendingFrames, 0, 'no frames while hidden');
      b.setClass('a11y-contraste', false);
      assert.equal(b.pendingFrames, 1, 'resumes once');
    });

    it('keeps a single loop when quiet mode is toggled quickly', () => {
      const b = boot(code);
      b.ready();
      b.setClass('a11y-quieto', true);
      b.setClass('a11y-quieto', false);
      b.setClass('a11y-quieto', true);
      b.setClass('a11y-quieto', false);
      b.step();
      assert.equal(b.pendingFrames, 1, 'one loop, not several');
    });

    it('does not reseed particles on window resize', () => {
      const b = boot(code);
      b.ready();
      const seeded = b.randomCalls;
      assert.ok(seeded > 0, 'particles seeded once at start');
      for (let i = 0; i < 5; i++) b.resize(1200 - i * 40, 800);
      b.flushTimers();
      assert.equal(b.randomCalls, seeded, 'resize keeps the same particles');
    });
  });
}
