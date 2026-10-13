// Entry point: p5 lifecycle, physics precompute, frame assembly, plates and compositing.
import { clamp, mix, smooth, seg, track, hash, add, sub, mul, lerp2, rot, dir, norm, len, dist, ellipsePts, polySlice, smoothOpen,
  smoothClosed, hexMix, vnoise, TAU, easeOut, spring, ihash } from './util.js';
import { INK, C, shape, line, lines, dot, washes, off } from './ink.js';
import { ASH, SUNNY, STRANGER, solve, drawCharacter, drawHand } from './rig.js';
import { Chain, Spring2, SpringBank } from './sim.js';
import * as Wd from './world.js';
import * as St from './story.js';

const W = 1080, H = 1920;
const { FPS, NF } = St;
const PLATE = { x0: -60, y0: -100, w: 1220, h: 2120, scale: 2 };
const PLATE_STATES = { A: { gloom: 0.55, warm: 0 }, B: { gloom: 1, warm: 0 }, C: { gloom: 0, warm: 1 } };

const params = new URLSearchParams(location.search);
const PLATE_MODE = params.has('plate');

let plates = null;
let SIM = null;
let paperTex = null, outCanvas = null;
let pending = null; // what draw() should render next

// ---------------------------------------------------------------------------
// Physics precompute (deterministic, 120 Hz)
// ---------------------------------------------------------------------------
function solveAll(t) {
  const sJ = solve(SUNNY, St.poseSunny(t));
  const aJ = solve(ASH, St.poseAsh(t, sJ));
  return { aJ, sJ };
}

function hoodAnchors(aJ) {
  return [add(aJ.neckFront, mul(aJ.fwd, -5)), add(aJ.neckFront, mul(aJ.fwd, 7))];
}
function scarfAnchor(sJ) { return add(sJ.neckFront, mul(sJ.fwd, -2)); }
function curlAnchors(sJ) {
  const r = SUNNY.headR, f = sJ.f;
  const tilt = (sJ.pose.headTilt ?? 0) + (sJ.pose.lean ?? 0) * 0.35 + (sJ.pose.neck ?? 0) * 0.5;
  const R = (p) => add(sJ.H, rot([p[0] * f * r, p[1] * r], f * tilt));
  return [R([0.55, -0.55]), R([-0.75, 0.25]), R([-0.55, 0.55])];
}

function precompute() {
  const SUB = 5, dt = 1 / (FPS * SUB);
  const grass = new SpringBank(Wd.TUFTS.length, 34, 3.2);
  const tree = new SpringBank(Wd.TREE_N, 11, 2.0);
  const hood = [new Chain(6, 8, { damping: 0.955, stiffness: 0.04, wind: 0.12 }), new Chain(6, 8, { damping: 0.955, stiffness: 0.04, wind: 0.12 })];
  const scarf = new Chain(8, 11, { damping: 0.965, stiffness: 0.22, wind: 0.9 });
  const curls = [new Chain(4, 9, { damping: 0.94, stiffness: 0.45, wind: 0.35 }), new Chain(4, 8, { damping: 0.94, stiffness: 0.45, wind: 0.35 }), new Chain(3, 8, { damping: 0.94, stiffness: 0.5, wind: 0.3 })];
  const bun = new Spring2(260, 15);

  const w0 = St.look(0).wind;
  grass.a.set(Wd.grassTargets(0, w0));
  tree.a.set(Wd.treeClusterTargets(0, w0));
  let { aJ, sJ } = solveAll(0);
  hoodAnchors(aJ).forEach((a, i) => hood[i].init(a, [0, 1]));
  scarf.init(scarfAnchor(sJ), [0.5, 0.86]);
  curlAnchors(sJ).forEach((a, i) => curls[i].init(a, [0, 1]));
  bun.init(sJ.H);

  const frames = [];
  for (let fi = 0; fi < NF; fi++) {
    frames.push({
      grass: grass.snapshot(), tree: tree.snapshot(),
      hood: hood.map((c) => c.snapshot()), scarf: scarf.snapshot(), curls: curls.map((c) => c.snapshot()),
      bun: sub(bun.x, sJ.H),
    });
    for (let s = 1; s <= SUB; s++) {
      const t = (fi * SUB + s) / (FPS * SUB);
      const ws = St.look(t).wind;
      ({ aJ, sJ } = solveAll(t));
      const gt = Wd.grassTargets(t, ws);
      grass.step(dt, (i) => gt[i]);
      const tt = Wd.treeClusterTargets(t, ws);
      tree.step(dt, (i) => tt[i]);
      const wa = Wd.wind(aJ.S[0], t, ws), wsun = Wd.wind(sJ.S[0], t, ws);
      hoodAnchors(aJ).forEach((a, i) => hood[i].step(dt, a, [wa * 260, 0], [{ c: aJ.M, r: 30 }]));
      scarf.step(dt, scarfAnchor(sJ), [wsun * 900 + 120, -60], [], norm([0.25, 1]));
      curlAnchors(sJ).forEach((a, i) => curls[i].step(dt, a, [wsun * 380, 0]));
      bun.step(dt, sJ.H);
    }
  }
  return frames;
}

// ---------------------------------------------------------------------------
// Frame assembly
// ---------------------------------------------------------------------------
function surfaceFn(aJ, sJ, U, t) {
  const heads = [[aJ.H, ASH.headR]];
  const shoulders = [aJ.S];
  if (t > 9.5) { heads.push([sJ.H, SUNNY.headR]); shoulders.push(sJ.S); }
  const canopy = U && U.open > 0.6 ? U.geom.dome : null;
  return (x) => {
    let y = Wd.groundY(x) + 22;
    if (x > 338 && x < 796) y = Math.min(y, Wd.SEAT_Y);
    for (const [h, r] of heads) {
      const dx = Math.abs(x - h[0]);
      if (dx < r * 1.08) y = Math.min(y, h[1] - Math.sqrt(Math.max(0, r * r * 1.17 - dx * dx)));
    }
    for (const s of shoulders) if (Math.abs(x - s[0]) < 40) y = Math.min(y, s[1] - 4);
    if (canopy) {
      for (let i = 0; i < canopy.length - 1; i++) {
        const a = canopy[i], b = canopy[i + 1];
        if ((x >= a[0] && x <= b[0]) || (x >= b[0] && x <= a[0])) {
          y = Math.min(y, mix(a[1], b[1], (x - a[0]) / ((b[0] - a[0]) || 1)) - 3);
          break;
        }
      }
    }
    return y;
  };
}

function drawUmbrella(U) {
  const G = U.geom;
  line('umb-shaft', [G.hand, G.apex], { brush: '2B', c: C.ink, w: 1.25 });
  const hk = add(G.hand, mul(G.d, -24));
  line('umb-hook', [add(G.hand, mul(G.d, 6)), hk, add(hk, add(mul(G.p, -15), mul(G.d, -10))), add(hk, add(mul(G.p, -23), mul(G.d, 6)))],
    { brush: '2B', c: Wd.PAL.woodDark, w: 1.7, curv: 0.8 });
  const canopy = G.dome.concat(G.bottom.slice(1, -1));
  shape('umb-canopy', canopy, { wash: '#e9b431', washA: 250, fill: '#c88f1c', fillA: 85, tex: 0.6, bleed: 0.04, border: 0.5, w: 1.1, curv: 0.4, dense: false,
    hatch: G.open > 0.5 ? { d: 11, a: 0.6, brush: 'HB', c: '#c4891a', w: 0.4 } : null });
  const ribs = [];
  for (let i = 1; i < G.ribs.length - 1; i++) {
    const a = add(G.apex, mul(G.d, -6)), b = G.ribs[i];
    ribs.push([a, add(lerp2(a, b, 0.5), mul(G.d, G.Rc * 0.04)), b]);
  }
  lines('umb-ribs', ribs, { brush: 'HB', c: '#b17c14', w: 0.8, curv: 0.6 });
  line('umb-tip', [G.apex, add(G.apex, mul(G.d, 20))], { brush: '2B', w: 1.2 });
}

// tangle → thread → sun
function threadPath(head) {
  const c = add(head, [-10, -112]);
  const rise = smoothOpen([c, add(c, [-30, -150]), [610, 760], [580, 560], [640, 430], [Wd.SUN[0] - Wd.SUN_R, Wd.SUN[1]]], 8);
  const circ = Wd.sunCircle(56);
  return { c, rise, circ, all: rise.concat(circ.slice(1)) };
}

function tanglePts(t, c, amt, n = 64) {
  const R = 30 + 56 * amt;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const cc = [c[0] + (vnoise(i * 0.12 + t * 0.15, 1) - 0.5) * R * 1.3, c[1] + (vnoise(i * 0.12 - t * 0.12, 2) - 0.5) * R * 0.7];
    const a = i * 0.95 + t * (0.8 + amt * 1.6);
    const r = R * (0.3 + 0.44 * vnoise(i * 0.45, 3));
    pts.push([cc[0] + Math.cos(a) * r * 1.25, cc[1] + Math.sin(a) * r * 0.85]);
  }
  return pts;
}

function drawThread(t, aJ) {
  const th = St.threadState(t);
  const path = threadPath(aJ.H);
  const riseFrac = St_riseFrac(path);
  if (th.draw <= 0 && th.unravel <= 0) {
    if (th.amount < 0.02) return;
    const pts = tanglePts(t, path.c, th.amount);
    lines('tangle', [pts, pts.slice(3).map((p, i) => add(p, [9 * Math.sin(i * 1.7), 7 * Math.cos(i * 1.3)]))],
      { brush: 'pen', c: C.ink, w: mix(0.6, 0.85, th.amount), curv: 0.75 });
    return;
  }
  if (th.draw <= 0) {
    // unravel: tangle points pull straight onto the start of the rising path
    const pts = tanglePts(t, path.c, th.amount);
    const target = polySlice(path.all, 0, 0.12);
    const tgt = pts.map((_, i) => {
      const s = i / (pts.length - 1);
      return polySlice(target, 0, Math.max(0.001, s)).slice(-1)[0];
    });
    const u = smooth(th.unravel);
    const out = pts.map((p, i) => lerp2(p, tgt[i], clamp(u * 1.4 - (i / pts.length) * 0.4)));
    line('tangle', out, { brush: 'pen', c: C.ink, w: 0.8, curv: 0.7 });
    return;
  }
  // drawing: a window travels along the path, a wave runs up the line
  const u = th.draw;
  const s1 = mix(0.12, 1, u);
  const s0 = clamp((u - 0.35) / 0.65) * riseFrac;
  let seg2 = polySlice(path.all, s0, s1);
  seg2 = seg2.map((p, i) => {
    const k = i / Math.max(1, seg2.length - 1);
    const a = 9 * (1 - u) * Math.sin(k * 14 - t * 9);
    return add(p, [a, 0]);
  });
  line('thread', seg2, { brush: 'pen', c: C.ink, w: 0.95, curv: 0.6 });
}
let _riseFrac = null;
function St_riseFrac(path) {
  if (_riseFrac == null) {
    const lr = path.rise.reduce((a, p, i) => (i ? a + dist(p, path.rise[i - 1]) : 0), 0);
    const lc = Wd.sunCircle(56).reduce((a, p, i, arr) => (i ? a + dist(p, arr[i - 1]) : 0), 0);
    _riseFrac = lr / (lr + lc);
  }
  return _riseFrac;
}

function drawLastDrops(t) {
  const polys = [];
  Wd.FLOWERS.slice(0, 7).forEach((f, i) => {
    const d = St.LAST_DROPS[i];
    if (t < d.t0) return;
    const cs = Wd.cloudShape(d.t0, St.cloudState(d.t0));
    const y = cs.base + (t - d.t0) * 1250;
    if (y > f.y) return;
    const stretch = 1 + clamp((t - d.t0) * 3) * 0.6;
    polys.push([[f.x, y - 16 * stretch], [f.x + 6, y - 2], [f.x, y + 6], [f.x - 6, y - 2]]);
  });
  if (!polys.length) return;
  washes('lastdrop', polys.map((p) => smoothClosed(p, 3)), '#a7c6e2', 240);
  lines('lastdrop-ol', polys.map((p) => smoothClosed(p, 3).concat([p[0]])), { brush: 'HB', c: Wd.PAL.rain, w: 0.6, curv: 0.6 });
}

function drawBloom(t) {
  if (t < 19.25 || t > 21.2) return;
  const c = [588, Wd.SEAT_Y - 10];
  const cols = ['#f6c77a', '#f2a07a', '#f7dc9a'];
  for (let k = 0; k < 3; k++) {
    const u = easeOut(clamp((t - 19.3 - k * 0.2) / 1.3));
    if (u <= 0) continue;
    const r = (60 + 170 * k) * u + 20;
    shape('bloom' + k, ellipsePts(c[0], c[1], r, r * 0.92, 18), { fill: cols[k], fillA: 150 * (1 - u * 0.55), bleed: 0.3, tex: 0.5, border: 0.6, stroke: false });
  }
}

function drawTear(t, aJ) {
  const u = seg(t, 7.6, 9.1);
  if (u <= 0 || u >= 1 || !aJ.headFrame) return;
  const { R } = aJ.headFrame;
  const e = R([0.62, 0.1]);
  const p = add(e, [4, 6 + easeOut(u) * 120]);
  const st = 1 + u * 0.7;
  shape('A-tear', [add(p, [0, -12 * st]), add(p, [6, 1]), add(p, [0, 7]), add(p, [-6, 1])], { wash: '#a6c8e4', washA: 240, stroke: Wd.PAL.rain, w: 0.6, brush: 'HB', curv: 0.6 });
}

function drawPhoneGlow(xJ) {
  const [args] = xJ.handArgsN || [];
  if (!args) return;
  const wrist = args[1], d = args[2];
  const c = add(wrist, mul(d, 10));
  const n = [-d[1], d[0]];
  const pts = [add(c, add(mul(d, -6), mul(n, -4))), add(c, add(mul(d, 9), mul(n, -4))), add(c, add(mul(d, 9), mul(n, 4))), add(c, add(mul(d, -6), mul(n, 4)))];
  shape('X-phone', pts, { wash: '#cfe3f0', washA: 250, stroke: C.ink, w: 0.6, brush: 'HB', curv: 0.1, dense: false });
}

function renderScene(fi) {
  const t = fi / FPS;
  const L = St.look(t);
  const [cx, cy, z] = St.camera(t);
  const sim = SIM[fi];
  INK.T = t;
  INK.boil = Math.floor(fi / 2) % 3;
  INK.wscale = 1 / Math.pow(z, 0.55);
  INK.reveal = t < 2.2 ? (id) => St.reveal(t, id) : null;

  background(C.paper);
  scale(z);
  translate(-cx, -cy);

  // plates
  if (plates) {
    const g = clamp((L.gloom - 0.55) / 0.45);
    const b = INK.boil;
    const draw = (img, a) => { if (a > 0.003) { push(); tint(255, a * 255); image(img, PLATE.x0, PLATE.y0, PLATE.w, PLATE.h); pop(); } };
    draw(plates.A[b], L.plate);
    draw(plates.B[b], g * L.plate);
    draw(plates.C[b], L.warm * L.plate);
  } else {
    Wd.drawSet({ gloom: L.gloom, warm: L.warm });
  }

  const th = St.threadState(t);
  // the sun the thread draws
  Wd.drawSun(t, th.flood, th.rays);
  if (th.draw >= 1) line('sun-ol', Wd.sunCircle(56), { brush: 'pen', c: C.ink, w: 0.95, curv: 0.6 });
  Wd.drawSmoke(t, L.warm);
  Wd.drawBirds(t, St.BIRDS.filter((b) => b[2] < 12));

  // tree + leaves
  Wd.drawTree(t, L.warm, L.wind, sim.tree, seg(t, 24.2, 26.5));
  Wd.drawFallingLeaves(t, L.warm, L.wind, St.LEAVES);

  // passer-by on the far path
  if (t > 1.4 && t < 5.6) {
    const xJ = solve(STRANGER, St.poseStranger(t, (x) => 1268 + 30 * Math.sin(x * 0.009 + 2.1)));
    drawCharacter(xJ);
    drawPhoneGlow(xJ);
  }

  // bench, puddle, back grass
  Wd.drawBench(seg(t, 19.3, 20.6));
  Wd.drawPuddle(t, St.cloudState(t).rain, L.warm, 0.6 + 0.4 * seg(t, 1, 12));
  Wd.drawGrass(sim.grass, L.warm, false);
  drawBloom(t);

  // characters
  const sPose = St.poseSunny(t);
  const sJ = solve(SUNNY, sPose);
  const aPose = St.poseAsh(t, sJ);
  const aJ = solve(ASH, aPose);
  sPose.bun = sim.bun.map((v) => clamp(v, -9, 9) * 0.9);
  const U = { ...sPose.umbrella };
  U.geom = St.umbrellaGeom(U);
  const umbrellaFront = U.open > 0.04 || track([[14.15, 0], [14.6, 1]], t) > 0.5 && t < 24;

  const ashExtras = {
    afterTorso: [() => lines('A-hood', sim.hood, { brush: 'HB', c: '#e9e3d6', w: 1.3, curv: 0.6 })],
    afterHead: [(j) => drawTear(t, j)],
  };
  const sunnyExtras = {
    before: umbrellaFront ? [] : [() => drawUmbrella(U)],
    afterTorso: [() => {
      // scarf: wrap + physics tail
      const nf = sJ.neckFront;
      shape('S-scarf', [add(nf, mul(sJ.fwd, -40)), add(nf, add(mul(sJ.fwd, -10), mul(sJ.u, 14))), add(nf, mul(sJ.fwd, 16)),
        add(nf, add(mul(sJ.fwd, 8), mul(sJ.u, -12))), add(nf, add(mul(sJ.fwd, -30), mul(sJ.u, -10)))], { wash: SUNNY.col.scarf, washA: 252, w: 0.9, curv: 0.6 });
      const tail = sim.scarf;
      if (tail.length > 2) {
        const widths = tail.map((_, i) => 20 - i * 0.6);
        shape('S-scarftail', tubeFrom(tail, widths), { wash: SUNNY.col.scarf, washA: 252, w: 0.85, curv: 0.5 });
        lines('S-scarfstripe', [tail.slice(1, -1).map((p, i) => add(p, [0, 0]))], { brush: 'HB', c: SUNNY.col.scarfDark, w: 0.6, curv: 0.6 });
        lines('S-fringe', [-5, 0, 5].map((o) => { const e = tail[tail.length - 1], d = norm(sub(e, tail[tail.length - 2])); const n = [-d[1], d[0]]; const b = add(e, mul(n, o)); return [b, add(b, mul(d, 9))]; }), { brush: 'HB', c: SUNNY.col.scarfDark, w: 0.6 });
      }
    }],
    afterHead: [() => lines('S-curls', sim.curls, { brush: '2B', c: SUNNY.col.hair, w: 1.4, curv: 0.7 })],
  };

  if (t < 9.5 || sPose.sit < 0.5) {
    drawCharacter(aJ, ashExtras);
    if (t >= 9.5) drawCharacter(sJ, sunnyExtras);
  } else {
    // seated: Sunny's body first, Ash in between, then Sunny's head (cheek over Ash's hair at the end)
    const order = sPose.order;
    sJ.pose = { ...sPose, order: order.filter((p) => p !== 'head') };
    drawCharacter(sJ, { before: sunnyExtras.before, afterTorso: sunnyExtras.afterTorso });
    drawCharacter(aJ, ashExtras);
    sJ.pose = { ...sPose, order: ['head'] };
    drawCharacter(sJ, { afterHead: sunnyExtras.afterHead });
    // Sunny's thumb closes over Ash's hand
    if (sJ.handArgsN && sPose.handKindN === 'palmUp') {
      const [args, opts] = sJ.handArgsN;
      drawHand(...args, { ...opts, part: 'thumb' });
    }
  }

  // weather
  const cst = St.cloudState(t);
  const cs = Wd.cloudShape(t, { ...cst, pos: add(cst.pos, cst.bob) });
  Wd.drawCloud(t, { ...cst }, cs);
  const bolt = seg(t, 6.98, 7.3);
  if (bolt > 0 && bolt < 1) Wd.drawLightning(cs, bolt);
  Wd.drawRain(t, cs, cst.rain, surfaceFn(aJ, sJ, U, t));
  if (umbrellaFront && t >= 9.5) drawUmbrella(U);
  drawThread(t, aJ);
  drawLastDrops(t);

  // foreground life
  const births = St.flowerBirths(Wd.FLOWERS, (tt) => Wd.cloudShape(tt, St.cloudState(tt)));
  Wd.drawFlowers(t, births, L.wind);
  Wd.drawGrass(sim.grass, L.warm, true);
  if (t > 26.2) {
    const bt = t - 26.2;
    const p = [700 + 150 * Math.sin(bt * 0.8) + 60 * Math.sin(bt * 2.1), 1500 - 90 * Math.sin(bt * 0.6) + 30 * Math.sin(bt * 3.3) - bt * 18];
    Wd.drawButterfly(t, p, t);
  }
  Wd.drawBirds(t, St.BIRDS.filter((b) => b[2] >= 12));
  return L;
}

function tubeFrom(pts, widths) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const d = norm(sub(b, a)), n = [-d[1], d[0]];
    L.push(add(pts[i], mul(n, widths[i] / 2)));
    R.push(sub(pts[i], mul(n, widths[i] / 2)));
  }
  return L.concat(R.reverse());
}

// ---------------------------------------------------------------------------
// Compositing (2D canvas): grade, paper grain, vignette, flash, fades
// ---------------------------------------------------------------------------
function makePaper() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H), d = img.data;
  const colN = Array.from({ length: W }, (_, x) => vnoise(x * 0.01, 3));
  const rowN = Array.from({ length: H }, (_, y) => vnoise(y * 0.008, 5));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const m = colN[x] * 0.5 + rowN[y] * 0.3 + ihash(x >> 5, y >> 5) * 0.2;
      const v = 255 - ihash(x, y) * 15 - m * 12;
      d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 4; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05; g.strokeStyle = '#6b5a40'; g.lineWidth = 1;
  for (let i = 0; i < 1500; i++) {
    const x = hash('fx', i) * W, y = hash('fy', i) * H, a = hash('fa', i) * TAU, l = 6 + hash('fl', i) * 22;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
}

function compose(L) {
  if (!outCanvas) { outCanvas = document.createElement('canvas'); outCanvas.width = W; outCanvas.height = H; }
  const g = outCanvas.getContext('2d');
  const src = document.querySelector('canvas');
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.filter = `saturate(${L.sat}) brightness(${L.bri})`;
  g.drawImage(src, 0, 0, W, H);
  g.filter = 'none';
  g.globalCompositeOperation = 'multiply';
  g.drawImage(paperTex, 0, 0);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = `rgba(255,168,80,${0.24 * L.warm})`; g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(66,88,130,${0.24 * L.gloom * (1 - L.warm)})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply';
  const inner = mix(0.36, 0.2, L.vig), outer = mix(0.78, 0.62, L.vig);
  const vg = g.createRadialGradient(W / 2, H * 0.47, H * inner, W / 2, H * 0.5, H * outer);
  vg.addColorStop(0, 'rgba(255,255,255,1)');
  const k = mix(0.16, 0.3, L.vig);
  vg.addColorStop(1, `rgba(${Math.round(255 * (1 - k * 0.9))},${Math.round(255 * (1 - k))},${Math.round(255 * (1 - k * (1 - L.warm * 0.3)))},1)`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'screen';
  if (L.flash > 0) { g.fillStyle = `rgba(255,252,236,${L.flash})`; g.fillRect(0, 0, W, H); }
  g.globalCompositeOperation = 'source-over';
  if (L.fadeOut > 0) {
    g.globalAlpha = smooth(L.fadeOut);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply'; g.drawImage(paperTex, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  return outCanvas;
}

// ---------------------------------------------------------------------------
// p5 lifecycle + renderer API
// ---------------------------------------------------------------------------
window.setup = async function () {
  pixelDensity(1);
  if (PLATE_MODE) createCanvas(PLATE.w * PLATE.scale, PLATE.h * PLATE.scale, WEBGL);
  else createCanvas(W, H, WEBGL);
  angleMode(RADIANS);
  brush.scaleBrushes(4);
  noLoop();
  if (!PLATE_MODE) {
    const t0 = performance.now();
    SIM = precompute();
    console.log(`physics precomputed in ${(performance.now() - t0).toFixed(0)} ms`);
    paperTex = makePaper();
    if (!params.has('noplates')) {
      try {
        plates = {};
        for (const k of ['A', 'B', 'C']) plates[k] = await Promise.all([0, 1, 2].map((b) => loadImage(`out/plates/${k}${b}.png`)));
      } catch (e) {
        console.warn('plates missing; painting the set live');
        plates = null;
      }
    }
  }
  window.filmReady = true;
};

window.draw = function () {
  if (!pending) return;
  const job = pending;
  if (job.type === 'plate') {
    const st = PLATE_STATES[job.key];
    INK.boil = job.boil; INK.wscale = 1 / Math.pow(PLATE.scale, 0.0); INK.reveal = null;
    background(C.paper);
    translate(-width / 2, -height / 2);
    scale(PLATE.scale);
    translate(-PLATE.x0, -PLATE.y0);
    Wd.drawSet(st);
  } else {
    job.look = renderScene(job.frame);
  }
};

window.renderFrame = async (fi) => {
  pending = { type: 'frame', frame: fi };
  await redraw();
  const L = pending.look;
  pending = null;
  return compose(L).toDataURL('image/png');
};

window.renderPlate = async (key, boil) => {
  pending = { type: 'plate', key, boil };
  await redraw();
  pending = null;
  return document.querySelector('canvas').toDataURL('image/png');
};

window.FILM = { W, H, FPS, NF };
