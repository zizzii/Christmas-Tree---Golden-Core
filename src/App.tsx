import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { MagicTree } from './components/MagicTree';
import { UIOverlay } from './components/UIOverlay';
import { TreeProvider } from './context/TreeContext';
import './shaders/treeMaterial';

export default function App() {
  return (
    <TreeProvider>
      <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
        {/* 3D Scene */}
        <Canvas
          camera={{ position: [0, 2, 25], fov: 45 }}
          gl={{ 
            antialias: false, 
            stencil: false, 
            alpha: false,
            powerPreference: "high-performance" 
          }}
          dpr={[1, 2]} // Handle high-dpi screens
        >
          <color attach="background" args={['#050505']} />
          
          <Suspense fallback={null}>
            <MagicTree />
          </Suspense>

          {/* Post Processing for the "Cinematic Glow" */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.1} // Lower threshold to catch more of the soft edges
              mipmapBlur 
              intensity={5.0} // Very High intensity for "Luxury" feel
              levels={9}
              radius={0.9} // Very soft spread
            />
          </EffectComposer>
        </Canvas>

        {/* UI Overlay */}
        <UIOverlay />
      </div>
    </TreeProvider>
  );
}