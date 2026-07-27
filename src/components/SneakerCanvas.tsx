'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import ProceduralShoe from './ProceduralShoe';

interface SneakerCanvasProps {
  color: string;
  size?: number;
  autoRotate?: boolean;
  hover?: boolean;
}

export default function SneakerCanvas({
  color,
  size = 9,
  autoRotate = true,
  hover = true,
}: SneakerCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Premium loading placeholder with matching dark themes
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-royal-blue border-t-transparent"></div>
          <span className="text-sm font-semibold tracking-wider text-slate-400">LOADING 3D VIEW...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-black/60 backdrop-blur-md shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 3.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Modern Studio Lighting */}
        <ambientLight intensity={0.6} />
        
        {/* Main light casting sharp shadows */}
        <directionalLight
          castShadow
          position={[4, 8, 4]}
          intensity={1.5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={20}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
        />
        
        {/* Soft fill lights */}
        <pointLight position={[-4, 4, -4]} intensity={0.4} />
        <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.4} penumbra={1} castShadow />

        <Suspense fallback={null}>
          <ProceduralShoe color={color} size={size} hover={hover} />
          
          {/* Ground shadows for photorealism */}
          <ContactShadows
            position={[0, -0.65, 0]}
            opacity={0.65}
            scale={4}
            blur={1.8}
            far={1.5}
          />
        </Suspense>

        {/* Orbit Controls (constrained to look clean) */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2.2}
          maxDistance={5.0}
          autoRotate={autoRotate}
          autoRotateSpeed={2.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>

      {/* Floating UI Hints */}
      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1 text-xs text-white/50">
        <span className="font-medium tracking-wide">DRAG TO ROTATE 3D</span>
        <span className="font-light">SCROLL TO ZOOM</span>
      </div>
      
      <div className="pointer-events-none absolute top-4 right-4 rounded-md bg-white/5 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-300 backdrop-blur-sm border border-white/10">
        Engineered 3D View
      </div>
    </div>
  );
}
