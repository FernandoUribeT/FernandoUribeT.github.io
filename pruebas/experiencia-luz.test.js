'use strict';

// T19 — S21/S20/S14/S17/S5/S8: the existing border light on the carousel and experience.
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = { es: 'index.html', en: path.join('en', 'index.html') };
const frame = '.carrusel .marco-luz';
const chip = '#experiencia .job-head>.chip';
const feat = '#experiencia .feats>.feat';
const existing = ['.stats .stat', '.svc a.card.serv', '.doors .door', '#proyectos .case.card'];
const targets = [frame, chip, feat];
const frameActive = '.carrusel:is(:hover,:focus-within) .marco-luz';
const chipActive = `${chip}:is(:hover,:focus-within)`;
const featActive = `${feat}:is(:hover,:focus-within)`;
const existingActive = [
  '.stats .stat:is(:hover,:focus-within)',
  '.svc a.card.serv:is(:hover,:focus-visible)',
  '.doors .door:is(:hover,:focus-within)',
  '#proyectos .case.card:is(:hover,:focus-within)',
];
const active = [frameActive, chipActive, featActive, ...existingActive];
const lift = `html:not(.a11y-quieto) ${feat}.rv:is(:hover,:focus-within)`;

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
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, header, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const found = splitSelectors(header);
    if (selectors.every((selector) => found.includes(selector))) return body;
  }
  assert.fail(`missing shared CSS rule for: ${selectors.join(' | ')}`);
}

function ownRule(source, selector) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, header, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const found = splitSelectors(header);
    if (found.length === 1 && found[0] === selector) return body;
  }
  assert.fail(`missing dedicated CSS rule for: ${selector}`);
}

function reducedMotionBlocks(source) {
  const blocks = [];
  for (const match of source.matchAll(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g)) {
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

  it(`${lang}: the carousel ring sits outside the clipped frame without intercepting media or arrows`, () => {
    assert.ok(/<div class="marco-luz">\s*<div class="marco">/.test(source), 'the frame has an unclipped ring wrapper');
    assert.match(sharedRule(source, ['.marco']), /border-radius:\s*14px;overflow:\s*hidden/);
    assert.match(ownRule(source, frame), /border-radius:\s*14px/);
    assert.match(sharedRule(source, [frame, chip]), /--borde:\s*var\(--accent\)/);
    assert.match(sharedRule(source, [frame, chip]), /position:\s*relative/);
    const surface = sharedRule(source, [...targets, ...existing]);
    assert.match(surface, /overflow:\s*visible/);
    assert.match(surface, /isolation:\s*isolate/);
    const ring = sharedRule(source, [...targets, ...existing].map((s) => `${s}::before`));
    assert.match(ring, /border:\s*2px solid var\(--borde/);
    assert.match(ring, /border-radius:\s*inherit/);
    assert.match(ring, /pointer-events:\s*none/);
    assert.match(ring, /z-index:\s*-1/);
    assert.match(ring, /opacity:\s*0/);
    assert.match(ownRule(source, `${frame}::before`), /inset:\s*-2px/);
    assert.doesNotMatch(source, /\.marco:hover\s*\{[^}]*border-color:\s*var\(--accent\)/);
    assert.match(source, /<\/div>\s*<\/div>\s*<button type="button" class="flecha izq"/);
  });

  it(`${lang}: the experience chip and seven cards keep their own colors and add no tab stops`, () => {
    // non-interactive content must not become a keyboard tab stop (WCAG 2.4.3); like the
    // hero stats, the light is a pointer affordance here
    const experience = source.match(/<section id="experiencia"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.match(experience, /<span class="chip">Feb – Jul 2026 · 169 /);
    const cards = [...experience.matchAll(/<div class="feat rv"([^>]*)>/g)];
    assert.equal(cards.length, 7);
    for (const [, attrs] of cards) assert.doesNotMatch(attrs, /tabindex/);
    assert.match(sharedRule(source, [feat]), /--borde:\s*var\(--tono/);
    for (const [index, color] of ['accent', 'azul', 'verde', 'rojo', 'violeta', 'cian', 'accent'].entries()) {
      assert.match(source, new RegExp(`\\.feats>\\.feat:nth-child\\(${index + 1}\\)\\{--tono:var\\(--${color}\\)\\}`));
    }
    assert.match(ownRule(source, `${chip}::before`), /inset:\s*-1px/);
    assert.match(sharedRule(source, ['.chip']), /border-radius:\s*999px/);
    assert.ok(!/\.feat:hover\s*\{|\.feats>\.feat:nth-child\(\d+\):hover\s*\{/.test(source), 'legacy feat hover rules are replaced');
  });

  it(`${lang}: hover and keyboard focus reuse the shared four-second ring and static fallback`, () => {
    assert.match(sharedRule(source, active.map((s) => `${s}::before`)), /opacity:\s*1/);
    const animated = sharedRule(source, active.map((s) => `html.ang-animable ${s}::before`));
    assert.match(animated, /conic-gradient\(from var\(--ang\)/);
    assert.match(animated, /var\(--borde/);
    assert.match(animated, /mask-composite:\s*exclude/);
    assert.match(animated, /animation:\s*luz-borde\s+4s\s+linear\s+infinite/);
    assert.equal((source.match(/animation:\s*luz-borde\b/g) || []).length, 1);
    assert.equal((source.match(/@property\s+--ang/g) || []).length, 1);
    assert.equal((source.match(/@keyframes\s+luz-borde/g) || []).length, 1);
  });

  it(`${lang}: only experience cards lift, hide their top edge and retain the card accent and reveal`, () => {
    const interaction = sharedRule(source, [featActive, ...existingActive]);
    assert.match(interaction, /border-top-color:\s*transparent/);
    assert.match(interaction, /background:\s*var\(--card-2\)/);
    assert.match(interaction, /box-shadow:\s*0 14px 40px -18px var\(--sombra\),\s*0 0 18px -7px var\(--borde/);
    assert.match(sharedRule(source, [lift]), /transform:\s*translateY\(-3px\)/);
    assert.ok(source.indexOf(lift) > source.indexOf('.js .rv.in{'), 'lift beats the reveal reset');
    assert.doesNotMatch(sharedRule(source, [frameActive]), /transform\s*:/);
    assert.doesNotMatch(sharedRule(source, [chipActive]), /transform\s*:/);
    assert.match(source, /\.js \.rv\.in\{opacity:1;transform:none;/);
    assert.match(source, /\{sel:'\.feats',hueco:12\}/);
    assert.doesNotMatch(sharedRule(source, [lift]), /\bscale\s*\(/);
    assert.match(source, /<article class="case card rv tile feat">/, 'featured project remains a case card');
  });

  it(`${lang}: quiet, reduced motion and contrast preserve static rings and outlines`, () => {
    const quiet = active.map((s) => `html.a11y-quieto.ang-animable ${s}::before`);
    const animated = active.map((s) => `html.ang-animable ${s}::before`);
    for (const rule of [sharedRule(source, quiet), sharedRule(reducedMotionBlocks(source), animated)]) {
      assert.match(rule, /animation:\s*none/);
      assert.match(rule, /background:\s*var\(--borde/);
    }
    assert.match(sharedRule(source, [`html.a11y-quieto ${featActive}`]), /transform:\s*none/);
    assert.match(sharedRule(reducedMotionBlocks(source), [lift]), /transform:\s*none/);
    assert.match(sharedRule(source, [`html.a11y-contraste ${featActive}`, `html.a11y-contraste ${chipActive}`]), /inset[^;]*var\(--line\)/);
    assert.match(sharedRule(source, ['html.a11y-contraste .carrusel .marco']), /border[^;]*var\(--line\)/);
  });

  it(`${lang}: experience hover is immediate while ordinary reveal staggering is preserved`, () => {
    const script = source.match(/<script>\s*(\(function\(\)\{\s*var d=document, els=[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
    assert.ok(script);
    const selectors = ['other', '#experiencia .feats>.feat', '#proyectos .case', '#servicios .card.serv', 'other'];
    const elements = selectors.map((selector) => ({
      style: {}, matches: (query) => query === selector,
      getBoundingClientRect: () => ({ top: 0 }),
      classList: { add() {}, contains: () => true },
    }));
    const document = { querySelectorAll: (s) => s === '.rv' ? elements : [], getElementById: () => null };
    function IntersectionObserver() { this.observe = () => {}; this.unobserve = () => {}; }
    vm.runInNewContext(script, { document, window: { innerHeight: 800, IntersectionObserver }, IntersectionObserver, setTimeout() {} });
    assert.equal(elements[0].style.transitionDelay, '0ms');
    assert.equal(elements[1].style.transitionDelay, '45ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[2].style.transitionDelay, '90ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[3].style.transitionDelay, '135ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[4].style.transitionDelay, '180ms');
  });
}
