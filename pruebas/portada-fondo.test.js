// The home pages (ES + EN) share the live dotted background of the services
// pages and demos: a fixed canvas behind the content, hidden in high contrast
// and stopped in quiet mode, driven by a script that actually runs.
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pages = { es: 'index.html', en: 'en/index.html' };

for (const [lang, file] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

  describe(`${lang} home live background`, () => {
    it('places the canvas as the first child of <body>', () => {
      assert.match(source, /<body[^>]*><canvas class="fondo-vivo" aria-hidden="true"><\/canvas>/);
    });

    it('keeps the canvas fixed behind the content and out of pointer events', () => {
      assert.match(source, /\.fondo-vivo\{position:fixed;inset:0;z-index:-2;pointer-events:none/);
    });

    it('hides the canvas in high contrast and quiet mode', () => {
      assert.match(source, /html\.a11y-contraste \.fondo-vivo,html\.a11y-quieto \.fondo-vivo\{display:none\}/);
    });

    it('runs the drawing code inside a <script> element, never as page text', () => {
      const body = source.slice(source.indexOf('<body'));
      const scripts = [...body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      assert.ok(scripts.some((js) => js.includes("document.querySelector('.fondo-vivo')")),
        'the fondo-vivo code must live inside a <script>');
      const outside = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
      assert.ok(!outside.includes("document.querySelector('.fondo-vivo')"),
        'no fondo-vivo code may sit outside a <script>');
    });

    it('stops drawing in quiet mode', () => {
      assert.match(source, /if\(R\.classList\.contains\('a11y-quieto'\)\)\{corriendo=false;return;\}/);
    });
  });
}
