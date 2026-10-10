'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../demos/calendario/logica.js');
const D = require('../demos/calendario/datos.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const cp = (o) => Object.assign({ datetime: '2026-10-12T08:00', service: 'import', terminal: 'Terminal 2', customsAgent: 'Agencia Demo', maniobra: true }, o);
const tl = (o) => Object.assign({ datetime: '2026-10-12T12:00', yard: 'Patio Central', line: 'own', provider: '', unit: 'T05', driver: 'M. Sánchez' }, o);
const tf = (o) => Object.assign({ datetime: '2026-10-13T06:00', line: 'own', provider: '', unit: 'T18', driver: 'J. Herrera', origin: 'Manzanillo', destination: 'Guadalajara', distanceKm: 340 }, o);
const delivery = (o) => Object.assign({ datetime: '2026-10-13T15:00', destination: 'Guadalajara', modality: 'direct' }, o);
const makeTrip = (o) => Object.assign({
  folio: 1, reference: 'REF-1', client: 'Comercial Atlas',
  cargo: { type: 'containerized', containers: ['TEST1234567', 'TEST7654321'] },
  notes: '', status: 'active', cancelReason: '',
  cp: null, tl: null, tf: null, delivery: null,
}, o);
const fullTrip = (o) => makeTrip(Object.assign({ cp: cp(), tl: tl(), tf: tf(), delivery: delivery() }, o));

function deepFreeze(x) {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x);
    Object.values(x).forEach(deepFreeze);
  }
  return x;
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
describe('time helpers', () => {
  it('dayOf returns the date part of a local date-time', () => {
    assert.equal(L.dayOf('2026-10-12T08:30'), '2026-10-12');
  });

  it('addDays crosses month, year and leap-day boundaries', () => {
    assert.equal(L.addDays('2026-10-12', 3), '2026-10-15');
    assert.equal(L.addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(L.addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(L.addDays('2028-02-28', 1), '2028-02-29');
  });

  it('addDays rejects a malformed or non-existent day', () => {
    assert.throws(() => L.addDays('10/12/2026', 1), { name: 'TypeError', message: /Invalid day/ });
    assert.throws(() => L.addDays('2026-02-30', 1), { name: 'TypeError', message: /Invalid day/ });
    assert.throws(() => L.addDays(undefined, 1), { name: 'TypeError', message: /Invalid day/ });
  });

  it('fromDate formats a JS Date as a local date-time string', () => {
    assert.equal(L.fromDate(new Date(2026, 9, 10, 8, 5)), '2026-10-10T08:05');
    assert.equal(L.fromDate(new Date(2027, 0, 2, 23, 59)), '2027-01-02T23:59');
  });
});

// ---------------------------------------------------------------------------
// Cargo label and titles
// ---------------------------------------------------------------------------
describe('cargoLabel', () => {
  it('two containers is FULL', () => {
    const t = makeTrip({ cargo: { type: 'containerized', containers: ['A1', 'B2'] } });
    assert.equal(L.cargoLabel(t, 'es'), 'FULL');
    assert.equal(L.cargoLabel(t, 'en'), 'FULL');
  });

  it('one container is SENCILLO / SINGLE', () => {
    const t = makeTrip({ cargo: { type: 'containerized', containers: ['A1'] } });
    assert.equal(L.cargoLabel(t, 'es'), 'SENCILLO');
    assert.equal(L.cargoLabel(t, 'en'), 'SINGLE');
  });

  it('loose cargo is CARGA SUELTA / LOOSE CARGO', () => {
    const t = makeTrip({ cargo: { type: 'loose', containers: [] } });
    assert.equal(L.cargoLabel(t, 'es'), 'CARGA SUELTA');
    assert.equal(L.cargoLabel(t, 'en'), 'LOOSE CARGO');
  });

  it('blank container numbers are not counted', () => {
    const t = makeTrip({ cargo: { type: 'containerized', containers: ['A1', '   '] } });
    assert.equal(L.cargoLabel(t, 'en'), 'SINGLE');
  });

  it('rejects an unsupported language', () => {
    assert.throws(() => L.cargoLabel(fullTrip(), 'fr'), RangeError);
  });
});

describe('eventTitle', () => {
  const t = fullTrip({ cargo: { type: 'containerized', containers: ['A1', 'B2'] } });

  it('builds the four Spanish titles', () => {
    assert.equal(L.eventTitle(t, 'CP', 'es'), 'CITA A PUERTO EN Terminal 2');
    assert.equal(L.eventTitle(t, 'TL', 'es'), 'DESPACHOS/VACÍOS Patio Central');
    assert.equal(L.eventTitle(t, 'TF', 'es'), 'SALIDA Manzanillo > Guadalajara');
    assert.equal(L.eventTitle(t, 'ENTREGA', 'es'), 'FULL ENTREGA A Guadalajara');
  });

  it('builds the four English titles', () => {
    assert.equal(L.eventTitle(t, 'CP', 'en'), 'PORT APPOINTMENT AT Terminal 2');
    assert.equal(L.eventTitle(t, 'TL', 'en'), 'DISPATCH/EMPTIES Patio Central');
    assert.equal(L.eventTitle(t, 'TF', 'en'), 'DEPARTURE Manzanillo > Guadalajara');
    assert.equal(L.eventTitle(t, 'ENTREGA', 'en'), 'FULL DELIVERY TO Guadalajara');
  });

  it('delivery title uses the cargo label of the trip', () => {
    const one = fullTrip({ cargo: { type: 'containerized', containers: ['A1'] } });
    const loose = fullTrip({ cargo: { type: 'loose', containers: [] } });
    assert.equal(L.eventTitle(one, 'ENTREGA', 'es'), 'SENCILLO ENTREGA A Guadalajara');
    assert.equal(L.eventTitle(one, 'ENTREGA', 'en'), 'SINGLE DELIVERY TO Guadalajara');
    assert.equal(L.eventTitle(loose, 'ENTREGA', 'es'), 'CARGA SUELTA ENTREGA A Guadalajara');
    assert.equal(L.eventTitle(loose, 'ENTREGA', 'en'), 'LOOSE CARGO DELIVERY TO Guadalajara');
  });

  it('rejects an unsupported language or event type', () => {
    assert.throws(() => L.eventTitle(t, 'CP', 'de'), RangeError);
    assert.throws(() => L.eventTitle(t, 'XX', 'es'), RangeError);
  });
});

// ---------------------------------------------------------------------------
// Trip -> events
// ---------------------------------------------------------------------------
describe('tripEvents', () => {
  it('a full trip yields four events in CP, TL, TF, ENTREGA order', () => {
    const evs = L.tripEvents(fullTrip({ folio: 7 }), 'es');
    assert.deepEqual(evs.map((e) => e.type), ['CP', 'TL', 'TF', 'ENTREGA']);
    assert.deepEqual(evs.map((e) => e.datetime), [
      '2026-10-12T08:00', '2026-10-12T12:00', '2026-10-13T06:00', '2026-10-13T15:00',
    ]);
    assert.deepEqual(evs.map((e) => e.day), ['2026-10-12', '2026-10-12', '2026-10-13', '2026-10-13']);
    assert.deepEqual(evs[0].ref, { folio: 7, type: 'CP' });
    assert.equal(evs[0].folio, 7);
    assert.equal(evs[0].client, 'Comercial Atlas');
    assert.equal(evs[0].title, 'CITA A PUERTO EN Terminal 2');
  });

  it('titles follow the requested language', () => {
    const evs = L.tripEvents(fullTrip(), 'en');
    assert.equal(evs[2].title, 'DEPARTURE Manzanillo > Guadalajara');
  });

  it('a section that is absent produces no event', () => {
    const evs = L.tripEvents(makeTrip({ tf: tf() }), 'es');
    assert.deepEqual(evs.map((e) => e.type), ['TF']);
  });

  it('a section without a date-time produces no event', () => {
    const evs = L.tripEvents(fullTrip({ tl: tl({ datetime: '' }), cp: cp({ datetime: undefined }) }), 'es');
    assert.deepEqual(evs.map((e) => e.type), ['TF', 'ENTREGA']);
  });

  it('a cancelled trip produces no events', () => {
    assert.deepEqual(L.tripEvents(fullTrip({ status: 'cancelled', cancelReason: 'x' }), 'es'), []);
  });

  it('TL carries the local-haul unit and driver; TF and ENTREGA the long-haul ones', () => {
    const evs = L.tripEvents(fullTrip(), 'es');
    const by = Object.fromEntries(evs.map((e) => [e.type, e]));
    assert.deepEqual([by.TL.unit, by.TL.driver], ['T05', 'M. Sánchez']);
    assert.deepEqual([by.TF.unit, by.TF.driver], ['T18', 'J. Herrera']);
    assert.deepEqual([by.ENTREGA.unit, by.ENTREGA.driver], ['T18', 'J. Herrera']);
  });

  it('CP uses the local-haul unit and driver when the trip has a TL section', () => {
    const by = Object.fromEntries(L.tripEvents(fullTrip(), 'es').map((e) => [e.type, e]));
    assert.deepEqual([by.CP.unit, by.CP.driver], ['T05', 'M. Sánchez']);
  });

  it('CP falls back to the long-haul unit and driver when there is no TL section', () => {
    const by = Object.fromEntries(L.tripEvents(fullTrip({ tl: null }), 'es').map((e) => [e.type, e]));
    assert.deepEqual([by.CP.unit, by.CP.driver], ['T18', 'J. Herrera']);
  });

  it('events without any unit or driver source get empty strings', () => {
    const by = Object.fromEntries(L.tripEvents(makeTrip({ cp: cp() }), 'es').map((e) => [e.type, e]));
    assert.deepEqual([by.CP.unit, by.CP.driver], ['', '']);
  });
});

describe('allEvents', () => {
  it('flattens the events of every trip and skips cancelled ones', () => {
    const trips = [
      makeTrip({ folio: 1, cp: cp() }),
      makeTrip({ folio: 2, tf: tf(), status: 'cancelled', cancelReason: 'x' }),
      makeTrip({ folio: 3, tf: tf() }),
    ];
    const evs = L.allEvents(trips, 'es');
    assert.deepEqual(evs.map((e) => `${e.folio}:${e.type}`), ['1:CP', '3:TF']);
  });
});

describe('tripEvents / titles: hostile or malformed input', () => {
  it('ignores sections whose date-time is malformed or not a real calendar date', () => {
    const t = fullTrip({
      cp: cp({ datetime: 'garbage' }),
      tl: tl({ datetime: '2026-13-45T99:99' }),
      tf: tf({ datetime: '2026-02-30T08:00' }),
      delivery: delivery({ datetime: '2026-10-13' }),
    });
    assert.deepEqual(L.tripEvents(t, 'es'), []);
  });

  it('prototype keys are not valid languages or event types', () => {
    assert.throws(() => L.eventTitle(fullTrip(), 'CP', 'constructor'), RangeError);
    assert.throws(() => L.eventTitle(fullTrip(), 'CP', '__proto__'), RangeError);
    assert.throws(() => L.eventTitle(fullTrip(), 'toString', 'es'), RangeError);
  });

  it('missing section text renders as empty instead of "undefined"', () => {
    const title = L.eventTitle(makeTrip({ cp: cp({ terminal: undefined }) }), 'CP', 'es');
    assert.equal(title, 'CITA A PUERTO EN ');
  });
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
describe('resolveColor precedence', () => {
  it('exposes the default palette', () => {
    assert.deepEqual({ ...L.DEFAULT_COLORS }, { CP: '#e0567a', TL: '#54c7ec', TF: '#f0b429', ENTREGA: '#ff9f45' });
  });

  it('falls back to the default when there is no palette', () => {
    assert.equal(L.resolveColor('CP', 'Comercial Atlas'), '#e0567a');
    assert.equal(L.resolveColor('TF', 'Comercial Atlas', {}), '#f0b429');
  });

  it('a tenant color beats the default', () => {
    const palette = { tenant: { TL: '#112233' } };
    assert.equal(L.resolveColor('TL', 'Comercial Atlas', palette), '#112233');
    assert.equal(L.resolveColor('CP', 'Comercial Atlas', palette), '#e0567a');
  });

  it('a client color beats the tenant color for CP, TL and TF', () => {
    const palette = {
      tenant: { CP: '#111111', TL: '#222222', TF: '#333333' },
      clients: { 'Comercial Atlas': { CP: '#aa0000', TL: '#00aa00', TF: '#0000aa' } },
    };
    assert.equal(L.resolveColor('CP', 'Comercial Atlas', palette), '#aa0000');
    assert.equal(L.resolveColor('TL', 'Comercial Atlas', palette), '#00aa00');
    assert.equal(L.resolveColor('TF', 'Comercial Atlas', palette), '#0000aa');
  });

  it('a client color only applies to its own client', () => {
    const palette = { tenant: { CP: '#111111' }, clients: { 'Comercial Atlas': { CP: '#aa0000' } } };
    assert.equal(L.resolveColor('CP', 'Logística Rivera', palette), '#111111');
  });

  it('ENTREGA never takes a client color but does take the tenant color', () => {
    const palette = {
      tenant: { ENTREGA: '#445566' },
      clients: { 'Comercial Atlas': { ENTREGA: '#ff0000' } },
    };
    assert.equal(L.resolveColor('ENTREGA', 'Comercial Atlas', palette), '#445566');
    assert.equal(L.resolveColor('ENTREGA', 'Comercial Atlas', { clients: palette.clients }), '#ff9f45');
  });

  it('ignores values that are not #rrggbb (never lets stored text reach a style)', () => {
    const palette = {
      tenant: { CP: 'red; background:url(//evil)' },
      clients: { X: { CP: 'javascript:alert(1)', TL: '#12345' } },
    };
    assert.equal(L.resolveColor('CP', 'X', palette), '#e0567a');
    assert.equal(L.resolveColor('TL', 'X', palette), '#54c7ec');
  });

  it('an invalid client color falls through to a valid tenant color', () => {
    const palette = { tenant: { CP: '#778899' }, clients: { X: { CP: 'nope' } } };
    assert.equal(L.resolveColor('CP', 'X', palette), '#778899');
  });

  it('rejects an unknown event type', () => {
    assert.throws(() => L.resolveColor('XX', 'X', {}), RangeError);
  });
});

describe('readable text color (WCAG)', () => {
  it('relativeLuminance of black and white', () => {
    assert.equal(L.relativeLuminance('#000000'), 0);
    assert.equal(L.relativeLuminance('#ffffff'), 1);
  });

  it('contrastRatio of black on white is 21', () => {
    assert.equal(Math.round(L.contrastRatio('#000000', '#ffffff') * 100) / 100, 21);
    assert.equal(L.contrastRatio('#ffffff', '#000000'), L.contrastRatio('#000000', '#ffffff'));
  });

  it('picks white text on dark backgrounds and dark text on light ones', () => {
    assert.equal(L.readableTextColor('#000000'), '#ffffff');
    assert.equal(L.readableTextColor('#1a237e'), '#ffffff');
    assert.equal(L.readableTextColor('#ffffff'), '#12161e');
    assert.equal(L.readableTextColor('#f0b429'), '#12161e');
  });

  it('always picks the option with the higher contrast', () => {
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
          const chosen = L.readableTextColor(hex);
          const other = chosen === '#ffffff' ? '#12161e' : '#ffffff';
          assert.ok(L.contrastRatio(hex, chosen) >= L.contrastRatio(hex, other), hex);
        }
      }
    }
  });

  it('every default event color gets at least 4.5:1 text contrast', () => {
    for (const type of L.EVENT_TYPES) {
      const bg = L.DEFAULT_COLORS[type];
      assert.ok(L.contrastRatio(bg, L.readableTextColor(bg)) >= 4.5, type);
    }
  });

  it('rejects a color that is not #rrggbb', () => {
    assert.throws(() => L.relativeLuminance('red'), { name: 'TypeError', message: /#rrggbb/ });
    assert.throws(() => L.readableTextColor('#fff'), { name: 'TypeError', message: /#rrggbb/ });
  });
});

// ---------------------------------------------------------------------------
// Filters and counter
// ---------------------------------------------------------------------------
describe('filterEvents', () => {
  // 1: Atlas, TL T05/Sánchez, TF T18/Herrera   -> CP,TL by T05/Sánchez; TF,ENTREGA by T18/Herrera
  // 2: Rivera, TF T22/Rodríguez                -> TF by T22/Rodríguez
  // 3: Naviera, TL T05/Herrera                 -> TL by T05/Herrera
  const trips = [
    fullTrip({ folio: 1, client: 'Comercial Atlas' }),
    makeTrip({ folio: 2, client: 'Logística Rivera', tf: tf({ unit: 'T22', driver: 'A. Rodríguez' }) }),
    makeTrip({ folio: 3, client: 'Naviera del Pacífico', tl: tl({ unit: 'T05', driver: 'J. Herrera' }) }),
  ];
  const events = L.allEvents(trips, 'es');
  const keys = (list) => list.map((e) => `${e.folio}:${e.type}`);

  it('no filters and no type restriction keeps everything', () => {
    assert.equal(L.filterEvents(events, {}).length, 6);
    assert.equal(L.filterEvents(events, { clients: [], units: [], drivers: [] }).length, 6);
  });

  it('values inside one list combine with OR', () => {
    const out = L.filterEvents(events, { clients: ['Logística Rivera', 'Naviera del Pacífico'] });
    assert.deepEqual(keys(out), ['2:TF', '3:TL']);
  });

  it('different lists combine with AND', () => {
    const out = L.filterEvents(events, { units: ['T05'], drivers: ['J. Herrera'] });
    assert.deepEqual(keys(out), ['3:TL']);
    const none = L.filterEvents(events, { clients: ['Logística Rivera'], units: ['T05'] });
    assert.deepEqual(none, []);
  });

  it('unit and driver filters use the per-type attribution', () => {
    const byUnit = L.filterEvents(events, { units: ['T18'] });
    assert.deepEqual(keys(byUnit), ['1:TF', '1:ENTREGA']);
    const byDriver = L.filterEvents(events, { drivers: ['M. Sánchez'] });
    assert.deepEqual(keys(byDriver), ['1:CP', '1:TL']);
  });

  it('visible types restrict the result (empty list hides everything)', () => {
    assert.deepEqual(keys(L.filterEvents(events, {}, ['TF'])), ['1:TF', '2:TF']);
    assert.deepEqual(keys(L.filterEvents(events, {}, ['TL', 'ENTREGA'])), ['1:TL', '1:ENTREGA', '3:TL']);
    assert.deepEqual(L.filterEvents(events, {}, []), []);
  });

  it('types and filters combine', () => {
    assert.deepEqual(keys(L.filterEvents(events, { units: ['T05'] }, ['TL'])), ['1:TL', '3:TL']);
  });

  it('does not mutate its inputs', () => {
    const frozen = deepFreeze(L.allEvents(trips, 'es'));
    assert.doesNotThrow(() => L.filterEvents(frozen, deepFreeze({ units: ['T05'] }), deepFreeze(['TL'])));
  });
});

describe('eventCounter', () => {
  const trips = [
    fullTrip({ folio: 1 }),
    makeTrip({ folio: 2, tf: tf({ unit: 'T22' }) }),
    makeTrip({ folio: 3, cp: cp(), status: 'cancelled', cancelReason: 'x' }),
  ];
  const events = L.allEvents(trips, 'es');

  it('total counts the events of active trips, visible counts what passes', () => {
    assert.deepEqual(L.eventCounter(events, {}), { visible: 5, total: 5 });
    assert.deepEqual(L.eventCounter(events, { units: ['T22'] }), { visible: 1, total: 5 });
    assert.deepEqual(L.eventCounter(events, {}, ['CP', 'TL']), { visible: 2, total: 5 });
  });
});

// ---------------------------------------------------------------------------
// Drag and drop rules
// ---------------------------------------------------------------------------
describe('evaluateMove: past rules', () => {
  const NOW = '2026-10-10T09:00';
  const trips = [fullTrip({ folio: 5 })];
  const ref = (type) => ({ folio: 5, type });

  it('rejects a target day before today with past_day', () => {
    assert.deepEqual(L.evaluateMove(trips, ref('TL'), '2026-10-09T23:00', NOW), { ok: false, reason: 'past_day' });
  });

  it('rejects an earlier hour today with past_hour', () => {
    assert.deepEqual(L.evaluateMove(trips, ref('TL'), '2026-10-10T08:59', NOW), { ok: false, reason: 'past_hour' });
  });

  it('accepts exactly now and any hour on a future day', () => {
    assert.equal(L.evaluateMove(trips, ref('TL'), '2026-10-10T09:00', NOW).ok, true);
    assert.equal(L.evaluateMove(trips, ref('TL'), '2026-10-11T00:00', NOW).ok, true);
  });

  it('checks the past day before the TF-after-CP rule', () => {
    assert.equal(L.evaluateMove(trips, ref('TF'), '2026-10-01T08:00', NOW).reason, 'past_day');
  });

  it('rejects a malformed target date-time', () => {
    assert.deepEqual(L.evaluateMove(trips, ref('TL'), '2026-10-12', NOW), { ok: false, reason: 'invalid_datetime' });
    assert.deepEqual(L.evaluateMove(trips, ref('TL'), 'soon', NOW), { ok: false, reason: 'invalid_datetime' });
  });

  it('throws on a malformed now (programmer error, not a user rejection)', () => {
    assert.throws(() => L.evaluateMove(trips, ref('TL'), '2026-10-12T08:00', 'today'), { name: 'TypeError', message: /Invalid now/ });
  });

  it('reports an unknown event or one of a cancelled trip as event_not_found', () => {
    assert.deepEqual(L.evaluateMove(trips, { folio: 99, type: 'CP' }, '2026-10-12T08:00', NOW), { ok: false, reason: 'event_not_found' });
    const cancelled = [fullTrip({ folio: 5, status: 'cancelled', cancelReason: 'x' })];
    assert.equal(L.evaluateMove(cancelled, ref('CP'), '2026-10-12T08:00', NOW).reason, 'event_not_found');
    const noTl = [makeTrip({ folio: 5, cp: cp() })];
    assert.equal(L.evaluateMove(noTl, ref('TL'), '2026-10-12T08:00', NOW).reason, 'event_not_found');
  });
});

describe('evaluateMove: TF must stay after its CP', () => {
  const NOW = '2026-10-10T09:00';
  const trips = [fullTrip({ folio: 5 })]; // CP 2026-10-12T08:00
  const tfRef = { folio: 5, type: 'TF' };

  it('rejects moving a TF to the CP time or before it', () => {
    assert.deepEqual(L.evaluateMove(trips, tfRef, '2026-10-12T08:00', NOW), { ok: false, reason: 'tf_not_after_cp' });
    assert.deepEqual(L.evaluateMove(trips, tfRef, '2026-10-11T20:00', NOW), { ok: false, reason: 'tf_not_after_cp' });
  });

  it('accepts a TF one minute after the CP', () => {
    assert.equal(L.evaluateMove(trips, tfRef, '2026-10-12T08:01', NOW).ok, true);
  });

  it('does not restrict a TF when the trip has no CP', () => {
    const noCp = [fullTrip({ folio: 5, cp: null })];
    assert.equal(L.evaluateMove(noCp, tfRef, '2026-10-10T10:00', NOW).ok, true);
  });

  it('does not apply to TL or ENTREGA', () => {
    assert.equal(L.evaluateMove(trips, { folio: 5, type: 'TL' }, '2026-10-12T07:00', NOW).ok, true);
    assert.equal(L.evaluateMove(trips, { folio: 5, type: 'ENTREGA' }, '2026-10-12T07:00', NOW).ok, true);
  });
});

describe('evaluateMove: CP magnet', () => {
  const NOW = '2026-10-10T09:00';
  const trips = [fullTrip({ folio: 5 })];
  // CP 10-12 08:00 | TL 10-12 12:00 (gap 4h) | TF 10-13 06:00 (gap 22h) | ENTREGA 10-13 15:00
  const cpRef = { folio: 5, type: 'CP' };

  it('a plain move reports a single change and no dependents', () => {
    assert.deepEqual(L.evaluateMove(trips, { folio: 5, type: 'TL' }, '2026-10-12T16:00', NOW), {
      ok: true,
      changes: [{ eventRef: { folio: 5, type: 'TL' }, from: '2026-10-12T12:00', to: '2026-10-12T16:00' }],
      dependents: 0,
    });
  });

  it('moving a CP later pushes later TL and TF keeping their gap', () => {
    const r = L.evaluateMove(trips, cpRef, '2026-10-12T10:00', NOW);
    assert.equal(r.ok, true);
    assert.equal(r.dependents, 2);
    assert.deepEqual(r.changes, [
      { eventRef: { folio: 5, type: 'CP' }, from: '2026-10-12T08:00', to: '2026-10-12T10:00' },
      { eventRef: { folio: 5, type: 'TL' }, from: '2026-10-12T12:00', to: '2026-10-12T14:00' },
      { eventRef: { folio: 5, type: 'TF' }, from: '2026-10-13T06:00', to: '2026-10-13T08:00' },
    ]);
  });

  it('keeps the gap across a day boundary', () => {
    const r = L.evaluateMove(trips, cpRef, '2026-10-13T09:00', NOW);
    assert.deepEqual(r.changes.map((c) => c.to), ['2026-10-13T09:00', '2026-10-13T13:00', '2026-10-14T07:00']);
  });

  it('a TL originally before the CP stays where it is', () => {
    const early = [fullTrip({ folio: 5, tl: tl({ datetime: '2026-10-12T06:00' }) })];
    const r = L.evaluateMove(early, cpRef, '2026-10-12T10:00', NOW);
    assert.equal(r.dependents, 1);
    assert.deepEqual(r.changes.map((c) => c.eventRef.type), ['CP', 'TF']);
  });

  it('moving a CP earlier never pulls anything', () => {
    const r = L.evaluateMove(trips, cpRef, '2026-10-11T07:00', NOW);
    assert.equal(r.ok, true);
    assert.equal(r.dependents, 0);
    assert.equal(r.changes.length, 1);
  });

  it('ENTREGA is never a dependent', () => {
    const r = L.evaluateMove(trips, cpRef, '2026-10-20T08:00', NOW);
    assert.equal(r.changes.some((c) => c.eventRef.type === 'ENTREGA'), false);
  });

  it('a TL or TF with no date-time is ignored', () => {
    const partial = [fullTrip({ folio: 5, tl: tl({ datetime: '' }) })];
    const r = L.evaluateMove(partial, cpRef, '2026-10-12T10:00', NOW);
    assert.deepEqual(r.changes.map((c) => c.eventRef.type), ['CP', 'TF']);
  });

  it('a TL or TF exactly at the CP time is pushed with a zero gap', () => {
    const same = [fullTrip({ folio: 5, tl: tl({ datetime: '2026-10-12T08:00' }) })];
    const r = L.evaluateMove(same, cpRef, '2026-10-12T10:00', NOW);
    assert.equal(r.changes.find((c) => c.eventRef.type === 'TL').to, '2026-10-12T10:00');
  });

  it('a rejected CP move reports no changes', () => {
    assert.deepEqual(L.evaluateMove(trips, cpRef, '2026-10-01T10:00', NOW), { ok: false, reason: 'past_day' });
  });

  it('only touches the trip that owns the event', () => {
    const two = [fullTrip({ folio: 5 }), fullTrip({ folio: 6 })];
    const r = L.evaluateMove(two, cpRef, '2026-10-12T10:00', NOW);
    assert.equal(r.changes.every((c) => c.eventRef.folio === 5), true);
  });

  it('does not mutate its inputs', () => {
    const frozen = deepFreeze([fullTrip({ folio: 5 })]);
    assert.doesNotThrow(() => L.evaluateMove(frozen, cpRef, '2026-10-12T10:00', NOW));
  });
});

describe('applyMove', () => {
  const NOW = '2026-10-10T09:00';

  it('returns new trips with every change applied and leaves the inputs untouched', () => {
    const trips = deepFreeze([fullTrip({ folio: 5 }), fullTrip({ folio: 6 })]);
    const r = L.evaluateMove(trips, { folio: 5, type: 'CP' }, '2026-10-12T10:00', NOW);
    const next = L.applyMove(trips, r.changes);
    assert.notEqual(next, trips);
    assert.equal(next[0].cp.datetime, '2026-10-12T10:00');
    assert.equal(next[0].tl.datetime, '2026-10-12T14:00');
    assert.equal(next[0].tf.datetime, '2026-10-13T08:00');
    assert.equal(next[0].delivery.datetime, '2026-10-13T15:00');
    assert.equal(trips[0].cp.datetime, '2026-10-12T08:00');
    assert.equal(next[1].cp.datetime, '2026-10-12T08:00');
  });

  it('maps ENTREGA to the delivery section', () => {
    const trips = [fullTrip({ folio: 5 })];
    const next = L.applyMove(trips, [{ eventRef: { folio: 5, type: 'ENTREGA' }, from: '2026-10-13T15:00', to: '2026-10-14T09:00' }]);
    assert.equal(next[0].delivery.datetime, '2026-10-14T09:00');
  });

  it('throws when a change points at an event that does not exist', () => {
    const trips = [makeTrip({ folio: 5, cp: cp() })];
    assert.throws(() => L.applyMove(trips, [{ eventRef: { folio: 5, type: 'TF' }, from: 'a', to: 'b' }]), RangeError);
    assert.throws(() => L.applyMove(trips, [{ eventRef: { folio: 9, type: 'CP' }, from: 'a', to: 'b' }]), RangeError);
  });

  it('evaluate + apply keeps the TF after the CP', () => {
    const trips = [fullTrip({ folio: 5 })];
    const moved = L.applyMove(trips, L.evaluateMove(trips, { folio: 5, type: 'CP' }, '2026-10-15T08:00', NOW).changes);
    assert.ok(moved[0].tf.datetime > moved[0].cp.datetime);
  });
});

// ---------------------------------------------------------------------------
// Day click: classification and summary
// ---------------------------------------------------------------------------
describe('classifyDay', () => {
  const NOW = '2026-10-10T09:00';
  const trips = [
    makeTrip({ folio: 1, cp: cp({ datetime: '2026-10-08T08:00' }) }),               // past, with events
    makeTrip({ folio: 2, tl: tl({ datetime: '2026-10-10T07:00' }) }),               // today (earlier hour)
    makeTrip({ folio: 3, tf: tf({ datetime: '2026-10-15T06:00' }) }),               // future
    makeTrip({ folio: 4, cp: cp({ datetime: '2026-10-09T08:00' }), status: 'cancelled', cancelReason: 'x' }),
  ];

  it('past day without events', () => {
    assert.equal(L.classifyDay('2026-10-07', trips, NOW), 'past_empty');
  });

  it('past day with events', () => {
    assert.equal(L.classifyDay('2026-10-08', trips, NOW), 'past_with_events');
  });

  it('today counts as open, with or without events', () => {
    assert.equal(L.classifyDay('2026-10-10', trips, NOW), 'open_with_events');
    assert.equal(L.classifyDay('2026-10-10', [trips[2]], NOW), 'open_empty');
  });

  it('future day with and without events', () => {
    assert.equal(L.classifyDay('2026-10-15', trips, NOW), 'open_with_events');
    assert.equal(L.classifyDay('2026-10-16', trips, NOW), 'open_empty');
  });

  it('events of cancelled trips do not count', () => {
    assert.equal(L.classifyDay('2026-10-09', trips, NOW), 'past_empty');
  });

  it('does not depend on the time of day of now', () => {
    assert.equal(L.classifyDay('2026-10-10', trips, '2026-10-10T23:59'), 'open_with_events');
  });

  it('rejects a malformed day or now', () => {
    assert.throws(() => L.classifyDay('10/10/2026', trips, NOW), { name: 'TypeError', message: /Invalid day/ });
    assert.throws(() => L.classifyDay('2026-10-10', trips, 'now'), { name: 'TypeError', message: /Invalid now/ });
  });
});

describe('daySummary', () => {
  const trips = [
    makeTrip({ folio: 1, cp: cp({ datetime: '2026-10-12T11:00' }), tl: tl({ datetime: '2026-10-12T07:30' }) }),
    makeTrip({ folio: 2, tl: tl({ datetime: '2026-10-12T07:30', yard: 'Patio Norte' }), tf: tf({ datetime: '2026-10-13T06:00' }) }),
    makeTrip({ folio: 3, delivery: delivery({ datetime: '2026-10-12T16:00' }), tf: tf({ datetime: '2026-10-12T05:00' }) }),
    makeTrip({ folio: 4, cp: cp({ datetime: '2026-10-12T09:00' }), status: 'cancelled', cancelReason: 'x' }),
  ];

  it('lists the events of the day sorted by time', () => {
    const s = L.daySummary('2026-10-12', trips, 'es');
    assert.deepEqual(s.events.map((e) => `${e.datetime.slice(11)} ${e.folio}:${e.type}`), [
      '05:00 3:TF', '07:30 1:TL', '07:30 2:TL', '11:00 1:CP', '16:00 3:ENTREGA',
    ]);
  });

  it('counts events grouped by type, including zeros', () => {
    const s = L.daySummary('2026-10-12', trips, 'es');
    assert.deepEqual(s.counts, { CP: 1, TL: 2, TF: 1, ENTREGA: 1 });
    assert.deepEqual(L.daySummary('2026-10-20', trips, 'es').counts, { CP: 0, TL: 0, TF: 0, ENTREGA: 0 });
  });

  it('carries the day and renders titles in the requested language', () => {
    const s = L.daySummary('2026-10-12', trips, 'en');
    assert.equal(s.day, '2026-10-12');
    assert.equal(s.events[0].title, 'DEPARTURE Manzanillo > Guadalajara');
  });

  it('rejects a malformed day', () => {
    assert.throws(() => L.daySummary('12-10-2026', trips, 'es'), { name: 'TypeError', message: /Invalid day/ });
  });

  it('is empty for a day with no events', () => {
    assert.deepEqual(L.daySummary('2026-10-20', trips, 'es').events, []);
  });
});

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------
describe('cancelTrip', () => {
  const base = () => [fullTrip({ folio: 1 }), fullTrip({ folio: 2 })];

  it('requires a reason that is not blank after trimming', () => {
    for (const reason of ['', '   ', '\n\t', undefined, null]) {
      assert.deepEqual(L.cancelTrip(base(), 1, reason), { ok: false, reason: 'reason_required' });
    }
  });

  it('cancels the trip with a trimmed reason and keeps the other trips', () => {
    const trips = deepFreeze(base());
    const r = L.cancelTrip(trips, 1, '  Client rescheduled  ');
    assert.equal(r.ok, true);
    assert.equal(r.trips[0].status, 'cancelled');
    assert.equal(r.trips[0].cancelReason, 'Client rescheduled');
    assert.equal(r.trips[1], trips[1]);
    assert.equal(trips[0].status, 'active');
  });

  it('all the events of the cancelled trip disappear', () => {
    const r = L.cancelTrip(base(), 1, 'x');
    assert.deepEqual(L.allEvents(r.trips, 'es').map((e) => e.folio), [2, 2, 2, 2]);
  });

  it('reports an unknown folio', () => {
    assert.deepEqual(L.cancelTrip(base(), 99, 'x'), { ok: false, reason: 'trip_not_found' });
  });
});

// ---------------------------------------------------------------------------
// Trip form validation
// ---------------------------------------------------------------------------
describe('validateTrip', () => {
  const valid = () => fullTrip({ folio: 10, reference: 'ATL-001' });

  it('a complete trip has no errors', () => {
    assert.deepEqual(L.validateTrip(valid(), []), []);
  });

  it('requires a client', () => {
    assert.deepEqual(L.validateTrip({ ...valid(), client: '' }, []), ['client_required']);
    assert.deepEqual(L.validateTrip({ ...valid(), client: '   ' }, []), ['client_required']);
    assert.deepEqual(L.validateTrip({ ...valid(), client: undefined }, []), ['client_required']);
  });

  it('requires a cargo selection', () => {
    assert.deepEqual(L.validateTrip({ ...valid(), cargo: null }, []), ['cargo_required']);
    assert.deepEqual(L.validateTrip({ ...valid(), cargo: { type: 'bulk' } }, []), ['cargo_required']);
  });

  it('containerized cargo needs one or two container numbers', () => {
    const withContainers = (containers) => ({ ...valid(), cargo: { type: 'containerized', containers } });
    assert.deepEqual(L.validateTrip(withContainers([]), []), ['cargo_required']);
    assert.deepEqual(L.validateTrip(withContainers(['  ']), []), ['cargo_required']);
    assert.deepEqual(L.validateTrip(withContainers(['A1', 'B2', 'C3']), []), ['cargo_required']);
    assert.deepEqual(L.validateTrip(withContainers(['A1']), []), []);
  });

  it('loose cargo needs no containers', () => {
    assert.deepEqual(L.validateTrip({ ...valid(), cargo: { type: 'loose', containers: [] } }, []), []);
  });

  it('needs at least one of CP, TL or TF', () => {
    const onlyDelivery = makeTrip({ folio: 10, delivery: delivery() });
    assert.deepEqual(L.validateTrip(onlyDelivery, []), ['no_event_section']);
    for (const only of [{ cp: cp() }, { tl: tl() }, { tf: tf() }]) {
      assert.deepEqual(L.validateTrip(makeTrip({ folio: 10, ...only }), []), []);
    }
  });

  it('each present section needs a valid date-time', () => {
    assert.deepEqual(L.validateTrip(makeTrip({ cp: cp({ datetime: '' }) }), []), ['cp_datetime_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ tl: tl({ datetime: 'bad' }) }), []), ['tl_datetime_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ tf: tf({ datetime: undefined }) }), []), ['tf_datetime_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ cp: cp(), delivery: delivery({ datetime: '' }) }), []), ['delivery_datetime_required']);
  });

  it('TL and TF need unit and driver', () => {
    assert.deepEqual(L.validateTrip(makeTrip({ tl: tl({ unit: '', driver: ' ' }) }), []), ['tl_unit_required', 'tl_driver_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ tf: tf({ unit: '', driver: '' }) }), []), ['tf_unit_required', 'tf_driver_required']);
  });

  it('CP does not need unit or driver', () => {
    assert.deepEqual(L.validateTrip(makeTrip({ cp: cp() }), []), []);
  });

  it('a subcontracted line also needs a provider', () => {
    const sub = (o) => ({ line: 'subcontracted', provider: 'Fletes Demo', ...o });
    assert.deepEqual(L.validateTrip(makeTrip({ tl: tl(sub({ provider: '' })) }), []), ['tl_provider_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ tf: tf(sub({ provider: '  ' })) }), []), ['tf_provider_required']);
    assert.deepEqual(L.validateTrip(makeTrip({ tl: tl(sub()), tf: tf(sub()) }), []), []);
    assert.deepEqual(L.validateTrip(makeTrip({ tl: tl({ line: 'own', provider: '' }) }), []), []);
  });

  it('a subcontracted line still needs unit and driver', () => {
    const t = makeTrip({ tf: tf({ line: 'subcontracted', provider: 'Fletes Demo', unit: '', driver: '' }) });
    assert.deepEqual(L.validateTrip(t, []), ['tf_unit_required', 'tf_driver_required']);
  });

  it('departure must be on or before delivery', () => {
    const late = makeTrip({ tf: tf({ datetime: '2026-10-14T09:00' }), delivery: delivery({ datetime: '2026-10-14T08:59' }) });
    assert.deepEqual(L.validateTrip(late, []), ['departure_after_delivery']);
    const equal = makeTrip({ tf: tf({ datetime: '2026-10-14T09:00' }), delivery: delivery({ datetime: '2026-10-14T09:00' }) });
    assert.deepEqual(L.validateTrip(equal, []), []);
  });

  it('does not report departure_after_delivery when a date-time is missing', () => {
    const t = makeTrip({ tf: tf({ datetime: '' }), delivery: delivery() });
    assert.deepEqual(L.validateTrip(t, []), ['tf_datetime_required']);
  });

  it('the reference must be unique among the other trips', () => {
    const others = [fullTrip({ folio: 1, reference: 'ATL-001' }), fullTrip({ folio: 2, reference: 'ATL-002', status: 'cancelled', cancelReason: 'x' })];
    assert.deepEqual(L.validateTrip({ ...valid(), reference: 'ATL-001' }, others), ['reference_duplicate']);
    assert.deepEqual(L.validateTrip({ ...valid(), reference: '  atl-001 ' }, others), ['reference_duplicate']);
    assert.deepEqual(L.validateTrip({ ...valid(), reference: 'ATL-002' }, others), ['reference_duplicate']);
    assert.deepEqual(L.validateTrip({ ...valid(), reference: 'ATL-003' }, others), []);
  });

  it('a trip does not clash with itself when edited', () => {
    const existing = [fullTrip({ folio: 10, reference: 'ATL-001' })];
    assert.deepEqual(L.validateTrip({ ...valid(), reference: 'ATL-001' }, existing), []);
  });

  it('a blank reference is not checked for uniqueness', () => {
    const others = [fullTrip({ folio: 1, reference: '' })];
    assert.deepEqual(L.validateTrip({ ...valid(), reference: '' }, others), []);
  });

  it('reports every problem at once, in a stable order', () => {
    const t = makeTrip({ folio: 10, client: '', cargo: null, reference: 'X', tl: tl({ unit: '' }), tf: tf({ datetime: '' }) });
    const others = [fullTrip({ folio: 1, reference: 'X' })];
    assert.deepEqual(L.validateTrip(t, others), [
      'client_required', 'cargo_required', 'tl_unit_required', 'tf_datetime_required', 'reference_duplicate',
    ]);
  });
});

describe('new trip helpers', () => {
  it('nextFolio is 1 for no trips and max + 1 otherwise (cancelled folios are never reused)', () => {
    assert.equal(L.nextFolio([]), 1);
    const trips = [makeTrip({ folio: 5 }), makeTrip({ folio: 9, status: 'cancelled', cancelReason: 'x' }), makeTrip({ folio: 2 })];
    assert.equal(L.nextFolio(trips), 10);
  });

  it('newTripForDay prefills CP, TL and TF at 08:00 of the clicked day', () => {
    const t = L.newTripForDay('2026-10-14', [makeTrip({ folio: 41 })]);
    assert.equal(t.folio, 42);
    assert.equal(t.status, 'active');
    assert.equal(t.cp.datetime, '2026-10-14T08:00');
    assert.equal(t.tl.datetime, '2026-10-14T08:00');
    assert.equal(t.tf.datetime, '2026-10-14T08:00');
    assert.equal(t.delivery, null);
    assert.equal(t.client, '');
    assert.equal(t.cargo, null);
    assert.equal(t.tl.line, 'own');
    assert.equal(t.tf.line, 'own');
  });

  it('a prefilled trip is not valid until the user fills it', () => {
    const errors = L.validateTrip(L.newTripForDay('2026-10-14', []), []);
    assert.ok(errors.includes('client_required'));
    assert.ok(errors.includes('cargo_required'));
    assert.ok(errors.includes('tl_unit_required'));
    assert.ok(!errors.includes('cp_datetime_required'));
  });

  it('every call returns fresh objects', () => {
    const a = L.newTripForDay('2026-10-14', []);
    const b = L.newTripForDay('2026-10-14', []);
    a.cp.terminal = 'changed';
    assert.equal(b.cp.terminal, '');
  });

  it('rejects a malformed day', () => {
    assert.throws(() => L.newTripForDay('14/10/2026', []), { name: 'TypeError', message: /Invalid day/ });
  });
});

describe('validateTrip: defaults', () => {
  it('works without a list of existing trips', () => {
    assert.deepEqual(L.validateTrip(fullTrip({ folio: 10, reference: 'A' })), []);
  });
});

// ---------------------------------------------------------------------------
// Maintenance warning
// ---------------------------------------------------------------------------
describe('serviceWarning', () => {
  const unit = (o) => ({ eco: 'T05', kind: 'tractor', plate: 'JX-451-A', odometerKm: 100000, nextServiceKm: 120000, ...o });

  it('is null while the projected odometer is more than 1,000 km before the service', () => {
    assert.equal(L.serviceWarning(unit(), 500), null);
    assert.equal(L.serviceWarning(unit({ odometerKm: 118999 }), 0), null);
  });

  it('is "soon" from exactly 1,000 km before the service, with the km remaining', () => {
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 119000 }), 0), { level: 'soon', remainingKm: 1000 });
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 118000 }), 1500), { level: 'soon', remainingKm: 500 });
    assert.equal(L.serviceWarning(unit({ odometerKm: 118000 }), 999), null);
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 119000 }), 999), { level: 'soon', remainingKm: 1 });
  });

  it('is "overdue" at or past the service km, with the km over', () => {
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 119000 }), 1000), { level: 'overdue', overKm: 0 });
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 119500 }), 740), { level: 'overdue', overKm: 240 });
  });

  it('a unit already past its service is overdue even with no route', () => {
    assert.deepEqual(L.serviceWarning(unit({ odometerKm: 121000 }), 0), { level: 'overdue', overKm: 1000 });
  });

  it('treats a missing, negative or non-numeric route as 0 km', () => {
    const u = unit({ odometerKm: 119500 });
    for (const km of [undefined, null, -300, NaN, 'far']) {
      assert.deepEqual(L.serviceWarning(u, km), { level: 'soon', remainingKm: 500 });
    }
  });

  it('is null when the unit has no usable odometer or service data', () => {
    assert.equal(L.serviceWarning(null, 100), null);
    assert.equal(L.serviceWarning({ eco: 'X' }, 100), null);
    assert.equal(L.serviceWarning(unit({ nextServiceKm: undefined }), 100), null);
  });
});

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
describe('unitStatus', () => {
  const TODAY = '2026-10-10';
  const unit = { eco: 'T05', kind: 'tractor', plate: 'JX-451-A', odometerKm: 100000, nextServiceKm: 120000 };
  const maint = (o) => ({ unit: 'T05', from: '2026-10-08', to: '2026-10-12', note: 'Preventive service', ...o });
  // events on 10-09, 10-10, 10-11 using T05 (TL) and T18 (TF)
  const onTrip = (o) => makeTrip({
    folio: 1,
    cp: cp({ datetime: '2026-10-09T08:00' }),
    tl: tl({ datetime: '2026-10-10T07:00', unit: 'T05' }),
    tf: tf({ datetime: '2026-10-11T06:00', unit: 'T18' }),
    ...o,
  });

  it('is free with no trips and no maintenance', () => {
    assert.deepEqual(L.unitStatus(unit, [], [], TODAY), { status: 'free' });
  });

  it('is unavailable for maintenance while the window covers today, available on its end', () => {
    assert.deepEqual(L.unitStatus(unit, [], [maint()], TODAY), { status: 'unavailable', reason: 'maintenance', availableOn: '2026-10-12' });
  });

  it('the maintenance window is inclusive at both ends', () => {
    assert.equal(L.unitStatus(unit, [], [maint({ from: '2026-10-10' })], TODAY).reason, 'maintenance');
    assert.equal(L.unitStatus(unit, [], [maint({ to: '2026-10-10' })], TODAY).reason, 'maintenance');
    assert.equal(L.unitStatus(unit, [], [maint({ from: '2026-10-11' })], TODAY).status, 'free');
    assert.equal(L.unitStatus(unit, [], [maint({ to: '2026-10-09' })], TODAY).status, 'free');
  });

  it('ignores maintenance of other units', () => {
    assert.equal(L.unitStatus(unit, [], [maint({ unit: 'T18' })], TODAY).status, 'free');
  });

  it('with several windows covering today, availability is the latest end', () => {
    const r = L.unitStatus(unit, [], [maint({ to: '2026-10-11' }), maint({ to: '2026-10-15' }), maint({ to: '2026-10-13' })], TODAY);
    assert.equal(r.availableOn, '2026-10-15');
  });

  it('is on a trip between the first and last event day of a trip that uses the unit', () => {
    assert.deepEqual(L.unitStatus(unit, [onTrip()], [], TODAY), { status: 'unavailable', reason: 'on_trip', availableOn: '2026-10-12' });
  });

  it('the trip span is inclusive and uses every event of the trip', () => {
    assert.equal(L.unitStatus(unit, [onTrip()], [], '2026-10-09').reason, 'on_trip');
    assert.equal(L.unitStatus(unit, [onTrip()], [], '2026-10-11').reason, 'on_trip');
    assert.equal(L.unitStatus(unit, [onTrip()], [], '2026-10-08').status, 'free');
    assert.equal(L.unitStatus(unit, [onTrip()], [], '2026-10-12').status, 'free');
  });

  it('a unit used only through the long-haul section is also on the trip', () => {
    assert.equal(L.unitStatus({ ...unit, eco: 'T18' }, [onTrip()], [], TODAY).reason, 'on_trip');
  });

  it('ignores cancelled trips and trips of other units', () => {
    assert.equal(L.unitStatus(unit, [onTrip({ status: 'cancelled', cancelReason: 'x' })], [], TODAY).status, 'free');
    assert.equal(L.unitStatus({ ...unit, eco: 'T99' }, [onTrip()], [], TODAY).status, 'free');
  });

  it('with several overlapping trips, availability is the day after the latest one', () => {
    const later = onTrip({ folio: 2, cp: null, tl: tl({ datetime: '2026-10-10T10:00', unit: 'T05' }), tf: tf({ datetime: '2026-10-14T06:00', unit: 'T05' }) });
    assert.equal(L.unitStatus(unit, [onTrip(), later], [], TODAY).availableOn, '2026-10-15');
  });

  it('rejects a malformed today', () => {
    assert.throws(() => L.unitStatus(unit, [], [], '10/10/2026'), { name: 'TypeError', message: /Invalid day/ });
  });

  it('maintenance wins over a trip', () => {
    assert.deepEqual(L.unitStatus(unit, [onTrip()], [maint({ to: '2026-10-20' })], TODAY), {
      status: 'unavailable', reason: 'maintenance', availableOn: '2026-10-20',
    });
  });
});

// ---------------------------------------------------------------------------
// Notes: escaping and linkify
// ---------------------------------------------------------------------------
describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    assert.equal(L.escapeHtml(`<b>"x"</b> & 'y'`), '&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; &#39;y&#39;');
  });

  it('turns null, undefined and numbers into text', () => {
    assert.equal(L.escapeHtml(null), '');
    assert.equal(L.escapeHtml(undefined), '');
    assert.equal(L.escapeHtml(42), '42');
  });
});

describe('linkify', () => {
  const ANCHOR = /<a href="https?:\/\/[^"<>]*" target="_blank" rel="noopener noreferrer">/gi;

  /** Whatever is left once the anchors we generate are removed must be inert text. */
  function assertInert(html) {
    const rest = html.replace(ANCHOR, '').replace(/<\/a>/g, '');
    assert.doesNotMatch(rest, /[<>"']/, 'unescaped markup left in: ' + html);
  }
  const anchors = (html) => (html.match(/<a /g) || []).length;

  it('leaves plain text alone apart from escaping', () => {
    assert.equal(L.linkify('Llamar al cliente & confirmar'), 'Llamar al cliente &amp; confirmar');
  });

  it('turns an http(s) URL into a safe anchor', () => {
    assert.equal(
      L.linkify('Ver https://example.com/a'),
      'Ver <a href="https://example.com/a" target="_blank" rel="noopener noreferrer">https://example.com/a</a>',
    );
    assert.equal(anchors(L.linkify('http://example.com')), 1);
    assert.equal(anchors(L.linkify('HTTP://EXAMPLE.COM')), 1);
  });

  it('escapes ampersands inside the URL, both in the href and in the label', () => {
    assert.equal(
      L.linkify('https://example.com/?a=1&b=2'),
      '<a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">https://example.com/?a=1&amp;b=2</a>',
    );
  });

  it('links several URLs and keeps the text around them', () => {
    const out = L.linkify('A https://a.example B http://b.example C');
    assert.equal(anchors(out), 2);
    assert.match(out, /^A <a .*<\/a> B <a .*<\/a> C$/);
  });

  it('keeps trailing punctuation out of the link', () => {
    assert.match(L.linkify('Mira https://example.com/x.'), /x<\/a>\.$/);
    assert.match(L.linkify('(ver https://example.com/x)'), /x<\/a>\)$/);
    assert.match(L.linkify('¿https://example.com/x?'), /x<\/a>\?$/);
  });

  it('keeps balanced parentheses inside the link', () => {
    assert.match(L.linkify('https://example.com/A_(b)'), />https:\/\/example\.com\/A_\(b\)<\/a>$/);
  });

  it('does not link a bare scheme', () => {
    assert.equal(anchors(L.linkify('http:// y https://. fin')), 0);
  });

  it('never renders injected markup', () => {
    const out = L.linkify('<script>alert(1)</script><img src=x onerror=alert(1)>');
    assert.equal(out, '&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;');
    assertInert(out);
  });

  it('never creates a link for javascript:, data: or vbscript: URLs', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:msgbox(1)', '//evil.example', 'ftp://example.com']) {
      const out = L.linkify('click ' + bad);
      assert.equal(anchors(out), 0, bad);
      assertInert(out);
    }
  });

  it('cannot break out of the href attribute with quotes', () => {
    const out = L.linkify('https://a.example/" onmouseover="alert(1)');
    assert.equal(anchors(out), 1);
    assert.match(out, /^<a href="https:\/\/a\.example\/" target="_blank" rel="noopener noreferrer">/);
    assertInert(out);
    assert.ok(out.includes('&quot; onmouseover=&quot;alert(1)'));
  });

  it('stops the link at angle brackets and apostrophes', () => {
    const out = L.linkify("https://a.example/<img src=x onerror=alert(1)> y 'https://b.example/z'");
    assert.equal(anchors(out), 2);
    assertInert(out);
  });

  it('a javascript: payload after an http scheme is just part of a normal http link', () => {
    const out = L.linkify('https://a.example/?u=javascript:alert(1)');
    assert.equal(anchors(out), 1);
    assert.match(out, /href="https:\/\/a\.example\//);
  });

  it('turns null, undefined and numbers into text', () => {
    assert.equal(L.linkify(null), '');
    assert.equal(L.linkify(undefined), '');
    assert.equal(L.linkify(7), '7');
  });

  it('keeps line breaks as they are (the UI decides how to render them)', () => {
    assert.equal(L.linkify('uno\ndos'), 'uno\ndos');
  });
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
describe('sample data: trips', () => {
  const TODAY = '2026-10-10';
  const NOW = '2026-10-10T09:00';
  const trips = D.sampleTrips(TODAY);
  const events = L.allEvents(trips, 'es');
  const byFolio = (folio) => trips.find((t) => t.folio === folio);

  it('builds about ten trips with unique folios and references', () => {
    assert.ok(trips.length >= 10 && trips.length <= 12, 'count: ' + trips.length);
    assert.equal(new Set(trips.map((t) => t.folio)).size, trips.length);
    assert.equal(new Set(trips.map((t) => t.reference.toLowerCase())).size, trips.length);
  });

  it('every sample trip passes validateTrip', () => {
    for (const trip of trips) {
      assert.deepEqual(L.validateTrip(trip, trips), [], `folio ${trip.folio}`);
    }
  });

  it('covers all four event types', () => {
    assert.deepEqual([...new Set(events.map((e) => e.type))].sort(), ['CP', 'ENTREGA', 'TF', 'TL']);
  });

  it('covers own and subcontracted lines', () => {
    const lines = trips.flatMap((t) => [t.tl, t.tf]).filter(Boolean).map((s) => s.line);
    assert.ok(lines.includes('own'));
    assert.ok(lines.includes('subcontracted'));
  });

  it('covers 0, 1 and 2 containers', () => {
    const labels = new Set(trips.map((t) => L.cargoLabel(t, 'en')));
    assert.deepEqual([...labels].sort(), ['FULL', 'LOOSE CARGO', 'SINGLE']);
  });

  it('has trips with and without CP, TL, TF and delivery sections', () => {
    for (const key of ['cp', 'tl', 'tf', 'delivery']) {
      assert.ok(trips.some((t) => t[key]), 'some trip has ' + key);
      assert.ok(trips.some((t) => !t[key]), 'some trip lacks ' + key);
    }
  });

  it('has a trip with a CP followed by a TL and a TF (shows the magnet)', () => {
    const t = trips.find((x) => x.status === 'active' && x.cp && x.cp.datetime >= NOW && x.tl && x.tf && x.tl.datetime > x.cp.datetime && x.tf.datetime > x.cp.datetime);
    assert.ok(t);
    const r = L.evaluateMove(trips, { folio: t.folio, type: 'CP' }, L.addDays(t.cp.datetime.slice(0, 10), 1) + 'T18:00', NOW);
    assert.equal(r.ok, true);
    assert.equal(r.dependents, 2);
  });

  it('has a trip whose TL is before its CP (stays put under the magnet)', () => {
    assert.ok(trips.some((t) => t.cp && t.tl && t.tl.datetime < t.cp.datetime));
  });

  it('places events in the past, today and the next three weeks', () => {
    const days = events.map((e) => e.day);
    assert.ok(days.some((d) => d < TODAY), 'past');
    assert.ok(days.includes(TODAY), 'today');
    assert.ok(days.some((d) => d > TODAY && d <= L.addDays(TODAY, 21)), 'next weeks');
    assert.ok(days.every((d) => d <= L.addDays(TODAY, 21)), 'nothing beyond 3 weeks');
    assert.ok(days.every((d) => d >= L.addDays(TODAY, -7)), 'nothing older than a week');
  });

  it('exercises every day-click case around today', () => {
    const cases = new Set([L.addDays(TODAY, -4), L.addDays(TODAY, -1), TODAY, L.addDays(TODAY, 1), L.addDays(TODAY, 15)]
      .map((d) => L.classifyDay(d, trips, NOW)));
    assert.deepEqual([...cases].sort(), ['open_empty', 'open_with_events', 'past_empty', 'past_with_events']);
  });

  it('includes a cancelled trip whose events do not show', () => {
    const cancelled = trips.filter((t) => t.status === 'cancelled');
    assert.ok(cancelled.length >= 1);
    assert.ok(cancelled.every((t) => t.cancelReason.trim() !== ''));
    assert.ok(cancelled.every((t) => !events.some((e) => e.folio === t.folio)));
  });

  it('has at least one note with a link', () => {
    assert.ok(trips.some((t) => /https:\/\/example\.com\//.test(t.notes)));
  });

  it('only uses the fake catalog: clients, terminals, yards, agents, providers, cities', () => {
    const c = D.CATALOG;
    for (const t of trips) {
      assert.ok(c.clients.includes(t.client), t.client);
      if (t.cp) {
        assert.ok(c.terminals.includes(t.cp.terminal));
        assert.ok(c.customsAgents.includes(t.cp.customsAgent));
        assert.ok(c.services.includes(t.cp.service));
      }
      if (t.tl) assert.ok(c.yards.includes(t.tl.yard));
      if (t.tf) {
        assert.ok(c.cities.includes(t.tf.origin));
        assert.ok(c.cities.includes(t.tf.destination));
        assert.ok(t.tf.distanceKm > 0);
      }
      if (t.delivery) {
        assert.ok(c.cities.includes(t.delivery.destination));
        assert.ok(c.modalities.includes(t.delivery.modality));
      }
      for (const s of [t.tl, t.tf]) {
        if (!s) continue;
        if (s.line === 'subcontracted') assert.ok(c.providers.includes(s.provider));
        else assert.ok(c.drivers.includes(s.driver), s.driver);
      }
    }
  });

  it('delivery destination matches the long-haul destination when both exist', () => {
    for (const t of trips) {
      if (t.tf && t.delivery) assert.equal(t.delivery.destination, t.tf.destination, 'folio ' + t.folio);
    }
  });

  it('is relative to the given day and returns fresh objects', () => {
    const shifted = D.sampleTrips('2027-03-01');
    const delta = (a, b) => (Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000;
    assert.equal(delta(trips[1].cp.datetime, shifted[1].cp.datetime), delta(TODAY, '2027-03-01'));
    shifted[0].client = 'changed';
    assert.equal(D.sampleTrips(TODAY)[0].client, byFolio(trips[0].folio).client);
  });

  it('rejects a malformed day', () => {
    assert.throws(() => D.sampleTrips('today'), { name: 'TypeError', message: /Invalid day/ });
  });
});

describe('sample data: units and maintenance', () => {
  const TODAY = '2026-10-10';
  const trips = D.sampleTrips(TODAY);
  const units = D.sampleUnits();
  const maintenances = D.sampleMaintenances(TODAY);

  it('has tractors and trailers with plate, eco, odometer and next service km', () => {
    assert.ok(units.some((u) => u.kind === 'tractor'));
    assert.ok(units.some((u) => u.kind === 'trailer'));
    for (const u of units) {
      assert.match(u.plate, /\S/);
      assert.match(u.eco, /\S/);
      assert.ok(Number.isFinite(u.odometerKm) && u.odometerKm > 0);
      assert.ok(Number.isFinite(u.nextServiceKm) && u.nextServiceKm > u.odometerKm);
    }
    assert.equal(new Set(units.map((u) => u.eco)).size, units.length);
    assert.equal(new Set(units.map((u) => u.plate)).size, units.length);
  });

  it('every own-line unit in the trips exists in the unit list', () => {
    const ecos = new Set(units.map((u) => u.eco));
    for (const t of trips) {
      for (const s of [t.tl, t.tf]) {
        if (s && s.line === 'own') assert.ok(ecos.has(s.unit), s.unit);
      }
    }
  });

  it('has a unit within 1,000 km of its service and units that are fine', () => {
    const levels = units.map((u) => L.serviceWarning(u, 0));
    assert.ok(levels.some((w) => w && w.level === 'soon'));
    assert.ok(levels.some((w) => w === null));
  });

  it('maintenance windows are valid and point at known units', () => {
    const ecos = new Set(units.map((u) => u.eco));
    assert.ok(maintenances.length >= 2);
    for (const m of maintenances) {
      assert.ok(ecos.has(m.unit), m.unit);
      assert.ok(m.from <= m.to);
      assert.ok(['preventive', 'corrective'].includes(m.kind));
    }
  });

  it('today there are free units, one in maintenance and one on a trip', () => {
    const statuses = units.map((u) => L.unitStatus(u, trips, maintenances, TODAY));
    assert.ok(statuses.some((s) => s.status === 'free'));
    assert.ok(statuses.some((s) => s.reason === 'maintenance'));
    assert.ok(statuses.some((s) => s.reason === 'on_trip'));
  });

  it('is relative to the given day and returns fresh objects', () => {
    const day = '2027-03-01';
    const shifted = D.sampleMaintenances(day);
    assert.ok(shifted.every((m) => m.from >= L.addDays(day, -20) && m.to <= L.addDays(day, 20)));
    D.sampleUnits()[0].plate = 'changed';
    assert.notEqual(D.sampleUnits()[0].plate, 'changed');
  });
});
