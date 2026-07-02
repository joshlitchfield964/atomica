import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { CATEGORIES } from '../data/categories'
import type { Element } from '../data/elements'
import { Nucleus, Shell, FitCameraToAtom } from './Atom3D'

/**
 * The landing-page atom, rendered in two layers so its orbits wrap AROUND
 * the hero text: a back canvas (full scene, behind the text) and a front
 * canvas (only the camera-facing half of the orbits, clipped at the atom's
 * center plane, composited above the text). Cameras stay in lock-step via a
 * shared mutable sync object; electrons use wall-clock time so both layers
 * agree on every position.
 */

interface CamSync {
  pos: THREE.Vector3
  quat: THREE.Quaternion
}

function CameraBroadcast({ sync }: { sync: CamSync }) {
  useFrame(({ camera }) => {
    sync.pos.copy(camera.position)
    sync.quat.copy(camera.quaternion)
  })
  return null
}

function CameraFollow({ sync }: { sync: CamSync }) {
  useFrame(({ camera }) => {
    camera.position.copy(sync.pos)
    camera.quaternion.copy(sync.quat)
  })
  return null
}

/** clips everything behind the atom's center plane (keeps the camera-side half) */
function FrontHalfClip() {
  const gl = useThree((s) => s.gl)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    gl.clippingPlanes = [plane]
    return () => {
      gl.clippingPlanes = []
    }
  }, [gl, plane])

  useFrame(({ camera }) => {
    plane.normal.copy(camera.position).normalize()
    plane.constant = 0
  })
  return null
}

export default function HeroAtom({ element }: { element: Element }) {
  const reduced = useReducedMotion()
  const animate = !reduced

  const shells = element.shells
  const maxR = 1.5 + shells.length * 0.85
  const dist = maxR * 1.9
  const neutrons = Math.max(0, Math.round(element.mass) - element.number)
  const color = CATEGORIES[element.category].color

  const sync = useMemo<CamSync>(
    () => ({ pos: new THREE.Vector3(0, dist * 0.24, dist), quat: new THREE.Quaternion() }),
    [dist],
  )

  const rings = shells.map((count, i) => (
    <Shell
      key={i}
      radius={1.5 + (i + 1) * 0.85}
      electrons={count}
      index={i}
      animate={animate}
      valence={i === shells.length - 1}
      showLabel={false}
    />
  ))

  const camera = { position: [0, dist * 0.24, dist] as [number, number, number], fov: 42 }

  return (
    <>
      {/* back layer: nucleus, stars and the full orbits, behind the text */}
      <div className="absolute inset-0" aria-hidden>
        <Canvas dpr={[1, 1.6]} camera={camera} gl={{ antialias: true }}>
          <color attach="background" args={['#05070d']} />
          <ambientLight intensity={0.45} />
          <pointLight position={[10, 12, 8]} intensity={220} color="#e0f2fe" />
          <Stars radius={40} depth={20} count={900} factor={2.6} saturation={0} fade speed={animate ? 0.7 : 0} />
          <Nucleus protons={element.number} neutrons={neutrons} color={color} animate={animate} />
          {rings}
          <FitCameraToAtom maxR={maxR} margin={0.88} />
          <OrbitControls enablePan={false} enableZoom={false} minDistance={maxR * 0.7} maxDistance={maxR * 9} />
          <CameraBroadcast sync={sync} />
          <EffectComposer>
            <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.85} levels={7} />
            <Vignette offset={0.18} darkness={0.85} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* front layer: camera-side half of the orbits, floating above the text */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
        <Canvas
          dpr={[1, 1.6]}
          camera={camera}
          gl={{ antialias: true, alpha: true }}
          style={{ pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.45} />
          <pointLight position={[10, 12, 8]} intensity={220} color="#e0f2fe" />
          {rings}
          <CameraFollow sync={sync} />
          <FrontHalfClip />
        </Canvas>
      </div>
    </>
  )
}
