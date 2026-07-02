import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import type { Group } from 'three'
import { CATEGORIES } from '../data/categories'
import type { Element } from '../data/elements'

let webglSupport: boolean | null = null
function hasWebGL(): boolean {
  if (webglSupport == null) {
    try {
      const canvas = document.createElement('canvas')
      webglSupport = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

/** evenly distributed points on a sphere (fibonacci lattice) for the nucleons */
function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    pts.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius])
  }
  return pts
}

function Nucleus({ protons, neutrons, color }: { protons: number; neutrons: number; color: string }) {
  const shown = Math.min(protons + neutrons, 44)
  const points = useMemo(() => fibonacciSphere(shown, shown > 4 ? 0.34 : 0.18), [shown])
  const protonShare = protons / (protons + neutrons || 1)
  return (
    <group>
      <pointLight color={color} intensity={6} distance={5} />
      {points.map((p, i) => {
        const isProton = i / shown < protonShare
        return (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color={isProton ? '#fb7185' : '#94a3b8'}
              emissive={isProton ? '#e11d48' : '#334155'}
              emissiveIntensity={0.55}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Shell({
  radius,
  electrons,
  index,
  animate,
}: {
  radius: number
  electrons: number
  index: number
  animate: boolean
}) {
  const spin = useRef<Group>(null)
  // inner shells orbit faster, alternating direction for visual depth
  const speed = (0.85 - index * 0.09) * (index % 2 === 0 ? 1 : -1)

  useFrame((_, dt) => {
    if (animate && spin.current) spin.current.rotation.z += dt * speed
  })

  const positions = useMemo(
    () =>
      Array.from({ length: electrons }, (_, i) => {
        const a = (i / electrons) * Math.PI * 2
        return [Math.cos(a) * radius, Math.sin(a) * radius, 0] as [number, number, number]
      }),
    [electrons, radius],
  )

  return (
    <group rotation={[0.45 + index * 0.22, index * 0.5, 0]}>
      <mesh>
        <torusGeometry args={[radius, 0.012, 8, 128]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.35} />
      </mesh>
      <group ref={spin}>
        {positions.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#bae6fd" emissive="#22d3ee" emissiveIntensity={2.2} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** 2D SVG fallback when WebGL is unavailable */
function Atom2D({ element }: { element: Element }) {
  const shells = element.shells
  const size = 300
  const c = size / 2
  const step = (c - 30) / shells.length
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" role="img" aria-label={`Electron shell diagram of ${element.name}`}>
      <circle cx={c} cy={c} r={12} fill={CATEGORIES[element.category].color} />
      {shells.map((count, i) => {
        const r = 26 + step * (i + 1)
        return (
          <g key={i}>
            <circle cx={c} cy={c} r={r} fill="none" stroke="#475569" strokeWidth="1" />
            {Array.from({ length: count }, (_, j) => {
              const a = (j / count) * Math.PI * 2
              return (
                <circle key={j} cx={c + Math.cos(a) * r} cy={c + Math.sin(a) * r} r={4} fill="#22d3ee" />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

export default function Atom3D({ element }: { element: Element }) {
  const reduced = useReducedMotion()
  if (!hasWebGL()) return <Atom2D element={element} />

  const shells = element.shells
  const maxR = 1.4 + shells.length * 0.85
  const neutrons = Math.max(0, Math.round(element.mass) - element.number)
  const color = CATEGORIES[element.category].color

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, maxR * 0.55, maxR * 1.55], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      aria-label={`3D Bohr model of ${element.name}: ${shells.join(', ')} electrons per shell`}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[8, 10, 8]} intensity={160} />
      <Stars radius={24} depth={14} count={700} factor={2.2} saturation={0} fade speed={reduced ? 0 : 0.6} />
      <Nucleus protons={element.number} neutrons={neutrons} color={color} />
      {shells.map((count, i) => (
        <Shell key={i} radius={1.4 + (i + 1) * 0.85} electrons={count} index={i} animate={!reduced} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={maxR * 0.8}
        maxDistance={maxR * 3}
        autoRotate={!reduced}
        autoRotateSpeed={0.7}
      />
    </Canvas>
  )
}
