// Some demos style every <canvas> (QR: white background; vehicle inspection:
// off-white background with a border) for their own drawing surfaces. Without a
// reset, that leaks onto the full-screen .fondo-vivo canvas and, at its 42%
// opacity, washes the whole page out in a pale veil. Every page that carries
// the live background must neutralise those properties on .fondo-vivo.
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pages = [
  'index.html', 'en/index.html',
  'demos/calendario/index.html', 'demos/calendar/index.html',
  'demos/expedientes/index.html', 'demos/records/index.html',
  'demos/revision/index.html', 'demos/inspection/index.html',
  'demos/qr/index.html', 'demos/qr-en/index.html',
];

describe('live background canvas never turns into a pale veil', () => {
  for (const file of pages) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const rule = source.match(/\.fondo-vivo\{position:fixed[^}]*\}/)?.[0] ?? '';

    it(`${file}: .fondo-vivo resets background, border and radius`, () => {
      assert.ok(rule, '.fondo-vivo rule present');
      assert.match(rule, /background:transparent/);
      assert.match(rule, /border:0/);
      assert.match(rule, /border-radius:0/);
    });
  }
});
