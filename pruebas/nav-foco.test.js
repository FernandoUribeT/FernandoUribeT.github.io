'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = {
  es: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
};

const fnNames = { es: 'desplazamientoFoco', en: 'focusScrollDelta' };

const GAP = 4; // separación que se deja entre el enlace enfocado y el enlace de idioma

// Enlace de la fila móvil: en ≤620px el nav es una fila desplazable horizontal y
// a.lang se pega a la derecha (position:sticky). Cuando el foco aterriza en un
// enlace que termina bajo a.lang, el navegador no lo saca a la vista (L12).
const NAV = { left: 0, right: 336 };   // nav.right medido a 360px
const LANG = { left: 294.4, right: 336 }; // a.lang sticky, medido a 360px

function extrae(source) {
  const script = source.match(/<script data-nav-foco>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'expected an extractable <script data-nav-foco>');
  const sandbox = { document: { querySelector: () => null } };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox);
  return sandbox;
}

function rect(es) {
  // VM realm plain objects carry a foreign prototype; copy into the test realm.
  return { left: es.left, right: es.right };
}

for (const [lang, source] of Object.entries(pages)) {
  const fn = extrae(source)[fnNames[lang]];
  assert.equal(typeof fn, 'function', `${fnNames[lang]} exposed by the inline script`);

  // Medidas a 360×800 (L12): ES Trayectoria 266–385 (@scrollLeft 0), Formación
  // 227–328 (@228); EN Experience 257–367, Education 226–327; a.lang 294.4–336.
  const medidos = {
    es: [
      { link: { left: 266, right: 385 }, scroll: 0 },
      { link: { left: 227, right: 328 }, scroll: 228 },
    ],
    en: [
      { link: { left: 257, right: 367 }, scroll: 0 },
      { link: { left: 226, right: 327 }, scroll: 228 },
    ],
  };

  it(`${lang}: un enlace que termina bajo a.lang se desplaza para quedar completo antes del hueco`, () => {
    for (const { link, scroll } of medidos[lang]) {
      const delta = fn(rect(link), rect(LANG), rect(NAV));
      assert.ok(delta > 0, `esperaba un delta positivo (got ${delta}) para el rect ${link.left}-${link.right} @scrollLeft ${scroll}`);
      // Tras scrollBy, el borde derecho del enlace queda <= lang.left - gap.
      assert.ok(
        link.right - delta <= LANG.left - GAP,
        `${fnNames[lang]}: tras el scroll el borde (${link.right - delta}) no debe pasar de ${LANG.left - GAP}`
      );
      assert.ok(link.left - delta >= NAV.left, 'y no debe cortarse por la izquierda');
    }
  });

  it(`${lang}: un enlace ya a la vista devuelve 0`, () => {
    // a la izquierda de a.lang y sin asomarse bajo él (izquierda y derecha claras).
    assert.equal(fn(rect({ left: 100, right: 200 }), rect(LANG), rect(NAV)), 0);
  });

  it(`${lang}: un enlace cortado por la izquierda devuelve un delta negativo que lo asoma`, () => {
    const delta = fn(rect({ left: -50, right: 60 }), rect(LANG), rect(NAV));
    assert.ok(delta < 0, `esperaba un delta negativo (got ${delta})`);
    assert.ok(-50 - delta >= NAV.left, `${fnNames[lang]}: tras el scroll el borde izquierdo llega por lo menos a nav.left`);
  });

  it(`${lang}: el propio enlace de idioma nunca se desplaza (0)`, () => {
    const langR = rect(LANG); // mismo rect pasado como link y como lang: el link es a.lang
    assert.equal(fn(langR, langR, rect(NAV)), 0);
  });

  it(`${lang}: hay cableado focusin en .navlinks, limitado a la fila desbordada y a ≤620px`, () => {
    const s = pages[lang];
    assert.match(s, /data-nav-foco/, 'script data-nav-foco presente');
    assert.match(s, /focusin/, 'escucha focusin');
    assert.match(s, /\.navlinks/, 'opera sobre .navlinks');
    assert.match(s, /\(\s*max-width:620px\s*\)/, 'gated por la media query de 620px');
    assert.match(s, /scrollWidth\s*[<>]=?\s*(?:nav\.)?clientWidth/, 'solo si la fila realmente desborda');
    assert.match(s, /scrollBy/, 'aplica vía nav.scrollBy');
  });
}
for (const [lang, source] of Object.entries(pages)) {
  it(`${lang}: rounds sub-pixel deltas away from zero so scrollBy actually moves`, () => {
    const fn = extrae(source)[fnNames[lang]];
    assert.equal(fn({ left: -0.1, right: 120 }, { left: 294.4, right: 336 }, { left: 0, right: 336 }), -1);
    assert.equal(fn({ left: 200, right: 290.5 }, { left: 294.4, right: 336 }, { left: 0, right: 336 }), 1);
  });
}
