# Inflation — 15-second stick-figure explainer

A self-contained 16:9 animation that explains inflation in its simplest form.
Everything is drawn procedurally in JavaScript on a `<canvas>`: no images, no
video files, no libraries. The two handwriting fonts are embedded as base64, so
`inflation.html` works offline from a plain `file://` open.

```
open inflation.html          # plays on a loop, with scrub + pause
```

## The script (15.0s)

| Time | Beat |
|------|------|
| 0.0 – 3.4 | A stick figure holds a $1 coin. `$1 = one apple.` |
| 3.4 – 5.2 | A clock spins. *One year later…* |
| 5.2 – 9.7 | Same coin, same figure — but the price tag flips `$1 → $2` and the apple is cut in half. |
| 9.7 – 12.3 | Two columns: **PRICES** rising, **YOUR MONEY** falling. |
| 12.3 – 15.0 | Title card: *INFLATION — when your money buys less.* |

## How it is drawn

- **`ink()`** is the only mark-making primitive. It takes control points, runs a
  Catmull-Rom through them, adds two seeded sine waves of perpendicular wobble,
  then *fills a variable-width ribbon* rather than stroking a line — which is
  what gives every stroke its nib taper instead of a flat vector edge.
- **Boiling line.** The wobble seed is `shape id + floor(t * 10)`, so the linework
  redraws itself ten times a second the way hand-inked animation does, while
  staying perfectly stable within each of those steps.
- **Draw-on.** Every stroke takes a `p` (progress) argument and is truncated by
  arc length, with an extra taper at the live tip, so shapes appear as if a pen
  were laying them down.
- **The figure** is a small forward-kinematics rig (`POSE` + `mixPose`). Poses are
  joint-angle sets that interpolate, and `figure()` returns world-space joint
  positions so props stay pinned to a hand — that is how the coin keeps the exact
  same screen position across the one-year cut, which is the whole point of the
  beat.
- **`render(t)` is a pure function of time.** Playback, scrubbing, in-browser
  recording and the offline renderer all drive the same entry point, so the
  exported file matches what you see frame for frame.

## Exporting

In the browser, **Record .webm** captures a live 15s take via `MediaRecorder`.

For a frame-exact H.264 master (what `inflation-15s.mp4` was made with), step it
offline — this never drops a frame, regardless of machine speed:

```bash
node render.mjs "$PWD/inflation.html" inflation-15s.mp4 30
```

Needs `playwright` and `ffmpeg`. `?clean=1` on the URL hides the player chrome.
