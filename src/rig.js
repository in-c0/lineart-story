// A posable, faceless figure drawn in brush strokes. Side / three-quarter view.
// Angles in degrees. Limbs: 0 = hanging straight down, + = forward (toward facing).
import { el, rand, T } from './engine.js';
import { sample, outline } from './brush.js';

const D = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export const POSES = {
  crouch: { spine: 38, neck: 8, hN: 95, kN: 125, hF: 80, kF: 110 },
  stand: { spine: 1, neck: 4, head: 2, sN: 4, eN: 8, sF: -3, eF: 6, hN: 2, kN: 2, hF: -2, kF: 1, bob: 0 },
  sit: { spine: -2, neck: 6, head: 4, sN: 18, eN: 30, sF: 14, eF: 30, hN: 86, kN: 84, hF: 80, kF: 88, bob: 0 },
};

export class Figure {
  constructor(pane, o = {}) {
    this.pane = pane;
    this.o = { h: 280, hair: 'long', clothes: 'dress', kind: 'adult', f: 1, w: null, ...o };
    this.g = el('g', { opacity: o.hidden ? 0 : 1 }, o.parent || pane.root);
    this.p = { x: o.x ?? 400, y: o.y ?? 760, f: this.o.f, py: null, ...POSES[o.pose || 'stand'], ...(o.p || {}) };
    this.paths = [];
    this.jit = [];
    this.seed = Math.floor(rand() * 1e6);
    this.render();
  }
  get h() { return this.o.h; }
  // ---------- skeleton ----------
  joints(p = this.p, drop = 0) {
    const h = this.o.h, f = p.f, k = this.o.kind;
    const C = k === 'child', O = k === 'old';
    const L = {
      headRy: h * (C ? .095 : .068), headRx: h * (C ? .08 : .055), neck: h * .045, torso: h * (C ? .26 : .29),
      up: h * .165, fore: h * .15, thigh: h * (C ? .22 : .235), shin: h * (C ? .21 : .225), foot: h * .075,
    };
    const pelvisH = L.thigh + L.shin + h * .025;
    const P = [p.x, p.py != null ? p.py : p.y - pelvisH + (p.bob || 0) + drop];
    const sp = (p.spine + (O ? 6 : 0)) * D;
    const up = a => [Math.sin(a) * f, -Math.cos(a)];        // 0 = up
    const dn = a => [Math.sin(a) * f, Math.cos(a)];         // 0 = down
    const add = (A, v, s) => [A[0] + v[0] * s, A[1] + v[1] * s];
    const Ch = add(P, up(sp), L.torso);
    const na = sp + (p.neck + (O ? 6 : 0)) * D;
    const N = add(Ch, up(na), L.neck);
    const ha = na + (p.head || 0) * D;
    const H = add(N, up(ha), L.headRy * .92);
    const rch = p.reach || 0;
    const S = add(Ch, [f * h * (-.012 + .028 * rch), h * (.028 - .014 * rch)], 1);
    const arm = (s, e, tgt) => {
      if (tgt) return ik(S, tgt, L.up, L.fore, f);
      const E = add(S, dn(s * D), L.up); return [E, add(E, dn((s + e) * D), L.fore)];
    };
    // holdN: hand target relative to the shoulder (x toward the facing side), so it travels with the body
    const rel = q => q && [S[0] + f * q[0] * h, S[1] + q[1] * h];
    const [EN, WN] = arm(p.sN, p.eN, p.handN || rel(p.holdN));
    const [EF, WF] = arm(p.sF, p.eF, p.handF);
    const leg = (hp, kn) => { const K = add(P, dn(hp * D), L.thigh); const A = add(K, dn((hp - kn) * D), L.shin); return [K, A]; };
    const [KN, AN] = leg(p.hN, p.kN), [KF, AF] = leg(p.hF, p.kF);
    // standing figures keep their feet on the ground: bent knees lower the hips instead of lifting the feet
    if (p.py == null && !drop) { const lift = p.y - Math.max(AN[1], AF[1]) - h * .025 - (p.bob || 0); if (lift > .5) return this.joints(p, lift); }
    return { L, P, Ch, N, H, ha, S, EN, WN, EF, WF, KN, AN, KF, AF, f, sp, up, dn, add };
  }
  // ---------- strokes from the skeleton ----------
  strokes(p = this.p) {
    const J = this.joints(p), { L, P, Ch, N, H, ha, f, sp, up, add } = J, h = this.o.h;
    const S = [];
    const w = (this.o.w || Math.max(1.4, h / 300 * 2.3)) * (this.pane.inkScale ?? 1);
    const front = a => [Math.cos(a) * f, Math.sin(a)];        // perpendicular toward the face
    const fr = front(sp);
    // limbs as two contour lines of a tapering tube
    const tube = (pts, widths, op = 1, ww = w) => {
      const L2 = [], R2 = [];
      for (let i = 0; i < pts.length; i++) {
        const A = pts[Math.max(0, i - 1)], B = pts[Math.min(pts.length - 1, i + 1)];
        let dx = B[0] - A[0], dy = B[1] - A[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        L2.push([pts[i][0] - dy * widths[i], pts[i][1] + dx * widths[i]]); R2.push([pts[i][0] + dy * widths[i], pts[i][1] - dx * widths[i]]);
      }
      S.push({ p: L2, w: ww, o: op }); S.push({ p: R2, w: ww * .9, o: op });
      return [L2, R2];
    };
    const hand = (E, W, op = 1, ww = w) => {
      let dx = W[0] - E[0], dy = W[1] - E[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const nx = -dy, ny = dx, s = h * .001;
      const R = (a, b) => [W[0] + dx * a * s + nx * b * s, W[1] + dy * a * s + ny * b * s];
      S.push({ p: [R(-4, -13), R(14, -15), R(40, -10), R(48, 1), R(36, 12), R(10, 14), R(-4, 12)], w: ww * .85, o: op, a: .2, b: .3 });
      S.push({ p: [R(14, -13), R(26, -26), R(32, -18), R(28, -8)], w: ww * .7, o: op, a: .3, b: .5 }); // thumb
    };
    const leg = (K, A, op, ww, dress) => {
      const kneeW = h * .022, ankW = h * .015;
      if (dress) tube([[lerp(K[0], A[0], .1), lerp(K[1], A[1], .1)], A], [kneeW * .95, ankW], op, ww);
      else tube([P, K, A], [h * .05, kneeW, ankW], op, ww);
      // shoe
      S.push({ p: [[A[0] - f * h * .016, A[1] - h * .006], [A[0] - f * h * .02, A[1] + h * .018], [A[0] + f * h * .03, A[1] + h * .024], [A[0] + f * h * .072, A[1] + h * .022], [A[0] + f * h * .05, A[1] + h * .004], [A[0] + f * h * .014, A[1] - h * .004]], w: ww * .9, o: op, a: .1, b: .2 });
    };
    const dress = this.o.clothes === 'dress';
    // far side first, lighter
    const FAR = .38, wf = w * .8;
    leg(J.KF, J.AF, FAR, wf, dress);
    tube([J.S, J.EF, J.WF], [h * .027, h * .022, h * .016], FAR, wf); hand(J.EF, J.WF, FAR, wf);
    // torso contour: back line and front line along the spine axis
    const curl = (p.curl ?? .35) + (this.o.kind === 'old' ? .35 : 0);
    const ax = (t, off) => { const base = add(P, up(sp), L.torso * t); const bow = -Math.sin(Math.PI * Math.min(1, t)) * h * .018 * curl; return [base[0] + fr[0] * (off + bow), base[1] + fr[1] * (off + bow)]; };
    const back = [ax(1.13, -h * .02), ax(1.02, -h * .045), ax(.86, -h * .072), ax(.55, -h * .06), ax(.22, -h * .07), ax(0, -h * .078)];
    const fron = [ax(1.12, h * .03), ax(1.0, h * .05), ax(.8, h * .082), ax(.5, h * .066), ax(.2, h * .074), ax(0, h * .08)];
    if (dress) {
      // skirt drapes from the hips over the near thigh to below the knee
      const K = J.KN, th = [K[0] - P[0], K[1] - P[1]], tl = Math.hypot(...th) || 1, tu = [th[0] / tl, th[1] / tl];
      const flare = [tu[0] * h * .06 + 0, tu[1] * h * .06];
      const perpU = [-tu[1] * f, tu[0] * f];
      const hemF = [K[0] + flare[0] - perpU[0] * h * .055 * f, K[1] + flare[1] + h * .02];
      const hemB = [K[0] + flare[0] + perpU[0] * h * .05 * f - f * h * .03, K[1] + flare[1] + h * .035];
      S.push({ p: back.concat([[P[0] - f * h * .085, P[1] + h * .06], hemB]), w });
      S.push({ p: fron.concat([[lerp(P[0], K[0], .5) + fr[0] * h * .07, lerp(P[1], K[1], .5) - h * .01], hemF]), w });
      S.push({ p: [hemB, [lerp(hemB[0], hemF[0], .5), lerp(hemB[1], hemF[1], .5) + h * .012], hemF], w: w * .8, o: .85 });
      S.push({ p: [ax(.48, h * .05), ax(.42, h * .02)], w: w * .55, o: .55 }); // waist fold
    } else {
      S.push({ p: back, w }); S.push({ p: fron, w });
      S.push({ p: [ax(.1, -h * .07), [P[0], P[1] + h * .012], ax(.1, h * .074)], w: w * .7, o: .7 });
    }
    leg(J.KN, J.AN, 1, w, dress);
    if (!dress) S.push({ p: [[J.KN[0] - f * h * .01, J.KN[1] - h * .01], [J.KN[0] + f * h * .006, J.KN[1] + h * .004]], w: w * .5, o: .5 });
    // head: open oval, a gap where the jaw meets the neck
    const rot = ([x, y]) => { const c = Math.cos(ha), s = Math.sin(ha); return [H[0] + (x * c - y * s), H[1] + (x * s + y * c)]; };
    const hp = (th, r = 1) => rot([Math.cos(th * D) * L.headRx * r * f, Math.sin(th * D) * L.headRy * r]);
    const headPts = []; for (let a = 115; a <= 415; a += 20) headPts.push(hp(a));
    S.push({ p: headPts, w: w * 1.05, a: .08, b: .25 });
    S.push({ p: [hp(60, .95), [lerp(hp(60)[0], N[0], .6) + f * h * .005, lerp(hp(60)[1], N[1], .6)], [N[0] + f * h * .02, N[1] + h * .01]], w: w * .8 });
    S.push({ p: [hp(150, .9), [N[0] - f * h * .016, N[1] - h * .004], [N[0] - f * h * .02, N[1] + h * .012]], w: w * .8 });
    // hair
    const hair = this.o.hair;
    if (hair === 'long' || hair === 'grey') {
      const n = hair === 'grey' ? 5 : 8;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), a0 = -40 - t * 120;
        const strand = [hp(a0, 1.02), hp(a0 - 25 - t * 10, 1.1 + t * .04), hp(160 + t * 18, 1.12), [N[0] - f * h * (.03 + t * .02), N[1] + h * .04], [N[0] - f * h * (.04 + t * .035), N[1] + h * (.11 + t * .05)]];
        S.push({ p: strand, w: w * (.55 + .35 * rand()), o: hair === 'grey' ? .5 : .9, a: .05, b: .55 });
      }
      S.push({ p: [hp(-30, 1.03), hp(-12, 1.0), hp(8, .96)], w: w * .6, o: .8 }); // fringe edge
    } else if (hair === 'short') {
      S.push({ p: [hp(-10, 1.02), hp(-50, 1.1), hp(-100, 1.12), hp(-150, 1.1), hp(175, 1.06), hp(150, .98)], w: w * 1.1, a: .1, b: .3 });
      for (let i = 0; i < 3; i++) S.push({ p: [hp(-40 - i * 40, 1.1), hp(-30 - i * 40, 1.0), hp(-15 - i * 40, .92)], w: w * .5, o: .6 });
    } else if (hair === 'bun') {
      S.push({ p: [hp(-15, 1.02), hp(-70, 1.08), hp(-130, 1.08), hp(175, 1.04), hp(150, .98)], w: w * .9 });
      const bc = hp(-150, 1.3); const br = L.headRx * .42;
      const loop = []; for (let a = 0; a <= 360; a += 30) loop.push([bc[0] + Math.cos(a * D) * br, bc[1] + Math.sin(a * D) * br * .85]);
      S.push({ p: loop, w: w * .85, closed: true });
      S.push({ p: [hp(-100, 1.05), hp(-140, 1.2), bc], w: w * .5, o: .6 });
    }
    // near arm on top
    const [aL] = tube([J.S, J.EN, J.WN], [h * .03, h * .024, h * .017]);
    S.push({ p: [J.EN, [J.EN[0] + f * h * .012, J.EN[1] - h * .006]], w: w * .5, o: .5 }); // elbow crease
    hand(J.EN, J.WN);
    // shoulder line joining the near sleeve to the body
    S.push({ p: [ax(1.04, -h * .02), [J.S[0] + f * h * .01, J.S[1] - h * .03], [J.S[0] + f * h * .03, J.S[1] - h * .012]], w: w * .9 });
    return S;
  }
  render() {
    const S = this.strokes();
    while (this.paths.length < S.length) { const pth = el('path', { class: 'brush' + (this.o.white ? ' w' : '') }, this.g); this.paths.push(pth); }
    while (this.paths.length > S.length) this.paths.pop().remove();
    let r = this.seed;
    const rr = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    S.forEach((s, i) => {
      if (!this.jit[i]) this.jit[i] = Array.from({ length: 16 }, () => [(rr() - .5) * 1.2, (rr() - .5) * 1.2, rr() * 6]);
      const J = this.jit[i];
      const pts = s.p.map((q, k) => [q[0] + J[k % 16][0], q[1] + J[k % 16][1]]);
      const d = outline(sample(pts, s.closed, 6), s.w, { a: s.a ?? .12, b: s.b ?? .4, ph: J[0][2], amp: .14, closed: s.closed });
      const pth = this.paths[i];
      pth.setAttribute('d', d);
      if (s.o != null && s.o !== 1) pth.setAttribute('opacity', s.o); else pth.removeAttribute('opacity');
    });
  }
  set(p) { Object.assign(this.p, p); this.render(); return this; }
  // tween any numeric pose fields (and hand targets) to new values
  to(p, ms = 1000, ez = ease) {
    const from = JSON.parse(JSON.stringify(this.p)), t0 = performance.now(), D2 = T(ms);
    const tgt = { ...p };
    return new Promise(res => {
      const step = now => {
        const k = Math.max(0, Math.min(1, (now - t0) / D2)), e = ez(k);
        for (const key in tgt) {
          const a = from[key], b = tgt[key];
          if (Array.isArray(b)) this.p[key] = a ? [lerp(a[0], b[0], e), lerp(a[1], b[1], e)] : b;
          else if (typeof b === 'number') this.p[key] = lerp(a ?? b, b, e);
          else this.p[key] = b;
        }
        this.render();
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }
  // a gait cycle tied to distance so feet don't skate. eases in and out.
  walk(dx, ms, o = {}) {
    const h = this.o.h, cyc = h * (o.short ? .5 : .66), x0 = this.p.x, t0 = performance.now(), D2 = T(ms);
    const sway = o.short ? .7 : 1;
    return new Promise(res => {
      const step = now => {
        const k = Math.max(0, Math.min(1, (now - t0) / D2));
        const e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;              // ease in/out
        const v = Math.sin(Math.PI * Math.min(1, k * 1.0)) ** .6;                 // stride amplitude follows speed
        const dist = Math.abs(dx) * e, ph = dist / cyc * Math.PI * 2 + (o.phase || 0);
        const amp = 21 * sway * Math.max(.15, v);
        this.p.x = x0 + dx * e;
        this.p.hN = amp * Math.sin(ph); this.p.hF = -amp * Math.sin(ph);
        this.p.kN = 6 + 30 * v * Math.max(0, Math.cos(ph)); this.p.kF = 6 + 30 * v * Math.max(0, -Math.cos(ph));
        if (!this.p.handN && !this.p.holdN) { this.p.sN = -15 * sway * v * Math.sin(ph); this.p.eN = 12 + 8 * v; }
        if (!this.p.handF) { this.p.sF = 15 * sway * v * Math.sin(ph); this.p.eF = 12 + 8 * v; }
        this.p.bob = -Math.abs(Math.cos(ph)) * h * .016 * v;
        this.p.spine = (o.spine ?? 3) + 2 * v;
        const sg = Math.sign(Math.sin(ph));
        if (o.onPlant && this._sg != null && sg !== this._sg && v > .3) { const J = this.joints(); o.onPlant(sg > 0 ? J.AN : J.AF, this); }
        this._sg = sg;
        o.onStep && o.onStep(this);
        this.render();
        k < 1 ? requestAnimationFrame(step) : (this.set({ ...POSES.stand, handN: this.p.handN, handF: this.p.handF, holdN: this.p.holdN, spine: o.spine ?? 1 }), res());
      };
      requestAnimationFrame(step);
    });
  }
  async show(ms = 900) { await this.g.animate([{ opacity: +this.g.getAttribute('opacity') }, { opacity: 1 }], { duration: T(ms), fill: 'forwards' }).finished; this.g.setAttribute('opacity', 1); }
  async hide(ms = 900) { await this.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T(ms), fill: 'forwards' }).finished; this.g.setAttribute('opacity', 0); }
  remove() { this.g.remove(); }
  // where the near / far hand currently is
  hand(which = 'N') { const J = this.joints(); return which === 'N' ? J.WN : J.WF; }
  shoulder() { return this.joints().S; }
}

// two-bone IK. elbow bends downward.
function ik(S, T2, l1, l2, f) {
  let dx = T2[0] - S[0], dy = T2[1] - S[1]; let d = Math.hypot(dx, dy);
  const maxd = (l1 + l2) * .999; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const a = Math.atan2(dy, dx);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const b = Math.acos(c);
  const sgn = f > 0 ? 1 : -1;                  // pick the elbow-down solution
  const ang = a + b * sgn;
  const E = [S[0] + Math.cos(ang) * l1, S[1] + Math.sin(ang) * l1];
  const W = [S[0] + dx, S[1] + dy];
  return [E, W];
}
