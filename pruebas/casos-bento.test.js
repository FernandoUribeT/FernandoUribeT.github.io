'use strict';

// T14 — S13: four alternating demo/compact rows in ES + EN.
// S12 still requires sr-only problem text, no expansion, the shared hover/focus
// video helper and no holes; screenshots still follow the claro/contraste swap.

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = {
  es: {
    file: 'index.html',
    featHref: '/demos/calendario/',
    // real screenshots used by the four demo tiles (featured + 3 medium)
    demoImgs: ['/img/calendario.webp', '/img/expedientes.webp', '/img/revision.webp', '/img/qr.webp'],
    prob: 'Problema',
    // every link each case already had must be kept (demos + repos)
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
    featHref: '/demos/calendar/',
    demoImgs: ['/img/calendar.webp', '/img/expedientes.webp', '/img/revision.webp', '/img/qr.webp'],
    prob: 'Problem',
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

function tiles(segment) {
  return [...segment.matchAll(/<article class="case[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
}

function mediaBlocks(source, width) {
  const bodies = [];
  const prefix = `@media(max-width:${width}px){`;
  let from = 0;
  while (true) {
    const i = source.indexOf(prefix, from);
    if (i === -1) break;
    const open = i + prefix.length;
    let depth = 1;
    let k = open;
    for (; k < source.length && depth > 0; k++) {
      if (source[k] === '{') depth++;
      else if (source[k] === '}') depth--;
    }
    bodies.push(source.slice(open, k - 1));
    from = k;
  }
  return bodies;
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

it('ES and EN group all cases into four demo-first rows in the requested order', () => {
  for (const [lang, p] of Object.entries(pages)) {
    const source = fs.readFileSync(path.join(root, p.file), 'utf8');
    const seg = proyectosSegment(source);
    const groups = seg.split('<div class="bento-fila">').slice(1);
    const expected = [
      [p.hrefs[0], p.hrefs[4], p.hrefs[5]],
      [p.hrefs[1], p.hrefs[6], lang === 'es' ? 'ODS 9 e Innovación' : 'SDG 9 and Innovation'],
      [p.hrefs[2], p.hrefs[7], p.hrefs[8]],
      [p.hrefs[3], lang === 'es' ? 'Pulsera de monitoreo cardiaco' : 'Heart-rate monitoring wearable'],
    ];
    assert.equal(groups.length, 4, `${lang}: expected four row wrappers`);
    for (let i = 0; i < expected.length; i++) {
      const group = groups[i];
      const cards = tiles(group);
      assert.equal(cards.length, expected[i].length, `${lang}: row ${i + 1} card count`);
      assert.equal((group.match(/<div class="bento-compacts">/g) || []).length, 1, `${lang}: row ${i + 1} has one compact stack`);
      assert.match(cards[0], /<div class="shot" data-video>/, `${lang}: row ${i + 1} starts with its demo`);
      assert.ok(cards[0].includes(`src="${p.demoImgs[i]}"`), `${lang}: row ${i + 1} uses its demo screenshot`);
      assert.equal(cards.filter((card) => /<div class="shot" data-video>/.test(card)).length, 1);
      cards.forEach((card, j) => {
        assert.ok(card.includes(expected[i][j]), `${lang}: row ${i + 1}, card ${j + 1}`);
        if (j > 0) assert.match(card, /class="case card rv tile comp"/, `${lang}: remaining cards are compact`);
      });
      assert.ok(group.indexOf(cards[0]) < group.indexOf('<div class="bento-compacts">'), `${lang}: demo precedes its compacts in reading order`);
      for (const compact of cards.slice(1)) {
        assert.ok(group.indexOf(compact) > group.indexOf('<div class="bento-compacts">'), `${lang}: compact belongs to its stack`);
      }
    }
  }
});

for (const [lang, p] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, p.file), 'utf8');
  const seg = proyectosSegment(source);
  const rows = tiles(seg);
  const demoRows = rows.filter((r) => /data-base/.test(r));
  const mediumRows = rows.filter(
    (r) => /data-base/.test(r) && !r.includes('class="case card rv tile feat"'),
  );
  const compRows = rows.filter((r) => r.includes('tile comp'));

  it(`${lang}: #proyectos keeps all 11 cases and not a single one is dropped`, () => {
    assert.equal(rows.length, 11, `expected 11 case tiles, got ${rows.length}`);
  });

  it(`${lang}: exactly one featured tile and it is the ${p.featHref} calendar`, () => {
    const feat = rows.filter((r) => r.includes('tile feat'));
    assert.equal(feat.length, 1, 'there must be exactly one featured tile');
    assert.ok(feat[0].includes(`href="${p.featHref}"`), 'featured tile must link to the calendar demo');
  });

  it(`${lang}: the 3 medium demo tiles use the real /img screenshots with alt, width/height, lazy`, () => {
    assert.equal(mediumRows.length, 3, `expected 3 medium demo tiles, got ${mediumRows.length}`);
    for (const row of mediumRows) {
      const imgs = [...row.matchAll(/<img\b([^>]*)>/g)].map((m) => m[1]);
      assert.equal(imgs.length, 1, 'a medium demo tile must carry exactly one screenshot');
      const attrs = imgs[0];
      assert.match(attrs, /src="\/(img|demos)\/[^"]+\.webp"/, 'screenshot must point at a real /img file');
      assert.match(attrs, /data-base="[^"]+"/, 'screenshot must carry data-base for the theme swap');
      assert.match(attrs, /\bwidth="\d+"/, 'screenshot needs a width attribute');
      assert.match(attrs, /\bheight="\d+"/, 'screenshot needs a height attribute');
      assert.match(attrs, /alt="[^"]+"/, 'screenshot needs a meaningful alt');
      assert.match(attrs, /loading="lazy"/, 'screenshot must be lazy-loaded');
    }
  });

  it(`${lang}: the four demo tiles use exactly the real /img screenshots in the carousel`, () => {
    const used = demoRows
      .flatMap((r) => [...r.matchAll(/src="(\/[^"]+\.webp)"/g)].map((m) => m[1]))
      .sort();
    assert.deepEqual(used, [...p.demoImgs].sort());
  });

  it(`${lang}: the other 7 cases become compact tiles (no screenshot)`, () => {
    assert.equal(compRows.length, 7, `expected 7 compact tiles, got ${compRows.length}`);
    for (const row of compRows) {
      assert.doesNotMatch(row, /<img\b/, 'compact tiles must not use a screenshot');
    }
  });

  it(`${lang}: every case keeps its original link`, () => {
    for (const href of p.hrefs) {
      assert.ok(seg.includes(`href="${href}"`), `expected ${href} to remain in #proyectos`);
    }
  });

  it(`${lang}: every tile shows its result as a non-empty headline and carries the full problem in the DOM, not aria-hidden`, () => {
    for (const row of rows) {
      const res = row.match(/<p class="res">([\s\S]*?)<\/p>/);
      assert.ok(res, 'every tile needs a result headline (.res)');
      assert.ok(clean(res[1]).length > 0, 'the result headline must be non-empty');
      const prob = row.match(/<dl class="prob">([\s\S]*?)<\/dl>/);
      assert.ok(prob, 'every tile keeps its problem text in the DOM (.prob)');
      assert.match(prob[1], new RegExp(p.prob), 'the problem block keeps its label');
      assert.doesNotMatch(prob[1], /aria-hidden/, `problem text must not be aria-hidden (${clean(prob[1]).slice(0, 24)}…)`);
    }
  });

  it(`${lang}: no CSS rule reveals the problem on hover / focus-within / hover:none`, () => {
    assert.doesNotMatch(source, /\.case:hover\s+\.prob/, 'hover must not reveal .prob');
    assert.doesNotMatch(source, /\.case:focus-within\s+\.prob/, 'focus must not reveal .prob');
    assert.doesNotMatch(source, /@media\(hover:none\)[^}]*\.prob/, 'touch must not reveal .prob');
    assert.doesNotMatch(source, /\.prob\{[^}]*opacity:\s*1/, 'no rule may force .prob visible');
  });

  it(`${lang}: the problem text stays in the DOM as visually-hidden (sr-only) content, not removed`, () => {
    assert.match(source, /\.case \.prob\{[^}]*clip/, '.prob must use the sr-only clip pattern');
    for (const row of rows) {
      assert.match(row, /<dl class="prob">/, 'every tile still carries its problem text');
    }
  });

  it(`${lang}: the four demo tiles are wired to the shared video helper`, () => {
    assert.equal(demoRows.length, 4, 'there are exactly 4 demo tiles');
    for (const row of demoRows) {
      assert.match(row, /<div class="shot" data-video>/, 'each demo .shot declares data-video for the helper');
    }
    const vid = source.match(/<script data-demo-videos>([\s\S]*?)<\/script>/);
    assert.ok(vid, 'a shared data-demo-videos helper must exist');
    assert.match(vid[1], /a11y-quieto/, 'the shared helper must not play in a11y-quieto');
    assert.match(vid[1], /prefers-reduced-motion/, 'the shared helper must not play with reduced motion');
    assert.match(vid[1], /\.carrusel/, 'the carousel uses the same shared helper');
    assert.match(vid[1], /#proyectos \.shot\[data-video\]/, 'the bento demo tiles are wired through the helper');
  });

  it(`${lang}: alternating rows stretch their two columns and flip even rows in CSS`, () => {
    assert.doesNotMatch(source, /<style>\s*<style>/, 'no doubled <style> tag (it swallows the next CSS rule)');
    assert.match(source, /\.grid\.bento\{[^}]*grid-template-columns:\s*1fr/, 'the outer grid is one column of rows');
    assert.match(source, /\.bento-fila\{[^}]*grid-template-columns:\s*minmax\(0,1\.4fr\) minmax\(0,1fr\)[^}]*align-items:\s*stretch/, 'desktop columns stretch with a wider demo');
    assert.match(source, /\.bento-fila:nth-child\(even\)\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) minmax\(0,1\.4fr\)/, 'even rows give the demo the wider right column');
    assert.match(source, /\.bento-fila:nth-child\(even\)>\.case\{[^}]*grid-column:\s*2[^}]*grid-row:\s*1/, 'the even-row demo is on the right');
    assert.match(source, /\.bento-fila:nth-child\(even\)>\.bento-compacts\{[^}]*grid-column:\s*1[^}]*grid-row:\s*1/, 'the even-row compacts are on the left');
    assert.match(source, /\.bento-compacts\{[^}]*grid-auto-rows:\s*1fr[^}]*gap:\s*16px/, 'stacked compact cards share the available height with a 16px gap');
    assert.doesNotMatch(source, /\.grid\.bento\{[^}]*grid-auto-flow:\s*dense/, 'the obsolete dense mosaic is gone');
    assert.doesNotMatch(source, /\.case\.(?:feat|comp\.wide|tile:not\(\.comp\))\{[^}]*grid-column:/, 'old featured/demo/wide spans are gone');
    assert.doesNotMatch(seg, /class="[^"]*\bwide\b/, 'no obsolete wide class remains');
  });

  it(`${lang}: at <=1000px the demo precedes two side-by-side compacts and a single compact spans both`, () => {
    const joined = mediaBlocks(source, 1000).join('\n');
    assert.match(joined, /\.bento-fila,\.bento-fila:nth-child\(even\)\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
    assert.match(joined, /\.bento-fila:nth-child\(even\)>\.case,\.bento-fila:nth-child\(even\)>\.bento-compacts\{[^}]*grid-column:\s*auto[^}]*grid-row:\s*auto/, 'reset the desktop flip to follow DOM order');
    assert.match(joined, /\.bento-compacts\{[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
    assert.match(joined, /\.bento-compacts>\.case:only-child\{[^}]*grid-column:\s*1\/-1/);
  });

  it(`${lang}: at <=620px the compact cards collapse to one column`, () => {
    const joined = mediaBlocks(source, 620).join('\n');
    assert.match(joined, /\.bento-compacts\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
  });

  it(`${lang}: the claro/contraste image-swap covers the new screenshots`, () => {
    // the swap runs over every img[data-base] (global), and every demo tile opt-in via data-base
    assert.match(source, /document\.querySelectorAll\(['"]img\[data-base\]/);
    for (const row of demoRows) assert.match(row, /data-base="[^"]+"/);
  });
}