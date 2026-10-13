// Math, easing, noise, colour and geometry helpers shared by every module.

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeIn = (t) => t * t;
export const easeOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const TAU = Math.PI * 2;

export const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
export const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
export const mul = (p, s) => [p[0] * s, p[1] * s];
export const lerp2 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t)];
export const len = (p) => Math.hypot(p[0], p[1]);
export const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
export const norm = (p) => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
export const perp = (p) => [-p[1], p[0]];
export const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
export const dir = (a) => [Math.cos(a), Math.sin(a)];
export const angleOf = (p) => Math.atan2(p[1], p[0]);

// Keyframe track. keys: [[t, value, ease?], ...]; value may be a number or an array.
// The ease on a key shapes the segment that *arrives* at that key.
const EASES = { s: smooth, l: (x) => x, o: easeOut, i: easeIn, b: (x) => easeOutBack(x, 1.4), S: smoother };
export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
      const k = (EASES[e || 's'])((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((v, j) => mix(v, v1[j], k));
      return mix(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}

// Damped spring step response: 0 before t0, settles to 1 with overshoot.
export function spring(t, t0, freq = 3, damp = 0.35) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = TAU * freq, wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + (damp / Math.sqrt(1 - damp * damp)) * Math.sin(wd * x));
}

// Decaying oscillation kick (for wobble after an impact), 0 before t0.
export function wobble(t, t0, freq = 4, decay = 4) {
  const x = t - t0;
  if (x <= 0) return 0;
  return Math.sin(TAU * freq * x) * Math.exp(-decay * x);
}

// Deterministic string hash → [0,1)
export function hash(...args) {
  let h = 2166136261 >>> 0;
  const s = args.join('|');
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export function ihash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// 1D / 2D smooth value noise in [0,1]
export function vnoise(x, salt = 0) {
  const i = Math.floor(x), f = x - i;
  return mix(ihash(i, salt * 7919 + 13), ihash(i + 1, salt * 7919 + 13), smoother(f));
}
export function vnoise2(x, y, salt = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smoother(x - ix), fy = smoother(y - iy);
  const s = salt * 1013;
  const a = ihash(ix + s, iy), b = ihash(ix + 1 + s, iy), c = ihash(ix + s, iy + 1), d = ihash(ix + 1 + s, iy + 1);
  return mix(mix(a, b, fx), mix(c, d, fx), fy);
}

export function hexMix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(mix((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(mix((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(mix(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

// Catmull-Rom resampling
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
    (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
}
export function smoothClosed(pts, per = 5) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < per; k++) out.push(cr(p0, p1, p2, p3, k / per));
  }
  return out;
}
export function smoothOpen(pts, per = 5) {
  const out = [], n = pts.length;
  if (n < 3) return pts.slice();
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) out.push(cr(p0, p1, p2, p3, k / per));
  }
  out.push(pts[n - 1]);
  return out;
}

// Outline polygon around a polyline with varying width and rounded caps.
export function tube(ctrl, widths, capPts = 4) {
  const pts = smoothOpen(ctrl, 5);
  const n = pts.length;
  const wAt = (i) => {
    const u = (i / (n - 1)) * (widths.length - 1);
    const k = Math.min(widths.length - 2, Math.floor(u));
    return mix(widths[k], widths[k + 1], u - k) / 2;
  };
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const nm = perp(norm(sub(b, a)));
    const w = wAt(i);
    L.push(add(pts[i], mul(nm, w)));
    R.push(sub(pts[i], mul(nm, w)));
  }
  const capEnd = [], capStart = [];
  const tE = norm(sub(pts[n - 1], pts[n - 2])), tS = norm(sub(pts[0], pts[1]));
  const wE = wAt(n - 1), wS = wAt(0);
  for (let k = 1; k < capPts; k++) {
    const a = Math.PI * k / capPts;
    capEnd.push(add(pts[n - 1], add(mul(perp(tE), Math.cos(a) * wE), mul(tE, Math.sin(a) * wE))));
    capStart.push(add(pts[0], add(mul(perp(tS), Math.cos(a) * wS), mul(tS, Math.sin(a) * wS))));
  }
  return L.concat(capEnd, R.reverse(), capStart);
}

export function ellipsePts(cx, cy, rx, ry, n = 24, a0 = 0, rotA = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU;
    const p = rot([Math.cos(a) * rx, Math.sin(a) * ry], rotA);
    out.push([cx + p[0], cy + p[1]]);
  }
  return out;
}

export function polyLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}

// Portion [a,b] (fractions of length) of a polyline.
export function polySlice(pts, a, b) {
  const L = polyLength(pts);
  const s0 = a * L, s1 = b * L;
  const out = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    const e0 = acc, e1 = acc + d;
    if (e1 >= s0 && e0 <= s1) {
      if (!out.length) out.push(lerp2(pts[i - 1], pts[i], d ? clamp((s0 - e0) / d) : 0));
      if (e1 <= s1) out.push(pts[i]);
      else { out.push(lerp2(pts[i - 1], pts[i], d ? clamp((s1 - e0) / d) : 1)); break; }
    }
    acc = e1;
  }
  return out;
}

// Two-bone IK (law of cosines). Returns the middle joint. bend = +1/-1 picks the side.
export function ik2(a, target, l1, l2, bend) {
  const d0 = dist(a, target);
  const d = clamp(d0, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const base = angleOf(sub(target, a));
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = base + bend * Math.acos(cosA);
  const mid = add(a, mul(dir(ang), l1));
  const end = add(a, mul(dir(base), d));
  return { mid, end };
}
