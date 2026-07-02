import { memo, useCallback } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
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
import { colFor, rowFor } from './tableLayout'

interface Props {
  element: Element
}

interface CellVisual {
  background: string
  border: string
  glow: string
  symbolGlow: string
  accent: string
  subline: string | null
  sublineColor?: string
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

  // 3D tilt toward the cursor — motion values only, no re-renders
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 260, damping: 20 })
  const sry = useSpring(ry, { stiffness: 260, damping: 20 })
  const onTilt = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      if (reduced) return
      const r = ev.currentTarget.getBoundingClientRect()
      ry.set(((ev.clientX - r.left) / r.width - 0.5) * 22)
      rx.set(-((ev.clientY - r.top) / r.height - 0.5) * 22)
    },
    [reduced, rx, ry],
  )
  const onTiltEnd = useCallback(() => {
    rx.set(0)
    ry.set(0)
  }, [rx, ry])

  const cat = CATEGORIES[e.category]
  const dimmed =
    mode !== 'quiz' && isDimmed(e.name, e.symbol, e.number, e.category, query, categoryFilter)

  /* ---------- per-mode visuals: glassy gem tiles ---------- */

  const gem = (color: string, strength = 1): Pick<CellVisual, 'background' | 'border' | 'glow' | 'symbolGlow'> => ({
    background: `linear-gradient(160deg, ${rgba(color, 0.34 * strength)} 0%, ${rgba(color, 0.12 * strength)} 52%, ${rgba(color, 0.05 * strength)} 100%)`,
    border: rgba(color, 0.5 * strength),
    glow: rgba(color, 0.55),
    symbolGlow: rgba(color, 0.6),
  })

  let v: CellVisual

  if (mode === 'trends') {
    const val = TRENDS[trend].get(e)
    if (val == null) {
      v = {
        ...gem('#64748b', 0.5),
        accent: 'rgba(148,163,184,0.6)',
        subline: '—',
      }
    } else {
      const { min, max } = trendRange(trend)
      const t = (val - min) / (max - min || 1)
      v = {
        background: `linear-gradient(160deg, ${heatColor(t, 0.95)} 0%, ${heatColor(t, 0.5)} 100%)`,
        border: heatColor(Math.min(1, t + 0.12), 1),
        glow: heatColor(t, 0.7),
        symbolGlow: 'rgba(255,255,255,0.35)',
        accent: 'rgba(255,255,255,0.75)',
        subline: TRENDS[trend].format(val),
      }
    }
  } else if (mode === 'temperature') {
    const phase = phaseAt(e, temperature)
    const pc = PHASE_COLORS[phase]
    const strength = phase === 'unknown' ? 0.45 : 1.15
    v = {
      ...gem(pc.color, strength),
      accent: rgba(pc.color, 0.9),
      subline: phase === 'unknown' ? '?' : pc.label,
      sublineColor: phase === 'unknown' ? undefined : pc.color,
    }
  } else if (mode === 'quiz') {
    const isWrong = quiz.wrong.includes(e.number)
    const isTarget = e.number === quiz.target && (quiz.solved || quiz.revealed)
    const color = isTarget ? (quiz.solved ? '#4ade80' : '#fbbf24') : isWrong ? '#ef4444' : '#475569'
    v = {
      ...gem(color, isTarget || isWrong ? 1.4 : 0.55),
      accent: rgba(color, 0.9),
      subline: isTarget ? e.name : null,
    }
  } else {
    v = {
      ...gem(cat.color),
      accent: rgba(cat.color, 0.95),
      subline: e.name,
    }
  }

  const compareIdx = compare.indexOf(e.number)
  const isSelected = selected === e.number
  // shake the most recent wrong quiz guess
  const justWrong =
    mode === 'quiz' && !quiz.solved && quiz.wrong[quiz.wrong.length - 1] === e.number

  const onClick = () => {
    if (mode === 'quiz') quizGuess(e.number)
    else if (mode === 'explore' && compareMode) toggleCompare(e.number)
    else select(e.number)
  }

  const style: CSSProperties & Record<'--glow', string> = {
    gridColumn: colFor(e.x),
    gridRow: rowFor(e.y),
    background: v.background,
    borderColor: v.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 16px ${rgba('#000000', 0.18)}`,
    '--glow': v.glow,
  }

  return (
    <motion.button
      type="button"
      data-number={e.number}
      onClick={onClick}
      aria-label={`${e.name}, atomic number ${e.number}`}
      initial={reduced ? false : { opacity: 0, scale: 0.7 }}
      animate={{
        opacity: dimmed ? 0.13 : 1,
        scale: 1,
        x: justWrong && !reduced ? [0, -7, 7, -5, 5, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.18 },
        scale: { type: 'spring', stiffness: 320, damping: 26, delay: reduced ? 0 : (e.x + e.y) * 0.014 },
        x: { duration: 0.4 },
      }}
      whileHover={reduced || dimmed ? undefined : { scale: 1.14, y: -4, zIndex: 5 }}
      whileTap={{ scale: 0.94 }}
      onMouseMove={onTilt}
      onMouseLeave={onTiltEnd}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 600 }}
      className={`group relative aspect-[13/15] min-w-0 cursor-pointer rounded-lg border outline-none transition-[filter,box-shadow] duration-200 hover:brightness-[1.35] hover:shadow-[0_12px_34px_-6px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.16)] focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        isSelected ? 'ring-2 ring-white/80' : ''
      } ${compareIdx >= 0 ? 'ring-2 ring-cyan-300' : ''}`}
    >
      {/* atomic number — top left, tinted by category */}
      <span
        className="absolute left-1 top-1 font-mono text-[8px] leading-none sm:text-[9px]"
        style={{ color: v.accent }}
      >
        {e.number}
      </span>

      {/* the symbol is the star: centered, glowing */}
      <span
        className="absolute inset-0 flex items-center justify-center pb-2 font-display text-[15px] font-bold text-white sm:text-lg"
        style={{ textShadow: `0 0 14px ${v.symbolGlow}, 0 1px 2px rgba(0,0,0,0.6)` }}
      >
        {e.symbol}
      </span>

      {/* footer line: name / value / phase */}
      <span
        className={`absolute inset-x-0.5 bottom-1 truncate text-center leading-[10px] ${
          mode === 'trends' ? 'font-mono text-[8px]' : 'text-[7.5px] sm:text-[8px]'
        } ${mode === 'quiz' ? 'text-white/85' : 'text-white/65'}`}
        style={v.sublineColor ? { color: v.sublineColor } : undefined}
      >
        {mode === 'quiz' && !v.subline ? '·' : v.subline}
      </span>

      {compareIdx >= 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 font-mono text-[9px] font-bold text-slate-900">
          {compareIdx + 1}
        </span>
      )}
    </motion.button>
  )
}

export default memo(ElementCell)
