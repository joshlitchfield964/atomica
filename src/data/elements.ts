import raw from './elements.json'
import type { CategoryKey } from './categories'

export interface Element {
  number: number
  symbol: string
  name: string
  mass: number
  category: CategoryKey
  phase: string
  density: number | null
  melt: number | null
  boil: number | null
  config: string
  electronegativity: number | null
  ionization: number | null
  electronAffinity: number | null
  shells: number[]
  summary: string
  discoveredBy: string | null
  appearance: string | null
  group: number
  period: number
  block: string
  x: number
  y: number
}

interface RawElement {
  name: string
  appearance: string | null
  atomic_mass: number
  boil: number | null
  category: string
  density: number | null
  discovered_by: string | null
  melt: number | null
  number: number
  period: number
  group: number
  phase: string
  summary: string
  symbol: string
  xpos: number
  ypos: number
  shells: number[]
  electron_configuration_semantic: string
  electron_affinity: number | null
  electronegativity_pauling: number | null
  ionization_energies: number[]
  block: string
}

function toCategory(c: string, group: number): CategoryKey {
  if (c.includes('unknown')) return 'unknown'
  switch (c) {
    case 'alkali metal': return 'alkali'
    case 'alkaline earth metal': return 'alkaline'
    case 'transition metal': return 'transition'
    case 'post-transition metal': return 'post-transition'
    case 'metalloid': return 'metalloid'
    case 'noble gas': return 'noble'
    case 'lanthanide': return 'lanthanide'
    case 'actinide': return 'actinide'
    default: return group === 17 ? 'halogen' : 'nonmetal'
  }
}

export const ELEMENTS: Element[] = (raw as { elements: RawElement[] }).elements
  .filter((e) => e.number <= 118)
  .map((e) => ({
    number: e.number,
    symbol: e.symbol,
    name: e.name,
    mass: e.atomic_mass,
    category: toCategory(e.category, e.group),
    phase: e.phase,
    density: e.density ?? null,
    melt: e.melt ?? null,
    boil: e.boil ?? null,
    config: e.electron_configuration_semantic,
    electronegativity: e.electronegativity_pauling ?? null,
    ionization: e.ionization_energies?.[0] ?? null,
    electronAffinity: e.electron_affinity ?? null,
    shells: e.shells,
    summary: e.summary,
    discoveredBy: e.discovered_by ?? null,
    appearance: e.appearance ?? null,
    group: e.group,
    period: e.period,
    block: e.block,
    x: e.xpos,
    y: e.ypos,
  }))

export const byNumber = new Map(ELEMENTS.map((e) => [e.number, e]))

export function elementAt(x: number, y: number): Element | undefined {
  return ELEMENTS.find((e) => e.x === x && e.y === y)
}

/** Phase of an element at temperature T (kelvin). */
export type Phase = 'solid' | 'liquid' | 'gas' | 'unknown'

export function phaseAt(e: Element, kelvin: number): Phase {
  if (e.melt == null && e.boil == null) return 'unknown'
  if (e.boil != null && kelvin >= e.boil) return 'gas'
  if (e.melt != null && kelvin < e.melt) return 'solid'
  if (e.melt != null && e.boil != null) return 'liquid'
  // only one bound known — report what we can be sure of
  if (e.melt == null && e.boil != null) return kelvin >= e.boil ? 'gas' : 'unknown'
  return 'unknown'
}

export const PHASE_COLORS: Record<Phase, { label: string; color: string }> = {
  solid: { label: 'Solid', color: '#818cf8' },
  liquid: { label: 'Liquid', color: '#22d3ee' },
  gas: { label: 'Gas', color: '#fb7185' },
  unknown: { label: 'Unknown', color: '#475569' },
}

// ---------- Periodic trends ----------

export type TrendKey = 'electronegativity' | 'ionization' | 'mass' | 'density' | 'melt' | 'boil'

export interface TrendInfo {
  label: string
  shortLabel: string
  unit: string
  hint: string
  get: (e: Element) => number | null
  format: (v: number) => string
}

const f1 = (v: number) => (v >= 1000 ? Math.round(v).toString() : v.toPrecision(3))

export const TRENDS: Record<TrendKey, TrendInfo> = {
  electronegativity: {
    label: 'Electronegativity',
    shortLabel: 'EN',
    unit: 'Pauling',
    hint: 'How strongly an atom pulls shared electrons. Increases → across a period, decreases ↓ down a group.',
    get: (e) => e.electronegativity,
    format: (v) => v.toFixed(2),
  },
  ionization: {
    label: 'Ionization energy',
    shortLabel: 'IE₁',
    unit: 'kJ/mol',
    hint: 'Energy needed to remove the outermost electron. Noble gases hold on the hardest.',
    get: (e) => e.ionization,
    format: (v) => Math.round(v).toString(),
  },
  mass: {
    label: 'Atomic mass',
    shortLabel: 'Mass',
    unit: 'u',
    hint: 'Average mass of an atom, weighted across natural isotopes.',
    get: (e) => e.mass,
    format: f1,
  },
  density: {
    label: 'Density',
    shortLabel: 'ρ',
    unit: 'g/cm³',
    hint: 'Mass per volume. Osmium and iridium are the heavyweights of the table.',
    get: (e) => e.density,
    format: f1,
  },
  melt: {
    label: 'Melting point',
    shortLabel: 'Melt',
    unit: 'K',
    hint: 'Where solid becomes liquid. Carbon and tungsten refuse to melt; helium never freezes at 1 atm.',
    get: (e) => e.melt,
    format: (v) => Math.round(v).toString(),
  },
  boil: {
    label: 'Boiling point',
    shortLabel: 'Boil',
    unit: 'K',
    hint: 'Where liquid becomes gas at standard pressure.',
    get: (e) => e.boil,
    format: (v) => Math.round(v).toString(),
  },
}

export const TREND_KEYS = Object.keys(TRENDS) as TrendKey[]

export interface TrendRange { min: number; max: number }

const rangeCache = new Map<TrendKey, TrendRange>()

export function trendRange(key: TrendKey): TrendRange {
  let r = rangeCache.get(key)
  if (!r) {
    const vals = ELEMENTS.map((e) => TRENDS[key].get(e)).filter((v): v is number => v != null)
    r = { min: Math.min(...vals), max: Math.max(...vals) }
    rangeCache.set(key, r)
  }
  return r
}

// heat scale: deep blue → cyan → green → yellow → orange → red
const HEAT_STOPS: [number, number, number][] = [
  [23, 37, 84],
  [8, 89, 133],
  [13, 148, 136],
  [101, 163, 13],
  [234, 179, 8],
  [249, 115, 22],
  [239, 68, 68],
]

export function heatColor(t: number, alpha = 1): string {
  const c = Math.min(1, Math.max(0, t)) * (HEAT_STOPS.length - 1)
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(c))
  const f = c - i
  const [r1, g1, b1] = HEAT_STOPS[i]
  const [r2, g2, b2] = HEAT_STOPS[i + 1]
  const r = Math.round(r1 + (r2 - r1) * f)
  const g = Math.round(g1 + (g2 - g1) * f)
  const b = Math.round(b1 + (b2 - b1) * f)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** last occupied subshell, e.g. "[Ne] 3s2 3p4" → { n: 3, l: 1, label: "3p" } */
export function lastSubshell(config: string): { n: number; l: number; label: string } {
  const matches = [...config.matchAll(/(\d+)([spdf])(\d+)/g)]
  const last = matches[matches.length - 1]
  if (!last) return { n: 1, l: 0, label: '1s' }
  const l = 'spdf'.indexOf(last[2])
  return { n: Number(last[1]), l, label: `${last[1]}${last[2]}` }
}

// ---------- formatting helpers ----------

export function fmt(v: number | null | undefined, digits = 3): string {
  if (v == null) return '—'
  if (Number.isInteger(v)) return v.toString()
  return v >= 1000 ? Math.round(v).toLocaleString('en-US') : Number(v.toPrecision(digits)).toString()
}

export function kelvinToC(k: number): number {
  return Math.round((k - 273.15) * 10) / 10
}
