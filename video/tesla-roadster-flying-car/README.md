# They Built a Rocket You Can Park

An 11:40 narration-driven documentary cut from the Tesla Roadster "flying car"
reveal of 15 October 2026.

**This directory is unrelated to the Atomica periodic-table app.** It is kept here
only because this repository was the delivery route for the project's asset pack.
It contains the *reproducible edit pipeline and its documentation* — no media.
Delete the whole folder if you'd rather keep the app repo clean.

## What's here

```
docs/        the editorial record
  analysis.json          act map, intensity curve, open loops, VO timing, transcript
  style_bible.md         look, motion, transitions, type, sound palette, motifs
  beat_sheet.json        all 161 shots: asset, in-point, framing, motion, reason
  gap_report.md          what's missing or risky, and what was built instead
  grade_plan.md          the single grade applied to every source type
  audio_plan.md          VO chain, ducking, measured balance, score map
  credits_and_sources.txt  attribution + rights status (READ BEFORE MONETISING)
  captions.srt           207 cues
  youtube_chapters.txt   11 chapters

pipeline/    the build
  edl.py       the edit decision list — every shot with its reason
  shot.py      per-shot renderer (grade, grain, vignette, Ken Burns, archive framing)
  build.py     renders all shots in parallel, hash-cached
  assemble.py  source-credit overlay chain
  qc.py        contact sheet across the finished film
  engine.py    audio synthesis engine (drones, pads, piano, pulses, hits, risers)
  score.py     the 700-second arrangement
  mix.py       VO chain, VAD-driven ducking, balance, pre-master

compositions/  HyperFrames motion graphics (HTML; render with `hyperframes render -c`)
  g01 title · g04 nine-year timeline · g05 trim ladder
  g06 claimed vs verified · g08 air-tank drain · g09 verdict
assets/css/system.css   the design system shared by every graphic
```

## Rebuilding

Needs `ffmpeg`, Python (`numpy scipy soundfile`), and the asset pack extracted so that
`pipeline/shot.py`'s `ASSETS` path points at its `assets/` folder.

```bash
python3 pipeline/score.py     # score + ambience + sfx stems
python3 pipeline/mix.py       # VO chain, duck, balance  -> mix_pre.wav
python3 pipeline/build.py     # all 161 shots
# then concat, overlay credits (assemble.py), and mux the mastered mix
```

Graphics are rendered separately, e.g.:
```bash
npx hyperframes render -c compositions/g08_air_tank.html -o renders/g08.mp4
```
Note: GSAP must be vendored locally — this build environment blocks `cdn.jsdelivr.net`.

## The one thing to read first

`docs/gap_report.md`. Two items need a human decision before publishing: the XPeng
shot shows the wrong aircraft, and the only 0-60 timer photograph reads 1.00 s while
the narration says 0.81 s.
