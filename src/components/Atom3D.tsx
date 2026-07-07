import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Trail, Html, Instances, Instance } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { CATEGORIES } from '../data/categories'
import { lastSubshell, type Element } from '../data/elements'

export type AtomView = 'bohr' | 'cloud'

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

const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q']

/* ---------------------------------- nucleus ---------------------------------- */

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

const PROTON_COLOR = '#ff554d'
const NEUTRON_COLOR = '#aaaaaa'
const NUCLEON_R = 0.19

/** deterministic PRNG so each nuclide gets the same proton/neutron mix every render */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Nucleus({
  protons,
  neutrons,
  animate,
}: {
  protons: number
  neutrons: number
  animate: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const total = protons + neutrons
  const shown = Math.min(total, 44)
  // cluster radius grows with √count so neighboring balls always overlap slightly —
  // a tight raspberry-like packing instead of a hollow shell
  const clusterR = shown <= 1 ? 0 : Math.max(NUCLEON_R, 0.42 * NUCLEON_R * Math.sqrt(shown))
  const points = useMemo(() => fibonacciSphere(shown, clusterR), [shown, clusterR])

  // shuffle proton/neutron placement so the two kinds interleave organically
  const isProton = useMemo(() => {
    const p = Math.round((protons / (total || 1)) * shown)
    const arr = Array.from({ length: shown }, (_, i) => i < p)
    const rand = mulberry32(protons * 31 + neutrons)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [protons, neutrons, total, shown])

  useFrame((_, dt) => {
    if (!animate || !group.current) return
    group.current.rotation.y += dt * 0.25
    group.current.rotation.x += dt * 0.11
  })

  return (
    <group ref={group}>
      {/* all nucleons share one geometry + material → a single draw call */}
      <Instances limit={44}>
        <sphereGeometry args={[NUCLEON_R, 28, 28]} />
        <meshStandardMaterial roughness={0.4} metalness={0.2} />
        {points.map((p, i) => (
          <Instance key={i} position={p} color={isProton[i] ? PROTON_COLOR : NEUTRON_COLOR} />
        ))}
      </Instances>
    </group>
  )
}

/* ----------------------------------- shells ---------------------------------- */

export function Shell({
  radius,
  electrons,
  index,
  animate,
  valence,
  showLabel,
}: {
  radius: number
  electrons: number
  index: number
  animate: boolean
  valence: boolean
  showLabel: boolean
}) {
  const speed = (0.9 - index * 0.09) * (index % 2 === 0 ? 1 : -1)
  const tilt = useMemo(() => new THREE.Euler(0.5 + index * 0.24, index * 0.55, 0), [index])
  const quat = useMemo(() => new THREE.Quaternion().setFromEuler(tilt), [tilt])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  // electrons live at the scene root (no rotating ancestors) so Trail world-space
  // geometry stays correct; positions are driven per-frame on the tilted circle.
  // wall-clock time (not the canvas clock) keeps multiple canvases in sync.
  useFrame(() => {
    const base = animate ? (performance.now() / 1000) * speed : index * 0.7
    for (let i = 0; i < electrons; i++) {
      const m = refs.current[i]
      if (!m) continue
      const a = base + (i / electrons) * Math.PI * 2
      tmp.set(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyQuaternion(quat)
      m.position.copy(tmp)
    }
  })

  const labelPos = useMemo(
    () => new THREE.Vector3(0, -radius, 0).applyQuaternion(quat),
    [radius, quat],
  )

  const color = valence ? '#fbbf24' : '#22d3ee'
  const bodyColor = valence ? '#fde68a' : '#bae6fd'
  const withTrails = valence && electrons <= 18

  const electronMeshes = Array.from({ length: electrons }, (_, i) => (
    <mesh key={i} ref={(el) => { refs.current[i] = el }}>
      <sphereGeometry args={[valence ? 0.105 : 0.085, 16, 16]} />
      <meshStandardMaterial color={bodyColor} emissive={color} emissiveIntensity={4} toneMapped={false} />
    </mesh>
  ))

  return (
    <>
      <mesh rotation={tilt}>
        <torusGeometry args={[radius, valence ? 0.014 : 0.01, 8, 160]} />
        <meshBasicMaterial
          color={valence ? '#f59e0b' : '#64748b'}
          transparent
          opacity={valence ? 0.5 : 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {withTrails && animate
        ? electronMeshes.map((m, i) => (
            <Trail key={i} width={1.6} length={5} decay={1.4} color={color} attenuation={(w) => w * w}>
              {m}
            </Trail>
          ))
        : electronMeshes}
      {showLabel && (
        <Html position={labelPos} center zIndexRange={[10, 0]}>
          <span className="pointer-events-none whitespace-nowrap rounded-full border border-slate-600/60 bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {SHELL_LETTERS[index] ?? index + 1} · {electrons}e⁻
          </span>
        </Html>
      )}
    </>
  )
}

/* ------------------------------- quantum cloud ------------------------------- */

/** signed angular part of real hydrogen-like orbitals (z-aligned representatives) */
function angular(l: number, cosT: number): number {
  switch (l) {
    case 0: return 1
    case 1: return cosT
    case 2: return (3 * cosT * cosT - 1) / 2
    default: return (5 * cosT ** 3 - 3 * cosT) / 2
  }
}

// phase colors, textbook style: positive lobe warm, negative lobe cool
const LOBE_POS = new THREE.Color('#fb7185')
const LOBE_NEG = new THREE.Color('#22d3ee')

function sampleOrbital(n: number, l: number, count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const rScale = 1.1 + n * 0.85
  const rMax = rScale * 2.9
  // peak of (x^l e^-x) is at x = l → normalize so acceptance keeps lobe contrast
  const radialPeak = l === 0 ? 1 : Math.pow(l, l) * Math.exp(-l)
  const nodes = n - l - 1
  let i = 0
  let guard = 0
  while (i < count && guard < count * 120) {
    guard++
    const r = Math.random() * rMax
    const cosT = Math.random() * 2 - 1
    const phi = Math.random() * Math.PI * 2
    const ang = angular(l, cosT)
    const x = r / (rScale * 0.55)
    const radial = Math.pow(x, l) * Math.exp(-x) / radialPeak
    const ripple = nodes > 0 ? 0.25 + 0.75 * Math.abs(Math.sin((r / rMax) * Math.PI * (nodes + 1))) : 1
    const density = ang * ang * radial * ripple
    if (Math.random() > density) continue
    const sinT = Math.sqrt(1 - cosT * cosT)
    positions[i * 3] = r * sinT * Math.cos(phi)
    positions[i * 3 + 1] = r * cosT
    positions[i * 3 + 2] = r * sinT * Math.sin(phi)
    const c = ang >= 0 ? LOBE_POS : LOBE_NEG
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    i++
  }
  return { positions: positions.subarray(0, i * 3), colors: colors.subarray(0, i * 3) }
}

function OrbitalCloud({ element }: { element: Element }) {
  const sub = useMemo(() => lastSubshell(element.config), [element.config])
  const { positions, colors } = useMemo(() => sampleOrbital(sub.n, sub.l, 16000), [sub.n, sub.l])

  // static — the cloud only moves when the user drags it (OrbitControls)
  return (
    <>
      <points rotation={[0, 0, 0.35]}>
        <bufferGeometry key={`${sub.n}${sub.l}`}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#fecdd3" emissive="#f43f5e" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </>
  )
}

/* --------------------------------- 2D fallback -------------------------------- */

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
              return <circle key={j} cx={c + Math.cos(a) * r} cy={c + Math.sin(a) * r} r={4} fill="#22d3ee" />
            })}
          </g>
        )
      })}
    </svg>
  )
}

/* ----------------------------- responsive framing ----------------------------- */

/**
 * Backs the camera off so a sphere of radius maxR always fits inside the
 * canvas, whatever the aspect ratio — keeps every orbit fully visible and
 * centered on any screen size. Re-runs on resize; preserves the current
 * viewing direction so it cooperates with OrbitControls.
 */
export function FitCameraToAtom({ maxR, margin }: { maxR: number; margin: number }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const halfFov = (cam.fov * Math.PI) / 360
    const dist = maxR / (Math.tan(halfFov) * Math.min(1, aspect) * margin)
    cam.position.setLength(Math.max(dist, maxR * 1.2))
    cam.lookAt(0, 0, 0)
    cam.updateProjectionMatrix()
  }, [camera, size, maxR, margin])

  return null
}

/* ----------------------------------- canvas ----------------------------------- */

interface Props {
  element: Element
  view?: AtomView
  showLabels?: boolean
}

const FULL_SCALE = new THREE.Vector3(1, 1, 1)

function AtomContents({ element, view, showLabels, animate }: { element: Element; view: AtomView; showLabels: boolean; animate: boolean }) {
  const group = useRef<THREE.Group>(null)

  // one-time entrance swoop only — after that the model holds still
  // unless the user drags it (OrbitControls, LMB)
  useFrame((_, dt) => {
    const g = group.current
    if (!g || !animate) return
    if (g.scale.x < 0.999) {
      const k = 1 - Math.pow(0.02, dt)
      g.scale.lerp(FULL_SCALE, k)
    }
  })

  const shells = element.shells
  const neutrons = Math.max(0, Math.round(element.mass) - element.number)

  return (
    <group ref={group} scale={animate ? 0.42 : 1}>
      {view === 'bohr' ? (
        <>
          <Nucleus protons={element.number} neutrons={neutrons} animate={animate} />
          {shells.map((count, i) => (
            <Shell
              key={`${element.number}-${i}`}
              radius={1.5 + (i + 1) * 0.85}
              electrons={count}
              index={i}
              animate={animate}
              valence={i === shells.length - 1}
              showLabel={showLabels}
            />
          ))}
        </>
      ) : (
        <OrbitalCloud element={element} />
      )}
    </group>
  )
}

export default function Atom3D({ element, view = 'bohr', showLabels = false }: Props) {
  const reduced = useReducedMotion()
  if (!hasWebGL()) return <Atom2D element={element} />

  const shellCount = element.shells.length
  const maxR = view === 'bohr' ? 1.5 + shellCount * 0.85 : (1.1 + lastSubshell(element.config).n * 0.85) * 2.4
  const dist = maxR * 1.6
  const animate = !reduced

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, dist * 0.32, dist], fov: 42 }}
      gl={{ antialias: true }}
      aria-label={`3D model of ${element.name}`}
    >
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', dist * 1.4, dist * 3.4]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#8899aa', 0.9]} />
      <directionalLight position={[10, 12, 8]} intensity={2.2} />
      <Stars radius={28} depth={18} count={900} factor={2.4} saturation={0} fade speed={animate ? 0.7 : 0} />
      <AtomContents element={element} view={view} showLabels={showLabels} animate={animate} />
      <OrbitControls
        enablePan={false}
        minDistance={maxR * 0.7}
        maxDistance={maxR * 3.2}
      />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.85} levels={7} />
        <Vignette offset={0.18} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
