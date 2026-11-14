'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

// The six services, in the order the section lists them, with their detail
// pages on /servicios/ (all exist) and the name shown in each language.
const SERVICIOS = [
  { slug: 'facturacion', es: 'Facturación electrónica', en: 'Electronic invoicing' },
  { slug: 'expedientes', es: 'Expedientes digitales', en: 'Digital document records' },
  { slug: 'operacion', es: 'Operación y logística', en: 'Operations and logistics' },
  { slug: 'web', es: 'Sitios y sistemas a medida', en: 'Custom websites and systems' },
  { slug: 'automatizacion', es: 'Automatización de procesos', en: 'Process automation' },
  { slug: 'soporte', es: 'Soporte y mantenimiento', en: 'Support and maintenance' },
];

const pages = {
  es: {
    source: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
    names: SERVICIOS.map((s) => s.es),
    audience: { servicios: 'Para negocios', experiencia: 'Para empleadores' },
    nav: ['proyectos', 'servicios', 'experiencia'],
    price: '50/50 por etapas',
  },
  en: {
    source: fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8'),
    names: SERVICIOS.map((s) => s.en),
    audience: { servicios: 'For businesses', experiencia: 'For employers' },
    nav: ['proyectos', 'servicios', 'experiencia'],
    price: '50/50 payment by milestones',
  },
};

function serviciosSection(source) {
  const match = source.match(/<section id="servicios"[\s\S]*?<\/section>/);
  assert.ok(match, 'expected a #servicios section on the home page');
  return match[0];
}

function experienciaSection(source) {
  const match = source.match(/<section id="experiencia"[\s\S]*?<\/section>/);
  assert.ok(match, 'expected a #experiencia section on the home page');
  return match[0];
}

for (const [lang, p] of Object.entries(pages)) {
  it(`${lang}: #servicios comes right after #proyectos, separated by a snap anchor`, () => {
    const proyectos = p.source.indexOf('id="proyectos"');
    const proyectosClose = p.source.indexOf('</section>', proyectos);
    const servicios = p.source.indexOf('id="servicios"');
    assert.ok(proyectos >= 0 && servicios >= 0, 'both sections must exist');
    assert.ok(servicios > proyectosClose, '#servicios must come after #proyectos');
    const between = p.source.slice(proyectosClose, servicios);
    assert.ok(between.includes('class="anclaje"'), 'a .anclaje must sit between the sections');
  });

  it(`${lang}: the section lists the six services as linked cards`, () => {
    const svc = serviciosSection(p.source);
    const cards = svc.match(/<a class="card[^"]*"[\s\S]*?<\/a>/g) ?? [];
    assert.equal(cards.length, 6, `expected 6 service cards, got ${cards.length}`);
    for (let i = 0; i < SERVICIOS.length; i++) {
      const card = cards[i];
      assert.match(
        card,
        new RegExp(`href="/servicios/${SERVICIOS[i].slug}/"`),
        `card ${i} must link to its detail page`,
      );
      assert.ok(card.includes(`<h3>${p.names[i]}</h3>`), `card ${i} must be named "${p.names[i]}"`);
    }
  });

  it(`${lang}: the section carries the MXN price, the stage-payment wording, a /servicios/ link and the WhatsApp CTA`, () => {
    const svc = serviciosSection(p.source);
    assert.ok(svc.includes('$8,000 MXN'), 'must show the MXN starting price');
    assert.ok(svc.includes(p.price), `must show the stage-payment wording "${p.price}"`);
    assert.ok(svc.includes('href="/servicios/"'), 'must link to the full services page');
    assert.ok(svc.includes('wa.me/525659304558'), 'must include the WhatsApp CTA number');
  });

  it(`${lang}: nav orders proyectos → servicios → experiencia`, () => {
    const nav = p.source.match(/<div class="navlinks">([\s\S]*?)<\/div>/)?.[1] ?? '';
    const hrefs = [...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    const idx = p.nav.map((h) => hrefs.indexOf(h));
    assert.ok(idx.every((i) => i >= 0), `nav must link the anchors ${p.nav.join(', ')}`);
    assert.ok(idx[0] < idx[1] && idx[1] < idx[2], 'nav must read proyectos, servicios, experiencia in that order');
  });

  it(`${lang}: the audience eyebrows exist (experiencia and servicios)`, () => {
    assert.ok(
      experienciaSection(p.source).includes(p.audience.experiencia),
      'an employers eyebrow must sit above the experience heading',
    );
    assert.ok(
      serviciosSection(p.source).includes(p.audience.servicios),
      'a businesses eyebrow must head the services section',
    );
  });
}
