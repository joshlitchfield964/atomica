import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fmt, kelvinToC, type Element } from '../data/elements'
import CountUp from './CountUp'

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <motion.div
      variants={item}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/45 px-3 py-2.5"
    >
      <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-dim">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">{children}</dd>
    </motion.div>
  )
}

function Temp({ k }: { k: number | null }) {
  if (k == null) return <>—</>
  return (
    <>
      <CountUp value={k} format={(v) => fmt(Math.round(v * 10) / 10)} /> K{' '}
      <span className="text-xs text-ink-dim">({fmt(kelvinToC(k))} °C)</span>
    </>
  )
}

export default function PropertyGrid({ element: e }: { element: Element }) {
  return (
    <motion.dl
      key={e.number}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.15 } } }}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <Stat label="Atomic mass">
        <CountUp value={e.mass} format={(v) => fmt(v, 5)} /> u
      </Stat>
      <Stat label="Phase (STP)">{e.phase}</Stat>
      <Stat label="Density">
        {e.density == null ? '—' : (
          <>
            <CountUp value={e.density} format={(v) => fmt(v)} />{' '}
            <span className="text-xs text-ink-dim">{e.phase === 'Gas' ? 'g/L' : 'g/cm³'}</span>
          </>
        )}
      </Stat>
      <Stat label="Melting point"><Temp k={e.melt} /></Stat>
      <Stat label="Boiling point"><Temp k={e.boil} /></Stat>
      <Stat label="Electronegativity">
        {e.electronegativity == null ? '—' : <CountUp value={e.electronegativity} format={(v) => v.toFixed(2)} />}
      </Stat>
      <Stat label="1st ionization">
        {e.ionization == null ? '—' : (
          <>
            <CountUp value={e.ionization} format={(v) => fmt(Math.round(v))} />{' '}
            <span className="text-xs text-ink-dim">kJ/mol</span>
          </>
        )}
      </Stat>
      <Stat label="Electron affinity">
        {e.electronAffinity == null ? '—' : (
          <>
            <CountUp value={e.electronAffinity} format={(v) => fmt(Math.round(v * 10) / 10)} />{' '}
            <span className="text-xs text-ink-dim">kJ/mol</span>
          </>
        )}
      </Stat>
      <Stat label="Group · Period · Block">
        {e.group} · {e.period} · {e.block}
      </Stat>
    </motion.dl>
  )
}
