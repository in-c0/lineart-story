// Stage, hand-drawn ink and the small set of interactions the game uses.
import * as A from './audio.js';

export const NS = 'http://www.w3.org/2000/svg';
const Q = new URLSearchParams(location.search);
export const SPEED = Math.max(0.1, +Q.get('speed') || 1);
export const AUTO = Q.has('auto');
const IDLE = Q.has('idle'); // test: leave optional moments untouched
const autoPicks = (Q.get('auto') || '').split(',').filter(Boolean).map(Number);
export const T = ms => ms / SPEED;
export const sleep = ms => new Promise(r => setTimeout(r, T(ms)));

// ---------- seeded jitter so lines look hand-drawn but stay stable ----------
let seed = 20230718;
export function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
export const jit = (a = 1) => (rand() - .5) * 2 * a;
const f = n => Math.round(n * 10) / 10;

// straight strokes that still wobble like a hand: each segment bows a little
export function lin(pts, closed = false, j = .7) {
  const p = pts.map(([x, y]) => [x + jit(j), y + jit(j)]);
  if (closed) p.push(p[0]);
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], L = Math.hypot(x1 - x0, y1 - y0) || 1;
    const b = jit(Math.min(2.2, L * .012));
    d += `Q${f((x0 + x1) / 2 - (y1 - y0) / L * b)},${f((y0 + y1) / 2 + (x1 - x0) / L * b)} ${f(x1)},${f(y1)}`;
  }
  return d;
}
export function curve(pts, closed = false, j = .7) {
  const p = pts.map(([x, y]) => [x + jit(j), y + jit(j)]);
  const n = p.length;
  if (n === 1) return `M${f(p[0][0])},${f(p[0][1])}l.1,0`;
  if (n === 2) return `M${f(p[0][0])},${f(p[0][1])}L${f(p[1][0])},${f(p[1][1])}`;
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = closed ? p[(i - 1 + n) % n] : p[Math.max(0, i - 1)];
    const p1 = p[i], p2 = p[(i + 1) % n];
    const p3 = closed ? p[(i + 2) % n] : p[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}
// points on an ellipse arc (degrees, 90 = down)
export function arc(cx, cy, rx, ry, a0 = 0, a1 = 360, step = 24) {
  const out = [], n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}

export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// ---------- tap feedback cue shown only the very first time ----------
let firstCue = true;

// ---------- a pane: one life (L / R) or both together (B) ----------
export class Pane {
  constructor(host, name) {
    this.name = name;
    this.host = host;
    this.svg = el('svg', { viewBox: '0 0 800 900', preserveAspectRatio: 'xMidYMid meet' }, host);
    const defs = el('defs', {}, this.svg);
    this.turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.018', numOctaves: 2, seed: 1 },
      el('filter', { id: 'wob' + name, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs));
    el('feDisplacementMap', { in: 'SourceGraphic', scale: 2.6 }, this.turb.parentNode);
    const gr = el('radialGradient', { id: 'gold' + name, cx: '50%', cy: '62%', r: '75%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#f4c27a', 'stop-opacity': '.85' }, gr);
    el('stop', { offset: '.55', 'stop-color': '#efcf9c', 'stop-opacity': '.35' }, gr);
    el('stop', { offset: '1', 'stop-color': '#f6f4ef', 'stop-opacity': '0' }, gr);
    this.wash = el('rect', { x: -1600, y: -1200, width: 4000, height: 3300, fill: 'transparent', opacity: 0 }, this.svg);
    this.root = el('g', { filter: `url(#wob${name})` }, this.svg);
    this.fx = el('g', {}, this.svg);          // particles, not wobbled
    this.darkR = el('rect', { x: -1600, y: -1200, width: 4000, height: 3300, fill: '#0b0b0c', opacity: 0, 'pointer-events': 'none' }, this.svg);
    this.over = el('g', { filter: `url(#wob${name})` }, this.svg); // white ink above darkness
    this.ui = el('g', {}, this.svg);          // cues and hit areas
    this.isDark = false;
    this.particles = [];
    this.weather = null;
  }
  // a group on the drawing layer (or on .over when white)
  g(attrs = {}, parent) { return el('g', attrs, parent || this.root); }

  // draw strokes on with a pen-like reveal. strokes: [{p, c, w, o}] or a d-string
  async ink(strokes, o = {}) {
    const { dur = 1400, stagger = .65, parent, w = 2.1, white = false, fill, opacity, ease = 'cubic-bezier(.45,.05,.35,1)', wait = true } = o;
    const host = parent || (white ? this.over : this.root);
    const g = el('g', {}, host);
    if (opacity != null) g.setAttribute('opacity', opacity);
    const list = typeof strokes === 'string' ? [{ d: strokes }] : strokes;
    const per = list.length > 1 ? dur / (1 + (list.length - 1) * (1 - stagger)) : dur;
    const step = per * (1 - stagger);
    const anims = list.map((s, i) => {
      const d = s.d || (s.l ? lin(s.p, s.c, s.j ?? .7) : curve(s.p, s.c, s.j ?? .7));
      const p = el('path', { d, class: 'ink' + (white ? ' w' : ''), 'stroke-width': s.w || w, pathLength: 1 }, g);
      if (s.o != null) p.setAttribute('opacity', s.o);
      if (s.fill || fill) { p.style.fill = s.fill || fill; p.style.fillOpacity = 0; }
      if (s.col) p.style.stroke = s.col;
      p.style.strokeDasharray = '1 1';
      p.style.strokeDashoffset = 1;
      const a = p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: T(per), delay: T(i * step + (o.delay || 0)), easing: ease, fill: 'forwards' });
      a.onfinish = () => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; a.cancel(); if (p.style.fill) p.animate([{ fillOpacity: 0 }, { fillOpacity: s.fo ?? .9 }], { duration: T(700), fill: 'forwards' }); };
      return a.finished.catch(() => {});
    });
    if (wait) await Promise.all(anims);
    return g;
  }
  // undraw a group (reverse pen) then remove it
  async erase(g, dur = 900) {
    if (!g || !g.isConnected) return;
    const ps = [...g.querySelectorAll('path')];
    await Promise.all(ps.map(p => {
      p.setAttribute('pathLength', 1); p.style.strokeDasharray = '1 1';
      return p.animate([{ strokeDashoffset: 0, fillOpacity: p.style.fill ? .9 : 0 }, { strokeDashoffset: -1, fillOpacity: 0 }], { duration: T(dur), easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
    }));
    g.remove();
  }
  async fade(g, to = 0, dur = 900, remove = to === 0) {
    if (!g || !g.isConnected) return;
    const from = +(getComputedStyle(g).opacity || 1);
    await g.animate([{ opacity: from }, { opacity: to }], { duration: T(dur), fill: 'forwards', easing: 'ease' }).finished.catch(() => {});
    if (remove) g.remove(); else g.setAttribute('opacity', to);
  }
  // move a group by translate(dx,dy) relative to its drawn position
  async move(g, x, y, dur = 2000, ease = 'ease-in-out', rot = 0) {
    const cur = g._pos || [0, 0, 0];
    const a = g.animate([{ transform: `translate(${cur[0]}px,${cur[1]}px) rotate(${cur[2]}deg)` }, { transform: `translate(${x}px,${y}px) rotate(${rot}deg)` }], { duration: T(dur), easing: ease, fill: 'forwards' });
    g._pos = [x, y, rot];
    await a.finished.catch(() => {});
  }
  async clear(dur = 1400) {
    const kids = [...this.root.children, ...this.over.children];
    await Promise.all(kids.map(k => this.fade(k, 0, dur)));
    this.weatherOff();
    this.ui.replaceChildren();
    this.washTo('transparent', 0, 10);
  }
  async washTo(color, op, dur = 2000) {
    if (color.startsWith('gold')) color = `url(#gold${this.name})`;
    if (op > 0) this.wash.setAttribute('fill', color);
    this.wash.getAnimations().forEach(a => a.cancel());
    const a = this.wash.animate([{ opacity: +this.wash.getAttribute('opacity') || 0 }, { opacity: op }], { duration: T(dur), fill: 'forwards' });
    this.wash.setAttribute('opacity', op);
    await a.finished.catch(() => {}); a.cancel();
  }
  async dark(on, dur = 2200) {
    this.isDark = on;
    A.darkness(on ? 1 : 0, dur / 1000 / SPEED);
    this.darkR.getAnimations().forEach(a => a.cancel());
    const a = this.darkR.animate([{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], { duration: T(dur), fill: 'forwards', easing: 'ease-in-out' });
    this.darkR.setAttribute('opacity', on ? 1 : 0);
    await a.finished.catch(() => {}); a.cancel();
  }

  // ---------- weather: snow / rain / motes ----------
  weatherOn(kind, n = 70, area = [-500, 1300]) {
    this.weatherOff();
    const g = el('g', { opacity: 0 }, this.fx);
    g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T(2500), fill: 'forwards' });
    const parts = [];
    for (let i = 0; i < n; i++) {
      const x = area[0] + rand() * (area[1] - area[0]), y = -60 + rand() * 1000;
      let e;
      if (kind === 'rain') e = el('line', { x1: 0, y1: 0, x2: -4, y2: 22, stroke: '#1c1b19', 'stroke-width': 1, opacity: .35 }, g);
      else e = el('circle', { r: 1.2 + rand() * 2.2, fill: kind === 'gold' ? '#e7a54f' : '#1c1b19', opacity: kind === 'gold' ? .8 : .55 }, g);
      parts.push({ e, x, y, v: kind === 'rain' ? 9 + rand() * 4 : .35 + rand() * .7, ph: rand() * 6, kind });
    }
    this.weather = { g, parts, kind };
    if (kind === 'snow' || kind === 'gold') A.wind(true); if (kind === 'rain') A.rain(true);
    return g;
  }
  setWeatherKind(kind) {
    if (!this.weather) return;
    this.weather.kind = kind;
    for (const p of this.weather.parts) { p.kind = kind; if (p.e.tagName === 'circle') p.e.animate([{ fill: getComputedStyle(p.e).fill }, { fill: kind === 'gold' ? '#e7a54f' : '#1c1b19' }], { duration: T(3000), fill: 'forwards' }); }
  }
  weatherOff() {
    if (!this.weather) return;
    const g = this.weather.g; const k = this.weather.kind; this.weather = null;
    g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T(1500), fill: 'forwards' }).finished.then(() => g.remove()).catch(() => {});
    if (k === 'rain') A.rain(false);
    else if (!Pane.all.some(p => p.weather && p.weather.kind !== 'rain')) A.wind(false);
  }
  tickWeather(dt) {
    const w = this.weather; if (!w) return;
    for (const p of w.parts) {
      p.y += p.v * dt * (w.kind === 'gold' ? -.5 : 1) * SPEED;
      p.ph += .01 * dt;
      if (p.y > 960) p.y = -40; if (p.y < -60) p.y = 940;
      const x = p.x + (p.kind === 'rain' ? 0 : Math.sin(p.ph) * 12);
      p.e.setAttribute('transform', `translate(${f(x)},${f(p.y)})`);
    }
  }

  // ---------- interactions ----------
  _cue(x, y, r, white) {
    const hit = el('circle', { cx: x, cy: y, r: Math.max(r, 44), class: 'hit', tabindex: 0, role: 'button' }, this.ui);
    const cue = el('circle', { cx: x, cy: y, r, class: 'cue' + (white || this.isDark ? ' w' : '') }, this.ui);
    if (firstCue) { firstCue = false; ripple(this, x, y, r, white || this.isDark); }
    return { hit, cue, x, y, r };
  }
  // wait for one tap at (x,y). label is for screen readers only
  tap(x, y, r = 40, o = {}) {
    return new Promise(res => {
      const c = this._cue(x, y, r, o.white);
      if (o.label) c.hit.setAttribute('aria-label', o.label);
      const done = e => { e && e.preventDefault(); cleanup(); if (!o.silent) A.tapNote(); res(); };
      const key = e => { if (e.key === 'Enter' || e.key === ' ') done(e); };
      const cleanup = () => { c.hit.remove(); c.cue.remove(); };
      c.hit.addEventListener('pointerdown', done, { once: true });
      c.hit.addEventListener('keydown', key);
      focusSoon(c.hit);
      if (AUTO && !(IDLE && o.timeout)) setTimeout(() => c.hit.isConnected && done(), 260);
      if (o.timeout) setTimeout(() => { if (c.hit.isConnected) { cleanup(); res('timeout'); } }, T(o.timeout));
    });
  }
  // two or more targets; returns the chosen index (or -1 on timeout)
  choose(opts, o = {}) {
    return new Promise(res => {
      const cs = opts.map(([x, y, r = 46, label]) => { const c = this._cue(x, y, r); if (label) c.hit.setAttribute('aria-label', label); return c; });
      let over = false;
      const pick = i => { if (over) return; over = true; cs.forEach(c => { c.hit.remove(); c.cue.remove(); }); if (i >= 0) A.tapNote(); res(i); };
      cs.forEach((c, i) => {
        c.hit.addEventListener('pointerdown', e => { e.preventDefault(); pick(i); });
        c.hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(i); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { cs[(i + (e.key === 'ArrowRight' ? 1 : cs.length - 1)) % cs.length].hit.focus(); } });
      });
      focusSoon(cs[0].hit);
      if (AUTO) setTimeout(() => pick(autoPicks.length ? autoPicks.shift() % opts.length : 0), 300);
      if (o.timeout) setTimeout(() => pick(-1), T(o.timeout));
    });
  }
  // tap the same spot n times; onTap(i) fires on each
  async taps(x, y, n, onTap, o = {}) {
    for (let i = 0; i < n; i++) { const r = await this.tap(x, y, o.r || 40, { ...o, silent: true }); if (r === 'timeout') return 'timeout'; await onTap(i); }
  }
  // drag a handle from (x,y) toward (tx,ty). a plain tap also works and finishes it for you.
  drag(x, y, tx, ty, onMove, o = {}) {
    return new Promise(res => {
      const c = this._cue(x, y, o.r || 34);
      let active = false, start = null, t = 0, finished = false;
      const toLocal = e => { const m = this.svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, p.y]; };
      const vx = tx - x, vy = ty - y, L2 = vx * vx + vy * vy;
      const set = nt => { t = Math.max(t, Math.min(1, nt)); c.cue.setAttribute('cx', x + vx * t); c.cue.setAttribute('cy', y + vy * t); c.hit.setAttribute('cx', x + vx * t); c.hit.setAttribute('cy', y + vy * t); onMove(t); };
      const finish = async () => {
        if (finished) return; finished = true; c.hit.remove(); c.cue.remove(); window.removeEventListener('pointermove', mv);
        const from = t, t0 = performance.now(), D = T(900 * (1 - from) + 100);
        await new Promise(r2 => { const st = now => { const k = Math.min(1, (now - t0) / D); onMove(from + (1 - from) * (1 - (1 - k) ** 3)); k < 1 ? requestAnimationFrame(st) : r2(); }; requestAnimationFrame(st); });
        A.tapNote(); res();
      };
      const mv = e => { if (!active) return; const [px, py] = toLocal(e); set(((px - x) * vx + (py - y) * vy) / L2); if (t > .92) finish(); };
      c.hit.addEventListener('pointerdown', e => { e.preventDefault(); active = true; start = performance.now(); try { c.hit.setPointerCapture(e.pointerId); } catch {} });
      window.addEventListener('pointermove', mv);
      c.hit.addEventListener('pointerup', () => { if (!active) return; active = false; if (performance.now() - start < 260 || t > .5) finish(); });
      c.hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') finish(); });
      focusSoon(c.hit);
      if (AUTO) setTimeout(finish, 280);
    });
  }
}
Pane.all = [];

function focusSoon(h) { setTimeout(() => { if (h.isConnected && document.activeElement && document.activeElement !== document.body && document.activeElement.classList?.contains('hit') === false) return; if (h.isConnected && Pane.keyboard) h.focus({ preventScroll: true }); }, 30); }
addEventListener('keydown', e => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') Pane.keyboard = true; });

// a one-time visual hint of "touch here": an expanding hairline ripple, twice
function ripple(p, x, y, r, white) {
  for (let i = 0; i < 2; i++) {
    const c = el('circle', { cx: x, cy: y, r: r * .4, fill: 'none', stroke: white ? '#f2efe8' : '#1c1b19', 'stroke-width': 1.2, opacity: 0, 'pointer-events': 'none' }, p.ui);
    c.animate([{ r: r * .4, opacity: .8 }, { r: r * 1.8, opacity: 0 }], { duration: 1500, delay: 600 + i * 900, easing: 'ease-out' }).finished.then(() => c.remove());
  }
}

// one rAF loop for every pane's weather
let last = performance.now();
function loop(now) { const dt = Math.min(50, now - last) / 16.7; last = now; for (const p of Pane.all) p.tickWeather(dt); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
// boil the lines: change turbulence seed a few times a second
let s = 1;
setInterval(() => { s = (s % 4) + 1; for (const p of Pane.all) p.turb.setAttribute('seed', s); }, 150);
