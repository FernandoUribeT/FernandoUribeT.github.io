'use strict';

// T15 — S14/S15: case-tile interaction and compact featured badges, ES + EN.
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = { es: 'index.html', en: path.join('en', 'index.html') };

function cssRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...source.matchAll(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`, 'g'))];
  assert.ok(matches.length, `missing CSS rule: ${selector}`);
  return matches[0][1];
}

function reducedMotionBlocks(source) {
  const blocks = [];
  const pattern = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g;
  for (const match of source.matchAll(pattern)) {
    let depth = 1;
    let end = match.index + match[0].length;
    const start = end;
    while (depth && end < source.length) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
      end++;
    }
    blocks.push(source.slice(start, end - 1));
  }
  return blocks.join('\n');
}

for (const [lang, file] of Object.entries(pages)) {
  it(`${lang}: hover and keyboard focus replace the accent edge with an accessible moving border light`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const property = cssRule(source, '@property --ang');
    assert.match(property, /syntax:\s*["']<angle>["']/);
    assert.match(property, /inherits:\s*false/);
    assert.match(property, /initial-value:\s*0deg/);
    assert.match(source, /@keyframes\s+luz-borde\s*\{\s*from\s*\{\s*--ang:\s*0deg\s*;?\s*\}\s*to\s*\{\s*--ang:\s*360deg\s*;?\s*\}\s*\}/);

    const tile = cssRule(source, '#proyectos .case.card');
    assert.match(tile, /isolation:\s*isolate/, 'the ring stays behind tile content');
    const ring = cssRule(source, '#proyectos .case.card::before');
    assert.match(ring, /position:\s*absolute/);
    assert.match(ring, /border-radius:\s*inherit/);
    assert.match(ring, /border:\s*2px solid var\(--borde/, 'unsupported browsers get a static accent ring');
    assert.match(ring, /pointer-events:\s*none/);
    assert.match(ring, /z-index:\s*-1/);
    assert.match(ring, /opacity:\s*0/, 'the ring disappears on leave');

    const active = '#proyectos .case.card:is(:hover,:focus-within)';
    const activeTile = cssRule(source, active);
    assert.match(activeTile, /border-top-color:\s*transparent/);
    assert.match(activeTile, /box-shadow:[^;]*var\(--borde/, 'the glow uses the tile accent');
    assert.match(cssRule(source, `${active}::before`), /opacity:\s*1/);

    assert.match(source, /CSS\.registerProperty/, 'only animate when typed custom properties are supported');
    const animated = `html.ang-animable ${active}::before`;
    const animatedRing = cssRule(source, animated);
    assert.match(animatedRing, /conic-gradient\(from var\(--ang\)/);
    assert.match(animatedRing, /var\(--borde/);
    assert.match(animatedRing, /mask-composite:\s*exclude/);
    assert.match(animatedRing, /animation:\s*luz-borde\s+4s\s+linear\s+infinite/);

    const quiet = cssRule(source, `html.a11y-quieto.ang-animable ${active}::before`);
    const reduced = cssRule(reducedMotionBlocks(source), animated);
    for (const rule of [quiet, reduced]) {
      assert.match(rule, /animation:\s*none/);
      assert.match(rule, /background:\s*var\(--borde/, 'reduced motion has a complete static accent ring');
    }
    assert.match(cssRule(source, `html.a11y-contraste ${active}`), /inset[^;]*var\(--line\)/, 'contrast keeps a solid visible outline');
  });

  it(`${lang}: the animation falls back if CSS @property itself is unavailable`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const script = source.match(/<script>(document\.documentElement\.classList\.add\('js'\);[\s\S]*?)<\/script>/);
    assert.ok(script, 'the page initializes its progressive enhancement');
    const classesFor = (css, propertyRule) => {
      const classes = [];
      const document = { documentElement: { classList: { add: (name) => classes.push(name) } } };
      const window = { CSS: css, CSSPropertyRule: propertyRule };
      vm.runInNewContext(script[1], { document, window, CSS: css });
      return classes;
    };
    const api = { registerProperty() {} };
    assert.deepEqual(classesFor(api, undefined), ['js'], '@property unavailable: keep the static border');
    assert.deepEqual(classesFor({}, function CSSPropertyRule() {}), ['js'], 'typed properties unavailable: keep the static border');
    assert.deepEqual(classesFor(api, function CSSPropertyRule() {}), ['js', 'ang-animable'], 'typed @property support enables the animation');
  });

  it(`${lang}: the featured compact badge is a small, outlined mono pill`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const badge = cssRule(source, '.case .badge.alt');
    assert.match(badge, /font:\s*700\s+\.?0?6875rem\s*\/\s*1(?:\.25)?\s+var\(--mono\)/);
    assert.match(badge, /text-transform:\s*uppercase/);
    assert.match(badge, /letter-spacing:\s*\.08em/);
    assert.match(badge, /border:\s*1px solid var\(--accent\)/);
    assert.match(badge, /color:\s*var\(--accent\)/);
    assert.match(badge, /background:\s*transparent/);
    assert.match(badge, /padding:\s*3px 8px/);
    assert.match(badge, /border-radius:\s*6px/);
    assert.match(badge, /align-self:\s*flex-start/);
    assert.match(source, /<span class="badge alt">(?:Destacado|Featured)<\/span>/);
  });

  it(`${lang}: row four's lone compact tile keeps its natural height at every width`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const selector = '#proyectos .bento-compacts>.case:only-child';
    assert.match(cssRule(source, selector), /align-self:\s*start/);
    assert.ok(source.indexOf(selector) < source.indexOf('@media(max-width:1000px)'), 'the height rule applies before responsive breakpoints');
    const projects = source.match(/<section id="proyectos"[\s\S]*?<\/section>/)[0];
    const rows = projects.split('<div class="bento-fila">').slice(1);
    assert.equal(rows.length, 4);
    assert.match(rows[3], lang === 'es' ? /Pulsera de monitoreo cardiaco/ : /Heart-rate monitoring wearable/);
    assert.equal((rows[3].match(/class="case card rv tile comp"/g) || []).length, 1);
    for (const row of rows.slice(0, 3)) {
      assert.equal((row.match(/class="case card rv tile comp"/g) || []).length, 2, 'the earlier paired rows retain their shared height');
    }
  });
}
