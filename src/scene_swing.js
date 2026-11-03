// The swing. Two people, out of step. One reaches and misses, looks away. You help, once.
import { el, T, SPEED, AUTO } from './engine.js';
import { Figure } from './rig.js';
import { sample, outline } from './brush.js';
import * as A from './audio.js';

const D = Math.PI / 180;

export async function swingScene(P) {
  const PIV = -100, LEN = 650, SEAT = PIV + LEN;          // shorter ropes: the arc reads as an arc
  const XA = 205, XB = 595, H = 265;
  const PERIOD = 3000;
  const mk = (x, f, hair, clothes) => {
    const g = el('g', {}, P.root);
    g.style.transformBox = 'view-box'; g.style.transformOrigin = `${x}px ${PIV}px`;
    const rope = (dx, op) => el('path', { class: 'brush', opacity: op, d: outline(sample([[x + dx, PIV - 400], [x + dx + .6, PIV + LEN * .5], [x + dx, SEAT]], false, 12), 1.5, { a: .02, b: .05, min: .6, amp: .08 }) }, g);
    rope(-f * 4, .35); rope(f * 2, 1);
    el('path', { class: 'brush', d: outline(sample([[x - 34, SEAT + 2], [x, SEAT + 4], [x + 34, SEAT + 2]], false, 6), 3.2, { a: .1, b: .1, min: .5 }) }, g);
    const fig = new Figure(P, { parent: g, h: H, f, hair, clothes, x: x - f * H * .04, y: 900, pose: 'sit', p: { py: SEAT - H * .03, handN: [x + f * 2, SEAT - H * .33], handF: [x + f * 2, SEAT - H * .3] } });
    return { g, fig, x, f, th: 0 };
  };
  const a = mk(XA, 1, 'long', 'dress'), b = mk(XB, -1, 'short', 'coat');
  for (const s of [a, b]) s.g.style.opacity = 0;
  const local = (s, [wx, wy]) => { const c = Math.cos(s.th), sn = Math.sin(s.th); const dx = wx - s.x, dy = wy - PIV; return [s.x + dx * c + dy * sn, PIV - dx * sn + dy * c]; };
  const world = (s, [lx, ly]) => { const c = Math.cos(-s.th), sn = Math.sin(-s.th); const dx = lx - s.x, dy = ly - PIV; return [s.x + dx * c + dy * sn, PIV - dx * sn + dy * c]; };
  const place = s => { s.g.style.transform = `rotate(${-s.th / D}deg)`; };

  let t = 0, last = performance.now(), lagB = .38, amp = 11 * D, phase = 0;
  let thc = 0, th0 = 0, phc = 0, hamp = 2.2 * D, gapK = 0, settle = 0;
  let mode = 'free', reachA = 0, reachB = 0, hold = null, pressed = false, done = false, hint = 0;
  let lookA = 0, lookB = 0;                 // head: + drops the head, - lifts it
  const restA = () => [a.x + 2, SEAT - H * .33], restB = () => [b.x - 2, SEAT - H * .33];
  let creakSide = 0;
  const frame = now => {
    const dt = Math.min(50, now - last) * SPEED; last = now; t += dt;
    phase += dt / PERIOD * Math.PI * 2;
    if (pressed && lagB > 0) lagB = Math.max(0, lagB - dt / 3000 * .38);
    a.th = amp * Math.sin(phase);
    b.th = -amp * .94 * Math.sin(phase - lagB * Math.PI * 2);
    if (mode === 'held') {
      // they hold on; the swings settle together but not quite as one
      settle = Math.min(1, settle + dt / 3500);
      hamp *= Math.exp(-dt / 4200);
      const c = th0 + (thc - th0) * settle;
      a.th = c + hamp * (Math.sin(phase) - Math.sin(phc));
      b.th = -(c * .97) - hamp * .85 * (Math.sin(phase - .25) - Math.sin(phc - .25));
    }
    place(a); place(b);
    const sideNow = Math.sign(Math.cos(phase)); if (sideNow !== creakSide) { creakSide = sideNow; if (mode !== 'held') A.creak(); }
    // the body follows the swing a beat late; legs pump into the forward swing
    for (const [s, ph, look] of [[a, phase, lookA], [b, phase - lagB * Math.PI * 2, lookB]]) {
      const k = mode === 'held' ? 1 - settle * .8 : 1;
      const lagged = Math.cos(ph - .7), r = s === a ? reachA : reachB;
      s.fig.p.kN = 82 - 30 * lagged * k + r * 8; s.fig.p.kF = 90 - 24 * lagged * k + r * 10;
      s.fig.p.hN = 82 + 8 * lagged * k - r * 3; s.fig.p.hF = 78 + 8 * lagged * k - r * 3;
      s.fig.p.spine = -4 - 7 * lagged * k + r * 12;
      s.fig.p.reach = r;
      s.fig.p.head = look; s.fig.p.neck = 4 + Math.max(0, -look) * .4;
    }
    const reachTarget = (s, r) => {
      const sh = world(s, s.fig.joints().S);
      const toward = [sh[0] + s.f * H * .26, sh[1] + H * .08];                 // elbow stays soft
      const tgt = mode === 'held' ? [toward[0] + (hold[0] - toward[0]) * gapK, toward[1] + (hold[1] - toward[1]) * gapK] : toward;
      const rest = s === a ? restA() : restB();
      const lt = local(s, tgt);
      return [rest[0] + (lt[0] - rest[0]) * r, rest[1] + (lt[1] - rest[1]) * r];
    };
    a.fig.p.handN = reachTarget(a, reachA);
    b.fig.p.handN = reachTarget(b, reachB);
    if (mode === 'held') { // hands searching for a better hold, then still
      const w = Math.exp(-settle * 3) * 4;
      a.fig.p.handN = [a.fig.p.handN[0] + Math.sin(t / 260) * w, a.fig.p.handN[1] + Math.cos(t / 330) * w * .6];
    }
    if (mode === 'wait') { hint += dt; const tr = Math.sin(hint / 90) * 1.3 * Math.min(1, hint / 600); a.fig.p.handN = [a.fig.p.handN[0], a.fig.p.handN[1] + tr]; }
    a.fig.render(); b.fig.render();
    if (!done) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const tween = (get, set, to, ms) => new Promise(res => {
    const from = get(), t0 = performance.now(), Dm = ms / SPEED;
    const st = now => { const k = Math.max(0, Math.min(1, (now - t0) / Dm)), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; set(from + (to - from) * e); k < 1 ? requestAnimationFrame(st) : res(); };
    requestAnimationFrame(st);
  });
  const wait = ms => new Promise(r => setTimeout(r, ms / SPEED));
  const when = test => new Promise(res => { const ck = () => test() ? res() : requestAnimationFrame(ck); ck(); });
  const rising = () => when(() => { const s = Math.sin(phase), c = Math.cos(phase); return s > .1 && s < .5 && c > 0; });
  const apex = () => when(() => Math.sin(phase) > .97);

  // ---- the scene ----
  P.camera(60, 140, 680, 560, 0);
  A.music(2);
  await Promise.all([a, b].map(s => s.g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T(1200), fill: 'forwards' }).finished));
  await wait(PERIOD * .7);
  // she reaches; he is somewhere else in his swing
  await rising();
  await tween(() => reachA, v => reachA = v, .9, 800);
  await wait(400);
  await tween(() => reachA, v => reachA = v, 0, 900);
  // she looks away. he looks at her, too late.
  await Promise.all([tween(() => lookA, v => lookA = v, 18, 700), (async () => { await wait(500); await tween(() => lookB, v => lookB = v, -7, 900); })()]);
  await wait(900);
  await Promise.all([tween(() => lookA, v => lookA = v, 0, 900), tween(() => lookB, v => lookB = v, 0, 1200)]);
  // she tries once more, halfway, and waits. touch her hand.
  await rising();
  await tween(() => reachA, v => reachA = v, .55, 900);
  mode = 'wait';
  await new Promise(res => {
    const hit = el('circle', { r: 60, class: 'hit', tabindex: 0, role: 'button', 'aria-label': 'her hand' }, P.ui);
    const follow = () => { if (!hit.isConnected) return; const w2 = world(a, a.fig.joints().WN); hit.setAttribute('cx', w2[0]); hit.setAttribute('cy', w2[1]); requestAnimationFrame(follow); };
    follow();
    const go = e => { e && e.preventDefault(); pressed = true; hit.remove(); res(); };
    hit.addEventListener('pointerdown', go, { once: true });
    hit.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && go(e));
    if (AUTO) setTimeout(go, 300);
  });
  mode = 'free'; A.tapNote();
  tween(() => lookB, v => lookB = v, -4, 1200);
  await when(() => lagB <= 0);
  await rising();
  P.camera(255, 300, 290, 300, 1100);          // close: hands and shoulders fill the frame
  await Promise.all([tween(() => reachA, v => reachA = v, 1, 800), (async () => { await wait(120); await tween(() => reachB, v => reachB = v, 1, 800); })()]);
  await apex();
  // the top of the swing: they stop there, a hand's width apart
  const sa = world(a, a.fig.joints().S), sb = world(b, b.fig.joints().S);
  hold = [(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2 + H * .14];
  th0 = a.th; thc = a.th * .8; phc = phase; mode = 'held';
  await tween(() => gapK, v => gapK = v, .7, 600);
  await wait(500);                                       // hesitation
  await tween(() => gapK, v => gapK = v, 1, 300);       // fingertips
  A.chord(.08); P.washTo('gold', .5, 5000);
  tween(() => lookA, v => lookA = v, 9, 1600);
  P.camera(280, 330, 240, 250, 6000);
  await wait(5500);
  done = true;
}
