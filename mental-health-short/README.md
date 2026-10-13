# Someone Stayed — 30 s vertical mental-health short

Hand-drawn 2D animation (1080×1920, 9:16) painted frame by frame with
[p5.brush](https://github.com/acamposuribe/p5.brush) on p5.js 2.x. No dialogue or text;
the story is told visually:

1. A person sits alone on a bench under a storm cloud that rains only on them.
2. It gets worse: the cloud swells, thoughts tangle, colour drains away.
3. A friend walks in with a yellow umbrella and holds it over them.
4. The friend sits and puts an arm around them; the rain stops, the tangle unravels.
5. The cloud drifts off, the sun comes through, flowers bloom from the puddle.
6. They sit together, head on shoulder, as birds cross a warm sky.

Drawings are made "on twos" (12 per second, held for 24 fps), each re-inked with one of
three boil variants for a living hand-drawn line.

## Files

- `film.js` — timeline, characters, set and compositing (all drawing via p5.brush)
- `index.html` — loads p5, p5.brush and the film (`?live` plays it in a browser)
- `render.mjs` — headless Chromium renderer + ffmpeg encode

## Render

```bash
npm install
node render.mjs --stills 2,8.5,13,18.5,23,27.5   # preview stills → out/stills/
node render.mjs                                  # full film → out/someone-stayed-1080x1920.mp4
```

Status: work in progress — the full render has not been produced yet.
