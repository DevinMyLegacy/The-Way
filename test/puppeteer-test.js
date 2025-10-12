// test/puppeteer-test.js - Clean Puppeteer smoke test
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const html = path.resolve(__dirname, '..', 'index.html');
  if (!fs.existsSync(html)) { console.error('index.html not found'); process.exit(1); }

  const fileUrl = 'file://' + html;
  console.log('Loading', fileUrl);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push({ type: 'pageerror', error: err.toString() }));
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push({ type: 'console', error: text });
    console.log('PAGE>', text);
  });

  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

  // Basic interactions
  try {
    await page.waitForSelector('.app-container', { timeout: 2000 });
    await page.click('.menu-btn').catch(() => {});
    await page.waitForTimeout(200);
    await page.click(".dropdown-item[onclick*='aboutModal']").catch(() => {});
    await page.waitForTimeout(200);
    // Close modal by clicking backdrop if present
    await page.evaluate(() => { const m = document.getElementById('aboutModal'); if (m) m.click(); });
    await page.waitForTimeout(150);
    await page.click(".nav-tab[onclick*='torah']").catch(() => {});
    await page.waitForTimeout(150);
    await page.click(".commentary-btn[onclick*='rashi']").catch(() => {});
    await page.waitForTimeout(150);
    await page.click(".nav-tab[onclick*='calendar']").catch(() => {});
    await page.waitForTimeout(150);
    await page.click(".calendar-type-btn[onclick*='dss']").catch(() => {});
    await page.waitForTimeout(250);
  } catch (e) {
    errors.push({ type: 'interaction', error: e.toString() });
  }

  await browser.close();

  if (errors.length) {
    console.error('Errors captured during test:', errors);
    process.exit(2);
  }

  console.log('Puppeteer smoke test: PASS (no console errors)');
  process.exit(0);
})();
