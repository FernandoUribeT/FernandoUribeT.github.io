'use strict';

// T16 — S17/S5: case-tile motion and the visible demo accent edge, ES + EN.
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = { es: 'index.html', en: path.join('en', 'index.html') };
const active = '#proyectos .case.card:is(:hover,:focus-within)';
const lift = 'html:not(.a11y-quieto) #proyectos .case.card.rv:is(:hover,:focus-within)';

function cssRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`));
  assert.ok(match, `missing CSS rule: ${selector}`);
  return match[1];
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
  it(`${lang}: hover and focus lift every project tile while keeping the accent glow`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const projects = source.match(/<section id="proyectos"[\s\S]*?<\/section>/)?.[0] ?? '';
    const tiles = [...projects.matchAll(/<article class="([^"]*\bcase\b[^"]*)"/g)];
    assert.equal(tiles.length, 11);
    for (const [, classes] of tiles) {
      assert.match(classes, /\bcard\b/);
      assert.match(classes, /\brv\b/);
    }

    // The ID-scoped rule beats .js .rv.in; its extra classes also beat the
    // scroll-driven .rv:not(.in) transform reset without changing translate.
    assert.match(cssRule(source, lift), /transform:\s*translateY\(-3px\)/);
    assert.match(source, /\.js \.rv\.in\{opacity:1;transform:none;/);
    const interaction = cssRule(source, active);
    assert.match(interaction, /background:\s*var\(--card-2\)/);
    assert.match(interaction, /box-shadow:\s*0 14px 40px -18px var\(--sombra\),\s*0 0 18px -7px var\(--borde/);
    assert.match(interaction, /border-top-color:\s*transparent/);
    assert.match(cssRule(source, `${active}::before`), /opacity:\s*1/, 'the S14 border light remains visible');
    const transition = cssRule(source, '#proyectos .case.card');
    for (const property of ['transform', 'border-color', 'box-shadow', 'background']) {
      assert.match(transition, new RegExp(`${property}\\s+\\.25s\\s+var\\(--ease\\)`));
    }
    assert.match(transition, /opacity\s+\.6s\s+var\(--ease\)/, 'the reveal keeps its opacity transition');
    assert.doesNotMatch(cssRule(source, '.case .shot img'), /(?:transform|scale)\s*:/);
    assert.doesNotMatch(source, /\.case[^{}]*:(?:hover|focus-within)[^{}]*\bimg\b\s*\{[^{}]*(?:transform|scale)\s*:/);
  });

  it(`${lang}: project hover transitions start without the reveal stagger, without changing other reveals`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const script = source.match(/<script>\s*(\(function\(\)\{\s*var d=document, els=[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
    assert.ok(script, 'the existing reveal script is present');
    const elements = [false, true, false, true].map((project) => ({
      style: {},
      matches: (selector) => selector === '#proyectos .case' && project,
      getBoundingClientRect: () => ({ top: 0 }),
      classList: { add() {}, contains: () => true },
    }));
    const document = {
      querySelectorAll: (selector) => selector === '.rv' ? elements : [],
      getElementById: () => null,
    };
    function IntersectionObserver() { this.observe = () => {}; this.unobserve = () => {}; }
    const window = { innerHeight: 800, IntersectionObserver };
    vm.runInNewContext(script, { document, window, IntersectionObserver, setTimeout() {} });

    assert.equal(elements[0].style.transitionDelay, '0ms');
    assert.equal(elements[1].style.transitionDelay, '45ms,0ms,0ms,0ms,0ms');
    assert.equal(elements[2].style.transitionDelay, '90ms');
    assert.equal(elements[3].style.transitionDelay, '135ms,0ms,0ms,0ms,0ms');
    assert.match(cssRule(source, '#proyectos .case.card'), /transition:\s*opacity[^;]*,transform[^;]*,border-color[^;]*,box-shadow[^;]*,background/);
  });

  it(`${lang}: quiet mode and reduced motion disable tile movement on hover and focus`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const quiet = `html.a11y-quieto ${active}`;
    assert.match(cssRule(source, quiet), /transform:\s*none/);
    assert.match(cssRule(reducedMotionBlocks(source), lift), /transform:\s*none/);
  });

  it(`${lang}: all four demo shots sit below the 3px accent edge, which disappears on interaction`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const projects = source.match(/<section id="proyectos"[\s\S]*?<\/section>/)?.[0] ?? '';
    const tiles = [...projects.matchAll(/<article class="case[^\"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
    const demos = tiles.filter((tile) => /<div class="shot" data-video>/.test(tile));
    assert.equal(demos.length, 4);
    assert.match(cssRule(source, '.case.card'), /border-top:\s*3px solid var\(--borde/);
    assert.match(cssRule(source, '.card .shot'), /margin:\s*-22px -22px 16px/, 'the inherited negative margin must be overridden');
    assert.match(cssRule(source, '.case .shot'), /margin:\s*0(?:;|$)/, 'screenshots are inset and cannot cover the accent edge');
    assert.match(cssRule(source, active), /border-top-color:\s*transparent/);
    assert.match(cssRule(source, `${active}::before`), /opacity:\s*1/);
  });
}
