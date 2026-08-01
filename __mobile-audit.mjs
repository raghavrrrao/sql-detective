import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE ?? 'http://localhost:4123';
const WIDTHS = (process.env.W ?? '320,375,390,414,768').split(',').map(Number);
const ROUTES = (process.env.R ?? '/,/how-to-play,/difficulty,/case/beginner,/settings,/investigation/beginner').split(',');

const seed = {
  'sql-detective:progress': JSON.stringify({ version: 1, cases: Object.fromEntries(
    ['beginner','easy','intermediate','medium','expert'].map((id) => [id, { opened: true, solved: true, queries: 5 }])) }),
  'sql-detective:settings': JSON.stringify({ version: 1, mode: 'personal', detectiveName: 'Audit', music: false, soundEffects: false }),
};

const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const isHidden = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return true;
    if (el.closest('[aria-hidden="true"]')) return true;
    // sr-only: 1px clipped box, intentional.
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return true;
    return false;
  };
  // Nearest ancestor that actually clips horizontally.
  const clipper = (el) => {
    let n = el.parentElement;
    while (n && n !== document.body) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return n;
      n = n.parentElement;
    }
    return null;
  };
  const out = { docScroll: document.documentElement.scrollWidth, vw, hits: [] };
  for (const el of document.querySelectorAll('body *')) {
    if (isHidden(el)) continue;
    const r = el.getBoundingClientRect();
    // Ignore anything parked entirely off-canvas (closed drawers, decor).
    if (r.right <= 0 || r.left >= vw) continue;
    if (getComputedStyle(el).position === 'fixed') continue;

    const own = getComputedStyle(el).overflowX;
    const text = (el.textContent || '').trim();
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

    // A: text clipped inside its own box (no scroller of its own).
    if (hasOwnText && el.scrollWidth > el.clientWidth + 1 && (own === 'visible' || own === 'hidden')) {
      out.hits.push({ kind: 'TEXT-CLIPPED', el: sig(el), text: text.slice(0,40), sw: el.scrollWidth, cw: el.clientWidth });
      continue;
    }
    // B: box extends past the thing that is supposed to contain it.
    const c = clipper(el);
    const bound = c ? c.getBoundingClientRect().right : vw;
    if (r.right > bound + 1) {
      out.hits.push({ kind: 'SPILLS-CONTAINER', el: sig(el), text: text.slice(0,40),
                      over: Math.round(r.right - bound), into: c ? sig(c) : 'viewport' });
    }
  }
  function sig(el) {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
    return (el.tagName.toLowerCase() + (cls.length ? '.' + cls.slice(0,4).join('.') : '')).slice(0,95);
  }
  return out;
})()`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const agg = new Map();
let scrolls = [];
for (const width of WIDTHS) {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 780, isMobile: width < 768, hasTouch: width < 768 });
    await page.evaluateOnNewDocument((s) => { for (const [k,v] of Object.entries(s)) localStorage.setItem(k,v); }, seed);
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 600));
      const p = await page.evaluate(PROBE);
      if (p.docScroll > p.vw + 1) scrolls.push(`${width}px ${route}  doc=${p.docScroll} vw=${p.vw}`);
      for (const h of p.hits) {
        const k = route + '|' + h.el + '|' + h.kind;
        if (!agg.has(k)) agg.set(k, { ...h, route, widths: new Set() });
        agg.get(k).widths.add(width);
      }
    } catch (e) { console.log(`ERROR ${width} ${route}: ${e.message.slice(0,70)}`); }
    await page.close();
  }
}
await browser.close();

console.log(scrolls.length ? 'HORIZONTAL PAGE SCROLL:\n  ' + scrolls.join('\n  ') : 'No page scrolls horizontally.');
const list = [...agg.values()].sort((a,b) => b.widths.size - a.widths.size || (b.over??0)-(a.over??0));
console.log(`\n===== ${list.length} sites =====`);
for (const v of list) {
  console.log(`\n[${v.kind}] ${v.route} @ ${[...v.widths].join(',')}`);
  console.log(`  ${v.el}`);
  if (v.kind === 'TEXT-CLIPPED') console.log(`  needs ${v.sw}px, has ${v.cw}px  "${v.text}"`);
  else console.log(`  ${v.over}px past ${v.into}  "${v.text}"`);
}
