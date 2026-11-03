// Pure-math brush strokes: centre points -> smooth dense polyline -> tapered filled outline.
// No DOM measuring, so figures can be re-posed every frame.
const f = n => Math.round(n * 10) / 10;

export function sample(pts, closed = false, per = 7) {
  const n = pts.length;
  if (n < 2) return pts.slice();
  if (n === 2) { const out = []; for (let i = 0; i <= per; i++) { const t = i / per; out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]); } return out; }
  const out = [], segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const q = j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  out.push(closed ? pts[0] : pts[n - 1]);
  return out;
}

// w: nominal width. o.a / o.b: fraction of length used to swell in / taper out. o.min: thinnest ratio.
// o.ph, o.amp: fixed pressure wobble (fixed per stroke, never re-rolled per frame)
export function outline(P, w, o = {}) {
  const n = P.length - 1;
  if (n < 1) return '';
  const { a = .12, b = .4, min = .16, ph = 0, amp = .15, closed = false } = o;
  // cumulative length so the profile follows distance, not sample index
  const L = [0]; for (let i = 1; i <= n; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = L[n] || 1;
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = L[i] / tot, A = P[Math.max(0, i - 1)], B = P[Math.min(n, i + 1)];
    let dx = B[0] - A[0], dy = B[1] - A[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const prof = closed ? .75 + .25 * Math.sin(Math.PI * t) : Math.min(1, t / a) ** .7 * Math.min(1, (1 - t) / b) ** .85;
    const hw = w * .55 * (min + (1 - min) * prof) * (1 + amp * Math.sin(ph + t * 8.5));
    left.push([P[i][0] - dy * hw, P[i][1] + dx * hw]); right.push([P[i][0] + dy * hw, P[i][1] - dx * hw]);
  }
  const pts = left.concat(right.reverse());
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${f(pts[i][0])},${f(pts[i][1])}`;
  return d + 'Z';
}
export function centre(P) { let d = `M${f(P[0][0])},${f(P[0][1])}`; for (let i = 1; i < P.length; i++) d += `L${f(P[i][0])},${f(P[i][1])}`; return d; }
