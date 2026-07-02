export type CategoryKey =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'

export interface CategoryInfo {
  label: string
  /** base hex color, used at various alphas for fills/borders/glows */
  color: string
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  alkali: { label: 'Alkali metal', color: '#fb4d67' },
  alkaline: { label: 'Alkaline earth', color: '#fb923c' },
  transition: { label: 'Transition metal', color: '#facc15' },
  'post-transition': { label: 'Post-transition', color: '#2dd4bf' },
  metalloid: { label: 'Metalloid', color: '#34d399' },
  nonmetal: { label: 'Nonmetal', color: '#a3e635' },
  halogen: { label: 'Halogen', color: '#60a5fa' },
  noble: { label: 'Noble gas', color: '#a78bfa' },
  lanthanide: { label: 'Lanthanide', color: '#f472b6' },
  actinide: { label: 'Actinide', color: '#e879f9' },
  unknown: { label: 'Unknown properties', color: '#94a3b8' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
