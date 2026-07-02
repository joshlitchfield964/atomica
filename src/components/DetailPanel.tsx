import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, LoaderCircle, Orbit, Waves, Tags } from 'lucide-react'
import { byNumber, lastSubshell } from '../data/elements'
import { CATEGORIES, rgba } from '../data/categories'
import { useStore } from '../store/useStore'
import type { AtomView } from './Atom3D'
import ConfigText from './ConfigText'
import PropertyGrid from './PropertyGrid'

// three.js is heavy — load it only when a detail view first opens
const Atom3D = lazy(() => import('./Atom3D'))

function StaggeredName({ name }: { name: string }) {
  const reduced = useReducedMotion()
  return (
    <h2
      key={name}
      className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
      aria-label={name}
    >
      {name.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ delay: 0.08 + i * 0.032, type: 'spring', stiffness: 320, damping: 28 }}
            aria-hidden
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </h2>
  )
}

function ViewToggle({
  view,
  setView,
  labels,
  setLabels,
}: {
  view: AtomView
  setView: (v: AtomView) => void
  labels: boolean
  setLabels: (v: boolean) => void
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <div className="flex rounded-xl border border-slate-700/70 bg-slate-950/80 p-1 backdrop-blur">
        {(
          [
            { key: 'bohr', label: 'Bohr orbits', icon: Orbit },
            { key: 'cloud', label: 'Quantum cloud', icon: Waves },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            aria-pressed={view === key}
            className={`relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              view === key ? 'text-slate-950' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {view === key && (
              <motion.span
                layoutId="atom-view-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan-300 to-cyan-400"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>
      {view === 'bohr' && (
        <button
          onClick={() => setLabels(!labels)}
          aria-pressed={labels}
          title="Shell labels"
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl border p-2 text-xs font-medium backdrop-blur transition-colors ${
            labels
              ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-300'
              : 'border-slate-700/70 bg-slate-950/80 text-ink-dim hover:text-ink'
          }`}
        >
          <Tags className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Toggle shell labels</span>
        </button>
      )}
    </div>
  )
}

export default function DetailPanel() {
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const element = selected != null ? byNumber.get(selected) : undefined
  const [view, setView] = useState<AtomView>('bohr')
  const [labels, setLabels] = useState(false)

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

  const cat = element ? CATEGORIES[element.category] : null
  const sub = element ? lastSubshell(element.config) : null

  return (
    <AnimatePresence>
      {element && cat && (
        <motion.div
          key="detail"
          role="dialog"
          aria-modal="true"
          aria-label={`${element.name} details`}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.35, ease: [0.32, 0, 0.24, 1] }}
          className="fixed inset-0 z-50 bg-abyss"
        >
          {/* atmosphere tinted by the element's category */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 transition-colors duration-700"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 25% 40%, ${rgba(cat.color, 0.16)} 0%, transparent 60%)`,
            }}
          />
          {/* giant watermark symbol */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-16 select-none font-display text-[22rem] font-bold leading-none tracking-tighter text-white/[0.035] lg:text-[30rem]"
          >
            {element.symbol}
          </div>

          <div className="relative z-10 grid h-full grid-rows-[42dvh_1fr] lg:grid-cols-2 lg:grid-rows-1">
            {/* ------- left: the atom ------- */}
            <div className="relative">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-ink-dim">
                    <LoaderCircle className="h-7 w-7 animate-spin" aria-label="Loading 3D atom" />
                  </div>
                }
              >
                <Atom3D element={element} view={view} showLabels={labels} />
              </Suspense>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3 sm:p-4">
                <ViewToggle view={view} setView={setView} labels={labels} setLabels={setLabels} />
                <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] text-ink-dim backdrop-blur">
                  {view === 'bohr'
                    ? 'Bohr model (simplified) · amber = valence shell · drag to rotate'
                    : `${sub!.label} orbital cloud — colors mark opposite lobe phases`}
                </span>
              </div>
            </div>

            {/* ------- right: the story ------- */}
            <div className="overflow-y-auto p-5 sm:p-8 lg:py-10">
              <motion.div
                key={element.number}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      color: cat.color,
                      borderColor: rgba(cat.color, 0.5),
                      background: rgba(cat.color, 0.12),
                      boxShadow: `0 0 18px ${rgba(cat.color, 0.25)}`,
                    }}
                  >
                    {cat.label}
                  </span>
                  <span className="font-mono text-sm text-ink-dim">
                    #{element.number} · {element.symbol}
                  </span>
                </div>

                <div className="mt-2">
                  <StaggeredName name={element.name} />
                </div>
                {element.appearance && (
                  <p className="mt-1 text-sm italic text-ink-dim">{element.appearance}</p>
                )}

                <div className="mt-5 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-dim">
                    Electron configuration
                  </p>
                  <p className="mt-1 font-mono text-base">
                    <ConfigText config={element.config} />
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Electrons per shell">
                    <span className="mr-1 text-[10px] uppercase tracking-wider text-ink-dim">Shells</span>
                    {element.shells.map((n, i) => {
                      const valence = i === element.shells.length - 1
                      return (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 400, damping: 24 }}
                          className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
                            valence
                              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                              : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                          }`}
                        >
                          {n}
                        </motion.span>
                      )
                    })}
                    <span className="ml-1 text-[10px] text-ink-dim">amber = valence</span>
                  </div>
                </div>

                <p className="mt-5 max-w-prose text-sm leading-relaxed text-slate-300">
                  {element.summary}
                </p>

                <div className="mt-5">
                  <PropertyGrid element={element} />
                </div>

                {element.discoveredBy && (
                  <p className="mt-4 text-xs text-ink-dim">
                    Discovered by <span className="text-ink">{element.discoveredBy}</span>
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* ------- chrome: close + prev/next ------- */}
          <button
            onClick={() => select(null)}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 cursor-pointer rounded-xl border border-slate-700/70 bg-slate-950/80 p-2.5 text-ink-dim backdrop-blur transition-colors hover:border-rose-400/60 hover:text-rose-300"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5">
            <button
              onClick={() => select(element.number - 1)}
              disabled={element.number <= 1}
              aria-label="Previous element"
              className="cursor-pointer rounded-xl border border-slate-700/70 bg-slate-950/80 p-2.5 text-ink-dim backdrop-blur transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => select(element.number + 1)}
              disabled={element.number >= 118}
              aria-label="Next element"
              className="cursor-pointer rounded-xl border border-slate-700/70 bg-slate-950/80 p-2.5 text-ink-dim backdrop-blur transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="ml-1 hidden font-mono text-[10px] text-slate-600 sm:inline">← → keys work too</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
