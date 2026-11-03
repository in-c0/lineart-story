// The life. Two halves (L, R), sometimes one shared frame (B).
import { sleep, T, el, rand } from './engine.js';
import * as K from './shapes.js';
import * as A from './audio.js';

let L, R, B;
const stage = document.getElementById('stage');
const bothEl = document.getElementById('both');
// what the player decided. nothing here is ever saved.
export const S = { dream: null, place: null, awayA: false, awayB: false, mother: null, accident: false, woke: null, photos: [] };
const all = (...p) => Promise.all(p);

function seam(v) { stage.style.setProperty('--seam', v); }
function gap(n) { stage.style.setProperty('--gap', n * 18 + 'px'); stage.style.setProperty('--twin', n ? 'block' : 'none'); }
const distance = () => (S.awayA ? 1 : 0) + (S.awayB ? 1 : 0);
async function merge() {
  await all(L.clear(900), R.clear(900));
  gap(0); seam(0); bothEl.classList.add('on'); await sleep(1300);
}
async function split(n = distance()) {
  await B.clear(1100); bothEl.classList.remove('on'); seam(1); gap(n); await sleep(900);
}

// ---------- figure helpers ----------
async function fig(p, x, y, o = {}, dur = 2000) { const g = p.g(); await p.ink(K.person(x, y, o), { parent: g, dur, white: o.white }); return g; }
async function walker(p, x, y, o = {}, dur = 1800) {
  const g = p.g();
  await p.ink(K.person(x, y, { ...o, part: 'body' }), { parent: g, dur });
  const l0 = await p.ink(K.person(x, y, { ...o, pose: 'walk0', part: 'legs' }), { parent: g, dur: 500 });
  const l1 = await p.ink(K.person(x, y, { ...o, pose: 'walk1', part: 'legs' }), { parent: g, dur: 30 });
  l1.setAttribute('opacity', 0);
  g.x = x; g.y = y;
  g.walk = async (dx, ms, prints) => {
    let k = 0, side = 0;
    const iv = setInterval(() => { k ^= 1; l0.setAttribute('opacity', k ? 0 : 1); l1.setAttribute('opacity', k ? 1 : 0); }, T(340));
    const t0 = performance.now(), x0 = g.x;
    const pv = prints && setInterval(() => {
      const kk = Math.min(1, (performance.now() - t0) / T(ms)); const cx = x0 + dx * kk; side ^= 1;
      p.ink(K.footprint(cx + (side ? -7 : 7) * (o.h || 300) / 300, y + 10 + (side ? 0 : 6), (o.h || 300) / 300 * .8), { parent: prints, dur: 200, w: 1.1 });
    }, T(340));
    await p.move(g, (g._pos?.[0] || 0) + dx, 0, ms, 'linear');
    g.x += dx; clearInterval(iv); pv && clearInterval(pv);
    l0.setAttribute('opacity', 1); l1.setAttribute('opacity', 0);
  };
  return g;
}
function pivot(g, x, y) { g.style.transformBox = 'view-box'; g.style.transformOrigin = `${x}px ${y}px`; }
async function flash(p) { const r = el('rect', { x: -1600, y: -1200, width: 4000, height: 3300, fill: '#fffdf6', opacity: 0, 'pointer-events': 'none' }, p.ui); A.shutter(); await r.animate([{ opacity: 0 }, { opacity: .95, offset: .15 }, { opacity: 0 }], { duration: T(900) }).finished; r.remove(); }

// ================== episodes ==================
async function birth() {
  A.music(1);
  await all(
    (async () => {
      L.weatherOn('snow', 60, [-100, 900]);
      await L.ink(K.ground(700), { dur: 1600 });
      await L.ink(K.house(400, 700), { dur: 2600 });
      await sleep(700);
      await L.tap(400, 647, 38, { label: 'window' });
      await L.ink(K.windowGlow(400, 700), { dur: 400 });
      A.note(83, .1, 4);
      await sleep(2600);
      await L.clear(1400);
      await L.ink(K.baby(470, 470, 2.2), { dur: 2000 });
      await L.ink(K.hand(380, 560, 1.1), { dur: 1600 });
      await L.tap(350, 556, 32, { label: 'tiny hand' });
      await L.ink(K.tinyHand(350, 556, 1.1), { dur: 700 });
      A.heartbeat(.25); await sleep(2400);
      S.photos.push('window');
    })(),
    (async () => {
      A.sea(true);
      await R.ink(K.sea(640, -100, 900), { dur: 2200 });
      const sunG = R.g(); await R.ink([{ p: K.sun(400, 640, 50)[0].p.filter(([, y]) => y <= 641), w: 1.8 }], { parent: sunG, dur: 1400 });
      await sleep(800);
      await R.tap(400, 616, 44, { label: 'sun' });
      await R.ink([{ p: K.sun(400, 640, 50)[0].p.filter(([, y]) => y >= 638), w: 1.8 }], { parent: sunG, dur: 600 });
      R.move(sunG, 0, -190, 4200, 'ease-out');
      R.washTo('gold', .35, 4200);
      await sleep(900); await R.ink(K.birds(520, 330), { dur: 900 });
      await sleep(2600);
      await R.clear(1400); A.sea(false);
      await R.ink(K.baby(330, 470, 2.2), { dur: 2000 });
      await R.ink(K.hand(420, 560, 1.1, true), { dur: 1600 });
      await R.tap(450, 556, 32, { label: 'tiny hand' });
      await R.ink(K.tinyHand(450, 556, 1.1, true), { dur: 700 });
      A.heartbeat(.25); await sleep(2400);
    })(),
  );
  await all(L.clear(), R.clear());
}

async function childhood() {
  await all(
    (async () => {
      L.weatherOn('snow', 70, [-100, 900]);
      await L.ink(K.ground(712), { dur: 1400 });
      const prints = L.g();
      for (let i = 0; i < 6; i++) { const x = 20 + i * 48; L.ink([...K.footprint(x, 722 + (i % 2) * 8, 1), ...K.footprint(x + 60, 718 + (i % 2) * 6, .6)], { parent: prints, dur: 240, w: 1.1 }); await sleep(260); }
      const mom = await walker(L, 340, 700, { kind: 'adult', hair: 'bun' }, 2200);
      const kid = await walker(L, 440, 700, { kind: 'child', h: 150, hair: 'long' }, 1600);
      await sleep(600);
      await L.tap(414, 612, 32, { label: 'hold hands' });
      const link = L.g(); await L.ink([{ p: [[376, 578], [398, 606], [418, 630], [429, 650]], w: 1.8 }], { parent: link, dur: 600 });
      A.note(76, .1);
      await sleep(900);
      await all(mom.walk(520, 7200, prints), kid.walk(520, 7200, prints), L.move(link, 520, 0, 7200, 'linear'));
      S.photos.push('hands');
    })(),
    (async () => {
      await R.ink(K.ground(712), { dur: 1400 });
      await R.ink(K.sun(640, 170, 34), { dur: 900 });
      await R.ink(K.person(320, 700, { kind: 'child', h: 150, hair: 'short', arm: 'cup' }), { dur: 2000 });
      const dog = R.g(); await R.ink(K.dog(470, 700, 1), { parent: dog, dur: 1800 });
      const ball = R.g(); await R.ink(K.ball(348, 628), { parent: ball, dur: 500 });
      await sleep(500);
      await R.tap(348, 628, 30, { label: 'ball' });
      A.tapNote();
      R.move(ball, 150, -170, 900, 'ease-out').then(() => R.move(ball, 300, 70, 1000, 'ease-in'));
      await sleep(500);
      await R.move(dog, 170, 0, 1300, 'ease-in-out');
      await sleep(500);
      R.move(ball, 120, 0, 1400, 'ease-in-out');
      await R.move(dog, 30, 0, 1400, 'ease-in-out');
      A.chord(.08); await sleep(2600);
      S.photos.push('ball');
    })(),
  );
  await all(L.clear(), R.clear());
}

async function graduation() {
  A.music(2);
  const row = async (p, me, hairs, faint) => {
    await p.ink(K.ground(712, -100, 900, 6, 3), { dur: 1000 });
    const caps = [];
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * 120, g = p.g();
      await p.ink(K.person(x, 712, { kind: 'teen', h: 210, pose: 'bust', hair: hairs[i] }), { parent: g, dur: 900, opacity: i === faint ? .32 : 1 });
      const c = p.g(); await p.ink(K.cap(x, 504, .9), { parent: c, dur: 400, opacity: i === faint ? .32 : 1 });
      caps.push(c); if (i === faint) g._faint = c; if (i === faint) caps.faintBody = g;
    }
    await sleep(500);
    await p.tap(me, 504, 34, { label: 'cap' });
    caps.forEach((c, i) => { pivot(c, 160 + i * 120, 504); p.move(c, (rand() - .5) * 120, -380 - rand() * 200, 2600 + i * 120, 'cubic-bezier(.2,.7,.3,1)', (rand() - .5) * 220); setTimeout(() => A.tapNote(.06), T(120 * i)); });
    await sleep(2400);
    caps.forEach(c => p.fade(c, 0, 1200));
    await sleep(1200);
    await p.fade(caps.faintBody, 0, 3200);
    await sleep(1500);
  };
  await all(row(L, 400, ['long', 'short', 'long', 'bun', 'short'], 4), row(R, 400, ['short', 'long', 'short', 'short', 'long'], 0));
  await all(L.clear(), R.clear());
}

async function youth() {
  await all(
    (async () => {
      await L.ink(K.person(400, 830, { kind: 'teen', h: 260, hair: 'long' }), { dur: 2000 });
      const pa = await L.ink(K.path(400, 560, 220, 380, -30), { dur: 1400 });
      const pb = await L.ink(K.path(400, 560, 590, 390, 30), { dur: 1400 });
      const oa = await L.ink(K.shoes(220, 330, .9), { dur: 1200 });
      const ob = await L.ink(K.books(590, 350, .9), { dur: 1200 });
      await sleep(300);
      const i = await L.choose([[220, 316, 58, 'ballet shoes'], [590, 326, 62, 'books']]);
      S.dream = i === 0 ? 'dance' : 'books';
      await L.ink(i === 0 ? K.path(400, 560, 220, 380, -30) : K.path(400, 560, 590, 390, 30), { dur: 900, w: 3 });
      await all(L.erase(i === 0 ? pb : pa, 1200), L.erase(i === 0 ? ob : oa, 1200));
      await sleep(1600); await L.clear(1200);
      if (S.dream === 'dance') {
        await L.ink(K.frame(400, 330, 300, 360), { dur: 1600, opacity: .6 });
        await L.ink(K.ground(760, -100, 900, 4, 2), { dur: 800 });
        const d = L.g(); pivot(d, 400, 640);
        await L.ink(K.person(400, 760, { kind: 'adult', h: 290, hair: 'bun', arm: 'reach', part: 'body' }), { parent: d, dur: 2000 });
        await L.ink([{ p: [[412, 682], [413, 720], [414, 760], [426, 761]], w: 1.9 }, { p: [[388, 684], [340, 660], [282, 618]], w: 1.9 }], { parent: d, dur: 900 });
        await L.taps(400, 560, 3, async k => { A.note(68 + k * 4, .12); await L.move(d, 0, 0, 900, 'ease-in-out', [-8, 6, 0][k]); }, { r: 40, label: 'dance' });
      } else {
        await L.ink(K.desk(400, 660), { dur: 1200 });
        await L.ink(K.person(400, 660, { kind: 'adult', h: 250, hair: 'long', pose: 'bust' }), { dur: 2000 });
        const stack = L.g(); await L.ink(K.books(560, 660, .7), { parent: stack, dur: 900 });
        await L.taps(250, 640, 3, async k => { A.note(68 + k * 4, .12); await L.ink([{ p: [[220, 652 - k * 14], [252, 640 - k * 14], [284, 652 - k * 14]], w: 1.6 }], { dur: 500 }); }, { r: 40, label: 'read' });
      }
      await sleep(2200);
      S.photos.push(S.dream);
    })(),
    (async () => {
      await R.ink(K.person(400, 830, { kind: 'teen', h: 260, hair: 'short' }), { dur: 2000 });
      const pa = await R.ink(K.path(400, 560, 220, 400, -30), { dur: 1400 });
      const pb = await R.ink(K.path(400, 560, 590, 400, 30), { dur: 1400 });
      const oa = await R.ink(K.house(220, 380, .55, false), { dur: 1400 });
      const ob = await R.ink(K.suitcase(590, 380, 1), { dur: 1200 });
      await sleep(300);
      const i = await R.choose([[220, 330, 64, 'stay home'], [590, 346, 56, 'leave for the city']]);
      S.place = i === 0 ? 'sea' : 'city';
      await R.ink(i === 0 ? K.path(400, 560, 220, 400, -30) : K.path(400, 560, 590, 400, 30), { dur: 900, w: 3 });
      await all(R.erase(i === 0 ? pb : pa, 1200), R.erase(i === 0 ? ob : oa, 1200));
      await sleep(1600); await R.clear(1200);
      if (S.place === 'sea') {
        A.sea(true);
        await R.ink(K.sea(620, -100, 900), { dur: 1800 });
        const sun = R.g(); await R.ink(K.sun(560, 470, 40), { parent: sun, dur: 1000 });
        await R.ink(K.person(330, 760, { kind: 'adult', h: 270, hair: 'short', pose: 'sit' }), { dur: 2000 });
        await R.ink(K.dogLying(470, 760, 1), { dur: 1400 });
        await R.taps(560, 470, 3, async k => { A.note(66 + k * 3, .12); R.washTo('gold', .2 + k * .2, 1200); await R.move(sun, 0, 50 * (k + 1), 1200); }, { r: 46, label: 'sun' });
      } else {
        R.weatherOn('rain', 60, [-100, 900]);
        await R.ink(K.skyline(760, -100, 900), { dur: 2400 });
        await R.ink(K.person(360, 790, { kind: 'adult', h: 270, hair: 'short' }), { dur: 2000 });
        await R.ink(K.suitcase(460, 790, .8), { dur: 800 });
        const wins = [[120, 520], [260, 470], [620, 540]];
        await R.taps(400, 440, 3, async k => { A.note(66 + k * 3, .12); const [x, y] = wins[k]; await R.ink([{ p: [[x, y], [x + 20, y], [x + 20, y + 26], [x, y + 26]], c: true, fill: '#f0b860', fo: .6, w: 1 }], { dur: 400 }); }, { r: 40, label: 'lights' });
      }
      await sleep(2200);
      S.photos.push(S.place);
    })(),
  );
  A.sea(false);
  await all(L.clear(), R.clear());
}

async function meeting() {
  const city = S.place === 'city';
  await all(
    (async () => {
      if (city) { L.weatherOn('rain', 60, [-100, 900]); await L.ink(K.skyline(720, -100, 900), { dur: 1800, opacity: .5 }); await L.ink(K.lamp(160, 760), { dur: 900 }); }
      else { A.sea(true); await L.ink(K.sea(600, -100, 900), { dur: 1400 }); }
      await L.ink(K.ground(760, -100, 900, 4, 2), { dur: 600 });
      const a = await walker(L, 150, 760, { hair: 'long' });
      let hatG; if (!city) { hatG = L.g(); await L.ink(K.hat(150, 486, .8), { parent: hatG, dur: 600 }); }
      await all(a.walk(440, 6000), hatG ? L.move(hatG, 440, 0, 6000, 'linear') : null);
      if (!city) { pivot(hatG, 150, 486); await L.move(hatG, 760, -60, 1800, 'ease-in', 140); }
    })(),
    (async () => {
      if (city) { R.weatherOn('rain', 60, [-100, 900]); await R.ink(K.skyline(720, -100, 900), { dur: 1800, opacity: .5 }); await R.ink(K.lamp(640, 760), { dur: 900 }); }
      else { await R.ink(K.sea(600, -100, 900), { dur: 1400 }); await R.ink(K.sun(500, 520, 36), { dur: 800 }); R.washTo('gold', .4, 3000); }
      await R.ink(K.ground(760, -100, 900, 4, 2), { dur: 600 });
      const b = await walker(R, 650, 760, { hair: 'short' });
      let um; if (city) { um = R.g(); await R.ink(K.umbrella(690, 400, .8), { parent: um, dur: 900 }); }
      await all(b.walk(-420, 6000), um ? R.move(um, -420, 0, 6000, 'linear') : null);
      if (!city) { const h = R.g(); await R.ink(K.hat(90, 744, .8), { parent: h, dur: 500 }); }
    })(),
  );
  await sleep(400);
  if (city) await R.tap(270, 380, 52, { label: 'umbrella' });
  else await R.tap(90, 740, 40, { label: 'hat' });
  A.chord(.1);
  await merge();
  A.music(3); A.sea(false);
  // together for the first time
  if (city) { B.weatherOn('rain', 90); await B.ink(K.skyline(760, -600, 1400), { dur: 2000, opacity: .4 }); }
  else { await B.ink(K.sea(600, -600, 1400), { dur: 1600 }); await B.ink(K.sun(400, 540, 38), { dur: 900 }); }
  B.washTo('gold', .55, 4000);
  await B.ink(K.ground(760, -600, 1400, 6, 2), { dur: 900 });
  await all(fig(B, 330, 760, { hair: 'long', arm: city ? 'down' : 'reachR' }, 2400), fig(B, 470, 760, { hair: 'short', arm: city ? 'up' : 'reachL' }, 2400));
  if (city) await B.ink(K.umbrella(420, 410, .9), { dur: 1200 });
  else await B.ink(K.hat(400, 556, .7), { dur: 700 });
  await sleep(3800);
  S.photos.push(city ? 'umbrella' : 'hat');
  await B.clear(1600);
}

async function swing() {
  const top = -1100, seat = 560;
  const mk = async (x, hair, arm) => {
    const g = B.g(); pivot(g, x, top);
    await B.ink(K.swing(x, top, seat - top), { parent: g, dur: 1600 });
    await B.ink(K.person(x, seat + 66, { h: 240, pose: 'sit', hair, arm }), { parent: g, dur: 2000 });
    return g;
  };
  const a = await mk(290, 'long', 'reachR'), b = await mk(510, 'short', 'reachL');
  const sw = (g, ph) => g.animate([{ transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }], { duration: T(2600), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: -T(ph) });
  const sa = sw(a, 0), sb = sw(b, 1300);
  await sleep(5200);
  sa.cancel(); sb.cancel();
  await sleep(400);
  await B.drag(369, 512, 400, 512, t => { a.style.transform = `rotate(${-1.25 * t}deg)`; b.style.transform = `rotate(${1.25 * t}deg)`; }, { r: 30 });
  A.chord(.13); B.washTo('gold', .7, 3000);
  await sleep(3600);
  await B.clear(1500);
  // a photograph, on the line
  await B.ink(K.clothesline(250, -600, 1400), { dur: 1600 });
  const pol = await B.ink(K.polaroid(400, 262, 1, 4), { dur: 1200 });
  await sleep(400);
  await B.tap(400, 318, 52, { label: 'take a photo' });
  await flash(B);
  await B.ink([...K.person(384, 352, { h: 66, hair: 'long' }), ...K.person(418, 352, { h: 66, hair: 'short' })], { dur: 3000, w: 1.2, opacity: .85 });
  S.photos.push('swing');
  await sleep(2800);
  await B.clear(1500);
}

async function home() {
  A.music(2);
  await B.ink(K.frame(400, 270, 220, 180), { dur: 1600, opacity: .7 });
  await B.ink(K.table(400, 610, 360), { dur: 1200 });
  await all(fig(B, 300, 610, { h: 300, pose: 'bust', hair: 'long' }, 2000), fig(B, 500, 610, { h: 300, pose: 'bust', hair: 'short' }, 2000));
  await B.ink([...K.cup(355, 610), ...K.cup(445, 610)], { dur: 1000 });
  await B.ink(K.dogLying(640, 770, 1), { dur: 1400 });
  await sleep(500);
  await B.tap(355, 588, 34, { label: 'cup' });
  await B.ink([...K.steam(355, 610), ...K.steam(445, 610)], { dur: 1600 });
  await sleep(2400);
  await B.dark(true, 2600); await sleep(1600); await B.dark(false, 2600);
  // the clock starts to hurry
  const c = B.g(); await B.ink(K.clock(640, 250, 34), { parent: c, dur: 800 });
  const hand = B.g(); await B.ink([{ p: [[640, 250], [640, 226]], w: 1.8 }], { parent: hand, dur: 300 }); pivot(hand, 640, 250);
  let tk = 0; const iv = setInterval(() => { A.tick(); tk++; }, T(260));
  await hand.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(1440deg)' }], { duration: T(5200), easing: 'ease-in', fill: 'forwards' }).finished;
  clearInterval(iv);
  S.photos.push('cups');
  await split(0);
}

async function busy() {
  A.music(1);
  const side = async (p, me, hair, doorX, flipDir) => {
    await p.ink(K.table(me === 'A' ? 330 : 470, 610, 260), { dur: 1000 });
    const person = await fig(p, me === 'A' ? 290 : 510, 610, { h: 300, pose: 'bust', hair }, 1800);
    await p.ink(K.cup(me === 'A' ? 360 : 440, 610), { dur: 700 });
    await p.ink(K.clock(me === 'A' ? 320 : 480, 220, 30), { dur: 600 });
    await p.ink(K.doorLight(doorX, 760), { dur: 600 });
    const door = await p.ink(K.door(doorX, 760), { dur: 1200 });
    await sleep(500);
    const i = await p.choose([[doorX, 640, 70, 'the lit door'], [me === 'A' ? 360 : 440, 590, 40, 'stay at the table']]);
    const away = i === 0;
    if (away) {
      await p.erase(person, 900);
      await p.ink(K.door(doorX, 760, true), { dur: 900 });
      const w = await walker(p, me === 'A' ? 290 : 510, 760, { hair, h: 270 }, 1200);
      await w.walk(doorX - (me === 'A' ? 290 : 510), 2400);
      await p.fade(w, 0, 900);
      A.tick(); await sleep(1600);
      await p.clear(1000);
      A.office(true);
      await p.ink(K.desk(400, 640), { dur: 900 });
      await fig(p, 400, 640, { h: 290, pose: 'bust', hair }, 1500);
      await p.ink(K.papers(300, 636, 3), { dur: 700 });
      await p.ink(K.papers(500, 636, 5), { dur: 700 });
    } else {
      await p.ink(K.steam(me === 'A' ? 360 : 440, 610), { dur: 1400 });
      A.note(71, .08);
    }
    await sleep(1800);
    return away;
  };
  const [a, b] = await all(side(L, 'A', 'long', 620), side(R, 'B', 'short', 180));
  S.awayA = a; S.awayB = b;
  gap(distance());
  await sleep(1600);
  if (!a && !b) {
    // they chose each other. a short breath together
    await merge();
    await B.ink(K.table(400, 610, 360), { dur: 900 });
    await all(fig(B, 300, 610, { h: 300, pose: 'bust', hair: 'long' }, 1600), fig(B, 500, 610, { h: 300, pose: 'bust', hair: 'short' }, 1600));
    await B.ink([...K.cup(355, 610), ...K.cup(445, 610), ...K.steam(355, 610), ...K.steam(445, 610)], { dur: 1400 });
    B.washTo('gold', .4, 2500); A.chord(.08);
    await sleep(3200);
    await split(0);
  } else {
    await all(L.clear(), R.clear());
  }
}

// A's mother. personal: always on A's own half first.
async function mother() {
  A.music(.6);
  const bedScene = async (late) => {
    L.weatherOn('snow', 40, [260, 540]);
    await L.ink(K.frame(400, 300, 260, 220), { dur: 1400 });
    await L.ink(K.bed(440, 640, 360), { dur: 1200 });
    if (!late) await L.ink(K.sleeper(440, 640, 360), { dur: 1600 });
    await fig(L, 170, 780, { h: 260, pose: 'sit', hair: 'long' }, 1600);
  };
  const walkMemory = async () => {
    await L.clear(1600);
    L.weatherOn('snow', 80, [-100, 900]);
    await L.ink(K.ground(712, -100, 900), { dur: 1200 });
    const prints = L.g();
    const m = await walker(L, 200, 700, { kind: 'old', h: 270, hair: 'grey' }, 2000);
    const a = await walker(L, 300, 700, { hair: 'long' }, 2000);
    const link = await L.ink([{ p: [[236, 600], [262, 612], [282, 600]], w: 1.8 }], { dur: 500 });
    A.music(1);
    await all(m.walk(220, 6400, prints), a.walk(220, 6400, prints), L.move(link, 220, 0, 6400, 'linear'));
    await all(L.fade(m, 0, 4200), L.fade(link, 0, 2400));
    A.note(64, .1, 6);
    await a.walk(260, 5200, prints);
    await sleep(1800);
  };
  let present;
  const left = (async () => {
    if (!S.awayA) {
      await bedScene(false);
      await L.tap(330, 626, 32, { label: 'her hand' });
      await L.ink([{ p: [[226, 660], [280, 640], [330, 628]], w: 1.8 }], { dur: 900 });
      A.heartbeat(.2); await sleep(2600);
      present = true; await walkMemory();
    } else {
      await L.ink(K.desk(400, 640), { dur: 900 });
      await fig(L, 400, 640, { h: 290, pose: 'bust', hair: 'long' }, 1400);
      const st = await L.ink(K.papers(300, 636, 6), { dur: 700 });
      await L.ink(K.phone(510, 636), { dur: 600 });
      await sleep(700);
      A.ring(3); const bz = await L.ink(K.buzz(510, 636), { dur: 300 });
      const i = await L.choose([[510, 612, 38, 'answer'], [300, 610, 46, 'keep working']], { timeout: 9000 });
      await L.fade(bz, 0, 300);
      A.office(false);
      if (i === 0) { present = true; await L.clear(1000); await bedScene(false); await L.tap(330, 626, 32, { label: 'her hand' }); await L.ink([{ p: [[226, 660], [280, 640], [330, 628]], w: 1.8 }], { dur: 900 }); A.heartbeat(.15); await sleep(1600); await walkMemory(); }
      else {
        present = false;
        await L.clear(1200);
        await bedScene(true);
        A.radio(true); await sleep(5200); A.radio(false);
        await sleep(1800);
      }
    }
  })();
  const right = (async () => {
    if (!S.awayB) {
      await R.ink(K.frame(400, 300, 240, 220), { dur: 1400, opacity: .7 });
      await R.ink(K.person(420, 780, { hair: 'short', h: 290 }), { dur: 1800 });
      await R.ink(K.dogLying(560, 780, .9), { dur: 1200 });
      if (!S.awayA) {
        // B is with A for this
        await R.tap(420, 600, 40, { label: 'go to her' });
      } else {
        // waiting. nights pass
        await sleep(2500);
        for (let k = 0; k < 2; k++) { await R.dark(true, 1600); await sleep(900); await R.dark(false, 1600); await sleep(900); }
      }
    } else {
      A.office(true);
      await R.ink(K.desk(400, 640), { dur: 900 });
      await fig(R, 400, 640, { h: 290, pose: 'bust', hair: 'short' }, 1400);
      for (let k = 0; k < 4; k++) { await R.ink(K.papers(260 + k * 90, 636, 3 + k), { dur: 700 }); await sleep(1600); }
    }
  })();
  await all(left, right);
  S.mother = present;
  if (present && !S.awayB) {
    // not alone in the snow
    await merge();
    B.weatherOn('snow', 100);
    await B.ink(K.ground(740, -600, 1400, 6, 3), { dur: 1200 });
    await all(fig(B, 350, 740, { hair: 'long', arm: 'reachR' }, 2200), fig(B, 450, 740, { hair: 'short', arm: 'reachL' }, 2200));
    A.chord(.07);
    await sleep(3600);
    await split(distance());
  } else {
    await all(L.clear(), R.clear());
  }
}

// the years that follow. what happens depends on who went away.
async function years() {
  if (S.awayB) return accident();
  if (S.awayA) return waiting();
  return togetherYears();
}
async function accident() {
  S.accident = true;
  A.music(1); A.office(false);
  const r = (async () => {
    R.weatherOn('rain', 60, [-100, 900]);
    await R.ink(K.skyline(720, -100, 900), { dur: 1600, opacity: .45 });
    await R.ink(K.ground(760, -100, 900, 4, 2), { dur: 600 });
    const b = await walker(R, 640, 760, { hair: 'short' }, 1400);
    const hl = R.g(); await R.ink(K.headlights(80, 700), { parent: hl, dur: 400, opacity: .2 });
    b.walk(-300, 3400);
    hl.animate([{ opacity: .2 }, { opacity: 1 }], { duration: T(3000), fill: 'forwards' });
    A.crash(); await sleep(2900);
    await flash(R);
    R.weatherOff();
    await R.dark(true, 400);
    A.music(0);
    for (let k = 0; k < 3; k++) { A.beep(); await sleep(1400); }
    await R.clear(300);
  })();
  const l = (async () => {
    if (!S.awayA) {
      await L.ink(K.frame(400, 300, 240, 220), { dur: 1200, opacity: .7 });
      await L.ink(K.table(400, 640, 300), { dur: 900 });
      await L.ink(K.cup(380, 640), { dur: 600 });
      await L.ink(K.phone(470, 640), { dur: 500 });
      await sleep(3000);
    } else {
      await L.ink(K.desk(400, 640), { dur: 900 });
      await fig(L, 400, 640, { h: 290, pose: 'bust', hair: 'long' }, 1400);
      await L.ink(K.papers(300, 636, 6), { dur: 700 });
      await L.ink(K.phone(510, 636), { dur: 600 });
      await sleep(2400);
    }
  })();
  await all(r, l);
  // the phone, in the dark
  A.ring(3);
  const px = S.awayA ? 510 : 470;
  const bz = await L.ink(K.buzz(px, S.awayA ? 636 : 640), { dur: 300 });
  let go;
  if (!S.awayA) { await L.tap(px, 616, 36, { label: 'answer' }); go = true; }
  else { const i = await L.choose([[px, 612, 38, 'answer'], [300, 610, 46, 'keep working']], { timeout: 9000 }); go = i === 0; }
  await L.fade(bz, 0, 300);
  await L.clear(1200);
  if (go) {
    // a bed at the seam; A's hand reaching into the dark half
    await L.ink(K.bed(760, 640, 300), { dur: 1000 });
    await fig(L, 330, 780, { h: 270, pose: 'sit', hair: 'long', arm: 'reachR' }, 1600);
    const lineG = R.g({}, R.over);
    let beat = null;
    await R.taps(120, 600, 5, async k => {
      A.heartbeat(.35 + k * .08); A.beep();
      if (beat) R.fade(beat, 0, 400);
      beat = await R.ink(K.monitorLine(-40, 840, 450), { white: true, parent: lineG, dur: 700, opacity: .3 + k * .14 });
    }, { r: 44, white: true, label: 'heartbeat' });
    await R.dark(false, 3200);
    R.fade(lineG, 0, 800);
    await R.ink(K.bed(160, 640, 300), { dur: 900 });
    await R.ink(K.sleeper(160, 640, 300, 'none'), { dur: 1400 });
    await R.ink(K.armOnBed(80, 620, 80), { dur: 600 });
    A.music(2); A.chord(.1);
    S.woke = 'together'; S.awayA = false; S.awayB = false;
    await sleep(2400);
    await merge();
    await B.ink(K.bed(400, 640, 380), { dur: 1000 });
    await B.ink(K.sleeper(400, 640, 380, 'none'), { dur: 1200 });
    await fig(B, 150, 790, { h: 270, pose: 'sit', hair: 'long', arm: 'reachR' }, 1600);
    B.washTo('gold', .45, 3000);
    await sleep(3600);
    await split(0);
  } else {
    await L.ink(K.desk(400, 640), { dur: 800 });
    await fig(L, 400, 640, { h: 290, pose: 'bust', hair: 'long' }, 1200);
    for (let k = 0; k < 3; k++) { await L.ink(K.papers(280 + k * 110, 636, 4 + k * 2), { dur: 600 }); await sleep(1700); }
    await R.dark(false, 5200);
    await R.ink(K.bed(400, 640, 340), { dur: 900 });
    await R.ink(K.sleeper(400, 640, 340, 'none'), { dur: 1200 });
    const dg = await R.ink(K.dogLying(420, 790, 1), { dur: 1200 });
    A.music(1);
    await R.tap(440, 760, 40, { label: 'the dog' });
    await R.ink(K.armOnBed(330, 650, 70), { dur: 700 });
    A.note(71, .1);
    S.woke = 'alone';
    gap(2);
    await sleep(2400);
    await all(L.clear(), R.clear());
  }
}
async function waiting() {
  A.music(1);
  const l = (async () => {
    A.office(true);
    await L.ink(K.desk(400, 640), { dur: 900 });
    await fig(L, 400, 640, { h: 290, pose: 'bust', hair: 'long' }, 1400);
    await L.ink(K.papers(280, 636, 5), { dur: 600 });
    await L.ink(K.polaroid(520, 560, .55, -8), { dur: 1000 });
    await sleep(600);
    const r = await L.tap(520, 596, 36, { label: 'the photo', timeout: 11000 });
    A.office(false);
    return r !== 'timeout';
  })();
  const r = (async () => {
    await R.ink(K.table(400, 610, 300), { dur: 900 });
    await R.ink([...K.cup(360, 610), ...K.cup(440, 610)], { dur: 800 });
    await fig(R, 470, 610, { h: 300, pose: 'bust', hair: 'short' }, 1600);
    const dg = await R.ink(K.dog(640, 780, .9, true), { dur: 1200 });
    for (let k = 0; k < 2; k++) { await sleep(1200); await R.dark(true, 1400); await sleep(700); await R.dark(false, 1400); }
    await R.erase(dg, 900); await R.ink(K.dogLying(640, 780, .9), { dur: 900 });
  })();
  const [back] = await all(l, r);
  if (back) {
    S.awayA = false; gap(0);
    A.chord(.1);
    await merge();
    await B.ink(K.table(400, 610, 360), { dur: 900 });
    await all(fig(B, 300, 610, { h: 300, pose: 'bust', hair: 'long' }, 1600), fig(B, 500, 610, { h: 300, pose: 'bust', hair: 'short' }, 1600));
    await B.ink([...K.cup(355, 610), ...K.cup(445, 610), ...K.steam(355, 610), ...K.steam(445, 610)], { dur: 1400 });
    await B.ink(K.dogLying(640, 770, 1), { dur: 1000 });
    B.washTo('gold', .4, 2500);
    await sleep(3400);
    await split(0);
  } else {
    await sleep(1200);
    await all(L.clear(), R.clear());
  }
}
async function togetherYears() {
  await merge();
  A.music(2);
  await B.ink(K.clothesline(250, -600, 1400), { dur: 1400 });
  const spots = [[250, 262, -5], [400, 272, 3], [550, 262, -2]];
  await B.ink(K.polaroid(...spots[0].slice(0, 2), 1, spots[0][2]), { dur: 900 });
  await B.ink([...K.person(236, 352, { h: 66, hair: 'long' }), ...K.person(266, 352, { h: 66, hair: 'short' })], { dur: 1000, w: 1.2 });
  for (let k = 1; k < 3; k++) {
    const [x, y, r] = spots[k];
    await B.ink(K.polaroid(x, y, 1, r), { dur: 900 });
    await B.tap(x, y + 56, 46, { label: 'take a photo' });
    await flash(B);
    if (k === 1) await B.ink(K.dog(x - 6, y + 90, .45), { dur: 1600, w: 1.2 });
    else await B.ink(K.house(x, y + 92, .3, false), { dur: 1600, w: 1.2 });
  }
  B.washTo('gold', .4, 2500);
  await sleep(3200);
  S.photos.push('dog');
  await split(0);
}

async function oldAge() {
  const together = !S.awayA && !S.awayB;
  if (together) {
    await merge();
    A.music(2);
    B.weatherOn('snow', 120);
    await B.ink(K.ground(740, -600, 1400, 6, 3), { dur: 1400 });
    const prints = B.g();
    const a = await walker(B, 40, 740, { kind: 'old', h: 270, hair: 'bun' }, 1800);
    const b = await walker(B, 150, 740, { kind: 'old', h: 280, hair: 'grey' }, 1800);
    await all(a.walk(240, 7600, prints), b.walk(240, 7600, prints));
    // where are we going? / ... don't know / we're looking for an answer.
    const puffs = [[a, 1], [b, -1], [a, 1]];
    A.radio(true);
    for (const [g, d] of puffs) { const bx = g.x + (d > 0 ? 30 : -30); const p = await B.ink(K.breath(bx, 482, 1, d < 0), { dur: 700 }); B.fade(p, 0, 2600); await sleep(1600); }
    A.radio(false);
    await sleep(800);
    await B.tap(335, 600, 34, { label: 'hold hands' });
    const link = await B.ink([{ p: [[318, 602], [336, 616], [352, 604]], w: 1.8 }], { dur: 500 });
    // golden hour
    A.music(4);
    B.setWeatherKind('gold'); B.washTo('gold', .95, 6000);
    await all(a.walk(160, 8000, prints), b.walk(160, 8000, prints), B.move(link, 160, 0, 8000, 'linear'));
    await sleep(3000);
    const first = S.accident ? b : a, second = first === a ? b : a;
    await B.fade(link, 0, 1200);
    await B.fade(first, 0, 5200);
    A.music(2);
    await sleep(1600);
    await second.walk(first === a ? -60 : 60, 2400);
    await sleep(3000);
    A.music(1);
    await B.dark(true, 6000);
    await sleep(1500);
    B.weatherOff();
  } else {
    A.music(2);
    const solo = async (p, x, dx, o) => {
      p.weatherOn('snow', 70, [-100, 900]);
      await p.ink(K.ground(740, -100, 900, 4, 3), { dur: 1200 });
      const prints = p.g();
      const w = await walker(p, x, 740, o, 1800);
      await w.walk(dx, 9000, prints);
      return w;
    };
    const [a, b] = await all(solo(L, 120, 520, { kind: 'old', h: 270, hair: 'bun' }), solo(R, 680, -520, { kind: 'old', h: 280, hair: 'grey' }));
    await sleep(1200);
    // the line between them. touch it, once, if you want
    const r = await L.tap(772, 450, 40, { label: 'the line between', timeout: 15000 });
    if (r !== 'timeout') {
      A.music(4);
      gap(0); seam(.25);
      await all(
        L.ink([{ p: [[800, 300], [742, 300], [742, 600], [800, 600]], w: 1.8, l: 1 }], { dur: 1400 }),
        R.ink([{ p: [[0, 300], [58, 300], [58, 600], [0, 600]], w: 1.8, l: 1 }], { dur: 1400 }),
      );
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .9, 5000), R.washTo('gold', .9, 5000));
      await all(L.ink([{ p: [[678, 534], [700, 470], [708, 410]], w: 1.8 }], { dur: 900 }), R.ink([{ p: [[122, 530], [100, 470], [92, 410]], w: 1.8 }], { dur: 900 }));
      A.chord(.12);
      await sleep(6000);
    } else {
      A.music(3);
      await all(L.ink(K.bench(560, 740), { dur: 1200 }), R.ink(K.bench(240, 740), { dur: 1200 }));
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .7, 6000), R.washTo('gold', .7, 6000));
      await sleep(5000);
    }
    A.music(1);
    const firstR = S.accident;
    await (firstR ? R : L).dark(true, 5000);
    await sleep(2500);
    await (firstR ? L : R).dark(true, 5000);
    await sleep(1500);
    L.weatherOff(); R.weatherOff();
  }
}

// ---------- epilogue: the paths you closed, the ones you walked ----------
async function epilogue(card) {
  bothEl.classList.add('on'); seam(0); gap(0);
  B.darkR.setAttribute('opacity', 1); B.isDark = true;
  B.root.replaceChildren(); B.over.replaceChildren(); B.washTo('transparent', 0, 10);
  A.music(2); A.darkness(0, .5);
  const together = !S.awayA && !S.awayB;
  const lifePath = (y0, y1, merge) => {
    const pts = [[-500, y0]]; let y = y0;
    for (let x = -380; x <= 1300; x += 120) {
      const t = (x + 500) / 1800;
      const tgt = merge ? (t > .45 ? 700 + (y0 < 700 ? -12 : 12) : y0 + (700 - y0) * t / .45) : y0 + (y1 - y0) * t;
      y = tgt + (rand() - .5) * 30; pts.push([x, y]);
    }
    return pts;
  };
  const branches = (pts) => {
    const S2 = [];
    for (let i = 1; i < pts.length - 1; i++) {
      for (let k = 0; k < 2; k++) {
        const [x, y] = pts[i]; const b = [[x, y]]; let by = y, bx = x;
        const dir = rand() < .5 ? -1 : 1;
        for (let j = 0; j < 4; j++) { bx += 60 + rand() * 40; by += dir * (20 + rand() * 40); b.push([bx, by]); }
        S2.push({ p: b, w: 1, o: .22 });
      }
    }
    return S2;
  };
  const pa = lifePath(590, together ? 690 : 520, together), pb = lifePath(820, together ? 710 : 900, together);
  const paths = B.g({}, B.over);
  await all(B.ink(branches(pa), { parent: paths, white: true, dur: 5000, stagger: .9 }), B.ink(branches(pb), { parent: paths, white: true, dur: 5000, stagger: .9 }));
  await all(B.ink([{ p: pa, w: 2.4 }], { parent: paths, white: true, dur: 4200 }), B.ink([{ p: pb, w: 2.4 }], { parent: paths, white: true, dur: 4200 }));
  await sleep(1200);
  // polaroids on a line
  const shots = S.photos.slice(-5);
  await B.ink(K.clothesline(110, -600, 1400), { white: true, dur: 1400 });
  const xs = shots.map((_, i) => 400 + (i - (shots.length - 1) / 2) * 150);
  for (let i = 0; i < shots.length; i++) {
    const x = xs[i], y = 122, rot = (rand() - .5) * 10;
    const g = B.g({}, B.over);
    await B.ink(K.polaroid(x, y, .62, rot), { parent: g, dur: 600, white: false });
    const m = miniature(shots[i], x, y + 36);
    await B.ink(m, { parent: g, dur: 900, w: 1.1 });
    A.tapNote(.07);
  }
  await sleep(2400);
  B.fade(paths, .35, 2000, false);
  await card(['You can’t choose where you’re born, or how you’re born, or who your parents are,', 'but you can choose how you will live.'], { dark: true, hold: 3200 });
}
function miniature(k, x, y) {
  const s = .32;
  switch (k) {
    case 'window': return K.house(x, y + 28, .26, false);
    case 'hands': return [...K.person(x - 10, y + 30, { h: 64, kind: 'adult', hair: 'bun' }), ...K.person(x + 12, y + 30, { h: 34, kind: 'child', hair: 'long' })];
    case 'ball': return [...K.dog(x, y + 28, .4), ...K.ball(x - 22, y + 4).map(q => ({ ...q, p: q.p.map(([px, py]) => [px, py]) }))];
    case 'dance': return K.shoes(x, y + 6, s * 1.4);
    case 'books': return K.books(x, y + 22, s * 1.3);
    case 'sea': return [...K.sun(x, y + 4, 12), { p: [[x - 34, y + 10], [x + 34, y + 10]], w: 1 }];
    case 'city': return K.skyline(y + 30, x - 34, x + 34).map(q => ({ ...q, p: q.p.map(([px, py]) => [px, y + 30 - (y + 30 - py) * .2]) }));
    case 'umbrella': return K.umbrella(x, y, .36);
    case 'hat': return K.hat(x, y + 8, .6);
    case 'swing': case 'cups': return [...K.person(x - 12, y + 30, { h: 50, hair: 'long' }), ...K.person(x + 12, y + 30, { h: 50, hair: 'short' })];
    case 'dog': return K.dog(x, y + 30, .45);
    default: return K.sun(x, y + 10, 14);
  }
}

export async function play(panes, card) {
  ({ L, R, B } = panes);
  for (const ep of [birth, childhood, graduation, youth, meeting, swing, home, busy, mother, years, oldAge]) {
    await ep();
    await sleep(700);
  }
  await epilogue(card);
}
