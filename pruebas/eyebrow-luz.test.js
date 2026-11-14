'use strict';

// T20 — S22/S5: the same decorative line sweeps on both portfolio pages.
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = {
  es: { file: 'index.html', labels: ['Para negocios', 'Servicios'] },
  en: { file: path.join('en', 'index.html'), labels: ['For businesses', 'Services'] },
};

function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^{}]*)\\}`, 'm'))?.[1] ?? '';
}

for (const [lang, { file, labels }] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');

  it(`${lang}: every section eyebrow keeps its existing thin line and service labels`, () => {
    const line = rule(source, '.eyebrow::after');
    assert.match(line, /content:\s*""/);
    assert.match(line, /height:\s*1px/);
    assert.match(line, /flex:\s*1/);
    assert.match(line, /background:\s*linear-gradient\(90deg,\s*var\(--line\),\s*transparent\)/);
    assert.equal((source.match(/class="eyebrow rv"/g) ?? []).length, 7);
    const services = source.match(/<section id="servicios"[\s\S]*?<\/section>/)?.[0] ?? '';
    for (const label of labels) assert.ok(services.includes(`>${label}<`), label);
  });

  it(`${lang}: the shared line has one short gold gleam on an infinite animation`, () => {
    const gleam = rule(source, 'html:not(.a11y-quieto) .eyebrow::after');
    assert.match(gleam, /background-image:\s*linear-gradient\(90deg,\s*transparent,\s*var\(--glow\)\s+25%,\s*var\(--accent\)\s+50%,\s*var\(--glow\)\s+75%,\s*transparent\)\s*,\s*linear-gradient\(90deg,\s*var\(--line\),\s*transparent\)/);
    assert.match(gleam, /background-size:\s*80px\s+100%,\s*100%\s+100%/);
    assert.match(gleam, /background-repeat:\s*no-repeat/);
    assert.match(gleam, /animation:\s*destello-linea\s+5s\s+ease-in-out\s+infinite/);
    assert.doesNotMatch(gleam, /(?:^|;)\s*(?:width|height|flex|margin|padding|transform)\s*:/);
  });

  it(`${lang}: the gleam travels left to right and pauses off the line`, () => {
    const frames = source.match(/@keyframes\s+destello-linea\s*\{((?:[^{}]*\{[^{}]*\})+)\s*\}/)?.[1] ?? '';
    assert.match(frames, /0%\s*\{\s*background-position:\s*-80px\s+0\s*,\s*0\s+0\s*;?\s*\}/);
    assert.match(frames, /80%\s*,\s*100%\s*\{\s*background-position:\s*calc\(100%\s*\+\s*80px\)\s+0\s*,\s*0\s+0\s*;?\s*\}/);
  });

  it(`${lang}: quiet mode and reduced motion leave the original line plain`, () => {
    assert.ok(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{\s*html:not\(\.a11y-quieto\)\s+\.eyebrow::after\s*\{[^{}]*animation:\s*destello-linea[^{}]*\}\s*\}/.test(source), 'animation must be gated by both motion preferences');
  });
}
