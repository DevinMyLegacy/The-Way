#!/usr/bin/env node
// scripts/generate-parasha-5786.js
// Usage: node scripts/generate-parasha-5786.js
// Writes data/parasha/parasha-5786.json

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'data', 'parasha', 'parasha-5786.json');
const INDEX = path.resolve(__dirname, '..', 'index.html');

function hardcoded() {
  return [
    { date: '2025-10-18', name: 'V\'Zot HaBerachah', diaspora: true },
    { date: '2025-10-25', name: 'Bereshit', diaspora: true },
    { date: '2025-11-01', name: 'Noach', diaspora: true },
    { date: '2025-11-08', name: 'Lech-Lecha', diaspora: true }
  ];
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
})();
