/* global window, document, performance, scrollY */
// Browser regression, separate from unit tests: uses trusted wheel/pointer input.
// Run with PLAYWRIGHT_BROWSERS_PATH pointing to installed Chromium if needed.
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = await mkdtemp(join(tmpdir(), 'bb-peek-scroll-'));
await build({ stdin: { contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {Catalogue} from './src/ui/Catalogue'; import {flattenTree} from './src/core/logic';
import './src/ui/style.css';
const sections = Array.from({length:18},(_,i)=>({id:'s'+i,parentId:'r',title:'Section '+i,children:Array.from({length:30},(_,j)=>({id:i+'-'+j,parentId:'s'+i,title:'Catalogue reference '+i+' '+j,url:'https://example.com/'+i+'/'+j}))}));
const tree=[{id:'0',title:'',children:[{id:'r',parentId:'0',title:'Favorites bar',children:sections}]}];
const snapshot={tree,...flattenTree(tree),metadata:{records:[]},reconciliation:{mappings:{},matches:[]}};
createRoot(document.getElementById('root')).render(<Catalogue snapshot={snapshot} suspended={false} onManage={()=>{}}/>);
`, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, jsx: 'automatic', target: 'es2022', outfile: join(output, 'fixture.js'), loader: { '.svg': 'dataurl' } });
await writeFile(join(output, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="fixture.css"></head><body><main id="root" class="catalogue-page"></main><script src="fixture.js"></script></body></html>');
const browser = await chromium.launch();
const reports = [];
try {
  for (const [width, height, reduced] of [[1250, 600, false], [390, 700, false], [1490, 950, false], [1250, 600, true]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      const frames = new Set(), timers = new Set();
      window.requestAnimationFrame = fn => { const id = raf(time => { frames.delete(id); fn(time); }); frames.add(id); return id; };
      window.cancelAnimationFrame = id => { frames.delete(id); cancel(id); };
      const timeout = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => { const id = timeout(() => { timers.delete(id); fn(...args); }, ms); timers.add(id); return id; };
      window.clearTimeout = id => { timers.delete(id); clear(id); };
      const RO = window.ResizeObserver; window.measurements = 0;
      window.ResizeObserver = class extends RO { constructor(fn) { super((...args) => { window.measurements++; fn(...args); }); } };
      window.trace = []; window.phase = 'load';
      const sample = (type, event) => {
        const spacer = document.querySelector('.peek-footer-space'); if (!spacer) return;
        window.trace.push({ time: performance.now(), phase: window.phase, type, scroll: scrollY, document: document.documentElement.scrollHeight,
          space: spacer.getBoundingClientRect().height, peeks: [...document.querySelectorAll('.is-peeking')].map(n => n.dataset.sectionId),
          headers: [...document.querySelectorAll('.section-slot')].slice(-4).map(n => n.getBoundingClientRect().top),
          target: event?.target?.closest?.('.section-slot')?.dataset.sectionId, x: event?.clientX, y: event?.clientY,
          raf: frames.size, timers: timers.size, measurements: window.measurements });
      };
      for (const type of ['wheel', 'pointerover', 'pointerout', 'pointermove', 'scroll']) window.addEventListener(type, e => sample(type, e), true);
      const loop = () => { sample('frame'); raf(loop); }; raf(loop);
    });
    await page.goto(pathToFileURL(join(output, 'index.html')).href);
    const phase = name => page.evaluate(name => { window.phase = name; }, name);
    const read = () => page.evaluate(() => ({ scroll: scrollY, space: document.querySelector('.peek-footer-space').getBoundingClientRect().height }));
    const header = id => page.locator(`[id="section-folder:s${id}"]`);
    const pointAt = async id => {
      const box = await header(id).boundingBox(); assert(box && box.y >= 0 && box.y + 35 < height);
      await page.mouse.move(100, box.y + 35, { steps: 6 });
    };
    for (let cycle = 0; cycle < 3; cycle++) {
      await phase(`wheel-to-bottom-${cycle}`);
      await page.mouse.move(width - 5, height - 5); await page.mouse.wheel(0, 10000); await page.waitForTimeout(300);
      await page.mouse.move(width - 5, height - 5); await page.waitForTimeout(150);
      await phase(`peek-${cycle}`); await pointAt(17); await page.waitForTimeout(cycle === 0 ? 250 : 1350);
      const depth = await page.locator('[id="card-folder:s17"]').evaluate(n => n.querySelector('.section-content').getBoundingClientRect().height / parseFloat(window.getComputedStyle(n.querySelector('.catalogue-flow')).lineHeight));
      assert(Math.abs(depth - 2.5) < .01, 'final peek must remain complete');
      const motion = await page.locator('[id="card-folder:s17"] .catalogue-flow').evaluate(n => n.style.transform);
      if (cycle && !reduced) assert(motion.includes('translateY')); else assert.equal(motion, '');
      await phase(`wheel-in-peek-${cycle}`); await page.mouse.wheel(0, 60); await page.waitForTimeout(500);
      const supported = await read(); assert(supported.space >= 0 && supported.space < 220);
      await phase(`traverse-${cycle}`);
      for (const id of [16, 15, 16, 17, 16, 17]) { await pointAt(id); await page.waitForTimeout(180); }
      await phase(`stationary-${cycle}`); await page.waitForTimeout(1200);
      await phase(`outside-${cycle}`); await page.mouse.move(-10, -10); await page.waitForTimeout(1200);
      const outside = await read(); assert.equal(outside.scroll, supported.scroll); assert(outside.space <= supported.space + 1);
      if (cycle === 2) {
        await phase('search-from-retained'); await page.keyboard.press('/');
        await page.getByRole('textbox', { name: 'Search bookmarks' }).fill('no-matches');
        assert.equal((await read()).space, 0); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
        const restored = await read(); await pointAt(17); await page.waitForTimeout(250);
        assert.equal((await read()).scroll, restored.scroll, 'search exit must not leave a stale scroll target');
        await page.mouse.move(-10, -10); await page.waitForTimeout(150);
      }
      // Ordinary upward wheel input safely releases retained space.
      await phase(`up-${cycle}`); await page.mouse.move(width - 5, height - 5); await page.mouse.wheel(0, -240); await page.mouse.move(-10, -10); await page.waitForTimeout(400);
      assert.equal((await read()).space, 0);
    }
    // Open, then switch away from a long card; search/escape still work.
    await phase('open-search'); await page.mouse.move(width - 5, height - 5); await page.mouse.wheel(0, 10000); await page.waitForTimeout(300);
    await pointAt(17); await page.mouse.click(100, (await header(17).boundingBox()).y + 35); await page.waitForTimeout(300);
    assert.equal((await read()).space, 0); assert.equal(await header(17).getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('/'); await page.getByRole('textbox', { name: 'Search bookmarks' }).fill('reference'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    assert.equal(await header(17).getAttribute('aria-expanded'), 'true'); assert.equal((await read()).space, 0);
    await page.mouse.move(-10, -10);
    const trace = await page.evaluate(() => window.trace);
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const name of [`traverse-${cycle}`, `stationary-${cycle}`, `outside-${cycle}`]) {
        const samples = trace.filter(x => x.type === 'frame' && x.phase === name);
        const scrolls = samples.map(x => x.scroll);
        assert(Math.max(...scrolls) - Math.min(...scrolls) <= 1, `viewport oscillation: ${name}, ${width}`);
        if (name.startsWith('outside')) {
          const settled = samples.filter(x => x.time > samples[0].time + 300);
          assert(settled.every(x => !x.peeks.length && !x.raf && !x.timers), 'stale preview work after pointer exit');
          assert.equal(settled.at(-1).measurements, settled[0].measurements, 'measurement callbacks did not settle');
        }
      }
    }
    assert.deepEqual(errors, []);
    await writeFile(join(output, `trace-${width}-${reduced}.json`), JSON.stringify(trace));
    reports.push({ width, height, reduced, cycles: 3, frames: trace.filter(x => x.type === 'frame').length, passed: true });
    await page.close();
  }
  await writeFile(join(output, 'results.json'), JSON.stringify(reports, null, 2));
  console.log(`PASS wheel/pointer regression, repeated cycles and callback cleanup. Evidence: ${output}`);
} finally { await browser.close(); }
