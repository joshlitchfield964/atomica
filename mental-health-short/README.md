# Someone Stayed — 30 s vertical mental-health short

A wordless, hand-drawn 2D animation (1080×1920, 9:16, 24 fps, 30 s), painted frame by frame with
[p5.brush](https://github.com/acamposuribe/p5.brush) on p5.js 2.x. Pencil and ink doodle lines, gouache
washes, watercolour fills and hatching sit on a cream paper ground. Everything boils gently between
drawings, so even still frames feel alive.

A person sits alone under a storm cloud only they can feel, while a stranger walks past without noticing.
A friend notices, sits down in the rain beside them, and only then opens a yellow umbrella. Their hands
meet, warmth blooms outward, the tangled thought-scribble straightens into a line that draws the sun, the
last raindrops become flowers, and a small, harmless cloud stays nearby.

See **[STORYBOARD.md](STORYBOARD.md)** for the shot list, colour script, character designs, rig and
physics plan.

## How it's built

- `src/rig.js`: one skeleton for every character (pelvis → spine → neck → head, arms, legs). It uses
  **two-bone IK** for planted feet and reaching hands, a 2D head turn, and p5.brush "skins" (hoodie,
  coat, hair, hands, shoes).
- `src/story.js`: shots, camera, colour script, and every acting keyframe. This covers the
  contact/down/passing/up **walk cycle** (driven by distance, so feet never slide), the sit with
  anticipation and squash, the umbrella pop with spring overshoot, the hand-hold, breathing, and
  blinks.
- `src/sim.js` + `src/main.js`: deterministic **secondary physics**, precomputed at 120 Hz. Verlet
  chains drive the hood strings, scarf tail and curls; springs drive the bun, grass and tree canopy
  under a travelling wind-gust field.
- `src/world.js`: the park. It has a swaying tree with falling leaves, wind-blown grass, a bench, a
  puddle with ripples, the storm cloud with lightning, rain that collides with heads and the canopy
  and splashes, flowers that spring open, a butterfly, birds, and chimney smoke.
- `src/ink.js`: p5.brush helpers. It handles per-element seeding (3-variant line boil), the opening
  draw-on, and colour-batched strokes. The camera is applied to coordinates here, not through p5
  transforms, so pencil grain stays crisp in close-ups.
- The static far background is painted once with p5.brush into 2× "plates": 3 palette states × 3
  boil variants, cross-faded under the camera. Everything that moves is repainted every frame.

## Render

```bash
npm install
node render.mjs --stills 3,8,15.5,19.8,28.5    # preview stills → out/stills/
node render.mjs --workers 2                     # full film → out/someone-stayed-1080x1920.mp4
```

Rendering uses headless Chromium (software WebGL) through Playwright, and ffmpeg encodes H.264
High, yuv420p, 1080×1920 at 24 fps. Add `?profile` to the page URL to time each scene section on
the GPU.
