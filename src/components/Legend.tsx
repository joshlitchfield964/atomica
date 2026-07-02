import { CATEGORIES, CATEGORY_KEYS, rgba } from '../data/categories'
import { TRENDS, trendRange, heatColor } from '../data/elements'
import { useStore } from '../store/useStore'

function CategoryLegend() {
  const categoryFilter = useStore((s) => s.categoryFilter)
  const toggle = useStore((s) => s.toggleCategoryFilter)

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter by category">
      {CATEGORY_KEYS.map((key) => {
        const { label, color } = CATEGORIES[key]
        const active = categoryFilter === key
        const dimmedOut = categoryFilter !== null && !active
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            aria-pressed={active}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              active ? 'scale-105' : dimmedOut ? 'opacity-40' : ''
            } hover:opacity-100`}
            style={{
              background: rgba(color, active ? 0.28 : 0.1),
              borderColor: rgba(color, active ? 0.9 : 0.35),
              color: '#e6edf7',
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function TrendLegend() {
  const trend = useStore((s) => s.trend)
  const info = TRENDS[trend]
  const { min, max } = trendRange(trend)
  const stops = Array.from({ length: 24 }, (_, i) => heatColor(i / 23)).join(', ')

  return (
    <div className="mx-auto mt-4 flex max-w-md items-center gap-3 px-2">
      <span className="font-mono text-xs text-ink-dim">{info.format(min)}</span>
      <div
        className="h-2.5 flex-1 rounded-full"
        style={{ background: `linear-gradient(to right, ${stops})` }}
        role="img"
        aria-label={`Color scale from ${info.format(min)} to ${info.format(max)} ${info.unit}`}
      />
      <span className="font-mono text-xs text-ink-dim">
        {info.format(max)} <span className="text-slate-500">{info.unit}</span>
      </span>
    </div>
  )
}

export default function Legend() {
  const mode = useStore((s) => s.mode)
  if (mode === 'quiz' || mode === 'temperature') return null
  return mode === 'trends' ? <TrendLegend /> : <CategoryLegend />
}
