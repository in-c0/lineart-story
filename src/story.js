// The life, rebuilt around bodies and one recurring gesture: hands, and two cups on a table.
import { sleep, T, el, rand } from './engine.js';
import * as K from './shapes.js';
import * as A from './audio.js';
import { Figure, POSES } from './rig.js';
import { swingScene } from './scene_swing.js';

let L, R, B;
const stage = document.getElementById('stage');
const bothEl = document.getElementById('both');
// what the player decided. nothing here is ever saved.
export const S = { dream: null, place: null, awayA: false, awayB: false, mother: null, accident: false, woke: null, photos: [] };
const all = (...p) => Promise.all(p);
const seam = v => stage.style.setProperty('--seam', v);
const gap = n => { stage.style.setProperty('--gap', n * 18 + 'px'); stage.style.setProperty('--twin', n ? 'block' : 'none'); };
const distance = () => (S.awayA ? 1 : 0) + (S.awayB ? 1 : 0);
const WIDE = [0, 0, 800, 900];
const cam = (p, v = WIDE, ms = 0) => p.camera(...v, ms);
async function merge() { await all(L.clear(600), R.clear(600)); gap(0); seam(0); bothEl.classList.add('on'); cam(B); await sleep(900); }
async function split(n = distance()) { await B.clear(700); bothEl.classList.remove('on'); seam(1); gap(n); cam(L); cam(R); await sleep(600); }
const fig = (p, o) => { const F = new Figure(p, { ...o, hidden: true }); F.show(o.fade ?? 700); return F; };
const prints = (p, snow = true) => { const g = p.g(); return (A2, F) => { A.footstep(snow); p.ink(K.footprint(A2[0] + F.p.f * F.h * .03, A2[1] + F.h * .03, F.h / 320, 0), { parent: g, dur: 200, w: 1.1 }); }; };
// hold two figures' hands while they walk: both reach to a point between them
const linkHands = (a, b, drop = .33) => () => {
  const sa = a.shoulder(), sb = b.shoulder();
  const pt = [(sa[0] + sb[0]) / 2, Math.max(sa[1], sb[1]) + a.h * drop * .62];
  a.p.handN = pt; b.p.handN = pt;
};

// ================== episodes ==================
async function birth() {
  A.music(1);
  let gripped;
  const grip = new Promise(r => gripped = r);
  const side = async (p, left) => {
    // where: a lit window in the snow, or a sun coming up over water
    if (left) {
      p.weatherOn('snow', 60, [-100, 900]); cam(p, [100, 380, 600, 480]);
      await p.ink([...K.ground(700), ...K.house(400, 700)], { dur: 900 });
      await sleep(1500); await p.ink(K.windowGlow(400, 700), { dur: 300 }); A.note(83, .07, 4);
    } else {
      A.sea(true); cam(p, [100, 380, 600, 480]);
      await p.ink([...K.sea(640, -100, 900), ...K.sun(400, 610, 40)], { dur: 900 });
      p.washTo('gold', .35, 3500); await sleep(800); await p.ink(K.birds(520, 470), { dur: 700, pen: true });
    }
    await sleep(2200);
    // cut to the first thing they hold
    await p.clear(500); if (!left) A.sea(false); cam(p);
    const hand = await p.ink(K.hand(left ? 380 : 420, 560, 1.1, !left), { dur: 700 });
    await p.ink(K.baby(left ? 470 : 330, 470, 2.2), { dur: 700 });
    if (left) { await sleep(600); await p.tap(350, 556, 34, { label: 'the finger', target: hand }); gripped(); }
    else await grip;
    await p.ink(K.tinyHand(left ? 350 : 450, 556, 1.1, !left), { dur: 900, pen: true });
    A.heartbeat(.2); await sleep(2600);
  };
  await all(side(L, true), side(R, false));
  S.photos.push('window');
  await all(L.clear(700), R.clear(700));
}

async function childhood() {
  await all(
    (async () => {
      // mother and child in the snow, the child half a step behind
      L.weatherOn('snow', 70, [-100, 900]);
      await L.ink(K.ground(760, -100, 900, 6, 4), { dur: 600 });
      const m = fig(L, { x: 60, y: 760, h: 300, hair: 'bun', clothes: 'coat' });
      const k = fig(L, { x: 130, y: 760, h: 165, kind: 'child', hair: 'long', clothes: 'dress' });
      const link = linkHands(m, k, .5);
      link(); m.render(); k.render();
      await sleep(700);
      const fp = prints(L);
      await all(m.walk(480, 9000, { onStep: link, onPlant: fp }), (async () => { await sleep(180); await k.walk(480, 9000, { short: true, onStep: link, onPlant: fp, phase: Math.PI * .5 }); })());
      await sleep(1200);
      S.photos.push('hands');
    })(),
    (async () => {
      await R.ink([...K.ground(760, -100, 900, 6, 3), ...K.sun(650, 180, 30)], { dur: 600 });
      const c = fig(R, { x: 290, y: 760, h: 165, kind: 'child', hair: 'short', clothes: 'coat', p: { sN: 40, eN: 40 } });
      const dog = R.g(); await R.ink(K.dog(470, 760, 1.1, false), { parent: dog, dur: 600 });
      const ball = R.g(); await R.ink(K.ball(326, 662), { parent: ball, dur: 500 });
      await sleep(400);
      await R.tap(326, 662, 30, { label: 'the ball', target: ball });
      await c.to({ sN: -150, eN: 10, spine: -4 }, 260);
      R.move(ball, 170, -230, 800, 'cubic-bezier(.2,.7,.4,1)').then(() => R.move(ball, 330, 98, 900, 'ease-in'));
      c.to({ sN: -20, eN: 15, spine: 2 }, 900);
      await sleep(350);
      await R.move(dog, 190, 0, 1500, 'ease-in-out');
      await sleep(300);
      R.move(ball, 150, 82, 1500, 'ease-in-out');
      await R.move(dog, 10, 0, 1500, 'ease-in-out');
      await c.to({ sN: 30, eN: 60, spine: 12, neck: 14 }, 900);   // bends to the dog
      await sleep(2200);
      S.photos.push('ball');
    })(),
  );
  await all(L.clear(700), R.clear(700));
}

// primary school graduation: a row of children, caps in the air. one of them, quieter.
async function graduation() {
  A.music(1.6);
  const row = async (p, me, faint) => {
    cam(p, [60, 380, 680, 460]);
    await p.ink(K.ground(762, -100, 900, 6, 3), { dur: 500 });
    const hairs = ['short', 'long', 'bun', 'short', 'long'];
    const kids = [], caps = [];
    for (let i = 0; i < 5; i++) {
      const x = 170 + i * 115, h = 160 + (i * 37) % 22;
      const F = fig(p, { x, y: 760, h, kind: 'child', hair: i === me ? (p === L ? 'long' : 'short') : hairs[i], clothes: i % 2 ? 'dress' : 'coat', fade: 500, p: { neck: 4 + i, spine: (i % 3) - 1 } });
      kids.push(F);
      const top = F.joints().H;
      const c = p.g(); await p.ink(K.cap(top[0], top[1] - F.joints().L.headRy * .9, .6), { parent: c, dur: 300 }); caps.push(c);
      if (i === faint) { F.g.style.opacity = .3; c.style.opacity = .3; }
    }
    await sleep(1400);
    kids.forEach((F, i) => setTimeout(() => F.to({ sN: -165, eN: 5 }, 300), T(i * 70)));
    caps.forEach((c, i) => { c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center'; p.move(c, (rand() - .5) * 140, -430 - rand() * 160, 2600 + i * 110, 'cubic-bezier(.15,.7,.3,1)', (rand() - .5) * 260); });
    await sleep(1500);
    kids.forEach(F => F.to({ sN: 4, eN: 8 }, 900));
    caps.forEach(c => p.fade(c, 0, 1200));
    await sleep(1600);
    await kids[faint].g.animate([{ opacity: .3 }, { opacity: 0 }], { duration: T(2600), fill: 'forwards' }).finished;
    await sleep(1600);
  };
  await all(row(L, 2, 4), row(R, 2, 0));
  await all(L.clear(700), R.clear(700));
}

// the choice is made inside the room, by reaching for something
async function youth() {
  await all(
    (async () => {
      await L.ink([...K.frame(400, 330, 240, 280), ...K.desk(620, 640), { p: [[150, 330], [168, 330]], w: 2 }], { dur: 700, opacity: .9 });
      const shoes = L.g(); await L.ink(K.shoes(160, 400, .8), { parent: shoes, dur: 500 });
      const books = L.g(); await L.ink(K.books(620, 640, .65), { parent: books, dur: 400 });
      const a = fig(L, { x: 400, y: 790, h: 280, kind: 'teen', hair: 'long', clothes: 'dress', p: { head: -6 } });
      await sleep(900); a.to({ head: 10, neck: 8 }, 1400);
      const i = await L.choose([[160, 380, 60, 'ballet shoes', shoes], [620, 610, 60, 'books', books]]);
      S.dream = i === 0 ? 'dance' : 'books';
      const dir = i === 0 ? -1 : 1;
      a.set({ f: dir });
      await a.walk(dir * 150, 1900);
      await a.to({ handN: i === 0 ? [176, 410] : [600, 610], spine: 6 }, 900);
      await L.fade(i === 0 ? books : shoes, .08, 1600, false);
      await sleep(1400);
      await L.clear(600);
      if (S.dream === 'dance') {
        cam(L, [140, 330, 520, 520]);
        await L.ink([...K.frame(400, 420, 260, 320), ...K.ground(770, -100, 900, 4, 2)], { dur: 600, opacity: .7 });
        const d = fig(L, { x: 400, y: 770, h: 290, hair: 'bun', clothes: 'dress', p: { sN: -40, eN: 20, sF: -130, eF: 10 } });
        await sleep(500);
        await d.to({ spine: 24, hF: -70, kF: 2, sN: -100, eN: 10, sF: 60, eF: 6, neck: -6 }, 2400);
        A.note(71, .07, 5);
        await sleep(2600);
      } else {
        cam(L, [200, 380, 480, 480]);
        await L.ink([...K.desk(430, 650), ...K.books(560, 650, .6)], { dur: 600 });
        const r = fig(L, { x: 330, y: 790, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 680, spine: 14, neck: 20, handN: [420, 640], handF: [400, 642] } });
        await L.ink([{ p: [[400, 646], [428, 634], [458, 646]], w: 1.4 }], { dur: 300 });
        for (let k = 0; k < 2; k++) { await sleep(1300); await r.to({ handN: [450, 636] }, 500); await r.to({ handN: [420, 640] }, 500); }
        await sleep(1400);
      }
      S.photos.push(S.dream);
    })(),
    (async () => {
      A.sea(true);
      await R.ink([...K.frame(330, 330, 260, 240), ...K.door(660, 790)], { dur: 700, opacity: .9 });
      await R.ink(K.sea(380, 210, 450), { dur: 400, opacity: .5 });
      const dog = R.g(); await R.ink(K.dogLying(210, 790, 1), { parent: dog, dur: 500 });
      const bag = R.g(); await R.ink(K.suitcase(570, 790, .9), { parent: bag, dur: 400 });
      const b = fig(R, { x: 380, y: 790, h: 285, kind: 'teen', hair: 'short', clothes: 'coat', f: -1, p: { neck: 6 } });
      await sleep(900); b.to({ head: -8 }, 1200);
      const i = await R.choose([[220, 770, 58, 'stay with the dog', dog], [570, 760, 54, 'take the bag', bag]]);
      S.place = i === 0 ? 'sea' : 'city';
      if (i === 0) {
        await b.walk(-100, 1500);
        await b.to({ ...POSES.sit, py: 760, spine: 18, neck: 16, handN: [240, 772] }, 1400);
        await R.fade(bag, .08, 1400, false);
        A.note(66, .06, 5);
        await sleep(2400);
      } else {
        b.set({ f: 1 });
        await b.walk(140, 1700);
        await b.to({ handN: [570, 718], spine: 10 }, 700);
        await R.fade(dog, .1, 1200, false);
        await sleep(700);
        await R.clear(600); A.sea(false);
        R.weatherOn('rain', 60, [-100, 900]);
        await R.ink(K.skyline(760, -100, 900), { dur: 700, opacity: .6 });
        fig(R, { x: 330, y: 790, h: 280, hair: 'short', clothes: 'coat', p: { handN: [400, 720] } });
        await R.ink(K.suitcase(410, 790, .85), { dur: 400 });
        for (const [x, y] of [[120, 520], [260, 470], [620, 540]]) { await sleep(700); await R.ink([{ p: [[x, y], [x + 20, y], [x + 20, y + 26], [x, y + 26]], c: true, fill: '#f0b860', fo: .55, w: 1 }], { dur: 300, flat: true }); }
        await sleep(1600);
      }
      S.photos.push(S.place);
    })(),
  );
  A.sea(false);
  await all(L.clear(700), R.clear(700));
}

async function meeting() {
  const city = S.place === 'city';
  await all(
    (async () => {
      if (city) { L.weatherOn('rain', 60, [-100, 900]); await L.ink([...K.skyline(720, -100, 900), ...K.lamp(160, 760)], { dur: 700, opacity: .5 }); }
      else { A.sea(true); await L.ink(K.sea(600, -100, 900), { dur: 600 }); }
      await L.ink(K.ground(760, -100, 900, 4, 2), { dur: 400 });
      const a = fig(L, { x: 100, y: 760, h: 290, hair: 'long', clothes: 'dress' });
      await a.walk(560, 7200, { onPlant: () => A.footstep(false) });
    })(),
    (async () => {
      if (city) { R.weatherOn('rain', 60, [-100, 900]); await R.ink([...K.skyline(720, -100, 900), ...K.lamp(640, 760)], { dur: 700, opacity: .5 }); }
      else { await R.ink([...K.sea(600, -100, 900), ...K.sun(500, 520, 34)], { dur: 600 }); R.washTo('gold', .4, 3000); }
      await R.ink(K.ground(760, -100, 900, 4, 2), { dur: 400 });
      const b = fig(R, { x: 700, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: city ? { handN: [745, 560] } : {} });
      let um; if (city) { um = R.g(); await R.ink(K.umbrella(752, 410, .75), { parent: um, dur: 400 }); }
      await all(b.walk(-540, 7200), um ? R.move(um, -540, 0, 7200, 'ease-in-out') : null);
    })(),
  );
  // they notice each other. a pause before anything happens.
  await sleep(900);
  await merge();
  A.music(2.6); A.sea(false);
  if (city) { B.weatherOn('rain', 90); await B.ink(K.skyline(760, -600, 1400), { dur: 600, opacity: .35 }); }
  else { await B.ink([...K.sea(600, -600, 1400), ...K.sun(590, 470, 28)], { dur: 600 }); }
  B.washTo('gold', .5, 4000);
  await B.ink(K.ground(760, -600, 1400, 6, 2), { dur: 400 });
  cam(B, [140, 300, 520, 520]);
  const x1 = fig(B, { x: 320, y: 760, h: 290, hair: 'long', clothes: 'dress', p: { neck: 8 } });
  const x2 = fig(B, { x: 490, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: city ? { handN: [432, 530] } : { handN: [450, 640] } });
  if (city) await B.ink(K.umbrella(420, 410, .8), { dur: 600 });
  else { const h = B.g(); await B.ink(K.hat(452, 640, .6), { parent: h, dur: 400 }); await sleep(900); await all(x2.to({ handN: [405, 600] }, 1300), B.move(h, -46, -40, 1300)); await x1.to({ handN: [395, 600] }, 900); }
  await cam(B, [200, 340, 400, 400], 5000);
  await sleep(1200);
  S.photos.push(city ? 'umbrella' : 'hat');
  await B.clear(900);
}

async function swing() {
  cam(B);
  await swingScene(B);
  // the photograph that hangs on the line afterwards
  await B.clear(800); B.washTo('transparent', 0, 10); cam(B, [150, 160, 500, 400]);
  await B.ink(K.clothesline(250, -600, 1400), { dur: 600 });
  await B.ink(K.polaroid(400, 262, 1, 4), { dur: 500 });
  await sleep(1100);
  await flash(B);
  await B.ink([...K.person(384, 352, { h: 66, hair: 'long' }), ...K.person(418, 352, { h: 66, hair: 'short' })], { dur: 2600, w: 1.1, opacity: .85, pen: true });
  S.photos.push('swing');
  await sleep(2200);
  await B.clear(800);
}
async function flash(p) { const r = el('rect', { x: -1600, y: -1200, width: 4000, height: 3300, fill: '#fffdf6', opacity: 0, 'pointer-events': 'none' }, p.ui); A.shutter(); await r.animate([{ opacity: 0 }, { opacity: .95, offset: .15 }, { opacity: 0 }], { duration: T(900) }).finished; r.remove(); }

// two cups on a table: shown here, then varied for the rest of the life
async function cupsScene(p, { a = true, b = true, x = 400, steam = true, oneUntouched = false } = {}) {
  await p.ink(K.table(x, 620, 380), { dur: 500 });
  const out = {};
  if (a) out.a = fig(p, { x: x - 150, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 690, spine: 8, neck: 10 } });
  if (b) out.b = fig(p, { x: x + 150, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 690, spine: 8, neck: 10 } });
  await sleep(700);
  const put = async (F, cx) => { if (!F) return; await F.to({ handN: [cx, 606], spine: 16 }, 900); await p.ink(K.cup(cx, 620), { dur: 300 }); F.p.handN = null; await F.to({ sN: 20, eN: 70, spine: 8 }, 900); };
  await all(put(out.a, x - 50), (async () => { await sleep(350); await put(out.b, x + 50); })());
  if (oneUntouched && !out.a) await p.ink(K.cup(x - 50, 620), { dur: 300, opacity: .9 });
  if (steam) await p.ink([...K.steam(x - 50, 620), ...K.steam(x + 50, 620)], { dur: 1400, pen: true, opacity: .8 });
  return out;
}

async function home() {
  A.music(2);
  cam(B, [130, 330, 540, 470]);
  await B.ink(K.frame(400, 280, 200, 170), { dur: 600, opacity: .6 });
  await B.ink(K.dogLying(650, 900, 1), { dur: 500 });
  await cupsScene(B);
  await sleep(2600);
  await B.dark(true, 2400); await sleep(1400); await B.dark(false, 2400);
  // the clock starts to hurry
  await B.ink(K.clock(620, 250, 30), { dur: 400 });
  const hand = B.g(); await B.ink([{ p: [[620, 250], [620, 228]], w: 1.8 }], { parent: hand, dur: 200 });
  hand.style.transformBox = 'view-box'; hand.style.transformOrigin = '620px 250px';
  const iv = setInterval(() => A.tick(), T(240));
  await hand.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(1440deg)' }], { duration: T(4800), easing: 'ease-in', fill: 'forwards' }).finished;
  clearInterval(iv);
  S.photos.push('cups');
  await split(0);
}

async function busy() {
  A.music(1);
  const side = async (p, left) => {
    const x = left ? 300 : 500, cupX = left ? 380 : 420, doorX = left ? 640 : 160;
    cam(p, [60, 330, 680, 520]);
    await p.ink([...K.table(left ? 360 : 440, 640, 260), ...K.clock(left ? 320 : 480, 260, 26)], { dur: 500 });
    const F = fig(p, { x, y: 900, h: left ? 290 : 300, hair: left ? 'long' : 'short', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 710, spine: 8, neck: 12 } });
    const cup = p.g(); await p.ink(K.cup(cupX, 640), { parent: cup, dur: 300 });
    const door = p.g(); await p.ink([...K.doorLight(doorX, 800), ...K.door(doorX, 800)], { parent: door, dur: 500 });
    await sleep(900);
    F.to({ neck: 2, spine: 2 }, 1200);
    const i = await p.choose([[doorX, 680, 70, 'the lit door', door], [cupX, 620, 40, 'stay at the table', cup]]);
    const away = i === 0;
    if (away) {
      await F.to({ ...POSES.stand, py: null, y: 800 }, 900);
      F.p.py = null;
      await F.walk(doorX - x, 2600);
      await F.hide(700);
      A.tick(); await sleep(900);
      await p.clear(500); A.office(true); cam(p, [100, 350, 600, 520]);
      await p.ink([...K.desk(400, 650), ...K.papers(300, 646, 3), ...K.papers(500, 646, 5)], { dur: 500 });
      fig(p, { x: 400 + (left ? -60 : 60), y: 900, h: 290, hair: left ? 'long' : 'short', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 720, spine: 22, neck: 26, handN: [left ? 420 : 380, 644] } });
    } else {
      await F.to({ handN: [cupX - 8, 626], handF: [cupX + 8, 626], spine: 14 }, 1100);
      await p.ink(K.steam(cupX, 640), { dur: 1400, pen: true, opacity: .8 });
    }
    await sleep(2000);
    return away;
  };
  const [a, b] = await all(side(L, true), side(R, false));
  S.awayA = a; S.awayB = b;
  gap(distance());
  await sleep(1400);
  if (!a && !b) { await merge(); cam(B, [130, 330, 540, 470]); await cupsScene(B); B.washTo('gold', .35, 2500); await sleep(2600); await split(0); }
  else await all(L.clear(700), R.clear(700));
}

// A's mother
async function mother() {
  A.music(.5);
  const bedside = async () => {
    L.weatherOn('snow', 30, [280, 520]); cam(L, [80, 360, 640, 520]);
    await L.ink([...K.frame(400, 300, 260, 220), ...K.bed(470, 660, 360), ...K.sleeper(470, 660, 360)], { dur: 700 });
    const a = fig(L, { x: 190, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 14, neck: 16 } });
    const herHand = L.g(); await L.ink(K.armOnBed(330, 640, 50), { parent: herHand, dur: 400 });
    await sleep(800);
    await L.tap(370, 646, 36, { label: 'her hand', target: herHand });
    await a.to({ handN: [350, 632], spine: 24 }, 800);   // reach
    await sleep(500);                                     // and wait
    await a.to({ handN: [366, 642] }, 300);              // touch
    A.heartbeat(.18); await sleep(3200);
  };
  const snowMemory = async () => {
    await L.clear(500); cam(L);
    L.weatherOn('snow', 90, [-100, 900]);
    await L.ink(K.ground(760, -100, 900, 6, 4), { dur: 400 });
    const m = fig(L, { x: 80, y: 760, h: 270, kind: 'old', hair: 'grey', clothes: 'coat' });
    const a = fig(L, { x: 170, y: 760, h: 290, hair: 'long', clothes: 'dress' });
    const link = linkHands(a, m, .5); link(); a.render(); m.render();
    A.music(1);
    const fp = prints(L);
    await sleep(700);
    // she is slower now; her daughter matches her
    await all(m.walk(240, 7600, { short: true, onStep: link, onPlant: fp }), a.walk(240, 7600, { short: true, onStep: link, onPlant: fp, phase: 1 }));
    m.hide(4200);
    await sleep(800);
    a.p.handN = null; await a.to({ sN: 10, eN: 10 }, 1400);
    A.music(0); await sleep(2500);                       // silence
    await a.walk(160, 4200, { short: true, onPlant: fp });
    await sleep(3000);
  };
  let present;
  const left = (async () => {
    if (!S.awayA) { await bedside(); present = true; await snowMemory(); return; }
    cam(L, [100, 350, 600, 520]);
    await L.ink([...K.desk(400, 650), ...K.papers(300, 646, 6), ...K.phone(510, 646)], { dur: 500 });
    fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } });
    await sleep(1600);
    A.ring(3); const bz = await L.ink(K.buzz(510, 646), { dur: 200 });
    const i = await L.choose([[510, 622, 38, 'answer'], [300, 620, 46, 'keep working']], { timeout: 9000 });
    await L.fade(bz, 0, 300); A.office(false);
    if (i === 0) { present = true; await L.clear(500); await bedside(); await snowMemory(); }
    else {
      present = false;
      await L.clear(800); cam(L, [80, 360, 640, 520]);
      L.weatherOn('snow', 30, [280, 520]);
      await L.ink([...K.frame(400, 300, 260, 220), ...K.bed(470, 660, 360)], { dur: 700 });
      fig(L, { x: 190, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 4, neck: 30 } });
      A.radio(true); await sleep(5200); A.radio(false);
      A.music(0); await sleep(3000);
    }
  })();
  const right = (async () => {
    if (!S.awayB) {
      cam(R, [130, 330, 540, 470]);
      if (!S.awayA) {
        await R.ink(K.frame(400, 300, 240, 220), { dur: 600, opacity: .7 });
        fig(R, { x: 400, y: 790, h: 300, hair: 'short', clothes: 'coat', p: { neck: 14, spine: 4 } });
        await R.ink(K.dogLying(560, 790, .9), { dur: 400 });
      } else {
        // the waiting: two cups set out each evening, one goes cold
        await cupsScene(R, { a: false, steam: false, oneUntouched: true });
        for (let k = 0; k < 2; k++) { await sleep(1600); await R.dark(true, 1500); await sleep(800); await R.dark(false, 1500); }
      }
    } else {
      A.office(true); cam(R, [100, 350, 600, 520]);
      await R.ink(K.desk(400, 650), { dur: 400 });
      fig(R, { x: 460, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 720, spine: 24, neck: 28, handN: [380, 644] } });
      for (let k = 0; k < 4; k++) { await R.ink(K.papers(260 + k * 90, 646, 3 + k), { dur: 400 }); await sleep(1800); }
    }
  })();
  await all(left, right);
  S.mother = present;
  if (present && !S.awayB) {
    // not alone in the snow
    await merge();
    B.weatherOn('snow', 100); cam(B, [150, 330, 500, 500]);
    await B.ink(K.ground(760, -600, 1400, 6, 3), { dur: 400 });
    const a = fig(B, { x: 360, y: 760, h: 290, hair: 'long', clothes: 'dress', p: { neck: 26, spine: 6 } });
    const b = fig(B, { x: 450, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: { neck: 10 } });
    await sleep(1400);
    const sh = a.shoulder();
    await b.to({ handN: [sh[0] + 4, sh[1] + 4], spine: 6 }, 1400);
    A.chord(.06);
    await sleep(3800);
    await split(distance());
  } else await all(L.clear(700), R.clear(700));
}

async function years() { if (S.awayB) return accident(); if (S.awayA) return waiting(); return togetherYears(); }

async function accident() {
  S.accident = true; A.music(1); A.office(false);
  const r = (async () => {
    R.weatherOn('rain', 60, [-100, 900]);
    await R.ink([...K.skyline(720, -100, 900), ...K.ground(760, -100, 900, 4, 2)], { dur: 600, opacity: .5 });
    const b = fig(R, { x: 660, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1 });
    const hl = R.g(); await R.ink(K.headlights(80, 700), { parent: hl, dur: 300, opacity: .2 });
    b.walk(-320, 3600, { spine: 12 });
    hl.animate([{ opacity: .2 }, { opacity: 1 }], { duration: T(3000), fill: 'forwards' });
    A.crash(); await sleep(2900);
    await flash(R); R.weatherOff();
    await R.dark(true, 300);
    A.music(0); await sleep(2600);                       // nothing
    for (let k = 0; k < 2; k++) { A.beep(); await sleep(1500); }
    await R.clear(200);
  })();
  const l = (async () => {
    cam(L, [100, 350, 600, 520]);
    if (!S.awayA) await L.ink([...K.table(400, 650, 300), ...K.cup(380, 650), ...K.phone(470, 650)], { dur: 500 });
    else { await L.ink([...K.desk(400, 650), ...K.papers(300, 646, 6), ...K.phone(510, 646)], { dur: 500 }); fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } }); }
    await sleep(2400);
  })();
  await all(r, l);
  A.ring(3);
  const px = S.awayA ? 510 : 470;
  const bz = await L.ink(K.buzz(px, 650), { dur: 200 });
  let go;
  if (!S.awayA) { await L.tap(px, 626, 36, { label: 'answer' }); go = true; }
  else { const i = await L.choose([[px, 622, 38, 'answer'], [300, 620, 46, 'keep working']], { timeout: 9000 }); go = i === 0; }
  await L.fade(bz, 0, 300); await L.clear(600);
  if (go) {
    // a bed at the seam. A reaches into the dark half.
    cam(L);
    await L.ink(K.bed(800, 660, 300), { dur: 400 });
    fig(L, { x: 420, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 20, neck: 20, handN: [700, 640] } });
    await sleep(1200);
    await R.tap(120, 600, 50, { white: true, label: 'hold on' });
    A.heartbeat(.4); A.beep();
    const beat = await R.ink(K.monitorLine(-40, 840, 450), { white: true, dur: 900, pen: true, opacity: .6 });
    await sleep(1600);
    await R.dark(false, 4200); R.fade(beat, 0, 600);
    await R.ink([...K.bed(160, 660, 300), ...K.sleeper(160, 660, 300, 'none'), ...K.armOnBed(80, 640, 70)], { dur: 900 });
    A.music(2); A.chord(.07);
    S.woke = 'together'; S.awayA = false; S.awayB = false;
    await sleep(2200);
    await merge(); cam(B, [100, 360, 600, 520]);
    await B.ink([...K.bed(470, 660, 380), ...K.sleeper(470, 660, 380, 'none')], { dur: 500 });
    fig(B, { x: 200, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 22, neck: 18, handN: [372, 640] } });
    B.washTo('gold', .4, 3000);
    await sleep(4200);
    await split(0);
  } else {
    cam(L, [100, 350, 600, 520]);
    await L.ink(K.desk(400, 650), { dur: 400 });
    fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } });
    for (let k = 0; k < 3; k++) { await L.ink(K.papers(280 + k * 110, 646, 4 + k * 2), { dur: 400 }); await sleep(1900); }
    await R.dark(false, 5200);
    cam(R, [100, 360, 600, 520]);
    await R.ink([...K.bed(400, 660, 340), ...K.sleeper(400, 660, 340, 'none'), ...K.dogLying(420, 800, 1), ...K.armOnBed(330, 660, 70)], { dur: 900 });
    A.music(1); A.note(71, .06);
    S.woke = 'alone'; gap(2);
    await sleep(3200);
    await all(L.clear(700), R.clear(700));
  }
}
async function waiting() {
  A.music(1);
  const l = (async () => {
    A.office(true); cam(L, [100, 350, 600, 520]);
    await L.ink([...K.desk(400, 650), ...K.papers(280, 646, 5)], { dur: 500 });
    fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } });
    const ph = L.g(); await L.ink(K.polaroid(520, 570, .5, -8), { parent: ph, dur: 500 });
    await sleep(700);
    const r = await L.tap(520, 600, 36, { label: 'the photo', timeout: 11000, target: ph });
    A.office(false);
    return r !== 'timeout';
  })();
  const r = (async () => {
    cam(R, [130, 330, 540, 470]);
    await cupsScene(R, { a: false, steam: false, oneUntouched: true });
    for (let k = 0; k < 2; k++) { await sleep(1300); await R.dark(true, 1400); await sleep(700); await R.dark(false, 1400); }
  })();
  const [back] = await all(l, r);
  if (back) {
    S.awayA = false; gap(0); A.chord(.07);
    await merge(); cam(B, [130, 330, 540, 470]);
    await cupsScene(B); B.washTo('gold', .35, 2500);
    await sleep(3000); await split(0);
  } else { await sleep(1200); await all(L.clear(700), R.clear(700)); }
}
async function togetherYears() {
  await merge(); A.music(2); cam(B, [100, 150, 600, 420]);
  await B.ink(K.clothesline(250, -600, 1400), { dur: 500 });
  await B.ink([...K.polaroid(250, 262, 1, -5), ...K.person(236, 352, { h: 66, hair: 'long' }), ...K.person(266, 352, { h: 66, hair: 'short' })], { dur: 500 });
  for (const [x, y, r, k] of [[400, 272, 3, 1], [550, 262, -2, 2]]) {
    await B.ink(K.polaroid(x, y, 1, r), { dur: 400 });
    await sleep(900); await flash(B);
    await B.ink(k === 1 ? K.dog(x - 6, y + 90, .45) : K.house(x, y + 92, .3, false), { dur: 1600, w: 1.1, pen: true });
  }
  B.washTo('gold', .35, 2500); await sleep(2600);
  S.photos.push('dog');
  await split(0);
}

async function oldAge() {
  const together = !S.awayA && !S.awayB;
  if (together) {
    await merge(); A.music(2);
    B.weatherOn('snow', 120);
    await B.ink(K.ground(760, -600, 1400, 6, 3), { dur: 500 });
    const a = fig(B, { x: 40, y: 760, h: 275, kind: 'old', hair: 'bun', clothes: 'dress' });
    const b = fig(B, { x: 120, y: 760, h: 285, kind: 'old', hair: 'grey', clothes: 'coat' });
    const link = linkHands(b, a, .5); link(); a.render(); b.render();
    const fp = prints(B);
    await sleep(700);
    // one of them is slower now; the other keeps pace
    await all(a.walk(250, 9000, { short: true, onStep: link, onPlant: fp }), b.walk(250, 9000, { short: true, onStep: link, onPlant: fp, phase: 1.3 }));
    // where are we going? / ... don't know / we're looking for an answer.
    A.radio(true);
    for (const [F, d] of [[a, 1], [b, -1], [a, 1]]) { const sh = F.shoulder(); const p = await B.ink(K.breath(sh[0] + d * 30, sh[1] - 60, 1, d < 0), { dur: 600, pen: true }); B.fade(p, 0, 2600); await sleep(1700); }
    A.radio(false);
    await cam(B, [180, 360, 420, 440], 2600);
    const h = b.hand('N');
    await B.tap(h[0], h[1], 40, { label: 'their hands' });
    A.music(4);
    B.setWeatherKind('gold'); B.washTo('gold', .95, 6000);
    await all(a.walk(150, 8000, { short: true, onStep: link, onPlant: fp }), b.walk(150, 8000, { short: true, onStep: link, onPlant: fp, phase: 1.3 }));
    await sleep(2400);
    const first = S.accident ? b : a, second = first === a ? b : a;
    first.p.handN = null; second.p.handN = null;
    await all(first.to({ sN: 4, eN: 8 }, 1200), second.to({ sN: 4, eN: 8 }, 1200));
    A.music(1.4);
    await first.hide(5200);
    A.music(0); await sleep(2800);
    // the one left lifts a hand toward where the other was, then lowers it
    await second.to({ handN: [first.p.x, first.shoulder()[1] + 70], spine: 6 }, 1600);
    await sleep(1400);
    second.p.handN = null; await second.to({ sN: 4, eN: 10 }, 1600);
    await sleep(2000);
    // and later, at the table: two cups out of habit. one goes back.
    await B.clear(900); cam(B, [130, 330, 540, 470]); B.washTo('gold', .5, 2000);
    await B.ink(K.table(400, 620, 380), { dur: 400 });
    const left = first === b;
    const one = fig(B, { x: left ? 250 : 550, y: 900, h: 280, kind: 'old', hair: left ? 'bun' : 'grey', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 690, spine: 14, neck: 12 } });
    await sleep(900);
    const cx1 = left ? 350 : 450, cx2 = left ? 450 : 350;
    await one.to({ handN: [cx1, 606] }, 900); await B.ink(K.cup(cx1, 620), { dur: 300 });
    await one.to({ handN: [cx2, 606], spine: 22 }, 1100); const c2 = await B.ink(K.cup(cx2, 620), { dur: 300 });
    await sleep(1600);
    await one.to({ handN: [cx2, 610] }, 800); await B.fade(c2, 0, 900);
    one.p.handN = null; await one.to({ sN: 10, eN: 60, spine: 10 }, 1200);
    await sleep(3200);
    await B.dark(true, 6000); await sleep(1600); B.weatherOff();
  } else {
    A.music(2);
    const solo = async (p, x, dx, o) => {
      p.weatherOn('snow', 70, [-100, 900]);
      await p.ink(K.ground(760, -100, 900, 4, 3), { dur: 500 });
      const F = fig(p, { x, y: 760, ...o });
      await F.walk(dx, 10000, { short: true, onPlant: prints(p) });
      return F;
    };
    const [a, b] = await all(solo(L, 120, 500, { h: 275, kind: 'old', hair: 'bun', clothes: 'dress' }), solo(R, 680, -500, { h: 285, kind: 'old', hair: 'grey', clothes: 'coat', f: -1 }));
    await sleep(1400);
    // the line between them. touch it, once, if you want
    const r = await L.tap(772, 450, 40, { label: 'the line between', timeout: 15000 });
    if (r !== 'timeout') {
      A.music(4); gap(0); seam(.25);
      await all(L.ink([{ p: [[800, 300], [742, 300], [742, 600], [800, 600]], w: 1.8, l: 1 }], { dur: 1200, pen: true }), R.ink([{ p: [[0, 300], [58, 300], [58, 600], [0, 600]], w: 1.8, l: 1 }], { dur: 1200, pen: true }));
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .9, 5000), R.washTo('gold', .9, 5000), a.to({ sN: -150, eN: 20 }, 1800), b.to({ sN: -150, eN: 20 }, 1800));
      A.chord(.08); await sleep(4500);
    } else {
      A.music(3);
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .7, 6000), R.washTo('gold', .7, 6000), a.to({ neck: -14, spine: -4 }, 3000), b.to({ neck: -14, spine: -4 }, 3000));
      await sleep(4000);
    }
    A.music(1);
    const firstR = S.accident;
    await (firstR ? R : L).dark(true, 5000);
    A.music(0); await sleep(3000);
    await (firstR ? L : R).dark(true, 5000);
    await sleep(1500); L.weatherOff(); R.weatherOff();
  }
}

// ---------- epilogue: the paths closed, the ones walked. no words. ----------
async function epilogue() {
  bothEl.classList.add('on'); seam(0); gap(0); cam(B);
  B.darkR.getAnimations().forEach(a => a.cancel());
  B.darkR.setAttribute('opacity', 1); B.isDark = true;
  B.root.replaceChildren(); B.over.replaceChildren(); B.washTo('transparent', 0, 10);
  A.music(2); A.darkness(0, .5);
  const together = !S.awayA && !S.awayB;
  const lifePath = (y0, y1, merge) => {
    const pts = [[-500, y0]]; let y = y0;
    for (let x = -380; x <= 1300; x += 120) {
      const t = (x + 500) / 1800;
      const tgt = merge ? (t > .45 ? 600 + (y0 < 600 ? -12 : 12) : y0 + (600 - y0) * t / .45) : y0 + (y1 - y0) * t;
      y = tgt + (rand() - .5) * 30; pts.push([x, y]);
    }
    return pts;
  };
  const branches = pts => { const out = []; for (let i = 1; i < pts.length - 1; i++) for (let k = 0; k < 2; k++) { const [x, y] = pts[i]; const b = [[x, y]]; let by = y, bx = x; const dir = rand() < .5 ? -1 : 1; for (let j = 0; j < 4; j++) { bx += 60 + rand() * 40; by += dir * (20 + rand() * 40); b.push([bx, by]); } out.push({ p: b, w: 1, o: .22 }); } return out; };
  const pa = lifePath(470, together ? 590 : 400, together), pb = lifePath(740, together ? 610 : 820, together);
  await all(B.ink(branches(pa), { white: true, dur: 5000, stagger: .9, pen: true }), B.ink(branches(pb), { white: true, dur: 5000, stagger: .9, pen: true }));
  await all(B.ink([{ p: pa, w: 2.4 }], { white: true, dur: 4200, pen: true }), B.ink([{ p: pb, w: 2.4 }], { white: true, dur: 4200, pen: true }));
  await sleep(1000);
  const shots = S.photos.slice(-5);
  await B.ink(K.clothesline(150, -600, 1400), { white: true, dur: 1400, pen: true });
  for (let i = 0; i < shots.length; i++) {
    const x = 400 + (i - (shots.length - 1) / 2) * 150, y = 162, rot = (rand() - .5) * 10;
    const g = B.g({}, B.over);
    await B.ink(K.polaroid(x, y, .62, rot), { parent: g, dur: 400 });
    await B.ink(miniature(shots[i], x, y + 36), { parent: g, dur: 900, w: 1.1, pen: true });
  }
  await sleep(4000);
}
function miniature(k, x, y) {
  const s = .32;
  switch (k) {
    case 'window': return K.house(x, y + 28, .26, false);
    case 'hands': return [...K.person(x - 10, y + 30, { h: 64, kind: 'adult', hair: 'bun' }), ...K.person(x + 12, y + 30, { h: 34, kind: 'child', hair: 'long' })];
    case 'ball': return [...K.dog(x, y + 28, .4), ...K.ball(x - 22, y + 4)];
    case 'dance': return K.shoes(x, y + 6, s * 1.4);
    case 'books': return K.books(x, y + 22, s * 1.3);
    case 'sea': return [...K.sun(x, y + 4, 12), { p: [[x - 34, y + 10], [x + 34, y + 10]], w: 1 }];
    case 'city': return K.skyline(y + 30, x - 34, x + 34).map(q => ({ ...q, p: q.p.map(([px, py]) => [px, y + 30 - (y + 30 - py) * .2]) }));
    case 'umbrella': return K.umbrella(x, y, .36);
    case 'hat': return K.hat(x, y + 8, .6);
    case 'cups': return [...K.cup(x - 14, y + 30), ...K.cup(x + 16, y + 30)];
    case 'swing': return [...K.person(x - 12, y + 30, { h: 50, hair: 'long' }), ...K.person(x + 12, y + 30, { h: 50, hair: 'short' })];
    case 'dog': return K.dog(x, y + 30, .45);
    default: return K.sun(x, y + 10, 14);
  }
}

export async function play(panes) {
  ({ L, R, B } = panes);
  const only = new URLSearchParams(location.search).get('ep');
  const eps = { birth, childhood, graduation, youth, meeting, swing, home, busy, mother, years, oldAge };
  for (const [name, ep] of Object.entries(eps)) {
    if (only && name !== only) continue;
    await ep();
    await sleep(300);
  }
  await epilogue();
}
