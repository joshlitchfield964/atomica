// Deterministic secondary-motion physics. Everything is simulated once up front at a fixed
// sub-step rate and stored per output frame, so any frame can be rendered independently
// (and in parallel) with identical results.
import { add, sub, mul, dist, len } from './util.js';

// Verlet rope/cloth chain pinned at node 0.
export class Chain {
  constructor(n, segLen, o = {}) {
    this.n = n;
    this.seg = segLen;
    this.g = o.gravity ?? 1400;
    this.damp = o.damping ?? 0.97;
    this.stiff = o.stiffness ?? 0.15;   // bending stiffness (0 = limp rope)
    this.windK = o.wind ?? 1;
    this.iter = o.iterations ?? 8;
    this.p = []; this.q = [];
  }
  init(anchor, d = [0, 1]) {
    this.p = []; this.q = [];
    for (let i = 0; i < this.n; i++) {
      const x = add(anchor, mul(d, i * this.seg));
      this.p.push(x.slice()); this.q.push(x.slice());
    }
  }
  // anchor: pinned position; aim: optional direction the root segment wants to point
  step(dt, anchor, wind = [0, 0], colliders = [], aim = null) {
    const { p, q } = this;
    for (let i = 1; i < this.n; i++) {
      const v = sub(p[i], q[i]);
      q[i] = p[i].slice();
      const ax = wind[0] * this.windK * (0.4 + 0.6 * i / this.n);
      const ay = this.g + wind[1] * this.windK;
      p[i] = [p[i][0] + v[0] * this.damp + ax * dt * dt, p[i][1] + v[1] * this.damp + ay * dt * dt];
    }
    q[0] = p[0].slice();
    p[0] = anchor.slice();
    for (let it = 0; it < this.iter; it++) {
      p[0] = anchor.slice();
      if (aim) {
        // root segment prefers a direction (e.g. scarf tail leaving the knot)
        const want = add(p[0], mul(aim, this.seg));
        p[1] = [p[1][0] + (want[0] - p[1][0]) * 0.5, p[1][1] + (want[1] - p[1][1]) * 0.5];
      }
      for (let i = 1; i < this.n; i++) {
        const a = p[i - 1], b = p[i];
        const d = sub(b, a), l = len(d) || 1e-6;
        const k = (l - this.seg) / l;
        if (i === 1) { p[i] = sub(b, mul(d, k)); }
        else {
          p[i - 1] = add(a, mul(d, k * 0.5));
          p[i] = sub(b, mul(d, k * 0.5));
        }
      }
      if (this.stiff > 0) {
        for (let i = 2; i < this.n; i++) {
          const straight = add(p[i - 1], sub(p[i - 1], p[i - 2]));
          p[i] = [p[i][0] + (straight[0] - p[i][0]) * this.stiff, p[i][1] + (straight[1] - p[i][1]) * this.stiff];
        }
      }
      for (const c of colliders) {
        for (let i = 1; i < this.n; i++) {
          const d = sub(p[i], c.c), l = len(d);
          if (l < c.r && l > 1e-6) p[i] = add(c.c, mul(d, c.r / l));
        }
      }
    }
  }
  snapshot() { return this.p.map((x) => x.slice()); }
}

// 2D damped spring that follows a moving target (lag + overshoot = follow-through).
export class Spring2 {
  constructor(k = 120, c = 9) { this.k = k; this.c = c; this.x = [0, 0]; this.v = [0, 0]; }
  init(x) { this.x = x.slice(); this.v = [0, 0]; }
  step(dt, target, force = [0, 0]) {
    const a = [(target[0] - this.x[0]) * this.k - this.v[0] * this.c + force[0],
      (target[1] - this.x[1]) * this.k - this.v[1] * this.c + force[1]];
    this.v = add(this.v, mul(a, dt));
    this.x = add(this.x, mul(this.v, dt));
  }
}

// Bank of 1-DOF angular springs (grass blades, flower stems, tree clusters).
export class SpringBank {
  constructor(n, k = 60, c = 5) {
    this.n = n; this.k = k; this.c = c;
    this.a = new Float32Array(n); this.v = new Float32Array(n);
  }
  step(dt, targetFn) {
    for (let i = 0; i < this.n; i++) {
      const acc = (targetFn(i) - this.a[i]) * this.k - this.v[i] * this.c;
      this.v[i] += acc * dt;
      this.a[i] += this.v[i] * dt;
    }
  }
  snapshot() { return Float32Array.from(this.a); }
}

export { dist };
