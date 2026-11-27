// Two lives. Before they meet, each half runs on its own clock; most moments can be
// chosen, and letting a moment pass (about 8 seconds) is a choice too.
import { sleep, T, el, rand, mark } from './engine.js';
import * as K from './shapes.js';
import * as A from './audio.js';
import { Figure, POSES } from './rig.js';
import { swingScene } from './scene_swing.js';

let L, R, B;
const stage = document.getElementById('stage');
const bothEl = document.getElementById('both');
const CH = 8000;                                   // how long a moment waits for you
// what the player decided. nothing here is ever saved.
export const S = window.__S = { A: {}, B: {}, dream: null, place: null, met: null, late: false, awayA: false, awayB: false, coldA: false, coldB: false, accident: false, woke: null, photos: [] };
const all = (...p) => Promise.all(p);
const seam = v => stage.style.setProperty('--seam', v);
const gap = n => { stage.style.setProperty('--gap', n * 18 + 'px'); stage.style.setProperty('--twin', n ? 'block' : 'none'); };
const distance = () => (S.awayA ? 1 : 0) + (S.awayB ? 1 : 0);
const WIDE = [0, 0, 800, 900];
const cam = (p, v = WIDE, ms = 0) => p.camera(...v, ms);
// timings vary a little every time, so the two halves never fall into step
const j = ms => ms * (.78 + Math.random() * .5);
const nap = ms => sleep(j(ms));
async function merge() { await all(L.clear(500), R.clear(500)); gap(0); seam(0); bothEl.classList.add('on'); cam(B); await sleep(500); }
async function split(n = distance()) { await B.clear(600); bothEl.classList.remove('on'); seam(1); gap(n); cam(L); cam(R); await sleep(300); }
const fig = (p, o) => { const F = new Figure(p, { ...o, hidden: true }); F.show(o.fade ?? 600); return F; };
const prints = (p, snow = true) => { const g = p.g(); return (A2, F) => { A.footstep(snow); p.ink(K.footprint(A2[0] + F.p.f * F.h * .03, A2[1] + F.h * .03, F.h / 320, 0), { parent: g, dur: 200, w: 1.1 }); }; };
const linkHands = (a, b, drop = .33) => () => {
  const sa = a.shoulder(), sb = b.shoulder();
  const pt = [(sa[0] + sb[0]) / 2, Math.max(sa[1], sb[1]) + a.h * drop * .62];
  a.p.handN = pt; b.p.handN = pt;
};
// a prop that stays with a figure: strokes are drawn around (0,0), placed at at(F) every frame
function carry(p, F, strokes, at = F2 => F2.hand('N')) {
  const g = p.g(); p.ink(strokes, { parent: g, dur: 400 });
  g.held = true;
  const tick = () => { if (!g.isConnected || !g.held) return; const [x, y] = at(F); g.setAttribute('transform', `translate(${x},${y})`); requestAnimationFrame(tick); };
  tick(); return g;
}
const headTop = F => { const J = F.joints(); return [J.H[0], J.H[1] - J.L.headRy * .95]; };
const umbrellaGrip = s => K.umbrella(0, -105 * s, s);
// a figure breathes and shifts while it waits for the other life to catch up
async function idle(F, a, b, until) { while (!until()) { await F.to(a, j(1700)); if (until()) break; await F.to(b, j(1700)); } }

// ================== before they meet: two clocks ==================
async function offerFinger(p, left) {
  const hand = await p.ink(K.hand(left ? 380 : 420, 560, 1.1, !left), { dur: 500 });
  await p.ink(K.baby(left ? 470 : 330, 470, 2.2), { dur: 500 });
  const r = await p.tap(left ? 350 : 450, 556, 40, { label: 'the finger', target: hand, timeout: CH });
  if (r !== 'timeout') { await p.ink(K.tinyHand(left ? 350 : 450, 556, 1.1, !left), { dur: 700, pen: true }); A.heartbeat(.2); await nap(1200); return true; }
  // nobody offered it. the hand goes; the baby sleeps.
  await p.fade(hand, 0, 700); await p.dark(true, 800); await nap(900); await p.dark(false, 800); return false;
}

async function lifeA(sync) {
  const p = L;
  // born: a lit window in the snow
  p.weatherOn('snow', 60, [-100, 900]); cam(p, [100, 380, 600, 480]);
  await p.ink([...K.ground(700), ...K.house(400, 700)], { dur: 600 });
  await nap(700); await p.ink(K.windowGlow(400, 700), { dur: 300 }); A.note(83, .07, 4);
  await nap(1100);
  await p.clear(400); cam(p);
  S.A.held = await offerFinger(p, true);
  await p.clear(400);

  // a walk in the snow with her mother
  p.weatherOn('snow', 70, [-100, 900]);
  await p.ink(K.ground(760, -100, 900, 6, 4), { dur: 400 });
  const snowman = p.g(); await p.ink([...K.sun(640, 726, 22), ...K.sun(640, 688, 15), { p: [[626, 690], [608, 676]], w: 1.4 }], { parent: snowman, dur: 400, opacity: .85 });
  const m = fig(p, { x: 90, y: 760, h: 300, hair: 'bun', clothes: 'coat', p: { holdN: [.13, .22] } });
  const k = fig(p, { x: 190, y: 760, h: 165, kind: 'child', hair: 'long', clothes: 'dress', p: { neck: 8 } });
  await nap(500);
  const c = await p.choose([[150, 640, 60, "her mother's hand"], [640, 706, 56, 'the snowman', snowman]], { timeout: CH });
  const fp = prints(p);
  if (c === 0) {
    const link = linkHands(m, k, .5); link(); m.p.holdN = null;
    await all(m.walk(380, j(5000), { onStep: link, onPlant: fp }), (async () => { await sleep(150); await k.walk(380, j(5000), { short: true, onStep: link, onPlant: fp, phase: 1.6 }); })());
    S.A.child = 'hand'; S.photos.push('hands');
  } else if (c === 1) {
    m.p.holdN = null;
    await all(k.walk(400, 1700, { onPlant: fp }), (async () => { await nap(600); await m.walk(250, j(3800), { onPlant: fp }); })());
    await k.to({ sN: -70, eN: 20, spine: 10 }, 500); await k.to({ sN: -50, eN: 30 }, 400);
    S.A.child = 'snow'; S.photos.push('snowman');
  } else {
    // the moment passed: her mother walks on, then turns and waits
    m.p.holdN = null;
    await m.walk(280, j(3400), { onPlant: fp });
    await m.to({ f: -1, neck: 10, holdN: [.12, .2] }, 900);
    await k.to({ neck: 22, spine: 6 }, 900); await nap(900);
    S.A.child = 'behind';
  }
  await nap(600); await p.clear(400);

  // primary school graduation, while somewhere else a boy is asleep
  cam(p, [60, 380, 680, 460]);
  await p.ink(K.ground(762, -100, 900, 6, 3), { dur: 400 });
  const hairs = ['short', 'long', 'bun', 'short', 'long'], kids = [], caps = [];
  for (let i = 0; i < 5; i++) {
    const x = 170 + i * 115, h = 160 + (i * 37) % 22;
    const F = fig(p, { x, y: 760, h, kind: 'child', hair: i === 1 ? 'long' : hairs[i], clothes: i % 2 ? 'dress' : 'coat', fade: 400, p: { neck: 4 + i, spine: (i % 3) - 1 } });
    kids.push(F);
    const top = F.joints().H;
    const cg = p.g(); await p.ink(K.cap(top[0], top[1] - F.joints().L.headRy * .9, .6), { parent: cg, dur: 200 }); caps.push(cg);
    if (i === 3) { F.g.style.opacity = .35; cg.style.opacity = .35; }
  }
  await nap(500);
  const g = await p.choose([[kids[1].p.x, 580, 50, 'throw your cap', caps[1]], [kids[3].p.x, 670, 56, 'the quiet one', kids[3].g]], { timeout: CH });
  const throwers = kids.map((F, i) => i).filter(i => g === 0 || i !== 1);
  throwers.forEach((i, n) => setTimeout(() => kids[i].to({ sN: -165, eN: 5 }, 300), T(n * 70)));
  throwers.forEach(i => { const cg = caps[i]; cg.style.transformBox = 'fill-box'; cg.style.transformOrigin = 'center'; p.move(cg, (rand() - .5) * 140, -430 - rand() * 160, 2400, 'cubic-bezier(.15,.7,.3,1)', (rand() - .5) * 260); });
  await nap(1300);
  throwers.forEach(i => { kids[i].to({ sN: 4, eN: 8 }, 800); p.fade(caps[i], 0, 1000); });
  if (g === 1) {
    // she turns to the quiet one, and he stays a little longer
    await kids[1].to({ neck: 14, head: 8 }, 700);
    kids[3].g.animate([{ opacity: .35 }, { opacity: .7 }], { duration: T(1200), fill: 'forwards' });
    S.A.friend = true; S.photos.push('friend');
    await nap(1900);
    await kids[3].g.animate([{ opacity: .7 }, { opacity: 0 }], { duration: T(2600), fill: 'forwards' }).finished;
  } else {
    if (g === -1) await kids[1].to({ neck: 22, spine: 6 }, 900);     // she keeps her cap on
    await nap(600);
    await kids[3].g.animate([{ opacity: .35 }, { opacity: 0 }], { duration: T(2000), fill: 'forwards' }).finished;
  }
  await nap(500); await p.clear(400); cam(p);

  // what she reaches for
  await p.ink([...K.frame(400, 330, 240, 280), ...K.desk(620, 640)], { dur: 500, opacity: .9 });
  const shoes = p.g(); await p.ink(K.shoes(160, 400, .8), { parent: shoes, dur: 400 });
  const books = p.g(); await p.ink(K.books(620, 640, .65), { parent: books, dur: 300 });
  const a = fig(p, { x: 400, y: 790, h: 280, kind: 'teen', hair: 'long', clothes: 'dress', p: { head: -6 } });
  a.to({ head: 10, neck: 8 }, 1200);
  const i = await p.choose([[160, 380, 60, 'ballet shoes', shoes], [620, 610, 60, 'books', books]], { timeout: CH });
  S.dream = ['dance', 'books'][i] || 'window';
  if (i >= 0) {
    const dir = i === 0 ? -1 : 1; a.set({ f: dir });
    await a.walk(dir * 150, 1500);
    await a.to({ handN: i === 0 ? [176, 410] : [600, 610], spine: 6 }, 700);
    await p.fade(i === 0 ? books : shoes, .08, 1000, false);
    await nap(700); await p.clear(500);
  }
  S.photos.push(S.dream);
  const ready = () => sync.a && sync.b;
  sync.a = true;
  if (S.dream === 'dance') {
    cam(p, [140, 330, 520, 520]);
    await p.ink([...K.frame(400, 420, 260, 320), ...K.ground(770, -100, 900, 4, 2)], { dur: 400, opacity: .7 });
    const d = fig(p, { x: 400, y: 770, h: 290, hair: 'bun', clothes: 'dress', p: { sN: -40, eN: 20, sF: -130, eF: 10 } });
    await d.to({ spine: 24, hF: -70, kF: 2, sN: -100, eN: 10, sF: 60, eF: 6, neck: -6 }, 1800); A.note(71, .07, 5);
    await idle(d, { spine: 18, sN: -150, eN: 20, sF: -140, eF: 20, hF: -20, kF: 10, neck: -10 }, { spine: 24, hF: -70, kF: 2, sN: -100, eN: 10, sF: 60, eF: 6, neck: -6 }, ready);
  } else if (S.dream === 'books') {
    cam(p, [200, 380, 480, 480]);
    await p.ink([...K.desk(430, 650), ...K.books(560, 650, .6), { p: [[400, 646], [428, 634], [458, 646]], w: 1.4 }], { dur: 400 });
    const r = fig(p, { x: 330, y: 790, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 680, spine: 14, neck: 20, handN: [420, 640], handF: [400, 642] } });
    await idle(r, { handN: [450, 636] }, { handN: [420, 640] }, ready);
  } else {
    // nothing chosen: she stays at the window and watches it snow
    await a.to({ neck: -8, head: -6, spine: -2 }, 1200);
    p.weatherOn('snow', 40, [280, 520]);
    await idle(a, { neck: -12 }, { neck: -6, spine: 0 }, ready);
  }
}

async function lifeB(sync) {
  const p = R;
  // born: the sun coming up over water
  A.sea(true); cam(p, [100, 380, 600, 480]);
  await p.ink([...K.sea(640, -100, 900), ...K.sun(400, 610, 40)], { dur: 600 });
  p.washTo('gold', .35, 2500); await nap(500); await p.ink(K.birds(520, 470), { dur: 600, pen: true });
  await nap(900);
  await p.clear(400); A.sea(false); cam(p);
  S.B.held = await offerFinger(p, false);
  await p.clear(400);

  // a dog, a ball
  await p.ink([...K.ground(760, -100, 900, 6, 3), ...K.sun(650, 180, 30)], { dur: 400 });
  const c = fig(p, { x: 290, y: 760, h: 165, kind: 'child', hair: 'short', clothes: 'coat', p: { sN: 40, eN: 40 } });
  const dog = p.g(); await p.ink(K.dog(470, 760, 1.1, false), { parent: dog, dur: 400 });
  const ball = p.g(); await p.ink(K.ball(326, 662), { parent: ball, dur: 300 });
  const i = await p.choose([[326, 662, 50, 'the ball', ball], [480, 700, 60, 'the dog', dog]], { timeout: CH });
  if (i === 0) {
    await c.to({ sN: -150, eN: 10, spine: -4 }, 240);
    p.move(ball, 170, -230, 700, 'cubic-bezier(.2,.7,.4,1)').then(() => p.move(ball, 330, 98, 800, 'ease-in'));
    c.to({ sN: -20, eN: 15, spine: 2 }, 800);
    await sleep(300); await p.move(dog, 190, 0, 1300, 'ease-in-out');
    p.move(ball, 150, 82, 1300, 'ease-in-out'); await p.move(dog, 10, 0, 1300, 'ease-in-out');
    S.B.dog = 'ball'; S.photos.push('ball');
  } else if (i === 1) {
    await c.walk(120, 1200);
    await c.to({ spine: 34, neck: 20, sN: 50, eN: 30, kN: 30, hN: 30 }, 800);
    await p.fade(dog, 0, 400); await p.ink(K.dogLying(470, 760, 1.1), { dur: 300 });
    S.B.dog = 'hug'; S.photos.push('dog');
    await nap(900);
  } else {
    // he waited too long: the dog takes the ball and runs, and he runs after it
    await p.move(dog, -130, 0, 700, 'ease-in');
    await all(p.move(dog, 330, 0, 2200, 'ease-in'), p.move(ball, 330, 0, 2200, 'ease-in'), (async () => { await sleep(400); c.set({ sN: 4, eN: 8 }); await c.walk(360, 2400); })());
    S.B.dog = 'chase';
  }
  await nap(400); await p.clear(400);

  // asleep. his half goes dark for a while.
  cam(p, [100, 400, 600, 460]);
  await p.ink([...K.bed(400, 660, 300), ...K.sleeper(400, 660, 300, 'none')], { dur: 400 });
  await nap(700); await p.dark(true, 900); A.heartbeat(.12); await nap(2600); await p.dark(false, 1100);
  await nap(400); await p.clear(400); cam(p);

  // stay, or go
  A.sea(true);
  await p.ink([...K.frame(330, 330, 260, 240), ...K.door(660, 790)], { dur: 500, opacity: .9 });
  await p.ink(K.sea(380, 210, 450), { dur: 300, opacity: .5 });
  const dog2 = p.g(); await p.ink(K.dogLying(210, 790, 1), { parent: dog2, dur: 400 });
  const bag = p.g(); await p.ink(K.suitcase(570, 790, .9), { parent: bag, dur: 300 });
  const b = fig(p, { x: 380, y: 790, h: 285, kind: 'teen', hair: 'short', clothes: 'coat', f: -1, p: { neck: 6 } });
  b.to({ head: -8 }, 1000);
  const k = await p.choose([[220, 770, 58, 'stay with the dog', dog2], [570, 760, 54, 'take the bag', bag]], { timeout: CH });
  S.place = ['sea', 'city'][k] || 'between';
  const ready = () => sync.a && sync.b;
  if (k === 0) {
    await b.walk(-100, 1300);
    await b.to({ ...POSES.sit, py: 760, spine: 18, neck: 16, handN: [240, 772] }, 1200);
    await p.fade(bag, .08, 1000, false);
    sync.b = true;
    await idle(b, { handN: [252, 768], neck: 18 }, { handN: [236, 772], neck: 14 }, ready);
  } else if (k === 1) {
    b.set({ f: 1 }); await b.walk(140, 1500);
    await b.to({ handN: [570, 718], spine: 10 }, 600);
    await p.fade(dog2, .1, 900, false);
    await p.clear(500); A.sea(false);
    p.weatherOn('rain', 60, [-100, 900]);
    await p.ink(K.skyline(760, -100, 900), { dur: 500, opacity: .6 });
    const c2 = fig(p, { x: 330, y: 790, h: 280, hair: 'short', clothes: 'coat', p: { holdN: [.06, .3] } });
    carry(p, c2, K.suitcase(0, 60, .85));
    for (const [x, y] of [[120, 520], [260, 470], [620, 540]]) { await nap(500); await p.ink([{ p: [[x, y], [x + 20, y], [x + 20, y + 26], [x, y + 26]], c: true, fill: '#f0b860', fo: .55, w: 1 }], { dur: 250, flat: true }); }
    sync.b = true;
    await idle(c2, { neck: -6 }, { neck: 6 }, ready);
  } else {
    // he doesn't choose: he sits on the doorstep, the bag and the dog both waiting
    b.set({ f: 1 }); await b.walk(160, 1600);
    await b.to({ ...POSES.sit, py: 780, f: -1, spine: 20, neck: 22 }, 1000);
    sync.b = true;
    await idle(b, { neck: 26 }, { neck: 16, head: -10 }, ready);
  }
  A.sea(false);
}

async function early() {
  A.music(1);
  const sync = { a: false, b: false };
  await all(lifeA(sync), (async () => { await sleep(j(1600)); await lifeB(sync); })());
}

// ================== meeting (or not) ==================
async function meeting() {
  const place = S.place;
  const bg = async (p, w) => {
    if (place === 'city') { p.weatherOn('rain', w ? 90 : 60); await p.ink([...K.skyline(740, w ? -600 : -100, w ? 1400 : 900), ...K.lamp(w ? 700 : 160, 760)], { dur: 400, opacity: .5 }); }
    else if (place === 'sea') { A.sea(true); await p.ink([...K.sea(600, w ? -600 : -100, w ? 1400 : 900), ...K.sun(w ? 640 : 520, 470, 28)], { dur: 400 }); p.washTo('gold', .35, 2500); }
    else { await p.ink([...K.lamp(w ? 700 : 160, 760), ...K.tree(w ? 90 : 640, 760, .9)], { dur: 400, opacity: .7 }); p.washTo('gold', .25, 2500); }
    await p.ink(K.ground(760, w ? -600 : -100, w ? 1400 : 900, w ? 6 : 4, 2), { dur: 300 });
  };
  await all(L.clear(400), R.clear(400));
  // two people walking toward the line, on their own time
  await all(
    (async () => { await bg(L); const a = fig(L, { x: 120, y: 760, h: 290, hair: 'long', clothes: 'dress' }); await a.walk(560, j(2900), { onPlant: () => A.footstep(false) }); })(),
    (async () => {
      await nap(700); await bg(R);
      const b = fig(R, { x: 700, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: place === 'city' ? { holdN: [.07, .01] } : {} });
      if (place === 'city') carry(R, b, umbrellaGrip(.75)); else carry(R, b, K.hat(0, 2, .6), headTop);
      await b.walk(-560, j(2600));
    })(),
  );
  await merge();
  A.music(2.4);
  await bg(B, true);
  const a = fig(B, { x: 130, y: 760, h: 290, hair: 'long', clothes: 'dress' });
  const b = fig(B, { x: 680, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: place === 'city' ? { holdN: [.07, .01] } : {} });
  const item = place === 'city' ? carry(B, b, umbrellaGrip(.75)) : carry(B, b, K.hat(0, 2, .6), headTop);
  await all(a.walk(220, 2400), b.walk(-210, 2300));
  // the wind takes it
  item.held = false; b.p.holdN = null; b.to({ sN: 4, eN: 8, spine: 2 }, 600);
  const [ix, iy] = place === 'city' ? b.hand('N') : headTop(b);
  await new Promise(res => {
    const t0 = performance.now(), D2 = T(1150);
    const pts = [[ix, iy, 0], [ix - 50, iy - 60, -40], [405, 735, -100]];
    const st = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / D2)), e = k * k, u = 1 - e;   // a quadratic arc that falls
      const q = i => u * u * pts[0][i] + 2 * u * e * pts[1][i] + e * e * pts[2][i];
      item.setAttribute('transform', `translate(${q(0)},${q(1)}) rotate(${q(2)})`);
      k < 1 ? requestAnimationFrame(st) : res();
    };
    requestAnimationFrame(st);
  });
  A.footstep(false);
  const road = B.g(); await B.ink([{ p: [[720, 760], [760, 758], [800, 760]], w: 1.3, o: .6 }], { parent: road, dur: 200 });
  cam(B, [140, 330, 520, 520], 1500);
  const c = await B.choose([[405, 735, 58, 'pick it up', item], [700, 700, 60, 'walk on', road]], { timeout: CH });
  if (c === 0) {
    await a.walk(20, 500);
    await a.to({ ...POSES.crouch, handN: [402, 740] }, 700);
    await a.to({ ...POSES.stand, handN: [410, 600] }, 700);
    item.held = true; const follow = () => { if (!item.isConnected || !item.held) return; const [x, y] = a.hand('N'); item.setAttribute('transform', `translate(${x},${y})`); requestAnimationFrame(follow); }; follow();
    await b.to({ handN: [420, 598], spine: 4 }, 700);
    A.chord(.08); B.washTo('gold', .5, 2500);
    await cam(B, [220, 380, 360, 340], 1700);
    S.met = true;
  } else if (c === 1) {
    // they pass each other
    await all(a.walk(420, 3000), (async () => { await b.walk(-30, 500); await b.to({ ...POSES.crouch, handN: [405, 740] }, 700); item.style.opacity = 0; b.p.handN = null; await b.to({ ...POSES.stand }, 500); await b.walk(-330, 2600); })());
    S.met = false;
  } else {
    // he picks it up himself. they look at each other, walk on, and he turns back.
    await b.walk(-30, 500); await b.to({ ...POSES.crouch, handN: [405, 740] }, 700);
    item.style.opacity = 0; b.p.handN = null; await b.to({ ...POSES.stand }, 600);
    await all(a.to({ head: -6, neck: 2 }, 600), b.to({ head: -6 }, 600));
    await all(a.walk(160, 1800), b.walk(-140, 1700));
    await nap(400);
    b.set({ f: 1 }); await b.walk(130, 1600);
    await a.to({ f: -1 }, 300); A.chord(.07); B.washTo('gold', .45, 2000);
    await nap(900);
    S.met = true;
  }
  if (S.met) S.photos.push(place === 'city' ? 'umbrella' : 'hat');
  await nap(300);
  A.sea(false);
  await B.clear(600);
}

// ================== together ==================
async function swing() {
  cam(B);
  S.swing = await swingScene(B);
  await B.clear(600); B.washTo('transparent', 0, 10); cam(B, [150, 160, 500, 400]);
  await B.ink([...K.clothesline(250, -600, 1400), ...K.polaroid(400, 262, 1, 4)], { dur: 400 });
  await nap(250); await flash(B);
  const apart = S.swing === 'him' ? 8 : 0;
  await B.ink([...K.person(384 - apart, 352, { h: 66, hair: 'long' }), ...K.person(418 + apart, 352, { h: 66, hair: 'short' })], { dur: 1000, w: 1.1, opacity: .85, pen: true });
  S.photos.push('swing');
  await nap(600);
  await B.clear(600);
}
async function flash(p) { const r = el('rect', { x: -1600, y: -1200, width: 4000, height: 3300, fill: '#fffdf6', opacity: 0, 'pointer-events': 'none' }, p.ui); A.shutter(); await r.animate([{ opacity: 0 }, { opacity: .95, offset: .15 }, { opacity: 0 }], { duration: T(800) }).finished; r.remove(); }

// two cups on a table: shown here, then varied for the rest of the life
async function cupsScene(p, { a = true, b = true, x = 400, steam = true, oneUntouched = false } = {}) {
  await p.ink(K.table(x, 620, 380), { dur: 400 });
  const out = {};
  if (a) out.a = fig(p, { x: x - 150, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 690, spine: 8, neck: 10 } });
  if (b) out.b = fig(p, { x: x + 150, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 690, spine: 8, neck: 10 } });
  await sleep(400);
  const put = async (F, cx) => { if (!F) return; await F.to({ handN: [cx, 606], spine: 16 }, 700); await p.ink(K.cup(cx, 620), { dur: 250 }); F.p.handN = null; await F.to({ sN: 20, eN: 70, spine: 8 }, 700); };
  await all(put(out.a, x - 50), (async () => { await nap(300); await put(out.b, x + 50); })());
  if (oneUntouched && !out.a) await p.ink(K.cup(x - 50, 620), { dur: 250, opacity: .9 });
  if (steam) await p.ink([...K.steam(x - 50, 620), ...K.steam(x + 50, 620)], { dur: 1000, pen: true, opacity: .8 });
  return out;
}

async function home() {
  A.music(2);
  cam(B, [130, 330, 540, 470]);
  const win = B.g(); await B.ink(K.frame(400, 280, 200, 170), { parent: win, dur: 300, opacity: .8 });
  const dog = B.g(); await B.ink(K.dogLying(650, 795, 1), { parent: dog, dur: 300 });
  const out = await cupsScene(B);
  const i = await B.choose([[400, 280, 72, 'the window', win], [650, 775, 56, 'the dog', dog]], { timeout: CH });
  if (i === 0) { B.weatherOn('snow', 26, [310, 490]); B.washTo('gold', .25, 1500); await all(out.a.to({ head: -12, neck: -2 }, 900), out.b.to({ head: -12, neck: -2 }, 900)); S.home = 'window'; }
  else if (i === 1) { await B.move(dog, -240, 0, 1500, 'ease-in-out'); await all(out.a.to({ neck: 24 }, 700), out.b.to({ neck: 24 }, 700)); S.home = 'dog'; }
  else { await all(out.a.to({ neck: 18, spine: 4 }, 900), out.b.to({ neck: 2, head: -6 }, 900)); S.home = 'quiet'; }   // they sit, not quite talking
  await nap(500);
  await B.dark(true, 900); await nap(300); await B.dark(false, 900);
  // the clock starts to hurry
  await B.ink(K.clock(620, 250, 30), { dur: 250 });
  const hand = B.g(); await B.ink([{ p: [[620, 250], [620, 228]], w: 1.8 }], { parent: hand, dur: 150 });
  hand.style.transformBox = 'view-box'; hand.style.transformOrigin = '620px 250px';
  const iv = setInterval(() => A.tick(), T(200));
  await hand.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(1440deg)' }], { duration: T(2200), easing: 'ease-in', fill: 'forwards' }).finished;
  clearInterval(iv);
  S.photos.push('cups');
  await split(0);
}

async function busy() {
  A.music(1);
  const side = async (p, left) => {
    const x = left ? 300 : 500, cupX = left ? 380 : 420, doorX = left ? 640 : 160;
    cam(p, [60, 330, 680, 520]);
    await p.ink([...K.table(left ? 360 : 440, 640, 260), ...K.clock(left ? 320 : 480, 260, 26)], { dur: 400 });
    const F = fig(p, { x, y: 900, h: left ? 290 : 300, hair: left ? 'long' : 'short', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 710, spine: 8, neck: 12 } });
    const cup = p.g(); await p.ink(K.cup(cupX, 640), { parent: cup, dur: 250 });
    const door = p.g(); await p.ink([...K.doorLight(doorX, 800), ...K.door(doorX, 800)], { parent: door, dur: 400 });
    F.to({ neck: 2, spine: 2 }, 1000);
    const i = await p.choose([[doorX, 680, 70, 'the lit door', door], [cupX, 620, 44, 'stay at the table', cup]], { timeout: CH });
    if (i === 0) {
      await F.to({ ...POSES.stand, py: null, y: 800 }, 700); F.p.py = null;
      await F.walk(doorX - x, 2000);
      await F.hide(500);
      A.tick(); await p.clear(400); A.office(true); cam(p, [100, 350, 600, 520]);
      await p.ink([...K.desk(400, 650), ...K.papers(300, 646, 3), ...K.papers(500, 646, 5)], { dur: 400 });
      fig(p, { x: 400 + (left ? -60 : 60), y: 900, h: 290, hair: left ? 'long' : 'short', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 720, spine: 22, neck: 26, handN: [left ? 420 : 380, 644] } });
      await nap(900);
      return 'away';
    }
    if (i === 1) { await F.to({ handN: [cupX - 8, 626], handF: [cupX + 8, 626], spine: 14 }, 900); await p.ink(K.steam(cupX, 640), { dur: 1000, pen: true, opacity: .8 }); await nap(900); return 'home'; }
    // half up, half staying: the cup goes cold while they look at the door
    await F.to({ neck: -4, head: -10, spine: 0 }, 900);
    await p.fade(cup, .45, 1500, false);
    await nap(500);
    return 'cold';
  };
  const [a, b] = await all(side(L, true), (async () => { await sleep(j(1500)); return side(R, false); })());
  S.awayA = a === 'away'; S.awayB = b === 'away'; S.coldA = a === 'cold'; S.coldB = b === 'cold';
  gap(distance() + (S.coldA || S.coldB ? .4 : 0));
  await nap(700);
  if (!S.awayA && !S.awayB && !S.coldA && !S.coldB) { await merge(); cam(B, [130, 330, 540, 470]); await cupsScene(B); B.washTo('gold', .35, 2000); await nap(1400); await split(0); }
  else await all(L.clear(500), R.clear(500));
}

// A's mother. B can come with her, or not.
async function mother() {
  A.music(.5);
  let held = null;
  const bedside = async () => {
    L.weatherOn('snow', 30, [280, 520]); cam(L, [80, 360, 640, 520]);
    await L.ink([...K.frame(400, 300, 260, 220), ...K.bed(470, 660, 360), ...K.sleeper(470, 660, 360)], { dur: 500 });
    const a = fig(L, { x: 190, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 14, neck: 16 } });
    const herHand = L.g(); await L.ink(K.armOnBed(330, 640, 50), { parent: herHand, dur: 300 });
    const r = await L.tap(370, 646, 50, { label: 'her hand', target: herHand, timeout: CH });
    if (r !== 'timeout') {
      await a.to({ handN: [350, 632], spine: 24 }, 700); await sleep(500); await a.to({ handN: [366, 642] }, 300);
      A.heartbeat(.18); await nap(1600); held = true;
    } else {
      // she couldn't. the hand slips back under the blanket.
      await L.fade(herHand, 0, 1400); await a.to({ neck: 28, spine: 20 }, 1000); await nap(900); held = false;
    }
  };
  const snowMemory = async () => {
    await L.clear(400); cam(L);
    L.weatherOn('snow', 90, [-100, 900]);
    await L.ink(K.ground(760, -100, 900, 6, 4), { dur: 300 });
    const m = fig(L, { x: 80, y: 760, h: 270, kind: 'old', hair: 'grey', clothes: 'coat' });
    const a = fig(L, { x: 170, y: 760, h: 290, hair: 'long', clothes: 'dress' });
    const link = held ? linkHands(a, m, .5) : () => {};
    link(); a.render(); m.render();
    A.music(1);
    const fp = prints(L);
    await sleep(400);
    const dur = j(3800);
    await all(m.walk(220, dur, { short: true, onStep: link, onPlant: fp }), a.walk(220, dur, { short: true, onStep: link, onPlant: fp, phase: 1 }));
    m.hide(2400);
    await nap(500);
    a.p.handN = null; await a.to({ sN: 10, eN: 10 }, 1000);
    A.music(0); await nap(1800);                          // silence
    await a.walk(150, 2500, { short: true, onPlant: fp });
    await nap(500);
  };
  let present;
  const left = (async () => {
    if (!S.awayA) { await bedside(); present = true; await snowMemory(); return; }
    cam(L, [100, 350, 600, 520]);
    await L.ink([...K.desk(400, 650), ...K.papers(300, 646, 6), ...K.phone(510, 646)], { dur: 400 });
    fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } });
    await nap(800);
    A.ring(3); const bz = await L.ink(K.buzz(510, 646), { dur: 200 });
    const i = await L.choose([[510, 622, 44, 'answer'], [300, 620, 50, 'keep working']], { timeout: CH });
    await L.fade(bz, 0, 300); A.office(false);
    if (i === 0) { present = true; await L.clear(400); await bedside(); await snowMemory(); }
    else {
      present = false;
      await L.clear(600); cam(L, [80, 360, 640, 520]);
      L.weatherOn('snow', 30, [280, 520]);
      await L.ink([...K.frame(400, 300, 260, 220), ...K.bed(470, 660, 360)], { dur: 500 });
      fig(L, { x: 190, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 4, neck: 30 } });
      A.radio(true); await nap(3600); A.radio(false);
      A.music(0); await nap(2000);
    }
  })();
  let comes = false;
  const right = (async () => {
    await sleep(j(1200));
    if (!S.met) {
      // his own life, elsewhere
      cam(R, [100, 350, 600, 520]);
      if (S.place === 'city') { A.office(true); await R.ink([...K.desk(400, 650), ...K.papers(300, 646, 4)], { dur: 400 }); fig(R, { x: 460, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 720, spine: 24, neck: 28, handN: [380, 644] } }); }
      else { await R.ink([...K.sea(640, -100, 900), ...K.dogLying(520, 790, 1)], { dur: 400 }); fig(R, { x: 380, y: 790, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: 1, p: { py: 790, spine: 14, neck: 10 } }); }
      await nap(6000); A.office(false); return;
    }
    if (!S.awayB) {
      cam(R, [130, 330, 540, 470]);
      if (!S.awayA) {
        // will he go with her?
        await R.ink(K.frame(400, 300, 240, 220), { dur: 400, opacity: .7 });
        const b = fig(R, { x: 400, y: 790, h: 300, hair: 'short', clothes: 'coat', p: { neck: 14, spine: 4 } });
        const dog = R.g(); await R.ink(K.dogLying(580, 790, .9), { parent: dog, dur: 300 });
        const door = R.g(); await R.ink(K.door(180, 790), { parent: door, dur: 300 });
        const i = await R.choose([[180, 680, 60, 'go to her', door], [580, 770, 54, 'stay home', dog]], { timeout: CH });
        if (i === 0) { b.set({ f: -1 }); await b.walk(-200, 1800); await b.hide(400); comes = true; }
        else await b.to({ neck: 24, spine: 8 }, 900);
        await nap(1500);
      } else {
        // the waiting: two cups set out each evening, one goes cold
        await cupsScene(R, { a: false, steam: false, oneUntouched: true });
        for (let k = 0; k < 2; k++) { await nap(900); await R.dark(true, 1100); await nap(500); await R.dark(false, 1100); }
      }
    } else {
      A.office(true); cam(R, [100, 350, 600, 520]);
      await R.ink(K.desk(400, 650), { dur: 300 });
      fig(R, { x: 460, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 720, spine: 24, neck: 28, handN: [380, 644] } });
      for (let k = 0; k < 4; k++) { await R.ink(K.papers(260 + k * 90, 646, 3 + k), { dur: 300 }); await nap(1300); }
    }
  })();
  await all(left, right);
  S.mother = present;
  if (present && comes) {
    await merge();
    B.weatherOn('snow', 100); cam(B, [150, 330, 500, 500]);
    await B.ink(K.ground(760, -600, 1400, 6, 3), { dur: 300 });
    const a = fig(B, { x: 360, y: 760, h: 290, hair: 'long', clothes: 'dress', p: { neck: 26, spine: 6 } });
    const b = fig(B, { x: 450, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1, p: { neck: 10 } });
    await nap(800);
    const sh = a.shoulder();
    await b.to({ handN: [sh[0] + 4, sh[1] + 4], spine: 6 }, 1200);
    A.chord(.06);
    await nap(2400);
    await split(distance());
  } else await all(L.clear(500), R.clear(500));
}

async function years() { if (S.awayB) return accident(); if (S.awayA) return waiting(); return togetherYears(); }

async function accident() {
  S.accident = true; A.music(1); A.office(false);
  const r = (async () => {
    R.weatherOn('rain', 60, [-100, 900]);
    await R.ink([...K.skyline(720, -100, 900), ...K.ground(760, -100, 900, 4, 2)], { dur: 400, opacity: .5 });
    const b = fig(R, { x: 660, y: 760, h: 300, hair: 'short', clothes: 'coat', f: -1 });
    const hl = R.g(); await R.ink(K.headlights(80, 700), { parent: hl, dur: 300, opacity: .2 });
    b.walk(-320, 3000, { spine: 12 });
    hl.animate([{ opacity: .2 }, { opacity: 1 }], { duration: T(2600), fill: 'forwards' });
    A.crash(); await sleep(2500);
    await flash(R); R.weatherOff();
    await R.dark(true, 300);
    A.music(0); await sleep(2200);                       // nothing
    for (let k = 0; k < 2; k++) { A.beep(); await sleep(1200); }
    await R.clear(200);
  })();
  const l = (async () => {
    cam(L, [100, 350, 600, 520]);
    if (!S.awayA) await L.ink([...K.table(400, 650, 300), ...K.cup(380, 650), ...K.phone(470, 650)], { dur: 400 });
    else { await L.ink([...K.desk(400, 650), ...K.papers(300, 646, 6), ...K.phone(510, 646)], { dur: 400 }); fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } }); }
    await sleep(1600);
  })();
  await all(r, l);
  A.ring(3);
  const px = S.awayA ? 510 : 470;
  const bz = L.g(); await L.ink(K.buzz(px, 650), { parent: bz, dur: 200 });
  let go;
  if (!S.awayA) go = (await L.tap(px, 626, 46, { label: 'answer', target: bz, timeout: CH })) !== 'timeout';
  else { const i = await L.choose([[px, 622, 44, 'answer', bz], [300, 620, 50, 'keep working']], { timeout: CH }); go = i === 0; }
  await L.fade(bz, 0, 300); await L.clear(500);
  if (go) {
    cam(L);
    await L.ink(K.bed(800, 660, 300), { dur: 300 });
    fig(L, { x: 420, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 20, neck: 20, handN: [700, 640] } });
    await nap(700);
    const r2 = await R.tap(120, 600, 60, { white: true, label: 'hold on', timeout: CH });
    A.heartbeat(.4); A.beep();
    const beat = await R.ink(K.monitorLine(-40, 840, 450), { white: true, dur: 700, pen: true, opacity: .6 });
    await nap(r2 === 'timeout' ? 3600 : 1000);           // without you it takes longer
    await R.dark(false, 3000); R.fade(beat, 0, 500);
    await R.ink([...K.bed(160, 660, 300), ...K.sleeper(160, 660, 300, 'none'), ...K.armOnBed(80, 640, 70)], { dur: 600 });
    A.music(2); A.chord(.07);
    S.woke = 'together'; S.awayA = false; S.awayB = false;
    await nap(1200);
    await merge(); cam(B, [100, 360, 600, 520]);
    await B.ink([...K.bed(470, 660, 380), ...K.sleeper(470, 660, 380, 'none')], { dur: 400 });
    fig(B, { x: 200, y: 900, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 760, spine: 22, neck: 18, handN: [372, 640] } });
    B.washTo('gold', .4, 2500);
    await nap(2600);
    await split(0);
  } else {
    // the phone rang out. at home that means she was asleep.
    cam(L, [100, 350, 600, 520]);
    if (!S.awayA) { await L.ink(K.bed(400, 660, 320), { dur: 300 }); await L.ink(K.sleeper(400, 660, 320, 'long'), { dur: 300 }); await L.dark(true, 800); }
    else { await L.ink(K.desk(400, 650), { dur: 300 }); fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } }); for (let k = 0; k < 3; k++) { await L.ink(K.papers(280 + k * 110, 646, 4 + k * 2), { dur: 300 }); await nap(1100); } }
    await R.dark(false, 3600);
    cam(R, [100, 360, 600, 520]);
    await R.ink([...K.bed(400, 660, 340), ...K.sleeper(400, 660, 340, 'none'), ...K.dogLying(420, 800, 1), ...K.armOnBed(330, 660, 70)], { dur: 600 });
    A.music(1); A.note(71, .06);
    S.woke = 'alone'; gap(2);
    await nap(2200);
    if (L.isDark) await L.dark(false, 1200);
    await all(L.clear(500), R.clear(500));
  }
}
async function waiting() {
  A.music(1);
  const l = (async () => {
    A.office(true); cam(L, [100, 350, 600, 520]);
    await L.ink([...K.desk(400, 650), ...K.papers(280, 646, 5)], { dur: 400 });
    fig(L, { x: 340, y: 900, h: 290, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 720, spine: 22, neck: 26, handN: [420, 644] } });
    const ph = L.g(); await L.ink(K.polaroid(520, 570, .5, -8), { parent: ph, dur: 400 });
    const r = await L.tap(520, 600, 50, { label: 'the photo', timeout: CH, target: ph });
    A.office(false);
    return r !== 'timeout';
  })();
  const r = (async () => {
    await sleep(j(900)); cam(R, [130, 330, 540, 470]);
    await cupsScene(R, { a: false, steam: false, oneUntouched: true });
    for (let k = 0; k < 2; k++) { await nap(800); await R.dark(true, 1000); await nap(400); await R.dark(false, 1000); }
  })();
  const [back] = await all(l, r);
  if (back) {
    S.awayA = false; gap(0); A.chord(.07);
    await merge(); cam(B, [130, 330, 540, 470]);
    await cupsScene(B); B.washTo('gold', .35, 2000);
    await nap(1600); await split(0);
  } else { await nap(700); await all(L.clear(500), R.clear(500)); }
}
async function togetherYears() {
  await merge(); A.music(2); cam(B, [100, 150, 600, 420]);
  await B.ink([...K.clothesline(250, -600, 1400), ...K.polaroid(250, 262, 1, -5), ...K.person(236, 352, { h: 66, hair: 'long' }), ...K.person(266, 352, { h: 66, hair: 'short' })], { dur: 400 });
  // what goes on the line next
  const pa = B.g(), pb = B.g();
  await B.ink(K.dog(420, 790, .9), { parent: pa, dur: 400 });
  await B.ink(K.house(640, 800, .55, false), { parent: pb, dur: 400 });
  cam(B, [100, 150, 650, 700], 900);
  const i = await B.choose([[420, 740, 60, 'the dog', pa], [640, 720, 60, 'the house', pb]], { timeout: CH });
  await B.ink(K.polaroid(450, 272, 1, 3), { dur: 300 });
  if (i >= 0) { await flash(B); await B.ink(i === 0 ? K.dog(444, 362, .45) : K.house(450, 364, .3, false), { dur: 1200, w: 1.1, pen: true }); S.photos.push(i === 0 ? 'dog' : 'house'); }
  else await nap(800);                                   // a photo nobody took
  B.washTo('gold', .3, 2000); await nap(1300);
  await split(0);
}

// ================== if they missed each other ==================
async function apart() {
  await split(1); A.music(1.2);
  // years, separately, out of step
  const l = (async () => {
    cam(L, [140, 330, 520, 520]);
    if (S.dream === 'dance') { await L.ink(K.ground(770, -100, 900, 4, 2), { dur: 300 }); const d = fig(L, { x: 400, y: 770, h: 290, hair: 'bun', clothes: 'dress' }); await d.to({ spine: 20, hF: -60, kF: 4, sN: -110, sF: 60 }, 1800); await nap(1200); }
    else if (S.dream === 'books') { await L.ink([...K.desk(430, 650), ...K.books(560, 650, .6), ...K.books(300, 650, .5)], { dur: 400 }); fig(L, { x: 330, y: 790, h: 280, hair: 'long', clothes: 'dress', pose: 'sit', p: { py: 680, spine: 18, neck: 22, handN: [420, 640] } }); await nap(3000); }
    else { await L.ink(K.frame(400, 330, 240, 280), { dur: 300 }); L.weatherOn('snow', 40, [280, 520]); fig(L, { x: 400, y: 790, h: 280, hair: 'long', clothes: 'dress', p: { neck: -8 } }); await nap(3000); }
  })();
  const r = (async () => {
    await sleep(j(1400)); cam(R, [100, 350, 600, 520]);
    await R.ink([...K.table(400, 640, 260), ...K.cup(380, 640)], { dur: 400 });
    fig(R, { x: 500, y: 900, h: 300, hair: 'short', clothes: 'coat', pose: 'sit', f: -1, p: { py: 710, spine: 10, neck: 14 } });
    await nap(2600);
  })();
  await all(l, r);
  await all(L.clear(500), R.clear(500));
  await mother();
  // a second chance: the same street, years later, each from their own side
  A.music(1.6); gap(0);
  L.weatherOn('snow', 60, [-100, 900]); R.weatherOn('snow', 60, [-100, 900]);
  await all(L.ink(K.ground(760, -100, 900, 4, 3), { dur: 300 }), R.ink(K.ground(760, -100, 900, 4, 3), { dur: 300 }));
  const a = fig(L, { x: 120, y: 760, h: 285, hair: 'bun', clothes: 'dress' });
  const b = fig(R, { x: 690, y: 760, h: 295, hair: 'short', clothes: 'coat', f: -1 });
  await all(a.walk(560, j(4600), { short: true, onPlant: prints(L) }), (async () => { await nap(800); await b.walk(-560, j(4000), { short: true, onPlant: prints(R) }); })());
  // they are standing at the line between their halves. open it, or let it be.
  const r2 = await L.tap(780, 520, 60, { label: 'the line between', timeout: CH });
  if (r2 !== 'timeout') {
    S.met = true; S.late = true;
    A.chord(.09); await merge(); A.music(2.6);
    B.weatherOn('snow', 90); cam(B, [150, 330, 500, 500]);
    await B.ink(K.ground(760, -600, 1400, 6, 3), { dur: 300 });
    fig(B, { x: 350, y: 760, h: 285, hair: 'bun', clothes: 'dress', p: { holdN: [.2, .26] } });
    fig(B, { x: 450, y: 760, h: 295, hair: 'short', clothes: 'coat', f: -1, p: { holdN: [.2, .26] } });
    B.washTo('gold', .4, 2500); await nap(2600);
    await B.clear(500); cam(B, [130, 330, 540, 470]);
    await cupsScene(B); S.photos.push('cups');
    await nap(1400); await split(0);
  } else {
    await all(a.walk(-300, 3200, { short: true }), b.walk(300, 3200, { short: true }));
    await all(L.clear(500), R.clear(500));
  }
}

// ================== old age ==================
async function oldAge() {
  const together = S.met && !S.awayA && !S.awayB;
  if (together) {
    await merge(); A.music(2);
    B.weatherOn('snow', 120);
    await B.ink(K.ground(760, -600, 1400, 6, 3), { dur: 400 });
    const a = fig(B, { x: 60, y: 760, h: 275, kind: 'old', hair: 'bun', clothes: 'dress' });
    const b = fig(B, { x: 150, y: 760, h: 285, kind: 'old', hair: 'grey', clothes: 'coat' });
    const fp = prints(B);
    await all(a.walk(200, 3600, { short: true, onPlant: fp }), b.walk(200, 3600, { short: true, onPlant: fp, phase: 1.3 }));
    // where are we going? / ... don't know / we're looking for an answer.
    A.radio(true);
    for (const [F, d] of [[a, 1], [b, -1], [a, 1]]) { const sh = F.shoulder(); const p = await B.ink(K.breath(sh[0] + d * 30, sh[1] - 60, 1, d < 0), { dur: 500, pen: true }); B.fade(p, 0, 1800); await nap(650); }
    A.radio(false);
    cam(B, [160, 360, 420, 440], 1600);
    const sa = a.shoulder(), sb = b.shoulder(), mid = [(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2 + 90];
    const held = (await B.tap(mid[0], mid[1], 60, { label: 'their hands', timeout: CH })) !== 'timeout';
    const link = held ? linkHands(b, a, .5) : () => {};
    link();
    A.music(4);
    B.setWeatherKind('gold'); B.washTo('gold', held ? .95 : .7, 5000);
    await all(a.walk(140, 4300, { short: true, onStep: link, onPlant: fp }), b.walk(140, 4300, { short: true, onStep: link, onPlant: fp, phase: 1.3 }));
    await nap(600);
    const first = S.accident ? b : a, second = first === a ? b : a;
    first.p.handN = null; second.p.handN = null;
    await all(first.to({ sN: 4, eN: 8 }, 900), second.to({ sN: 4, eN: 8 }, 900));
    A.music(1.4);
    await first.hide(3000);
    A.music(0); await nap(1800);
    if (held) { await second.to({ handN: [first.p.x, first.shoulder()[1] + 70], spine: 6 }, 1100); await nap(600); second.p.handN = null; await second.to({ sN: 4, eN: 10 }, 1000); }
    else await second.to({ neck: 26, spine: 10 }, 1600);  // looks down at the two lines of footprints
    await nap(500);
    // later, at the table: two cups, out of habit
    await B.clear(700); cam(B, [130, 330, 540, 470]); B.washTo('gold', .5, 1500);
    await B.ink(K.table(400, 620, 380), { dur: 300 });
    const left = first === b;
    const one = fig(B, { x: left ? 250 : 550, y: 900, h: 280, kind: 'old', hair: left ? 'bun' : 'grey', clothes: left ? 'dress' : 'coat', pose: 'sit', f: left ? 1 : -1, p: { py: 690, spine: 14, neck: 12 } });
    await nap(500);
    const cx1 = left ? 350 : 450, cx2 = left ? 450 : 350;
    await one.to({ handN: [cx1, 606] }, 700); await B.ink(K.cup(cx1, 620), { dur: 250 });
    await one.to({ handN: [cx2, 606], spine: 22 }, 900); const c2 = B.g(); await B.ink(K.cup(cx2, 620), { parent: c2, dur: 250 });
    one.p.handN = null; await one.to({ sN: 10, eN: 60, spine: 12 }, 900);
    const keep = await B.tap(cx2, 600, 50, { label: 'the other cup', target: c2, timeout: CH });
    if (keep !== 'timeout') { await one.to({ handN: [cx2, 610] }, 700); await B.fade(c2, 0, 800); one.p.handN = null; await one.to({ sN: 10, eN: 60, spine: 10 }, 900); }
    else { await B.ink([...K.steam(cx1, 620), ...K.steam(cx2, 620)], { dur: 1000, pen: true, opacity: .7 }); A.note(76, .05, 5); }   // both cups stay
    await nap(900);
    await B.dark(true, 3000); await nap(500); B.weatherOff();
  } else {
    A.music(2);
    const solo = async (p, x, dx, o, delay) => {
      await sleep(delay);
      p.weatherOn('snow', 70, [-100, 900]);
      await p.ink(K.ground(760, -100, 900, 4, 3), { dur: 400 });
      const F = fig(p, { x, y: 760, ...o });
      await F.walk(dx, j(4600), { short: true, onPlant: prints(p) });
      return F;
    };
    const [a, b] = await all(solo(L, 120, 500, { h: 275, kind: 'old', hair: 'bun', clothes: 'dress' }, 0), solo(R, 680, -500, { h: 285, kind: 'old', hair: 'grey', clothes: 'coat', f: -1 }, j(1200)));
    // the line between them. touch it, once, if you want
    const r = await L.tap(772, 450, 60, { label: 'the line between', timeout: CH });
    if (r !== 'timeout') {
      A.music(4); gap(0); seam(.25);
      await all(L.ink([{ p: [[800, 300], [742, 300], [742, 600], [800, 600]], w: 1.8, l: 1 }], { dur: 900, pen: true }), R.ink([{ p: [[0, 300], [58, 300], [58, 600], [0, 600]], w: 1.8, l: 1 }], { dur: 900, pen: true }));
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .9, 3500), R.washTo('gold', .9, 3500), a.to({ sN: -150, eN: 20 }, 1500), b.to({ sN: -150, eN: 20 }, 1500));
      A.chord(.08); await nap(2400);
    } else {
      A.music(3);
      L.setWeatherKind('gold'); R.setWeatherKind('gold');
      await all(L.washTo('gold', .7, 4000), R.washTo('gold', .7, 4000), a.to({ neck: -14, spine: -4 }, 2400), b.to({ neck: -14, spine: -4 }, 2400));
      await nap(1600);
    }
    A.music(1);
    const firstR = S.accident || rand() < .5;
    await (firstR ? R : L).dark(true, 3500);
    A.music(0); await nap(2000);
    await (firstR ? L : R).dark(true, 3500);
    await nap(800); L.weatherOff(); R.weatherOff();
  }
}

// ---------- epilogue: the paths closed, the ones walked. no words. ----------
async function epilogue() {
  bothEl.classList.add('on'); seam(0); gap(0); cam(B);
  B.darkR.getAnimations().forEach(a => a.cancel());
  B.darkR.setAttribute('opacity', 1); B.isDark = true;
  B.root.replaceChildren(); B.over.replaceChildren(); B.washTo('transparent', 0, 10);
  A.music(2); A.darkness(0, .5);
  const together = S.met && !S.awayA && !S.awayB;
  const lifePath = (y0, y1, merge, at = .45) => {
    const pts = [[-500, y0]]; let y = y0;
    for (let x = -380; x <= 1300; x += 120) {
      const t = (x + 500) / 1800;
      const tgt = merge ? (t > at ? 600 + (y0 < 600 ? -12 : 12) : y0 + (600 - y0) * t / at) : y0 + (y1 - y0) * t;
      y = tgt + (rand() - .5) * 30; pts.push([x, y]);
    }
    return pts;
  };
  const branches = pts => { const out = []; for (let i = 1; i < pts.length - 1; i++) for (let k = 0; k < 2; k++) { const [x, y] = pts[i]; const b = [[x, y]]; let by = y, bx = x; const dir = rand() < .5 ? -1 : 1; for (let q = 0; q < 4; q++) { bx += 60 + rand() * 40; by += dir * (20 + rand() * 40); b.push([bx, by]); } out.push({ p: b, w: 1, o: .22 }); } return out; };
  const at = S.late ? .72 : .45;
  const pa = lifePath(470, together ? 590 : 400, together, at), pb = lifePath(740, together ? 610 : 820, together, at);
  await all(B.ink(branches(pa), { white: true, dur: 2600, stagger: .9, pen: true }), B.ink(branches(pb), { white: true, dur: 2600, stagger: .9, pen: true }));
  await all(B.ink([{ p: pa, w: 2.4 }], { white: true, dur: 2600, pen: true }), B.ink([{ p: pb, w: 2.4 }], { white: true, dur: 2600, pen: true }));
  const shots = S.photos.slice(-6);
  await B.ink(K.clothesline(150, -600, 1400), { white: true, dur: 900, pen: true });
  for (let i = 0; i < shots.length; i++) {
    const x = 400 + (i - (shots.length - 1) / 2) * 130, y = 162, rot = (rand() - .5) * 10;
    const g = B.g({}, B.over);
    await B.ink(K.polaroid(x, y, .58, rot), { parent: g, dur: 250 });
    B.ink(miniature(shots[i], x, y + 34), { parent: g, dur: 600, w: 1.1, pen: true });
    await sleep(250);
  }
  await nap(1800);
}
function miniature(k, x, y) {
  const s = .32;
  switch (k) {
    case 'window': return K.house(x, y + 28, .26, false);
    case 'hands': return [...K.person(x - 10, y + 30, { h: 64, kind: 'adult', hair: 'bun' }), ...K.person(x + 12, y + 30, { h: 34, kind: 'child', hair: 'long' })];
    case 'snowman': return [...K.sun(x, y + 18, 12), ...K.sun(x, y - 2, 8)];
    case 'friend': return [...K.person(x - 12, y + 30, { h: 40, kind: 'child', hair: 'long' }), ...K.person(x + 12, y + 30, { h: 40, kind: 'child', hair: 'short' })];
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
    case 'house': return K.house(x, y + 30, .26, false);
    default: return K.sun(x, y + 10, 14);
  }
}

export async function play(panes) {
  ({ L, R, B } = panes);
  const run = async (name, f) => { mark('ep', name); await f(); };
  // test hook: ?ep=meeting&place=city plays one episode with that state
  const Q = new URLSearchParams(location.search), only = Q.get('ep');
  if (only) {
    for (const k of ['place', 'dream']) if (Q.has(k)) S[k] = Q.get(k);
    for (const k of ['met', 'awayA', 'awayB']) if (Q.has(k)) S[k] = Q.get(k) === '1';
    await run(only, { early, meeting, swing, home, busy, mother, years, apart, oldAge, epilogue }[only]); return;
  }
  await run('early', early);
  await run('meeting', meeting);
  if (S.met) { await run('swing', swing); await run('home', home); await run('busy', busy); await run('mother', mother); await run('years', years); }
  else await run('apart', apart);
  await run('oldAge', oldAge);
  await run('epilogue', epilogue);
}
