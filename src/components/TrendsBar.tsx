import { motion } from 'framer-motion'
import { TRENDS, TREND_KEYS } from '../data/elements'
import { useStore } from '../store/useStore'

export default function TrendsBar() {
  const trend = useStore((s) => s.trend)
  const setTrend = useStore((s) => s.setTrend)

  return (
    <div className="glass mb-4 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a periodic trend">
        {TREND_KEYS.map((key) => {
          const active = trend === key
          return (
            <button
              key={key}
              onClick={() => setTrend(key)}
              aria-pressed={active}
              className={`relative cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? 'text-slate-900' : 'text-ink-dim hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="trend-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-300 to-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.4)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10">{TRENDS[key].label}</span>
            </button>
          )
        })}
      </div>
      <motion.p
        key={trend}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2.5 text-sm text-ink-dim"
      >
        <span className="font-semibold text-ink">{TRENDS[trend].label}</span>{' '}
        <span className="font-mono text-xs text-slate-500">({TRENDS[trend].unit})</span> —{' '}
        {TRENDS[trend].hint}
      </motion.p>
    </div>
  )
}
