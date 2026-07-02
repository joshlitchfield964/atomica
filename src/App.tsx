import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import TopBar from './components/TopBar'
import PeriodicTable from './components/PeriodicTable'
import Legend from './components/Legend'
import TrendsBar from './components/TrendsBar'
import TemperatureBar from './components/TemperatureBar'
import QuizPanel from './components/QuizPanel'
import DetailPanel from './components/DetailPanel'
import CompareDrawer from './components/CompareDrawer'

function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-[8%] h-[34rem] w-[34rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0e7490 0%, transparent 65%)' }}
      />
      <div
        className="absolute top-[20%] right-[-6%] h-[30rem] w-[30rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6d28d9 0%, transparent 65%)' }}
      />
      <div
        className="absolute bottom-[-12%] left-[35%] h-[28rem] w-[28rem] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #be185d 0%, transparent 65%)' }}
      />
      {/* faint lab-grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
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

  return (
    <div className="min-h-dvh">
      <Background />
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
            Atom viewer uses the Bohr model — a simplified picture of electron shells, perfect for
            10+2 chemistry but not the full quantum story.
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
    </div>
  )
}
