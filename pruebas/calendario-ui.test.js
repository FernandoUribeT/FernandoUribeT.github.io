'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const UI = require('../demos/calendario/app.js');
const { sampleTrips } = require('../demos/calendario/datos.js');

const trips = sampleTrips('2026-10-10');

function fixtureDocument() {
  const ids = [
    'calendar-app', 'calendar-nav', 'calendar-grid', 'view-title', 'event-count', 'filter-client',
    'filter-unit', 'filter-driver', 'filter-chips', 'color-type', 'color-client', 'color-input',
    'availability-body', 'dialog', 'log', 'prev', 'next', 'today', 'new-trip', 'types',
    'availability-tab', 'calendar-tab', 'availability', 'calendar-section', 'clear-filters',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, {
    id, dataset: {}, style: {}, children: [], options: [], selectedOptions: [], className: '',
    setAttribute() {}, addEventListener() {}, querySelector() { return { focus() {} }; },
  }]));
  elements['calendar-app'].addEventListener = () => {};
  const views = ['month', 'week', 'day'].map(view => ({ dataset: { view }, setAttribute() {} }));
  return {
    getElementById(id) { return elements[id] || (elements[id] = { id, dataset: {}, style: {}, children: [], options: [], addEventListener() {} }); },
    querySelectorAll(selector) { return selector === '[data-view]' ? views : []; },
    createElement() { return { setAttribute() {}, style: {}, classList: { add() {}, remove() {} } }; },
    elements,
  };
}

test('browser startup resolves CalDatos from the global host and renders events', () => {
  global.CalDatos = require('../demos/calendario/datos.js');
  const doc = fixtureDocument();
  try {
    UI.init(doc);
    assert.match(doc.elements['event-count'].textContent, /^\d+ \/ \d+ eventos visibles$/);
    assert.match(doc.elements['calendar-grid'].innerHTML, /data-event=/);
  } finally {
    delete global.CalDatos;
  }
});

test('month grid exposes 42 Monday-first cells with fake trip events in their day', () => {
  const cells = UI.monthCells(2026, 9, trips);
  assert.equal(cells.length, 42);
  assert.equal(cells[0].day, '2026-09-28');
  assert.ok(cells.find((cell) => cell.day === '2026-10-10').events.length > 0);
});

test('week and day ranges stay anchored to the selected day', () => {
  assert.deepEqual(UI.viewRange('week', '2026-10-10'), { start: '2026-10-05', end: '2026-10-11', days: 7 });
  assert.deepEqual(UI.viewRange('day', '2026-10-10'), { start: '2026-10-10', end: '2026-10-10', days: 1 });
});

test('month navigation advances by one calendar month across leap day and year boundaries', () => {
  assert.equal(UI.shiftMonth('2026-03-31', -1), '2026-02-28');
  assert.equal(UI.shiftMonth('2028-03-31', -1), '2028-02-29');
  assert.equal(UI.shiftMonth('2026-12-31', 1), '2027-01-31');
  assert.equal(UI.shiftMonth('2026-01-31', -1), '2025-12-31');
});

test('pointer release target is resolved at release coordinates', () => {
  const released = { closest: () => ({ dataset: { day: '2026-10-15' } }) };
  const doc = { elementFromPoint: (x, y) => (x === 240 && y === 480 ? released : null) };
  const event = { clientX: 240, clientY: 480, target: { id: 'captured-origin-card' } };
  assert.equal(UI.pointerReleaseTarget(doc, event), released);
  assert.equal(UI.pointerReleaseTarget({}, event), event.target);
});

test('pointer cancellation clears an in-progress drag', () => {
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.match(app, /addEventListener\(['"]pointercancel['"],\s*\(\)\s*=>\s*\{\s*drag\s*=\s*null/);
});

test('time view provides a slot for every hour including 04:00 and 05:00', () => {
  assert.ok(UI.hourSlots().includes('04'));
  assert.ok(UI.hourSlots().includes('05'));
  assert.equal(UI.hourSlots().length, 24);
});

test('every event card includes shared route, destination, unit, driver, and folio', () => {
  for (const type of ['CP', 'TL', 'TF', 'ENTREGA']) {
    const markup = UI.tripCardMarkup(trips[1], type);
    for (const value of ['Guadalajara', 'Manzanillo', 'T18', 'J. Herrera', '1002']) {
      assert.ok(markup.includes(value), `${type} card should include ${value}`);
    }
  }
});

test('CP cards use local-haul actors while TF cards use long-haul actors', () => {
  const trip = trips.find(item => item.folio === 1007);
  assert.match(UI.tripCardMarkup(trip, 'CP'), /XL-482-B/);
  assert.match(UI.tripCardMarkup(trip, 'CP'), /P\. Domínguez/);
  assert.match(UI.tripCardMarkup(trip, 'TF'), /T05/);
  assert.match(UI.tripCardMarkup(trip, 'TF'), /L\. Ramírez/);
});

test('trip card markup escapes trip text while keeping safe notes links clickable', () => {
  const trip = { ...trips[1], client: '<script>bad()</script>', notes: 'Seguimiento https://example.com/carga/1002' };
  const markup = UI.tripCardMarkup(trip, 'TF');
  assert.match(markup, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(markup, /<script>bad/);
  assert.match(markup, /href="https:\/\/example\.com\/carga\/1002"/);
});

test('HTML has no unevaluated JavaScript template expressions', () => {
  const html = fs.readFileSync(path.join(__dirname, '../demos/calendario/index.html'), 'utf8');
  assert.doesNotMatch(html, /\$\{/);
});

test('optional haul inputs are not browser-required and only explicit close controls close dialogs', () => {
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.doesNotMatch(app, /name="\$\{k\}\.unit"[^>]*required/);
  assert.doesNotMatch(app, /name="tf\.(?:origin|destination)"[^>]*required/);
  assert.doesNotMatch(app, /class="dialog-backdrop" data-action="close"/);
});

test('day action reads the date button data-day-open attribute', () => {
  assert.equal(UI.dayFromButton({ dataset: { dayOpen: '2026-10-10' } }), '2026-10-10');
});

test('new trip draft preselects only CP and leaves TL and TF optional', () => {
  const draft = UI.newTripDraft('2026-10-12', trips);
  assert.equal(draft.cp.datetime, '2026-10-12T08:00');
  assert.equal(draft.tl, null);
  assert.equal(draft.tf, null);
});

test('new draft is titled as new even though it has a preallocated folio', () => {
  const draft = UI.newTripDraft('2026-10-12', trips);
  assert.ok(draft.folio);
  assert.equal(UI.isExistingTrip(draft, trips), false);
  assert.equal(UI.isExistingTrip(trips[0], trips), true);
});

test('empty optional haul sections provide safe select values to the form renderer', () => {
  assert.deepEqual(UI.haulValues(null), {});
  const saved = { line: 'subcontracted', driver: 'P. Domínguez' };
  assert.equal(UI.haulValues(saved), saved);
});

test('select options restore saved values including values outside catalogs', () => {
  const line = UI.optionMarkup(['own', 'subcontracted'], 'subcontracted');
  const driver = UI.optionMarkup(['A. Rodríguez', 'M. Sánchez'], 'P. Domínguez', '—');
  assert.match(line, /value="subcontracted" selected/);
  assert.match(driver, /<option value="P\. Domínguez" selected>P\. Domínguez<\/option>/);
});

test('Escape closes an open dialog', () => {
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.match(app, /key\s*===\s*['"]Escape['"]/);
});
