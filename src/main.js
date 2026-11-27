import { Pane, sleep, T, AUTO, curve, arc } from './engine.js';
import * as A from './audio.js';
import { play } from './story.js';

const L = new Pane(document.getElementById('hL'), 'L');
const R = new Pane(document.getElementById('hR'), 'R');
const B = new Pane(document.getElementById('both'), 'B');
Pane.all.push(L, R, B);
const both = document.getElementById('both');
const stage = document.getElementById('stage');
const cardEl = document.getElementById('card');

// text appears only outside the life itself: the opening and the closing words
async function card(lines, o = {}) {
  cardEl.replaceChildren();
  cardEl.classList.toggle('dark', !!o.dark);
  const ps = lines.map(t => { const p = document.createElement('p'); p.textContent = t; if (o.small) p.className = 'small'; cardEl.appendChild(p); return p; });
  for (const p of ps) { await sleep(120); p.classList.add('in'); await sleep(o.step || 1900); }
  await sleep(o.hold || 600);
  if (o.keep) return ps;
  return ps;
}
function clearCard(dur = 1200) { [...cardEl.children].forEach(p => p.classList.remove('in')); return sleep(dur); }

async function title() {
  both.classList.add('on'); stage.style.setProperty('--seam', 0);
  await B.ink([{ p: [[-600, 452], [100, 446], [300, 452], [372, 450]], w: 1.6 }], { dur: 2000 });
  const ring = await B.ink([{ p: arc(400, 450, 26, 26, 180, 539, 15), w: 1.6 }], { dur: 900 });
  await B.ink([{ p: [[428, 450], [600, 452], [1400, 446]], w: 1.6 }], { dur: 1400 });
  const t = document.createElement('p'); t.textContent = 'A simple game about life'; t.className = 'small'; t.style.marginTop = '28vmin';
  cardEl.replaceChildren(t); requestAnimationFrame(() => t.classList.add('in'));
  await B.tap(400, 450, 26, { label: 'begin', silent: true });
  A.init();
  A.note(64, .12, 4);
  t.classList.remove('in');
  await B.clear(1400);
  await card(['There is no save system in this game.', 'Once a choice is made, it cannot be revoked.', 'But you can decide what to do next.'], { step: AUTO ? 100 : 1500, hold: AUTO ? 100 : 700 });
  await B.tap(400, 760, 22, { label: 'continue' });
  await clearCard(1400);
  both.classList.remove('on'); stage.style.setProperty('--seam', 1);
  await sleep(1400);
}

async function end() {
  await sleep(1200);
  const g = await B.ink([{ p: arc(400, 760, 22, 22, -60, 250, 15), w: 1.6 }, { p: [[404, 728], [414, 740], [400, 746]], w: 1.6 }], { white: true, dur: 1200 });
  if (AUTO) { window.__done = true; return; }
  await B.tap(400, 760, 26, { label: 'live again', white: true });
  location.reload(); // nothing to restore. it begins again.
}

const SCENE = new URLSearchParams(location.search).get('scene');
(async () => {
  if (SCENE) {
    both.classList.add('on'); stage.style.setProperty('--seam', 0);
    if (!AUTO) await B.tap(400, 450, 26, { label: 'begin', silent: true });
    A.init();
    const mod = await import(`./scene_${SCENE}.js`);
    await mod[SCENE + 'Scene'](B);
    window.__done = true; return;
  }
  try {
    await title();
    await play({ L, R, B }, card);
    await end();
  } catch (e) { console.error(e); window.__err = String(e && e.stack || e); }
  window.__done = true;
})();
