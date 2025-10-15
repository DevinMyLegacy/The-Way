// assets/today-portions.js
// Festival-aware resolver for "Today's Portion" (online-first, GH Pages friendly)

import { HDate, HebrewCalendar } from "https://cdn.skypack.dev/@hebcal/core";
import { getLeyningOnDate } from "https://cdn.skypack.dev/@hebcal/leyning";

const TZ = "America/Chicago"; // adjust if needed
const DIASPORA = true;        // set false for Israel cycle

function localDate(tz = TZ) {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Sun..Sat => 0..6 → map to segments 1..6 (Sat=null)
function weekdaySegment(date) {
  return [1, 2, 3, 4, 5, 6, null][date.getDay()] ?? null;
}

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el) el.textContent = text ?? "";
}

function setSnippet(ref) {
  const p = document.querySelector("#today-snippet");
  if (!p) return;
  if (!ref) {
    p.innerHTML = "";
    return;
  }
  // simple text for now; you can enhance to fetch verse text from Sefaria by ref
  p.innerHTML = `<span class="verse-number"></span> ${ref}`;
}

async function renderTodayPortion() {
  const today = localDate();
  const hdate = new HDate(today);

  // Holiday overrides parasha automatically when present
  let leyn = getLeyningOnDate(hdate, /* il: */ !DIASPORA, /* includeModern: */ true);

  // Fallback: if a weekday returns nothing, try upcoming Shabbat leyning
  if (!leyn || !leyn.length) {
    const events = HebrewCalendar.calendar({
      start: hdate,
      end: hdate,
      il: !DIASPORA,
      sedra: true,
    });
    const parEvt = events.find((e) => (e.getDesc?.() || "").includes("Parashat "));
    if (parEvt) {
      const day = today.getDay(); // 0..6
      const toSat = (6 - day + 7) % 7;
      const shabbat = new Date(today);
      shabbat.setDate(today.getDate() + toSat);
      const shabbatH = new HDate(shabbat);
      leyn = getLeyningOnDate(shabbatH, !DIASPORA, true) || [];
    }
  }

  // Extract title & aliyot/range
  let title = "Torah Reading";
  let refs = [];

  if (leyn && leyn.length) {
    const first = leyn[0];
    title = first.parsha || first.summary || first.name || title;
    refs =
      (first.aliyot?.map((a) => a.verses)) ||
      (first.kriyah?.map((k) => k.verses)) ||
      (first.reading ? [first.reading] : []);
  }

  const seg = weekdaySegment(today); // 1..6 or null on Sat
  const snippet = seg && refs?.[seg - 1] ? refs[seg - 1] : (refs?.[0] || "");

  setText("#today-title", title);
  setSnippet(snippet);
}

// run after the page’s other onload work, but not blocking
try {
  renderTodayPortion();
} catch (e) {
  console.error("renderTodayPortion failed:", e);
}
