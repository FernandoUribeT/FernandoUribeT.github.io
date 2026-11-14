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

// T9 — the redesign must reuse the original per-item accent palette
// (design/system.md, present on origin/main and still on the current pages):
// azul → verde → rojo → violeta → cian, cycling by nth-child.
const PALETA = ['--azul', '--verde', '--rojo', '--violeta', '--cian'];
const colorAt = (nth) => PALETA[(nth - 1) % PALETA.length]; // nth is 1-based

// Rules of the exact form `SEL:nth-child(N){--borde:var(--COLOR)}` (minified).
function nthRules(source, selectorFragment) {
  const esc = selectorFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `${esc}\\((\\d+)\\)\\{--borde:var\\((${PALETA.join('|')})\\)\\}`,
    'g',
  );
  return [...source.matchAll(re)].map((m) => ({ nth: +m[1], color: m[2] }));
}

function waFabPath(source) {
  const m = source.match(/<a class="wa-fab"[\s\S]*?<path d="([^"]*)"/);
  assert.ok(m, 'expected the .wa-fab link with its WhatsApp path');
  return m[1];
}

function waLinks(source) {
  return [...source.matchAll(/<a [^>]*href="https:\/\/wa\.me[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map(
    (m) => m[1],
  );
}

for (const [lang, source] of Object.entries(pages)) {
  it(`${lang}: every case keeps its original accent after being grouped into alternating rows`, () => {
    // Colors follow the original case order (four demos, then seven compacts),
    // not the new DOM order. Check the selector for each actual position.
    const positions = [
      [1, null], [2, null], [3, null], [4, null],
      [1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2], [4, 1],
    ];
    positions.forEach(([row, compact], i) => {
      const selector = `#proyectos .grid .bento-fila:nth-child(${row})` +
        (compact === null ? '>.case' : ` .bento-compacts>.case:nth-child(${compact})`);
      assert.ok(source.includes(`${selector}{--borde:var(${colorAt(i + 1)})}`), `${selector} should use ${colorAt(i + 1)}`);
    });
    // the treatment: colored left border (same width/style as .feat) and a small
    // colored accent (the dt label) plus the .feat-style hover background.
    assert.ok(
      source.includes('.case.card{border-top:3px solid var(--borde,var(--line-2))}'),
      'case rows need a 2px left border fed by --borde',
    );
    assert.ok(
      /#proyectos \.case\.card:is\(:hover,:focus-within\)\{[^}]*background:var\(--card-2\)[;}]/.test(source),
      'case rows mirror .feat hover and keyboard focus with the card-2 background',
    );
    assert.ok(
      source.includes('.case dt{color:var(--borde,var(--fg-dim))}'),
      'the dt label must be tinted with the row accent',
    );
  });

  it(`${lang}: service cards cycle the same palette for all 6 cards`, () => {
    const rules = nthRules(source, '.svc a.card.serv:nth-child');
    const byNth = new Map(rules.map((r) => [r.nth, r.color]));
    assert.equal(rules.length, 6, 'expected the 6 service cards, each with its accent rule');
    for (let nth = 1; nth <= 6; nth++) {
      assert.equal(byNth.get(nth), colorAt(nth), `service nth-child(${nth}) should use ${colorAt(nth)}`);
    }
    assert.ok(
      source.includes('.svc a.card.serv{border-top:3px solid var(--borde,var(--line-2))}'),
      'service cards need a 2px left border fed by --borde',
    );
    assert.ok(
      /\.svc a\.card\.serv:hover\{background:var\(--card-2\)[;}]/.test(source),
      'service cards mirror .feat hover with the card-2 background',
    );
    assert.ok(
      source.includes('.svc a.card.serv h3{color:var(--borde,var(--fg))}'),
      'the service heading must be tinted with the card accent',
    );
  });

  it(`${lang}: employer door uses --azul and business door --verde`, () => {
    const rules = nthRules(source, '.doors .door:nth-child');
    assert.deepEqual(
      rules
        .sort((a, b) => a.nth - b.nth)
        .map((r) => r.color),
      ['--azul', '--verde'],
      'employer door (1) must be azul and business door (2) verde',
    );
    assert.ok(
      source.includes('.doors .door{border-top:3px solid var(--borde,var(--line-2))}'),
      'doors need a 2px left border fed by --borde',
    );
    assert.ok(
      source.includes('.doors .door:hover{border-top-color:var(--borde)}'),
      'the door keeps its accent border on hover',
    );
    assert.ok(
      source.includes('.door li::before{background:var(--borde,var(--accent))}'),
      'the door bullet markers must be tinted with the door accent',
    );
  });

  it(`${lang}: every wa.me link carries the .wa-fab WhatsApp symbol and no link is just "WA"`, () => {
    const fab = waFabPath(source);
    const links = waLinks(source);
    assert.ok(links.length >= 3, 'expected the hero, price and footer WhatsApp CTAs (plus the FAB)');
    for (const inner of links) {
      assert.match(inner, /<svg[\s\S]*aria-hidden="true"/, 'WhatsApp icon must be aria-hidden');
      const p = inner.match(/<path d="([^"]*)"/);
      assert.ok(p, 'every wa.me link must contain an <svg> with the WhatsApp path');
      assert.equal(p[1], fab, 'the icon path must be the exact one used by .wa-fab');
      const text = inner.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      assert.notEqual(text, 'WA', 'no link may render the text "WA" alone');
    }
  });
}

it('the redesign adds no hex color literals to its own accent block', () => {
  for (const [lang, source] of Object.entries(pages)) {
    const m = source.match(/<style id="colores-originales">([\s\S]*?)<\/style>/);
    assert.ok(m, `${lang} page must keep the <style id="colores-originales"> accent block`);
    const hex = m[1].match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    assert.deepEqual(
      hex,
      [],
      `${lang} page accent block must use only var(--…) tokens, found: ${hex.join(', ')}`,
    );
  }
});

it('keeps the service accent border colored on hover, like the original .feat cards (ES + EN)', () => {
  for (const file of ['index.html', path.join('en', 'index.html')]) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    // S14 replaces the cases' colored top edge on hover; services are unchanged.
    assert.match(source, /\.svc a\.card\.serv:hover\{[^}]*border-top-color:var\(--borde\)/, `${file}: service cards keep their accent on hover`);
  }
});
