# SOMEONE STAYED — storyboard & production bible

A 30-second, vertical (1080×1920, 9:16), wordless hand-drawn short about depression and
the quiet power of someone simply staying with you. Every mark is painted with
[p5.brush](https://github.com/acamposuribe/p5.brush): pencil/ink doodle lines, gouache
washes, watercolour fills, hatching on a cream paper ground.

**Logline:** A person sits alone under a storm cloud only they can feel. Strangers walk past.
One friend notices, sits down in the rain with them, and only then opens an umbrella.

**Theme:** You don't have to fix someone's storm. Staying with them changes it.
The cloud doesn't vanish at the end. It shrinks to a small white puff that stays nearby,
harmless, because recovery is real but rarely instant.

---

## 1. Art direction

| | |
|---|---|
| Look | Picture-book doodle: wobbly graphite/ink outlines (p5.brush `2B`, `HB`, `pen`, `charcoal`), flat gouache base (`wash`), watercolour bloom/texture (`fill`), cross-hatch shading (`hatch`). Paper grain + fibres, soft vignette. |
| Line life | **Line boil:** 3 re-inked variants of every drawing, cycled at 12 Hz, so even still things breathe. |
| Motion | **Animated on ones** (24 fps) for physics, camera and acting; boil on twos. |
| Doodle magic | Shot 1 draws itself onto the paper (lines trace on, paint bleeds in after). In Shot 6 the tangled thought-line pulls straight and doodles the sun. |
| Framing (9:16) | Single tall stack per shot: sky/cloud in the top third, characters in the middle third (eyes ~⅓ from top in close shots), ground/puddle/flowers in the bottom third. Faces and key action stay out of the top 12% and bottom 18% (platform UI zones). Slow push-ins and tilts only; no fast horizontal pans. |

### Colour script

| Shot | Mood | World | Accent |
|---|---|---|---|
| 1 | isolation | soft grey-blue daylight; park still mildly green | the cloud: charcoal |
| 2 | spiral | drains to near monochrome; vignette closes in | lightning flash (paper white) |
| 3 | noticed | still grey | Sunny's terracotta coat + mustard scarf |
| 4 | shelter | grey | **yellow umbrella**, the first saturated colour |
| 5 | contact | warm watercolour bloom spreads out from the held hands | gold / peach |
| 6 | release | sky warms; cloud bleaches to white | gold sun, coral/pink/lilac flowers |
| 7 | together | full warm palette, fresh greens, blossoms | soft golden light |

## 2. Characters

**ASH** (protagonist): small and round-headed. Dark bob with a fringe, oversized blue-grey
hoodie (hood bunched behind the neck, two **hood strings with rope physics**), dark
trousers, white sneakers. Emotion is carried by posture: curled spine, knees hugged, head
sunk. Eyes go from closed arcs to dots with a glint; brows go from worried to soft.

**SUNNY** (friend): taller. Auburn curly hair in a **bun with springy loose curls**,
terracotta coat with buttons, **mustard scarf with a cloth-chain tail** blowing in the wind,
yellow umbrella. Open and warm; moves with patience.

**PASSER-BY** (background): grey coat, eyes on a phone, walks past in Shot 1 without
looking. They show that mental illness is often invisible.

### Rig (same rig for every character)
- Skeleton: pelvis → spine (2 segments, curl) → neck → head; shoulders → upper arm →
  forearm → hand; hips → thigh → shin → foot.
- **Two-bone IK** (law of cosines) on all four limbs: feet plant on the ground or bench,
  hands reach targets (knees, umbrella handle, the other person's hand).
- **Head turn** param slides features across the head (profile ↔ ¾) for 2D head turns.
- Procedural life layers: breathing (chest and shoulders rise, 3.5–4.5 s cycle), randomised
  2-frame blinks, head micro-drift, weight settling.
- **Walk cycle** (contact → down → passing → up, Richard Williams): hip bob lowest on
  *down*, counter-swinging arms, heel-toe foot roll, follow-through on hair and scarf.
- Acting principles used: anticipation before every big action (sit, reach, umbrella pop),
  overshoot + settle (springs), slow-in/slow-out, arcs on heads and hands, squash & stretch
  on drops, the umbrella pop and flower blooms.

### Physics / secondary motion (deterministic, precomputed at 120 Hz)
- Verlet rope chains: Ash's hood strings, Sunny's scarf tail and loose curls, the
  unravelling thought-thread.
- Damped springs: grass blades and flower stems (driven by a travelling wind-gust field),
  Sunny's bun, cloud lobes (wobble, swell), umbrella canopy (pop-open overshoot), tree
  canopy clusters.
- Particles: rain (stopped by the canopy or heads), splash droplets in ballistic arcs,
  puddle ripples, falling leaves (pendulum flutter), blossom petals.

## 3. World
A park on a gentle hill. A **big tree** frames the left edge (swaying canopy, leaf flutter,
falling leaves). A wooden **bench** sits in the centre, with a **footpath** winding up to it
and a **puddle** that fills under the bench. Rolling hills behind, with a tiny town on the
far hill. Grass tufts everywhere, all moving in the wind. In the last act: flowers, a
butterfly, birds.

---

## 4. Shot list (24 fps, 720 frames)

### SHOT 1 · "Alone" · 0:00.0–0:05.0 · WIDE
- **Camera:** eye level, full set. Slow push-in, z 1.00 → 1.12.
- **0.0–1.4:** the drawing doodles itself onto the paper: outlines trace on, washes bleed
  in behind them.
- **Action:** Ash sits curled on the bench, hugging their knees. A dark cloud hangs over
  only them and rains only on them. Splashes bounce off their head and shoulders, the
  puddle ripples, and the hood strings swing as they breathe.
- **1.6–5.0:** the passer-by crosses the far path left to right, eyes on their phone,
  and never looks over.
- **Alive:** grass waves in gusts, tree leaves flutter, one leaf falls.

### SHOT 2 · "Spiral" · 0:05.0–0:09.5 · MEDIUM → CLOSE
- **Camera:** continuous push-in z 1.12 → 1.95 onto Ash; the vignette tightens.
- **Action:** The cloud swells with spring wobble and darkens; the charcoal scribbles thicken.
  **7.0s:** a doodled lightning zig-zag and a 2-frame paper flash. Rain gets heavier.
- A scribble of tangled thoughts spins and thickens above Ash's head.
- Ash curls tighter (squash) and sinks their head into their knees. One tear stretches as it
  falls and splashes.
- **Colour:** the world drains to near monochrome.

### SHOT 3 · "Noticed" · 0:09.5–0:14.0 · MEDIUM-WIDE (cut)
- **Camera:** z 1.30, framing the bench and the right side of the frame.
- **9.6–11.4:** Sunny walks in from the right (full walk cycle), holding a closed yellow
  umbrella. The bun bounces and the scarf trails behind.
- **11.4:** Sunny stops (overshoot and settle), looks up at the cloud, then down at Ash. A beat.
- **12.2–13.6:** Sunny sits down beside Ash **in the rain**: a small anticipation lean, then
  down, a squash, and a settle. Rain now falls on both of them.

### SHOT 4 · "Shelter" · 0:14.0–0:17.5 · MEDIUM
- **Camera:** z 1.45, slightly lower; a gentle push.
- **14.2:** Sunny lifts the umbrella (anticipation dip).
- **14.7:** it **pops open** (stretch, then a squash overshoot, then wobble) over both of
  them. Rain drums on the canopy and drips from the rib tips.
- **15.6–17.3:** Ash's head lifts a little. Their eyes open in a slow blink, and they
  glance sideways at Sunny.
- **16.3–17.4:** feeling safe, Ash unfolds: knees come down and their feet dangle from the
  bench. This clears the seat between them for the hand-hold.

### SHOT 5 · "Reach" · 0:17.5–0:21.0 · CLOSE-UP INSERT (cut)
- **Camera:** z ≈ 3.1 on the bench seat between them. The background softens.
- **Action:** Sunny's hand rests palm-up on the bench, fingers relaxed and breathing.
- **18.1:** Ash's hand slides in, hesitates and pulls back (anticipation).
- **19.0:** it moves forward again and rests in Sunny's palm. Sunny's thumb closes over it.
- **19.3:** warm watercolour blooms ripple outward from the held hands across the frame.
  Colour returns.

### SHOT 6 · "Untangle" · 0:21.0–0:25.5 · MEDIUM, tilt up (cut)
- **Camera:** z 1.40, tilting up as the thread rises.
- **Action:** Ash sits up and smiles a little, feet swinging gently.
- **21.4:** the thought-tangle unravels into a single wavy line (a rope wave runs up it).
  It rises into the sky and **doodles a circle that becomes the sun**, which floods with gold.
- **22.0:** the cloud bleaches from grey to white and shrinks. It wrings out its last
  drops, and each one hits the ground and **pops into a flower** (stem springs up, petals
  overshoot open).
- **23.6:** Sunny folds the umbrella and leans it against the bench.

### SHOT 7 · "Together" · 0:25.5–0:30.0 · WIDE pull-back
- **Camera:** z 1.40 → 1.00, pulling back and up to reveal sky and field.
- **Action:** Ash rests their head on Sunny's shoulder, and Sunny leans their cheek on it.
  They breathe in sync, still holding hands.
- The small white cloud hovers beside them, harmless.
- Birds cross the sky, a butterfly flutters through the flowers, and blossom petals drift.
- **29.1–30.0:** the image fades softly back to paper.

---

## 5. Technical plan
- `src/` ES modules: `util` (math, noise, colour), `ink` (p5.brush helpers, draw-on, boil),
  `rig` (skeleton, IK, character skins), `sim` (precomputed physics), `world` (set and
  props), `story` (timeline, shots, acting keys), `main` (p5 lifecycle, compositing).
- The static far background (sky gradient, far hills and town, ground base) is painted
  with p5.brush once per palette state × boil variant at 2× resolution. These plates are
  cross-faded under the camera. Everything that moves is repainted live with p5.brush
  every frame.
- Headless Chromium renders the frames in parallel; ffmpeg encodes H.264 High at
  1080×1920, 24 fps, 30.0 s.
