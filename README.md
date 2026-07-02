# Atomica — Interactive 3D Periodic Table

A modern periodic table built for high-school and 10+2 chemistry students. Dark
glassmorphism UI, animated with framer-motion, with a real-time 3D Bohr-model atom
(three.js) for every element.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Features

- **Explore** — the full 118-element table, color-coded by category. Click any element
  for a detail panel with a draggable 3D atom (orbiting electrons per shell), electron
  configuration with superscripts, shell counts, and every exam-relevant property.
- **Trends** — heatmap overlays for electronegativity, ionization energy, atomic mass,
  density, melting and boiling points, each with a one-line student explanation.
- **Temperature** — drag a 0–6000 K slider and watch every element switch between
  solid, liquid and gas (with presets like room temperature and the Sun's surface).
- **Quiz** — "guess the element" from progressive clues, answered by clicking the
  table; scoring rewards using fewer clues, with streaks.
- **Compare** — pick any two elements for side-by-side property bars.
- **Search & filter** — by name, symbol or atomic number (press `/`); filter by
  category via the legend chips.
- Keyboard navigation across the table (arrow keys, Enter, Esc), reduced-motion
  support, WebGL fallback to a 2D shell diagram, fully responsive (bottom-sheet
  details on mobile).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · framer-motion · three.js
(@react-three/fiber + drei) · zustand

Element data: [Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON)
(public domain), vendored in `src/data/elements.json`.

## Verification

`node shot.mjs` (needs `npm run dev` running) captures screenshots of every mode into
`screens/` and reports any browser console errors.
