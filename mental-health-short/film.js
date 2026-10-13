// "Someone Stayed" — a 30 s vertical (1080x1920) hand-drawn short about mental health.
// Every frame is painted with p5.brush. Drawings are made "on twos": 12 unique drawings
// per second, each re-inked with one of three boil variants, held for two 24 fps frames.
//
// Story (visual only):
//   0–6s    A person sits alone on a park bench; a storm cloud rains only on them.
//   6–11s   It gets worse: the cloud swells, thoughts tangle, the colour drains away.
//   11–16s  A friend walks in with a yellow umbrella and holds it over them.
//   16–21s  The friend sits and puts an arm around them. The rain stops; the tangle unravels.
//   21–26s  The cloud drifts off, the sun comes through, flowers bloom out of the puddle.
//   26–30s  They sit together, head on shoulder, as birds cross a warm sky.

(() => {
const W = 1080, H = 1920;
const DRAW_FPS = 12;
const DURATION = 30;
const N_DRAWINGS = DRAW_FPS * DURATION;

let D = 0;      // current drawing index
let T = 0;      // current time in seconds
let BOIL = 0;   // line-boil variant (0..2)

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const C = {
  paper: '#f3ead8',
  ink: '#2d2a33',
  inkSoft: '#5a5560',
  skySad: '#b4bcc3', skySad2: '#9aa3ac',
  skyWarm: '#f5d6ae', skyWarm2: '#fbe9c8',
  hillSad: '#9ea8a8', hillWarm: '#9fbb8c',
  hillFarSad: '#b7bec0', hillFarWarm: '#c3d3a6',
  groundSad: '#b3b19e', groundWarm: '#c4cf98',
  sweater: '#7088a6', sweaterDark: '#56698a',
  hairP: '#2f2b35',
  skin: '#f0cfb2', blush: '#e99a8e',
  coat: '#c7663f', coatDark: '#9f4c2f',
  hairF: '#5b3324',
  yellow: '#e8b434', yellowDark: '#c28f1f',
  trousers: '#3b4052',
  shoe: '#2a2730',
  wood: '#8c6a4c', woodDark: '#6d5039',
  iron: '#34363f',
  puddle: '#8ea2b6', puddleWarm: '#e7c58a',
  rain: '#566982',
  cloudDark: '#474b57', cloudLight: '#ecebe6',
  sun: '#f2bf4f', sunGlow: '#f8dc9a',
  stem: '#6a8a52', leaf: '#86a565',
  coral: '#e8846f', pink: '#eea9a0', white: '#f8f3e8', lilac: '#a99ac4',
};

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, s) => [p[0] * s, p[1] * s];
const lerp2 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t)];
const len = (p) => Math.hypot(p[0], p[1]);
const norm = (p) => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

// Piecewise keyframe track with smoothstep easing between keys.
function track(keys, t = T) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const k = smooth((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((v, j) => mix(v, v1[j], k));
      return mix(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}

// Deterministic hash → [0,1)
function hash(...args) {
  let h = 2166136261 >>> 0;
  const s = args.join('|');
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// 1D smooth value noise (independent of p5's global noise state)
function vnoise(x, salt = 0) {
  const i = Math.floor(x), f = x - i;
  return mix(hash('vn', salt, i), hash('vn', salt, i + 1), smooth(f));
}

// Seed p5 + p5.brush randomness per element so each element boils consistently.
function seedEl(id, boil = BOIL) {
  let h = Math.floor(hash(id, boil) * 2147483647);
  randomSeed(h);
}

function hexMix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(mix((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(mix((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(mix(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

// Closed Catmull-Rom resampling for smooth fill polygons.
function smoothClosed(pts, per = 6) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
        (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  return out;
}

function smoothOpen(pts, per = 6) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
        (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[n - 1]);
  return out;
}

// Outline polygon around a polyline ("tube"), with rounded ends. Used for limbs & bodies.
function tube(ctrl, w0, w1, capPts = 4) {
  const pts = smoothOpen(ctrl, 5);
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const tg = norm(sub(b, a)), nm = [-tg[1], tg[0]];
    const w = mix(w0, w1, i / (n - 1)) / 2;
    L.push(add(pts[i], mul(nm, w)));
    R.push(sub(pts[i], mul(nm, w)));
  }
  const capEnd = [], capStart = [];
  const tEnd = norm(sub(pts[n - 1], pts[n - 2])), tStart = norm(sub(pts[0], pts[1]));
  for (let k = 1; k < capPts; k++) {
    const a = Math.PI * k / capPts;
    const nE = [-tEnd[1], tEnd[0]];
    capEnd.push(add(pts[n - 1], add(mul(nE, Math.cos(a) * w1 / 2), mul(tEnd, Math.sin(a) * w1 / 2))));
    const nS = [-tStart[1], tStart[0]];
    capStart.push(add(pts[0], add(mul(nS, Math.cos(a) * w0 / 2), mul(tStart, Math.sin(a) * w0 / 2))));
  }
  return L.concat(capEnd, R.reverse(), capStart);
}

function ellipsePts(cx, cy, rx, ry, n = 24, a0 = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Brush helpers
// ---------------------------------------------------------------------------
const INK_W = 1.0;

function resetBrush() {
  brush.noStroke(); brush.noFill(); brush.noHatch(); brush.noWash(); brush.noField();
}

// Draw a closed shape: optional flat wash, optional watercolour fill, optional pencil outline.
function shape(id, pts, o = {}) {
  seedEl(id);
  resetBrush();
  const dense = o.dense === false ? pts : smoothClosed(pts, o.per || 5);
  if (o.wash) { brush.wash(o.wash, o.washA ?? 235); brush.polygon(dense); brush.noWash(); }
  if (o.fill) {
    brush.fill(o.fill, o.fillA ?? 150);
    brush.fillBleed(o.bleed ?? 0.12);
    brush.fillTexture(o.tex ?? 0.45, o.border ?? 0.35);
    brush.polygon(dense);
    brush.noFill();
  }
  if (o.hatch) {
    brush.hatch(o.hatch.d, o.hatch.a, { rand: 0.15 });
    brush.hatchStyle(o.hatch.brush || 'HB', o.hatch.c || C.ink, o.hatch.w || 0.6);
    brush.polygon(dense);
    brush.noHatch();
  }
  if (o.stroke !== false) {
    brush.set(o.brush || '2B', o.stroke || C.ink, o.w ?? INK_W);
    if (o.wiggle) brush.wiggle(o.wiggle);
    brush.beginShape(o.curv ?? 0.5);
    for (const p of pts) brush.vertex(p[0], p[1]);
    brush.endShape(true);
    brush.noField();
  }
  resetBrush();
}

function line(id, pts, o = {}) {
  seedEl(id);
  resetBrush();
  brush.set(o.brush || '2B', o.c || C.ink, o.w ?? INK_W);
  if (pts.length === 2 && !o.curv) brush.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
  else brush.spline(pts, o.curv ?? 0.5);
  resetBrush();
}

function dot(id, p, r, col, a = 240) {
  seedEl(id);
  resetBrush();
  brush.wash(col, a);
  brush.polygon(ellipsePts(p[0], p[1], r, r, 14));
  resetBrush();
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
function timeline() {
  const t = T;
  return {
    cam: track([
      [0, [540, 800, 1.1]],
      [5.5, [530, 900, 1.1]],
      [10.5, [480, 1005, 1.7]],
      [12.2, [610, 1010, 1.28]],
      [16, [610, 1020, 1.3]],
      [19.2, [585, 1060, 1.55]],
      [21, [590, 1050, 1.5]],
      [25, [590, 905, 1.12]],
      [30, [570, 985, 1.0]],
    ]),
    gloom: track([[0, 0.55], [6, 0.6], [10, 1], [15, 0.9], [19, 0.6], [23, 0.1], [30, 0]]),
    warm: track([[18.5, 0], [25, 1]]),
    cloudDark: track([[0, 0.85], [6, 0.85], [10, 1], [16.5, 1], [19.5, 0.45], [22.5, 0.08], [30, 0]]),
    cloudScale: track([[0, 0.92], [6, 0.98], [10.5, 1.28], [16.5, 1.22], [22, 0.85], [28, 0.5]]),
    cloudPos: track([[0, [450, 570]], [19, [450, 570]], [23, [600, 520]], [30, [1060, 360]]]),
    rain: track([[0, 0.55], [6, 0.65], [10, 1], [16.5, 1], [18.6, 0.25], [19.6, 0]]),
    tangle: track([[0, 0.15], [5.5, 0.3], [10, 1], [16.5, 1]]),
    unravel: track([[16.8, 0], [20.6, 1]]),
    threadFade: track([[20.4, 0], [22.2, 1]]),
    sad: track([[0, 0.82], [6, 0.86], [10, 1], [17.3, 1], [19.6, 0.32], [24, 0.12]]),
    knees: track([[0, 1], [20, 1], [22.6, 0]]),
    eyesOpen: track([[0, 0], [18.6, 0], [19.4, 1]]),
    smile: track([[20.6, 0], [22.6, 1]]),
    lookF: track([[18.8, 0], [20.2, 1]]),
    leanP: track([[24.2, 0], [26.4, 1]]),
    tear: seg(t, 7.4, 9.4),
    fX: track([[11, 1300], [14.6, 765], [16, 765], [17.4, 702]]),
    fWalk: track([[11, 1], [14.3, 1], [14.9, 0]]),
    fTilt: track([[14.6, 0], [15.6, 1]]),
    fSit: track([[15.9, 0], [17.4, 1]]),
    fHug: track([[17.4, 0], [18.9, 1]]),
    umbOpen: track([[21.4, 1], [22.9, 0]]),
    umbLower: track([[22.6, 0], [24.4, 1]]),
    fSmile: track([[18.6, 0], [19.6, 1]]),
    sun: track([[19.6, 0], [24.5, 1]]),
    bloom: seg(t, 20.8, 26.8),
    birds: seg(t, 23.2, 30),
    fadeIn: 1 - seg(t, 0, 0.9),
    fadeOut: seg(t, 29.15, 30),
  };
}

// ---------------------------------------------------------------------------
// World layout
// ---------------------------------------------------------------------------
const GROUND_Y = 1440;
const SEAT_Y = 1328;
const P_HIP = [430, SEAT_Y];
const PUDDLE = [470, GROUND_Y + 52];

function groundY(x) {
  return GROUND_Y + 14 * Math.sin(x * 0.004 + 1.3) + 8 * Math.sin(x * 0.011);
}

// Background plates: the static set (sky, hills, ground, lamp, bench) is painted once per
// palette state and boil variant at 2x, then cross-faded under the camera every drawing.
const PLATE = { x0: -60, y0: -100, w: 1220, h: 2120, scale: 2 };
const PLATE_STATES = { A: { gloom: 0.55, warm: 0 }, B: { gloom: 1, warm: 0 }, C: { gloom: 0, warm: 1 } };

function plateWeights(tl) {
  const g = clamp((tl.gloom - 0.55) / 0.45);
  return { b: g, c: tl.warm };
}

// ---------------------------------------------------------------------------
// Static set (painted into plates)
// ---------------------------------------------------------------------------
function drawSky(tl) {
  const top = hexMix(hexMix(C.skySad, C.skySad2, tl.gloom), C.skyWarm, tl.warm);
  const low = hexMix(hexMix('#d2d4d0', C.skySad, tl.gloom * 0.6), C.skyWarm2, tl.warm);
  seedEl('sky');
  resetBrush();
  const y0 = -900, y1 = 1500, bands = 40;
  for (let i = 0; i < bands; i++) {
    const a = i / bands;
    brush.wash(hexMix(top, low, smooth(clamp((a - 0.25) / 0.65))), 255);
    brush.rect(-700, mix(y0, y1, a) - 1, 2500, (y1 - y0) / bands + 2);
  }
  brush.noWash();
  for (let i = 0; i < 5; i++) {
    const cx = [-60, 300, 860, 1120, 560][i], cy = [170, 40, 120, 330, 260][i];
    shape('skyc' + i, ellipsePts(cx, cy, [230, 200, 250, 160, 140][i], 44, 14),
      { fill: hexMix(low, '#ffffff', 0.4), fillA: 110, bleed: 0.25, tex: 0.5, border: 0.2, stroke: false });
  }
}

function drawHills(tl) {
  const far = [[-700, 1240]];
  for (let x = -600; x <= 1800; x += 200) far.push([x, 1170 + 50 * Math.sin(x * 0.006 + 0.5) + 25 * Math.sin(x * 0.017)]);
  far.push([1800, 1500], [-700, 1500]);
  shape('hillfar', far, { wash: hexMix(C.hillFarSad, C.hillFarWarm, tl.warm), washA: 150,
    fill: hexMix(C.hillFarSad, C.hillFarWarm, tl.warm), fillA: 150, bleed: 0.1, tex: 0.5,
    stroke: C.inkSoft, w: 0.55, brush: 'HB', per: 4 });
  // a few distant trees on the far hill
  for (let i = 0; i < 7; i++) {
    const x = -20 + i * 190 + 40 * hash('tx', i);
    const y = 1170 + 50 * Math.sin(x * 0.006 + 0.5) + 25 * Math.sin(x * 0.017) + 12;
    const h = 46 + 26 * hash('th', i);
    line('treetr' + i, [[x, y], [x, y - h * 0.5]], { brush: 'HB', c: C.inkSoft, w: 0.7 });
    shape('tree' + i, ellipsePts(x, y - h * 0.75, h * 0.32, h * 0.45, 9),
      { wash: hexMix('#8b9693', '#7f9e6a', tl.warm), washA: 200, stroke: C.inkSoft, w: 0.55, brush: 'HB', curv: 0.8 });
  }
  const near = [[-700, 1320]];
  for (let x = -600; x <= 1800; x += 160) near.push([x, 1275 + 35 * Math.sin(x * 0.009 + 2.1)]);
  near.push([1800, 1500], [-700, 1500]);
  shape('hillnear', near, { wash: hexMix(C.hillSad, C.hillWarm, tl.warm), washA: 170,
    fill: hexMix(C.hillSad, C.hillWarm, tl.warm), fillA: 160, bleed: 0.1, tex: 0.55,
    stroke: C.inkSoft, w: 0.6, brush: 'HB', per: 4 });
}

function drawGround(tl) {
  const gcol = hexMix(C.groundSad, C.groundWarm, tl.warm);
  const pts = [];
  for (let x = -700; x <= 1800; x += 125) pts.push([x, groundY(x)]);
  pts.push([1800, 2800], [-700, 2800]);
  shape('ground', pts, { wash: gcol, washA: 200, fill: hexMix(gcol, C.ink, 0.12), fillA: 120, bleed: 0.08, tex: 0.6,
    border: 0.25, stroke: false, per: 3 });
  // darker foreground band for depth
  const fg = [];
  for (let x = -700; x <= 1800; x += 150) fg.push([x, 1760 + 30 * Math.sin(x * 0.007)]);
  fg.push([1800, 2800], [-700, 2800]);
  shape('groundfg', fg, { fill: hexMix(gcol, C.ink, 0.22), fillA: 110, bleed: 0.15, tex: 0.6, border: 0.2, stroke: false, per: 3 });
  // a winding footpath leading up to the bench
  const path = [[330, 2100], [420, 1880], [470, 1700], [500, 1560], [520, 1470], [600, 1465], [640, 1560], [700, 1720], [800, 1900], [920, 2100]];
  shape('path', path, { wash: hexMix('#cdbfa3', '#e3cfa2', tl.warm), washA: 200, fill: '#b9a782', fillA: 90, tex: 0.6, bleed: 0.05,
    stroke: false, per: 4 });
  line('pathL', path.slice(0, 5), { brush: 'HB', c: C.inkSoft, w: 0.6, curv: 0.6 });
  line('pathR', path.slice(5), { brush: 'HB', c: C.inkSoft, w: 0.6, curv: 0.6 });
  // stones along the path
  for (let i = 0; i < 9; i++) {
    const s = hash('st', i);
    const y = 1520 + i * 60, x = (i % 2 ? 420 - (y - 1500) * 0.35 : 690 + (y - 1500) * 0.42) + 20 * s;
    shape('stone' + i, ellipsePts(x, y, 13 + 10 * s, 7 + 5 * s, 8),
      { wash: hexMix('#a7a39a', '#c2b59b', tl.warm), washA: 220, stroke: C.inkSoft, w: 0.55, brush: 'HB', curv: 0.8 });
  }
  const edge = [];
  for (let x = -700; x <= 1800; x += 125) edge.push([x, groundY(x)]);
  line('groundline', edge, { brush: '2B', w: 0.8, c: C.inkSoft, curv: 0.6 });
  // grass tufts
  for (let i = 0; i < 90; i++) {
    const x = -100 + hash('gx', i) * 1300;
    const y = groundY(x) + 20 + Math.pow(hash('gy', i), 1.2) * 620;
    if (x > 380 && x < 760 && y > 1480 && Math.abs(x - mix(510, 620, (y - 1470) / 600)) < 90 + (y - 1470) * 0.3) continue;
    const s = 0.6 + (y - GROUND_Y) / 500;
    const col = hexMix(hexMix('#6f7462', '#55783c', tl.warm), C.ink, 0.1);
    line('gt' + i, [[x - 9 * s, y - 20 * s], [x - 3 * s, y], [x + 1 * s, y - 30 * s], [x + 5 * s, y], [x + 13 * s, y - 18 * s]],
      { brush: 'HB', c: col, w: 0.75, curv: 0.2 });
  }
  // foreground bushes framing the bottom corners
  const bush = hexMix('#7c8478', '#6f9256', tl.warm);
  for (const [bx, by, r] of [[-40, 1930, 170], [120, 1990, 120], [1130, 1920, 180], [960, 2000, 120]]) {
    const pts2 = [];
    for (let k = 0; k < 11; k++) {
      const a = Math.PI + k / 10 * Math.PI;
      const rr = r * (0.85 + 0.2 * hash('bush', bx, k));
      pts2.push([bx + Math.cos(a) * rr * 1.2, by + Math.sin(a) * rr * 0.9]);
    }
    pts2.push([bx + r * 1.2, by + 200], [bx - r * 1.2, by + 200]);
    shape('bush' + bx, pts2, { wash: bush, washA: 230, fill: hexMix(bush, C.ink, 0.3), fillA: 110, tex: 0.7, bleed: 0.06,
      hatch: { d: 16, a: 0.9, brush: 'HB', c: hexMix(bush, C.ink, 0.55), w: 0.6 }, w: 0.9, curv: 0.7 });
  }
}

function drawLamp(tl) {
  const x = 165, base = groundY(x);
  shape('lamppole', [[x - 9, base], [x - 6, 770], [x + 6, 770], [x + 9, base]],
    { wash: C.iron, washA: 235, stroke: C.ink, w: 0.8, curv: 0.1, dense: false });
  shape('lampbase', [[x - 26, base + 4], [x - 18, base - 40], [x + 18, base - 40], [x + 26, base + 4]],
    { wash: C.iron, washA: 240, stroke: C.ink, w: 0.8, curv: 0.2, dense: false });
  shape('lamphead', [[x - 40, 700], [x + 40, 700], [x + 26, 772], [x - 26, 772]],
    { wash: hexMix('#d9d2b8', '#f6e3a8', tl.warm), washA: 230, stroke: C.ink, w: 0.9, curv: 0.1, dense: false });
  line('lampbar', [[x, 702], [x, 770]], { brush: 'HB', w: 0.6 });
  shape('lamproof', [[x - 54, 702], [x, 648], [x + 54, 702]],
    { wash: C.iron, washA: 245, stroke: C.ink, w: 0.9, curv: 0.2, dense: false });
  line('lampfin', [[x, 648], [x, 622]], { w: 0.9 });
}

function drawBench() {
  const x0 = 352, x1 = 772;
  for (const x of [372, 752]) {
    shape('bpost' + x, [[x - 9, 1176], [x + 9, 1176], [x + 9, SEAT_Y], [x - 9, SEAT_Y]],
      { wash: C.iron, washA: 240, stroke: C.ink, w: 0.8, curv: 0.05, dense: false });
  }
  for (const [y, h] of [[1188, 30], [1232, 30]]) {
    shape('bb' + y, [[x0, y], [x1, y + 2], [x1, y + h], [x0, y + h - 2]],
      { wash: C.wood, washA: 240, fill: C.woodDark, fillA: 80, tex: 0.7, bleed: 0.02, stroke: C.ink, w: 0.85, curv: 0.05, dense: false });
    line('bbg' + y, [[x0 + 30, y + h * 0.5], [x1 - 50, y + h * 0.5 + 1]], { brush: 'HB', c: C.woodDark, w: 0.5 });
  }
  shape('seat', [[340, SEAT_Y], [785, SEAT_Y + 2], [791, SEAT_Y + 24], [334, SEAT_Y + 22]],
    { wash: C.wood, washA: 245, fill: C.woodDark, fillA: 80, tex: 0.7, bleed: 0.02, stroke: C.ink, w: 0.9, curv: 0.05, dense: false });
  line('seatgrain', [[360, SEAT_Y + 11], [755, SEAT_Y + 12]], { brush: 'HB', c: C.woodDark, w: 0.6 });
  for (const x of [376, 748]) {
    const gy = groundY(x);
    shape('leg' + x, [[x - 8, SEAT_Y + 20], [x + 8, SEAT_Y + 20], [x + 4, mix(SEAT_Y, gy, 0.6)], [x + 16, gy], [x - 22, gy], [x - 8, mix(SEAT_Y, gy, 0.6)]],
      { wash: C.iron, washA: 245, stroke: C.ink, w: 0.7, curv: 0.4 });
  }
}

function drawSet(tl) {
  drawSky(tl);
  drawHills(tl);
  drawGround(tl);
  drawLamp(tl);
  drawBench();
}

// ---------------------------------------------------------------------------
// Live elements
// ---------------------------------------------------------------------------
function drawSun(tl) {
  if (tl.sun <= 0.001) return;
  const s = tl.sun;
  const c = [800, 400 - 60 * s];
  shape('sunglow', ellipsePts(c[0], c[1], 270 * s, 270 * s, 20),
    { fill: C.sunGlow, fillA: 130, bleed: 0.3, tex: 0.25, border: 0.1, stroke: false });
  shape('sun', ellipsePts(c[0], c[1], 118 * s, 118 * s, 16),
    { wash: C.sun, washA: 220, fill: '#ec9f35', fillA: 90, bleed: 0.06, tex: 0.4, border: 0.55, stroke: C.yellowDark, w: 0.8 });
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + T * 0.12;
    const r0 = 150 * s, r1 = (192 + 30 * (i % 2)) * s;
    line('ray' + i, [add(c, [Math.cos(a) * r0, Math.sin(a) * r0]), add(c, [Math.cos(a) * r1, Math.sin(a) * r1])],
      { brush: 'HB', c: C.yellowDark, w: 0.9 });
  }
}

function drawPuddle(tl) {
  const grow = clamp(0.55 + 0.45 * seg(T, 2, 12));
  const [cx, cy] = PUDDLE;
  const rx = 190 * grow, ry = 30 * grow;
  const col = hexMix(C.puddle, C.puddleWarm, tl.warm);
  shape('puddle', ellipsePts(cx, cy, rx, ry, 18),
    { wash: col, washA: 190, stroke: hexMix(C.inkSoft, col, 0.3), w: 0.6, brush: 'HB', curv: 0.7 });
  line('puddleglint', [[cx - rx * 0.5, cy - ry * 0.2], [cx + rx * 0.1, cy - ry * 0.35]], { brush: 'HB', c: '#ffffff', w: 0.8 });
  if (tl.rain > 0.05) {
    for (let i = 0; i < 4; i++) {
      const ph = (T * 0.9 + hash('rip', i)) % 1;
      const px = cx + (hash('ripx', i, Math.floor(T * 0.9 + hash('rip', i))) - 0.5) * rx * 1.2;
      const r = 8 + ph * 46;
      line('rip' + i, ellipsePts(px, cy + (i - 1.5) * 6, r, r * 0.22, 10).concat([[px + r, cy + (i - 1.5) * 6]]),
        { brush: 'HB', c: hexMix(C.white, C.rain, ph), w: 0.5, curv: 0.6 });
    }
  }
}

// --- Characters -----------------------------------------------------------

function outlined(id, c, r, col) {
  shape(id, ellipsePts(c[0], c[1], r, r, 10), { wash: col, washA: 250, w: 0.7, brush: 'HB', curv: 0.8 });
}

// The protagonist, sitting on the bench, facing right (towards where the friend will sit).
function personP(tl, F) {
  const s = tl.sad, k = tl.knees;
  const hip = P_HIP;
  const L = (p) => add(hip, p);

  let S = lerp2([-4, -150], [26, -120], s);
  S = add(S, mul([22, 10], tl.leanP));
  const backBulge = mix(-10, -26, s);
  const spine = [[0, -6], [backBulge, mix(-74, -66, s)], S];

  const knee = lerp2([86, -12], [70, -86], k);
  const foot = lerp2([96, 92], [98, -4], k);
  const legTube = tube([L([14, -8]), L(knee), L(foot)], 40, 28);
  const body = tube(spine.map(L), 82, 66, 5);

  let headC = lerp2(add(S, [10, -64]), add(S, [48, -30]), s);
  let tilt = mix(-0.05, 0.42, s) - 0.12 * tl.lookF * (1 - s);
  if (F && tl.leanP > 0) {
    headC = lerp2(headC, sub(add(F.shoulderW, [-54, -18]), hip), tl.leanP);
    tilt = mix(tilt, 0.38, tl.leanP);
  }

  const shoulderPt = add(S, [4, 8]);
  const handHug = add(knee, [26, 26]);
  const elbowHug = add(S, [34, 52]);
  const handLap = [52, -34];
  const elbowLap = add(S, [8, 66]);
  const hand = lerp2(handLap, handHug, k);
  const arm = tube([L(shoulderPt), L(lerp2(elbowLap, elbowHug, k)), L(hand)], 30, 24);

  shape('P-body', body, { wash: C.sweater, washA: 245, fill: C.sweaterDark, fillA: 80, tex: 0.7, bleed: 0.03, w: 1.0,
    hatch: { d: 9, a: 2.2, brush: 'HB', c: C.sweaterDark, w: 0.45 } });
  shape('P-leg', legTube, { wash: C.trousers, washA: 245, w: 1.0 });
  shape('P-shoe', ellipsePts(...L(add(foot, [8, 0])), 24, 13, 12), { wash: C.shoe, washA: 245, w: 0.9 });
  drawHeadP(L(headC), tilt, tl);
  shape('P-arm', arm, { wash: C.sweater, washA: 248, fill: C.sweaterDark, fillA: 60, tex: 0.6, bleed: 0.03, w: 1.0 });
  line('P-cuff', [L(add(hand, [-14, -8])), L(add(hand, [-6, 10]))], { brush: 'HB', c: C.sweaterDark, w: 0.8 });
  outlined('P-hand', L(hand), 13, C.skin);

  return { headW: L(headC), shoulderW: L(S), hipW: hip };
}

function drawHeadP(c, tilt, tl) {
  const r = 50;
  const R = (p) => add(c, rot(p, tilt));
  shape('P-head', ellipsePts(c[0], c[1], r, r * 1.02, 18), { wash: C.skin, washA: 252, w: 1.0, curv: 0.8 });
  const hair = [];
  for (let a = 95; a <= 335; a += 20) {
    const rr = r * (1.1 + 0.04 * Math.sin(a * 0.3));
    hair.push(R([Math.cos(a * Math.PI / 180) * rr, Math.sin(a * Math.PI / 180) * rr]));
  }
  hair.push(R([r * 0.78, -r * 0.42]), R([r * 0.42, -r * 0.18]), R([r * 0.05, -r * 0.42]),
    R([-r * 0.28, -r * 0.05]), R([-r * 0.2, r * 0.62]), R([-r * 0.05, r * 1.05]));
  shape('P-hair', hair, { wash: C.hairP, washA: 248, fill: '#4a4553', fillA: 70, tex: 0.7, w: 1.0, curv: 0.6 });
  line('P-hairstrand', [R([-r * 0.6, -r * 0.7]), R([-r * 0.8, -r * 0.1]), R([-r * 0.7, r * 0.6])], { brush: 'HB', c: '#7d7688', w: 0.6 });
  line('P-hairstrand2', [R([-r * 0.1, -r * 0.95]), R([-r * 0.5, -r * 0.6]), R([-r * 0.55, 0])], { brush: 'HB', c: '#7d7688', w: 0.5 });

  const eye = R([r * 0.5, r * 0.02]);
  if (tl.eyesOpen < 0.5) {
    line('P-eyeclosed', [add(eye, [-9, -2]), add(eye, [0, 4]), add(eye, [9, -1])], { brush: 'pen', w: 0.8, curv: 0.8 });
  } else {
    dot('P-eye', eye, 5.4, C.ink, 255);
    dot('P-eyeglint', add(eye, [1.6, -1.8]), 1.6, '#ffffff', 255);
  }
  const browTilt = mix(0.5, -0.05, tl.smile);
  line('P-brow', [R([r * 0.36, -r * 0.2 - 10 * browTilt]), R([r * 0.66, -r * 0.24 + 6 * browTilt])], { brush: 'HB', w: 0.8 });
  const m = R([r * 0.62, r * 0.42]);
  const curve = mix(-5, 7, tl.smile);
  line('P-mouth', [add(m, [-9, 0]), add(m, [0, curve]), add(m, [8, -1])], { brush: 'HB', w: 0.85, curv: 0.8 });
  line('P-nose', [R([r * 0.96, -r * 0.04]), R([r * 1.08, r * 0.14]), R([r * 0.95, r * 0.2])], { brush: 'HB', w: 0.7, curv: 0.8 });
  if (tl.smile > 0.05) dot('P-blush', R([r * 0.38, r * 0.34]), 10, C.blush, 120 * tl.smile);
  if (tl.tear > 0 && tl.tear < 1) {
    const tp = add(eye, [6, 10 + tl.tear * 140]);
    shape('P-tear', [add(tp, [0, -12]), add(tp, [6, 2]), add(tp, [0, 7]), add(tp, [-6, 2])],
      { wash: '#9fc0dc', washA: 235, stroke: C.rain, w: 0.6, brush: 'HB', curv: 0.6 });
  }
}

// The friend: walks in from the right with an umbrella, then sits to the right of P.
// Local geometry is built facing right then mirrored (sx = -1) to face left.
function personF(tl) {
  const sit = tl.fSit, walk = tl.fWalk;
  const ph = T * Math.PI * 2 * 1.1;
  const baseX = tl.fX, gy = groundY(baseX);
  const sx = -1;
  const Wp = (p) => [baseX + sx * p[0], gy + p[1]];

  const bob = -Math.abs(Math.sin(ph)) * 7 * walk;
  const hip = lerp2([0, -200 + bob], [-4, -(gy - SEAT_Y)], sit);
  const S = add(hip, [mix(8, 12, sit), -150]);
  const headC = add(S, [mix(10, 4, tl.fHug) + 6 * tl.leanP, -64 + 6 * tl.leanP]);

  const legs = [];
  for (const side of [0, 1]) {
    const a = Math.sin(ph + side * Math.PI) * 0.42 * walk;
    const kneeStand = add(hip, [Math.sin(a) * 100, Math.cos(a) * 100]);
    const lift = Math.max(0, Math.sin(ph + side * Math.PI + 1.2)) * 0.55 * walk;
    const footStand = add(kneeStand, [Math.sin(a - lift) * 100, Math.cos(a - lift) * 100]);
    const kneeSit = add(hip, [84 + side * 6, -4]);
    const footSit = add(kneeSit, [10 + side * 8, gy - SEAT_Y + 2]);
    legs.push({ knee: lerp2(kneeStand, kneeSit, sit), foot: lerp2(footStand, footSit, sit) });
  }

  const handU = add(S, [mix(40, 44, sit), mix(-6, 14, sit)]);
  const elbowU = add(S, [26, 54]);

  const drawLeg = (L, id) => {
    shape('F-leg' + id, tube([Wp(add(hip, [6, -6])), Wp(L.knee), Wp(L.foot)], 40, 28), { wash: C.trousers, washA: 245, w: 1.0 });
    shape('F-shoe' + id, ellipsePts(...Wp(add(L.foot, [10, -2])), 26, 13, 12), { wash: C.shoe, washA: 245, w: 0.9 });
  };
  const umbHand = Wp(handU);
  const F = {
    shoulderW: Wp(add(S, [-6, 4])), nearShoulderW: Wp(add(S, [-12, 16])), umbHand,
    hipW: Wp(hip), S, sx, Wp, ph,
    drawBody() {
      drawLeg(legs[1], 'b');
      shape('F-armU', tube([Wp(add(S, [2, 10])), Wp(elbowU), Wp(handU)], 30, 24), { wash: C.coatDark, washA: 248, w: 1.0 });
      const coat = tube([Wp(add(hip, [-2, 40 * (1 - sit) + 10])), Wp(add(hip, [-6, -70])), Wp(S)], 94, 70, 5);
      shape('F-coat', coat, { wash: C.coat, washA: 248, fill: C.coatDark, fillA: 80, tex: 0.7, bleed: 0.03, w: 1.0,
        hatch: { d: 10, a: 0.7, brush: 'HB', c: C.coatDark, w: 0.45 } });
      line('F-coatseam', [Wp(add(S, [24, 18])), Wp(add(hip, [30, -40])), Wp(add(hip, [34, 30 * (1 - sit)]))], { brush: 'HB', c: C.coatDark, w: 0.7 });
      for (let b = 0; b < 3; b++) dot('F-btn' + b, Wp(add(S, [30 - b * 2, 34 + b * 34])), 4.5, C.coatDark, 255);
      drawLeg(legs[0], 'f');
      shape('F-scarf', tube([Wp(add(S, [-26, -4])), Wp(add(S, [2, 2])), Wp(add(S, [30, -6]))], 26, 24), { wash: C.yellow, washA: 248, w: 0.9 });
      shape('F-scarftail', tube([Wp(add(S, [-14, 2])), Wp(add(S, [-22, 36])), Wp(add(S, [-18, 62 + 6 * Math.sin(ph)]))], 22, 18),
        { wash: C.yellow, washA: 248, w: 0.9 });
      outlined('F-handU', umbHand, 13, C.skin);
    },
    drawHead() { drawHeadF(Wp(headC), sx, tl); },
  };
  return F;
}

function drawHeadF(c, sx, tl) {
  const r = 48;
  const M = (p) => add(c, [sx * p[0], p[1]]);
  shape('F-bun', ellipsePts(...M([-34, -40]), 24, 22, 12), { wash: C.hairF, washA: 248, w: 0.9 });
  shape('F-head', ellipsePts(c[0], c[1], r, r * 1.03, 18), { wash: C.skin, washA: 252, w: 1.0, curv: 0.8 });
  const hair = [];
  for (let a = 110; a <= 320; a += 21) {
    const rr = r * 1.07;
    hair.push(M([Math.cos(a * Math.PI / 180) * rr, Math.sin(a * Math.PI / 180) * rr]));
  }
  hair.push(M([r * 0.62, -r * 0.62]), M([r * 0.2, -r * 0.48]), M([-r * 0.3, -r * 0.2]), M([-r * 0.3, r * 0.5]));
  shape('F-hair', hair, { wash: C.hairF, washA: 248, fill: '#7a4934', fillA: 70, tex: 0.7, w: 1.0, curv: 0.6 });
  const closed = tl.leanP > 0.6;
  if (closed) line('F-eyeclosed', [M([r * 0.38, 0]), M([r * 0.5, 4]), M([r * 0.62, 0])], { brush: 'pen', w: 0.8, curv: 0.8 });
  else { dot('F-eye', M([r * 0.5, 0]), 5.4, C.ink, 255); dot('F-eyeglint', M([r * 0.47, -1.8]), 1.6, '#ffffff', 255); }
  line('F-brow', [M([r * 0.34, -r * 0.24]), M([r * 0.66, -r * 0.22])], { brush: 'HB', w: 0.8 });
  const m = M([r * 0.62, r * 0.42]);
  const cv = mix(1, 7, tl.fSmile);
  line('F-mouth', [add(m, [sx * -8, 0]), add(m, [0, cv]), add(m, [sx * 8, -1])], { brush: 'HB', w: 0.85, curv: 0.8 });
  line('F-nose', [M([r * 0.96, -r * 0.04]), M([r * 1.08, r * 0.14]), M([r * 0.95, r * 0.2])], { brush: 'HB', w: 0.7, curv: 0.8 });
  dot('F-blush', M([r * 0.36, r * 0.34]), 10, C.blush, 100);
}

// F's near arm: hangs by the side while walking, then wraps around P's back.
function friendNearArm(tl, F, P) {
  const { Wp, S } = F;
  const swing = Math.sin(F.ph) * 0.35 * tl.fWalk;
  const sh = F.nearShoulderW;
  const elbowHang = Wp(add(S, [Math.sin(swing) * 60 + 4, 64]));
  const handHang = Wp(add(S, [Math.sin(swing * 1.4) * 110 + 10, 124]));
  const handHug = add(P.shoulderW, [-40, 34]);
  const elbowHug = add(lerp2(sh, handHug, 0.45), [0, 4]);
  const e = lerp2(elbowHang, elbowHug, tl.fHug), h = lerp2(handHang, handHug, tl.fHug);
  shape('F-armN', tube([sh, e, h], 28, 22), { wash: C.coat, washA: 248, fill: C.coatDark, fillA: 60, tex: 0.6, bleed: 0.03, w: 1.0 });
  outlined('F-handN', h, 13, C.skin);
}

// --- Umbrella ---------------------------------------------------------------
function umbrellaGeom(tl, F) {
  const hand = F.umbHand;
  // angle from vertical; negative leans towards P (left); lowering swings it down to rest
  const ang = mix(0.06, -0.42, tl.fTilt) + mix(0, 3.3, tl.umbLower) + 0.04 * Math.sin(F.ph) * tl.fWalk;
  const d = [Math.sin(ang), -Math.cos(ang)];
  const p = [Math.cos(ang), Math.sin(ang)];
  const open = tl.umbOpen;
  const apex = add(hand, mul(d, 250));
  const Rc = 205 * mix(0.17, 1, open);
  const Hc = mix(190, 112, open);
  const dome = [];
  for (let i = 0; i <= 12; i++) {
    const u = -1 + i / 6;
    // rounded dome: rises from the rim to the apex
    const h = Hc * (1 - Math.sqrt(Math.max(0, 1 - u * u)) * mix(0.85, 0.95, open));
    dome.push(add(add(apex, mul(p, u * Rc)), mul(d, -h)));
  }
  const ribs = [];
  for (let k = -1; k <= 1.001; k += 0.5) ribs.push(add(add(apex, mul(p, k * Rc)), mul(d, -Hc)));
  const bottom = [];
  for (let i = ribs.length - 1; i >= 0; i--) {
    bottom.push(ribs[i]);
    if (i > 0) bottom.push(add(lerp2(ribs[i], ribs[i - 1], 0.5), mul(d, 20 * open)));
  }
  return { hand, apex, d, p, dome, bottom, ribs, open, Rc, lowered: tl.umbLower > 0.55 };
}

function drawUmbrella(U) {
  line('U-shaft', [U.hand, U.apex], { brush: '2B', c: C.ink, w: 1.3 });
  const hk = add(U.hand, mul(U.d, -26));
  line('U-hook', [add(U.hand, mul(U.d, 6)), hk, add(hk, add(mul(U.p, -16), mul(U.d, -10))), add(hk, add(mul(U.p, -24), mul(U.d, 6)))],
    { brush: '2B', c: C.woodDark, w: 1.6, curv: 0.8 });
  const canopy = U.dome.concat(U.bottom.slice(1, -1));
  shape('U-canopy', canopy, { wash: C.yellow, washA: 248, fill: C.yellowDark, fillA: 90, tex: 0.6, bleed: 0.04, border: 0.5,
    w: 1.1, curv: 0.4, dense: false });
  for (let i = 1; i < U.ribs.length - 1; i++) {
    line('U-rib' + i, [add(U.apex, mul(U.d, -6)), lerp2(add(U.apex, mul(U.d, -6)), U.ribs[i], 0.55).map((v, j) => v + mul(U.d, -U.Rc * 0.05 * (1 - Math.abs(i - 2) * 0.5))[j]), U.ribs[i]],
      { brush: 'HB', c: C.yellowDark, w: 0.8, curv: 0.6 });
  }
  line('U-tip', [U.apex, add(U.apex, mul(U.d, 20))], { brush: '2B', w: 1.2 });
}

function canopySurface(U, x) {
  const pts = U.dome;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if ((x >= a[0] && x <= b[0]) || (x >= b[0] && x <= a[0])) {
      const t = (x - a[0]) / ((b[0] - a[0]) || 1);
      return mix(a[1], b[1], t);
    }
  }
  return null;
}

// --- Cloud, rain, tangle -----------------------------------------------------
function cloudLobes(tl) {
  const [cx, cy] = tl.cloudPos, s = tl.cloudScale;
  const lobes = [[-165, 30, 92], [-80, -34, 120], [40, -48, 126], [150, -6, 104], [215, 40, 72], [60, 44, 110], [-60, 50, 104]];
  return lobes.map(([x, y, r]) => [cx + x * s, cy + y * s, r * s]);
}

function drawCloud(tl) {
  const k = tl.cloudDark;
  const col = hexMix(C.cloudLight, C.cloudDark, k);
  const lobes = cloudLobes(tl);
  const [cx, cy] = tl.cloudPos;
  const outline = [];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2;
    const dir = [Math.cos(a), Math.sin(a)];
    let best = 0;
    for (const [x, y, r] of lobes) {
      const o = [x - cx, y - cy];
      const b = o[0] * dir[0] + o[1] * dir[1];
      const disc = b * b - (o[0] * o[0] + o[1] * o[1] - r * r);
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    const pt = [cx + dir[0] * best, cy + dir[1] * best];
    if (pt[1] > cy + 95 * tl.cloudScale) pt[1] = mix(pt[1], cy + 95 * tl.cloudScale, 0.7);
    outline.push(pt);
  }
  shape('cloud', outline, { wash: col, washA: mix(170, 215, k), fill: hexMix(col, C.ink, 0.3 * k), fillA: 140, bleed: 0.14,
    tex: 0.75, border: 0.6, hatch: k > 0.45 ? { d: 13, a: 2.5, brush: 'charcoal', c: hexMix(C.cloudDark, '#1f2027', 0.5), w: 0.35 } : null,
    stroke: hexMix(C.inkSoft, C.ink, k), w: mix(0.8, 1.2, k), curv: 0.7, per: 2 });
  // inner lobe contours give the cloud volume
  for (let j = 0; j < 3; j++) {
    const [lx, ly, lr] = lobes[[1, 2, 5][j]];
    const arc = [];
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.1 + i / 6 * 0.8); arc.push([lx + Math.cos(a) * lr * 0.7, ly + Math.sin(a) * lr * 0.6 + lr * 0.25]); }
    line('clobe' + j, arc, { brush: 'HB', c: hexMix(C.white, C.ink, mix(0.25, 0.85, k)), w: 0.7, curv: 0.7 });
  }
  if (k > 0.2) {
    const n = Math.round(mix(0, 3, clamp((k - 0.2) / 0.8)) * mix(1, 1.6, tl.gloom));
    for (let j = 0; j < n; j++) {
      const pts = [];
      const [lx, ly, lr] = lobes[(j * 3 + 1) % lobes.length];
      for (let i = 0; i < 14; i++) {
        const a = i * 1.9 + j;
        const rr = lr * (0.25 + 0.45 * hash('cs', j, i));
        pts.push([lx + Math.cos(a) * rr * 1.4, ly + Math.sin(a) * rr * 0.7]);
      }
      line('cscrib' + j, pts, { brush: 'charcoal', c: '#24252c', w: 0.55, curv: 0.8 });
    }
  }
}

function drawRain(tl, U) {
  if (tl.rain <= 0.01) return;
  const [cx, cy] = tl.cloudPos;
  const base = cy + 85 * tl.cloudScale;
  const floor = GROUND_Y + 40;
  const span = floor - base;
  const count = Math.round(60 * tl.rain);
  const halfW = 200 * tl.cloudScale;
  for (let i = 0; i < count; i++) {
    const speed = 1500 + 300 * hash('rs', i);
    const pos = T * speed + hash('ry', i) * span;
    const yy = pos % span, cycle = Math.floor(pos / span);
    const x = cx + (hash('rx', i, cycle) - 0.5) * 2 * halfW;
    const y0 = base + yy;
    let y1 = y0 + 54;
    if (U && U.open > 0.6 && !U.lowered) {
      const sy = canopySurface(U, x);
      if (sy !== null && y1 > sy - 4) {
        if (y0 > sy - 4) {
          if (y0 < sy + 70) line('spl' + i, [[x - 10, sy - 12], [x, sy - 3], [x + 10, sy - 13]], { brush: 'HB', c: C.rain, w: 0.65, curv: 0.4 });
          continue;
        }
        y1 = sy - 4;
      }
    }
    line('rain' + i, [[x, y0], [x - 5, y1]], { brush: 'HB', c: C.rain, w: 0.9 });
  }
}

function drawTangle(tl, P) {
  const amt = tl.tangle, un = tl.unravel;
  if (amt <= 0.01 || tl.threadFade >= 1) return;
  const c = add(P.headW, [-14, -96 - 26 * amt]);
  const R = 34 + 58 * amt;
  const n = Math.round(mix(24, 70, amt));
  const pts = [];
  const rise = un * 360 + tl.threadFade * 420;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const cc = [c[0] + (vnoise(i * 0.12, 1) - 0.5) * R * 1.3, c[1] + (vnoise(i * 0.12, 2) - 0.5) * R * 0.7];
    const a = i * 0.95;
    const r = R * (0.32 + 0.42 * vnoise(i * 0.45, 3));
    const tangled = [cc[0] + Math.cos(a) * r * 1.25, cc[1] + Math.sin(a) * r * 0.85];
    const thread = [c[0] + 26 * Math.sin(s * 8 + T * 2.2) + s * 50, c[1] + 40 - s * 380 - rise];
    pts.push(lerp2(tangled, thread, smooth(clamp(un * 1.3 - s * 0.3))));
  }
  const col = hexMix(C.ink, C.paper, tl.threadFade * 0.85);
  line('tangle', pts, { brush: 'pen', c: col, w: mix(0.65, 0.9, amt), curv: 0.75 });
  if (amt > 0.5 && un < 0.4) {
    line('tangle2', pts.slice(3).map((p, i) => add(p, [10 * Math.sin(i * 1.7), 8 * Math.cos(i * 1.3)])),
      { brush: 'HB', c: col, w: 0.55, curv: 0.75 });
  }
}

// --- Flowers & birds ---------------------------------------------------------
const FLOWERS = (() => {
  const out = [];
  const spots = [
    [300, 1530], [250, 1490], [690, 1500], [800, 1525], [880, 1570], [195, 1610], [610, 1475],
    [350, 1650], [980, 1630], [120, 1730], [300, 1780], [810, 1700], [930, 1770], [230, 1880],
    [870, 1880], [380, 1560], [760, 1610], [60, 1820], [1020, 1860], [455, 1475],
  ];
  const cols = [C.coral, C.yellow, C.white, C.pink, C.lilac];
  spots.forEach(([x, y], i) => {
    const depth = (y - 1480) / 400;
    out.push({ x, y, h: (40 + 50 * hash('fh', i)) * (0.8 + depth * 0.8), r: (10 + 5 * hash('fr', i)) * (0.8 + depth * 0.7),
      col: cols[i % cols.length], t0: hash('ft', i) * 0.7, lean: (hash('fl', i) - 0.5) * 0.5 });
  });
  return out.sort((a, b) => a.y - b.y);
})();

function drawFlowers(tl) {
  if (tl.bloom <= 0) return;
  FLOWERS.forEach((f, i) => {
    const g = smooth(clamp((tl.bloom - f.t0) / 0.3));
    if (g <= 0) return;
    const sway = 0.06 * Math.sin(T * 1.6 + i);
    const top = [f.x + Math.sin(f.lean + sway) * f.h * g, f.y - Math.cos(f.lean + sway) * f.h * g];
    line('stem' + i, [[f.x, f.y], [mix(f.x, top[0], 0.5) + 4, mix(f.y, top[1], 0.5)], top], { brush: 'HB', c: C.stem, w: 0.9, curv: 0.6 });
    if (g > 0.4) {
      const lg = clamp((g - 0.4) / 0.4);
      const lp = lerp2([f.x, f.y], top, 0.45);
      shape('leaf' + i, [lp, add(lp, [14 * lg, -10 * lg]), add(lp, [24 * lg, -2 * lg]), add(lp, [12 * lg, 4 * lg])],
        { wash: C.leaf, washA: 235, stroke: C.stem, w: 0.6, brush: 'HB', curv: 0.7 });
    }
    const pg = smooth(clamp((g - 0.55) / 0.45));
    if (pg > 0) {
      const r = f.r * pg;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2 + i;
        const pc = add(top, [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95]);
        shape('pet' + i + k, ellipsePts(pc[0], pc[1], r * 0.62, r * 0.62, 9),
          { wash: f.col, washA: 240, stroke: hexMix(f.col, C.ink, 0.45), w: 0.55, brush: 'HB', curv: 0.8 });
      }
      dot('fc' + i, top, r * 0.42, f.col === C.yellow ? C.coral : C.yellow, 250);
    }
  });
}

function drawBirds(tl) {
  if (tl.birds <= 0) return;
  for (let i = 0; i < 3; i++) {
    const p = tl.birds * 1.25 - i * 0.12;
    if (p < 0 || p > 1.2) continue;
    const x = mix(-120, 1200, p) + i * 50;
    const y = 300 + i * 70 - 120 * p + 18 * Math.sin(p * 9 + i);
    const flap = Math.sin(T * 9 + i * 2);
    const w = 26 + 4 * i;
    line('bird' + i, [[x - w, y - 10 * flap - 4], [x - w * 0.4, y - 4 * flap], [x, y + 4], [x + w * 0.4, y - 4 * flap], [x + w, y - 10 * flap - 4]],
      { brush: '2B', w: 0.9, curv: 0.6 });
  }
}

// ---------------------------------------------------------------------------
// Render one drawing
// ---------------------------------------------------------------------------
let plates = null; // { A: [img0, img1, img2], B: [...], C: [...] }

function drawPlates(tl) {
  const { b, c } = plateWeights(tl);
  const draw = (img, a) => {
    if (a <= 0.003) return;
    push();
    tint(255, a * 255);
    image(img, PLATE.x0, PLATE.y0, PLATE.w, PLATE.h);
    pop();
  };
  draw(plates.A[BOIL], 1);
  draw(plates.B[BOIL], b);
  draw(plates.C[BOIL], c);
}

function renderScene() {
  const tl = timeline();
  background(C.paper);
  const [cx, cy, z] = tl.cam;
  const dx = 4 * Math.sin(T * 0.7), dy = 3 * Math.sin(T * 0.53 + 1);
  scale(z);
  translate(-cx + dx, -cy + dy);

  if (plates) drawPlates(tl);
  else drawSet(tl);
  drawSun(tl);
  drawPuddle(tl);

  const F = T >= 11 ? personF(tl) : null;
  const U = F ? umbrellaGeom(tl, F) : null;
  if (U && U.lowered) drawUmbrella(U);
  let P;
  if (F && tl.fSit < 0.5) {
    P = personP(tl, null);
    F.drawBody();
    F.drawHead();
  } else if (F) {
    F.drawBody();
    P = personP(tl, F);
    F.drawHead();
  } else {
    P = personP(tl, null);
  }
  if (F) friendNearArm(tl, F, P);

  drawCloud(tl);
  drawRain(tl, U);
  if (U && !U.lowered) drawUmbrella(U);
  drawTangle(tl, P);
  drawFlowers(tl);
  drawBirds(tl);
  return tl;
}

// ---------------------------------------------------------------------------
// Compositing: paper grain, vignette, colour grade, fades (2D canvas)
// ---------------------------------------------------------------------------
let paperTex = null, outCanvas = null, outCtx = null, lastTL = null;

function ihash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function makePaper() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  const colN = Array.from({ length: W }, (_, x) => vnoise(x * 0.01, 3));
  const rowN = Array.from({ length: H }, (_, y) => vnoise(y * 0.008, 5));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const mottle = colN[x] * 0.5 + rowN[y] * 0.3 + ihash(x >> 5, y >> 5) * 0.2;
      const v = 255 - ihash(x, y) * 16 - mottle * 12;
      d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 4; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05; g.strokeStyle = '#6b5a40'; g.lineWidth = 1;
  for (let i = 0; i < 1400; i++) {
    const x = hash('fx', i) * W, y = hash('fy', i) * H, a = hash('fa', i) * Math.PI * 2, l = 6 + hash('fl', i) * 22;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalAlpha = 1;
  return c;
}

function compose(tl) {
  if (!outCanvas) {
    outCanvas = document.createElement('canvas');
    outCanvas.width = W; outCanvas.height = H;
    outCtx = outCanvas.getContext('2d');
  }
  const g = outCtx;
  const src = document.querySelector('canvas');
  const sat = track([[0, 0.8], [6, 0.75], [10, 0.45], [14, 0.62], [19, 0.85], [24, 1.08], [30, 1.1]]);
  const bri = track([[0, 0.99], [10, 0.93], [16, 0.96], [22, 1.02], [30, 1.03]]);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.filter = `saturate(${sat}) brightness(${bri})`;
  g.drawImage(src, 0, 0, W, H);
  g.filter = 'none';
  g.globalCompositeOperation = 'multiply';
  g.drawImage(paperTex, 0, 0);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = `rgba(255,170,80,${0.22 * tl.warm})`;
  g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(70,90,130,${0.22 * tl.gloom * (1 - tl.warm)})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply';
  const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.72);
  vg.addColorStop(0, 'rgba(255,255,255,1)');
  vg.addColorStop(1, `rgba(${mix(205, 190, tl.gloom)},${mix(198, 188, tl.gloom)},${mix(185, 190, tl.gloom)},1)`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const fade = Math.max(tl.fadeIn, tl.fadeOut);
  if (fade > 0) {
    g.globalAlpha = fade;
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(paperTex, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }
  return outCanvas;
}

// ---------------------------------------------------------------------------
// p5 lifecycle
// ---------------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const LIVE = params.has('live');
const PLATE_MODE = params.get('plate'); // e.g. ?plate=A&boil=1 renders a background plate

async function setup() {
  pixelDensity(1);
  if (PLATE_MODE) {
    createCanvas(PLATE.w * PLATE.scale, PLATE.h * PLATE.scale, WEBGL);
  } else {
    createCanvas(W, H, WEBGL);
  }
  angleMode(RADIANS);
  brush.scaleBrushes(4);
  noLoop();
  if (!PLATE_MODE) {
    paperTex = makePaper();
    if (!params.has('noplates')) {
      try {
        const load = (k, b) => loadImage(`out/plates/${k}${b}.png`);
        plates = {};
        for (const k of ['A', 'B', 'C']) plates[k] = await Promise.all([0, 1, 2].map((b) => load(k, b)));
      } catch (e) {
        console.warn('plates missing, painting the set live', e);
        plates = null;
      }
    }
  }
  if (LIVE) {
    D = Number(params.get('start') || 0) * DRAW_FPS;
    loop();
    frameRate(DRAW_FPS);
  }
  window.filmReady = true;
}

let plateReq = null;

function draw() {
  if (PLATE_MODE) {
    if (!plateReq) return;
    const st = PLATE_STATES[plateReq.key];
    BOIL = plateReq.boil;
    background(C.paper);
    translate(-width / 2, -height / 2);
    scale(PLATE.scale);
    translate(-PLATE.x0, -PLATE.y0);
    drawSet({ gloom: st.gloom, warm: st.warm });
    return;
  }
  T = D / DRAW_FPS;
  BOIL = D % 3;
  lastTL = renderScene();
  if (LIVE) D = (D + 1) % N_DRAWINGS;
}

// Renderer API -----------------------------------------------------------------
window.renderDrawing = async (d) => {
  D = d;
  await redraw();
  return compose(lastTL).toDataURL('image/png');
};

window.renderPlate = async (key, boil) => {
  plateReq = { key, boil };
  await redraw();
  return document.querySelector('canvas').toDataURL('image/png');
};

window.FILM = { W, H, DRAW_FPS, DURATION, N_DRAWINGS };
window.setup = setup;
window.draw = draw;
})();
