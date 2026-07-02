import { lazy, Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { byNumber } from '../data/elements'

const HeroAtom = lazy(() => import('./HeroAtom'))

const TITLE = 'ATOMICA'

export default function Hero({ onEnter }: { onEnter: () => void }) {
  const reduced = useReducedMotion()
  const carbon = byNumber.get(6)!

  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-hidden bg-abyss"
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: [0.32, 0, 0.24, 1] }}
    >
      {/* readability scrim sits between the back atom layer and the text;
          HeroAtom's front layer (z-20) floats above the text so the orbits
          visibly wrap around the title */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(5,7,13,0.72) 0%, rgba(5,7,13,0.35) 55%, rgba(5,7,13,0.75) 100%)' }}
        aria-hidden
      />
      <Suspense fallback={null}>
        <HeroAtom element={carbon} />
      </Suspense>

      {/* depth 4: content */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
          className="mb-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium tracking-[0.22em] text-cyan-300 uppercase"
        >
          The periodic table, reimagined
        </motion.p>

        <h1 className="font-display text-[17vw] font-bold leading-none tracking-tight sm:text-8xl lg:text-9xl" aria-label={TITLE}>
          {TITLE.split('').map((ch, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block bg-gradient-to-b from-white via-cyan-50 to-cyan-400 bg-clip-text text-transparent"
                initial={reduced ? false : { y: '110%', rotate: 6 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ delay: 0.35 + i * 0.055, type: 'spring', stiffness: 240, damping: 24 }}
                aria-hidden
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6, ease: 'easeOut' }}
          className="mt-4 max-w-xl text-balance text-sm leading-relaxed text-slate-300 sm:text-base"
        >
          118 elements with living 3D atoms, quantum orbital clouds, periodic trends you can
          feel, and a quiz that makes them stick.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-auto mt-9"
        >
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="group flex cursor-pointer items-center gap-2.5 rounded-2xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-7 py-3.5 font-display text-base font-semibold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.45)] transition-shadow hover:shadow-[0_0_60px_rgba(34,211,238,0.65)]"
          >
            Enter the lab
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </motion.button>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider text-slate-500 uppercase"
        >
          <span>118 elements</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" aria-hidden />
          <span>3D Bohr + orbital clouds</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" aria-hidden />
          <span>Live trends</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" aria-hidden />
          <span>Quiz mode</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
