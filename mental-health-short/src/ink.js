// p5.brush drawing helpers. Every visible mark in the film goes through these.
// - Each element is seeded by (id, boil variant) so it re-inks consistently: three
//   variants cycle to give a living "line boil".
// - The camera is applied to coordinates here (not via p5 transforms) and line weights
//   grow softly with zoom, so pencil grain stays crisp in close-ups.
// - A per-element "reveal" lets the opening shot doodle itself onto the paper.
import { clamp, smooth, hash, smoothClosed, ellipsePts, polySlice } from './util.js';

export const INK = {
  T: 0,
  boil: 0,
  cam: { cx: 0, cy: 0, z: 1 }, // world → screen camera, applied to every point here
  reveal: null, // (id) => 0..1, or null when everything is fully drawn
};

// The camera is applied to coordinates instead of via p5's transform: p5.brush scales its
// pencil grain with the transform, which would turn zoomed lines into sparse dots.
export const X = (p) => [(p[0] - INK.cam.cx) * INK.cam.z, (p[1] - INK.cam.cy) * INK.cam.z];
export const XS = (pts) => pts.map(X);
const WZ = () => Math.pow(INK.cam.z, 0.45);

export const C = {
  paper: '#f3ead8',
  ink: '#2b2830',
  inkSoft: '#5d5862',
  inkLight: '#8a8590',
};

export function seedEl(id, salt = 0) {
  randomSeed(Math.floor(hash(id, INK.boil, salt) * 2147483647));
}

export function off() {
  brush.noStroke(); brush.noFill(); brush.noHatch(); brush.noWash(); brush.noField();
}

const revealOf = (id) => (INK.reveal ? INK.reveal(id) : 1);

// Closed shape: optional flat wash, watercolour fill, hatch, and pencil/ink outline.
export function shape(id, pts, o = {}) {
  if (!pts || pts.length < 3) return;
  const r = revealOf(id);
  if (r <= 0) return;
  seedEl(id);
  off();
  const dense = XS(o.dense === false ? pts : smoothClosed(pts, o.per || 4));
  pts = XS(pts);
  const paint = smooth(clamp((r - 0.45) / 0.55));
  if (o.wash && paint > 0) {
    brush.wash(o.wash, (o.washA ?? 240) * paint);
    brush.polygon(dense);
    brush.noWash();
  }
  if (o.fill && paint > 0) {
    brush.fill(o.fill, (o.fillA ?? 140) * paint);
    brush.fillBleed(o.bleed ?? 0.08);
    brush.fillTexture(o.tex ?? 0.5, o.border ?? 0.35);
    brush.polygon(dense);
    brush.noFill();
  }
  if (o.hatch && paint > 0.5) {
    brush.hatch(o.hatch.d * INK.cam.z, o.hatch.a, { rand: o.hatch.rand ?? 0.15, gradient: o.hatch.gradient ?? false });
    brush.hatchStyle(o.hatch.brush || 'HB', o.hatch.c || C.ink, (o.hatch.w || 0.5) * WZ());
    brush.polygon(dense);
    brush.noHatch();
  }
  if (o.stroke !== false) {
    brush.set(o.brush || '2B', o.stroke || C.ink, (o.w ?? 1) * WZ());
    if (r < 1) {
      const loop = (o.dense === false ? pts : dense).concat([pts[0]]);
      const part = polySlice(loop, 0, r);
      if (part.length > 1) brush.spline(part, 0.4);
    } else {
      brush.beginShape(o.curv ?? 0.5);
      for (const p of pts) brush.vertex(p[0], p[1]);
      brush.endShape(true);
    }
  }
  off();
}

// Open stroke through points.
export function line(id, pts, o = {}) {
  const r = revealOf(id);
  if (r <= 0 || pts.length < 2) return;
  seedEl(id);
  off();
  brush.set(o.brush || '2B', o.c || C.ink, (o.w ?? 1) * WZ());
  let p = XS(pts);
  if (r < 1) p = polySlice(p, 0, r);
  if (p.length === 2 && !o.curv) brush.line(p[0][0], p[0][1], p[1][0], p[1][1]);
  else if (p.length >= 2) brush.spline(p, o.curv ?? 0.5);
  off();
}

// Many strokes in one colour: p5.brush batches same-colour marks into one composite.
export function lines(id, list, o = {}) {
  const r = revealOf(id);
  if (r <= 0) return;
  off();
  brush.set(o.brush || 'HB', o.c || C.ink, (o.w ?? 0.8) * WZ());
  list.forEach((pts, i) => {
    if (!pts || pts.length < 2) return;
    seedEl(id, i);
    let p = XS(pts);
    if (r < 1) p = polySlice(p, 0, r);
    if (p.length < 2) return;
    if (p.length === 2 && !o.curv) brush.line(p[0][0], p[0][1], p[1][0], p[1][1]);
    else brush.spline(p, o.curv ?? 0.5);
  });
  off();
}

// Flat dot (eyes, buttons, centres of flowers).
export function dot(id, p, r, col, a = 245) {
  const rv = revealOf(id);
  if (rv <= 0.4) return;
  seedEl(id);
  off();
  brush.wash(col, a);
  const q = X(p);
  brush.polygon(ellipsePts(q[0], q[1], r * INK.cam.z, r * INK.cam.z, 12));
  off();
}

// Several flat polygons in one colour (batched).
export function washes(id, polys, col, a = 240) {
  const r = revealOf(id);
  if (r <= 0.45) return;
  off();
  brush.wash(col, a * smooth(clamp((r - 0.45) / 0.55)));
  polys.forEach((p, i) => { seedEl(id, i); brush.polygon(XS(p)); });
  off();
}

// Watercolour fill over several polygons in one colour.
export function fills(id, polys, col, a = 140, bleed = 0.08, tex = 0.6, border = 0.4) {
  const r = revealOf(id);
  if (r <= 0.45) return;
  off();
  brush.fill(col, a * smooth(clamp((r - 0.45) / 0.55)));
  brush.fillBleed(bleed);
  brush.fillTexture(tex, border);
  polys.forEach((p, i) => { seedEl(id, i); brush.polygon(XS(p)); });
  off();
}
