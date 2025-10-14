#!/usr/bin/env node
// scripts/generate-parasha-5786.js
// Usage: node scripts/generate-parasha-5786.js
// Writes data/parasha/parasha-5786.json

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'data', 'parasha', 'parasha-5786.json');
const OUT2 = path.resolve(__dirname, '..', 'data', 'parasha', 'parasha-5787.json');
const INDEX = path.resolve(__dirname, '..', 'index.html');

function hardcoded() {
  return [
    { date: '2025-10-18', name: 'Bereshit', diaspora: true },
    { date: '2025-10-25', name: 'Noach', diaspora: true },
    { date: '2025-11-01', name: 'Lech-Lecha', diaspora: true }
  ];
}

async function maybeFetchSefaria(year) {
  if (!process.env.SEFARIA_API) return null;
  try {
    const fetch = require('node-fetch');
    const url = `${process.env.SEFARIA_API.replace(/\/$/, '')}/calendars?year=${encodeURIComponent(year)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SEFARIA ${res.status}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('Sefaria fetch failed:', e.message || e);
    return null;
  }
}

function parseFromIndex(html) {
  const m = html.match(/parashaSchedule\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (err) { return null; }
}

function ensureDirs(p) {
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
}

(async () => {
  let rows = null;
  try {
    const html = fs.readFileSync(INDEX, 'utf8');
    rows = parseFromIndex(html);
  } catch (e) {}
  if (!rows) rows = hardcoded();

  const map = {};
  for (const r of rows) {
    if (!r?.date || !r?.name) continue;
    map[r.date] = { name: r.name, diaspora: r.diaspora !== false };
  }

  ensureDirs(OUT);
  fs.writeFileSync(OUT, JSON.stringify(map, null, 2), 'utf8');
  console.log(`Wrote ${OUT} (${Object.keys(map).length} rows)`);
  
  // Also write a seeded 5787 file. Merge hardcoded with optional Sefaria fetch.
  try {
    const seed5787 = {
      ...map,
      // Placeholder for later years - this keeps structure consistent
    };

    // Optionally enrich from SEFARIA_API
    if (process.env.SEFARIA_API) {
      const sf = await maybeFetchSefaria(5787).catch(() => null);
      if (sf && typeof sf === 'object') {
        // Try to parse expected structure { items: [{date,name,diaspora}] }
        const extras = sf.items || sf.calendar || sf;
        for (const it of extras) {
          if (it?.date && it?.name) seed5787[it.date] = { name: it.name, diaspora: it.diaspora !== false };
        }
      }
    }

    ensureDirs(OUT2);
    fs.writeFileSync(OUT2, JSON.stringify(seed5787, null, 2), 'utf8');
    console.log(`Wrote ${OUT2} (${Object.keys(seed5787).length} rows)`);
    console.log('Parasha Empire Seeded - Run npm run gen:parasha for Glory');
  } catch (e) {
    console.warn('Failed writing 5787 seed:', e.message || e);
  }
})();
