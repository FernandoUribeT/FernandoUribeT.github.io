'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pages = {
  es: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
};

const casos = {
  es: {
    fn: 'estadoRevision',
    demoHref: '/demos/revision/',
    items: ['Frenos', 'Llantas', 'Luces', 'Documentos a bordo'],
    ok: { bloqueada: false, estado: 'Disponible para viaje', motivo: 'Revisión completa, sin fallas críticas.' },
    una: { bloqueada: true, estado: 'Unidad bloqueada', motivo: 'Falla crítica: Frenos. No se puede asignar a un viaje.' },
    varias: { bloqueada: true, estado: 'Unidad bloqueada', motivo: 'Falla crítica: Luces, Documentos a bordo. No se puede asignar a un viaje.' },
    foot: 'Igual que en producción: una falla crítica bloquea la unidad hasta que alguien la corrige y firma.',
    demoPie: 'data-pie="Calendario de viajes · nueve eventos de ejemplo, arrastre directo y ficha informativa"',
  },
  en: {
    fn: 'revisionState',
    demoHref: '/demos/inspection/',
    items: ['Brakes', 'Tires', 'Lights', 'Onboard documents'],
    ok: { blocked: false, status: 'Available for trips', reason: 'All checks passed, no critical failures.' },
    una: { blocked: true, status: 'Unit blocked', reason: "Critical failure: Brakes. It can't be assigned to a trip." },
    varias: { blocked: true, status: 'Unit blocked', reason: "Critical failure: Lights, Onboard documents. It can't be assigned to a trip." },
    foot: 'Same as in production',
    demoPie: 'data-pie="Trip calendar · nine sample events, direct drag, and a compact info card"',
  },
};

for (const [lang, source] of Object.entries(pages)) {
  const c = casos[lang];
  const header = source.match(/<header>([\s\S]*?)<\/header>/)?.[1];
  assert.ok(header, `${lang}: expected a <header> block`);
  const proyectos = source.match(/<section id="proyectos"[\s\S]*?<\/section>/)?.[0];
  assert.ok(proyectos, `${lang}: expected a #proyectos section`);

  it(`${lang}: hero shows the live inspection demo with 4 native radio groups and an aria-live status`, () => {
    assert.ok(header.includes('<div class="demo rv"'), 'demo panel present in the hero');
    for (const item of c.items) assert.ok(header.includes(item), `${item} listed in the demo`);
    assert.equal((header.match(/role="radiogroup"/g) || []).length, 4, 'exactly four radio groups');
    assert.equal((header.match(/<input type="radio"/g) || []).length, 8, 'OK/Fail pair per group');
    assert.match(header, /class="estado"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.ok(header.includes('ECO-14'), 'unit ECO-14 shown in the hero');
  });

  it(`${lang}: the carousel left the header and moved intact into #proyectos`, () => {
    assert.ok(!header.includes('<div class="carrusel'), 'no carousel in the header');
    assert.ok(proyectos.includes('<div class="carrusel rv" aria-roledescription="carrusel">'), 'carousel lives inside #proyectos');
    assert.ok(proyectos.includes(c.demoPie), 'first slide caption preserved verbatim');
    assert.ok(proyectos.includes('class="dia activa"'), 'active slide marker preserved');
    assert.equal((proyectos.match(/class="dia/g) || []).length, 4, 'all four slides moved');
    assert.ok(proyectos.includes('class="flecha izq"'), 'previous arrow preserved');
    assert.ok(proyectos.includes('class="flecha der"'), 'next arrow preserved');
    assert.match(proyectos, /class="pie-dia"[^>]*aria-live="polite"/, 'live caption preserved');
  });

  it(`${lang}: the pure rule returns available / blocked with one fault / blocked naming several in order`, () => {
    const script = source.match(/<script data-demo-revision>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script, `${lang}: extractable inline demo script`);
    const sandbox = { document: { getElementById: () => null } };
    vm.createContext(sandbox);
    vm.runInContext(script, sandbox);
    const fn = sandbox[c.fn];
    assert.equal(typeof fn, 'function', `${c.fn} exposed by the inline script`);
    // Objects from the vm realm carry a foreign prototype, so copy into the test realm.
    assert.deepEqual({ ...fn([]) }, c.ok, 'no failures keeps the unit available');
    assert.deepEqual({ ...fn([c.items[0]]) }, c.una, 'one failure blocks and names the item');
    assert.deepEqual({ ...fn([c.items[2], c.items[3]]) }, c.varias, 'several failures are named in order');
  });

  it(`${lang}: status never relies on color alone and the footer links the full demo`, () => {
    assert.ok(source.includes('.unit .estado::before{content:"✓"}'), 'ok state carries a check symbol');
    assert.ok(source.includes('.unit.bloq .estado::before{content:"■"}'), 'blocked state carries a square symbol');
    assert.match(header, new RegExp(`class="demo-foot"[\\s\\S]*?href="${c.demoHref}"`), 'footer links the revision demo');
    assert.ok(header.includes(c.foot), 'production note present in the footer');
  });
}
