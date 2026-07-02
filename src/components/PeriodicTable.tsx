import { useCallback } from 'react'
import { ELEMENTS, elementAt } from '../data/elements'
import ElementCell from './ElementCell'

function SeriesMarker({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div
      aria-hidden
      style={{ gridColumn: x, gridRow: y }}
      className="flex aspect-[13/15] items-center justify-center rounded-md border border-dashed border-slate-600/50 font-mono text-[9px] text-slate-500"
    >
      {label}
    </div>
  )
}

export default function PeriodicTable() {
  // arrow-key navigation across the physical layout of the table
  const onKeyDown = useCallback((ev: React.KeyboardEvent) => {
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }
    const dir = dirs[ev.key]
    if (!dir) return
    const active = document.activeElement as HTMLElement | null
    const num = active?.dataset?.number
    if (!num) return
    ev.preventDefault()
    const current = ELEMENTS.find((e) => e.number === Number(num))
    if (!current) return
    let { x, y } = current
    for (let step = 0; step < 18; step++) {
      x += dir[0]
      y += dir[1]
      if (x < 1 || x > 18 || y < 1 || y > 10) return
      const target = elementAt(x, y)
      if (target) {
        const el = document.querySelector<HTMLElement>(`[data-number="${target.number}"]`)
        el?.focus()
        return
      }
    }
  }, [])

  return (
    <section aria-label="Periodic table of elements" className="overflow-x-auto pb-2">
      <div
        onKeyDown={onKeyDown}
        className="grid min-w-[900px] gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
      >
        {ELEMENTS.map((e) => (
          <ElementCell key={e.number} element={e} />
        ))}
        {/* markers where the f-block belongs */}
        <SeriesMarker x={3} y={6} label="57–71" />
        <SeriesMarker x={3} y={7} label="89–103" />
        {/* spacer row between the main table and the f-block */}
        <div aria-hidden style={{ gridColumn: '1 / -1', gridRow: 8 }} className="h-2 sm:h-3" />
      </div>
    </section>
  )
}
