import type { ReactNode } from 'react'
import { fmt, kelvinToC, type Element } from '../data/elements'

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/45 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-dim">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">{children}</dd>
    </div>
  )
}

function Temp({ k }: { k: number | null }) {
  if (k == null) return <>—</>
  return (
    <>
      {fmt(k)} K <span className="text-xs text-ink-dim">({fmt(kelvinToC(k))} °C)</span>
    </>
  )
}

export default function PropertyGrid({ element: e }: { element: Element }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="Atomic mass">{fmt(e.mass, 5)} u</Stat>
      <Stat label="Phase (STP)">{e.phase}</Stat>
      <Stat label="Density">
        {e.density == null ? '—' : (
          <>
            {fmt(e.density)} <span className="text-xs text-ink-dim">{e.phase === 'Gas' ? 'g/L' : 'g/cm³'}</span>
          </>
        )}
      </Stat>
      <Stat label="Melting point"><Temp k={e.melt} /></Stat>
      <Stat label="Boiling point"><Temp k={e.boil} /></Stat>
      <Stat label="Electronegativity">{fmt(e.electronegativity)}</Stat>
      <Stat label="1st ionization">
        {e.ionization == null ? '—' : <>{fmt(e.ionization)} <span className="text-xs text-ink-dim">kJ/mol</span></>}
      </Stat>
      <Stat label="Electron affinity">
        {e.electronAffinity == null ? '—' : <>{fmt(e.electronAffinity)} <span className="text-xs text-ink-dim">kJ/mol</span></>}
      </Stat>
      <Stat label="Group · Period · Block">
        {e.group} · {e.period} · {e.block}
      </Stat>
    </dl>
  )
}
