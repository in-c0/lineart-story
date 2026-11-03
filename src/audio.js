// Procedural score and sound. Slow, steady piano that thickens with the life
// and opens fully at the golden hour. No samples, nothing licensed.
let ac, master, lp, musicBus, sfxBus, verbIn, noiseBuf;
let level = 0, target = 0, step = 0, nextT = 0, timer = null, melodyNote = 64, chordIdx = 0;
const loops = {};
export let ready = false;

const BPM = 62, EIGHTH = 60 / BPM / 2;
// E major: Emaj7 · G#m7 · C#m7 · Aadd9 — two bars each
const CHORDS = [
  { bass: 40, v: [52, 56, 59, 63] },
  { bass: 44, v: [54, 56, 59, 63] },
  { bass: 37, v: [52, 56, 59, 61] },
  { bass: 45, v: [52, 57, 59, 61] },
];
const PENTA = [64, 66, 68, 71, 73, 76, 78, 80];

export function init() {
  if (ac) { ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = .85; master.connect(ac.destination);
  lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = .3; lp.connect(master);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(lp);
  const verb = ac.createConvolver(); verb.buffer = impulse(3.6, 2.4);
  const wet = ac.createGain(); wet.gain.value = .42; verb.connect(wet); wet.connect(comp);
  verbIn = verb;
  musicBus = ac.createGain(); musicBus.gain.value = .9; musicBus.connect(comp); musicBus.connect(verb);
  sfxBus = ac.createGain(); sfxBus.gain.value = .8; sfxBus.connect(comp); sfxBus.connect(verb);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  nextT = ac.currentTime + .1;
  timer = setInterval(schedule, 30);
  ready = true;
}
function impulse(sec, decay) {
  const len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay; }
  return b;
}
const hz = m => 440 * 2 ** ((m - 69) / 12);

// a soft felt-piano voice
function piano(m, t, vel = .2, len = 3, bus = musicBus) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + .012);
  g.gain.exponentialRampToValueAtTime(vel * .32, t + .35);
  g.gain.exponentialRampToValueAtTime(.0001, t + len);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900 + vel * 5000 + (m > 70 ? 800 : 0); f.connect(bus);
  g.connect(f);
  [[1, 1], [2, .38], [3, .12], [4.02, .05]].forEach(([k, a]) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m) * k; o.detune.value = (Math.random() - .5) * 6;
    const pg = ac.createGain(); pg.gain.value = a; o.connect(pg); pg.connect(g); o.start(t); o.stop(t + len + .05);
  });
}
function pad(ch, t, dur, vel) {
  const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur + .8);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; g.connect(f); f.connect(musicBus);
  ch.v.forEach(m => [-4, 4].forEach(dt => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = dt; o.connect(g); o.start(t); o.stop(t + dur + 1); }));
}

function schedule() {
  if (!ac) return;
  // ease level toward target, one eighth at a time
  while (nextT < ac.currentTime + .15) {
    level += (target - level) * .04;
    const bar = Math.floor(step / 8), pos = step % 8;
    chordIdx = Math.floor(bar / 2) % CHORDS.length;
    const ch = CHORDS[chordIdx], t = nextT, L = level;
    if (pos === 0 && bar % 2 === 0) {
      if (L > .15) piano(ch.bass, t, .16 + L * .05, 5);
      if (L > 2.6) { piano(ch.bass - 12, t, .1 + (L - 2.6) * .06, 6); pad(ch, t, EIGHTH * 16, .012 + (L - 2.6) * .012); }
    }
    if (pos === 0 && L > .6 && L <= 1.4 && bar % 2 === 0) ch.v.forEach((m, i) => piano(m, t + i * .03, .05, 4));
    if (L > 1.4) {
      const arp = [ch.v[0], ch.v[2], ch.v[3], ch.v[1] + 12, ch.v[3], ch.v[2], ch.v[1], ch.v[2]];
      const v = .045 + Math.min(L - 1.4, 2) * .02;
      piano(arp[pos], t, v * (pos === 0 ? 1.3 : 1), 2.6);
      if (L > 3.2 && pos % 2 === 1) piano(arp[pos] + 12, t, v * .45, 2);
    }
    if (L > 2.3 && pos % 2 === 0 && Math.random() < (L > 3.3 ? .62 : .42)) {
      const tones = ch.v.map(m => m + 12);
      const tgt = pos === 0 ? tones[Math.floor(Math.random() * tones.length)] : PENTA[Math.max(0, Math.min(PENTA.length - 1, PENTA.indexOf(nearest(melodyNote)) + (Math.random() < .5 ? -1 : 1)))];
      melodyNote = tgt;
      piano(melodyNote, t + (Math.random() * .02), .07 + (L - 2.3) * .03, 3.4);
    }
    nextT += EIGHTH; step++;
  }
}
const nearest = m => PENTA.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a);

// 0 silence · 1 sparse · 2 arpeggio · 3 melody · 4 golden hour
export function music(l) { target = l; }
export function tapNote(vel = .05) {
  if (!ac) return;
  const ch = CHORDS[chordIdx]; const m = ch.v[Math.floor(Math.random() * 4)] + 24;
  piano(m, ac.currentTime + .01, vel, 3, sfxBus);
}
export function chord(vel = .12) { if (!ac) return; const ch = CHORDS[chordIdx]; ch.v.forEach((m, i) => piano(m + 12, ac.currentTime + i * .07, vel, 5, sfxBus)); }
export function note(m, vel = .14, len = 3) { if (ac) piano(m, ac.currentTime + .01, vel, len, sfxBus); }

export function darkness(k, sec = 2) {
  if (!ac) return;
  const f = k ? 520 : 16000;
  lp.frequency.cancelScheduledValues(ac.currentTime);
  lp.frequency.setValueAtTime(lp.frequency.value, ac.currentTime);
  lp.frequency.exponentialRampToValueAtTime(f, ac.currentTime + Math.max(.05, sec));
}

function noise({ type = 'lowpass', freq = 800, q = .7, gain = .03, lfo = 0, lfoAmt = 0 }) {
  const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(sfxBus); src.start();
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 2);
  let o;
  if (lfo) { o = ac.createOscillator(); o.frequency.value = lfo; const og = ac.createGain(); og.gain.value = lfoAmt; o.connect(og); og.connect(g.gain); o.start(); }
  return { src, g, o };
}
function loop(name, on, opts) {
  if (!ac) return;
  if (on && !loops[name]) loops[name] = noise(opts);
  if (!on && loops[name]) { const l = loops[name]; delete loops[name]; l.g.gain.cancelScheduledValues(ac.currentTime); l.g.gain.setValueAtTime(l.g.gain.value, ac.currentTime); l.g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5); setTimeout(() => { l.src.stop(); l.o && l.o.stop(); }, 1700); }
}
export const wind = on => loop('wind', on, { freq: 420, gain: .022, lfo: .13, lfoAmt: .012 });
export const rain = on => loop('rain', on, { type: 'highpass', freq: 2600, gain: .02 });
export const sea = on => loop('sea', on, { freq: 650, gain: .03, lfo: .09, lfoAmt: .025 });
export const radio = on => loop('radio', on, { type: 'bandpass', freq: 2400, q: .5, gain: .045, lfo: 7.3, lfoAmt: .03 });
export const office = on => loop('office', on, { type: 'bandpass', freq: 180, q: 1.2, gain: .05 });

export function heartbeat(vel = .5) {
  if (!ac) return;
  [0, .2].forEach((dt, i) => {
    const t = ac.currentTime + dt, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + .18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * (i ? .6 : 1), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .3);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .35);
  });
}
export function beep() { if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 988; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .3); }
export function tick() { if (!ac) return; const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; const g = ac.createGain(); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + .05); }
export function shutter() { if (!ac) return; tick(); setTimeout(tick, 70); }
export function ring(times = 3) {
  if (!ac) return;
  for (let k = 0; k < times; k++) for (let i = 0; i < 10; i++) {
    const t = ac.currentTime + k * 1.6 + i * .06, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = i % 2 ? 1320 : 1100; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.025, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .055);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .07);
  }
}
export function crash() {
  if (!ac) return;
  const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + 1.4);
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.14, t + 1.4); g.gain.setValueAtTime(.0001, t + 1.42);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 1.5);
}
export function creak() {
  if (!ac) return;
  const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 14; f.frequency.setValueAtTime(620 + Math.random() * 120, t); f.frequency.linearRampToValueAtTime(760 + Math.random() * 160, t + .32);
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + .38);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + .4);
}
export function footstep(snow = true) {
  if (!ac) return;
  const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = snow ? 'bandpass' : 'lowpass'; f.frequency.value = snow ? 1500 + Math.random() * 500 : 500; f.Q.value = .8;
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(snow ? .035 : .02, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + (snow ? .16 : .08));
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + .2);
}
