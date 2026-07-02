import { useCallback, useRef } from 'react'
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
  const spotlightRef = useRef<HTMLDivElement>(null)

  // cursor spotlight — updates a CSS var directly, no react re-render
  const onMouseMove = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const el = spotlightRef.current
    if (!el) return
    const rect = ev.currentTarget.getBoundingClientRect()
    el.style.setProperty('--sx', `${ev.clientX - rect.left}px`)
    el.style.setProperty('--sy', `${ev.clientY - rect.top}px`)
    el.style.opacity = '1'
  }, [])
  const onMouseLeave = useCallback(() => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = '0'
  }, [])

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
        className="relative min-w-[900px]"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ perspective: '1400px' }}
      >
      <div
        ref={spotlightRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(340px circle at var(--sx, 50%) var(--sy, 50%), rgba(34,211,238,0.10), transparent 65%), radial-gradient(120px circle at var(--sx, 50%) var(--sy, 50%), rgba(255,255,255,0.05), transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        onKeyDown={onKeyDown}
        className="grid gap-1 sm:gap-1.5"
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
      </div>
    </section>
  )
}
