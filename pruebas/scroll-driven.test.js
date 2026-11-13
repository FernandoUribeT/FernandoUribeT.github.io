'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = {
  es: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
};

function scrollBlock(source) {
  return source.match(/<style id="scroll-driven">([\s\S]*?)<\/style>/)?.[1] ?? null;
}

function keyframes(block) {
  return [...block.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^}]*\})*)[^{}]*\}/g)].map((m) => m[1]);
}

it('ships the same scroll-driven block on the Spanish and English pages', () => {
  assert.ok(scrollBlock(pages.es), 'index.html should contain <style id="scroll-driven">');
  assert.equal(scrollBlock(pages.en), scrollBlock(pages.es));
});

for (const [lang, source] of Object.entries(pages)) {
  it(`${lang}: enables scroll timelines only with support and without reduced motion`, () => {
    const block = scrollBlock(source) ?? '';
    const supports = block.indexOf('@supports (animation-timeline: view())');
    const motion = block.indexOf('@media (prefers-reduced-motion: no-preference)');
    assert.ok(supports >= 0, 'timelines must sit behind @supports (animation-timeline: view())');
    assert.ok(motion > supports, 'timelines must also sit behind prefers-reduced-motion: no-preference');
    for (const rule of block.match(/[^{}]*\{[^{}]*animation-timeline[^{}]*\}/g) ?? []) {
      assert.match(rule, /html:not\(\.a11y-quieto\)/, `quiet mode must opt out: ${rule.trim()}`);
    }
  });

  it(`${lang}: reveals project cards with view() and shows reading progress with scroll(root)`, () => {
    const block = scrollBlock(source) ?? '';
    assert.match(block, /#proyectos \.card\.rv\s*\{[^}]*animation-timeline:\s*view\(\);[^}]*animation-range:/);
    assert.match(block, /nav::after\s*\{[^}]*animation-timeline:\s*scroll\(root\);/);
  });

  it(`${lang}: clips #proyectos without making it the cards' scroll container`, () => {
    // section{overflow:hidden} would make view() track the section instead of the page.
    assert.match(scrollBlock(source) ?? '', /#proyectos\s*\{\s*overflow:\s*clip;\s*\}/);
  });

  it(`${lang}: keyframes avoid transform so .card:hover keeps its lift`, () => {
    const frames = keyframes(scrollBlock(source) ?? '');
    assert.ok(frames.length >= 2, 'expected the card and progress keyframes');
    for (const frame of frames) assert.doesNotMatch(frame, /\btransform\s*:/);
  });

  it(`${lang}: card reveal never shrinks or pushes a card into its neighbour`, () => {
    // The masonry script sizes rows with getBoundingClientRect(), which includes scale,
    // and leaves a 16px gap ({sel:'.grid',hueco:16}) between stacked cards.
    const frame = (scrollBlock(source) ?? '').match(/@keyframes asoma-card\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    assert.ok(frame, 'expected @keyframes asoma-card');
    assert.doesNotMatch(frame, /\bscale\s*:/);
    assert.match(source, /\{sel:'\.grid',hueco:16\}/);
    for (const [, px] of frame.matchAll(/translate:\s*0\s+(\d+)px/g)) {
      assert.ok(Number(px) <= 16, `card translate ${px}px must not exceed the 16px masonry gap`);
    }
  });

  it(`${lang}: keeps the IntersectionObserver reveal as the fallback`, () => {
    assert.match(source, /\.js \.rv\{opacity:0;transform:translateY\(18px\)\}/);
    assert.match(source, /\.js \.rv\.in\{opacity:1;transform:none;/);
    assert.match(source, /html\.a11y-quieto \*,html\.a11y-quieto \*::before,html\.a11y-quieto \*::after\{animation:none!important;/);
  });
}
