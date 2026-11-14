'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const spanish = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const english = fs.readFileSync(path.join(root, 'en', 'index.html'), 'utf8');

function headerOf(source) {
  const match = source.match(/<header>([\s\S]*?)<\/header>/);
  assert.ok(match, 'expected a <header> block');
  return match[1];
}

function doorsOf(header) {
  const doors = [];
  const re = /<article class="door[^"]*">([\s\S]*?)<\/article>/g;
  let match;
  while ((match = re.exec(header)) !== null) doors.push(match[1]);
  return doors;
}

const pages = [
  {
    name: 'spanish',
    source: spanish,
    stats: ['<b>169</b>', '<b>45<i>/71</i></b>', '<b>11</b>', '<b>9.46</b>'],
  },
  {
    name: 'english',
    source: english,
    stats: ['<b>169</b>', '<b>45<i>/71</i></b>', '<b>11</b>', '<b>3.78</b>'],
  },
];

for (const page of pages) {
  it(`hero doors: exactly two articles with the audience headings (${page.name})`, () => {
    const header = headerOf(page.source);
    const doors = doorsOf(header);
    assert.equal(doors.length, 2, 'expected exactly two door articles');
    assert.ok(
      doors[0].includes(page.name === 'spanish' ? 'Si buscas contratar' : "If you're hiring"),
      'employer door heading missing',
    );
    assert.ok(
      doors[1].includes(page.name === 'spanish' ? 'Si tienes un negocio' : 'If you run a business'),
      'business door heading missing',
    );
    const iCarousel = header.search(/class="carrusel\b/);
    const iDoors = header.indexOf('<div class="doors');
    const iStats = header.indexOf('<div class="stats rv">');
    assert.ok(iCarousel > -1 && iDoors > -1 && iStats > -1, 'hero blocks present');
    assert.ok(iCarousel < iDoors && iDoors < iStats, 'hero order is carousel → doors → stats');
  });

  it(`hero doors: employer door routes to experiencia and both CV PDFs (${page.name})`, () => {
    const doors = doorsOf(headerOf(page.source));
    assert.equal(doors.length, 2);
    assert.match(doors[0], /href="#experiencia"/);
    assert.equal(doors[0].match(/Fernando_Uribe_CV_ES\.pdf/g).length, 1);
    assert.equal(doors[0].match(/Fernando_Uribe_CV\.pdf/g).length, 1);
  });

  it(`hero doors: business door routes to the services page and WhatsApp (${page.name})`, () => {
    const doors = doorsOf(headerOf(page.source));
    assert.equal(doors.length, 2);
    assert.match(doors[1], /class="btn primary" href="\/servicios\/"/);
    assert.match(doors[1], /class="btn wa" href="https:\/\/wa\.me\/525659304558"/);
  });

  it(`hero stats: the four stat values are present (${page.name})`, () => {
    const header = headerOf(page.source);
    const match = header.match(/<div class="stats rv">([\s\S]*?)<\/div>\s*<a class="baja/);
    assert.ok(match, 'expected the stats block');
    for (const value of page.stats) {
      assert.ok(match[1].includes(value), `expected stat ${value}`);
    }
  });

  it(`hero cta: #copyBtn survives, GitHub and LinkedIn stay, CV links are not duplicated (${page.name})`, () => {
    const header = headerOf(page.source);
    assert.match(header, /id="copyBtn"/);
    const cta = header.match(/class="cta rv">([\s\S]*?)<\/div>/);
    assert.ok(cta, 'expected the hero call-to-action row');
    assert.doesNotMatch(cta[1], /Fernando_Uribe_CV/);
    assert.match(cta[1], /href="https:\/\/github\.com\/FernandoUribeT"/);
    assert.match(cta[1], /linkedin\.com/);
    assert.equal((header.match(/Fernando_Uribe_CV/g) || []).length, 2);
  });
}
