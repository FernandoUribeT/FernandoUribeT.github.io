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

test('simple demo retains nine synthetic events and visible pointer drag feedback', () => {
  for (const html of Object.values(pages)) {
    const script = inlineCalendarScript(html);
    assert.ok(script, 'calendar script is embedded in the standalone page');
    const eventList = script.match(/var evs=\[([\s\S]*?)\];/);
    assert.ok(eventList, 'synthetic event list exists');
    assert.equal((eventList[1].match(/\bmk\(/g) || []).length, 9);
    assert.doesNotMatch(script, /col\.ev|colorEv\(|abrePop\(drag\.el/);
    assert.match(script, /var cc=colorTipo\(x\.t\)/);
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
