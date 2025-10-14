const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const { window } = dom;

  // Wait for scripts to parse and attach functions
  await new Promise(r => setTimeout(r, 50));

  // Provide fetch that reads local files from disk
  window.fetch = async (p) => {
    const rel = p.replace(/^\//, '');
    const abs = path.resolve(__dirname, '..', rel);
    try {
      const txt = fs.readFileSync(abs, 'utf8');
      return { ok: true, json: async () => JSON.parse(txt) };
    } catch (e) {
      return { ok: false, json: async () => null };
    }
  };

  // Make sure helper functions exist
  if (typeof window.loadHebrewTables !== 'function') {
    console.error('loadHebrewTables not found');
    process.exit(2);
  }

  try {
    await window.loadHebrewTables();
    // wait for render
    await new Promise(r => setTimeout(r, 50));
    const rs = window.document.getElementById('resourcesSection');
    if (!rs) { console.error('resourcesSection missing'); process.exit(3); }
    const inner = rs.innerHTML || '';
    console.log('resourcesSection innerHTML length:', inner.length);
    if (inner.includes('Sefaria.org') && inner.includes('TorahClass.com')) {
      console.log('RESOURCES SMOKE: PASS');
      process.exit(0);
    } else {
      console.error('RESOURCES SMOKE: FAIL - content:', inner.slice(0,200));
      process.exit(4);
    }
  } catch (e) {
    console.error('Error running loadHebrewTables:', e);
    process.exit(5);
  }
})();
