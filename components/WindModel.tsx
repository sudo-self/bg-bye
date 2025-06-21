"use client"

import React, { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"

function WindLogo() {
  const { scene } = useGLTF("/wind.glb")
  return <primitive object={scene} scale={0.2} />
}

export function WindModel() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15] }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[0, 3, 5]} intensity={1} />
      <Suspense fallback={null}>
        <WindLogo />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate
        autoRotate
        autoRotateSpeed={2}
      />
    </Canvas>
  )
}

