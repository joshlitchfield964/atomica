import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from './store/useStore'
import Hero from './components/Hero'
import TopBar from './components/TopBar'
import PeriodicTable from './components/PeriodicTable'
import Legend from './components/Legend'
import TrendsBar from './components/TrendsBar'
import TemperatureBar from './components/TemperatureBar'
import QuizPanel from './components/QuizPanel'
import DetailPanel from './components/DetailPanel'
import CompareDrawer from './components/CompareDrawer'

function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 1.6,
        duration: 2.5 + Math.random() * 4,
        delay: Math.random() * 5,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    [],
  )
  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            ['--d' as string]: `${s.duration}s`,
            ['--delay' as string]: `${s.delay}s`,
          }}
        />
      ))}
    </>
  )
}

function Background() {
  const reduced = useReducedMotion()
  const drift = (x: number[], y: number[], dur: number) =>
    reduced ? {} : { animate: { x, y }, transition: { duration: dur, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const } }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 left-[8%] h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0e7490 0%, transparent 65%)' }}
        {...drift([0, 90, -40], [0, 50, 20], 34)}
      />
      <motion.div
        className="absolute top-[18%] right-[-8%] h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6d28d9 0%, transparent 65%)' }}
        {...drift([0, -110, 30], [0, 70, -30], 41)}
      />
      <motion.div
        className="absolute bottom-[-14%] left-[32%] h-[30rem] w-[30rem] rounded-full opacity-[0.17] blur-3xl"
        style={{ background: 'radial-gradient(circle, #be185d 0%, transparent 65%)' }}
        {...drift([0, 70, -80], [0, -50, 10], 38)}
      />
      <Starfield />
      {/* faint lab-grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
    </div>
  )
}

const barTransition = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' as const },
}

export default function App() {
  const mode = useStore((s) => s.mode)
  const [entered, setEntered] = useState(false)

  return (
    <div className="min-h-dvh">
      <Background />

      <AnimatePresence>{!entered && <Hero onEnter={() => setEntered(true)} />}</AnimatePresence>

      {entered && (
        <>
          <TopBar />
          <main className="mx-auto max-w-[1440px] px-3 pb-28 sm:px-5">
            <AnimatePresence mode="wait">
              {mode === 'trends' && (
                <motion.div key="trends" {...barTransition}>
                  <TrendsBar />
                </motion.div>
              )}
              {mode === 'temperature' && (
                <motion.div key="temperature" {...barTransition}>
                  <TemperatureBar />
                </motion.div>
              )}
              {mode === 'quiz' && (
                <motion.div key="quiz" {...barTransition}>
                  <QuizPanel />
                </motion.div>
              )}
            </AnimatePresence>

            <PeriodicTable />
            <Legend />

            <footer className="mt-10 flex flex-col items-center gap-1 text-center text-xs text-ink-dim">
              <p>
                Bohr orbits and orbital clouds are simplified models — perfect for 10+2
                chemistry, not the full quantum story.
              </p>
              <p>
                Element data:{' '}
                <a
                  className="underline decoration-slate-600 underline-offset-2 hover:text-ink"
                  href="https://github.com/Bowserinator/Periodic-Table-JSON"
                  target="_blank"
                  rel="noreferrer"
                >
                  Periodic-Table-JSON
                </a>{' '}
                (public domain) · Built for high-school &amp; 10+2 students
              </p>
            </footer>
          </main>

          <DetailPanel />
          <CompareDrawer />
        </>
      )}
    </div>
  )
}
