import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { byNumber, fmt } from '../data/elements'
import { CATEGORIES, rgba } from '../data/categories'
import { useStore } from '../store/useStore'
import ConfigText from './ConfigText'
import PropertyGrid from './PropertyGrid'

// three.js is heavy — load it only when a detail panel first opens
const Atom3D = lazy(() => import('./Atom3D'))

export default function DetailPanel() {
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const element = selected != null ? byNumber.get(selected) : undefined

  useEffect(() => {
    if (!element) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
      if (e.key === 'ArrowRight' && element.number < 118) select(element.number + 1)
      if (e.key === 'ArrowLeft' && element.number > 1) select(element.number - 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [element, select])

  return (
    <AnimatePresence>
      {element && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => select(null)}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            key={`panel`}
            role="dialog"
            aria-modal="true"
            aria-label={`${element.name} details`}
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="glass fixed inset-x-0 bottom-0 z-50 max-h-[94dvh] overflow-y-auto rounded-t-3xl p-4 sm:p-6 md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:max-h-[88dvh] md:w-[min(60rem,94vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
          >
            {/* header */}
            <div className="flex items-start gap-3">
              <div
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border font-display"
                style={{
                  background: rgba(CATEGORIES[element.category].color, 0.16),
                  borderColor: rgba(CATEGORIES[element.category].color, 0.5),
                  boxShadow: `0 0 26px ${rgba(CATEGORIES[element.category].color, 0.3)}`,
                }}
              >
                <span className="text-2xl font-bold leading-none">{element.symbol}</span>
                <span className="mt-1 font-mono text-[10px] text-ink-dim">{element.number}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl font-bold tracking-tight">{element.name}</h2>
                <p className="text-sm" style={{ color: CATEGORIES[element.category].color }}>
                  {CATEGORIES[element.category].label}
                  {element.appearance && (
                    <span className="text-ink-dim"> · {element.appearance}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => select(element.number - 1)}
                  disabled={element.number <= 1}
                  aria-label="Previous element"
                  className="cursor-pointer rounded-xl border border-slate-700/60 p-2 text-ink-dim transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => select(element.number + 1)}
                  disabled={element.number >= 118}
                  aria-label="Next element"
                  className="cursor-pointer rounded-xl border border-slate-700/60 p-2 text-ink-dim transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => select(null)}
                  aria-label="Close"
                  className="ml-1 cursor-pointer rounded-xl border border-slate-700/60 p-2 text-ink-dim transition-colors hover:border-rose-400/60 hover:text-rose-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.15fr]">
              <div>
                <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-700/50 bg-[#05070d] sm:h-72">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-ink-dim">
                        <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Loading 3D atom" />
                      </div>
                    }
                  >
                    <Atom3D element={element} />
                  </Suspense>
                  <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] text-ink-dim">
                    Bohr model (simplified) · drag to rotate
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/45 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-dim">
                    Electron configuration
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    <ConfigText config={element.config} />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1" aria-label="Electrons per shell">
                    <span className="mr-1 text-[10px] uppercase tracking-wider text-ink-dim">Shells</span>
                    {element.shells.map((n, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm leading-relaxed text-ink-dim">{element.summary}</p>
                <PropertyGrid element={element} />
                {element.discoveredBy && (
                  <p className="text-xs text-ink-dim">
                    Discovered by <span className="text-ink">{element.discoveredBy}</span>
                    {' · '}Atomic mass {fmt(element.mass, 6)} u
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
