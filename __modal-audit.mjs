import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:4123';
const WIDTHS = [320, 375, 414];
const seed = {
  'sql-detective:progress': JSON.stringify({ version: 1, cases: Object.fromEntries(
    ['beginner','easy','intermediate','medium','expert'].map((id)=>[id,{opened:true,solved:true,queries:5}])) }),
  'sql-detective:settings': JSON.stringify({ version:1, mode:'personal', detectiveName:'Audit', music:false, soundEffects:false }),
};
const MEASURE = `(() => {
  const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  const d = document.querySelector('[role="dialog"]');
  if (!d) return { none: true };
  const r = d.getBoundingClientRect();
  const out = { vw, vh, dialog: { w: Math.round(r.width), h: Math.round(r.height),
    left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) },
    overflowsX: r.right > vw + 1 || r.left < -1, overflowsY: r.bottom > vh + 1 || r.top < -1, clipped: [] };
  const tabs = d.querySelector('[role="tablist"]');
  if (tabs) { const tr = tabs.getBoundingClientRect();
    out.tablist = { h: Math.round(tr.height), rows: Math.round(tr.height / 36), scrollW: tabs.scrollWidth, clientW: tabs.clientWidth }; }
  for (const el of d.querySelectorAll('*')) {
    const cs = getComputedStyle(el); if (cs.display==='none'||cs.visibility==='hidden') continue;
    const b = el.getBoundingClientRect(); if (b.width<=1||b.height<=1) continue;
    const own = [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if (own && el.scrollWidth > el.clientWidth+1 && ['visible','hidden'].includes(cs.overflowX))
      out.clipped.push({ t:(el.textContent||'').trim().slice(0,38), need:el.scrollWidth, has:el.clientWidth,
        c:(typeof el.className==='string'?el.className:'').slice(0,60) });
    if (b.right > r.right + 1) out.clipped.push({ t:(el.textContent||'').trim().slice(0,38), spill:Math.round(b.right-r.right),
        c:(typeof el.className==='string'?el.className:'').slice(0,60) });
  }
  return out;
})()`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 720, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument((s)=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v);}, seed);
  await page.goto(BASE + '/investigation/beginner', { waitUntil:'networkidle2', timeout:30000 });
  await new Promise(r=>setTimeout(r,900));
  console.log(`\n================ ${width}px ================`);

  // Run a wide query and inspect the results table.
  await page.evaluate(() => {
    const ta = document.querySelector('textarea, .monaco-editor textarea');
    if (ta) { ta.focus(); }
  });
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type('SELECT * FROM suspects;');
  await page.keyboard.down('Control'); await page.keyboard.press('Enter'); await page.keyboard.up('Control');
  await new Promise(r=>setTimeout(r,1800));
  const table = await page.evaluate(`(() => {
    const t = document.querySelector('table'); if (!t) return { none: true };
    const w = t.closest('div'); const r = t.getBoundingClientRect();
    return { tableW: Math.round(r.width), wrapW: w ? Math.round(w.clientWidth) : null,
      wrapScrolls: w ? w.scrollWidth > w.clientWidth : null,
      wrapOverflowX: w ? getComputedStyle(w).overflowX : null,
      spillsViewport: r.right > document.documentElement.clientWidth + 1 };
  })()`);
  console.log('results table:', JSON.stringify(table));

  for (const [name, open] of [
    ['NOTEBOOK', async () => { await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/notebook/i.test(b.textContent))?.click()); }],
    ['SEARCH',   async () => { await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control'); }],
    ['ACCUSE',   async () => { await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/accuse|name .*(suspect|culprit)/i.test(b.textContent))?.click()); }],
  ]) {
    await page.keyboard.press('Escape'); await new Promise(r=>setTimeout(r,400));
    await open(); await new Promise(r=>setTimeout(r,900));
    const m = await page.evaluate(MEASURE);
    if (m.none) { console.log(`  ${name}: did not open`); continue; }
    console.log(`  ${name}: dialog ${m.dialog.w}x${m.dialog.h} at [${m.dialog.left},${m.dialog.top}]  vw=${m.vw} vh=${m.vh}` +
      `${m.overflowsX?'  !!X-OVERFLOW':''}${m.overflowsY?'  !!Y-OVERFLOW':''}`);
    if (m.tablist) console.log(`     tablist: ${m.tablist.h}px tall (~${m.tablist.rows} rows), scrollW=${m.tablist.scrollW} clientW=${m.tablist.clientW}`);
    for (const c of m.clipped.slice(0,6)) console.log(`     ${c.spill?`spills ${c.spill}px`:`needs ${c.need} has ${c.has}`}  "${c.t}"`);
  }
  await page.close();
}
await browser.close();
