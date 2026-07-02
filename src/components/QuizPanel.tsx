import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb, ArrowRight, Trophy, Flame } from 'lucide-react'
import { byNumber, fmt } from '../data/elements'
import { CATEGORIES } from '../data/categories'
import { useStore } from '../store/useStore'
import ConfigText from './ConfigText'

export default function QuizPanel() {
  const quiz = useStore((s) => s.quiz)
  const revealClue = useStore((s) => s.quizRevealClue)
  const next = useStore((s) => s.quizNext)
  const target = byNumber.get(quiz.target)!

  const clues = [
    <>
      A <span className="font-semibold text-ink">{CATEGORIES[target.category].label.toLowerCase()}</span> in{' '}
      <span className="font-semibold text-ink">period {target.period}</span>, {target.block}-block.
    </>,
    <>
      Atomic mass ≈ <span className="font-mono font-semibold text-ink">{fmt(target.mass)} u</span>; it is a{' '}
      <span className="font-semibold text-ink">{target.phase.toLowerCase()}</span> at room temperature.
    </>,
    <>
      Electron configuration:{' '}
      <span className="font-mono font-semibold text-ink">
        <ConfigText config={target.config} />
      </span>
      . Its name starts with “{target.name[0]}”.
    </>,
  ]

  const done = quiz.solved || quiz.revealed

  return (
    <div className="glass mb-4 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold">Guess the element</h2>
          <p className="text-xs text-ink-dim">
            Read the clues, then click the element on the table. Fewer clues = more points.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="flex items-center gap-1.5 text-amber-300" title="Score">
            <Trophy className="h-4 w-4" aria-hidden /> {quiz.score}
          </span>
          <span className="flex items-center gap-1.5 text-orange-400" title="Streak">
            <Flame className="h-4 w-4" aria-hidden /> {quiz.streak}
          </span>
        </div>
      </div>

      <ol className="mt-3 space-y-1.5">
        {clues.slice(0, quiz.cluesShown).map((clue, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-sm text-ink-dim"
          >
            <span className="mt-0.5 font-mono text-[11px] text-cyan-400">#{i + 1}</span>
            <span>{clue}</span>
          </motion.li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!done && quiz.cluesShown < 3 && (
          <button
            onClick={revealClue}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:border-amber-400/60 hover:text-amber-300"
          >
            <Lightbulb className="h-4 w-4" aria-hidden />
            Reveal clue ({quiz.cluesShown}/3)
          </button>
        )}
        {done && (
          <button
            onClick={next}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-400 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.35)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            Next element <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
        <span aria-live="polite" className="text-sm">
          <AnimatePresence mode="wait">
            {quiz.solved && (
              <motion.span
                key="solved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-emerald-400"
              >
                Correct — it’s {target.name}! 🎉
              </motion.span>
            )}
            {quiz.revealed && !quiz.solved && (
              <motion.span
                key="revealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-amber-400"
              >
                It was {target.name} ({target.symbol}) — highlighted on the table.
              </motion.span>
            )}
            {!done && quiz.wrong.length > 0 && (
              <motion.span
                key={`wrong-${quiz.wrong.length}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-rose-400"
              >
                Not quite — {3 - quiz.wrong.length} {quiz.wrong.length === 2 ? 'try' : 'tries'} left.
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    </div>
  )
}
