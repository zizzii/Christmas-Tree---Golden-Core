import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import React from 'react';

// --- Tree Material (Existing) ---
const TreeMaterial = shaderMaterial(
  {
    uTime: 0,
    uState: 0, 
    uColor: new THREE.Color(3.0, 1.5, 0.5), 
    uPixelRatio: 1,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uState;
    uniform float uPixelRatio;

    attribute vec3 aPositionTree;
    attribute vec3 aPositionSphere;
    attribute float aRandom;

    varying float vRandom;

    float cubicBezier(float t) {
      return t * t * (3.0 - 2.0 * t);
    }

    void main() {
      vRandom = aRandom;

      float t = cubicBezier(uState);
      vec3 pos = mix(aPositionTree, aPositionSphere, t);

      float angle = uTime * 0.1;
      mat2 rotateXZ = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      
      vec3 transformed = pos;
      transformed.xz = rotateXZ * transformed.xz;

      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      gl_PointSize = (45.0 * uPixelRatio) * (1.0 / -mvPosition.z);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform float uTime;
    
    varying float vRandom;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;

      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 2.0); 

      float twinkle = 0.5 + 0.5 * sin(uTime * 6.0 + vRandom * 100.0);
      
      vec3 finalColor = uColor * strength * twinkle;

      gl_FragColor = vec4(finalColor * 2.0, 1.0); 
    }
  `
);

// --- Star Material (New: Cinematic Flare) ---
const StarMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(4.0, 3.5, 2.0), // Very bright gold/white
  },
  // Vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment
  `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - 0.5;
      float d = length(uv);

      // 1. Soft Core Glow
      // Inverse falloff for a hot center
      float core = 0.05 / (d + 0.05);
      core = pow(core, 2.5); // Sharpen the gradient

      // 2. Cross Flares (Horizontal & Vertical)
      // We use 1/x functions masked by the other axis to create thin beams
      float hBeam = 0.01 / (abs(uv.y * 10.0) + 0.05); // Horizontal spread
      hBeam *= smoothstep(0.5, 0.1, abs(uv.x)); // Fade out horizontally

      float vBeam = 0.01 / (abs(uv.x * 20.0) + 0.05); // Vertical (thinner)
      vBeam *= smoothstep(0.5, 0.1, abs(uv.y)); 

      // 3. Diagonal X (Subtle)
      vec2 uv45 = vec2(
        uv.x * 0.707 - uv.y * 0.707, 
        uv.x * 0.707 + uv.y * 0.707
      );
      float dBeam = 0.005 / (abs(uv45.y * 5.0) + 0.1);
      dBeam *= smoothstep(0.4, 0.1, length(uv)); // Limit length

      // Combine
      float total = core + hBeam + vBeam + dBeam;

      // Twinkle / Breathing
      float breathe = 0.9 + 0.1 * sin(uTime * 2.0);
      total *= breathe;

      // Soft circular mask to hide quad edges completely
      float mask = smoothstep(0.5, 0.2, d);
      
      gl_FragColor = vec4(uColor * total * mask, 1.0);
    }
  `
);

// Extend makes them available as JSX elements
extend({ TreeMaterial, StarMaterial });

// Export for usage in TS
export { TreeMaterial, StarMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      treeMaterial: any;
      starMaterial: any;
      mesh: any;
      group: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      planeGeometry: any;
      color: any;
      [key: string]: any;
    }
  }
}