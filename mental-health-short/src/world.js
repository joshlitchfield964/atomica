// The park: static set (painted into plates) and every living prop.
import {
  clamp, mix, smooth, seg, hash, vnoise, hexMix, add, sub, mul, lerp2, rot, dir, norm, perp, len, dist,
  ellipsePts, smoothClosed, smoothOpen, polySlice, spring, wobble, TAU, easeOutBack,
} from './util.js';
import { INK, C, shape, line, lines, dot, washes, off, seedEl } from './ink.js';

export const GROUND_Y = 1440;
export const SEAT_Y = 1328;
export const PUDDLE = [505, GROUND_Y + 54];
export const SUN = [800, 360];
export const SUN_R = 112;

export const PAL = {
  skySad: '#b3bbc2', skyGloom: '#99a2ab', skyWarm: '#f4d3a8',
  lowSad: '#d0d3cf', lowGloom: '#b7bcbd', lowWarm: '#fbe8c6',
  hillFarSad: '#b7bfbf', hillFarWarm: '#c4d6a6',
  hillSad: '#9ca9a6', hillWarm: '#9cbd86',
  groundSad: '#adb09c', groundWarm: '#c2d095',
  wood: '#8f6c4c', woodDark: '#6a4e37', iron: '#33353d',
  puddle: '#8fa3b7', puddleWarm: '#e9c98e',
  rain: '#53667f',
  cloudDark: '#45495a', cloudLight: '#f1efe9',
  sun: '#f3c14e', sunDeep: '#ea9a33', sunGlow: '#f9dfa0',
  leafSad: '#7f8b80', leafWarm: '#78a556', leafSad2: '#949e93', leafWarm2: '#9cc46f',
  bark: '#6f5a4a', barkDark: '#4d3e33',
  stem: '#5f8a4a', leaf: '#7fa95e',
  coral: '#ec866f', pink: '#f1a7a0', white: '#faf5ea', lilac: '#a89bd0', yellow: '#efbd3a', blossom: '#f4b8c0',
};

export function groundY(x) {
  return GROUND_Y + 12 * Math.sin(x * 0.004 + 1.3) + 7 * Math.sin(x * 0.011);
}
const farHillY = (x) => 1150 + 48 * Math.sin(x * 0.006 + 0.5) + 22 * Math.sin(x * 0.017);
const nearHillY = (x) => 1268 + 30 * Math.sin(x * 0.009 + 2.1);

// Wind: a travelling gust field. strength(t) is scripted by the story.
export function wind(x, t, strength) {
  const g = 0.35 + 0.85 * vnoise(x * 0.003 - t * 0.55, 4) + 0.3 * vnoise(x * 0.011 - t * 1.6, 5);
  return strength * g;
}

// ---------------------------------------------------------------------------
// Static set (plates): sky, far hills + town, near hill, ground, path, stones
// ---------------------------------------------------------------------------
export function drawSet(st) {
  const top = hexMix(hexMix(PAL.skySad, PAL.skyGloom, st.gloom), PAL.skyWarm, st.warm);
  const low = hexMix(hexMix(PAL.lowSad, PAL.lowGloom, st.gloom), PAL.lowWarm, st.warm);
  seedEl('sky'); off();
  const y0 = -900, y1 = 1500, bands = 44;
  for (let i = 0; i < bands; i++) {
    const a = i / bands;
    brush.wash(hexMix(top, low, smooth(clamp((a - 0.22) / 0.68))), 255);
    brush.rect(-700, mix(y0, y1, a) - 1, 2500, (y1 - y0) / bands + 2);
  }
  off();
  // soft far clouds
  const cl = hexMix(low, '#ffffff', 0.45);
  [[-40, 150, 240], [330, 40, 200], [880, 120, 260], [1130, 320, 170], [560, 250, 150], [180, 330, 120]].forEach(([x, y, w], i) => {
    shape('skyc' + i, ellipsePts(x, y, w, 40 + w * 0.06, 14), { fill: cl, fillA: 120, bleed: 0.25, tex: 0.5, border: 0.25, stroke: false });
    line('skycl' + i, [[x - w * 0.7, y + 14], [x - w * 0.2, y + 22], [x + w * 0.5, y + 16]], { brush: 'HB', c: hexMix(cl, C.inkSoft, 0.25), w: 0.5, curv: 0.6 });
  });

  // far hills with a tiny town
  const far = [[-700, 1240]];
  for (let x = -600; x <= 1800; x += 150) far.push([x, farHillY(x)]);
  far.push([1800, 1500], [-700, 1500]);
  const farC = hexMix(PAL.hillFarSad, PAL.hillFarWarm, st.warm);
  shape('hillfar', far, { wash: farC, washA: 170, fill: farC, fillA: 150, bleed: 0.1, tex: 0.55, stroke: C.inkSoft, w: 0.55, brush: 'HB', per: 4 });
  drawTown(st);
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 150 + 50 * hash('tx', i);
    if (x > 760 && x < 1010) continue;
    const y = farHillY(x) + 10, h = 38 + 24 * hash('th', i);
    line('ftreetr' + i, [[x, y], [x, y - h * 0.45]], { brush: 'HB', c: C.inkSoft, w: 0.6 });
    shape('ftree' + i, ellipsePts(x, y - h * 0.72, h * 0.3, h * 0.42, 9),
      { wash: hexMix('#8c9894', '#7da068', st.warm), washA: 215, stroke: C.inkSoft, w: 0.5, brush: 'HB', curv: 0.8 });
  }
  // near hill with the far footpath the stranger walks along
  const near = [[-700, 1320]];
  for (let x = -600; x <= 1800; x += 140) near.push([x, nearHillY(x)]);
  near.push([1800, 1500], [-700, 1500]);
  const nearC = hexMix(PAL.hillSad, PAL.hillWarm, st.warm);
  shape('hillnear', near, { wash: nearC, washA: 185, fill: nearC, fillA: 160, bleed: 0.1, tex: 0.6, stroke: C.inkSoft, w: 0.6, brush: 'HB', per: 4 });
  const fp = [];
  for (let x = -300; x <= 1500; x += 120) fp.push([x, nearHillY(x) + 16]);
  line('farpath', fp, { brush: 'HB', c: hexMix(nearC, '#f3ead8', 0.55), w: 2.2, curv: 0.6 });

  // ground + foreground depth band
  const g = hexMix(PAL.groundSad, PAL.groundWarm, st.warm);
  const gp = [];
  for (let x = -700; x <= 1800; x += 110) gp.push([x, groundY(x)]);
  gp.push([1800, 2800], [-700, 2800]);
  shape('ground', gp, { wash: g, washA: 215, fill: hexMix(g, C.ink, 0.12), fillA: 120, bleed: 0.08, tex: 0.65, border: 0.25, stroke: false, per: 3 });
  const fg = [];
  for (let x = -700; x <= 1800; x += 140) fg.push([x, 1770 + 26 * Math.sin(x * 0.007)]);
  fg.push([1800, 2800], [-700, 2800]);
  shape('groundfg', fg, { fill: hexMix(g, C.ink, 0.24), fillA: 110, bleed: 0.15, tex: 0.6, border: 0.2, stroke: false, per: 3 });
  line('groundline', gp.slice(0, -2), { brush: '2B', w: 0.75, c: C.inkSoft, curv: 0.6 });
  // footpath leading to the bench
  const path = [[300, 2100], [400, 1880], [455, 1700], [490, 1565], [520, 1478], [640, 1474], [672, 1565], [720, 1720], [810, 1900], [930, 2100]];
  shape('path', path, { wash: hexMix('#ccbea2', '#e6d2a4', st.warm), washA: 215, fill: '#b5a37f', fillA: 95, tex: 0.65, bleed: 0.05, stroke: false, per: 4 });
  line('pathL', path.slice(0, 5), { brush: 'HB', c: C.inkSoft, w: 0.6, curv: 0.6 });
  line('pathR', path.slice(5), { brush: 'HB', c: C.inkSoft, w: 0.6, curv: 0.6 });
  for (let i = 0; i < 10; i++) {
    const s = hash('st', i);
    const y = 1530 + i * 52, x = i % 2 ? 470 - (y - 1500) * 0.42 + 10 * s : 680 + (y - 1500) * 0.45 + 10 * s;
    shape('stone' + i, ellipsePts(x, y, 12 + 9 * s, 6 + 4 * s, 8), { wash: hexMix('#a6a399', '#c4b79c', st.warm), washA: 230, stroke: C.inkSoft, w: 0.5, brush: 'HB', curv: 0.8 });
  }
}

function drawTown(st) {
  const houses = [[800, 0.95], [845, 1.1], [892, 0.85], [935, 1.0], [975, 0.8]];
  houses.forEach(([x, s], i) => {
    const gy = farHillY(x) + 8;
    const w = 30 * s, h = 26 * s;
    const wall = hexMix('#d8d3c6', '#f2e3c6', st.warm);
    shape('house' + i, [[x - w / 2, gy], [x - w / 2, gy - h], [x + w / 2, gy - h], [x + w / 2, gy]], { wash: wall, washA: 235, stroke: C.inkSoft, w: 0.5, brush: 'HB', curv: 0.05, dense: false });
    shape('roof' + i, [[x - w / 2 - 5, gy - h], [x, gy - h - 18 * s], [x + w / 2 + 5, gy - h]], { wash: hexMix('#8a7f7c', '#c46f53', st.warm), washA: 240, stroke: C.inkSoft, w: 0.5, brush: 'HB', curv: 0.05, dense: false });
    dot('win' + i, [x, gy - h * 0.5], 3.2 * s, hexMix('#7b7a80', '#f2c76a', st.warm), 240);
  });
}

// Chimney smoke (live): two thin wobbling wisps rising from the town.
export function drawSmoke(t, warm) {
  const list = [];
  for (const [x0, k] of [[845, 0], [935, 1]]) {
    const y0 = farHillY(x0) + 8 - 26 * 1.1 - 12;
    for (let w = 0; w < 2; w++) {
      const pts = [];
      for (let i = 0; i < 7; i++) {
        const s = i / 6;
        pts.push([x0 + 6 + s * 34 + 7 * Math.sin(s * 5 - t * 2.2 + k + w), y0 - s * 70 - w * 8]);
      }
      list.push(pts);
    }
  }
  lines('smoke', list, { brush: 'HB', c: hexMix('#9a9ba0', '#c9bcab', warm), w: 0.6, curv: 0.7 });
}

// ---------------------------------------------------------------------------
// Tree: trunk, branches, canopy clusters on springs, fluttering leaves, falling leaves
// ---------------------------------------------------------------------------
const TREE_BASE = [120, groundY(120) + 4];
const CLUSTERS = [
  [-10, 600, 150, 120], [140, 520, 165, 130], [290, 600, 120, 100], [40, 760, 140, 105],
  [230, 740, 125, 95], [-60, 470, 120, 100], [120, 410, 130, 100], [330, 470, 95, 80], [-40, 860, 110, 70],
];
export const TREE_N = CLUSTERS.length;

export function treeClusterTargets(t, ws) {
  return CLUSTERS.map(([x, y], i) => wind(x, t - 0.15, ws) * 0.045 * (1 + (900 - y) / 700) + 0.012 * Math.sin(t * 1.3 + i));
}

export function drawTree(t, warm, ws, sway, blossom) {
  const bark = PAL.bark, barkD = PAL.barkDark;
  const top = [150, 640];
  const swayTop = (sway[1] + sway[2]) * 40;
  // trunk
  const trunk = [[TREE_BASE[0] - 34, TREE_BASE[1]], [TREE_BASE[0] - 20, 1200], [top[0] - 18 + swayTop * 0.3, 760], [top[0] + 4 + swayTop * 0.5, top[1]],
    [top[0] + 22 + swayTop * 0.3, 760], [TREE_BASE[0] + 22, 1200], [TREE_BASE[0] + 38, TREE_BASE[1]]];
  shape('tree-trunk', trunk, { wash: bark, washA: 245, fill: barkD, fillA: 90, tex: 0.7, bleed: 0.03,
    hatch: { d: 10, a: 1.5, brush: 'HB', c: barkD, w: 0.5, rand: 0.3 }, w: 1.0, curv: 0.5 });
  // branches
  const br = CLUSTERS.slice(0, 6).map(([x, y], i) => {
    const off = sway[i] * 120;
    const s = [top[0] + swayTop * 0.4, mix(top[1], 900, 0.3 + 0.1 * (i % 3))];
    return [s, [mix(s[0], x + off, 0.5), mix(s[1], y, 0.5) - 20], [x + off, y + 20]];
  });
  lines('tree-br', br, { brush: '2B', c: barkD, w: 1.6, curv: 0.6 });
  // canopy: back shade first, then light; outlines batched
  const leafA = hexMix(PAL.leafSad, PAL.leafWarm, warm), leafB = hexMix(PAL.leafSad2, PAL.leafWarm2, warm);
  const blobs = CLUSTERS.map(([x, y, w, h], i) => {
    const off = sway[i] * (180 + (900 - y) * 0.15);
    const pts = [];
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU;
      const sc = 1 + 0.09 * Math.sin(a * 5 + i * 1.7) + 0.05 * Math.sin(a * 9 + i);
      pts.push([x + off + Math.cos(a) * w * 0.62 * sc, y + Math.sin(a) * h * 0.62 * sc]);
    }
    return pts;
  });
  off();
  brush.fill(leafA, 180); brush.fillBleed(0.06); brush.fillTexture(0.6, 0.4);
  blobs.forEach((b, i) => { if (i % 2 === 0 || i > 5) { seedEl('tree-bf', i); brush.polygon(smoothClosed(b, 3)); } });
  brush.noFill();
  brush.fill(leafB, 170); brush.fillBleed(0.06); brush.fillTexture(0.6, 0.4);
  blobs.forEach((b, i) => { if (!(i % 2 === 0 || i > 5)) { seedEl('tree-bf', i); brush.polygon(smoothClosed(b, 3)); } });
  off();
  // scalloped leaf outlines (doodle "cloud" edges)
  const outl = blobs.map((b) => {
    const out = [];
    const sm = smoothClosed(b, 3);
    for (let k = 0; k < sm.length; k += 2) out.push(sm[k]);
    out.push(out[0]);
    return out;
  });
  lines('tree-ol', outl, { brush: '2B', c: hexMix(C.inkSoft, '#3d5a2e', warm * 0.6), w: 0.85, curv: 0.75 });
  // leaf flicks inside the canopy that flutter
  const flicks = [];
  CLUSTERS.forEach(([x, y, w, h], i) => {
    const off = sway[i] * (180 + (900 - y) * 0.15);
    for (let k = 0; k < 4; k++) {
      const px = x + off + (hash('lf', i, k) - 0.5) * w * 0.8, py = y + (hash('lfy', i, k) - 0.5) * h * 0.7;
      const a = -0.6 + 0.5 * Math.sin(t * 6 + i * 3 + k * 2) * clamp(ws) ;
      flicks.push([[px, py], add([px, py], mul(dir(a), 16)), add([px, py], mul(dir(a + 0.9), 10))]);
    }
  });
  lines('tree-flick', flicks, { brush: 'HB', c: hexMix('#55604f', '#3f6b2c', warm), w: 0.6, curv: 0.6 });
  // blossoms
  if (blossom > 0) {
    const polys = [];
    CLUSTERS.forEach(([x, y, w, h], i) => {
      const off = sway[i] * (180 + (900 - y) * 0.15);
      for (let k = 0; k < 6; k++) {
        const appear = spring(blossom, hash('bl', i, k) * 0.6, 2.2, 0.4);
        if (appear <= 0.01) continue;
        const px = x + off + (hash('blx', i, k) - 0.5) * w * 1.0, py = y + (hash('bly', i, k) - 0.5) * h * 0.9;
        polys.push(ellipsePts(px, py, 7 * appear, 7 * appear, 7));
      }
    });
    washes('tree-blossom', polys, PAL.blossom, 235);
  }
}

// Falling leaves (pendulum flutter). spawn times are scripted.
export function drawFallingLeaves(t, warm, ws, leaves) {
  const polys = [], veins = [];
  leaves.forEach(([t0, x0, y0, dur], i) => {
    const u = (t - t0) / dur;
    if (u < 0 || u > 1) return;
    const fall = u * (GROUND_Y + 60 - y0);
    const sw = Math.sin(u * TAU * 2.2 + i);
    const x = x0 + sw * 40 + u * 140 * (0.5 + ws);
    const y = y0 + fall - Math.abs(sw) * 12;
    const a = sw * 0.9;
    const pts = [[-12, 0], [-4, -6], [8, -5], [13, 0], [8, 5], [-4, 6]].map((p) => add([x, y], rot(p, a)));
    polys.push(pts);
    veins.push([add([x, y], rot([-12, 0], a)), add([x, y], rot([11, 0], a))]);
  });
  if (!polys.length) return;
  washes('fleaf', polys, hexMix('#9a8f63', '#d8a64a', warm), 240);
  lines('fleafv', veins, { brush: 'HB', c: C.inkSoft, w: 0.55 });
}

// ---------------------------------------------------------------------------
// Bench
// ---------------------------------------------------------------------------
export function drawBench(warmBloom = 0) {
  const wood = hexMix(PAL.wood, '#b0784a', warmBloom * 0.5);
  const x0 = 350, x1 = 778;
  for (const x of [370, 758]) {
    shape('bench-post' + x, [[x - 9, 1172], [x + 9, 1172], [x + 9, SEAT_Y], [x - 9, SEAT_Y]],
      { wash: PAL.iron, washA: 245, stroke: C.ink, w: 0.8, curv: 0.05, dense: false });
  }
  for (const [y, h] of [[1184, 30], [1228, 30]]) {
    shape('bench-slat' + y, [[x0, y], [x1, y + 2], [x1, y + h], [x0, y + h - 2]],
      { wash: wood, washA: 245, fill: PAL.woodDark, fillA: 85, tex: 0.75, bleed: 0.02, stroke: C.ink, w: 0.85, curv: 0.05, dense: false });
  }
  lines('bench-grain', [[[x0 + 30, 1199], [x1 - 60, 1200]], [[x0 + 80, 1243], [x1 - 20, 1244]]], { brush: 'HB', c: PAL.woodDark, w: 0.5 });
  shape('bench-seat', [[338, SEAT_Y], [790, SEAT_Y + 2], [796, SEAT_Y + 24], [332, SEAT_Y + 22]],
    { wash: wood, washA: 248, fill: PAL.woodDark, fillA: 85, tex: 0.75, bleed: 0.02, stroke: C.ink, w: 0.9, curv: 0.05, dense: false });
  line('bench-seatgrain', [[360, SEAT_Y + 11], [760, SEAT_Y + 12]], { brush: 'HB', c: PAL.woodDark, w: 0.6 });
  for (const x of [378, 750]) {
    const gy = groundY(x);
    shape('bench-leg' + x, [[x - 8, SEAT_Y + 20], [x + 8, SEAT_Y + 20], [x + 4, mix(SEAT_Y, gy, 0.6)], [x + 16, gy], [x - 22, gy], [x - 8, mix(SEAT_Y, gy, 0.6)]],
      { wash: PAL.iron, washA: 248, stroke: C.ink, w: 0.7, curv: 0.4 });
  }
}

// ---------------------------------------------------------------------------
// Grass: tufts on spring physics, two depth layers
// ---------------------------------------------------------------------------
export const TUFTS = (() => {
  const out = [];
  for (let i = 0; i < 150; i++) {
    const x = -120 + hash('gx', i) * 1360;
    const y = groundY(x) + 6 + Math.pow(hash('gy', i), 1.15) * 640;
    const onPath = Math.abs(x - mix(580, 600, (y - 1470) / 600)) < 70 + (y - 1470) * 0.33 && y > 1470;
    const underBench = x > 330 && x < 800 && y < 1470;
    if (onPath || underBench) continue;
    out.push({ x, y, s: 0.65 + (y - GROUND_Y) / 520, n: 3 + Math.floor(hash('gn', i) * 3), tone: hash('gt', i) < 0.5 ? 0 : 1 });
  }
  return out;
})();

export function grassTargets(t, ws) {
  return TUFTS.map((g, i) => 0.55 * wind(g.x, t, ws) + 0.05 * Math.sin(t * 2.1 + i * 0.7));
}

export function drawGrass(bend, warm, front) {
  const A = [], B = [];
  TUFTS.forEach((g, i) => {
    if (front !== g.y > 1500) return;
    const b = bend[i];
    for (let k = 0; k < g.n; k++) {
      const base = [g.x + (k - g.n / 2) * 6 * g.s, g.y];
      const h = (22 + 16 * hash('gh', i, k)) * g.s;
      const lean = (k - g.n / 2) * 0.25 + b * (0.8 + 0.4 * hash('gb', i, k));
      const mid = add(base, rot([0, -h * 0.55], lean * 0.45));
      const tip = add(base, rot([0, -h], lean));
      (g.tone ? A : B).push([base, mid, tip]);
    }
  });
  lines('grassA' + front, A, { brush: 'HB', c: hexMix('#66705e', '#4f7a36', warm), w: 0.75, curv: 0.5 });
  lines('grassB' + front, B, { brush: 'HB', c: hexMix('#80887a', '#6f9a4a', warm), w: 0.7, curv: 0.5 });
}

// ---------------------------------------------------------------------------
// Puddle
// ---------------------------------------------------------------------------
export function drawPuddle(t, rain, warm, fill) {
  const [cx, cy] = PUDDLE;
  const rx = 175 * fill, ry = 28 * fill;
  const col = hexMix(PAL.puddle, PAL.puddleWarm, warm);
  shape('puddle', ellipsePts(cx, cy, rx, ry, 18), { wash: col, washA: 195, stroke: hexMix(C.inkSoft, col, 0.3), w: 0.6, brush: 'HB', curv: 0.7 });
  line('puddle-glint', [[cx - rx * 0.5, cy - ry * 0.25], [cx + rx * 0.05, cy - ry * 0.4]], { brush: 'HB', c: '#ffffff', w: 0.9 });
  if (rain > 0.05) {
    const rips = [];
    for (let i = 0; i < 6; i++) {
      const rate = 1.3;
      const ph = (t * rate + hash('rip', i)) % 1;
      const cyc = Math.floor(t * rate + hash('rip', i));
      const px = cx + (hash('ripx', i, cyc) - 0.5) * rx * 1.3;
      const py = cy + (hash('ripy', i, cyc) - 0.5) * ry * 0.9;
      const r = 6 + ph * 40 * rain;
      rips.push(ellipsePts(px, py, r, r * 0.25, 10).concat([[px + r, py]]));
    }
    lines('ripples', rips, { brush: 'HB', c: hexMix('#e9eef3', PAL.rain, 0.4), w: 0.5, curv: 0.6 });
  }
}

// ---------------------------------------------------------------------------
// Storm cloud
// ---------------------------------------------------------------------------
const LOBES = [[-165, 30, 92], [-80, -34, 120], [40, -48, 126], [150, -6, 104], [215, 40, 72], [60, 44, 110], [-60, 50, 104]];

export function cloudShape(t, c) {
  const [cx, cy] = c.pos, s = c.scale;
  const lobes = LOBES.map(([x, y, r], i) => {
    const breathe = 1 + 0.035 * Math.sin(t * (1.1 + i * 0.23) + i) + c.swellWobble * 0.06 * Math.sin(i * 2.1);
    return [cx + x * s, cy + y * s, r * s * breathe];
  });
  const outline = [];
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * TAU;
    const d = dir(a);
    let best = 0;
    for (const [x, y, r] of lobes) {
      const o = [x - cx, y - cy];
      const b = o[0] * d[0] + o[1] * d[1];
      const disc = b * b - (o[0] * o[0] + o[1] * o[1] - r * r);
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    const pt = [cx + d[0] * best, cy + d[1] * best];
    const base = cy + 92 * s;
    if (pt[1] > base) pt[1] = mix(pt[1], base, 0.75);
    outline.push(pt);
  }
  return { lobes, outline, base: cy + 88 * s, halfW: 205 * s, cx, cy };
}

export function drawCloud(t, c, cs) {
  const k = c.dark;
  const col = hexMix(PAL.cloudLight, PAL.cloudDark, k);
  shape('cloud', cs.outline, {
    wash: col, washA: mix(205, 235, k), fill: hexMix(col, C.ink, 0.3 * k), fillA: 140, bleed: 0.12, tex: 0.75, border: 0.6,
    hatch: k > 0.45 ? { d: 12, a: 2.5, brush: 'charcoal', c: '#2a2b33', w: 0.32, rand: 0.25 } : null,
    stroke: hexMix(C.inkSoft, C.ink, k), w: mix(0.8, 1.2, k), curv: 0.7, per: 2,
  });
  const arcs = [1, 2, 5, 3].map((li) => {
    const [lx, ly, lr] = cs.lobes[li];
    const arc = [];
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.12 + i / 6 * 0.76); arc.push([lx + Math.cos(a) * lr * 0.68, ly + Math.sin(a) * lr * 0.58 + lr * 0.26]); }
    return arc;
  });
  lines('cloud-lobes', arcs, { brush: 'HB', c: hexMix('#ffffff', C.ink, mix(0.25, 0.8, k)), w: 0.7, curv: 0.7 });
  if (k > 0.25) {
    const n = Math.round(mix(1, 4, clamp((k - 0.25) / 0.75)) * mix(1, 1.5, c.agitation));
    const scr = [];
    for (let j = 0; j < n; j++) {
      const [lx, ly, lr] = cs.lobes[(j * 3 + 1) % cs.lobes.length];
      const pts = [];
      const spin = t * (0.6 + c.agitation * 2.2);
      for (let i = 0; i < 14; i++) {
        const a = i * 1.9 + j + spin;
        const rr = lr * (0.22 + 0.42 * hash('cs', j, i));
        pts.push([lx + Math.cos(a) * rr * 1.35, ly + Math.sin(a) * rr * 0.65]);
      }
      scr.push(pts);
    }
    lines('cloud-scrib', scr, { brush: 'charcoal', c: '#22232a', w: 0.5, curv: 0.8 });
  }
}

export function drawLightning(cs, u) {
  // u: 0..1 life of the bolt
  const [x, y] = [cs.lobes[2][0] - 20, cs.base - 10];
  const pts = [[x, y], [x - 26, y + 60], [x + 8, y + 70], [x - 22, y + 150], [x + 14, y + 160], [x - 12, y + 250]];
  const part = polySlice(pts, 0, clamp(u * 2));
  if (part.length < 2) return;
  shape('bolt', [[x + 6, y], [x - 30, y + 64], [x + 4, y + 74], [x - 28, y + 156], [x + 10, y + 164], [x - 14, y + 252], [x + 30, y + 150], [x - 4, y + 140], [x + 28, y + 64], [x - 6, y + 56], [x + 22, y]],
    { wash: '#fff6c9', washA: 255 * clamp(1 - Math.max(0, u - 0.5) * 2), stroke: C.ink, w: 1.1, curv: 0.05, dense: false });
}

// ---------------------------------------------------------------------------
// Rain with collisions + splashes
// ---------------------------------------------------------------------------
// surfaceAt(x) → y where a falling drop at x stops (canopy, heads, bench, ground).
export function drawRain(t, cs, rain, surfaceAt) {
  if (rain <= 0.01) return;
  const span = GROUND_Y + 60 - cs.base;
  const count = Math.round(66 * rain);
  const streaks = [], splashes = [];
  const L = 58;
  for (let i = 0; i < count; i++) {
    const speed = 1550 + 350 * hash('rs', i);
    const period = span / speed;
    const pos = t / period + hash('ry', i);
    const cyc = Math.floor(pos), ph = pos - cyc;
    const xOf = (c) => cs.cx + (hash('rx', i, c) - 0.5) * 2 * cs.halfW * 0.92;
    const x = xOf(cyc);
    const stopY = surfaceAt(x);
    const yTop = cs.base + ph * span;
    if (yTop < stopY) {
      const y1 = Math.min(yTop + L, stopY);
      streaks.push([[x, yTop], [x - 6 * (y1 - yTop) / L, y1]]);
    }
    // splash droplets from the most recent impact (this cycle or the previous one)
    for (const c of [cyc, cyc - 1]) {
      const xc = xOf(c), sy = surfaceAt(xc);
      const hitPh = (sy - cs.base) / span;
      const tImpact = (c + hitPh - hash('ry', i)) * period;
      const age = t - tImpact;
      if (age > 0 && age < 0.26) {
        for (let k = 0; k < 3; k++) {
          const vx = (k - 1) * 120 + (hash('sx', i, c, k) - 0.5) * 70, vy = -170 - 110 * hash('sy', i, c, k);
          const at = (a) => [xc + vx * a, sy + vy * a + 0.5 * 2000 * a * a];
          const p0 = at(age), p1 = at(age + 0.025);
          if (p0[1] <= sy + 2) splashes.push([p0, p1]);
        }
        break;
      }
    }
  }
  lines('rain', streaks, { brush: 'HB', c: PAL.rain, w: 0.95 });
  lines('splash', splashes, { brush: 'HB', c: '#6c7e96', w: 0.75 });
}

// ---------------------------------------------------------------------------
// Flowers, butterfly, birds
// ---------------------------------------------------------------------------
export const FLOWERS = (() => {
  const spots = [
    // first the 7 "last drop" flowers near the bench, then the field
    [430, 1478], [560, 1480], [690, 1476], [360, 1520], [745, 1530], [470, 1560], [640, 1565],
    [250, 1500], [820, 1505], [880, 1570], [195, 1610], [980, 1630], [120, 1720], [300, 1700], [800, 1690],
    [930, 1770], [230, 1860], [860, 1880], [60, 1820], [1020, 1860], [400, 1800], [740, 1800], [140, 1560], [1000, 1520],
  ];
  const cols = [PAL.coral, PAL.yellow, PAL.white, PAL.pink, PAL.lilac];
  return spots.map(([x, y], i) => {
    const depth = clamp((y - 1470) / 420);
    return { x, y, i, h: (34 + 40 * hash('fh', i)) * (0.75 + depth * 0.9), r: (9 + 4 * hash('fr', i)) * (0.8 + depth * 0.75),
      col: cols[i % cols.length], lean: (hash('fl', i) - 0.5) * 0.4, petals: 5 + (i % 3 === 0 ? 1 : 0) };
  });
})();

export function drawFlowers(t, birth, ws) {
  // birth[i] = time the flower starts growing (Infinity = never)
  const stems = [], leaves = [], heads = [];
  const order = FLOWERS.map((f, i) => i).sort((a, b) => FLOWERS[a].y - FLOWERS[b].y);
  for (const i of order) {
    const f = FLOWERS[i];
    const g = spring(t, birth[i], 1.6, 0.42);
    if (g <= 0.005) continue;
    const sway = 0.07 * Math.sin(t * 1.7 + i) + 0.25 * wind(f.x, t, ws) * 0.4;
    const hgt = f.h * g;
    const top = [f.x + Math.sin(f.lean + sway) * hgt, f.y - Math.cos(f.lean + sway) * hgt];
    stems.push([[f.x, f.y], [mix(f.x, top[0], 0.45) + 3, mix(f.y, top[1], 0.5)], top]);
    const lg = spring(t, birth[i] + 0.15, 1.8, 0.45);
    if (lg > 0.05) {
      const lp = lerp2([f.x, f.y], top, 0.4);
      const s = f.r / 11 * lg;
      leaves.push([lp, add(lp, [13 * s, -10 * s]), add(lp, [24 * s, -3 * s]), add(lp, [12 * s, 4 * s])]);
    }
    const pg = spring(t, birth[i] + 0.3, 2.2, 0.38);
    if (pg > 0.02) heads.push({ f, top, r: f.r * pg, pg });
  }
  if (!stems.length) return;
  lines('stems', stems, { brush: 'HB', c: PAL.stem, w: 0.9, curv: 0.6 });
  washes('fleaves', leaves.map((l) => smoothClosed(l, 3)), PAL.leaf, 235);
  lines('fleaves-ol', leaves.map((l) => smoothClosed(l, 3).concat([l[0]])), { brush: 'HB', c: PAL.stem, w: 0.55, curv: 0.6 });
  // petals grouped by colour (batched), then centres
  const byCol = {};
  for (const h of heads) {
    const { f, top, r } = h;
    const arr = byCol[f.col] || (byCol[f.col] = []);
    for (let k = 0; k < f.petals; k++) {
      const a = k / f.petals * TAU + f.i;
      const pc = add(top, mul(dir(a), r * 0.95));
      arr.push(ellipsePts(pc[0], pc[1], r * 0.62, r * 0.5, 9, 0, a));
    }
  }
  for (const col in byCol) {
    washes('petals' + col, byCol[col], col, 242);
    lines('petals-ol' + col, byCol[col].map((p) => p.concat([p[0]])), { brush: 'HB', c: hexMix(col, C.ink, 0.5), w: 0.5, curv: 0.7 });
  }
  washes('fcentres', heads.map((h) => ellipsePts(h.top[0], h.top[1], h.r * 0.42, h.r * 0.42, 9)), PAL.sunDeep, 250);
}

export function drawButterfly(t, p, flapT) {
  const flap = Math.abs(Math.sin(flapT * TAU * 6));
  const w = mix(0.25, 1, flap);
  const wingsUp = [[0, 0], [-6 * w, -16], [-20 * w, -18], [-18 * w, -4], [-4 * w, 2]];
  const wingsLo = [[0, 2], [-12 * w, 6], [-14 * w, 14], [-4 * w, 10]];
  const m = (pts, sx) => pts.map(([x, y]) => [p[0] + x * sx, p[1] + y]);
  const polys = [m(wingsUp, 1), m(wingsUp, -1), m(wingsLo, 1), m(wingsLo, -1)];
  washes('bfly', polys.map((q) => smoothClosed(q, 3)), PAL.coral, 245);
  lines('bfly-ol', polys.map((q) => smoothClosed(q, 3).concat([q[0]])), { brush: 'HB', c: C.ink, w: 0.6, curv: 0.6 });
  line('bfly-body', [[p[0], p[1] - 6], [p[0], p[1] + 12]], { brush: '2B', w: 0.9 });
}

export function drawBirds(t, list) {
  const strokes = [];
  list.forEach(([t0, y0, sz, spd], i) => {
    const x = -120 + (t - t0) * spd;
    if (x < -150 || x > 1300) return;
    const y = y0 - (t - t0) * 18 + 10 * Math.sin((t - t0) * 2 + i);
    const flap = Math.sin(t * 8.5 + i * 2.3);
    const w = sz;
    strokes.push([[x - w, y - 10 * flap * sz / 26 - 4], [x - w * 0.45, y - 4 * flap], [x, y + 4], [x + w * 0.45, y - 4 * flap], [x + w, y - 10 * flap * sz / 26 - 4]]);
  });
  lines('birds', strokes, { brush: '2B', c: C.ink, w: 0.9, curv: 0.55 });
}

// ---------------------------------------------------------------------------
// Sun drawn by the thread: outline traced as a fraction, then gold flood + rays
// ---------------------------------------------------------------------------
export function sunCircle(n = 48) {
  // starts at the left (where the thread arrives) and runs clockwise
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + i / n * TAU;
    out.push([SUN[0] + Math.cos(a) * SUN_R, SUN[1] + Math.sin(a) * SUN_R]);
  }
  return out;
}

export function drawSun(t, flood, rays) {
  if (flood > 0.01) {
    shape('sun-glow', ellipsePts(SUN[0], SUN[1], SUN_R * 2.3 * flood, SUN_R * 2.3 * flood, 20),
      { fill: PAL.sunGlow, fillA: 130 * flood, bleed: 0.3, tex: 0.25, border: 0.1, stroke: false });
    shape('sun-body', ellipsePts(SUN[0], SUN[1], SUN_R, SUN_R, 18),
      { wash: PAL.sun, washA: 235 * flood, fill: PAL.sunDeep, fillA: 90 * flood, bleed: 0.06, tex: 0.45, border: 0.6, stroke: false });
  }
  if (rays > 0.01) {
    const list = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + t * 0.1;
      const g = spring(rays, i * 0.04, 2.0, 0.4);
      const r0 = SUN_R + 22, r1 = SUN_R + 22 + (38 + 18 * (i % 2)) * g;
      list.push([add(SUN, mul(dir(a), r0)), add(SUN, mul(dir(a), r1))]);
    }
    lines('sun-rays', list, { brush: '2B', c: '#c7891f', w: 1.0 });
  }
}
