import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

interface Props {
  value: number
  format: (v: number) => string
}

/** animates a number from 0 to value on mount / value change */
export default function CountUp({ value, format }: Props) {
  const reduced = useReducedMotion()
  const fmt = useRef(format)
  fmt.current = format
  const [text, setText] = useState(() => (reduced ? format(value) : format(0)))

  useEffect(() => {
    if (reduced) {
      setText(fmt.current(value))
      return
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.3, 1],
      onUpdate: (v) => setText(fmt.current(v)),
    })
    return () => controls.stop()
  }, [value, reduced])

  return <>{text}</>
}
