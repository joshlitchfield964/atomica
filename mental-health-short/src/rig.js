// 2D character rig: skeleton (pelvis → spine → neck → head, shoulders → arms → hands,
// hips → legs → feet), two-bone IK on all limbs, 2D head turn, and p5.brush "skins".
import { add, sub, mul, lerp2, norm, perp, rot, dir, angleOf, dist, mix, clamp, ik2, tube, ellipsePts, hexMix } from './util.js';
import { shape, line, dot, lines, C } from './ink.js';

export const ASH = {
  id: 'A',
  spine: 112, neck: 14, headR: 48, upper: 70, fore: 64, hand: 30, thigh: 66, shin: 62,
  hipW: 84, chestW: 78,
  col: {
    top: '#7189a8', topDark: '#55698a', topLight: '#93a9c4',
    pants: '#3a3f51', shoe: '#f4efe6', sole: '#c9c2b5',
    skin: '#f1d0b3', skinDark: '#d9a98c', hair: '#2e2a35', hairLight: '#5a5466', blush: '#ea9a8c',
  },
};

export const SUNNY = {
  id: 'S',
  spine: 125, neck: 16, headR: 46, upper: 74, fore: 68, hand: 31, thigh: 100, shin: 98,
  hipW: 88, chestW: 80,
  col: {
    top: '#c9673f', topDark: '#9c4b2e', topLight: '#de8a62',
    pants: '#3d4254', shoe: '#5b3a2a', sole: '#3a2519',
    skin: '#eec8a6', skinDark: '#d39f80', hair: '#7a3b22', hairLight: '#a65a36', blush: '#e88f80',
    scarf: '#e8b434', scarfDark: '#c08d1c',
  },
};

export const STRANGER = {
  id: 'X',
  spine: 125, neck: 16, headR: 42, upper: 72, fore: 66, hand: 28, thigh: 100, shin: 98,
  hipW: 80, chestW: 76,
  col: {
    top: '#8e9196', topDark: '#6e7176', topLight: '#a9acb0',
    pants: '#4a4d57', shoe: '#2f2c33', sole: '#222',
    skin: '#e8c7aa', skinDark: '#caa184', hair: '#4b3f3a', hairLight: '#6b5d56', blush: '#e2a090',
  },
};

// ---------------------------------------------------------------------------
// Solve: pose (targets + angles) → joint positions
// ---------------------------------------------------------------------------
export function solve(def, pose) {
  const f = pose.facing;
  const sc = pose.scale ?? 1;
  const P = pose.pelvis;
  const lean = pose.lean ?? 0;
  const sp = def.spine * (pose.squash ?? 1) * sc;
  const u = [Math.sin(f * lean), -Math.cos(f * lean)];   // spine "up"
  const fwd = [-u[1] * f, u[0] * f];                        // forward, perpendicular to spine
  const breath = pose.breath ?? 0;
  const S = add(add(P, mul(u, sp)), mul(u, breath * 2.2 * sc));
  const curl = pose.curl ?? 0;
  const M = add(lerp2(P, S, 0.5), mul(fwd, -curl * sp * 0.24));

  const headDir = rot(u, f * (pose.neck ?? 0));
  let H = add(S, mul(headDir, (def.neck + def.headR * 0.86) * sc));
  if (pose.headOffset) H = add(H, add(mul(fwd, pose.headOffset[0] * sc), mul(u, pose.headOffset[1] * sc)));
  if (pose.headPos) H = lerp2(H, pose.headPos, pose.headPosW ?? 1);

  const shN = add(add(S, mul(fwd, 3 * sc)), mul(u, (-16 + breath * 1.2) * sc));
  const shF = add(shN, mul(fwd, -10 * sc));
  const hipN = add(P, mul(fwd, 6 * sc));
  const hipF = add(P, mul(fwd, -4 * sc));

  const limb = (root, target, l1, l2, bend) => {
    const r = ik2(root, target, l1 * sc, l2 * sc, bend);
    return { root, mid: r.mid, end: r.end };
  };
  const eb = (pose.elbowFlip ?? 1) * f;
  const armN = limb(shN, pose.handN, def.upper, def.fore, eb);
  const armF = limb(shF, pose.handF, def.upper, def.fore, pose.elbowFlipF ? -eb : eb);
  const fsN = pose.thighFs ?? 1, fsF = pose.thighFsF ?? fsN;
  const legN = limb(hipN, pose.footN, def.thigh * fsN, def.shin, -f);
  const legF = limb(hipF, pose.footF, def.thigh * fsF, def.shin, -f);

  return { def, pose, f, sc, P, S, M, H, u, fwd, shN, shF, hipN, hipF, armN, armF, legN, legF,
    headDir, neckFront: add(add(S, mul(fwd, 14 * sc)), mul(u, -10 * sc)) };
}

// ---------------------------------------------------------------------------
// Skins
// ---------------------------------------------------------------------------
const W = (j, k) => (j.sc ?? 1) * k;

// Point in a local frame: origin o, x along d, y perpendicular (pointing "down" for this facing).
function frame(o, d, f) {
  const y = mul(perp(d), f);
  return (p) => add(o, add(mul(d, p[0]), mul(y, p[1])));
}

function handShape(kind, open) {
  // hand-local units (Ash ~30 long), x along the hand, -y = thumb side / top.
  switch (kind) {
    case 'palmUp': return {
      palm: [[0, -7], [9, -6], [19, -6], [27, -9], [32, -16], [36, -14], [34, -4], [27, 4], [14, 8], [2, 7]],
      thumb: [[7, -7], [10, -17], [15, -19], [18, -14], [15, -6]],
      creases: [[[22, -8], [28, -3]], [[16, -4], [22, 2]]],
    };
    case 'onTop': return {
      palm: [[0, -8], [10, -10], [22, -9], [31, -6], [34, 0], [31, 6], [20, 7], [6, 7], [0, 5]],
      thumb: [[6, 4], [14, 9], [20, 9], [16, 3]],
      creases: [[[26, -7], [28, 4]], [[21, -8], [22, 5]]],
    };
    case 'fist': return {
      palm: [[0, -9], [10, -12], [20, -11], [25, -4], [24, 6], [16, 10], [4, 9], [0, 4]],
      thumb: [[8, -10], [16, -14], [22, -9], [16, -5]],
      creases: [[[18, -6], [22, 2]]],
    };
    case 'phone': return {
      palm: [[0, -8], [10, -10], [20, -8], [24, -2], [22, 6], [12, 9], [2, 8]],
      thumb: [[10, -10], [17, -17], [22, -15], [18, -8]],
      creases: [],
    };
    default: { // relaxed mitten
      const c = open ?? 0;
      return {
        palm: [[0, -9], [11, -11], [23, -10], [30, -5 + c * 2], [31, 2], [27, 9], [15, 11], [3, 9], [0, 5]],
        thumb: [[6, -9], [12, -17], [18, -17], [17, -9]],
        creases: [[[25, -6], [27, 5]]],
      };
    }
  }
}

export function drawHand(id, wrist, d, f, kind, col, scale = 1, opts = {}) {
  if (opts.skip) return;
  const k = scale;
  const Fm = frame(wrist, d, f);
  const h = handShape(kind, opts.open);
  const P = (p) => Fm([p[0] * k, p[1] * k]);
  let thumb = h.thumb;
  if (opts.thumbClose) {
    // rotate thumb about its base towards the palm/over the other hand
    const base = thumb[0], a = opts.thumbClose * 1.25;
    thumb = thumb.map((p) => add(base, rot(sub(p, base), a)));
  }
  const part = opts.part || 'all';
  if (part !== 'thumb') {
    shape(id + '-hd', h.palm.map(P), { wash: col.skin, washA: 252, w: 0.85, brush: 'HB', curv: 0.55 });
    if (h.creases.length) lines(id + '-cr', h.creases.map((c) => c.map(P)), { brush: 'HB', c: col.skinDark, w: 0.55 });
  }
  if (part !== 'palm') shape(id + '-th', thumb.map(P), { wash: col.skin, washA: 252, w: 0.75, brush: 'HB', curv: 0.6 });
}

function drawShoe(id, ankle, f, angle, col, k = 1, boot = false) {
  const d = rot([f, 0], f * angle);
  const Fm = frame(ankle, d, f);
  const P = (p) => Fm([p[0] * k, p[1] * k]);
  const body = boot
    ? [[-11, -16], [4, -16], [6, -6], [20, -4], [31, 1], [31, 9], [-12, 9], [-13, -4]]
    : [[-11, -7], [3, -9], [16, -6], [27, -2], [32, 4], [29, 10], [-10, 10], [-13, 2]];
  shape(id, body.map(P), { wash: col.shoe, washA: 250, w: 0.9, curv: 0.5 });
  line(id + '-sole', [P([-11, 7]), P([29, 7])], { brush: 'HB', c: col.sole, w: 0.8 });
  if (!boot) line(id + '-lace', [P([4, -7]), P([12, -3])], { brush: 'HB', c: col.sole, w: 0.6 });
}

function limbTube(j, L, widths) {
  return tube([L.root, L.mid, L.end], widths.map((w) => W(j, w)));
}

function drawArm(j, side, kind, dark) {
  const { def } = j, col = def.col;
  const L = side === 'N' ? j.armN : j.armF;
  const id = def.id + '-arm' + side;
  const top = dark ? col.topDark : col.top;
  const isCoat = def.id === 'S' || def.id === 'X';
  shape(id, limbTube(j, L, isCoat ? [27, 24, 21] : [30, 27, 27]),
    { wash: top, washA: 252, fill: dark ? null : col.topDark, fillA: 55, tex: 0.6, bleed: 0.02, w: 0.95, curv: 0.55 });
  // cuff
  const d = norm(sub(L.end, L.mid));
  const c = sub(L.end, mul(d, W(j, 5)));
  const n = perp(d);
  line(id + '-cuff', [add(c, mul(n, W(j, 12))), sub(c, mul(n, W(j, 12)))], { brush: 'HB', c: col.topDark, w: 0.7 });
  if (kind !== 'none') {
    const hd = j.pose[side === 'N' ? 'handDirN' : 'handDirF'] ?? d;
    const args = [id + '-h', sub(L.end, mul(d, W(j, 3))), hd, j.f, kind, col, j.sc * (def.hand / 30)];
    const opts = j.pose[side === 'N' ? 'handOptsN' : 'handOptsF'] || {};
    drawHand(...args, opts);
    // thumbs that must sit on top of something drawn later are re-drawn by the caller
    j['handArgs' + side] = [args, opts];
  }
}

function drawLeg(j, side, dark) {
  const { def, pose } = j, col = def.col;
  const L = side === 'N' ? j.legN : j.legF;
  const id = def.id + '-leg' + side;
  shape(id, limbTube(j, L, [36, 30, 25]), { wash: dark ? hexMix(col.pants, '#000000', 0.12) : col.pants, washA: 252, w: 0.95, curv: 0.55 });
  const ang = pose[side === 'N' ? 'footAngN' : 'footAngF'] ?? 0;
  drawShoe(id + '-shoe', L.end, j.f, ang, col, j.sc, def.id === 'S');
}

function drawTorso(j) {
  const { def, pose, P, M, S, u, fwd, f } = j, col = def.col;
  const id = def.id + '-torso';
  const breath = pose.breath ?? 0;
  const chest = def.chestW * (1 + 0.025 * breath);
  if (def.id === 'A') {
    // oversized hoodie
    const body = tube([add(P, mul(u, W(j, -8))), M, add(S, mul(u, W(j, -4)))], [W(j, def.hipW), W(j, chest + 4), W(j, chest * 0.92)], 5);
    shape(id, body, { wash: col.top, washA: 252, fill: col.topDark, fillA: 70, tex: 0.65, bleed: 0.02, w: 1.0,
      hatch: { d: 8, a: f > 0 ? 2.3 : 0.85, brush: 'HB', c: col.topDark, w: 0.42 } });
    // hood bunched behind the neck
    const hc = add(add(S, mul(fwd, W(j, -20))), mul(u, W(j, -2)));
    shape(id + '-hood', ellipsePts(hc[0], hc[1], W(j, 30), W(j, 20), 12, 0, angleOf(fwd) + 0.5 * f),
      { wash: col.topLight, washA: 252, w: 0.9, curv: 0.7 });
    line(id + '-hoodin', [add(hc, mul(fwd, W(j, -14))), add(hc, mul(u, W(j, 8))), add(hc, mul(fwd, W(j, 14)))], { brush: 'HB', c: col.topDark, w: 0.6, curv: 0.7 });
    // kangaroo pocket
    const pk = add(P, mul(u, W(j, 34)));
    line(id + '-pocket', [add(pk, mul(fwd, W(j, 6))), add(pk, add(mul(fwd, W(j, 26)), mul(u, W(j, 6)))), add(pk, add(mul(fwd, W(j, 34)), mul(u, W(j, -16))))],
      { brush: 'HB', c: col.topDark, w: 0.7, curv: 0.5 });
    line(id + '-hem', [add(P, add(mul(fwd, W(j, -34)), mul(u, W(j, 2)))), add(P, add(mul(fwd, W(j, 30)), mul(u, W(j, 4))))], { brush: 'HB', c: col.topDark, w: 0.6 });
  } else {
    // coat: longer, flares at the hem
    const hemDrop = pose.coatHem ?? 34;
    const body = tube([add(P, mul(u, W(j, -hemDrop))), M, add(S, mul(u, W(j, -4)))], [W(j, def.hipW + 10), W(j, chest), W(j, chest * 0.9)], 5);
    shape(id, body, { wash: col.top, washA: 252, fill: col.topDark, fillA: 70, tex: 0.65, bleed: 0.02, w: 1.0,
      hatch: { d: 9, a: f > 0 ? 2.3 : 0.85, brush: 'HB', c: col.topDark, w: 0.42 } });
    // front opening + buttons
    const fr = (k) => add(lerp2(add(P, mul(u, W(j, -hemDrop + 6))), S, k), mul(fwd, W(j, mix(30, 26, k))));
    line(id + '-seam', [fr(0), fr(0.5), fr(0.92)], { brush: 'HB', c: col.topDark, w: 0.7, curv: 0.5 });
    for (let b = 0; b < 3; b++) dot(id + '-btn' + b, add(fr(0.35 + b * 0.2), mul(fwd, W(j, -7))), W(j, 3.8), col.topDark, 255);
    // collar
    const cl = add(S, mul(u, W(j, -10)));
    shape(id + '-collar', [add(cl, mul(fwd, W(j, -24))), add(cl, mul(u, W(j, 10))), add(cl, mul(fwd, W(j, 22))), add(cl, add(mul(fwd, W(j, 8)), mul(u, W(j, -10))))],
      { wash: col.topLight, washA: 250, w: 0.8, curv: 0.6 });
  }
}

// ---------------------------------------------------------------------------
// Head
// ---------------------------------------------------------------------------
function drawHead(j) {
  const { def, pose, H, f } = j, col = def.col;
  const r = W(j, def.headR);
  const face = pose.face || {};
  const tilt = (pose.headTilt ?? 0) + (pose.lean ?? 0) * 0.35 + (pose.neck ?? 0) * 0.5;
  const R = (p) => add(H, rot([p[0] * f * r, p[1] * r], f * tilt));
  const id = def.id + '-head';
  const turn = clamp(face.turn ?? 0.5);
  const fx = mix(0.58, 0.28, turn); // face centre, fraction of r forward of centre

  // hair behind
  if (def.id === 'A') {
    const back = [];
    for (let a = 70; a <= 300; a += 18) {
      const rr = 1.13 + 0.05 * Math.sin(a * 0.21);
      back.push([Math.cos(a * Math.PI / 180) * rr, Math.sin(a * Math.PI / 180) * rr]);
    }
    back.push([0.15, -1.08], [0.05, -0.2], [-0.25, 0.75], [0.05, 1.05]);
    shape(id + '-hairB', back.map(R), { wash: col.hair, washA: 252, fill: col.hairLight, fillA: 50, tex: 0.7, w: 1.0, curv: 0.6 });
  } else if (def.id === 'S') {
    const bo = pose.bun || [0, 0];
    const bc = add(R([-0.58, -0.86]), mul(bo, W(j, 1)));
    shape(id + '-bun', ellipsePts(bc[0], bc[1], r * 0.5, r * 0.46, 12), { wash: col.hair, washA: 252, fill: col.hairLight, fillA: 70, tex: 0.7, w: 1.0, curv: 0.75 });
    line(id + '-bunline', [add(bc, [-r * 0.25, -r * 0.1]), add(bc, [0, r * 0.12]), add(bc, [r * 0.28, -r * 0.05])], { brush: 'HB', c: col.hairLight, w: 0.7, curv: 0.7 });
    const back = [];
    for (let a = 95; a <= 290; a += 20) back.push([Math.cos(a * Math.PI / 180) * 1.1, Math.sin(a * Math.PI / 180) * 1.1]);
    back.push([-0.25, 0.55], [-0.15, 0.95]);
    shape(id + '-hairB', back.map(R), { wash: col.hair, washA: 252, w: 1.0, curv: 0.6 });
  } else {
    const back = [];
    for (let a = 100; a <= 300; a += 25) back.push([Math.cos(a * Math.PI / 180) * 1.07, Math.sin(a * Math.PI / 180) * 1.07]);
    back.push([0.2, -0.9], [-0.2, 0.3]);
    shape(id + '-hairB', back.map(R), { wash: col.hair, washA: 250, w: 0.9, curv: 0.6 });
  }

  // head
  shape(id, ellipsePts(H[0], H[1], r, r * 1.03, 18, 0, f * tilt), { wash: col.skin, washA: 253, w: 1.0, curv: 0.8 });
  // ear (Sunny & stranger)
  if (def.id !== 'A') {
    const e = R([-0.12, 0.08]);
    shape(id + '-ear', ellipsePts(e[0], e[1], r * 0.16, r * 0.22, 9, 0, f * tilt), { wash: col.skin, washA: 253, w: 0.7, brush: 'HB', curv: 0.8 });
    line(id + '-earin', [R([-0.15, 0.02]), R([-0.08, 0.1]), R([-0.14, 0.18])], { brush: 'HB', c: col.skinDark, w: 0.55, curv: 0.7 });
  }

  // face
  const eyeN = [fx + 0.1, -0.02], eyeF = [fx - 0.42 * turn - 0.02, -0.04];
  const look = face.look ?? [0, 0];
  const open = face.open ?? 1;
  const smile = face.smile ?? 0;
  const drawEye = (k, e, scale) => {
    const p = R(e);
    if (open < 0.35) {
      const s = smile > 0.3 ? -1 : 1; // happy closed eyes curve up
      line(id + '-eyec' + k, [R([e[0] - 0.16 * scale, e[1] - 0.01]), R([e[0], e[1] + 0.09 * s]), R([e[0] + 0.16 * scale, e[1] - 0.01])],
        { brush: '2B', w: 1.15, curv: 0.8 });
      if (s > 0) lines(id + '-lash' + k, [[R([e[0] - 0.08 * scale, e[1] + 0.06]), R([e[0] - 0.11 * scale, e[1] + 0.15])], [R([e[0] + 0.06 * scale, e[1] + 0.07]), R([e[0] + 0.08 * scale, e[1] + 0.16])]],
        { brush: 'HB', w: 0.7 });
    } else {
      const lp = add(p, [look[0] * r * 0.05 * f, look[1] * r * 0.05]);
      dot(id + '-eye' + k, lp, r * 0.105 * scale * mix(0.6, 1, open), C.ink, 255);
      dot(id + '-glint' + k, add(lp, [r * 0.035 * f, -r * 0.04]), r * 0.032 * scale, '#ffffff', 255);
      if (open < 0.85) line(id + '-lid' + k, [R([e[0] - 0.13, e[1] - 0.06]), R([e[0] + 0.13, e[1] - 0.07])], { brush: 'HB', w: 0.7 });
    }
  };
  if (turn > 0.25) drawEye('F', eyeF, mix(0.75, 0.92, turn));
  drawEye('N', eyeN, 1);
  // brows: worried (inner ends up) ↔ soft
  const worry = face.worry ?? 0;
  const brow = (k, e, s) => line(id + '-brow' + k, [R([e[0] - 0.15 * s, e[1] - 0.25 + worry * 0.03]), R([e[0] + 0.02 * s, e[1] - 0.29 - worry * 0.05]), R([e[0] + 0.15 * s, e[1] - 0.27 - worry * 0.13])],
    { brush: '2B', w: 0.95, curv: 0.6 });
  if (turn > 0.25) brow('F', [eyeF[0] + 0.02, eyeF[1]], -1);
  brow('N', eyeN, 1);
  // nose
  if (turn > 0.6) line(id + '-nose', [R([fx + 0.3, 0.05]), R([fx + 0.38, 0.18]), R([fx + 0.28, 0.22])], { brush: 'HB', c: col.skinDark, w: 0.7, curv: 0.7 });
  else line(id + '-nose', [R([0.95, -0.02]), R([1.06, 0.16]), R([0.94, 0.22])], { brush: 'HB', w: 0.7, curv: 0.7 });
  // mouth
  const m = [fx + 0.08, 0.44];
  const sm = smile * 0.11;
  line(id + '-mouth', [R([m[0] - 0.14, m[1] - sm * 0.4]), R([m[0], m[1] + sm]), R([m[0] + 0.13, m[1] - sm * 0.5])], { brush: 'HB', w: 0.85, curv: 0.8 });
  // blush
  const bl = face.blush ?? 0;
  if (bl > 0.02) {
    dot(id + '-blushN', R([eyeN[0] - 0.05, 0.3]), r * 0.15, col.blush, 120 * bl);
    if (turn > 0.3) dot(id + '-blushF', R([eyeF[0] - 0.02, 0.3]), r * 0.12, col.blush, 100 * bl);
  }

  // hair in front
  if (def.id === 'A') {
    const fr = [[-0.95, 0.25], [-1.05, -0.3], [-0.7, -0.92], [-0.1, -1.12], [0.5, -0.98], [0.88, -0.62], [1.0, -0.3],
      [0.78, -0.22], [0.6, -0.42], [0.42, -0.2], [0.22, -0.45], [-0.1, -0.35], [-0.45, -0.05], [-0.6, 0.35]];
    shape(id + '-hairF', fr.map(R), { wash: col.hair, washA: 252, fill: col.hairLight, fillA: 60, tex: 0.7, w: 1.0, curv: 0.55 });
    lines(id + '-strands', [[R([-0.6, -0.8]), R([-0.8, -0.3]), R([-0.75, 0.2])], [R([0.1, -0.95]), R([-0.25, -0.75]), R([-0.45, -0.35])]],
      { brush: 'HB', c: col.hairLight, w: 0.55, curv: 0.6 });
  } else if (def.id === 'S') {
    const fr = [[-0.92, 0.1], [-0.95, -0.45], [-0.55, -0.95], [0.05, -1.12], [0.6, -0.92], [0.9, -0.5], [0.72, -0.48],
      [0.5, -0.62], [0.2, -0.5], [-0.15, -0.55], [-0.5, -0.25], [-0.62, 0.2]];
    shape(id + '-hairF', fr.map(R), { wash: col.hair, washA: 252, fill: col.hairLight, fillA: 70, tex: 0.7, w: 1.0, curv: 0.55 });
    lines(id + '-strands', [[R([-0.5, -0.85]), R([-0.2, -0.75]), R([0.15, -0.85])], [R([-0.75, -0.4]), R([-0.55, -0.2])]],
      { brush: 'HB', c: col.hairLight, w: 0.55, curv: 0.6 });
  } else {
    const fr = [[-0.9, 0.1], [-0.95, -0.5], [-0.4, -1.02], [0.3, -1.02], [0.85, -0.55], [0.6, -0.5], [0.1, -0.62], [-0.4, -0.35], [-0.6, 0.15]];
    shape(id + '-hairF', fr.map(R), { wash: col.hair, washA: 250, w: 0.9, curv: 0.55 });
  }
  return { R, r };
}

// ---------------------------------------------------------------------------
// Full character
// ---------------------------------------------------------------------------
// extras: { before:[fn], afterTorso:[fn], afterHead:[fn], end:[fn] } hooks for props/physics.
export function drawCharacter(j, extras = {}) {
  const { pose } = j;
  const order = pose.order || ['legF', 'armF', 'torso', 'legN', 'head', 'armN'];
  const run = (k) => (extras[k] || []).forEach((fn) => fn(j));
  run('before');
  for (const part of order) {
    if (part === 'legF') drawLeg(j, 'F', true);
    else if (part === 'legN') drawLeg(j, 'N', false);
    else if (part === 'armF') drawArm(j, 'F', pose.handKindF || 'mitt', true);
    else if (part === 'armN') drawArm(j, 'N', pose.handKindN || 'mitt', false);
    else if (part === 'torso') { drawTorso(j); run('afterTorso'); }
    else if (part === 'head') { j.headFrame = drawHead(j); run('afterHead'); }
    else if (typeof part === 'function') part(j);
  }
  run('end');
}
