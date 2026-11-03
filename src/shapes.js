// Line drawings. Each function returns strokes [{p, c, w, o}] already placed in
// the pane (no scale transforms, so line weight stays even).
import { arc, rand } from './engine.js';

const tf = (x, y, s = 1, fl = 1) => ([px, py]) => [x + px * s * fl, y + py * s];
const put = (strokes, x, y, s = 1, flip = false) => {
  const t = tf(x, y, s, flip ? -1 : 1);
  return strokes.map(k => ({ ...k, p: k.p.map(t) }));
};

// ---------- people ----------
// faceless; hair tells them apart. kind: adult | child | old | teen
export function person(x, y, o = {}) {
  const { h = 300, kind = 'adult', hair = 'long', pose = 'stand', flip = false, arm = 'down' } = o;
  const C = kind === 'child', O = kind === 'old', TE = kind === 'teen';
  const ry = h * (C ? .125 : TE ? .095 : .083), rx = ry * .8;
  const hy = -h + ry + (O ? h * .03 : 0), hx = O ? h * .03 : 0;
  const nb = hy + ry + h * .04;              // neck base
  const sw = h * (C ? .19 : .16);             // shoulder half width
  const hem = -h * (C ? .3 : .27);
  const S = [];
  S.push({ p: arc(hx, hy, rx, ry, 112, 428, 20) });                        // head, open at the neck
  S.push({ p: [[hx - rx * .35, hy + ry * .92], [hx - rx * .38, nb]], w: 1.8 });
  S.push({ p: [[hx + rx * .35, hy + ry * .92], [hx + rx * .38, nb]], w: 1.8 });
  // shoulders down into the coat
  const side = sg => [[hx + sg * rx * .38, nb], [sg * sw * .55, nb + h * .02], [sg * sw * .9, nb + h * .055], [sg * sw, nb + h * .13], [sg * sw * 1.02, nb + h * .3], [sg * sw * 1.06, hem]];
  if (pose === 'bust') {
    S.push({ p: side(-1).slice(0, 5).concat([[-sw * 1.04, 0]]) });
    S.push({ p: side(1).slice(0, 5).concat([[sw * 1.04, 0]]) });
  } else {
    S.push({ p: side(-1) }); S.push({ p: side(1) });
    S.push({ p: [[-sw * 1.06, hem], [0, hem + 3], [sw * 1.06, hem]], w: 1.4, o: .7 });
    // arms as inner lines
    const armL = arm === 'reachL' || arm === 'reach'
      ? [[-sw * .85, nb + h * .06], [-sw * 1.5, nb + h * .2], [-sw * 2.05, nb + h * .3]]
      : arm === 'up' ? [[-sw * .85, nb + h * .06], [-sw * 1.25, nb - h * .1], [-sw * 1.2, nb - h * .25]]
      : [[-sw * .8, nb + h * .07], [-sw * .84, nb + h * .25], [-sw * .74, nb + h * .38]];
    const armR = arm === 'reachR' || arm === 'reach'
      ? [[sw * .85, nb + h * .06], [sw * 1.5, nb + h * .2], [sw * 2.05, nb + h * .3]]
      : arm === 'cup' ? [[sw * .8, nb + h * .07], [sw * .95, nb + h * .2], [sw * .5, nb + h * .26]]
      : [[sw * .8, nb + h * .07], [sw * .84, nb + h * .25], [sw * .74, nb + h * .38]];
    S.push({ p: armL, w: 1.8 }); S.push({ p: armR, w: 1.8 });
    // legs
    const ls = h * .05;
    if (pose === 'walk0' || pose === 'walk1') {
      const k = pose === 'walk0' ? 1 : -1;
      S.push({ p: [[-ls, hem], [-ls - k * h * .03, hem * .5], [-ls - k * h * .07, 0]], w: 1.9, leg: 1 });
      S.push({ p: [[ls, hem], [ls + k * h * .03, hem * .5], [ls + k * h * .07, 0]], w: 1.9, leg: 1 });
    } else if (pose === 'sit') {
      S.push({ p: [[-ls, hem], [-ls - h * .01, hem * .45], [-ls, 0]], w: 1.9, leg: 1 });
      S.push({ p: [[ls, hem], [ls + h * .01, hem * .45], [ls, 0]], w: 1.9, leg: 1 });
    } else {
      S.push({ p: [[-ls, hem], [-ls * 1.05, hem * .5], [-ls * 1.1, 0], [-ls * 2.1, 1]], w: 1.9, leg: 1 });
      S.push({ p: [[ls, hem], [ls * 1.05, hem * .5], [ls * 1.1, 0], [ls * 2.1, 1]], w: 1.9, leg: 1 });
    }
    if (O) S.push({ p: [[sw * 1.25, nb + h * .3], [sw * 1.35, nb + h * .6], [sw * 1.42, 0]], w: 1.7 }); // cane
  }
  // hair
  if (hair === 'long') {
    S.push({ p: [[hx - rx * .1, hy - ry], [hx - rx * .6, hy - ry * .7], [hx - rx * 1.05, hy], [hx - rx * 1.15, hy + ry * .9], [hx - rx * 1.5, nb + h * .06]], w: 1.7 });
    S.push({ p: [[hx + rx * .2, hy - ry * .98], [hx + rx * .95, hy - ry * .4], [hx + rx * 1.12, hy + ry * .5], [hx + rx * 1.3, hy + ry * 1.3], [hx + rx * 1.6, nb + h * .07]], w: 1.7 });
  } else if (hair === 'short') {
    S.push({ p: [[hx - rx * .95, hy - ry * .1], [hx - rx * .8, hy - ry * .7], [hx, hy - ry * 1.08], [hx + rx * .8, hy - ry * .72], [hx + rx * .98, hy - ry * .1]], w: 2.2 });
    S.push({ p: [[hx - rx, hy + ry * .05], [hx - rx * 1.22, hy + ry * .15], [hx - rx * 1.1, hy + ry * .45]], w: 1.5 });
    S.push({ p: [[hx + rx, hy + ry * .05], [hx + rx * 1.22, hy + ry * .15], [hx + rx * 1.1, hy + ry * .45]], w: 1.5 });
  } else if (hair === 'bun') {
    S.push({ p: arc(hx + rx * .2, hy - ry * 1.15, rx * .45, ry * .35, 0, 360, 40), c: true, w: 1.6 });
    S.push({ p: [[hx - rx * .9, hy - ry * .3], [hx - rx * .5, hy - ry * .9], [hx + rx * .3, hy - ry]], w: 1.4 });
  } else if (hair === 'grey') {
    S.push({ p: [[hx - rx * .9, hy - ry * .2], [hx - rx * .4, hy - ry * .9], [hx + rx * .5, hy - ry * .85], [hx + rx * .95, hy - ry * .2]], w: 1.2, o: .6 });
  }
  const part = o.part || 'all';
  return put(S.filter(k => part === 'all' || (part === 'legs') === !!k.leg), x, y, 1, flip);
}

export function baby(x, y, s = 1) {
  return put([
    { p: arc(0, -34, 22, 20, 0, 360, 30), c: true },
    { p: [[-24, -18], [-40, 6], [-38, 46], [-10, 70], [26, 62], [40, 30], [32, -4], [20, -16]] },
    { p: [[-30, 10], [-6, 22], [28, 14]], w: 1.4, o: .7 },
  ], x, y, s);
}
export function hand(x, y, s = 1, flip = false) { // an adult index finger offered from the edge
  const tip = arc(-6, 0, 12, 12, -90, 90, 30);
  return put([
    { p: [[-300, -20], [-200, -18], [-90, -14], [-20, -12]].concat(tip).concat([[-30, 12], [-110, 16], [-190, 22]]), w: 2 },
    { p: [[-190, 22], [-140, 30], [-112, 44], [-118, 62], [-160, 66], [-300, 64]], w: 2 },
    { p: [[-24, -7], [-9, -8], [-6, 1]], w: 1.2, o: .7 },
    { p: [[-150, -16], [-146, -6]], w: 1.1, o: .6 },
  ], x, y, s, flip);
}
export function tinyHand(x, y, s = 1, flip = false) { // small fingers closing over the finger
  return put([
    { p: [[-22, 16], [-24, -4], [-20, -22], [-12, -24], [-8, -14]], w: 1.8 },
    { p: [[-8, -18], [-4, -26], [4, -25], [6, -14]], w: 1.8 },
    { p: [[6, -20], [11, -26], [18, -22], [18, -10]], w: 1.8 },
    { p: [[-22, 16], [-6, 22], [12, 20], [18, 14]], w: 1.6 },
  ], x, y, s, flip);
}
export function dog(x, y, s = 1, flip = false, look = 'up') {
  const head = look === 'up' ? [22, -92] : [30, -80];
  const [hx, hy] = head;
  return put([
    { p: arc(hx, hy, 14, 12, 150, 470, 30) },
    { p: [[hx + 12, hy - 6], [hx + 24, hy - 12], [hx + 27, hy - 6], [hx + 16, hy + 2]] },
    { p: [[hx - 7, hy - 8], [hx - 14, hy + 4], [hx - 12, hy + 16], [hx - 6, hy + 13]], w: 1.8 },
    { p: [[hx - 12, hy + 10], [0, -64], [-14, -46], [-26, -24], [-30, -8], [-20, 0]] },
    { p: [[hx + 6, hy + 11], [30, -56], [27, -28], [27, 0]] },
    { p: [[17, -40], [16, -14], [15, 0]], w: 1.7 },
    { p: [[-24, -26], [-10, -30], [0, -16], [4, 0]], w: 1.7 },
    { p: [[11, 0], [33, 0]], w: 1.6 },
    { p: [[-28, -7], [-42, -10], [-52, -20]], w: 1.7 },
  ], x, y, s, flip);
}
export function dogLying(x, y, s = 1, flip = false) {
  return put([
    { p: arc(34, -24, 13, 11, 160, 480, 30) },
    { p: [[44, -28], [58, -24], [56, -16], [46, -14]] },
    { p: [[27, -32], [20, -20], [24, -10]], w: 1.7 },
    { p: [[22, -30], [0, -36], [-30, -32], [-50, -18], [-52, -2]] },
    { p: [[-52, 0], [-10, 2], [30, 0], [62, -2]] },
    { p: [[-52, -4], [-66, -2], [-74, 4]], w: 1.6 },
  ], x, y, s, flip);
}

// ---------- places & things ----------
export function ground(y, x0 = -700, x1 = 1500, n = 8, amp = 6) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y + Math.sin(i * 1.7) * amp]);
  return [{ p: pts, w: 1.8 }];
}
function _house(x, y, s = 1, snow = true) {
  const S = [
    { p: [[-80, 0], [-80, -110], [80, -110], [80, 0]] },
    { p: [[-100, -100], [0, -190], [100, -100]] },
    { p: [[-30, -76], [30, -76], [30, -30], [-30, -30], [-30, -76]], w: 1.7 },
    { p: [[0, -76], [0, -30]], w: 1.2, o: .7 },
    { p: [[44, -150], [44, -186], [64, -186], [64, -132]], w: 1.6 },
  ];
  if (snow) S.push({ p: [[-104, -98], [-60, -132], [-20, -170], [0, -194], [30, -170], [70, -134], [106, -98]], w: 4.5, o: .12 });
  return put(S, x, y, s);
}
function _windowGlow(x, y, s = 1) { return put([{ p: [[-28, -74], [28, -74], [28, -32], [-28, -32]], c: true, fill: '#f0b860', fo: .55, w: .1 }], x, y, s); }
export function sun(x, y, r = 46) { return [{ p: arc(x, y, r, r, 0, 360, 20), c: true, w: 1.8 }]; }
export function sea(y, x0 = -700, x1 = 1500) {
  const S = [{ p: [[x0, y], [x1, y]], w: 1.6 }];
  for (let i = 0; i < 9; i++) { const wx = x0 + 120 + rand() * (x1 - x0 - 240), wy = y + 30 + i * 18; S.push({ p: [[wx, wy], [wx + 20, wy - 4], [wx + 40, wy]], w: 1.2, o: .55 }); }
  return S;
}
export function birds(x, y, n = 2) { const S = []; for (let i = 0; i < n; i++) { const bx = x + i * 34, by = y + i * 14; S.push({ p: [[bx - 12, by - 6], [bx, by], [bx + 12, by - 7]], w: 1.4 }); } return S; }
export function ball(x, y) { return [{ p: arc(x, y, 12, 12, 0, 360, 30), c: true, w: 1.7 }, { p: [[x - 10, y - 3], [x, y + 2], [x + 10, y - 4]], w: 1.1 }]; }
function _cap(x, y, s = 1) { return put([{ p: [[-26, 0], [0, -10], [26, 0], [0, 10]], c: true, w: 1.6, fill: '#1c1b19', fo: .85 }, { p: [[0, 0], [16, 8], [18, 22]], w: 1.2 }], x, y, s); }
export function shoes(x, y, s = 1) {
  return put([
    { p: arc(-14, 0, 12, 26, 0, 360, 30), c: true }, { p: arc(16, 6, 12, 26, 0, 360, 30), c: true },
    { p: [[-14, -16], [-30, -40], [-40, -70]], w: 1.3 }, { p: [[-14, -16], [0, -46], [8, -80]], w: 1.3 },
    { p: [[16, -10], [30, -44], [44, -66]], w: 1.3 },
  ], x, y, s);
}
function _books(x, y, s = 1) {
  return put([
    { p: [[-50, 0], [50, 0], [50, -18], [-50, -18]], c: true },
    { p: [[-44, -18], [46, -18], [46, -34], [-44, -34]], c: true },
    { p: [[-52, -34], [40, -34], [40, -52], [-52, -52]], c: true },
    { p: [[-20, -52], [0, -78], [30, -60], [6, -52]], w: 1.4 },
  ], x, y, s);
}
function _suitcase(x, y, s = 1) { return put([{ p: [[-40, 0], [40, 0], [40, -60], [-40, -60]], c: true }, { p: [[-14, -60], [-14, -74], [14, -74], [14, -60]], w: 1.7 }, { p: [[-40, -30], [40, -30]], w: 1.1, o: .6 }], x, y, s); }
export function path(x0, y0, x1, y1, bend = 40) { return [{ p: [[x0, y0], [(x0 + x1) / 2 + bend, (y0 + y1) / 2], [x1, y1]], w: 1.4, o: .8 }]; }
function _skyline(y, x0 = -600, x1 = 1400) {
  const S = []; let x = x0;
  while (x < x1) { const w = 50 + rand() * 90, h = 140 + rand() * 260; S.push({ p: [[x, y], [x, y - h], [x + w, y - h], [x + w, y]], w: 1.5, o: .8 }); x += w + 6 + rand() * 20; }
  return S;
}
export function lamp(x, y) { return [{ p: [[x, y], [x, y - 300], [x + 30, y - 320], [x + 50, y - 312]], w: 1.8 }, { p: [[x + 40, y - 312], [x + 62, y - 312], [x + 51, y - 296]], c: true, w: 1.5 }]; }
export function umbrella(x, y, s = 1) { return put([{ p: arc(0, 0, 80, 46, 180, 360, 15) }, { p: [[-80, 0], [-54, -6], [-27, 2], [0, -6], [27, 2], [54, -6], [80, 0]], w: 1.6 }, { p: [[0, -46], [0, 120], [10, 132], [18, 124]], w: 1.7 }], x, y, s); }
export function hat(x, y, s = 1) { return put([{ p: [[-40, 0], [-20, -4], [20, -4], [40, 0], [20, 6], [-20, 6]], c: true, w: 1.7 }, { p: [[-20, -4], [-16, -26], [16, -26], [20, -4]], w: 1.7 }], x, y, s); }
export function swing(x, top, len, seatW = 54) { return [{ p: [[x - seatW / 2, top], [x - seatW / 2, top + len]], w: 1.2 }, { p: [[x + seatW / 2, top], [x + seatW / 2, top + len]], w: 1.2 }, { p: [[x - seatW / 2 - 6, top + len], [x + seatW / 2 + 6, top + len]], w: 2.4 }]; }
function _clothesline(y, x0 = -600, x1 = 1400) { return [{ p: [[x0, y], [(x0 + x1) / 2, y + 26], [x1, y]], w: 1.3 }]; }
function _polaroid(x, y, s = 1, rot = 0) {
  const r = rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
  const R = ([px, py]) => [px * c - py * sn, px * sn + py * c];
  return put([
    { p: [[-50, 0], [50, 0], [50, 120], [-50, 120]].map(R), c: true, w: 1.6, fill: '#fbfaf6', fo: 1 },
    { p: [[-42, 8], [42, 8], [42, 92], [-42, 92]].map(R), c: true, w: 1.1, o: .8 },
    { p: [[-8, -14], [-8, 8], [8, 8], [8, -14]].map(R), c: true, w: 1.3 },
  ], x, y, s);
}
function _table(x, y, w = 260) { return [{ p: [[x - w / 2, y], [x + w / 2, y]], w: 2 }, { p: [[x - w / 2 + 20, y], [x - w / 2 + 26, y + 150]], w: 1.7 }, { p: [[x + w / 2 - 20, y], [x + w / 2 - 26, y + 150]], w: 1.7 }]; }
export function cup(x, y) { return [{ p: [[x - 16, y - 34], [x - 13, y - 4], [x + 13, y - 4], [x + 16, y - 34]], w: 1.7 }, { p: [[x + 15, y - 28], [x + 26, y - 26], [x + 25, y - 14], [x + 14, y - 12]], w: 1.4 }, { p: [[x - 22, y], [x + 22, y]], w: 1.3 }]; }
export function steam(x, y) { return [{ p: [[x - 4, y - 44], [x + 4, y - 60], [x - 4, y - 76], [x + 4, y - 92]], w: 1.2, o: .7 }, { p: [[x + 6, y - 46], [x + 13, y - 62], [x + 6, y - 78]], w: 1.1, o: .5 }]; }
function _door(x, y, open = false) {
  const S = [{ p: [[x - 55, y], [x - 55, y - 230], [x + 55, y - 230], [x + 55, y]], w: 2 }];
  if (open) for (let i = -2; i <= 2; i++) S.push({ p: [[x + i * 18, y - 100], [x + i * 46, y + 60]], w: 1.1, o: .45 });
  else S.push({ p: arc(x + 38, y - 112, 4, 4, 0, 360, 60), c: true, w: 1.5 });
  return S;
}
function _doorLight(x, y) { return [{ p: [[x - 52, y - 2], [x - 52, y - 227], [x + 52, y - 227], [x + 52, y - 2]], c: true, fill: '#f3c47a', fo: .5, w: .1 }]; }
function _chair(x, y, flip = false) { return put([{ p: [[0, 0], [0, -80], [50, -80], [50, 0]], w: 1.7 }, { p: [[0, -80], [-6, -190]], w: 1.7 }], x, y, 1, flip); }
export function clock(x, y, r = 40) { return [{ p: arc(x, y, r, r, 0, 360, 15), c: true, w: 1.7 }]; }
function _desk(x, y) { return [{ p: [[x - 150, y], [x + 150, y]], w: 2 }, { p: [[x - 130, y], [x - 130, y + 140]], w: 1.6 }, { p: [[x + 130, y], [x + 130, y + 140]], w: 1.6 }]; }
function _papers(x, y, n = 4) { const S = []; for (let i = 0; i < n; i++) S.push({ p: [[x - 40, y - i * 9], [x + 40, y - i * 9 - 2]], w: 1.4 }); return S; }
function _phone(x, y) { return [{ p: [[x - 14, y], [x + 14, y], [x + 14, y - 46], [x - 14, y - 46]], c: true, w: 1.6 }, { p: [[x - 4, y - 6], [x + 4, y - 6]], w: 1.2 }]; }
export function buzz(x, y) { return [{ p: [[x - 26, y - 40], [x - 34, y - 24], [x - 26, y - 8]], w: 1.2 }, { p: [[x + 26, y - 40], [x + 34, y - 24], [x + 26, y - 8]], w: 1.2 }]; }
function _bed(x, y, w = 340) { return [{ p: [[x - w / 2, y], [x + w / 2, y]], w: 2 }, { p: [[x - w / 2, y - 60], [x - w / 2, y + 90]], w: 2 }, { p: [[x + w / 2, y - 30], [x + w / 2, y + 90]], w: 2 }, { p: [[x - w / 2 + 14, y - 8], [x - w / 2 + 30, y - 34], [x - w / 2 + 80, y - 34], [x - w / 2 + 90, y - 8]], w: 1.4 }]; }
export function sleeper(x, y, w = 340, hair = 'grey') {
  const hx = x - w / 2 + 62, hy = y - 46;
  const S = [{ p: arc(hx, hy, 20, 18, 0, 360, 20), c: true }, { p: [[hx + 26, y - 30], [x - 20, y - 54], [x + 70, y - 50], [x + w / 2 - 20, y - 26], [x + w / 2 - 8, y - 6]] }];
  if (hair === 'grey') S.push({ p: [[hx - 16, hy - 10], [hx - 2, hy - 20], [hx + 14, hy - 14]], w: 1.2, o: .6 });
  return S;
}
export function armOnBed(x, y, len = 70) { return [{ p: [[x, y], [x + len * .6, y + 8], [x + len, y + 6]], w: 1.8 }]; }
export function monitorLine(x0, x1, y, beat = true) {
  const p = [[x0, y]];
  if (beat) { const m = (x0 + x1) / 2; p.push([m - 30, y], [m - 18, y - 10], [m - 8, y + 6], [m, y - 60], [m + 10, y + 40], [m + 22, y], [x1, y]); } else p.push([x1, y]);
  return [{ p, w: 1.6, j: .2 }];
}
export function headlights(x, y) { return [{ p: arc(x - 40, y, 14, 14, 0, 360, 30), c: true, w: 1.8 }, { p: arc(x + 40, y, 14, 14, 0, 360, 30), c: true, w: 1.8 }]; }
export function footprint(x, y, s = 1, rot = 0) { return put([{ p: arc(0, 0, 6, 12, 0, 360, 40), c: true, w: 1.3 }], x, y, s).map(k => ({ ...k, rot })); }
export function breath(x, y, s = 1, flip = false) { return put([{ p: [[0, 0], [10, -6], [22, -2], [26, -14], [38, -16], [42, -6], [36, 2]], w: 1.2, o: .6 }], x, y, s, flip); }
export function tree(x, y, s = 1) { return put([{ p: [[0, 0], [2, -90], [-4, -170]], w: 2 }, { p: [[0, -100], [40, -150], [64, -170]], w: 1.6 }, { p: [[-2, -130], [-40, -170], [-50, -200]], w: 1.4 }, { p: [[-4, -170], [10, -210], [6, -240]], w: 1.3 }], x, y, s); }
function _bench(x, y) { return [{ p: [[x - 90, y - 50], [x + 90, y - 50]], w: 2 }, { p: [[x - 80, y - 50], [x - 80, y]], w: 1.6 }, { p: [[x + 80, y - 50], [x + 80, y]], w: 1.6 }, { p: [[x - 90, y - 90], [x + 90, y - 90]], w: 1.6 }]; }
function _frame(x, y, w, h) { return [{ p: [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], c: true, w: 1.6 }, { p: [[x, y - h / 2], [x, y + h / 2]], w: 1.1, o: .6 }]; }
export const house = (...a) => _house(...a).map(k => ({ ...k, l: 1 }));
export const windowGlow = (...a) => _windowGlow(...a).map(k => ({ ...k, l: 1 }));
export const cap = (...a) => _cap(...a).map(k => ({ ...k, l: 1 }));
export const books = (...a) => _books(...a).map(k => ({ ...k, l: 1 }));
export const suitcase = (...a) => _suitcase(...a).map(k => ({ ...k, l: 1 }));
export const skyline = (...a) => _skyline(...a).map(k => ({ ...k, l: 1 }));
export const polaroid = (...a) => _polaroid(...a).map(k => ({ ...k, l: 1 }));
export const table = (...a) => _table(...a).map(k => ({ ...k, l: 1 }));
export const door = (...a) => _door(...a).map(k => ({ ...k, l: 1 }));
export const doorLight = (...a) => _doorLight(...a).map(k => ({ ...k, l: 1 }));
export const chair = (...a) => _chair(...a).map(k => ({ ...k, l: 1 }));
export const desk = (...a) => _desk(...a).map(k => ({ ...k, l: 1 }));
export const papers = (...a) => _papers(...a).map(k => ({ ...k, l: 1 }));
export const phone = (...a) => _phone(...a).map(k => ({ ...k, l: 1 }));
export const bed = (...a) => _bed(...a).map(k => ({ ...k, l: 1 }));
export const frame = (...a) => _frame(...a).map(k => ({ ...k, l: 1 }));
export const bench = (...a) => _bench(...a).map(k => ({ ...k, l: 1 }));
export const clothesline = (...a) => _clothesline(...a).map(k => ({ ...k, l: 1 }));
