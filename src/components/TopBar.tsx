import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Atom, TrendingUp, Thermometer, Brain, Search, GitCompareArrows, X } from 'lucide-react'
import { useStore, firstMatch, type Mode } from '../store/useStore'

const MODES: { key: Mode; label: string; icon: typeof Atom }[] = [
  { key: 'explore', label: 'Explore', icon: Atom },
  { key: 'trends', label: 'Trends', icon: TrendingUp },
  { key: 'temperature', label: 'Temperature', icon: Thermometer },
  { key: 'quiz', label: 'Quiz', icon: Brain },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="none" stroke="#22d3ee" strokeWidth="1.4" aria-hidden>
        <circle cx="12" cy="12" r="2.2" fill="#22d3ee" stroke="none" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      </svg>
      <div className="leading-tight">
        <h1 className="font-display text-lg font-bold tracking-tight">Atomica</h1>
        <p className="hidden text-[11px] text-ink-dim sm:block">Interactive periodic table</p>
      </div>
    </div>
  )
}

export default function TopBar() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const query = useStore((s) => s.query)
  const setQuery = useStore((s) => s.setQuery)
  const select = useStore((s) => s.select)
  const compareMode = useStore((s) => s.compareMode)
  const setCompareMode = useStore((s) => s.setCompareMode)
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="glass sticky top-0 z-40 mb-4 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        <Logo />

        {/* search */}
        <div className="relative order-3 w-full min-w-0 basis-full md:order-2 md:ml-2 md:w-64 md:basis-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const n = firstMatch(query)
                if (n) select(n)
              }
            }}
            placeholder="Search name, symbol or number…  ( / )"
            aria-label="Search elements"
            className="h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-9 pr-8 text-sm text-ink placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/25"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-dim transition-colors hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          {/* compare toggle (explore only) */}
          <button
            onClick={() => {
              if (mode !== 'explore') setMode('explore')
              setCompareMode(!compareMode)
            }}
            aria-pressed={compareMode}
            className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-all ${
              compareMode
                ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                : 'border-slate-700/60 bg-slate-900/60 text-ink-dim hover:border-slate-500 hover:text-ink'
            }`}
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Compare</span>
          </button>

          {/* mode tabs */}
          <nav aria-label="View mode" className="flex rounded-xl border border-slate-700/60 bg-slate-900/60 p-1">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                aria-pressed={mode === key}
                className={`relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3 ${
                  mode === key ? 'text-slate-900' : 'text-ink-dim hover:text-ink'
                }`}
              >
                {mode === key && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan-300 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" aria-hidden />
                <span className="relative z-10 hidden lg:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
