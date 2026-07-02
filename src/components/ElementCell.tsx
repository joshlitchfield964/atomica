import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { CATEGORIES, rgba } from '../data/categories'
import {
  TRENDS,
  trendRange,
  heatColor,
  phaseAt,
  PHASE_COLORS,
  type Element,
} from '../data/elements'
import { useStore, isDimmed } from '../store/useStore'

interface Props {
  element: Element
}

function ElementCell({ element: e }: Props) {
  const reduced = useReducedMotion()
  const mode = useStore((s) => s.mode)
  const selected = useStore((s) => s.selected)
  const query = useStore((s) => s.query)
  const categoryFilter = useStore((s) => s.categoryFilter)
  const trend = useStore((s) => s.trend)
  const temperature = useStore((s) => s.temperature)
  const compareMode = useStore((s) => s.compareMode)
  const compare = useStore((s) => s.compare)
  const quiz = useStore((s) => s.quiz)
  const select = useStore((s) => s.select)
  const toggleCompare = useStore((s) => s.toggleCompare)
  const quizGuess = useStore((s) => s.quizGuess)

  const cat = CATEGORIES[e.category]
  const dimmed =
    mode !== 'quiz' && isDimmed(e.name, e.symbol, e.number, e.category, query, categoryFilter)

  // ----- per-mode visuals -----
  let bg = rgba(cat.color, 0.14)
  let border = rgba(cat.color, 0.35)
  let glow = rgba(cat.color, 0.45)
  let subline: string | null = null
  let sublineColor: string | undefined

  if (mode === 'trends') {
    const v = TRENDS[trend].get(e)
    if (v == null) {
      bg = 'rgba(30, 41, 59, 0.4)'
      border = 'rgba(71, 85, 105, 0.35)'
      glow = 'rgba(71, 85, 105, 0.4)'
      subline = '—'
    } else {
      const { min, max } = trendRange(trend)
      const t = (v - min) / (max - min || 1)
      bg = heatColor(t, 0.8)
      border = heatColor(t, 1)
      glow = heatColor(t, 0.65)
      subline = TRENDS[trend].format(v)
    }
  } else if (mode === 'temperature') {
    const phase = phaseAt(e, temperature)
    const pc = PHASE_COLORS[phase]
    bg = rgba(pc.color, phase === 'unknown' ? 0.12 : 0.32)
    border = rgba(pc.color, phase === 'unknown' ? 0.25 : 0.65)
    glow = rgba(pc.color, 0.5)
    subline = phase === 'unknown' ? '?' : pc.label
    sublineColor = pc.color
  } else if (mode === 'quiz') {
    const isWrong = quiz.wrong.includes(e.number)
    const isTarget = e.number === quiz.target && (quiz.solved || quiz.revealed)
    if (isTarget) {
      const c = quiz.solved ? '#4ade80' : '#fbbf24'
      bg = rgba(c, 0.35)
      border = rgba(c, 0.9)
      glow = rgba(c, 0.7)
    } else if (isWrong) {
      bg = 'rgba(239, 68, 68, 0.3)'
      border = 'rgba(239, 68, 68, 0.7)'
      glow = 'rgba(239, 68, 68, 0.5)'
    } else {
      bg = 'rgba(30, 41, 59, 0.55)'
      border = 'rgba(100, 116, 139, 0.3)'
      glow = 'rgba(148, 163, 184, 0.35)'
    }
  }

  const compareIdx = compare.indexOf(e.number)
  const isSelected = selected === e.number

  const onClick = () => {
    if (mode === 'quiz') quizGuess(e.number)
    else if (mode === 'explore' && compareMode) toggleCompare(e.number)
    else select(e.number)
  }

  const style: CSSProperties & { '--glow': string } = {
    gridColumn: e.x,
    gridRow: e.y > 7 ? e.y + 1 : e.y, // row 8 is the f-block spacer
    background: bg,
    borderColor: border,
    '--glow': glow,
  }

  return (
    <motion.button
      type="button"
      data-number={e.number}
      onClick={onClick}
      aria-label={`${e.name}, atomic number ${e.number}`}
      initial={reduced ? false : { opacity: 0, scale: 0.7 }}
      animate={{ opacity: dimmed ? 0.15 : 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.18 },
        scale: { type: 'spring', stiffness: 320, damping: 26, delay: reduced ? 0 : (e.x + e.y) * 0.014 },
      }}
      whileHover={reduced || dimmed ? undefined : { scale: 1.09, y: -3, zIndex: 5 }}
      whileTap={{ scale: 0.94 }}
      style={style}
      className={`relative flex aspect-[13/15] min-w-0 cursor-pointer flex-col items-stretch justify-between rounded-md border p-1 text-left outline-none transition-shadow hover:shadow-[0_10px_30px_-6px_var(--glow)] focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        isSelected ? 'ring-2 ring-white/80' : ''
      } ${compareIdx >= 0 ? 'ring-2 ring-cyan-300' : ''}`}
    >
      <span className="font-mono text-[9px] leading-none text-white/60">{e.number}</span>
      <span className="font-display text-sm font-bold leading-none text-white sm:text-[15px]">
        {e.symbol}
      </span>
      {mode === 'quiz' ? (
        <span className="h-[10px] text-[8px] leading-[10px] text-white/40">
          {(quiz.solved || quiz.revealed) && e.number === quiz.target ? e.name : '·'}
        </span>
      ) : subline != null ? (
        <span
          className="truncate font-mono text-[8px] leading-[10px] text-white/80"
          style={sublineColor ? { color: sublineColor } : undefined}
        >
          {subline}
        </span>
      ) : (
        <span className="truncate text-[8px] leading-[10px] text-white/60">{e.name}</span>
      )}
      {compareIdx >= 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 font-mono text-[9px] font-bold text-slate-900">
          {compareIdx + 1}
        </span>
      )}
    </motion.button>
  )
}

export default memo(ElementCell)
