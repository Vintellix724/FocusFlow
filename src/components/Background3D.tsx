import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function PremiumBlob({ position, color, scale, speed, distort }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2} position={position}>
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshDistortMaterial 
          color={color} 
          envMapIntensity={1.5} 
          metalness={0.8} 
          roughness={0.2} 
          distort={distort} 
          speed={speed} 
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none opacity-40 dark:opacity-30 transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />
        <Environment preset="city" />
        
        {/* Premium Abstract Blobs */}
        <PremiumBlob position={[-2.5, 1.5, -1]} color="#8b5cf6" scale={1.8} speed={1.5} distort={0.4} />
        <PremiumBlob position={[2.5, -1.5, -2]} color="#ec4899" scale={1.5} speed={1.2} distort={0.5} />
        <PremiumBlob position={[0, 0, -4]} color="#3b82f6" scale={2.5} speed={1} distort={0.3} />
      </Canvas>
    </div>
  );
}
