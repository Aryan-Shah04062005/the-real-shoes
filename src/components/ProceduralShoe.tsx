'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProceduralShoeProps {
  color?: string;
  upperColor?: string;
  soleColor?: string;
  laceColor?: string;
  logoColor?: string;
  size?: number;
  hover?: boolean;
}

export default function ProceduralShoe({
  color = '#0a58ca',
  upperColor,
  soleColor,
  laceColor,
  logoColor,
  size = 9,
  hover = true,
}: ProceduralShoeProps) {
  const groupRef = useRef<THREE.Group>(null);

  const finalUpperColor = upperColor || color;
  const finalSoleColor = soleColor || '#1a202c';
  const finalLaceColor = laceColor || '#ffffff';
  const finalLogoColor = logoColor || '#ffffff';

  const baseScale = 0.8 + (size - 6) * 0.05;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (hover) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
      groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={[baseScale, baseScale, baseScale]} position={[0, 0, 0]}>
      {/* 1. OUTSOLE (Tread) */}
      <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[2.5, 0.12, 1.0]} />
        <meshStandardMaterial color={finalSoleColor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* 2. MIDSOLE (Cushion layer) */}
      <mesh castShadow receiveShadow position={[0, -0.38, 0]}>
        <boxGeometry args={[2.55, 0.15, 1.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* 3. MIDSOLE HEEL DETAIL */}
      <mesh castShadow position={[-0.8, -0.35, 0]}>
        <boxGeometry args={[0.8, 0.18, 1.06]} />
        <meshStandardMaterial color={finalUpperColor} roughness={0.2} metalness={0.7} transparent opacity={0.8} />
      </mesh>

      {/* 4. MAIN UPPER BODY */}
      <mesh castShadow position={[-0.05, 0.02, 0]}>
        <boxGeometry args={[2.2, 0.65, 0.96]} />
        <meshStandardMaterial color={finalUpperColor} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 5. TOE CAP GUARD */}
      <mesh castShadow position={[0.9, -0.15, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.97]} />
        <meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* 6. HEEL COLLAR */}
      <mesh castShadow position={[-0.7, 0.4, 0]}>
        <boxGeometry args={[0.7, 0.6, 0.95]} />
        <meshStandardMaterial color="#2d3748" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* 7. ANKLE COLLAR CUSHION */}
      <mesh castShadow position={[-0.72, 0.72, 0]}>
        <torusGeometry args={[0.26, 0.08, 16, 32]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>

      {/* 8. TONGUE */}
      <mesh castShadow position={[0.1, 0.45, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.8, 0.12, 0.75]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>

      {/* 9. LOGO / BRANDING STRIPES */}
      <mesh castShadow position={[-0.1, 0.05, 0.49]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.8, 0.15, 0.04]} />
        <meshStandardMaterial color={finalLogoColor} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.2, -0.08, 0.49]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.7, 0.12, 0.04]} />
        <meshStandardMaterial color={finalLogoColor} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* BRANDING STRIPES (Other side) */}
      <mesh castShadow position={[-0.1, 0.05, -0.49]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.8, 0.15, 0.04]} />
        <meshStandardMaterial color={finalLogoColor} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.2, -0.08, -0.49]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.7, 0.12, 0.04]} />
        <meshStandardMaterial color={finalLogoColor} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* 10. LACES */}
      {[-0.1, 0.1, 0.3, 0.5].map((xVal, index) => (
        <mesh key={index} castShadow position={[xVal, 0.4, 0]} rotation={[1.57, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
          <meshStandardMaterial color={finalLaceColor} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
