'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = {
  es: {
    source: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
    labels: ['Problema', 'Qué hice', 'Resultado'],
    demo: 'Demo en vivo',
    featured: 'Destacado',
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
    source: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
    labels: ['Problem', 'What I did', 'Result'],
    demo: 'Live demo',
    featured: 'Featured',
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

function caseRows(segment) {
  return [...segment.matchAll(/<article class="case[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
}

function clean(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const [lang, p] of Object.entries(pages)) {
  const seg = proyectosSegment(p.source);
  const rows = caseRows(seg);

  it(`${lang}: #proyectos contains exactly 11 uniform case rows`, () => {
    assert.equal(rows.length, 11, `expected 11 case rows, got ${rows.length}`);
  });

  it(`${lang}: every case row has a heading and exactly the three labelled fields, all non-empty`, () => {
    for (const row of rows) {
      assert.match(row, /<h3>[\s\S]*?<\/h3>/, 'case row must carry a heading');
      const dts = [...row.matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map((m) => clean(m[1]));
      assert.deepEqual(dts, p.labels, `expected labelled fields ${p.labels.join(' / ')}`);
      const dds = [...row.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((m) => clean(m[1]));
      assert.equal(dds.length, 3, 'must have exactly three fields');
      for (const dd of dds) assert.ok(dd.length > 0, 'every field must be non-empty');
    }
  });

  it(`${lang}: every original project link href is still present inside #proyectos`, () => {
    for (const href of p.hrefs) {
      assert.ok(seg.includes(`href="${href}"`), `expected ${href} to remain in #proyectos`);
    }
  });

  it(`${lang}: live-demo cases come first, then featured, then unbadged`, () => {
    const badgeOf = (row) => row.match(/<span class="badge[^"]*">([\s\S]*?)<\/span>/)?.[1] ?? null;
    for (let i = 0; i < 4; i++) {
      assert.match(badgeOf(rows[i]) ?? '', new RegExp(p.demo), `row ${i} should be a live demo`);
    }
    for (let i = 4; i < 7; i++) {
      assert.match(badgeOf(rows[i]) ?? '', new RegExp(p.featured), `row ${i} should be featured`);
    }
    for (let i = 7; i < rows.length; i++) {
      assert.equal(badgeOf(rows[i]), null, `row ${i} should carry no badge`);
    }
  });
}
it('keeps case field labels on a readable token, not --fg-faint', () => {
  for (const file of ['index.html', path.join('en', 'index.html')]) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const rule = source.match(/\.case dt\{([^}]*)\}/)?.[1] ?? '';
    assert.match(rule, /color:var\(--fg-dim\)/, `${file}: .case dt should use --fg-dim`);
  }
});
