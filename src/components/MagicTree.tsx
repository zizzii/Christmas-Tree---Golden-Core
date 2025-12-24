import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { generateTreeData } from '../utils/math';
import '../shaders/treeMaterial'; 
import { useTreeContext } from '../context/TreeContext';

const PARTICLE_COUNT = 10000;

// --- Star/Flare Component ---
const Star = () => {
  const materialRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Pass time to shader for twinkle
    if (materialRef.current) {
      materialRef.current.uTime = t;
    }

    // Gentle Floating Animation for the entire billboard group
    if (groupRef.current) {
      groupRef.current.position.y = 8.0 + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <Billboard ref={groupRef} position={[0, 8.0, 0]}>
      {/* 
        A large plane is needed to accommodate the glow fade-out.
        Additive Blending ensures it glows on top of the tree without occluding it.
      */}
      <mesh>
        <planeGeometry args={[4, 4]} />
        <starMaterial 
          ref={materialRef} 
          transparent 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </mesh>
    </Billboard>
  );
};

// --- Camera Rig ---
// Controls the camera movement based on hand position
const CameraRig = () => {
  const { camera } = useThree();
  const { handDataRef, activeState } = useTreeContext();
  
  // Target vector for lookAt
  const targetLookAt = new THREE.Vector3(0, 0, 0);
  
  useFrame((state, delta) => {
    const { x, y, z, isPresent } = handDataRef.current;

    // Smooth factor for cinema feel
    // Lower damping for 'heavier' feel
    const damp = 2.0 * delta;

    if (isPresent) {
      // Dynamic Sensitivity based on State
      // When in CHAOS (Dissolve), we increase the range significantly 
      // to allow the user to rotate fully around the expanded particle sphere.
      const isChaos = activeState === 'CHAOS';
      
      // Horizontal Range (Sensitivity)
      // Normal: 30 (approx +/- 50 degrees)
      // Chaos: 50 (approx +/- 80 degrees, nearly full side view)
      const rangeX = isChaos ? 50 : 30; 
      
      // Vertical Range
      // Normal: 15
      // Chaos: 25 (Look higher/lower at the debris)
      const rangeY = isChaos ? 25 : 15;

      // Vertical Offset
      // Tree: Look slightly up (+5)
      // Chaos: Look closer to center (+2)
      const offsetY = isChaos ? 2 : 5;

      // 1. Parallax (X/Y)
      // Map Hand X (-1 to 1) to Camera X range
      const targetX = x * rangeX; 
      const targetY = y * rangeY + offsetY; 

      // 2. Zoom (Z)
      // Hand Push (z=1) -> Zoom In (Camera Z = 15)
      // Hand Pull (z=0) -> Zoom Out (Camera Z = 35)
      // In chaos mode, we allow zooming out a bit further to see the whole explosion
      const maxDist = isChaos ? 40 : 35;
      const minDist = 12;
      const targetZ = THREE.MathUtils.lerp(maxDist, minDist, z);

      // Lerp current camera position to target
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, damp);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, damp);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, damp);
    } else {
      // Idle Animation if no hand
      const time = state.clock.elapsedTime * 0.15;
      const idleX = Math.sin(time) * 4;
      const idleZ = 25 + Math.cos(time) * 2;
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, idleX, damp * 0.5);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2, damp * 0.5);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, idleZ, damp * 0.5);
    }

    // Always look at the core
    camera.lookAt(targetLookAt);
  });

  return null;
}

export const MagicTree: React.FC = () => {
  const materialRef = useRef<any>(null);
  const { activeState } = useTreeContext();
  
  // Ref to track active state in animation loop for smoother shader updates
  const activeStateRef = useRef(activeState);

  useEffect(() => {
    activeStateRef.current = activeState;
  }, [activeState]);

  // Generate data once
  const { positionsTree, positionsSphere, randoms } = useMemo(
    () => generateTreeData(PARTICLE_COUNT),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Update Time
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uPixelRatio = Math.min(window.devicePixelRatio, 2);

      // Determine Target State from REF
      let targetStateValue = 0.0;
      if (activeStateRef.current === 'CHAOS') {
        targetStateValue = 1.0;
      } else {
        targetStateValue = 0.0;
      }

      // Smooth "Viscous" Interpolation
      const smoothing = 2.0 * delta;
      
      materialRef.current.uState = THREE.MathUtils.lerp(
        materialRef.current.uState,
        targetStateValue,
        smoothing
      );
    }
  });

  return (
    <group>
      <CameraRig />
      <Star />
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positionsTree.length / 3}
            array={positionsTree}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPositionTree"
            count={positionsTree.length / 3}
            array={positionsTree}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPositionSphere"
            count={positionsSphere.length / 3}
            array={positionsSphere}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            count={randoms.length}
            array={randoms}
            itemSize={1}
          />
        </bufferGeometry>
        <treeMaterial 
          ref={materialRef} 
          transparent 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </points>
    </group>
  );
};