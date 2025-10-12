const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => errors.push(err.message));

  try {
    await page.goto(fileUrl, { waitUntil: 'load' });

    // Basic smoke interactions
    // 1) Open About modal via menu
    await page.click('.menu-btn');
    await page.click('.dropdown-item:nth-child(1)');
    await page.waitForSelector('#aboutModal.show', { timeout: 2000 });

    // Close About modal
    await page.click('#aboutModal .modal-close');
    await page.waitForSelector('#aboutModal.show', { hidden: true, timeout: 2000 });

    // 2) Switch to Torah tab
    await page.click('.nav-tab:nth-child(2)');
    await page.waitForSelector('#torah.active', { timeout: 2000 });

    // 3) Select first verse
    await page.click('#versesContainer .verse:nth-child(1)');

    // 4) Load commentary (Rashi)
    await page.click('.commentary-btn');
    await page.waitForFunction(() => document.getElementById('commentaryContent') && document.getElementById('commentaryContent').innerText.length > 0);

    // 5) Switch to Calendar tab and toggle DSS
    await page.click('.nav-tab[onclick*="calendar"]');
    await page.waitForSelector('#calendar.active', { timeout: 2000 });
    await page.click('.calendar-type-btn:nth-child(2)');
    await page.waitForSelector('#dssCalendar', { timeout: 2000 });

    // 6) Switch to Resources
    await page.click('.nav-tab[onclick*="resources"]');
    await page.waitForSelector('#resources.active', { timeout: 2000 });

    // Report
    if (errors.length === 0) {
      console.log('SMOKE TEST: PASS');
      await browser.close();
      process.exit(0);
    } else {
      console.error('SMOKE TEST: FAIL - console errors:', errors);
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('SMOKE TEST: EXCEPTION', err);
    await browser.close();
    process.exit(3);
  }
})();
