'use strict';

// T21 — S23/S5: moving light belongs to the full-width dotted panels, not the eyebrows.
// Panels = #experiencia, #servicios, #stack, footer (all with background:var(--panel)
// and the shared dot pattern; #proyectos/#formacion are transparent and dots off).
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = { es: 'index.html', en: path.join('en', 'index.html') };
const sectionPanels = ['experiencia', 'servicios', 'stack'];
const layerSet = [
  ':is(#experiencia,#servicios,#stack)>.panel-luz',
  'footer>.panel-luz',
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
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, header, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.every((selector) => splitSelectors(header).includes(selector))) return body;
  }
  assert.fail(`missing shared CSS rule for: ${selectors.join(' | ')}`);
}

function bodyFor(source, selector) {
  const start = source.indexOf(`${selector}{`);
  assert.notEqual(start, -1, `missing CSS rule: ${selector}`);
  const open = start + selector.length;
  let depth = 1;
  let end = open + 1;
  while (depth && end < source.length) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
    end++;
  }
  assert.equal(depth, 0, `unclosed CSS rule: ${selector}`);
  return source.slice(open + 1, end - 1);
}

function lights(source) {
  const match = source.match(/<style id="panel-luz">([\s\S]*?)<\/style>/);
  assert.ok(match, 'the shared panel edge light stylesheet exists');
  return match[1];
}

for (const [lang, file] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');

  it(`${lang}: every full-width dotted panel carries one decorative, isolated layer`, () => {
    for (const id of sectionPanels) {
      const section = source.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] ?? '';
      assert.match(section, /^\s*<span class="panel-luz" aria-hidden="true"><\/span>/, `${id}: layer is the first child and decorative`);
      assert.equal((section.match(/class="panel-luz"/g) || []).length, 1, `${id}: exactly one layer`);
    }
    const footer = source.match(/<footer>([\s\S]*?)<\/footer>/)?.[1] ?? '';
    assert.match(footer, /^\s*<span class="panel-luz" aria-hidden="true"><\/span>/, 'footer: layer is the first child and decorative');
    assert.equal((footer.match(/class="panel-luz"/g) || []).length, 1, 'footer: exactly one layer');

    const css = lights(source);
    const surface = sharedRule(css, layerSet);
    assert.match(surface, /position:\s*absolute/);
    assert.match(surface, /inset:\s*0/);
    assert.match(surface, /z-index:\s*0/);
    assert.match(surface, /pointer-events:\s*none/);
    assert.match(surface, /overflow:\s*hidden/);
    assert.match(source, /section>\*,footer>\*\{position:relative;z-index:1\}/, 'content remains above the decoration');
  });

  it(`${lang}: top and bottom edges sweep in opposite directions, with gold and soft glow`, () => {
    const css = lights(source);
    const top = sharedRule(css, [':is(#experiencia,#servicios,#stack)>.panel-luz::before', 'footer>.panel-luz::before']);
    const bottom = sharedRule(css, [':is(#experiencia,#servicios,#stack)>.panel-luz::after', 'footer>.panel-luz::after']);
    for (const rule of [top, bottom]) {
      assert.match(rule, /position:\s*absolute/);
      assert.match(rule, /height:\s*1px/, 'the line is 1px tall');
      assert.match(rule, /width:\s*clamp\(/, 'the bright segment is short');
      assert.match(rule, /linear-gradient\([^;]*transparent[^;]*var\(--accent\)[^;]*transparent/);
      assert.match(rule, /box-shadow:[^;]*var\(--glow\)/);
      assert.match(rule, /animation:\s*luz-panel\s+6s\s+ease-in-out\s+infinite/);
    }
    assert.match(top, /top:\s*0/);
    assert.match(bottom, /bottom:\s*0/);
    assert.match(bottom, /animation:\s*luz-panel\s+6s\s+ease-in-out\s+infinite\s+reverse/);
    const frames = bodyFor(css, '@keyframes luz-panel');
    assert.match(bodyFor(frames, 'from'), /transform:\s*translateX\(-100%\)/);
    assert.match(bodyFor(frames, 'to'), /transform:\s*translateX\(100vw\)/);
    assert.doesNotMatch(frames, /(?:left|right|width|height|transform-origin|background-position)\s*:/, 'movement animates only transform');
  });

  it(`${lang}: quiet mode and reduced motion remove the animated edges`, () => {
    const css = lights(source);
    assert.match(bodyFor(css, 'html.a11y-quieto .panel-luz'), /display:\s*none/);
    const reduced = bodyFor(css, '@media(prefers-reduced-motion:reduce)');
    assert.match(bodyFor(reduced, '.panel-luz'), /display:\s*none/);
  });

  it(`${lang}: panel geometry, eyebrow lines and existing dotted textures stay intact`, () => {
    for (const selector of ['#experiencia,#stack', '#servicios']) {
      const rule = bodyFor(source, selector);
      assert.match(rule, /background:\s*var\(--panel\)/);
      assert.match(rule, /overflow:\s*hidden/);
      assert.match(rule, /margin-inline:\s*calc\(50% - 50vw\)/);
      assert.match(rule, /padding-inline:\s*calc\(50vw - 50%\)/);
    }
    assert.match(bodyFor(source, 'footer'), /background:\s*var\(--panel\)/);
    const eyebrow = bodyFor(source, '.eyebrow::after');
    assert.match(eyebrow, /linear-gradient\(90deg,var\(--line\),transparent\)/);
    assert.doesNotMatch(eyebrow, /animation/);
    const texture = bodyFor(source, 'section::before,footer::before');
    assert.match(texture, /pointer-events:none/);
    assert.match(texture, /z-index:0/);
    assert.match(texture, /background-image:url\("data:image\/svg\+xml/);
    assert.match(texture, /background-size:120px 120px;opacity:\.22/);
    assert.match(bodyFor(source, 'html.a11y-claro section::before,html.a11y-claro footer::before'), /opacity:\.05/);
    assert.match(bodyFor(source, 'html.a11y-contraste section::before,html.a11y-contraste footer::before'), /display:none/);
    if (lang === 'es') {
      const dots = source.match(/section::after\{content:"";[^}]+\}/)?.[0] ?? '';
      assert.match(dots, /pointer-events:none;z-index:-1;background-image:url\("data:image\/svg\+xml/);
      assert.match(dots, /background-size:120px 120px;opacity:\.24/);
      assert.match(bodyFor(source, 'html.a11y-claro section::after'), /opacity:\.05/);
      assert.match(bodyFor(source, 'html.a11y-contraste section::after'), /display:none/);
    }
  });
}