import { PHASE_COLORS, kelvinToC } from '../data/elements'
import { rgba } from '../data/categories'
import { useStore } from '../store/useStore'

const PRESETS = [
  { label: '0 K', value: 0 },
  { label: 'Room (293 K)', value: 293 },
  { label: 'Water boils (373 K)', value: 373 },
  { label: 'Lava (~1500 K)', value: 1500 },
  { label: 'Sun surface (5778 K)', value: 5778 },
]

export default function TemperatureBar() {
  const temperature = useStore((s) => s.temperature)
  const setTemperature = useStore((s) => s.setTemperature)

  return (
    <div className="glass mb-4 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold">States of matter</h2>
          <p className="text-xs text-ink-dim">
            Drag the slider — every element shows its state at that temperature.
          </p>
        </div>
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-2xl font-semibold text-cyan-300 tabular-nums">
            {temperature.toLocaleString('en-US')} K
          </span>
          <span className="text-sm text-ink-dim tabular-nums">
            {kelvinToC(temperature).toLocaleString('en-US')} °C
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={6000}
        step={1}
        value={temperature}
        onChange={(e) => setTemperature(Number(e.target.value))}
        aria-label="Temperature in kelvin"
        aria-valuetext={`${temperature} kelvin`}
        className="temp-slider mt-4 w-full cursor-pointer"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setTemperature(p.value)}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                temperature === p.value
                  ? 'border-cyan-400/80 bg-cyan-400/15 text-cyan-300'
                  : 'border-slate-700/60 text-ink-dim hover:border-slate-500 hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2" aria-label="Phase colors">
          {(Object.keys(PHASE_COLORS) as (keyof typeof PHASE_COLORS)[]).map((k) => (
            <span
              key={k}
              className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
              style={{
                borderColor: rgba(PHASE_COLORS[k].color, 0.5),
                background: rgba(PHASE_COLORS[k].color, 0.12),
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLORS[k].color }} aria-hidden />
              {PHASE_COLORS[k].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
