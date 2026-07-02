import { create } from 'zustand'
import type { CategoryKey } from '../data/categories'
import type { TrendKey } from '../data/elements'
import { ELEMENTS } from '../data/elements'

export type Mode = 'explore' | 'trends' | 'temperature' | 'quiz'

export interface QuizState {
  target: number
  cluesShown: number
  score: number
  streak: number
  wrong: number[]
  solved: boolean
  revealed: boolean
  rounds: number
}

interface Store {
  mode: Mode
  setMode: (m: Mode) => void

  selected: number | null
  select: (n: number | null) => void

  query: string
  setQuery: (q: string) => void

  categoryFilter: CategoryKey | null
  toggleCategoryFilter: (c: CategoryKey) => void

  trend: TrendKey
  setTrend: (t: TrendKey) => void

  temperature: number
  setTemperature: (t: number) => void

  compareMode: boolean
  setCompareMode: (v: boolean) => void
  compare: number[]
  toggleCompare: (n: number) => void
  clearCompare: () => void

  quiz: QuizState
  quizGuess: (n: number) => void
  quizRevealClue: () => void
  quizNext: () => void
}

function randomTarget(exclude?: number): number {
  let n = exclude
  while (n === exclude) n = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].number
  return n!
}

const CLUE_POINTS = [30, 20, 10]

export const useStore = create<Store>((set, get) => ({
  mode: 'explore',
  setMode: (mode) =>
    set((s) => ({
      mode,
      selected: null,
      compareMode: mode === 'explore' ? s.compareMode : false,
      quiz:
        mode === 'quiz' && s.quiz.rounds === 0
          ? { ...s.quiz, target: randomTarget() }
          : s.quiz,
    })),

  selected: null,
  select: (selected) => set({ selected }),

  query: '',
  setQuery: (query) => set({ query }),

  categoryFilter: null,
  toggleCategoryFilter: (c) =>
    set((s) => ({ categoryFilter: s.categoryFilter === c ? null : c })),

  trend: 'electronegativity',
  setTrend: (trend) => set({ trend }),

  temperature: 293,
  setTemperature: (temperature) => set({ temperature }),

  compareMode: false,
  setCompareMode: (compareMode) =>
    set((s) => ({ compareMode, compare: compareMode ? s.compare : [] })),
  compare: [],
  toggleCompare: (n) =>
    set((s) => {
      if (s.compare.includes(n)) return { compare: s.compare.filter((x) => x !== n) }
      if (s.compare.length >= 2) return { compare: [s.compare[1], n] }
      return { compare: [...s.compare, n] }
    }),
  clearCompare: () => set({ compare: [] }),

  quiz: {
    target: 1,
    cluesShown: 1,
    score: 0,
    streak: 0,
    wrong: [],
    solved: false,
    revealed: false,
    rounds: 0,
  },
  quizGuess: (n) => {
    const { quiz } = get()
    if (quiz.solved || quiz.revealed) return
    if (n === quiz.target) {
      set({
        quiz: {
          ...quiz,
          solved: true,
          score: quiz.score + CLUE_POINTS[quiz.cluesShown - 1],
          streak: quiz.streak + 1,
        },
      })
    } else {
      const wrong = [...quiz.wrong, n]
      set({
        quiz: {
          ...quiz,
          wrong,
          revealed: wrong.length >= 3,
          streak: wrong.length >= 3 ? 0 : quiz.streak,
        },
      })
    }
  },
  quizRevealClue: () =>
    set((s) => ({
      quiz: { ...s.quiz, cluesShown: Math.min(3, s.quiz.cluesShown + 1) },
    })),
  quizNext: () =>
    set((s) => ({
      quiz: {
        ...s.quiz,
        target: randomTarget(s.quiz.target),
        cluesShown: 1,
        wrong: [],
        solved: false,
        revealed: false,
        rounds: s.quiz.rounds + 1,
      },
    })),
}))

/** true when the element should be dimmed by search/filter (explore + trends modes) */
export function isDimmed(
  name: string,
  symbol: string,
  number: number,
  category: CategoryKey,
  query: string,
  categoryFilter: CategoryKey | null,
): boolean {
  if (categoryFilter && category !== categoryFilter) return true
  const q = query.trim().toLowerCase()
  if (!q) return false
  return !(
    name.toLowerCase().includes(q) ||
    symbol.toLowerCase() === q ||
    symbol.toLowerCase().startsWith(q) ||
    number.toString() === q
  )
}

export function firstMatch(query: string): number | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const exact = ELEMENTS.find(
    (e) => e.symbol.toLowerCase() === q || e.name.toLowerCase() === q || e.number.toString() === q,
  )
  if (exact) return exact.number
  const partial = ELEMENTS.find(
    (e) => e.name.toLowerCase().startsWith(q) || e.symbol.toLowerCase().startsWith(q),
  )
  return partial ? partial.number : null
}
