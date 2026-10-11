'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const pages = {
  es: fs.readFileSync(path.join(__dirname, '../demos/calendario/index.html'), 'utf8'),
  en: fs.readFileSync(path.join(__dirname, '../demos/calendar/index.html'), 'utf8'),
};

function inlineCalendarScript(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  return scripts.find(script => script.includes('var MES=')) || '';
}

test('both demos restore the concise standalone calendar presentation', () => {
  for (const [locale, html] of Object.entries(pages)) {
    assert.match(html, new RegExp(`<html lang="${locale === 'es' ? 'es' : 'en'}">`));
    assert.match(html, /id="grid"/);
    assert.match(html, /id="prev"/);
    assert.match(html, /id="next"/);
    assert.match(html, /id="hoy"/);
    assert.doesNotMatch(html, /id="calendar-app"|id="calendar-grid"|id="availability"|data-view=/);
    assert.doesNotMatch(html, /<script src="[^\"]*(?:app|logica|datos)\.js"/);
  }
});

test('the seven calendar columns shrink to the available mobile width', () => {
  for (const [locale, html] of Object.entries(pages)) {
    const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
    assert.match(style, /\.dow\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/,
      `${locale} weekday headings must use shrinkable tracks`);
    assert.match(style, /\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/,
      `${locale} day cells must use shrinkable tracks`);
    assert.match(style, /\.day\s*\{[^}]*min-width:\s*0/,
      `${locale} day cells must not impose an intrinsic minimum width`);
    assert.match(style, /\.ev\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis/,
      `${locale} event labels must stay clipped within narrow day cells`);
  }
});

test('drop narration formats the local destination day instead of a UTC date', () => {
  const expected = {
    es: {months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], date: '12 de octubre'},
    en: {months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], date: 'October 12'},
  };
  for (const [locale, html] of Object.entries(pages)) {
    const script = inlineCalendarScript(html);
    const keySource = script.match(/function key\(d\)\{[^}]+\}/)?.[0];
    const formatSource = script.match(/function fmt\(iso\)\{[^}]+\}/)?.[0];
    assert.ok(keySource && formatSource, `${locale} defines its local date-key and formatter`);
    const date = new Function('MES', `${keySource};${formatSource};return {key:key,fmt:fmt};`)(expected[locale].months);
    const localDay = new Date(2026, 9, 12);
    localDay.setHours(0, 0, 0, 0);
    const destinationKey = date.key(localDay);
    assert.equal(destinationKey, '2026-10-12');
    assert.equal(date.fmt(destinationKey), expected[locale].date);
    assert.match(script, /fmt\(cell\.dataset\.k\)/, `${locale} narration uses the cell's local date key`);
    assert.doesNotMatch(script, /fmt\(cell\.dataset\.iso\)/, `${locale} narration does not format a UTC-derived date`);
    if (process.env.TZ === 'Asia/Tokyo') {
      assert.equal(localDay.toISOString().slice(0, 10), '2026-10-11', 'the test timezone reproduces the previous-day UTC conversion');
    }
  }
});

test('simple demo retains nine synthetic events and visible pointer drag feedback', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    assert.ok(script, 'calendar script is embedded in the standalone page');
    const eventList = script.match(/var evs=\[([\s\S]*?)\];/);
    assert.ok(eventList, 'synthetic event list exists');
    assert.equal((eventList[1].match(/\bmk\(/g) || []).length, 9);
    assert.doesNotMatch(script, /colorEv\(|abrePop\(drag\.el/);
    assert.match(script, /var cc=colorEvento\(x\)/);
    assert.match(html, /\.ghost\s*\{/);
    assert.match(html, /\.drop-ok\s*\{/);
    assert.match(html, /\.drop-no\s*\{/);
  }
});

test('event information uses a localized accessible read-only dialog', () => {
  const dialogCopy = {
    es: ['Información del evento', 'Cliente', 'Unidad', 'Operador'],
    en: ['Event details', 'Client', 'Unit', 'Driver'],
  };
  for (const [locale, html] of Object.entries(pages)) {
    const script = inlineCalendarScript(html);
    assert.match(html, /id="event-info"[^>]*role="dialog"[^>]*aria-modal="true"/);
    assert.match(html, /id="event-info-title"/);
    assert.match(script, /function showEventInfo\s*\(/);
    assert.match(script, /document\.createElement\('button'\)/);
    assert.match(script, /grid\.addEventListener\('click'/);
    assert.match(html, /aria-labelledby=["']event-info-title["']/);
    for (const text of dialogCopy[locale]) assert.ok(html.includes(text) || script.includes(text), `${locale} has ${text}`);
    assert.doesNotMatch(script, /abrePop\(drag\.el/);
    assert.doesNotMatch(script, /edit-trip|save-notes|color-input/);
  }
});

test('the event dialog traps Tab in both directions and Escape restores its trigger', () => {
  for (const [locale, html] of Object.entries(pages)) {
    const script = inlineCalendarScript(html);
    const dialogKeyHandler = script.match(/document\.addEventListener\('keydown',function\(e\)\{([\s\S]*?)\n  \}\);/)?.[1] || '';
    assert.match(dialogKeyHandler, /if\(infoDialog\.hidden\)return/,
      `${locale} only handles keys while the event dialog is open`);
    assert.match(dialogKeyHandler, /e\.key==='Escape'[\s\S]*?closeEventInfo\(\)/,
      `${locale} retains Escape close behavior`);
    assert.match(dialogKeyHandler, /e\.key!=='Tab'/,
      `${locale} handles Tab separately from other keys`);
    assert.match(dialogKeyHandler, /infoDialog\.querySelectorAll\(/,
      `${locale} derives the focusable controls from the dialog`);
    assert.match(dialogKeyHandler, /e\.shiftKey[\s\S]*?last\.focus\(\)/,
      `${locale} wraps Shift+Tab from the first control`);
    assert.match(dialogKeyHandler, /!e\.shiftKey[\s\S]*?first\.focus\(\)/,
      `${locale} wraps Tab from the last control`);
    assert.match(dialogKeyHandler, /e\.preventDefault\(\)/,
      `${locale} prevents browser focus from escaping the modal`);
    assert.match(script, /if\(infoReturnFocus&&infoReturnFocus\.isConnected\)infoReturnFocus\.focus\(\)/,
      `${locale} restores focus to the event that opened the dialog`);
  }
});

test('individual event colors are presented inside the six-field information dialog', () => {
  const copy = {
    es: {title: 'Color de este evento', fallback: 'Usar color del tipo', choose: 'Usar color'},
    en: {title: 'This event color', fallback: 'Use type color', choose: 'Use color'},
  };
  for (const [locale, html] of Object.entries(pages)) {
    const script = inlineCalendarScript(html);
    assert.match(html, /<dl class="info-fields" id="event-info-fields"><\/dl>\s*<div class="info-color">/);
    assert.ok(html.includes(copy[locale].title), `${locale} labels the event color controls`);
    assert.ok(html.includes(copy[locale].fallback), `${locale} labels the fallback action`);
    assert.ok(script.includes(copy[locale].choose), `${locale} provides localized swatch labels`);
    assert.match(script, /var INFO_LABELS=\{type:[^}]+driver:/);
    assert.match(script, /function pintaInfoColor\s*\(/);
    assert.match(script, /class="event-color-swatch[^\n]*aria-label=/);
    assert.match(script, /aria-pressed="/);
    assert.match(html, /<button type="button"[^>]*id="event-color-reset"/);
  }
});

test('individual colors override one event, persist, clear to type fallback, and reset globally', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    assert.match(script, /var col=\{tipo:\{\},evento:\{\}\}/);
    assert.match(script, /function colorEvento\(e\)\{return col\.evento\[e\.id\]\|\|colorTipo\(e\.t\);\}/);
    assert.match(script, /var cc=colorEvento\(x\)/);
    assert.match(script, /col\.evento\[ev\.id\]=button\.dataset\.color/);
    assert.match(script, /delete col\.evento\[ev\.id\]/);
    assert.match(script, /localStorage\.setItem\(LS,JSON\.stringify\(col\)\)/);
    assert.match(script, /col=\{tipo:\{\},evento:\{\}\}; guarda\(\); pintaLeyenda\(\); render\(\)/);
    assert.match(script, /function aplicaColorEvento\(ev\)/);
  }
});

test('pointer click opens info while movement over four pixels drops the event directly', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    assert.match(script, /var DRAG_THRESHOLD\s*=\s*4/);
    assert.match(script, /Math\.abs\(e\.clientX-drag\.x0\)>DRAG_THRESHOLD\|\|Math\.abs\(e\.clientY-drag\.y0\)>DRAG_THRESHOLD/);
    assert.match(script, /if\(!current\.moved&&ev\)\{\s*drag=null;last=null;return;/);
    assert.match(script, /window\.addEventListener\('pointerup',function\(e\)\{\s*if\(!drag\)return;\s*move\(e\);/);
    assert.match(script, /ev\.k=cell\.dataset\.k/);
    assert.doesNotMatch(script, /openMove\(|dependency|hour-modal/);
  }
});

test('a tap opens info from its click instead of the preceding pointerup', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    const pointerup = script.match(/window\.addEventListener\('pointerup',function\(e\)\{([\s\S]*?)\n  \}\);/)?.[1] || '';
    assert.doesNotMatch(pointerup, /showEventInfo/);
    assert.match(script, /var drag=null,ghost=null,last=null,suppressClick=false/);
    assert.match(script, /grid\.addEventListener\('click',function\(e\)\{[\s\S]*?if\(suppressClick&&e\.detail>0\)[\s\S]*?showEventInfo\(ev,el\)/);
    assert.match(script, /if\(current\.moved\)suppressClick=true/);
  }
});

test('invalid drops and pointer cancellation do not move or leave drag feedback behind', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    assert.match(script, /if\(cell\.classList\.contains\('past'\)\)/);
    assert.match(script, /if\(cell&&ev\)[\s\S]*?else if\(cell\.dataset\.k===ev\.k\)/);
    assert.match(script, /window\.addEventListener\('pointercancel',function\(\)\{[\s\S]*?drag=null;last=null;/);
    assert.match(script, /if\(ghost\)\{ghost\.remove\(\);ghost=null;\}/);
  }
});

test('English and Spanish retain localized navigation and event labels', () => {
  assert.match(pages.es, /Calendario de asignación de viajes/);
  assert.match(pages.es, /Cita a puerto/);
  assert.match(pages.es, /Arrastra/);
  assert.match(pages.en, /Trip scheduling calendar/);
  assert.match(pages.en, /Port appointment/);
  assert.match(pages.en, /Drag/);
  assert.match(pages.en, /<a href="\/en\/">← Portfolio<\/a>/);
});
