# STYLE BIBLE — "They Built a Rocket You Can Park"
Tesla Roadster flying-car reveal · 11:40 · 1920×1080 · 30 fps

The film's argument is **claimed vs. verified**. Every design decision below exists to make
that distinction visible without the narrator having to repeat it.

---

## 1. Look

| | |
|---|---|
| Base grade | Cool technical. Teal-shifted shadows, neutral-to-cool mids, deep but not crushed blacks (floor ~6/255). Slight highlight roll-off so thruster plumes and lasers don't clip. |
| Contrast | Firm. S-curve with a lifted toe only in A4 (archive-era material) to keep old footage honest. |
| Saturation | Restrained overall (≈85%) so the two accents read as signal, not decoration. |
| Grain | Light and even, 1.2% at 1080p, constant across every source type. Graphics get 0.6% only — text must stay crisp. |
| Vignette | Soft, −0.18 at the corners. Firmer (−0.26) in A8 (the climax) and A9. |
| Aspect / safe | 16:9. Title-safe 90%. All text and marks inside 1728×972 centred. |

**Palette**

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#07090D` | Background, letterbox, dip-to-black |
| `--ink-2` | `#0E131A` | Card bodies, panel fills |
| `--steel` | `#1C242E` | Rules, dividers, inactive rows |
| `--slate` | `#5A6878` | Secondary text, units, source tags |
| `--bone` | `#E9E7E2` | Primary text (never pure white — pure white buzzes against grain) |
| `--verify` | `#4FD1E0` | **Accent 1 — VERIFIED.** Independent measurement, real records, physics. |
| `--claim` | `#FF4733` | **Accent 2 — CLAIMED.** Tesla's own figures, unverified numbers, warnings. |

Two accents, not one, and this is deliberate: the palette *is* the thesis. Cyan means
somebody outside Tesla checked it. Red-orange means only Tesla says so. Once the viewer
learns that in A0, every later graphic reads instantly with no extra text. Nothing else in
the film is allowed to be cyan or red-orange.

---

## 2. Motion language

- One easing family: `cubic-bezier(0.22, 1, 0.36, 1)` (a quint-out) for entrances and
  reveals; `cubic-bezier(0.65, 0, 0.35, 1)` for anything that must feel mechanical
  (gauges, counters, the tank drain). No bounce, no overshoot, no spin, anywhere.
- Stills move by default: 3–8% scale across the shot, eased both ends, direction varied so
  the film is not all push-ins. Push-in = scrutiny. Pull-out = isolation/scale.
  Lateral drift = time passing. Tilt down = weight.
- Holds are allowed only for a logged reason (document reading, annotation precision,
  emotional weight, low-res source, or rhythm rest after several moving shots).
  A held frame still gets grain, a faint light drift and ambience — never a dead frame.
- Graphics animate to **explain**, never to decorate. A counter counts because the number
  is the point. A card that only needs to appear gets a 12-frame rise-and-fade, nothing more.

## 3. Transitions

Hard cut is the default and should be ≈85% of all cuts. Budget: no more than one non-cut
transition per 30–45 s, each with a reason.

| Allowed | Where | Why |
|---|---|---|
| Hard cut | everywhere | default |
| J-cut / L-cut | across act seams, into every quote | sound leads picture so the seam disappears |
| Dip to black, 0.5–1.0 s | act ends only (A2→A3, A4→A5, A6→A7, A8→A9) | chapter punctuation; max once per act |
| Cross dissolve, 14–20 fr | A4 timeline only, between slipped dates | the one place the film means "time passing" |
| Smash cut to silence | 318.47 ("8 slipped dates"), 624.07 ("may never be allowed to") | the two hardest landings |
| Match cut | 70.72 barrel roll → 193.45 thrust/fan arrows; 548.26 tank → 567.85 "it hops" | visual rhyme carries the argument |
| Speed ramp | **one** hero moment: the kickflip at 71.11, ramped 100%→35%→100% | earns the spectacle once, then never again |

Banned outright: whip pans, glitch, RGB split, light-leak flares, zoom blur, page curls,
anything that would read as a template. The film's credibility is its product.

## 4. Typography

Two families only.

| Role | Face | Spec |
|---|---|---|
| Display / titles / verdict lines | **Archivo** 700/600 | Tracking −2.5%, line-height 0.95. Sentence case for statements, UPPERCASE only for act cards. |
| Data / labels / stamps / sources | **JetBrains Mono** 500/700 | Tracking +6%, UPPERCASE for labels. All numbers, units, dates, timestamps, trim names. |

Every figure in this film is mono. That is the rule that makes the claimed/verified system
work: numbers look like instrument readings, not like design.

Sizes (1080p): act card 104px · statement 72px · headline 56px · lower-third name 38px /
role 24px · data value 64px · data label 20px · source tag 16px.

## 5. Graphic language

- Line weight 3px (0.28% of frame height). Corner radius 2px — near-square, engineered.
- Panels: `--ink-2` at 92% over a darkened, blurred plate of the relevant location; never
  text straight onto busy footage without a backing gradient.
- **The stamp system.** Every number that appears on screen carries one mono pill:
  `CLAIMED · TESLA` in `--claim`, or `VERIFIED · <source>` in `--verify`.
  No number appears naked. This is the film's single most important graphic device.
- Redaction bars only in A8 (the unanswered questions) — the one place the story is
  genuinely about withheld information.
- Source tag bottom-left, mono 16px, `--slate`, on first use of any archive item.
- Max 3 text/mark elements on screen at once; one is usually right.

## 6. Sound palette

| Act | Music | Ambience |
|---|---|---|
| A0 | Single low synth note, no pulse. Enters at 2.72 under "It's also". | Dead studio tone |
| A1 | Low drone + slow 16th pulse building to the launch | Night desert, distant range hum, crowd murmur |
| A2 | Pulse strips out; drone alone, detuned | Wind, far-off airspace tone |
| A3 | Analog-synth arpeggio, mechanical, 92 BPM | Compressor hum, pressurised hiss |
| A4 | Piano, one note per slipped date, no bed | Office/room tone, keyboard clicks |
| A5 | Pulse returns, colder | Showroom reverb |
| A6 | Tension bed, rising fifth | Track ambience, tyre squeal distant |
| A7 | Open pad — the rivals get air, not menace | Hangar, rotor wash |
| A8 | Drone drops to sub only; pressure-gauge ticks | Pressurised hiss, then true room tone |
| A9 | Resolution: the A0 note returns a fifth up | Night desert again — we are back where we started |
| A10 | Tail out by 697.0 | Clear |

- Loudness target −14 LUFS integrated, true peak ≤ −1.0 dBTP.
- Music sits 12–18 LU under the voice, ducked 150–300 ms attack/release, rising only in
  the logged gaps. Ambience 20–25 LU under voice. Everything is synthesised in-house, so
  there is no Content ID exposure.
- Emphasis hits are rationed: **six** in the whole film (70.72, 318.47, 376.58, 465.10,
  567.85, 683.72). Not one per cut.
- Silence is written in, not left over: 0.9 s before 541.90, 1.0 s before 663.98,
  0.8 s after 624.07. "Silence" means room tone, never digital zero.

## 7. Motifs

Three, each tied to the argument.

1. **The air tank.** A mono pressure readout with a draining bar. Seeded as a 0.4 s ghost
   at 19.53 ("the one engineering detail"), referenced at 215.40 ("the tank is the limit"),
   and fully paid at 547.91–563.30 where it drains to empty in real time against the
   27 kg/s burn rate. It is the film's clock.
2. **CLAIMED vs VERIFIED stamps.** Introduced on "0.81" at 83.11, becomes an explicit rule
   at 447.46, and by A6 the viewer reads a bare red pill as "don't trust this".
3. **The slipped-date rail.** A horizontal date line that accumulates struck-through dates
   through A4, resolving to "8 slipped dates" at 318.47 and recalled once as a 0.6 s ghost
   under the verdict at 680.84.

## 8. Accuracy and ethics

- Elon Musk and Jim Dukhovny are public figures speaking publicly; quoting them on screen
  is fine. Verbatim only, with the correct speaker attributed. No fabricated quotes.
- Every Tesla figure on screen is tagged `CLAIMED · TESLA`. The film must never let a
  Tesla number look independently established — that is precisely the error it is about.
- "No FAA certificate in federal records" is shown as an absence-of-record, never as a
  denial by the FAA.
- Rival companies are named factually. Lilium's collapse is stated, not mocked; a failed
  company's employees are not the story.
- No AI-generated footage is presented as event footage. Anything built or generated is
  disclosed in `credits_and_sources.txt` and labelled on screen where it could mislead.

## 9. ASR → on-screen spelling corrections (mandatory)

The transcript is machine-generated and misheard several proper nouns. On-screen text uses:
Rimac Nevera · Pininfarina Battista · Nardò · Jim Dukhovny · Alef Aeronautics ·
Joby Aviation · XPeng · Evel Knievel · kickflip · 7:55 PM · COPV
