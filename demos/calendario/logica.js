/*
 * Trip-calendar rules. Pure logic: no DOM, no clock, no storage.
 * Global CalLogica in the browser, module.exports in Node.
 *
 * CONVENTIONS
 *   day = 'YYYY-MM-DD'   dateTime = 'YYYY-MM-DDTHH:MM' (naive local time)
 *   Anything time-dependent takes an explicit `now` (dateTime) or `today`
 *   (day). Build `now` with fromDate(new Date()). Nothing here mutates its
 *   inputs; "changing" functions return new arrays/objects (untouched trips
 *   are reused by reference). lang is 'es' | 'en' (anything else: RangeError).
 *   Text inside trips is untrusted: render with textContent, escapeHtml() or
 *   linkify(), never raw innerHTML.
 *
 * DATA SHAPES
 *   trip   { folio, reference, client, cargo, notes, status, cancelReason,
 *            cp, tl, tf, delivery }
 *          status: 'active' | 'cancelled'. A section is null when unused.
 *          cargo: { type: 'containerized', containers: [1 or 2 numbers] }
 *                 | { type: 'loose', containers: [] }
 *          cp:       { datetime, service, terminal, customsAgent, maniobra }
 *          tl:       { datetime, yard, line, provider, unit, driver }
 *          tf:       { datetime, line, provider, unit, driver, origin,
 *                      destination, distanceKm }
 *          delivery: { datetime, destination, modality }
 *          line: 'own' | 'subcontracted'. For an own line, `unit` is the
 *          unit's eco number; for a subcontracted one it is free text.
 *   event  { ref: { folio, type }, folio, type, datetime, day, title, client,
 *            unit, driver }   type: 'CP' | 'TL' | 'TF' | 'ENTREGA'
 *   unit   { eco, kind: 'tractor' | 'trailer', plate, odometerKm, nextServiceKm }
 *   maintenance  { unit: eco, from, to, kind }   from/to are inclusive days
 *   palette      { tenant: { CP, TL, TF, ENTREGA }, clients: { [name]: { CP, TL, TF } } }
 *   filters      { clients: [], units: [], drivers: [] }  (missing/empty = no limit)
 *
 * EVENTS AND TITLES
 *   EVENT_TYPES                         ['CP', 'TL', 'TF', 'ENTREGA']
 *   tripEvents(trip, lang)              events of one trip, in type order; a
 *                                       section without a valid date-time or a
 *                                       cancelled trip gives none
 *   allEvents(trips, lang)              flat list for every trip
 *   eventTitle(trip, type, lang)        e.g. 'CITA A PUERTO EN <terminal>'
 *   cargoLabel(trip, lang)              FULL (2 containers) | SENCILLO/SINGLE (1)
 *                                       | CARGA SUELTA/LOOSE CARGO
 *   Unit/driver of an event: TL -> TL's; TF and ENTREGA -> TF's; CP -> TL's if
 *   the trip has a TL section, else TF's. Missing values are ''.
 *
 * COLORS
 *   DEFAULT_COLORS                      { CP, TL, TF, ENTREGA } hex values
 *   resolveColor(type, client, palette) client (CP/TL/TF only) > tenant >
 *                                       default; ignores anything not #rrggbb
 *   readableTextColor(bgHex)            '#ffffff' or '#12161e', whichever has
 *                                       the higher WCAG contrast
 *   relativeLuminance(hex), contrastRatio(hexA, hexB)
 *
 * FILTERS
 *   filterEvents(events, filters, visibleTypes?)   OR inside a list, AND across
 *                                       lists; visibleTypes = array of types
 *                                       (omit for all, [] hides everything)
 *   eventCounter(events, filters, visibleTypes?)   { visible, total }
 *
 * DRAG AND DROP
 *   evaluateMove(trips, eventRef, newDateTime, now)
 *       -> { ok: false, reason } with reason one of
 *            'invalid_datetime' | 'event_not_found' | 'past_day' | 'past_hour'
 *            | 'tf_not_after_cp'
 *       -> { ok: true, changes: [{ eventRef, from, to }], dependents: n }
 *          changes[0] is the dragged event; the rest were pushed by the CP
 *          magnet (a TL/TF at or after the CP keeps its gap when the CP moves
 *          later). `dependents` = changes.length - 1: "n linked events move".
 *   applyMove(trips, changes)           new trips array; throws RangeError for
 *                                       a change that targets a missing event
 *
 * DAY CLICK / CANCEL
 *   classifyDay(day, trips, now)        'past_empty' | 'past_with_events' |
 *                                       'open_empty' | 'open_with_events'
 *                                       (today is open)
 *   daySummary(day, trips, lang)        { day, events (by time), counts: {CP,TL,TF,ENTREGA} }
 *   cancelTrip(trips, folio, reason)    { ok: true, trips } | { ok: false,
 *                                       reason: 'reason_required' | 'trip_not_found' }
 *
 * TRIP FORM
 *   validateTrip(trip, existingTrips)   array of error codes ([] = valid), in
 *                                       this order: client_required,
 *                                       cargo_required, no_event_section,
 *                                       cp_datetime_required,
 *                                       tl_|tf_ datetime_required /
 *                                       provider_required (subcontracted only) /
 *                                       unit_required / driver_required,
 *                                       delivery_datetime_required,
 *                                       departure_after_delivery,
 *                                       reference_duplicate
 *   nextFolio(trips)                    max folio + 1 (1 when empty)
 *   newTripForDay(day, trips)           empty trip, CP/TL/TF prefilled at 08:00
 *
 * UNITS
 *   serviceWarning(unit, routeKm)       null | { level: 'soon', remainingKm }
 *                                       (within 1,000 km) | { level: 'overdue',
 *                                       overKm } (at or past the service km)
 *   unitStatus(unit, trips, maintenances, today)
 *                                       { status: 'free' } | { status:
 *                                       'unavailable', reason: 'maintenance' |
 *                                       'on_trip', availableOn }
 *                                       maintenance wins; availableOn is the
 *                                       window's last day, or the day after the
 *                                       trip's last event
 *
 * TEXT AND TIME HELPERS
 *   escapeHtml(value)                   & < > " ' escaped; null/undefined -> ''
 *   linkify(text)                       escaped text with http(s) URLs as
 *                                       <a target="_blank" rel="noopener noreferrer">
 *   dayOf(dateTime), addDays(day, n), fromDate(jsDate)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalLogica = factory();
  }
})(this, function () {
  'use strict';

  /* ===================================================================
   * Time helpers. Everything is a naive local string, never a Date, so
   * the rules are timezone- and DST-proof and trivially testable.
   *   day      = 'YYYY-MM-DD'
   *   dateTime = 'YYYY-MM-DDTHH:MM'
   * =================================================================== */
  const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  const DT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

  function pad(n, width) {
    return String(n).padStart(width || 2, '0');
  }

  function dayOf(dateTime) {
    return dateTime.slice(0, 10);
  }

  const shiftDay = (m, n) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);

  /** True for a real calendar day in 'YYYY-MM-DD' form. */
  function isDay(value) {
    const m = typeof value === 'string' ? DAY_RE.exec(value) : null;
    return m !== null && shiftDay(m, 0) === value;
  }

  function assertDay(value) {
    if (!isDay(value)) throw new TypeError('Invalid day: ' + value);
  }

  function addDays(day, n) {
    assertDay(day);
    return shiftDay(DAY_RE.exec(day), n);
  }

  function fromDate(date) {
    return pad(date.getFullYear(), 4) + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  /** Minutes since the epoch of a naive date-time, or null when malformed. */
  function parseDateTime(value) {
    const m = typeof value === 'string' ? DT_RE.exec(value) : null;
    if (!m) return null;
    const [y, mo, d, h, mi] = m.slice(1).map(Number);
    const ms = Date.UTC(y, mo - 1, d, h, mi);
    const check = new Date(ms);
    const real = check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 &&
      check.getUTCDate() === d && check.getUTCHours() === h && check.getUTCMinutes() === mi;
    return real ? ms / 60000 : null;
  }

  /** Minutes of a `now` argument; a malformed one is a caller bug, not user input. */
  function requireNow(now) {
    const minutes = parseDateTime(now);
    if (minutes === null) throw new TypeError('Invalid now: ' + now);
    return minutes;
  }

  /* ===================================================================
   * Trip -> calendar events, titles, cargo labels
   * =================================================================== */
  const EVENT_TYPES = Object.freeze(['CP', 'TL', 'TF', 'ENTREGA']);
  const SECTION_KEY = Object.freeze({ CP: 'cp', TL: 'tl', TF: 'tf', ENTREGA: 'delivery' });

  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const text = (value) => (value === undefined || value === null ? '' : String(value));

  const STRINGS = {
    es: {
      cargo: { full: 'FULL', single: 'SENCILLO', loose: 'CARGA SUELTA' },
      title: {
        CP: (sec) => 'CITA A PUERTO EN ' + text(sec.terminal),
        TL: (sec) => 'DESPACHOS/VACÍOS ' + text(sec.yard),
        TF: (sec) => 'SALIDA ' + text(sec.origin) + ' > ' + text(sec.destination),
        ENTREGA: (sec, cargo) => cargo + ' ENTREGA A ' + text(sec.destination),
      },
    },
    en: {
      cargo: { full: 'FULL', single: 'SINGLE', loose: 'LOOSE CARGO' },
      title: {
        CP: (sec) => 'PORT APPOINTMENT AT ' + text(sec.terminal),
        TL: (sec) => 'DISPATCH/EMPTIES ' + text(sec.yard),
        TF: (sec) => 'DEPARTURE ' + text(sec.origin) + ' > ' + text(sec.destination),
        ENTREGA: (sec, cargo) => cargo + ' DELIVERY TO ' + text(sec.destination),
      },
    },
  };

  function strings(lang) {
    if (!hasOwn(STRINGS, lang)) throw new RangeError('Unsupported language: ' + lang);
    return STRINGS[lang];
  }

  function containerCount(cargo) {
    if (!cargo || cargo.type !== 'containerized' || !Array.isArray(cargo.containers)) return 0;
    return cargo.containers.filter((c) => typeof c === 'string' && c.trim() !== '').length;
  }

  function cargoLabel(trip, lang) {
    const labels = strings(lang).cargo;
    const n = containerCount(trip.cargo);
    if (n >= 2) return labels.full;
    return n === 1 ? labels.single : labels.loose;
  }

  function eventTitle(trip, type, lang) {
    const templates = strings(lang).title;
    if (!hasOwn(templates, type)) throw new RangeError('Unsupported event type: ' + type);
    return templates[type](trip[SECTION_KEY[type]] || {}, cargoLabel(trip, lang));
  }

  /** Unit and driver a given event is attributed to (drives the filters). */
  function eventActor(trip, type) {
    let source;
    if (type === 'TL') source = trip.tl;
    else if (type === 'CP') source = trip.tl || trip.tf;
    else source = trip.tf;
    return { unit: text(source && source.unit), driver: text(source && source.driver) };
  }

  const isActive = (trip) => Boolean(trip) && trip.status !== 'cancelled';

  /** Date-time of an active trip's section of the given type, or null. */
  function sectionDateTime(trip, type) {
    if (!isActive(trip) || !hasOwn(SECTION_KEY, type)) return null;
    const section = trip[SECTION_KEY[type]];
    return section && parseDateTime(section.datetime) !== null ? section.datetime : null;
  }

  function tripEvents(trip, lang) {
    return EVENT_TYPES
      .filter((type) => sectionDateTime(trip, type) !== null)
      .map((type) => {
        const datetime = sectionDateTime(trip, type);
        const actor = eventActor(trip, type);
        return {
          ref: { folio: trip.folio, type },
          folio: trip.folio,
          type,
          datetime,
          day: dayOf(datetime),
          title: eventTitle(trip, type, lang),
          client: trip.client,
          unit: actor.unit,
          driver: actor.driver,
        };
      });
  }

  function allEvents(trips, lang) {
    return trips.reduce((acc, trip) => acc.concat(tripEvents(trip, lang)), []);
  }

  /* ===================================================================
   * Colors: client (CP/TL/TF only) > tenant > default; WCAG text color
   * =================================================================== */
  const DEFAULT_COLORS = Object.freeze({ CP: '#e0567a', TL: '#54c7ec', TF: '#f0b429', ENTREGA: '#ff9f45' });
  const CLIENT_COLOR_TYPES = Object.freeze(['CP', 'TL', 'TF']);
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  const LIGHT_TEXT = '#ffffff';
  const DARK_TEXT = '#12161e';

  const isHexColor = (value) => typeof value === 'string' && HEX_RE.test(value);

  /** Own, well-formed #rrggbb value at map[key], or null. */
  function colorAt(map, key) {
    return map && hasOwn(map, key) && isHexColor(map[key]) ? map[key] : null;
  }

  function resolveColor(type, client, palette) {
    if (!hasOwn(DEFAULT_COLORS, type)) throw new RangeError('Unsupported event type: ' + type);
    const colors = palette || {};
    const clientColor = CLIENT_COLOR_TYPES.includes(type)
      ? colorAt(colors.clients && hasOwn(colors.clients, client) ? colors.clients[client] : null, type)
      : null;
    return clientColor || colorAt(colors.tenant, type) || DEFAULT_COLORS[type];
  }

  function relativeLuminance(hex) {
    if (!isHexColor(hex)) throw new TypeError('Expected a #rrggbb color, got: ' + hex);
    const channel = (start) => {
      const c = parseInt(hex.slice(start, start + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  }

  function contrastRatio(hexA, hexB) {
    const a = relativeLuminance(hexA);
    const b = relativeLuminance(hexB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  /** White or near-black text, whichever contrasts more with the background. */
  function readableTextColor(background) {
    return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
  }

  /* ===================================================================
   * Filters: OR inside a list, AND across lists, plus type visibility
   * =================================================================== */
  /** An empty or missing list puts no constraint on the field. */
  const matchesList = (list, value) => !Array.isArray(list) || list.length === 0 || list.includes(value);

  function filterEvents(events, filters, visibleTypes) {
    const f = filters || {};
    return events.filter((e) =>
      (!Array.isArray(visibleTypes) || visibleTypes.includes(e.type)) &&
      matchesList(f.clients, e.client) &&
      matchesList(f.units, e.unit) &&
      matchesList(f.drivers, e.driver));
  }

  function eventCounter(events, filters, visibleTypes) {
    return { visible: filterEvents(events, filters, visibleTypes).length, total: events.length };
  }

  /* ===================================================================
   * Drag and drop: rule evaluation and (pure) application
   * =================================================================== */
  const MAGNET_DEPENDENTS = Object.freeze(['TL', 'TF']);

  const reject = (reason) => ({ ok: false, reason });
  const findTrip = (trips, folio) => trips.find((t) => t.folio === folio);

  function formatMinutes(minutes) {
    return new Date(minutes * 60000).toISOString().slice(0, 16);
  }

  /**
   * CP magnet: when the CP moves later, a TL/TF that sat at or after the CP
   * is pushed so it keeps its original gap. Earlier ones stay put.
   */
  function magnetChanges(trip, originalCp, newCp) {
    if (newCp <= originalCp) return [];
    return MAGNET_DEPENDENTS.reduce((changes, type) => {
      const from = sectionDateTime(trip, type);
      const gap = from === null ? -1 : parseDateTime(from) - originalCp;
      if (gap >= 0) {
        changes.push({ eventRef: { folio: trip.folio, type }, from, to: formatMinutes(newCp + gap) });
      }
      return changes;
    }, []);
  }

  function evaluateMove(trips, eventRef, newDateTime, now) {
    const nowMinutes = requireNow(now);
    const target = parseDateTime(newDateTime);
    if (target === null) return reject('invalid_datetime');

    const trip = findTrip(trips, eventRef.folio);
    const from = trip ? sectionDateTime(trip, eventRef.type) : null;
    if (from === null) return reject('event_not_found');

    if (dayOf(newDateTime) < dayOf(now)) return reject('past_day');
    if (target < nowMinutes) return reject('past_hour');

    if (eventRef.type === 'TF') {
      const cpFrom = sectionDateTime(trip, 'CP');
      if (cpFrom !== null && target <= parseDateTime(cpFrom)) return reject('tf_not_after_cp');
    }

    const changes = [{ eventRef: { folio: trip.folio, type: eventRef.type }, from, to: newDateTime }];
    if (eventRef.type === 'CP') {
      changes.push(...magnetChanges(trip, parseDateTime(from), target));
    }
    return { ok: true, changes, dependents: changes.length - 1 };
  }

  function applyMove(trips, changes) {
    changes.forEach((c) => {
      const trip = findTrip(trips, c.eventRef.folio);
      if (!trip || sectionDateTime(trip, c.eventRef.type) === null) {
        throw new RangeError('Change targets a missing event: ' + c.eventRef.folio + ':' + c.eventRef.type);
      }
    });
    return trips.map((trip) => {
      const mine = changes.filter((c) => c.eventRef.folio === trip.folio);
      if (mine.length === 0) return trip;
      const next = Object.assign({}, trip);
      mine.forEach((c) => {
        const key = SECTION_KEY[c.eventRef.type];
        next[key] = Object.assign({}, next[key], { datetime: c.to });
      });
      return next;
    });
  }

  /* ===================================================================
   * Day click and cancel
   * =================================================================== */
  function classifyDay(day, trips, now) {
    assertDay(day);
    requireNow(now);
    const past = day < dayOf(now);
    const hasEvents = allEvents(trips, 'es').some((e) => e.day === day);
    return (past ? 'past_' : 'open_') + (hasEvents ? 'with_events' : 'empty');
  }

  function daySummary(day, trips, lang) {
    assertDay(day);
    const events = allEvents(trips, lang)
      .filter((e) => e.day === day)
      .sort((a, b) =>
        a.datetime.localeCompare(b.datetime) ||
        EVENT_TYPES.indexOf(a.type) - EVENT_TYPES.indexOf(b.type) ||
        a.folio - b.folio);
    const counts = Object.fromEntries(EVENT_TYPES.map((type) => [type, 0]));
    events.forEach((e) => { counts[e.type] += 1; });
    return { day, events, counts };
  }

  function cancelTrip(trips, folio, reason) {
    const cleaned = typeof reason === 'string' ? reason.trim() : '';
    if (cleaned === '') return reject('reason_required');
    if (!findTrip(trips, folio)) return reject('trip_not_found');
    return {
      ok: true,
      trips: trips.map((t) => (t.folio === folio ? Object.assign({}, t, { status: 'cancelled', cancelReason: cleaned }) : t)),
    };
  }

  /* ===================================================================
   * Trip form: validation and new-trip helpers
   * =================================================================== */
  const isBlank = (value) => typeof value !== 'string' || value.trim() === '';
  const normalizeReference = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

  function cargoIsValid(cargo) {
    if (!cargo) return false;
    if (cargo.type === 'loose') return true;
    const n = containerCount(cargo);
    return cargo.type === 'containerized' && (n === 1 || n === 2);
  }

  /** Errors of a haul section (TL or TF): date-time, provider when subcontracted, unit, driver. */
  function haulErrors(prefix, section) {
    const errors = [];
    if (parseDateTime(section.datetime) === null) errors.push(prefix + '_datetime_required');
    if (section.line === 'subcontracted' && isBlank(section.provider)) errors.push(prefix + '_provider_required');
    if (isBlank(section.unit)) errors.push(prefix + '_unit_required');
    if (isBlank(section.driver)) errors.push(prefix + '_driver_required');
    return errors;
  }

  function validateTrip(trip, existingTrips) {
    const errors = [];
    if (isBlank(trip.client)) errors.push('client_required');
    if (!cargoIsValid(trip.cargo)) errors.push('cargo_required');
    if (!trip.cp && !trip.tl && !trip.tf) errors.push('no_event_section');
    if (trip.cp && parseDateTime(trip.cp.datetime) === null) errors.push('cp_datetime_required');
    if (trip.tl) errors.push(...haulErrors('tl', trip.tl));
    if (trip.tf) errors.push(...haulErrors('tf', trip.tf));
    if (trip.delivery && parseDateTime(trip.delivery.datetime) === null) errors.push('delivery_datetime_required');

    const departure = trip.tf ? parseDateTime(trip.tf.datetime) : null;
    const arrival = trip.delivery ? parseDateTime(trip.delivery.datetime) : null;
    if (departure !== null && arrival !== null && departure > arrival) errors.push('departure_after_delivery');

    const reference = normalizeReference(trip.reference);
    if (reference !== '' && (existingTrips || []).some((t) => t.folio !== trip.folio && normalizeReference(t.reference) === reference)) {
      errors.push('reference_duplicate');
    }
    return errors;
  }

  function nextFolio(trips) {
    return trips.reduce((max, t) => Math.max(max, t.folio), 0) + 1;
  }

  function newTripForDay(day, trips) {
    assertDay(day);
    const datetime = day + 'T08:00';
    return {
      folio: nextFolio(trips),
      reference: '',
      client: '',
      cargo: null,
      notes: '',
      status: 'active',
      cancelReason: '',
      cp: { datetime, service: '', terminal: '', customsAgent: '', maniobra: false },
      tl: { datetime, yard: '', line: 'own', provider: '', unit: '', driver: '' },
      tf: { datetime, line: 'own', provider: '', unit: '', driver: '', origin: '', destination: '', distanceKm: 0 },
      delivery: null,
    };
  }

  /* ===================================================================
   * Preventive-maintenance warning and unit availability
   * =================================================================== */
  const SERVICE_WARNING_KM = 1000;

  const finiteNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

  function serviceWarning(unit, routeKm) {
    const odometer = unit ? finiteNumber(unit.odometerKm) : null;
    const nextService = unit ? finiteNumber(unit.nextServiceKm) : null;
    if (odometer === null || nextService === null) return null;
    const route = finiteNumber(routeKm) > 0 ? routeKm : 0;
    const remaining = nextService - (odometer + route);
    if (remaining <= 0) return { level: 'overdue', overKm: Math.abs(remaining) };
    return remaining <= SERVICE_WARNING_KM ? { level: 'soon', remainingKm: remaining } : null;
  }

  const latest = (days) => days.reduce((a, b) => (b > a ? b : a));
  const earliest = (days) => days.reduce((a, b) => (b < a ? b : a));
  const unavailable = (reason, availableOn) => ({ status: 'unavailable', reason, availableOn });

  /** Last event day of every active trip that uses the unit and spans `today`. */
  function tripSpansLastDays(unit, trips, today) {
    return trips.reduce((lastDays, trip) => {
      const events = tripEvents(trip, 'es');
      if (!events.some((e) => e.unit === unit.eco)) return lastDays;
      const days = events.map((e) => e.day);
      const last = latest(days);
      if (earliest(days) <= today && today <= last) lastDays.push(last);
      return lastDays;
    }, []);
  }

  function unitStatus(unit, trips, maintenances, today) {
    assertDay(today);
    const ends = (maintenances || [])
      .filter((m) => m.unit === unit.eco && m.from <= today && today <= m.to)
      .map((m) => m.to);
    if (ends.length > 0) return unavailable('maintenance', latest(ends));
    const lastDays = tripSpansLastDays(unit, trips, today);
    if (lastDays.length > 0) return unavailable('on_trip', addDays(latest(lastDays), 1));
    return { status: 'free' };
  }

  /* ===================================================================
   * Notes: HTML escaping and safe auto-linking
   * =================================================================== */
  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;
  const TRAILING_PUNCTUATION_RE = /[.,;:!?]$/;

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
  }

  const countOf = (str, ch) => str.split(ch).length - 1;

  /** Drops sentence punctuation and unbalanced closing parentheses from a matched URL. */
  function trimUrlEnd(url) {
    let end = url;
    while (end.length > 0) {
      const closesUnbalanced = end.endsWith(')') && countOf(end, ')') > countOf(end, '(');
      if (!TRAILING_PUNCTUATION_RE.test(end) && !closesUnbalanced) break;
      end = end.slice(0, -1);
    }
    return end;
  }

  /**
   * Escapes the text and links http(s) URLs. Text is split around the URLs
   * first and each piece is escaped on its own, so a quote or bracket can
   * never survive into markup. Only http/https can become a link.
   */
  function linkify(value) {
    const raw = text(value);
    let html = '';
    let cursor = 0;
    for (const match of raw.matchAll(URL_RE)) {
      const url = trimUrlEnd(match[0]);
      if (!/^https?:\/\/./i.test(url)) continue;
      const safe = escapeHtml(url);
      html += escapeHtml(raw.slice(cursor, match.index)) +
        '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + safe + '</a>';
      cursor = match.index + url.length;
    }
    return html + escapeHtml(raw.slice(cursor));
  }

  return Object.freeze({
    EVENT_TYPES, tripEvents, allEvents, eventTitle, cargoLabel,
    DEFAULT_COLORS, resolveColor, readableTextColor, relativeLuminance, contrastRatio,
    filterEvents, eventCounter,
    evaluateMove, applyMove,
    classifyDay, daySummary, cancelTrip,
    validateTrip, nextFolio, newTripForDay,
    serviceWarning, unitStatus,
    escapeHtml, linkify,
    dayOf, addDays, fromDate,
  });
});
