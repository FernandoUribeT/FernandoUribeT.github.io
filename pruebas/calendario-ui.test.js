'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const UI = require('../demos/calendario/app.js');
const { sampleTrips } = require('../demos/calendario/datos.js');

const trips = sampleTrips('2026-10-10');

function fixtureDocument() {
  const rootHandlers = new Map();
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
  elements.log.prepend = function (child) { this.children.unshift(child); };
  elements.dialog.hidden = true;
  elements.dialog.innerHTML = '';
  elements['calendar-app'].addEventListener = (type, handler) => rootHandlers.set(type, handler);
  const views = ['month', 'week', 'day'].map(view => ({ dataset: { view }, setAttribute() {} }));
  return {
    getElementById(id) { return elements[id] || (elements[id] = { id, dataset: {}, style: {}, children: [], options: [], addEventListener() {} }); },
    querySelectorAll(selector) { return selector === '[data-view]' ? views : []; },
    createElement() { return { setAttribute() {}, style: {}, classList: { add() {}, remove() {} } }; },
    dispatchRoot(type, event) { const handler = rootHandlers.get(type); if (handler) handler(event); },
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

test('captured pointer release opens the move dialog for the day under release coordinates', () => {
  global.CalDatos = require('../demos/calendario/datos.js');
  const doc = fixtureDocument();
  const source = { dataset: { event: '1002:CP' }, closest(selector) { return selector === '.ev' ? this : null; } };
  const destination = { dataset: { day: '2026-10-15' }, closest(selector) { return selector === '[data-day]' ? this : null; } };
  doc.elementFromPoint = () => destination;
  try {
    UI.init(doc);
    doc.dispatchRoot('pointerdown', { target: source, clientX: 10, clientY: 10 });
    doc.dispatchRoot('pointermove', { target: source, clientX: 30, clientY: 30 });
    doc.dispatchRoot('pointerup', { target: source, clientX: 30, clientY: 30 });
    assert.equal(doc.elements.dialog.hidden, false);
    assert.match(doc.elements.dialog.innerHTML, /data-day="2026-10-15"/);
  } finally {
    delete global.CalDatos;
  }
});

test('pointer cancellation prevents a later captured release from opening a move dialog', () => {
  global.CalDatos = require('../demos/calendario/datos.js');
  const doc = fixtureDocument();
  const source = { dataset: { event: '1002:CP' }, closest(selector) { return selector === '.ev' ? this : null; } };
  const destination = { dataset: { day: '2026-10-15' }, closest(selector) { return selector === '[data-day]' ? this : null; } };
  doc.elementFromPoint = () => destination;
  try {
    UI.init(doc);
    doc.dispatchRoot('pointerdown', { target: source, clientX: 10, clientY: 10 });
    doc.dispatchRoot('pointermove', { target: source, clientX: 30, clientY: 30 });
    doc.dispatchRoot('pointercancel', { target: source, clientX: 30, clientY: 30 });
    doc.dispatchRoot('pointerup', { target: destination, clientX: 30, clientY: 30 });
    assert.equal(doc.elements.dialog.hidden, true);
    assert.doesNotMatch(doc.elements.dialog.innerHTML, /data-day="2026-10-15"/);
  } finally {
    delete global.CalDatos;
  }
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

test('English string table covers every shared UI label without changing Spanish copy', () => {
  const english = UI.stringsFor('en');
  const spanish = UI.stringsFor('es');
  assert.deepEqual(Object.keys(english).sort(), Object.keys(spanish).sort());
  assert.equal(english.today, 'Today');
  assert.equal(english.create, 'Schedule trip');
  assert.equal(english.filters, 'Filters');
  assert.equal(english.warning, 'Preventive maintenance warning');
  assert.equal(english.openDay, 'Open');
  assert.equal(spanish.create, 'Agendar viaje');
});

test('English date buttons use the English accessible action label', () => {
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.match(app, /aria-label="\$\{strings\.openDay\} \$\{day\}"/);
});

test('English trip card uses English fields and actions', () => {
  const markup = UI.tripCardMarkup(trips[1], 'CP', 'en');
  for (const label of ['Destination', 'Route', 'Unit', 'Driver', 'Notes', 'Save notes', 'Edit', 'Cancel trip']) {
    assert.ok(markup.includes(label), `English trip card should include ${label}`);
  }
  assert.match(markup, /PORT APPOINTMENT AT/);
  assert.doesNotMatch(markup, /Destino|Ruta|Notas|Guardar notas|Editar|Eliminar/);
});

test('English page loads the shared calendar modules and mounts in English', () => {
  const html = fs.readFileSync(path.join(__dirname, '../demos/calendar/index.html'), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /id="calendar-app"/);
  assert.match(html, /src="\.\.\/calendario\/logica\.js"/);
  assert.match(html, /src="\.\.\/calendario\/datos\.js"/);
  assert.match(html, /src="\.\.\/calendario\/app\.js"/);
  assert.match(html, /CalApp\.init\(document,\s*\{\s*lang:\s*['"]en['"]\s*\}\)/);
  for (const copy of ['Trip scheduling calendar', 'Filters', 'Event types', 'Availability', 'What is happening']) {
    assert.ok(html.includes(copy), `English page should include ${copy}`);
  }
  assert.doesNotMatch(html, /Agendar viaje|Filtros|Tipos de evento|Disponibilidad/);
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

test('new trip from the day summary uses the CP-only draft defaults', () => {
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.match(app, /if\(a==='new-from-day'\)\{closeDialog\(\);\s*openForm\(newTripDraft\(action\.dataset\.day,trips\)\)/);
  assert.doesNotMatch(app, /if\(a==='new-from-day'\)[\s\S]{0,100}Lg\.newTripForDay/);
});

test('English maintenance warnings use natural distance phrasing without changing Spanish', () => {
  assert.equal(UI.maintenanceMessage({ level: 'soon', remainingKm: 130 }, 'en'), 'Preventive maintenance is due within 130 km.');
  assert.equal(UI.maintenanceMessage({ level: 'overdue', overKm: 45 }, 'en'), 'This route is 45 km past the preventive service interval.');
  assert.equal(UI.maintenanceMessage({ level: 'soon', remainingKm: 130 }, 'es'), 'Servicio preventivo en 130 km restantes.');
  const app = fs.readFileSync(path.join(__dirname, '../demos/calendario/app.js'), 'utf8');
  assert.match(app, /maintenanceMessage\(warning,lang\)/);
  assert.match(app, /maintenanceMessage\(warn,lang\)/);
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

test('rules panel stays below the calendar in its column in both locales', () => {
  for (const page of ['calendario', 'calendar']) {
    const html = fs.readFileSync(path.join(__dirname, `../demos/${page}/index.html`), 'utf8');
    assert.match(html, /<div class="calendar-shell">\s*<div class="calendar-column">\s*<section class="panel" id="calendar-section">[\s\S]*?<\/section>\s*<section class="panel" id="rules"/);
    assert.match(html, /id="rules"[\s\S]*?<\/section>\s*<\/div>\s*<aside class="side">/);
    assert.match(html, /\.wrap\{max-width:1280px/);
    assert.doesNotMatch(html, /id="rules"[^>]*style="[^"]*margin-top/);
  }
});

test('color help distinguishes client and event colors from visibility filters in ES and EN', () => {
  const copy = {
    calendario: 'Los colores de CP, TL y TF se personalizan por cliente; ENTREGA usa un color global. La configuración de color es independiente de los filtros de visibilidad; limpiar los filtros no cambia los colores.',
    calendar: 'CP, TL, and TF colors can be customized per client; Delivery uses one global color. Color settings are separate from visibility filters; clearing filters does not change colors.',
  };
  for (const [page, text] of Object.entries(copy)) {
    const html = fs.readFileSync(path.join(__dirname, `../demos/${page}/index.html`), 'utf8');
    assert.ok(html.includes(`class="color-help">${text}</p>`), `${page} should explain color/filter behavior`);
  }
});

test('delivery color control is global-only even after selecting a client', () => {
  const priorData = global.CalDatos;
  const priorStorage = global.localStorage;
  const values = new Map();
  global.CalDatos = require('../demos/calendario/datos.js');
  global.localStorage = {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
  const doc = fixtureDocument();
  try {
    UI.init(doc);
    const eventType = doc.elements['color-type'];
    const client = doc.elements['color-client'];
    const color = doc.elements['color-input'];
    client.value = trips[1].client;
    eventType.value = 'ENTREGA';
    eventType.onchange();
    assert.equal(client.disabled, true);
    assert.equal(client.value, '');

    color.value = '#123456';
    color.onchange();
    const palette = JSON.parse(values.get('demo-cal-palette'));
    assert.equal(palette.tenant.ENTREGA, '#123456');
    assert.equal(palette.clients[trips[1].client]?.ENTREGA, undefined);

    eventType.value = 'CP';
    eventType.onchange();
    assert.equal(client.disabled, false);
  } finally {
    if (priorData === undefined) delete global.CalDatos;
    else global.CalDatos = priorData;
    if (priorStorage === undefined) delete global.localStorage;
    else global.localStorage = priorStorage;
  }
});

test('clicking an event opens localized trip details instead of a color picker', () => {
  global.CalDatos = require('../demos/calendario/datos.js');
  try {
    for (const [lang, notesLabel] of [['es', 'Notas'], ['en', 'Notes']]) {
      const doc = fixtureDocument();
      const source = {
        dataset: { event: '1002:CP' },
        closest(selector) { return selector === '[data-event]' || selector === '.ev' ? this : null; },
      };
      UI.init(doc, { lang });
      doc.dispatchRoot('click', { target: source });
      assert.equal(doc.elements.dialog.hidden, false);
      assert.match(doc.elements.dialog.innerHTML, /class="trip-card" data-folio="1002"/);
      assert.match(doc.elements.dialog.innerHTML, new RegExp(notesLabel));
      assert.match(doc.elements.dialog.innerHTML, /data-action="edit-trip"/);
      assert.doesNotMatch(doc.elements.dialog.innerHTML, /color-input|type="color"/);
    }
  } finally {
    delete global.CalDatos;
  }
});

test('client event colors stay scoped and clearing filters preserves color settings', () => {
  const priorData = global.CalDatos;
  const priorStorage = global.localStorage;
  const values = new Map();
  global.CalDatos = require('../demos/calendario/datos.js');
  global.localStorage = {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
  const doc = fixtureDocument();
  try {
    UI.init(doc);
    doc.elements['color-type'].value = 'CP';
    doc.elements['color-client'].value = trips[1].client;
    doc.elements['color-input'].value = '#123456';
    doc.elements['color-input'].onchange();
    const palette = values.get('demo-cal-palette');
    assert.ok(palette);
    assert.match(doc.elements['calendar-grid'].innerHTML, /data-event="1002:CP" data-type="CP" style="--event-color:#123456/);
    assert.match(doc.elements['calendar-grid'].innerHTML, /data-event="1002:TL" data-type="TL" style="--event-color:#54c7ec/);
    assert.match(doc.elements['calendar-grid'].innerHTML, /data-event="1001:CP" data-type="CP" style="--event-color:#e0567a/);

    const selected = { value: trips[1].client, selected: true };
    doc.elements['filter-client'].options = [selected];
    doc.elements['filter-client'].selectedOptions = [selected];
    doc.elements['filter-client'].onchange();
    doc.elements['clear-filters'].onclick();
    assert.equal(values.get('demo-cal-palette'), palette);
    assert.match(doc.elements['calendar-grid'].innerHTML, /data-event="1002:CP" data-type="CP" style="--event-color:#123456/);
  } finally {
    if (priorData === undefined) delete global.CalDatos;
    else global.CalDatos = priorData;
    if (priorStorage === undefined) delete global.localStorage;
    else global.localStorage = priorStorage;
  }
});
