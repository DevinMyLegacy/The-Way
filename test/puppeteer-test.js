const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');
  console.log('Loading', fileUrl);

  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', err => {
    errors.push({type: 'pageerror', error: err.toString()});
  });
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push({type: 'console', error: text});
    console.log('PAGE LOG>', text);
  });

  await page.goto(fileUrl, {waitUntil: 'networkidle0'});

  // Wait for the app container
  await page.waitForSelector('.app-container');

  // Click the menu and open About modal
  await page.click('.menu-btn');
  await page.waitForTimeout(250);
  await page.click(".dropdown-item[onclick*='aboutModal']");
  await page.waitForSelector('#aboutModal.show', {timeout: 2000}).catch(()=>{});

  // Close the about modal by clicking backdrop
  await page.evaluate(() => {
    const modal = document.getElementById('aboutModal');
    if (!modal) return;
    modal.click();
  });
  await page.waitForTimeout(200);

  // Switch to Torah tab
  await page.click(".nav-tab[onclick*='torah']");
  await page.waitForSelector('#torah.active', {timeout: 2000}).catch(()=>{});

  // Load a commentary
  await page.click(".commentary-btn[onclick*='rashi']");
  await page.waitForTimeout(200);

  // Switch calendar to DSS
  await page.click(".nav-tab[onclick*='calendar']");
  await page.waitForSelector('#calendar.active', {timeout: 2000}).catch(()=>{});
  await page.click(".calendar-type-btn[onclick*='dss']");
  await page.waitForTimeout(400);

  // Check for JS errors collected
  if (errors.length) {
    console.error('Errors captured during test:', errors);
    await browser.close();
    process.exit(2);
  }

  console.log('Smoke test completed without console errors.');
  await browser.close();
  process.exit(0);
})();
