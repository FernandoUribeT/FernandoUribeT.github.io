'use strict';

// S11 (T12) superseded the uniform "Problema / Qué hice / Resultado" rows: the
// 11 cases now live inside the "Bento destacado" mosaic (see casos-bento.test.js).
// This file keeps only the guarantees that still hold verbatim:
//   - every original project link stays inside #proyectos;
//   - the case-field label token stays readable (never --fg-faint).
// The row-shape / three-dt-fields / demo→featured→unbadged ordering assertions
// moved to casos-bento.test.js, which pins the new bento structure.

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = {
  es: {
    file: 'index.html',
    hrefs: [
      '/demos/calendario/',
      '/demos/expedientes/',
      '/demos/revision/',
      '/demos/qr/',
      'https://github.com/FernandoUribeT/fleet-maintenance',
      'https://github.com/FernandoUribeT/dof-scraper',
      'https://github.com/FernandoUribeT/dof-watch',
      'https://github.com/FernandoUribeT/simulador-ensamblaje-unity',
      'https://github.com/FernandoUribeT/appsalon-mvc-php',
    ],
  },
  en: {
    file: path.join('en', 'index.html'),
    hrefs: [
      '/demos/calendar/',
      '/demos/records/',
      '/demos/inspection/',
      '/demos/qr-en/',
      'https://github.com/FernandoUribeT/fleet-maintenance',
      'https://github.com/FernandoUribeT/dof-scraper',
      'https://github.com/FernandoUribeT/dof-watch',
      'https://github.com/FernandoUribeT/simulador-ensamblaje-unity',
      'https://github.com/FernandoUribeT/appsalon-mvc-php',
    ],
  },
};

function proyectosSegment(source) {
  const match = source.match(/<section id="proyectos"[\s\S]*?<\/section>/);
  assert.ok(match, 'expected a #proyectos section');
  return match[0];
}

for (const [lang, p] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, p.file), 'utf8');
  const seg = proyectosSegment(source);

  it(`${lang}: every original project link href is still present inside #proyectos`, () => {
    for (const href of p.hrefs) {
      assert.ok(seg.includes(`href="${href}"`), `expected ${href} to remain in #proyectos`);
    }
  });
}

it('keeps case field labels on a readable token, not --fg-faint', () => {
  for (const file of ['index.html', path.join('en', 'index.html')]) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const rule = source.match(/\.case dt\{([^}]*)\}/)?.[1] ?? '';
    assert.match(rule, /--fg-dim/, `${file}: .case dt should resolve to a readable token (was accent-tinted --borde)`);
    assert.doesNotMatch(rule, /--fg-faint/, `${file}: .case dt must not use --fg-faint`);
  }
});