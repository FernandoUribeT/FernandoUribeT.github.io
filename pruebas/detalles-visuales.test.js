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

// Return the full, brace-balanced body of the first CSS rule whose selector
// appears (as written) before its opening brace, e.g. firstRule(src, '.tag{').
function firstBody(source, selector) {
  const i = source.indexOf(selector);
  if (i === -1) return null;
  const open = i + selector.length; // source[open] is '{'
  let depth = 0;
  for (let k = open; k < source.length; k++) {
    if (source[k] === '{') depth++;
    else if (source[k] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, k);
    }
  }
  return null;
}

// Return the brace-balanced bodies of every @media(max-width:620px) block.
function media620Bodies(source) {
  const bodies = [];
  let from = 0;
  while (true) {
    const i = source.indexOf('@media(max-width:620px){', from);
    if (i === -1) break;
    const open = i + '@media(max-width:620px){'.length;
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

it('preserves the decorative pattern as a background-only layer (ES and EN)', () => {
  for (const [lang, source] of Object.entries(pages)) {
    // children stack above the ::before pattern (z-index + isolation on section)
    assert.match(source, /section>\*,footer>\*\s*\{position:relative;z-index:1\}/, `${lang}: section children must be positioned above the pattern`);
    assert.match(source, /section,footer\{[^}]*isolation:isolate[^}]*\}/, `${lang}: section must create a stacking context so the pattern can never sit in front of text`);
    // decorative only
    assert.match(source, /section::before,footer::before\{[^}]*pointer-events:none/, `${lang}: the pattern must be pointer-events:none`);
    // dark theme keeps the pattern
    assert.doesNotMatch(source, /section::before,footer::before\{[^}]*display:none/, `${lang}: the base pattern must stay visible in dark mode`);
    // high contrast keeps its hide behaviour (S5)
    assert.match(source, /html\.a11y-contraste section::before,html\.a11y-contraste footer::before\{[^}]*display:none/, `${lang}: high-contrast mode still hides the pattern`);
  }
});

it('keeps the claro pattern faint enough to never fight the text (ES and EN)', () => {
  for (const [lang, source] of Object.entries(pages)) {
    const block = firstBody(source, 'html.a11y-claro section::before,html.a11y-claro footer::before{');
    assert.ok(block, `${lang}: expected a claro section::before override`);
    const m = block.match(/opacity:([\d.]+)/);
    assert.ok(m, `${lang}: claro override must set an opacity`);
    assert.ok(Number(m[1]) <= 0.08, `${lang}: claro section::before opacity ${m[1]} is too strong`);
  }
});

it('gives wrapped tags a comfortable line-height (ES and EN)', () => {
  for (const [lang, source] of Object.entries(pages)) {
    const block = firstBody(source, '.tag{');
    assert.ok(block, `${lang}: expected a base .tag rule`);
    const lineHeights = [];
    const sh = block.match(/font:\s*[^;]*\/([\d.]+)\b/);
    if (sh) lineHeights.push(Number(sh[1]));
    for (const lh of block.matchAll(/line-height:\s*([\d.]+)/g)) lineHeights.push(Number(lh[1]));
    assert.ok(
      lineHeights.some((n) => n >= 1.3),
      `${lang}: .tag line-height must be >= 1.3 so wrapped lines don't touch (got ${lineHeights.join(',')})`
    );
    assert.match(block, /padding:\s*[^;]*\d+px/, `${lang}: .tag keeps vertical padding`);
    assert.match(block, /border-radius:\d+px/, `${lang}: .tag keeps its radius token`);
  }
});

it('lands the nav jump at the same offset on ES and EN (ES and EN)', () => {
  const sp = {};
  const nh = {};
  for (const [lang, source] of Object.entries(pages)) {
    const spMatch = source.match(/html\{[^}]*scroll-padding-top:([\d.]+)px/);
    sp[lang] = spMatch ? spMatch[1] : null;
    const nav = source.match(/nav \.wrap\{[^}]*height:([\d.]+)px/);
    nh[lang] = nav ? nav[1] : null;
  }
  assert.ok(sp.es && sp.en, 'scroll-padding-top must be present on both pages');
  assert.equal(sp.en, sp.es, `EN scroll-padding-top (${sp.en || '?'}px) must match ES (${sp.es || '?'}px)`);
  assert.ok(nh.es && nh.en, 'nav .wrap height must be present on both pages');
  assert.equal(nh.en, nh.es, `EN nav height (${nh.en}px) must match ES (${nh.es}px)`);
  assert.equal(sp.es, String(Number(nh.es) + 1), `scroll-padding-top (${sp.es}px) should sit just past the ${nh.es}px sticky nav`);
});

it('keeps the section nav reachable at <=620px (ES and EN)', () => {
  for (const [lang, source] of Object.entries(pages)) {
    const joined = media620Bodies(source).join('\n');
    assert.ok(joined, `${lang}: expected a max-width:620px media query`);
    assert.match(joined, /\.navlinks/, `${lang}: the 620px query must still style .navlinks`);
    assert.doesNotMatch(joined, /display:none/, `${lang}: section links must no longer be display:none on mobile`);
    assert.match(joined, /\.navlinks a\.lang/, `${lang}: the language link stays visible in the 620px query`);
    assert.match(joined, /\.navlinks\{[^}]*overflow-x:\s*auto/, `${lang}: nav must be a horizontally scrollable row on mobile`);
    assert.match(joined, /min-height:\s*(?:44px|calc\([^)]*44px)/, `${lang}: mobile nav links need a >=44px tap target`);
  }
});