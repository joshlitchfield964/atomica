# GRADE PLAN

## 1. Base grade — applied to every source type
One grade runs on photographs, event footage, 360p archive and built graphics alike,
so the film reads as one piece rather than a collage.

```
eq=contrast=1.085 : saturation=0.86 : gamma=0.985
curves  r: 0/0.012  0.25/0.225  0.75/0.775  1/0.985
        g: 0/0.016  0.25/0.238  0.75/0.784  1/0.990
        b: 0/0.030  0.25/0.262  0.75/0.800  1/1.000
grain   noise alls=5 (graphics: 4)
vignette angle=PI/5.2, centred
```

**What it does and why**
- The blue channel is lifted hardest in the toe (0.030 vs 0.012 red) and pulled down
  least in the shoulder, which puts a cool cast in the shadows without tinting skin
  tones or the white car body. This is the "cool technical" look from the style bible.
- Contrast 1.085 with a gentle S in the curves keeps the night material punchy while
  the lifted toe stops the blacks crushing — most of this film is a night event, and
  crushed blacks on a phone screen lose the thruster plumes entirely.
- Saturation 0.86 pulls the event's red stage lighting back so the film's own two
  accents (`--verify` cyan, `--claim` red-orange) stay the strongest colours on screen.
  Without this the graphics fight the footage.
- Highlight shoulder lands at 0.985 so the cold-gas plumes roll off instead of clipping.
  The plumes are the film's main bright object and clipping them looks cheap.

## 2. Per-source adjustments
| Source | Adjustment | Reason |
|---|---|---|
| MotorTrend stills (2026 event) | base only | already the reference look |
| Tesla press stills | base only | matches MotorTrend closely |
| 360p archive (2026 replay, 2017 unveil) | base + framed-archive treatment: background copy at `brightness −0.22, saturation 0.45, boxblur 28:2`; inset at 77% width with a 3 px bone border | nothing is upscaled past what it supports; the darkened plate stops the low-res inset competing |
| Wikimedia competitor images | base only | daylight stock; the desaturation pulls them toward the night film |
| Built graphics | base-equivalent palette at source, grain reduced to 4 | text must stay crisp; grain on type looks like compression |

## 3. Act variation
The grade shifts with the intensity curve, gradually and rarely:
- **A0–A1** base.
- **A2 (the tell)** vignette firms slightly as doubt enters.
- **A4 (nine years)** toe lifted a touch on the 2017 archive so the older material
  reads as a different era without a sepia cliché.
- **A8 (the one detail)** vignette to −0.26, the firmest in the film. The frame closes
  in as the tank empties.
- **A9 (verdict)** returns to base. We end where we started, visually as well as
  narratively.

## 4. Rules observed
- No colourising of archive. The 2017 footage stays as shot.
- No artificial sharpening or upscaling. Honest softness beats fake detail.
- Skin tones (Musk on stage) checked against the desaturation — the 0.86 figure is the
  highest the red stage lighting tolerates before his face goes waxy.
- No source is left ungraded, including graphics, so there is no "pasted on" shot.
