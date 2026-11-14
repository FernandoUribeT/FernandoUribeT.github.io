'use strict';

// T17 — S18/S14/S17/S5/S8: services and hero doors reuse the project treatment.
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = { es: 'index.html', en: path.join('en', 'index.html') };
const base = ['.svc a.card.serv', '.doors .door', '#proyectos .case.card'];
const active = [
  '.svc a.card.serv:is(:hover,:focus-visible)',
  '.doors .door:is(:hover,:focus-within)',
  '#proyectos .case.card:is(:hover,:focus-within)',
];
const lift = [
  'html:not(.a11y-quieto) #servicios .card.serv.rv:is(:hover,:focus-visible)',
  'html:not(.a11y-quieto) .doors .door:is(:hover,:focus-within)',
  'html:not(.a11y-quieto) #proyectos .case.card.rv:is(:hover,:focus-within)',
];

function splitSelectors(text) {
  let depth = 0;
  let start = 0;
  const selectors = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (text[i] === ',' && depth === 0) {
      selectors.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  selectors.push(text.slice(start).trim());
  return selectors;
}

function sharedRule(source, selectors) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, header, body] of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const rules = splitSelectors(header);
    if (selectors.every((selector) => rules.includes(selector))) return body;
  }
  assert.fail(`missing shared CSS rule for: ${selectors.join(' | ')}`);
}

function reducedMotionBlocks(source) {
  const blocks = [];
  const pattern = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g;
  for (const match of source.matchAll(pattern)) {
    let depth = 1;
    let end = match.index + match[0].length;
    const start = end;
    while (depth && end < source.length) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
      end++;
    }
    blocks.push(source.slice(start, end - 1));
  }
  return blocks.join('\n');
}

for (const [lang, file] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');

  it(`${lang}: service links and both doors share the projects' accent ring on hover and keyboard focus`, () => {
    assert.equal((source.match(/<a class="card serv rv"/g) || []).length, 6);
    assert.equal((source.match(/<article class="door">/g) || []).length, 2);
    const surface = sharedRule(source, base);
    assert.match(surface, /isolation:\s*isolate/);
    for (const property of ['transform', 'border-color', 'box-shadow', 'background']) {
      assert.match(surface, new RegExp(`${property}\\s+\\.25s\\s+var\\(--ease\\)`));
    }
    assert.match(surface, /opacity\s+\.6s\s+var\(--ease\)/);
    const ring = sharedRule(source, base.map((selector) => `${selector}::before`));
    assert.match(ring, /border:\s*2px solid var\(--borde/);
    assert.match(ring, /border-radius:\s*inherit/);
    assert.match(ring, /pointer-events:\s*none/);
    assert.match(ring, /opacity:\s*0/);

    const interaction = sharedRule(source, active);
    assert.match(interaction, /border-top-color:\s*transparent/);
    assert.match(interaction, /background:\s*var\(--card-2\)/);
    assert.match(interaction, /box-shadow:\s*0 14px 40px -18px var\(--sombra\),\s*0 0 18px -7px var\(--borde/);
    assert.match(sharedRule(source, active.map((selector) => `${selector}::before`)), /opacity:\s*1/);
    assert.doesNotMatch(source, /\.svc a\.card\.serv:hover\{[^}]*border-top-color:var\(--borde\)/);
    assert.doesNotMatch(source, /\.doors \.door:hover\{[^}]*border-top-color:var\(--borde\)/);
  });

  it(`${lang}: all three card types reuse one animated accent ring with the existing fallback`, () => {
    const selectors = active.map((selector) => `html.ang-animable ${selector}::before`);
    const animated = sharedRule(source, selectors);
    assert.match(animated, /conic-gradient\(from var\(--ang\)/);
    assert.match(animated, /var\(--borde/);
    assert.match(animated, /mask-composite:\s*exclude/);
    assert.match(animated, /animation:\s*luz-borde\s+3s\s+linear\s+infinite/);
    assert.equal((source.match(/@property\s+--ang/g) || []).length, 1);
    assert.equal((source.match(/@keyframes\s+luz-borde/g) || []).length, 1);
    assert.match(source, /CSS\.registerProperty/);
  });

  it(`${lang}: hover and focus lift services and doors above the reveal resets`, () => {
    assert.match(sharedRule(source, lift), /transform:\s*translateY\(-3px\)/);
    assert.match(source, /\.js \.rv\.in\{opacity:1;transform:none;/);
    assert.match(source, /html:not\(\.a11y-quieto\)\.js #proyectos \.card\.rv:not\(\.in\) \{ transform: none; \}/);
  });

  it(`${lang}: quiet and reduced-motion interactions have a static accent ring and no lift; contrast keeps its outline`, () => {
    const quietRing = active.map((selector) => `html.a11y-quieto.ang-animable ${selector}::before`);
    const animated = active.map((selector) => `html.ang-animable ${selector}::before`);
    for (const rule of [sharedRule(source, quietRing), sharedRule(reducedMotionBlocks(source), animated)]) {
      assert.match(rule, /animation:\s*none/);
      assert.match(rule, /background:\s*var\(--borde/);
    }
    const quietLift = active.map((selector) => `html.a11y-quieto ${selector}`);
    assert.match(sharedRule(source, quietLift), /transform:\s*none/);
    assert.match(sharedRule(reducedMotionBlocks(source), lift), /transform:\s*none/);
    const contrast = active.map((selector) => `html.a11y-contraste ${selector}`);
    assert.match(sharedRule(source, contrast), /inset[^;]*var\(--line\)/);
  });

  it(`${lang}: only opacity retains the reveal stagger for service cards, preserving project and other reveals`, () => {
    const script = source.match(/<script>\s*(\(function\(\)\{\s*var d=document, els=[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
    assert.ok(script, 'the existing reveal script is present');
    const selectors = ['other', '#proyectos .case', '#servicios .card.serv', 'other'];
    const elements = selectors.map((selector) => ({
      style: {},
      matches: (query) => query === selector,
      getBoundingClientRect: () => ({ top: 0 }),
      classList: { add() {}, contains: () => true },
    }));
    const document = {
      querySelectorAll: (selector) => selector === '.rv' ? elements : [],
      getElementById: () => null,
    };
    function IntersectionObserver() { this.observe = () => {}; this.unobserve = () => {}; }
    const window = { innerHeight: 800, IntersectionObserver };
    vm.runInNewContext(script, { document, window, IntersectionObserver, setTimeout() {} });
    assert.equal(elements[0].style.transitionDelay, '0ms');
    assert.equal(elements[1].style.transitionDelay, '45ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[2].style.transitionDelay, '90ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[3].style.transitionDelay, '135ms');
  });
}
