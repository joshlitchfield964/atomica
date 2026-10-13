// The film's script: shots, camera, colour script and every acting keyframe.
import {
  clamp, mix, smooth, seg, track, spring, wobble, hash, add, sub, mul, lerp2, rot, dir, norm, len, dist, ik2, TAU, easeOut, vnoise,
} from './util.js';
import { ASH, SUNNY, STRANGER } from './rig.js';
import { SEAT_Y, GROUND_Y, groundY, SUN, SUN_R } from './world.js';

export const FPS = 24;
export const DURATION = 30;
export const NF = FPS * DURATION;

// ---------------------------------------------------------------------------
// Shots & camera
// ---------------------------------------------------------------------------
export const SHOTS = [
  { name: 'Alone', t0: 0, t1: 5.0, cam: [[0, [540, 890, 1.0]], [5.0, [535, 930, 1.12], 'l']] },
  { name: 'Spiral', t0: 5.0, t1: 9.5, cam: [[5.0, [535, 930, 1.12]], [9.5, [505, 1112, 2.2]]] },
  { name: 'Noticed', t0: 9.5, t1: 14.0, cam: [[9.5, [600, 1010, 1.3]], [14.0, [592, 1018, 1.34], 'l']] },
  { name: 'Shelter', t0: 14.0, t1: 17.5, cam: [[14.0, [575, 1040, 1.45]], [17.5, [572, 1062, 1.56], 'l']] },
  { name: 'Reach', t0: 17.5, t1: 21.0, cam: [[17.5, [585, 1335, 3.1]], [21.0, [585, 1330, 3.3], 'l']] },
  { name: 'Untangle', t0: 21.0, t1: 25.5, cam: [[21.0, [575, 1060, 1.4]], [22.0, [588, 1000, 1.38]], [23.8, [650, 770, 1.15]], [25.5, [642, 785, 1.12]]] },
  { name: 'Together', t0: 25.5, t1: 30.01, cam: [[25.5, [642, 785, 1.12]], [27.4, [600, 975, 1.1]], [30, [565, 985, 1.0]]] },
];

export function shotAt(t) {
  return SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
}

export function camera(t) {
  const s = shotAt(t);
  const [cx, cy, z] = track(s.cam, t);
  // gentle hand-held drift
  return [cx + 3.5 * Math.sin(t * 0.7), cy + 2.5 * Math.sin(t * 0.53 + 1), z];
}

// ---------------------------------------------------------------------------
// Colour script / grade / weather
// ---------------------------------------------------------------------------
export function look(t) {
  return {
    gloom: track([[0, 0.55], [5, 0.6], [9, 1], [14, 0.9], [19, 0.72], [21, 0.35], [24, 0.05], [30, 0]], t),
    warm: track([[19.2, 0], [21.5, 0.55], [25, 1]], t),
    sat: track([[0, 0.84], [5, 0.8], [9, 0.42], [14, 0.5], [17.5, 0.56], [19.3, 0.6], [20.6, 1.0], [24, 1.08], [30, 1.12]], t),
    bri: track([[0, 1.0], [9, 0.92], [14, 0.95], [19.3, 0.97], [21, 1.02], [30, 1.04]], t),
    vig: track([[0, 0.5], [5, 0.55], [9.4, 1], [9.6, 0.75], [14, 0.7], [19.5, 0.55], [23, 0.35], [30, 0.3]], t),
    flash: track([[6.98, 0], [7.0, 0.85, 'l'], [7.08, 0.1, 'l'], [7.13, 0.55, 'l'], [7.3, 0, 'l']], t),
    plate: seg(t, 0.15, 1.3),
    fadeOut: seg(t, 29.1, 30),
    wind: track([[0, 0.45], [5, 0.55], [8, 1.0], [10, 0.7], [14, 0.55], [21, 0.4], [30, 0.35]], t),
  };
}

export function cloudState(t) {
  return {
    pos: track([[0, [470, 560]], [5, [470, 565]], [9.4, [478, 625]], [11, [480, 585]], [21.4, [490, 575]], [24, [430, 730]], [27.5, [372, 930]]], t),
    scale: track([[0, 0.94], [5, 0.98], [9.4, 1.3], [16.5, 1.24], [21.4, 1.0], [24.5, 0.5], [27.5, 0.3]], t),
    dark: track([[0, 0.86], [5, 0.88], [9, 1], [16.5, 1], [19.5, 0.72], [21.4, 0.45], [23.6, 0.05], [30, 0]], t),
    agitation: track([[0, 0.2], [5, 0.3], [8.5, 1], [11, 0.5], [16, 0.3], [19, 0.1]], t),
    swellWobble: wobble(t, 6.2, 1.6, 2.2) + wobble(t, 7.0, 3, 5),
    rain: track([[0.9, 0], [1.4, 0.55], [5, 0.6], [8, 1], [14.6, 1], [16.5, 0.85], [19.2, 0.6], [20.6, 0.2], [21.3, 0]], t),
    bob: [0, 6 * Math.sin(t * 1.4)],
  };
}

export const LEAVES = [[1.6, 210, 700, 3.4], [6.3, 90, 610, 2.8], [12.8, 260, 650, 3.1], [22.6, 160, 560, 3.2], [25.8, 320, 600, 3.6], [27.4, 30, 720, 2.6]];
export const BIRDS = [[0.3, 250, 9, 150], [0.8, 290, 7, 140], [25.7, 380, 24, 270], [26.0, 440, 20, 290], [26.4, 330, 22, 255], [27.2, 410, 18, 300]];

// The tangle → thread → sun doodle
export function threadState(t) {
  return {
    amount: track([[0, 0.15], [4.5, 0.35], [8.5, 1], [14, 1], [16, 0.6], [19.5, 0.4], [21.4, 0.38]], t),
    unravel: track([[21.4, 0], [22.2, 1]], t),
    draw: track([[21.9, 0], [23.5, 1, 'S']], t),
    flood: track([[23.3, 0], [24.3, 1]], t),
    rays: t > 23.9 ? (t - 23.9) : 0,
  };
}

// Last drops of the cloud: each hits the ground and becomes a flower.
export const LAST_DROPS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ i, t0: 22.25 + i * 0.27 + 0.08 * hash('ld', i) }));
export function flowerBirths(FLOWERS, cloudAt) {
  return FLOWERS.map((f, i) => {
    if (i < 7) {
      const d = LAST_DROPS[i];
      const c = cloudAt(d.t0);
      const fallTime = (f.y - c.base) / 1250;
      return d.t0 + fallTime;
    }
    // the rest bloom outwards from the bench through the last shot
    const r = dist([f.x, f.y], [575, 1460]);
    return 24.6 + r / 330 + 0.3 * hash('fb', i);
  });
}

// ---------------------------------------------------------------------------
// Life: breathing phase and blinks
// ---------------------------------------------------------------------------
function makeBreath(rateKeys, salt) {
  const table = new Float32Array(NF * 4 + 8);
  let ph = salt;
  for (let i = 0; i < table.length; i++) {
    table[i] = ph;
    ph += TAU * track(rateKeys, i / (FPS * 4)) / (FPS * 4);
  }
  return (t) => Math.sin(table[Math.min(table.length - 1, Math.max(0, Math.round(t * FPS * 4)))]);
}
const breathA = makeBreath([[0, 1 / 4.4], [5, 1 / 3.6], [8, 1 / 2.1], [12, 1 / 2.6], [16, 1 / 3.6], [20, 1 / 4.2], [26, 1 / 4.6]], 0.3);
const breathS = makeBreath([[0, 1 / 3.4], [12, 1 / 3.2], [16, 1 / 4.0], [26, 1 / 4.6]], 1.9);

function blinkTimes(salt) {
  const out = [];
  let t = 0.7 + hash('bk', salt) * 1.2;
  while (t < DURATION) { out.push(t); t += 2.3 + 2.4 * hash('bk', salt, out.length); }
  return out;
}
const BLINK_A = blinkTimes('A'), BLINK_S = blinkTimes('S'), BLINK_X = blinkTimes('X');
function blink(t, list) {
  for (const b of list) if (t >= b && t < b + 0.13) return 0;
  return 1;
}

// ---------------------------------------------------------------------------
// ASH
// ---------------------------------------------------------------------------
export const A_PELVIS = [470, SEAT_Y - 26];
const A_HAND_HOLD = [562, SEAT_Y - 14];

export function poseAsh(t, sunnyJ) {
  const f = 1;
  const P = A_PELVIS.slice();
  const k = track([[0, 1], [16.3, 1], [17.4, 0, 'S']], t);           // knees hugged → legs down
  const fs = mix(0.36, 1, k);
  const swing = (1 - k) * seg(t, 21, 23) * 0.6 * Math.sin(t * 2.6);   // happy dangling feet
  const footN = lerp2([P[0] + 30 + 8 * swing, SEAT_Y + 66 - 4 * Math.abs(swing)], [P[0] + 62, SEAT_Y - 9], k);
  const footF = lerp2([P[0] + 16 - 8 * swing, SEAT_Y + 60], [P[0] + 52, SEAT_Y - 10], k);
  const hipN = add(P, [6, 0]);
  const kneeN = ik2(hipN, footN, ASH.thigh * fs, ASH.shin, -f).mid;

  const lean = track([[0, 0.34], [5, 0.36], [9, 0.46], [14.4, 0.46], [15.8, 0.3], [16.8, 0.18], [17.6, 0.18], [18.3, 0.33], [19.4, 0.3], [21.4, 0.28], [22.6, 0.1], [25.6, 0.12], [27.2, 0.44]], t);
  const curl = track([[0, 0.85], [5, 0.9], [9, 1.0], [14.4, 1], [16, 0.6], [17.4, 0.45], [21.4, 0.42], [22.6, 0.22], [25.6, 0.22], [27.2, 0.35]], t);
  const neck = track([[0, 0.55], [5, 0.62], [8.6, 0.98], [15.2, 0.98], [16.0, 0.32], [16.9, 0.14], [17.8, 0.42], [19.6, 0.3], [21.4, 0.12], [22.4, -0.2], [24, -0.25], [25.6, -0.02], [27.2, 0.2]], t)
    + 0.03 * Math.sin(t * 0.9) * (1 - seg(t, 8, 9) + seg(t, 15, 16));
  const squash = 1 - 0.05 * seg(t, 5.5, 9) * (1 - seg(t, 14.4, 15.6));

  // hands: hug shins → lap → reach for Sunny's hand
  const hugN = add(kneeN, [12, 26]), hugF = add(kneeN, [2, 20]);
  const lapN = add(P, [48, -16]), lapF = add(P, [36, -22]);
  let handN = lerp2(lapN, hugN, k), handF = lerp2(lapF, hugF, k);
  const reach = track([[17.6, [0, 0]], [18.15, [1, 0]], [18.45, [0.55, 0.08]], [18.75, [0.6, 0.06]], [19.1, [1.0, 1.0]]], t);
  const reachPt = lerp2(lerp2(lapN, [548, SEAT_Y - 32], reach[0]), A_HAND_HOLD, reach[1]);
  if (t > 17.6) handN = reachPt;

  const open = track([[0, 0], [15.6, 0], [16.2, 0.5], [17.0, 0.62], [18.0, 0.82], [19.4, 1], [25.9, 1], [26.7, 0.1]], t);
  const blk = open > 0.45 ? blink(t, BLINK_A) : 1;
  const face = {
    open: open * blk,
    smile: track([[0, -0.6], [9, -0.95], [15, -0.6], [19.6, -0.2], [20.6, 0.35], [22.6, 0.8], [30, 0.9]], t),
    worry: track([[0, 1], [17, 1], [20, 0.3], [22.6, 0]], t),
    blush: track([[19.3, 0], [20.5, 0.85]], t),
    turn: track([[0, 0.55], [15.8, 0.55], [16.6, 0.45], [25.6, 0.5], [27, 0.62]], t),
    look: track([[0, [0, 1]], [16.0, [0, 1]], [16.6, [1, 0]], [17.8, [0.6, 1]], [19.6, [1, 0.2]], [22.2, [0.4, -1]], [25.6, [0.6, 0]]], t),
  };

  const pose = {
    facing: f, pelvis: P, lean, curl, neck, squash, breath: breathA(t) * mix(1, 1.6, seg(t, 6, 8.5) * (1 - seg(t, 13, 16))),
    handN, handF, footN, footF, thighFs: fs,
    footAngN: mix(-0.25 + 0.15 * swing, 0.05, k), footAngF: mix(-0.3 - 0.15 * swing, 0.05, k),
    handKindN: t > 18.0 ? 'onTop' : 'mitt', handKindF: 'mitt',
    handDirN: t > 18.0 ? norm([1, 0.12]) : null,
    face,
    order: ['legF', 'armF', 'torso', 'legN', 'head', 'armN'],
  };
  // rest the head on Sunny's shoulder at the end
  if (sunnyJ) {
    const w = track([[25.8, 0], [27.3, 1]], t);
    if (w > 0) {
      pose.headPos = add(sunnyJ.shN, [-44, -36]);
      pose.headPosW = w;
      pose.headTilt = 0.35 * w;
    }
  }
  return pose;
}

// ---------------------------------------------------------------------------
// SUNNY
// ---------------------------------------------------------------------------
const S_STEP = 132;
const S_X0 = 1130;
export const S_STOP_X = 692;
export const S_SEAT = [680, SEAT_Y - 28];

function sunnyX(t) {
  return track([[9.5, S_X0], [11.4, S_STOP_X, 'o']], t);
}

// Walk cycle driven by distance travelled: contact → down → passing → up, no foot sliding.
export function walkLegs(def, rootX, phase, amt, gy, facing, sc = 1) {
  const legLen = (def.thigh + def.shin) * sc;
  const step = S_STEP * sc * (def.id === 'X' ? 0.95 : 1);
  const feet = [];
  for (const side of [0, 1]) {
    const ph = (phase + side * 0.5) % 1;
    let x, lift, ang;
    if (ph < 0.5) { // stance: foot fixed in the world while the body passes over it
      const u = ph / 0.5;
      x = mix(step * 0.5, -step * 0.5, u);
      lift = 0;
      ang = u < 0.15 ? mix(0.3, 0, u / 0.15) : u > 0.75 ? -mix(0, 0.45, (u - 0.75) / 0.25) : 0;
    } else {          // swing: foot travels forward on an arc
      const u = (ph - 0.5) / 0.5;
      const e = smooth(u);
      x = mix(-step * 0.5, step * 0.5, e);
      lift = Math.sin(u * Math.PI) * 26 * sc;
      ang = mix(-0.5, 0.3, u);
    }
    feet.push({ x: rootX + facing * x * amt + facing * (side ? -6 : 6) * sc * (1 - amt), y: gy - 12 * sc - lift * amt, ang: ang * amt });
  }
  // hips lowest on "down" (just after contact), highest on "up"
  const bob = Math.cos(TAU * 2 * (phase - 0.08)) * 7 * sc * amt;
  const pelvisY = gy - 12 * sc - legLen * 0.955 + bob;
  return { feet, pelvisY, phase };
}

export function poseSunny(t) {
  const f = -1;
  const x = sunnyX(t);
  const walkAmt = track([[9.5, 1], [11.0, 1], [11.5, 0]], t);
  const phase = ((S_X0 - x) / (2 * S_STEP)) % 1;
  const gy = groundY(x);
  const W = walkLegs(SUNNY, x, phase, walkAmt, gy, f);
  const sit = track([[12.25, 0], [12.5, 0.08], [13.3, 1, 'S']], t);
  const pelStand = [x + 6 * walkAmt * Math.sin(TAU * phase), W.pelvisY + 4 * spring(t, 11.4, 2.5, 0.4) * (1 - seg(t, 11.4, 12))];
  // anticipation: dip before sitting
  pelStand[1] += 6 * smooth(seg(t, 12.0, 12.3)) * (1 - sit);
  let P = lerp2(pelStand, S_SEAT, sit);
  const land = wobble(t, 13.3, 3.2, 6);
  const squash = 1 - 0.045 * land - 0.03 * seg(t, 12.4, 13.0) * (1 - seg(t, 13.2, 13.4));

  const lean = walkAmt * (0.1 + 0.03 * Math.sin(TAU * 2 * phase))
    + track([[11.3, 0.02], [12.0, 0.03], [12.35, 0.12], [12.9, 0.2], [13.3, 0.1], [13.8, 0.06], [17.5, 0.12], [21, 0.1], [25.6, 0.08], [27.2, 0.2]], t) * (1 - walkAmt);
  const neck = track([[9.5, 0.08], [11.3, 0.08], [11.65, -0.5], [12.05, -0.48], [12.4, 0.32], [13.6, 0.28], [14.4, 0.12], [14.85, -0.2], [15.5, 0.24], [17.6, 0.38],
    [21.3, 0.2], [22.6, -0.2], [25.3, -0.05], [27.2, 0.36]], t);

  // legs
  const seatFootN = [S_SEAT[0] - 34, GROUND_Y - 10], seatFootF = [S_SEAT[0] - 16, GROUND_Y - 14];
  const footN = lerp2([W.feet[0].x, W.feet[0].y], seatFootN, smooth(sit));
  const footF = lerp2([W.feet[1].x, W.feet[1].y], seatFootF, smooth(sit));

  // arms: walking swing (FK), then scripted targets
  const j0 = { S: add(P, [-f * Math.sin(lean) * SUNNY.spine * 0, -SUNNY.spine]) };
  const shN = add(P, [f * 6, -SUNNY.spine + 16]);
  const swingA = Math.sin(TAU * phase) * 0.45 * walkAmt;
  const armLen = (SUNNY.upper + SUNNY.fore) * 0.93;
  let handN = add(shN, rot([0, armLen], -f * swingA));
  let handF = add(shN, rot([0, armLen * 0.92], f * swingA * 0.5 - 0.15 * f));
  // seated: near hand on own knee, then palm-up on the bench
  const handNKnee = add(S_SEAT, [f * 52, -6]);
  const palmUp = [608, SEAT_Y - 12];
  const nSeat = track([[13.3, 0], [13.8, 1]], t);
  handN = lerp2(handN, handNKnee, mix(sit * 0.9, 1, nSeat) * sit);
  const toPalm = track([[15.5, 0], [16.4, 1]], t);
  handN = lerp2(handN, palmUp, toPalm);

  // umbrella hand + umbrella pose
  const U = umbrellaState(t, P, f, sit, walkAmt, phase);
  handF = U.hand;

  const open = 1;
  const face = {
    open: blink(t, BLINK_S) * track([[0, 1], [26.6, 1], [27.2, 0.1]], t),
    smile: track([[9.5, 0.1], [11.6, -0.15], [12.5, -0.3], [15.6, 0.25], [19.6, 0.7], [30, 0.85]], t),
    worry: track([[11.4, 0], [11.8, 0.6], [14.8, 0.3], [19.2, 0]], t),
    blush: track([[19.3, 0.2], [20.5, 0.6]], t),
    turn: track([[9.5, 0.62], [12.4, 0.62], [13.4, 0.5], [27.2, 0.42]], t),
    look: track([[9.5, [1, 0]], [11.6, [0.2, -1]], [12.1, [0.2, -1]], [12.4, [1, 0.6]], [14.85, [0.3, -1]], [15.6, [1, 0.4]], [17.6, [0.8, 1]], [21.4, [1, 0]], [22.6, [0.3, -1]], [25.3, [1, 0]]], t),
  };
  return {
    facing: f, pelvis: P, lean, curl: 0.1 + 0.15 * sit, neck, squash, breath: breathS(t),
    handN, handF, footN, footF, thighFs: mix(1, 0.28, smooth(sit)), thighFsF: mix(1, 0.32, smooth(sit)),
    footAngN: mix(W.feet[0].ang, 0, sit), footAngF: mix(W.feet[1].ang, 0, sit),
    coatHem: mix(40, 16, sit),
    handKindN: toPalm > 0.5 ? 'palmUp' : 'mitt', handKindF: 'fist',
    handDirN: toPalm > 0.5 ? [-1, 0.05] : null,
    handOptsN: toPalm > 0.5 ? { thumbClose: track([[19.15, 0], [19.6, 1]], t), thumbFirst: false } : {},
    handDirF: U.handDir,
    face, umbrella: U, walkPhase: phase, walkAmt, sit,
    order: ['legF', 'armF', 'torso', 'legN', 'head', 'armN'],
  };
}

// Umbrella: hand position, shaft angle (0 = canopy up, π = tip down) and openness.
export function umbrellaState(t, P, f, sit, walkAmt, phase) {
  // walking: held at the side like a cane, swinging with the arm
  const shN = add(P, [f * 6, -SUNNY.spine + 16]);
  const swing = Math.sin(TAU * phase + Math.PI) * 0.3 * walkAmt;
  const walkHand = add(shN, rot([0, 120], f * swing - 0.05 * f));
  const seatedRest = [S_SEAT[0] + 54, SEAT_Y - 98];
  let hand = lerp2(walkHand, seatedRest, smooth(sit));
  let angle = mix(Math.PI - 0.45 + swing * 0.5, Math.PI - 0.16, sit);
  // Shot 4: lift (anticipation dip) and pop
  const lift = track([[14.15, 0], [14.45, -0.12], [14.75, 1, 'o']], t);
  const raised = [636, 1166];
  hand = lerp2(hand, raised, clamp(lift));
  hand[1] += Math.min(0, lift) * -60;
  angle = mix(angle, -0.13, clamp(lift));
  // Shot 6: fold and lower to rest against the bench
  const lower = track([[23.9, 0], [24.8, 1]], t);
  hand = lerp2(hand, seatedRest, lower);
  angle = mix(angle, Math.PI - 0.16, lower);
  const pop = spring(t, 14.72, 2.4, 0.3);
  const close = track([[23.4, 0], [23.95, 1]], t);
  const openAmt = clamp(pop, 0, 1.25) * (1 - close);
  const handDir = norm(rot([0, -1], angle + 0.6 * -f));
  return { hand, angle, open: openAmt, handDir };
}

export function umbrellaGeom(U) {
  const d = [Math.sin(U.angle), -Math.cos(U.angle)];
  const p = [Math.cos(U.angle), Math.sin(U.angle)];
  const o = U.open;
  const apex = add(U.hand, mul(d, 250));
  const Rc = 210 * mix(0.13, 1, o);
  const Hc = mix(178, 116, clamp(o));
  const dome = [];
  for (let i = 0; i <= 12; i++) {
    const u = -1 + i / 6;
    const h = Hc * (1 - Math.sqrt(Math.max(0, 1 - u * u)) * mix(0.82, 0.96, clamp(o)));
    dome.push(add(add(apex, mul(p, u * Rc)), mul(d, -h)));
  }
  const ribs = [];
  for (let k = -1; k <= 1.001; k += 0.5) ribs.push(add(add(apex, mul(p, k * Rc)), mul(d, -Hc)));
  const bottom = [];
  for (let i = ribs.length - 1; i >= 0; i--) {
    bottom.push(ribs[i]);
    if (i > 0) bottom.push(add(lerp2(ribs[i], ribs[i - 1], 0.5), mul(d, 30 * clamp(o))));
  }
  return { hand: U.hand, apex, d, p, dome, bottom, ribs, open: o, Rc, Hc };
}

// ---------------------------------------------------------------------------
// STRANGER (background passer-by, eyes on phone)
// ---------------------------------------------------------------------------
export const X_SCALE = 0.38;
export function poseStranger(t, hillY) {
  const f = 1;
  const x = track([[1.3, -40], [5.5, 760, 'l']], t);
  const phase = ((x + 60) / (2 * S_STEP * X_SCALE * 0.95)) % 1;
  const gy = hillY(x) + 18;
  const W = walkLegs(STRANGER, x, phase, 1, gy, f, X_SCALE);
  const P = [x, W.pelvisY];
  const shN = add(P, [f * 6 * X_SCALE, (-STRANGER.spine + 16) * X_SCALE]);
  const armLen = (STRANGER.upper + STRANGER.fore) * X_SCALE;
  const swing = Math.sin(TAU * phase) * 0.4;
  return {
    facing: f, pelvis: P, scale: X_SCALE, lean: 0.14, curl: 0.3, neck: 0.62, breath: 0,
    footN: [W.feet[0].x, W.feet[0].y], footF: [W.feet[1].x, W.feet[1].y], footAngN: W.feet[0].ang, footAngF: W.feet[1].ang,
    handN: add(shN, [f * 30 * X_SCALE, 34 * X_SCALE]), handF: add(shN, rot([0, armLen * 0.93], f * swing)),
    handKindN: 'phone', handKindF: 'mitt', handDirN: norm([f * 0.6, -1]), coatHem: 40,
    face: { open: 0.3, smile: -0.1, worry: 0, turn: 0.15, look: [0.6, 1] },
    order: ['legF', 'armF', 'torso', 'legN', 'head', 'armN'],
  };
}

// ---------------------------------------------------------------------------
// Opening doodle: per-element reveal times
// ---------------------------------------------------------------------------
const REVEAL_START = [['bench', 0.1], ['tree', 0.2], ['grass', 0.4], ['A-', 0.45], ['puddle', 0.65], ['cloud', 0.75], ['ripples', 1.0], ['tangle', 1.1]];
export function reveal(t, id) {
  if (t > 2.2) return 1;
  let s = 0.35;
  for (const [p, v] of REVEAL_START) if (id.startsWith(p)) { s = v; break; }
  s += hash('rv', id) * 0.3;
  return clamp((t - s) / 0.7);
}

export { SUN, SUN_R };
