# AUDIO PLAN

Everything in the soundtrack is **synthesised or processed in-house**. No library music,
no stock SFX. That means zero Content ID exposure and no licensing to clear.

## 1. Stems delivered
| Stem | File | Notes |
|---|---|---|
| Voice | `audio/stem_voice.mp3` | your VO after the cleanup chain below |
| Music | `audio/stem_music.mp3` | original score, D minor |
| Ambience | `audio/stem_ambience.mp3` | continuous bed, per-act |
| Effects | `audio/stem_sfx.mp3` | risers, hits, gauge ticks, pressure release |
| Final mix | `audio/FINAL_MIX.wav` / `.mp3` | mastered, 48 kHz |

## 2. Voiceover chain (applied in this order, lightly)
1. High-pass 80 Hz — removes rumble and plosive energy.
2. De-click — isolated sample spikes replaced by local median. **0 found**; your
   recording is clean.
3. Spectral noise reduction, **capped at 4 dB** — the noise floor was already low, so
   this is a touch, not a rescue.
4. EQ — about −2 dB around 300 Hz (mud), about +1.2 dB at 3.2–5.2 kHz (presence).
5. De-ess — band compressor on 5.5–9 kHz, triggered off the 97th percentile.
6. Compression — 2.5:1, **3.6 dB max gain reduction** (target was 2–4 dB).
7. High-pass 72 Hz, peak normalise to −1 dBFS.

The performance is untouched. No words moved, no pauses retimed.

## 3. Ducking
Rather than a generic sidechain, the duck is driven by the **actual speech regions**
from the VAD pass, so music lifts in real gaps instead of chasing the envelope.
- Attack 180 ms, release 300 ms.
- Music −9 dB under speech; ambience −3 dB under speech.
- A 1–4 kHz dip is carved out of the music only while the voice is present, so the
  bed never masks consonants.

## 4. Measured balance (targets from the style bible in brackets)
| Layer | Under voice | Target |
|---|---|---|
| Music | **16.3 LU** | 12–18 LU |
| Ambience | **23.3 LU** | 20–25 LU |
| Effects | **16.5 LU** | by importance |

## 5. Master
Two-pass loudnorm. **Measured output: −14.0 LUFS integrated, −1.0 dBTP true peak**,
LRA 2.4 LU. Both on target for YouTube.

## 6. Score map
Key: **D minor**. The cold-open note returns a fifth up at the verdict — the film ends
on the same sound it started with, resolved.

| Act | Material |
|---|---|
| A0 cold open | one low D2 drone, no pulse, entering under "It's also" |
| A1 the event | drone + 16th pulse building to the barrel roll |
| A2 the tell | pulse stripped out; detuned drone, flat-6 colour for unease |
| A3 how it works | mechanical analog arpeggio at 92 BPM; drops to a held chord for the thesis |
| A4 nine years | solo piano, **one note per slipped date**, no bed |
| A5 the trims | colder pulse returns |
| A6 the number | tension bed, rising fifth |
| A7 the rivals | open pad — the rivals get air, not menace; everything drops away on "is dead" |
| A8 the one detail | sub-only drone + pressure-gauge ticks through the tank drain |
| A9 the verdict | the A0 note, a fifth up; full chord on "a rocket you can park" |
| A10 outro | tail out by 11:37 |

## 7. Emphasis hits — six in the whole film, not one per cut
| Time | Moment |
|---|---|
| 1:10.7 | the barrel roll |
| 5:18.5 | "8 slipped dates" → smash to silence |
| 6:16.6 | "the car that leaves the ground isn't for sale" |
| 7:45.1 | "the launch is the product" |
| 9:27.9 | "It hops." |
| 11:23.7 | "a rocket you can park" |

## 8. Written silences
Not leftovers — placed deliberately, and they are room tone, never digital zero:
- 0.9 s before 9:01 (the one detail)
- 1.0 s before 11:04 ("but here's the twist")
- 0.8 s after 10:24 (the regulator line)
