import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { byNumber, fmt, type Element } from '../data/elements'
import { CATEGORIES, rgba } from '../data/categories'
import { useStore } from '../store/useStore'

const METRICS: { label: string; unit: string; get: (e: Element) => number | null }[] = [
  { label: 'Atomic mass', unit: 'u', get: (e) => e.mass },
  { label: 'Density', unit: 'g/cm³', get: (e) => e.density },
  { label: 'Electronegativity', unit: '', get: (e) => e.electronegativity },
  { label: '1st ionization', unit: 'kJ/mol', get: (e) => e.ionization },
  { label: 'Melting point', unit: 'K', get: (e) => e.melt },
  { label: 'Boiling point', unit: 'K', get: (e) => e.boil },
]

function Bar({ value, max, color }: { value: number | null; max: number; color: string }) {
  const pct = value == null || max === 0 ? 0 : Math.max(4, (value / max) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      {value != null && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      )}
    </div>
  )
}

export default function CompareDrawer() {
  const compareMode = useStore((s) => s.compareMode)
  const compare = useStore((s) => s.compare)
  const setCompareMode = useStore((s) => s.setCompareMode)
  const toggleCompare = useStore((s) => s.toggleCompare)

  const a = compare[0] != null ? byNumber.get(compare[0]) : undefined
  const b = compare[1] != null ? byNumber.get(compare[1]) : undefined

  return (
    <AnimatePresence>
      {compareMode && (
        <motion.aside
          key="compare"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="glass fixed inset-x-2 bottom-2 z-40 mx-auto max-w-3xl rounded-2xl p-3 sm:inset-x-4 sm:p-4"
          aria-label="Element comparison"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">
              {compare.length < 2
                ? `Compare — pick ${2 - compare.length} more element${compare.length === 1 ? '' : 's'} from the table`
                : 'Comparison'}
            </h2>
            <button
              onClick={() => setCompareMode(false)}
              aria-label="Close comparison"
              className="cursor-pointer rounded-lg border border-slate-700/60 p-1.5 text-ink-dim transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {a && b && (
            <div className="mt-3">
              <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {[a, b].map((e, i) => (
                  <div
                    key={e.number}
                    className={`flex items-center gap-2 ${i === 1 ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <button
                      onClick={() => toggleCompare(e.number)}
                      aria-label={`Remove ${e.name} from comparison`}
                      className="flex h-10 w-10 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border font-display text-sm font-bold transition-transform hover:scale-105"
                      style={{
                        background: rgba(CATEGORIES[e.category].color, 0.16),
                        borderColor: rgba(CATEGORIES[e.category].color, 0.5),
                      }}
                    >
                      {e.symbol}
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      <p className="truncate text-[11px]" style={{ color: CATEGORIES[e.category].color }}>
                        {CATEGORIES[e.category].label}
                      </p>
                    </div>
                  </div>
                ))}
                <span className="col-start-2 row-start-1 font-mono text-xs text-ink-dim">vs</span>
              </div>

              <div className="space-y-2">
                {METRICS.map(({ label, unit, get }) => {
                  const va = get(a)
                  const vb = get(b)
                  const max = Math.max(va ?? 0, vb ?? 0)
                  return (
                    <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-right font-mono text-xs tabular-nums">
                          {va == null ? '—' : fmt(va)}
                        </span>
                        <div className="scale-x-[-1]">
                          <Bar value={va} max={max} color={CATEGORIES[a.category].color} />
                        </div>
                      </div>
                      <span className="w-28 text-center text-[11px] text-ink-dim sm:w-32">
                        {label}
                        {unit && <span className="text-slate-600"> ({unit})</span>}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs tabular-nums">{vb == null ? '—' : fmt(vb)}</span>
                        <Bar value={vb} max={max} color={CATEGORIES[b.category].color} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {a && !b && (
            <p className="mt-2 text-xs text-ink-dim">
              <span className="font-semibold text-ink">{a.name}</span> selected — tap a second element.
            </p>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
