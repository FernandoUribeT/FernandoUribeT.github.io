/*
 * Fake sample data for the trip-calendar demo. Every company, person, plate
 * and number is invented. Cities are real public places; terminals, yards and
 * agencies use generic names on purpose.
 *
 * Depends on logica.js (load it first in the browser: CalLogica).
 *
 * Public API (global CalDatos / CommonJS):
 *   CATALOG                      lists the forms can offer (frozen): clients,
 *                                terminals, yards, customsAgents, providers,
 *                                drivers (own line), cities, services
 *                                ('import' | 'export' | 'empty_return'),
 *                                modalities ('direct' | 'drop').
 *   sampleTrips(today)           ~11 trips relative to `today` ('YYYY-MM-DD'),
 *                                from 5 days ago to 3 weeks ahead. Fresh
 *                                objects on every call. Throws TypeError on a
 *                                malformed day.
 *   sampleUnits()                tractors ('T..') and trailers ('R..'):
 *                                { eco, kind, plate, odometerKm, nextServiceKm }.
 *   sampleMaintenances(today)    [{ unit: eco, from, to, kind }] with
 *                                kind 'preventive' | 'corrective'.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./logica.js'));
  } else {
    root.CalDatos = factory(root.CalLogica);
  }
})(this, function (L) {
  'use strict';

  const CATALOG = Object.freeze({
    clients: Object.freeze(['Comercial Atlas', 'Logística Rivera', 'Naviera del Pacífico']),
    terminals: Object.freeze(['Terminal 1', 'Terminal 2', 'Terminal Norte']),
    yards: Object.freeze(['Patio Manzanillo', 'Patio Colima', 'Patio Zapopan']),
    customsAgents: Object.freeze(['Agencia Aduanal Demo Uno', 'Agencia Aduanal Demo Dos']),
    providers: Object.freeze(['Fletes Demo del Bajío', 'Autotransportes Ejemplo Occidente']),
    drivers: Object.freeze(['A. Rodríguez', 'M. Sánchez', 'J. Herrera', 'L. Ramírez']),
    cities: Object.freeze(['Manzanillo', 'Zapopan', 'Guadalajara', 'Colima', 'León', 'Querétaro', 'Amacueca']),
    services: Object.freeze(['import', 'export', 'empty_return']),
    modalities: Object.freeze(['direct', 'drop']),
  });

  const SUBCONTRACTOR_A = { line: 'subcontracted', provider: 'Fletes Demo del Bajío', unit: 'XL-482-B', driver: 'P. Domínguez' };
  const SUBCONTRACTOR_B = { line: 'subcontracted', provider: 'Autotransportes Ejemplo Occidente', unit: 'ZK-310-C', driver: 'E. Vargas' };

  /** Builds a trip from compact section descriptions, all relative to `today`. */
  function sampleTrips(today) {
    const at = (offset, time) => L.addDays(today, offset) + 'T' + time;
    const own = (unit, driver) => ({ line: 'own', provider: '', unit, driver });
    const loose = { type: 'loose', containers: [] };
    const boxes = (...numbers) => ({ type: 'containerized', containers: numbers });

    const cp = (offset, time, terminal, service, customsAgent, maniobra) =>
      ({ datetime: at(offset, time), service, terminal, customsAgent, maniobra });
    const tl = (offset, time, yard, haul) => Object.assign({ datetime: at(offset, time), yard }, haul);
    const tf = (offset, time, origin, destination, distanceKm, haul) =>
      Object.assign({ datetime: at(offset, time), origin, destination, distanceKm }, haul);
    const delivery = (offset, time, destination, modality) => ({ datetime: at(offset, time), destination, modality });

    const trip = (folio, reference, client, cargo, sections, extra) => Object.assign({
      folio, reference, client, cargo, notes: '', status: 'active', cancelReason: '',
      cp: null, tl: null, tf: null, delivery: null,
    }, sections, extra);

    return [
      // Finished trip, all four events in the past.
      trip(1001, 'ATL-2410-001', 'Comercial Atlas', boxes('ZZZU1000001', 'ZZZU1000018'), {
        cp: cp(-5, '08:00', 'Terminal 1', 'import', 'Agencia Aduanal Demo Uno', true),
        tl: tl(-5, '11:00', 'Patio Manzanillo', own('T05', 'M. Sánchez')),
        tf: tf(-4, '06:30', 'Manzanillo', 'Zapopan', 345, own('T05', 'M. Sánchez')),
        delivery: delivery(-3, '10:00', 'Zapopan', 'direct'),
      }, { notes: 'PO-4471 https://example.com/track/1001' }),

      // Port appointment today, then TL and TF later: the CP magnet drags both.
      trip(1002, 'RIV-2410-014', 'Logística Rivera', boxes('ZZZU2000002'), {
        cp: cp(0, '11:00', 'Terminal 2', 'import', 'Agencia Aduanal Demo Dos', false),
        tl: tl(0, '14:00', 'Patio Manzanillo', own('T18', 'J. Herrera')),
        tf: tf(1, '05:30', 'Manzanillo', 'Guadalajara', 340, own('T18', 'J. Herrera')),
        delivery: delivery(1, '11:00', 'Guadalajara', 'direct'),
      }),

      // The TL happens before the CP, so it stays put when the CP moves. T22 is close to its service.
      trip(1003, 'NAV-2410-007', 'Naviera del Pacífico', boxes('ZZZU3000003', 'ZZZU3000010'), {
        tl: tl(2, '07:00', 'Patio Colima', own('T22', 'A. Rodríguez')),
        cp: cp(2, '10:00', 'Terminal Norte', 'import', 'Agencia Aduanal Demo Uno', true),
        tf: tf(3, '04:00', 'Manzanillo', 'León', 520, own('T22', 'A. Rodríguez')),
        delivery: delivery(3, '18:00', 'León', 'direct'),
      }),

      // Loose cargo, both hauls subcontracted, no port appointment.
      trip(1004, 'ATL-2410-002', 'Comercial Atlas', loose, {
        tl: tl(4, '08:00', 'Patio Zapopan', SUBCONTRACTOR_A),
        tf: tf(4, '15:00', 'Zapopan', 'Querétaro', 400, SUBCONTRACTOR_B),
        delivery: delivery(6, '09:00', 'Querétaro', 'drop'),
      }, { notes: 'PO-5521 https://example.com/po/5521' }),

      // No local haul: the CP is attributed to the long-haul unit and driver.
      trip(1005, 'RIV-2410-015', 'Logística Rivera', boxes('ZZZU4000004'), {
        cp: cp(7, '09:30', 'Terminal 1', 'export', 'Agencia Aduanal Demo Dos', true),
        tf: tf(8, '06:00', 'Manzanillo', 'Amacueca', 215, own('T13', 'M. Sánchez')),
        delivery: delivery(8, '13:00', 'Amacueca', 'direct'),
      }),

      // Empties dispatch only.
      trip(1006, 'NAV-2410-008', 'Naviera del Pacífico', boxes('ZZZU5000005', 'ZZZU5000012'), {
        tl: tl(9, '07:20', 'Patio Manzanillo', own('T27', 'J. Herrera')),
      }),

      // Subcontracted local haul, own long haul.
      trip(1007, 'ATL-2410-003', 'Comercial Atlas', boxes('ZZZU6000006'), {
        cp: cp(12, '08:00', 'Terminal 2', 'import', 'Agencia Aduanal Demo Uno', false),
        tl: tl(12, '12:00', 'Patio Manzanillo', SUBCONTRACTOR_A),
        tf: tf(13, '05:00', 'Manzanillo', 'Guadalajara', 340, own('T05', 'L. Ramírez')),
        delivery: delivery(13, '14:00', 'Guadalajara', 'drop'),
      }),

      // Loose cargo, long haul and delivery only.
      trip(1008, 'RIV-2410-016', 'Logística Rivera', loose, {
        tf: tf(10, '07:00', 'Manzanillo', 'Colima', 100, own('T18', 'J. Herrera')),
        delivery: delivery(10, '11:00', 'Colima', 'direct'),
      }),

      trip(1009, 'NAV-2410-009', 'Naviera del Pacífico', boxes('ZZZU7000007', 'ZZZU7000014'), {
        cp: cp(16, '10:00', 'Terminal Norte', 'import', 'Agencia Aduanal Demo Dos', true),
        tl: tl(16, '13:00', 'Patio Manzanillo', own('T13', 'A. Rodríguez')),
        tf: tf(17, '05:00', 'Manzanillo', 'Querétaro', 740, own('T13', 'A. Rodríguez')),
        delivery: delivery(18, '12:00', 'Querétaro', 'direct'),
      }),

      trip(1010, 'ATL-2410-004', 'Comercial Atlas', boxes('ZZZU8000008'), {
        cp: cp(20, '08:00', 'Terminal Norte', 'export', 'Agencia Aduanal Demo Uno', false),
        tl: tl(20, '11:00', 'Patio Manzanillo', own('T05', 'L. Ramírez')),
        tf: tf(21, '06:00', 'Manzanillo', 'Zapopan', 345, own('T05', 'L. Ramírez')),
        delivery: delivery(21, '15:00', 'Zapopan', 'direct'),
      }),

      // Cancelled: keeps its folio, shows no events.
      trip(1011, 'RIV-2410-017', 'Logística Rivera', boxes('ZZZU9000009'), {
        cp: cp(5, '09:00', 'Terminal 1', 'import', 'Agencia Aduanal Demo Dos', false),
        tf: tf(5, '15:00', 'Manzanillo', 'León', 520, own('T13', 'M. Sánchez')),
      }, { status: 'cancelled', cancelReason: 'Rescheduled by the client' }),
    ];
  }

  function sampleUnits() {
    return [
      { eco: 'T05', kind: 'tractor', plate: 'JX-451-A', odometerKm: 84210, nextServiceKm: 90000 },
      { eco: 'T13', kind: 'tractor', plate: 'JX-462-B', odometerKm: 61870, nextServiceKm: 70000 },
      { eco: 'T18', kind: 'tractor', plate: 'JX-478-C', odometerKm: 102300, nextServiceKm: 110000 },
      { eco: 'T22', kind: 'tractor', plate: 'JX-503-D', odometerKm: 119350, nextServiceKm: 120000 },
      { eco: 'T27', kind: 'tractor', plate: 'JX-517-E', odometerKm: 74560, nextServiceKm: 80000 },
      { eco: 'R01', kind: 'trailer', plate: 'RM-120-A', odometerKm: 40200, nextServiceKm: 50000 },
      { eco: 'R02', kind: 'trailer', plate: 'RM-131-B', odometerKm: 38950, nextServiceKm: 45000 },
      { eco: 'R03', kind: 'trailer', plate: 'RM-142-C', odometerKm: 27400, nextServiceKm: 35000 },
    ];
  }

  function sampleMaintenances(today) {
    const day = (offset) => L.addDays(today, offset);
    return [
      { unit: 'T05', from: day(-12), to: day(-10), kind: 'preventive' },
      { unit: 'T27', from: day(-1), to: day(2), kind: 'preventive' },
      { unit: 'R02', from: day(5), to: day(8), kind: 'corrective' },
    ];
  }

  return { CATALOG, sampleTrips, sampleUnits, sampleMaintenances };
});
