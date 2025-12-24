import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useTreeContext } from '../context/TreeContext';

export const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { transitionTo, handDataRef } = useTreeContext();
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [loadingStep, setLoadingStep] = useState<string>('Initializing...');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentGesture, setCurrentGesture] = useState<string>('NONE');

  // Refs to manage cleanup, loop, and state tracking without re-triggering effects
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastGestureRef = useRef<'OPEN' | 'CLOSED' | 'NONE'>('NONE');

  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;

    const setup = async () => {
      try {
        setLoadingStep('Loading AI Model...');
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (!isMounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        handLandmarkerRef.current = landmarker;

        if (!isMounted) return;

        setLoadingStep('Starting Camera...');
        await startWebcam();

      } catch (error: any) {
        console.error("Setup error:", error);
        if (isMounted) {
          setStatus('ERROR');
          setErrorMessage(error.message || 'Setup Failed');
        }
      }
    };

    const startWebcam = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API Missing');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: { ideal: 60 }
        },
        audio: false
      });

      if (!isMounted || !videoRef.current) {
        // Cleanup if unmounted during await
        if (stream) stream.getTracks().forEach(track => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      
      try {
        await videoRef.current.play();
        if (isMounted) {
          setStatus('READY');
          predictWebcam();
        }
      } catch (e) {
        console.error("Video play error:", e);
        if (isMounted) {
          setStatus('ERROR');
          setErrorMessage('Video Play Blocked');
        }
      }
    };

    const predictWebcam = () => {
      if (!isMounted) return;
      if (!handLandmarkerRef.current || !videoRef.current) return;
      
      let startTimeMs = performance.now();
      
      if (videoRef.current.videoWidth > 0 && !videoRef.current.paused) {
        try {
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
          processResults(results);
        } catch (e) {
          console.warn("Detection error:", e);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    const processResults = (results: any) => {
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // --- 1. Position Tracking ---
        const wrist = landmarks[0];
        const rawX = wrist.x;
        const rawY = wrist.y;
        
        // Z-Depth estimation
        const dx = landmarks[0].x - landmarks[9].x;
        const dy = landmarks[0].y - landmarks[9].y;
        const dz = landmarks[0].z - landmarks[9].z; 
        const palmSize = Math.sqrt(dx*dx + dy*dy + dz*dz); 
        
        const zoomFactor = Math.min(Math.max((palmSize - 0.05) * 4.0, 0), 1);

        handDataRef.current = {
          x: -(rawX - 0.5) * 2, // Invert X for mirror feel
          y: -(rawY - 0.5) * 2,
          z: zoomFactor,
          gesture: handDataRef.current.gesture, 
          isPresent: true
        };

        // --- 2. Gesture Recognition ---
        const tips = [8, 12, 16, 20];
        let totalDist = 0;
        
        tips.forEach(tipIdx => {
            const tip = landmarks[tipIdx];
            const d = Math.sqrt(
              Math.pow(tip.x - wrist.x, 2) + 
              Math.pow(tip.y - wrist.y, 2) + 
              Math.pow(tip.z - wrist.z, 2)
            );
            totalDist += d;
        });
        const avgDist = totalDist / 4;
        const compactness = avgDist / palmSize; 
        
        let newGesture: 'OPEN' | 'CLOSED' | 'NONE' = 'NONE';
        
        if (compactness < 1.4) {
          newGesture = 'CLOSED';
        } else if (compactness > 1.6) {
          newGesture = 'OPEN';
        } else {
          // Hysteresis: stick to current
          newGesture = lastGestureRef.current;
        }

        handDataRef.current.gesture = newGesture;
        
        // Only update state if gesture changed
        if (newGesture !== lastGestureRef.current) {
          lastGestureRef.current = newGesture;
          setCurrentGesture(newGesture);
          
          // Trigger global state change
          if (newGesture === 'CLOSED') transitionTo('FORMED');
          if (newGesture === 'OPEN') transitionTo('CHAOS');
        }

      } else {
        handDataRef.current.isPresent = false;
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, [transitionTo, handDataRef]); 

  // UI States
  const isError = status === 'ERROR';
  const isReady = status === 'READY';
  const isLoading = status === 'LOADING';

  return (
    <div className={`relative transition-opacity duration-700 opacity-100`}>
      {/* Container for the Mirror */}
      <div className="relative group">
        {/* Glow Ring */}
        <div className={`
          absolute -inset-1 rounded-full blur opacity-60 transition-all duration-500
          ${currentGesture === 'CLOSED' ? 'bg-[#FFD700] animate-pulse' : ''}
          ${currentGesture === 'OPEN' ? 'bg-blue-400 animate-pulse' : ''}
          ${(currentGesture === 'NONE' && isReady) ? 'bg-[#FFD700]/30' : ''}
          ${isError ? 'bg-red-500/50' : ''}
        `}></div>

        {/* Video Element - The "Magical Mirror" */}
        <div className={`
          relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 
          shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center bg-black
          ${isError ? 'border-red-500' : 'border-[#FFD700]'}
        `}>
           {/* Original Video Quality: Removed mix-blend-screen and opacity-70 */}
           <video 
             ref={videoRef}
             playsInline
             muted
             className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
           />
           
           {/* Minimal overlay just for tech feel, very subtle */}
           {isReady && <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>}

           {isLoading && (
             <div className="flex flex-col items-center justify-center p-2 text-center absolute inset-0 bg-black z-10">
               <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-2"></div>
               <div className="text-[#FFD700] text-[8px] animate-pulse uppercase tracking-widest leading-tight">
                 {loadingStep}
               </div>
             </div>
           )}

           {isError && (
             <div className="text-red-400 text-[9px] text-center px-2 uppercase tracking-widest font-bold absolute inset-0 flex items-center justify-center bg-black z-10">
               {errorMessage}
             </div>
           )}
        </div>
        
        {/* Status Label */}
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className={`text-[10px] tracking-[0.2em] uppercase font-bold drop-shadow-md ${isError ? 'text-red-500' : 'text-[#FFD700]'}`}>
            {isError ? 'OFFLINE' : ''}
            {isReady && currentGesture === 'CLOSED' && 'IGNITING'}
            {isReady && currentGesture === 'OPEN' && 'DISSOLVING'}
            {isReady && currentGesture === 'NONE' && 'SCANNING'}
            {isLoading && 'BOOTING...'}
          </span>
        </div>
      </div>
    </div>
  );
};