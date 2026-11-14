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

const casos = {
  es: {
    pie: 'Calendario de viajes · nueve eventos de ejemplo, arrastre directo y ficha informativa',
    revisionHref: '/demos/revision/',
    count: 4,
  },
  en: {
    pie: 'Trip calendar · nine sample events, direct drag, and a compact info card',
    revisionHref: '/demos/inspection/',
    count: 4,
  },
};

// S9 (L16/L17): the carousel returns to the hero's right column beside the name,
// and the live inspection demo is removed from the home page. This file was
// rewritten from the old "hero shows the live inspection demo" suite (whose
// feature no longer exists on the home page); it now pins the S9 state instead
// of asserting the removed `.demo` + `<script data-demo-revision>` hero demo.
for (const [lang, source] of Object.entries(pages)) {
  const c = casos[lang];
  const header = source.match(/<header>([\s\S]*?)<\/header>/)?.[1];
  assert.ok(header, `${lang}: expected a <header> block`);
  const proyectos = source.match(/<section id="proyectos"[\s\S]*?<\/section>/)?.[0];
  assert.ok(proyectos, `${lang}: expected a #proyectos section`);

  it(`${lang}: the carousel is the hero's right column, beside the name inside .filas`, () => {
    const heroTxt = header.indexOf('<div class="hero-txt">');
    const carrusel = header.indexOf('<div class="carrusel');
    const doors = header.indexOf('<div class="doors');
    assert.ok(heroTxt > -1 && carrusel > -1 && doors > -1, 'hero blocks present');
    assert.ok(
      carrusel > heroTxt && carrusel < doors,
      'carousel sits after .hero-txt and before the audience doors, inside the hero',
    );
    assert.ok(header.includes(c.pie), 'first slide caption preserved verbatim');
    assert.ok(header.includes('class="dia activa"'), 'active slide marker preserved');
    assert.equal((header.match(/class="dia/g) || []).length, c.count, 'all slides are in the hero');
    assert.ok(header.includes('class="flecha izq"'), 'previous arrow preserved');
    assert.ok(header.includes('class="flecha der"'), 'next arrow preserved');
    assert.ok(header.includes(c.revisionHref), 'revisión slide still links to the full demo page');
  });

  it(`${lang}: #proyectos keeps its case grid but no longer contains the carousel`, () => {
    assert.ok(proyectos.includes('<div class="grid">'), 'case grid still present');
    assert.ok(!proyectos.includes('<div class="carrusel'), 'no carousel inside #proyectos');
    assert.ok(!source.includes('#proyectos .carrusel'), 'leftover #proyectos .carrusel rule removed');
  });

  it(`${lang}: the hero demo is gone from the home page (no .demo block, no revision script, no demo CSS)`, () => {
    assert.ok(!header.includes('<div class="demo rv"'), 'no .demo hero block');
    assert.ok(!source.includes('<script data-demo-revision>'), 'no inline revision script');
    assert.equal(
      (source.match(/querySelector\('.carrusel'\)/g) || []).length,
      2,
      'the two carousel JS lookups still target the single hero carousel',
    );
    for (const cls of ['.demo', '.demo-bar', '.demo-body', '.check', '.seg', '.unit', '.estado', '.demo-foot']) {
      assert.ok(!source.includes(cls), `no leftover ${cls} selector on the home page`);
    }
  });

  it(`${lang}: hero order holds — carousel → doors → stats`, () => {
    const carrusel = source.indexOf('<div class="carrusel');
    const doors = source.indexOf('<div class="doors');
    const stats = source.indexOf('<div class="stats rv">');
    assert.ok(carrusel > -1 && doors > -1 && stats > -1, 'hero blocks present');
    assert.ok(carrusel < doors && doors < stats, 'carousel sits before doors and stats');
  });
}