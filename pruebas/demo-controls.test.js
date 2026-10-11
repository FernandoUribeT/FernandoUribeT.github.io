'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const controlsScript = fs.readFileSync(path.join(root, 'demos/demo-controls.js'), 'utf8');
const controlsStyles = fs.readFileSync(path.join(root, 'demos/demo-controls.css'), 'utf8');
const homepages = {
  es: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'en/index.html'), 'utf8'),
};
const pages = {
  es: fs.readFileSync(path.join(root, 'demos/calendario/index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'demos/calendar/index.html'), 'utf8'),
};
const remainingPages = {
  expedientes: fs.readFileSync(path.join(root, 'demos/expedientes/index.html'), 'utf8'),
  records: fs.readFileSync(path.join(root, 'demos/records/index.html'), 'utf8'),
  revision: fs.readFileSync(path.join(root, 'demos/revision/index.html'), 'utf8'),
  inspection: fs.readFileSync(path.join(root, 'demos/inspection/index.html'), 'utf8'),
  qr: fs.readFileSync(path.join(root, 'demos/qr/index.html'), 'utf8'),
  'qr-en': fs.readFileSync(path.join(root, 'demos/qr-en/index.html'), 'utf8'),
};

test('calendar demos provide a direct localized language switch in the header', () => {
  assert.match(pages.es, /<html lang="es">/);
  assert.match(pages.en, /<html lang="en">/);
  assert.match(pages.es, /href="\/demos\/calendar\/"[^>]*>English/);
  assert.match(pages.en, /href="\/demos\/calendario\/"[^>]*>Español/);
  assert.match(pages.es, /class="demo-tools"/);
  assert.match(pages.en, /class="demo-tools"/);
});

test('calendar demos expose compact non-modal controls with localized labels', () => {
  const labels = {
    es: ['Accesibilidad', 'Tamaño del texto', 'Alto contraste', 'Modo claro', 'Tipografía legible', 'Resaltar enlaces', 'Reducir movimiento', 'Restablecer todo'],
    en: ['Accessibility', 'Text size', 'High contrast', 'Light mode', 'Readable font', 'Highlight links', 'Reduce motion', 'Reset all'],
  };
  for (const [locale, html] of Object.entries(pages)) {
    assert.match(html, /id="demoA11yButton"[^>]*aria-expanded="false"[^>]*aria-controls="demoA11yPanel"/);
    assert.match(html, /id="demoA11yPanel"[^>]*hidden/);
    const panel = html.match(/<section class="demo-a11y-panel"[\s\S]*?<\/section>/)?.[0] || '';
    assert.ok(panel, `${locale} includes an accessibility region`);
    assert.doesNotMatch(panel, /role="dialog"|aria-modal="true"/);
    for (const label of labels[locale]) assert.ok(html.includes(label), `${locale} exposes ${label}`);
    for (const cls of ['a11y-contraste', 'a11y-claro', 'a11y-fuente', 'a11y-links', 'a11y-quieto']) {
      assert.ok(html.includes(cls), `${locale} supports ${cls}`);
    }
  }
});

test('calendar controls share the established preference key and guarded persistence', () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /demos\/demo-controls\.css/);
    assert.match(html, /demos\/demo-controls\.js/);
    assert.ok(controlsScript.includes('a11y-prefs'));
    assert.ok(controlsScript.includes('JSON.parse'));
    assert.ok(controlsScript.includes('try{'));
    assert.ok(controlsScript.includes('localStorage.setItem'));
    assert.match(controlsScript, /event\.key==='Escape'/);
    assert.match(controlsScript, /focus\(\)/);
  }
});

test('middle text size is the initial and reset default while stored sizes remain honored', () => {
  for (const [locale, html] of Object.entries(homepages)) {
    const textControls = html.match(/<div class="a11y-txt"[\s\S]*?<\/div>/)?.[0] || '';
    assert.match(textControls, /data-txt="1"[^>]*class="on"|class="on"[^>]*data-txt="1"/, `${locale} homepage selects middle size by default`);
    assert.doesNotMatch(textControls, /data-txt="0"[^>]*class="on"|class="on"[^>]*data-txt="0"/, `${locale} homepage does not mark normal size as default`);
    assert.match(html, /P=\{cls:\[\],txt:1\}/, `${locale} homepage starts at middle size`);
    assert.match(html, /P=\{cls:\[\],txt:1\};guarda\(\);aplica\(\)/, `${locale} homepage reset restores middle size`);
    assert.match(html, /P\.txt=\[0,1,2\]\.indexOf\(s\.txt\)>-1\?s\.txt:1/, `${locale} homepage honors stored sizes and defaults missing or invalid sizes to middle`);
    assert.match(html, /P\.cls=Array\.isArray\(s\.cls\)\?s\.cls\.filter\(function\(c\)\{return \['a11y-contraste','a11y-claro','a11y-fuente','a11y-links','a11y-quieto'\]\.indexOf\(c\)>-1;\}\):\[\]/, `${locale} homepage preserves only supported stored classes`);
  }

  assert.match(controlsScript, /var prefs=\{cls:\[\],txt:1\}/, 'all demos start at middle size');
  assert.match(controlsScript, /prefs\.txt=\[0,1,2\]\.indexOf\(saved\.txt\)>-1\?saved\.txt:1/, 'all demos retain valid stored text sizes');
  assert.match(controlsScript, /prefs=\{cls:\[\],txt:1\};savePrefs\(\);applyPrefs\(\)/, 'all demos reset to middle size');
});

test('text-size preferences scale visible calendar content and control labels', () => {
  assert.match(controlsStyles, /html\.a11y-txt1\s*\{[^}]*--demo-text-scale:\s*1\.125/);
  assert.match(controlsStyles, /html\.a11y-txt2\s*\{[^}]*--demo-text-scale:\s*1\.28125/);
  for (const selector of ['body', 'h1', '.intro', '.ev', '.rules', '.f-row label', '.demo-a11y-row']) {
    assert.ok(controlsStyles.includes(selector), `scaling covers ${selector}`);
  }
  assert.match(controlsStyles, /var\(--demo-text-scale\)/);
});

test('calendar demo-specific interactions and storage remain in place', () => {
  for (const [locale, html] of Object.entries(pages)) {
    assert.match(html, /id="grid"/);
    assert.match(html, /id="prev"/);
    assert.match(html, /id="next"/);
    assert.match(html, /function colorEvento\s*\(/);
    assert.ok(html.includes(locale === 'es' ? "var LS='demo-cal-colores'" : "var LS='demo-cal-colors'"));
  }
});

test('remaining demos expose localized direct language and accessibility controls', () => {
  const pairs = [
    ['expedientes', '/demos/records/', 'English'],
    ['records', '/demos/expedientes/', 'Español'],
    ['revision', '/demos/inspection/', 'English'],
    ['inspection', '/demos/revision/', 'Español'],
    ['qr', '/demos/qr-en/', 'English'],
    ['qr-en', '/demos/qr/', 'Español'],
  ];
  const labels = {
    es: ['Accesibilidad', 'Tamaño del texto', 'Alto contraste', 'Modo claro', 'Tipografía legible', 'Resaltar enlaces', 'Reducir movimiento', 'Restablecer todo'],
    en: ['Accessibility', 'Text size', 'High contrast', 'Light mode', 'Readable font', 'Highlight links', 'Reduce motion', 'Reset all'],
  };
  for (const [name, href, label] of pairs) {
    const html = remainingPages[name];
    assert.ok(html.includes(`href="${href}"`), `${name} links directly to its sibling demo`);
    assert.ok(html.includes(`>${label}</a>`), `${name} labels the sibling language`);
    assert.ok(html.includes('/demos/demo-controls.css'), `${name} loads shared control styles`);
    assert.ok(html.includes('/demos/demo-controls.js'), `${name} loads shared behavior`);
    assert.ok(html.includes('id="demoA11yButton"'), `${name} exposes the accessibility trigger`);
    assert.ok(html.includes('id="demoA11yPanel"'), `${name} exposes the preference panel`);
    assert.ok(html.includes('a11y-prefs'), `${name} keeps applying shared preferences`);
    const locale = ['expedientes', 'revision', 'qr'].includes(name) ? 'es' : 'en';
    for (const copy of labels[locale]) assert.ok(html.includes(copy), `${name} exposes localized ${copy}`);
    for (const cls of ['a11y-contraste', 'a11y-claro', 'a11y-fuente', 'a11y-links', 'a11y-quieto']) {
      assert.ok(html.includes(`data-pref-class="${cls}"`), `${name} toggles ${cls}`);
    }
  }
});

test('remaining demos scale fixed-size visible content with text preferences', () => {
  for (const selector of ['.hint', '.modo button', '.doc b', '.paso .val', '.it .lbl', '.opts button', '.campo>.et', '.grupo button', '.veredicto p']) {
    assert.ok(controlsStyles.includes(selector), `shared text scaling covers ${selector}`);
  }
  for (const name of Object.keys(remainingPages)) {
    assert.match(remainingPages[name], /id="demoA11yButton"/);
    assert.match(remainingPages[name], /class="intro"/);
  }
});

test('critical checklist badges scale with their adjacent text preferences', () => {
  assert.match(controlsStyles, /:is\(html\.a11y-txt1,html\.a11y-txt2\) \.crit\{font-size:calc\(8\.5px \* var\(--demo-text-scale\)\)\}/);
});

test('localized demo-specific interactions remain present after shared controls are added', () => {
  const retained = {
    expedientes: ['id="m-ing"', 'id="m-end"', 'id="docs"'],
    records: ['id="m-ing"', 'id="m-end"', 'id="docs"'],
    revision: ['id="lista"', 'id="firma"', 'id="cerrar"'],
    inspection: ['id="lista"', 'id="firma"', 'id="cerrar"'],
    qr: ['id="cv"', 'id="txt"', 'id="logo"'],
    'qr-en': ['id="cv"', 'id="txt"', 'id="logo"'],
  };
  for (const [name, markers] of Object.entries(retained)) {
    for (const marker of markers) assert.ok(remainingPages[name].includes(marker), `${name} retains ${marker}`);
  }
});
