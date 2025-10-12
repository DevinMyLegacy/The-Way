const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  try {
    const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });

    // wait for scripts to run
    await new Promise((res) => setTimeout(res, 1000));

    const { window } = dom;
    const errors = [];

    // basic checks
    try {
      if (typeof window.switchTab !== 'function') throw new Error('switchTab missing');
      if (typeof window.loadCommentary !== 'function') throw new Error('loadCommentary missing');
      if (typeof window.switchCalendar !== 'function') throw new Error('switchCalendar missing');
    } catch (e) {
      errors.push(e.message);
    }

    // call switchTab safely
    try {
      // create a fake element
      const fakeBtn = window.document.createElement('button');
      fakeBtn.className = 'nav-tab';
      window.document.body.appendChild(fakeBtn);
      window.switchTab(fakeBtn, 'daily');
      const daily = window.document.getElementById('daily');
      if (!daily || !daily.classList.contains('active')) errors.push('daily not active after switchTab');
    } catch (e) {
      errors.push('switchTab error: ' + e.message);
    }

    // call loadCommentary
    try {
      const fakeBtn = window.document.createElement('button');
      fakeBtn.className = 'commentary-btn';
      window.document.body.appendChild(fakeBtn);
      window.loadCommentary(fakeBtn, 'rashi');
      const content = window.document.getElementById('commentaryContent');
      if (!content || content.innerHTML.length === 0) errors.push('commentaryContent empty after loadCommentary');
    } catch (e) {
      errors.push('loadCommentary error: ' + e.message);
    }

    // call switchCalendar
    try {
      const fakeBtn = window.document.createElement('button');
      fakeBtn.className = 'calendar-type-btn';
      window.document.body.appendChild(fakeBtn);
      window.switchCalendar(fakeBtn, 'dss');
      const dss = window.document.getElementById('dssCalendar');
      if (!dss) errors.push('dssCalendar missing');
    } catch (e) {
      errors.push('switchCalendar error: ' + e.message);
    }

    if (errors.length === 0) {
      console.log('JSDOM SMOKE: PASS');
      process.exit(0);
    } else {
      console.error('JSDOM SMOKE: FAIL', errors);
      process.exit(2);
    }
  } catch (err) {
    console.error('JSDOM SMOKE: EXCEPTION', err);
    process.exit(3);
  }
})();
