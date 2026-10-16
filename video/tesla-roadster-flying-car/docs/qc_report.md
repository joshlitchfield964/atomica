# QC REPORT — final cut
`Tesla_Roadster_Documentary_1080p.mp4` · 1920×1080 · 30 fps · 21,000 frames · 11:40.1 · 275 MB

## Measured

| Check | Result |
|---|---|
| Duration / frame count | 700.096 s · **21,000 frames** at 30 fps — exact, no drift |
| Resolution / rate | 1920×1080, 30/1, yuv420p, H.264 High@4.2 |
| Integrated loudness | **−14.0 LUFS** (target −14) |
| True peak | **−1.5 dBTP** (target ≤ −1.0) |
| Music under voice | 16.3 LU (target 12–18) |
| Ambience under voice | 23.3 LU (target 20–25) |
| VO compression | 3.6 dB max gain reduction (target 2–4) |
| Shots | 159, average 4.35 s — inside the 3–6 s documentary band |
| Shot reasons logged | 159 / 159 |
| Composition lint | 0 errors, 0 warnings across all 7 HyperFrames files |

## Faults found and fixed during QC

1. **Graphic sync drift (critical).** Four graphics were placed at timecodes that did not
   match the timings they were authored against. The nine-year timeline ran **17.85 s
   early** — striking out "2020" while the narration was still on 2018. The trim ladder
   was 2.1 s late on every card; the comparison rows were 6–10 s early; the verdict card
   appeared after its own line. All four were re-placed or re-timed, and each now lands
   on its spoken cue. Re-verified against the transcript.
2. **Dead archive in-points.** Luminance sampling across the film (139 points) found the
   2017 unveil entering on a near-black frame (mean luma 1.8/255). The reveal is 86 s
   later than the in-point used. Three 2017 in-points and one 2026 in-point were moved to
   frames that actually show something; the worst case went from 1.8 to 57.8 mean luma.
3. **Bar fills with no width.** In the claimed-vs-verified table the fill elements were
   absolutely positioned with no width, so `scaleX` animated nothing and all three bars
   rendered empty. Fixed; bars now read proportionally.
4. **Scale/readout mismatch.** The air-tank gauge ticks ran 250→0 left-to-right while the
   bar drained right-to-left, so at 110.4 kg the bar edge pointed at roughly "130".
   Ticks reversed to ascend 0→250 so the bar edge reads the remaining mass.
5. **Wrong credit on a clip.** The 4K ramp footage is filed under a name containing
   "teslarati" and was picking up the *photograph* credit rule. Video sources are now
   matched before stills.
6. **Kicker line contradicted the narration.** The trim ladder read "isn't for sale" —
   a line not spoken for another 28 s. Replaced with text matching what is said while
   it is on screen.
7. **True peak overshoot.** The AAC encode pushed −1.0 dBTP to −0.9. Re-mastered with
   headroom; final lands at −1.5 dBTP with integrated loudness unchanged.

## Checklist

**Story** — hook inverts the title promise within 7 s. All four open loops close
(0.81 s → 06:19; "hold that thought" → 05:59; "the one detail" → 09:01; "what it really
is" → 10:24). Re-hooks every ~1:50; longest gap under 2 minutes, so no flat stretch.

**Sync** — graphics verified cue-by-cue against the transcript. Cuts fall on phrase
boundaries from the VAD pass; no mid-word cuts.

**Visual** — 159 shots, no asset reused inside 90 s except deliberate callbacks (the hero
frame returns at 00:31, 05:54 and 10:24 as a structural rhyme). Every still moves; motion
direction varied. All eight sub-HD sources use the framed-archive treatment — nothing is
upscaled past what it supports.

**Text and graphics** — no collisions. The detail rail was re-laid out to evenly spaced
slots after proportional spacing collided irreparably (Sep 12 / Oct 1 / Oct 15 overlapped
into unreadable text). Contrast passes WCAG AA on all 5 text checks in lint.

**Transitions** — hard cuts throughout; no decorative transitions used.

**Colour** — one grade across photographs, footage, 360p archive and graphics. Mean luma
32.5/255, median 22 — dark by design (a night event), and the darkest frames were
re-checked individually rather than lifted globally, which would have flattened the plumes.

**Sound** — ambience under everything; six emphasis hits in 11:40, not one per cut; three
written silences. No clicks at edits (de-click pass found 0 bad samples in the source).

**Rights** — every source credited on screen at first use (13 distinct credits). The four
rights-managed wire photographs are deliberately unused. No AI-generated imagery.

## Known limitations — read before publishing

- **The XPeng shot is the wrong aircraft** (X2 eVTOL, not the Land Aircraft Carrier the
  narration describes). Gap #1. Needs a replacement image.
- **The 0-60 timer material reads 1.00 s, not 0.81 s.** Both the MotorTrend still and
  Tesla's own event footage show `00:00:01:00`. It currently plays under narration about
  the number being unverified, so it reads as supporting the argument — but confirm what
  that readout represents before publishing. Gap #2.
- No 9:16 Shorts version. The graphics need recomposing, not cropping.
- 360p is the ceiling on both full event replays; the framed-archive treatment is the
  honest workaround, not a fix.
