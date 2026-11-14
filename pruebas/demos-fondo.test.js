'use strict';

// T22 — S24/S5: the /servicios/facturacion/ page background is applied to all
// eight demo pages (ES + EN). It is a fixed live-grid canvas (.fondo-vivo)
// plus a decorative .luces layer, both aria-hidden, behind the demo UI
// (negative z-index + pointer-events:none), hidden in alto contraste and in
// a11y-quieto / prefers-reduced-motion, exactly as facturacion handles it.

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const demos = [
  { file: 'demos/calendario/index.html', lang: 'es', name: 'calendario' },
  { file: 'demos/calendar/index.html', lang: 'en', name: 'calendar' },
  { file: 'demos/expedientes/index.html', lang: 'es', name: 'expedientes' },
  { file: 'demos/records/index.html', lang: 'en', name: 'records' },
  { file: 'demos/revision/index.html', lang: 'es', name: 'revision' },
  { file: 'demos/inspection/index.html', lang: 'en', name: 'inspection' },
  { file: 'demos/qr/index.html', lang: 'es', name: 'qr' },
  { file: 'demos/qr-en/index.html', lang: 'en', name: 'qr-en' },
];

function ruleBody(source, selector) {
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

function inlineScripts(source) {
  const blocks = [];
  for (const match of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/src\s*=/.test(match[1])) blocks.push(match[2]);
  }
  return blocks;
}

for (const demo of demos) {
  const source = fs.readFileSync(path.join(root, demo.file), 'utf8');

  it(`${demo.lang} ${demo.name}: the facturacion backdrop layers open <body> exactly as on facturacion`, () => {
    assert.match(
      source,
      /<body>\s*<canvas class="fondo-vivo" aria-hidden="true"><\/canvas><div class="luces" aria-hidden="true"><i><\/i><i><\/i><i><\/i><\/div>/,
      'canvas + orb layer must sit right after <body>, mirroring facturacion'
    );
    assert.equal((source.match(/class="fondo-vivo"/g) || []).length, 1, 'exactly one canvas layer');
    assert.equal((source.match(/class="luces"/g) || []).length, 1, 'exactly one orb layer');
  });

  it(`${demo.lang} ${demo.name}: the grid canvas is fixed, full-screen, behind the UI and non-interactive`, () => {
    const rule = ruleBody(source, '.fondo-vivo');
    assert.match(rule, /position:\s*fixed/);
    assert.match(rule, /inset:\s*0/);
    assert.match(rule, /z-index:\s*-2/, 'negative z-index keeps it behind content');
    assert.match(rule, /pointer-events:\s*none/);
    assert.match(rule, /width:\s*100vw/);
    assert.match(rule, /height:\s*100vh/);
    assert.match(rule, /opacity:\s*\.42/);
  });

  it(`${demo.lang} ${demo.name}: the orb layer sits behind the UI and is inert like facturacion`, () => {
    const rule = ruleBody(source, '.luces');
    assert.match(rule, /position:\s*fixed/);
    assert.match(rule, /inset:\s*0/);
    assert.match(rule, /z-index:\s*-1/);
    assert.match(rule, /pointer-events:\s*none/);
    assert.match(rule, /overflow:\s*hidden/);
    assert.match(rule, /display:\s*none/);
  });

  it(`${demo.lang} ${demo.name}: a11y overrides hide the backdrop in contraste and quieto`, () => {
    assert.match(ruleBody(source, 'html.a11y-contraste .fondo-vivo'), /display:\s*none/);
    assert.match(
      ruleBody(source, 'html.a11y-quieto .fondo-vivo,html.a11y-quieto .luces'),
      /display:\s*none/
    );
  });

  it(`${demo.lang} ${demo.name}: the live-grid script drives the same canvas and stops in quieto`, () => {
    const script = inlineScripts(source).find((block) => block.includes('.fondo-vivo'));
    assert.ok(script, 'an inline script drives the fondo-vivo canvas');
    assert.match(script, /document\.querySelector\('\.fondo-vivo'\)/);
    assert.match(script, /requestAnimationFrame\(cuadro\)/);
    assert.match(script, /classList\.contains\('a11y-quieto'\)/);
    assert.match(script, /corriendo=false/);
    assert.match(script, /classList\.contains\('a11y-claro'\)/);
  });
}