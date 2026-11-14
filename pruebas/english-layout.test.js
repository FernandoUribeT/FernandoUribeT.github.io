'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const spanish = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const english = fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8');

function layoutRule(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, 'g'));
  return match?.at(-1)?.replace(/\\s+/g, '') ?? null;
}

it('keeps English portfolio section layout aligned with Spanish', () => {
  for (const selector of ['#proyectos,#formacion', '#experiencia,#stack']) {
    assert.equal(
      layoutRule(english, selector),
      layoutRule(spanish, selector),
      `English ${selector} layout should match Spanish`,
    );
  }
});

it('starts both pages with markup, not stray text, right after <body>', () => {
  for (const [name, source] of [['spanish', spanish], ['english', english]]) {
    const afterBody = source.split(/<body[^>]*>/)[1] ?? '';
    assert.match(afterBody, /^\s*</, `${name} page has stray text after <body>`);
  }
});
