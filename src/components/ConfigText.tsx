import { Fragment } from 'react'

/** Renders an electron configuration like "[Ne] 3s2 3p4" with proper superscripts. */
export default function ConfigText({ config }: { config: string }) {
  const parts = config.split(/(\d+[spdf]\d+)/g).filter(Boolean)
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^(\d+[spdf])(\d+)$/)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        return (
          <Fragment key={i}>
            {m[1]}
            <sup>{m[2]}</sup>
          </Fragment>
        )
      })}
    </>
  )
}
