# Atomica — Interactive 3D Periodic Table (Design Spec)

Date: 2026-07-02
Status: Approved (user delegated decisions — "free hands")

## Purpose

A modern, fully client-side periodic table web app for high-school / 10+2 chemistry
students. Goal: replace static, dated periodic tables with an interactive study tool
that makes abstract concepts (periodic trends, electron configuration, states of
matter) visual and explorable.

## Student pain points → features

| Pain point | Feature |
|---|---|
| Electron configuration feels abstract | 3D Bohr-model atom per element: glowing nucleus, orbit rings, animated orbiting electrons (three.js / react-three-fiber), plus shell counts and semantic configuration |
| Periodic trends are memorized, not understood | Trends mode: heatmap overlay across the table for electronegativity, 1st ionization energy, atomic mass, density, melting point, boiling point — with gradient legend |
| States of matter at temperature X | Temperature slider (0–6000 K) recolors every element solid/liquid/gas live |
| Exam recall / memorization | Quiz mode: clue-based "find the element" played directly on the table, streak scoring |
| Comparing two elements | Compare mode: pick 2 elements, side-by-side property bars |
| Finding elements fast | Instant search (name / symbol / number), category + block filters via legend chips |
| Studying on phones | Responsive: scaled grid with horizontal scroll container on small screens, detail opens as bottom sheet on mobile |

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS (v4, @tailwindcss/vite)
- framer-motion (layout animations, page transitions, staggered reveals)
- three.js via @react-three/fiber + @react-three/drei (3D atom)
- zustand (app state: mode, selection, filters, temperature, quiz)
- Element data: Bowserinator Periodic-Table-JSON (public domain, 118 elements),
  vendored into `src/data/elements.json` at build time (no runtime fetch)

## Design language

- Dark-only, science-lab / deep-space aesthetic (design decision: dark-first tools
  read as premium for this audience; contrast tested against WCAG AA on dark)
- Glassmorphism panels (blur + translucent surfaces) over a subtle radial glow background
- Category colors: 10-hue vivid palette (alkali=red, alkaline-earth=orange,
  transition=amber/yellow range, post-transition=teal, metalloid=cyan, nonmetal=green,
  halogen=blue, noble gas=violet, lanthanide=pink, actinide=rose) — each with a
  matching glow on hover
- Typography: Space Grotesk (display/headings), Inter (body/UI), JetBrains Mono (data values)
- Motion: 150–300 ms micro-interactions, spring physics, staggered grid entrance,
  layoutId shared-element transition from cell → detail panel, prefers-reduced-motion respected

## Architecture

Single-page app; the table is the app (no marketing hero). Top bar: logo, search,
mode tabs (Explore / Trends / Temperature / Quiz). Legend doubles as category filter.

```
src/
  main.tsx, App.tsx, index.css
  data/elements.json          # vendored dataset
  data/elements.ts            # types + parsing + derived fields
  data/categories.ts          # category → color tokens
  store/useStore.ts           # zustand: mode, selected, filters, query, temp, quiz, compare
  components/
    TopBar.tsx                # brand, search, mode switcher
    PeriodicTable.tsx         # CSS grid 18 cols + f-block rows
    ElementCell.tsx           # cell rendering per mode (category/heatmap/phase/quiz)
    Legend.tsx                # category chips (filter) or gradient legend (trends)
    DetailPanel.tsx           # modal / bottom sheet, prev-next nav
    Atom3D.tsx                # r3f canvas: nucleus, shells, orbiting electrons
    PropertyGrid.tsx          # stat cards inside detail
    TrendsBar.tsx             # property selector
    TemperatureBar.tsx        # slider + phase legend
    QuizPanel.tsx             # clue card, score, feedback
    CompareDrawer.tsx         # 2-element comparison
```

## Behavior details

- **Grid**: 18-column CSS grid; La/Ac series in two detached rows with placeholder
  markers in the main grid. Cells show number, symbol, name, mass.
- **Modes** are mutually exclusive top-level states; Explore is default. Compare is
  toggled from within Explore.
- **Heatmap**: normalize property across elements with data; missing data renders
  neutral/dimmed. Color scale: cool→hot gradient; legend shows min/max with units.
- **Temperature**: phase = solid if T < melt, liquid if melt ≤ T < boil, gas if T ≥ boil;
  unknown melt/boil ⇒ dimmed.
- **3D atom**: Bohr model (explicitly labeled as simplified model), shells from dataset
  `shells` array, electrons as emissive spheres orbiting on tilted rings at varied
  speeds, nucleus as glowing sphere with proton/neutron count; OrbitControls drag,
  auto-rotate; DPR capped, canvas lazy-mounted only when detail is open.
- **Quiz**: random element, 3 progressive clues (category+period → property → config);
  click the table to answer; correct = +points scaled by clues used; wrong = shake +
  reveal after 3 misses; running streak.
- **Keyboard**: arrows move focus across grid, Enter opens detail, Esc closes overlays.
- **Accessibility**: aria-labels on cells ("Hydrogen, atomic number 1"), focus rings,
  4.5:1 text contrast, color-not-only (phase/heatmap values also shown as text),
  reduced-motion disables orbit animation and entrance staggers.

## Error handling

All data is local/static — no network failure modes. Guard against missing numeric
fields (many elements lack electronegativity, melt/boil) at parse time with
null-safe rendering ("—"). WebGL unavailable ⇒ Atom3D falls back to a 2D SVG shell
diagram.

## Testing / verification

- `npm run build` must pass (TypeScript strict).
- Manual verification via dev server: all four modes, detail panel, mobile width (375px).
