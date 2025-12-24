import React, { useEffect, useState } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { HandTracker } from './HandTracker';

export const UIOverlay: React.FC = () => {
  const { activeState, transitionTo, handDataRef } = useTreeContext();
  const [promptPhase, setPromptPhase] = useState<{ title: string; subtitle: string; step: number }>({
    title: 'SYSTEM INITIALIZING',
    subtitle: 'WAITING FOR CAMERA...',
    step: 0
  });

  // Polling loop to update UI text based on Ref data (which doesn't trigger renders)
  useEffect(() => {
    const interval = setInterval(() => {
      const hand = handDataRef.current;

      if (!hand.isPresent) {
        setPromptPhase({
          title: 'PHASE I: LINK',
          subtitle: 'RAISE YOUR HAND TO CONNECT',
          step: 1
        });
      } else {
        // Hand is present, check specific gestures vs state
        if (activeState === 'FORMED') {
          if (hand.gesture === 'OPEN') {
             // It is dissolving, but state might take a split second to flip
             setPromptPhase({
              title: 'PHASE II: ENTROPY',
              subtitle: 'DISSOLVING STRUCTURE...',
              step: 2
            });
          } else {
            setPromptPhase({
              title: 'PHASE II: ENTROPY',
              subtitle: 'OPEN HAND TO DISSOLVE',
              step: 2
            });
          }
        } else if (activeState === 'CHAOS') {
          if (hand.gesture === 'CLOSED') {
             setPromptPhase({
              title: 'PHASE III: ORDER',
              subtitle: 'REFORMING CORE...',
              step: 3
            });
          } else {
            setPromptPhase({
              title: 'PHASE III: ORDER',
              subtitle: 'CLOSE FIST TO IGNITE',
              step: 3
            });
          }
        }
      }
    }, 200); // Check every 200ms to avoid UI thrashing

    return () => clearInterval(interval);
  }, [activeState, handDataRef]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-8 px-6 md:px-12 select-none">
      
      {/* Header Row: Magic Mirror Right */}
      <header className="flex justify-end items-start w-full z-10">
        {/* The Magical Mirror (Hand Tracker) */}
        <div className="pointer-events-auto">
          <HandTracker />
        </div>
      </header>

      {/* CENTER PROMPTS - The new "Phases" System */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <div className="text-center space-y-4 mix-blend-screen opacity-90">
          
          {/* Phase Indicator Line */}
          <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
             <div className={`h-[1px] w-8 transition-colors duration-500 ${promptPhase.step >= 1 ? 'bg-[#FFD700]' : 'bg-white/20'}`} />
             <div className={`h-[1px] w-8 transition-colors duration-500 ${promptPhase.step >= 2 ? 'bg-[#FFD700]' : 'bg-white/20'}`} />
             <div className={`h-[1px] w-8 transition-colors duration-500 ${promptPhase.step >= 3 ? 'bg-[#FFD700]' : 'bg-white/20'}`} />
          </div>

          {/* Main Title */}
          <h2 className="text-[#FFD700] text-xs md:text-sm tracking-[0.5em] font-bold uppercase drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] animate-pulse">
            {promptPhase.title}
          </h2>

          {/* Subtitle / Instruction */}
          <h1 className="text-white text-2xl md:text-4xl font-light tracking-[0.1em] font-serif drop-shadow-md">
            {promptPhase.subtitle}
          </h1>
          
          {/* Decorative Elements */}
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto mt-6 opacity-60" />
        </div>
      </div>

      {/* Bottom Controls (Manual Override) */}
      <div className="flex flex-col items-center z-10">
        <div className="flex justify-center gap-8 pointer-events-auto pb-4">
          <button
            onClick={() => transitionTo('FORMED')}
            className={`
              px-8 py-3 rounded-none border border-[#FFD700]/30
              text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all duration-700
              ${activeState === 'FORMED' 
                ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.2)]' 
                : 'bg-transparent text-white/40 hover:text-[#FFD700] hover:border-[#FFD700]/60'}
            `}
          >
            Ignite Core
          </button>

          <button
            onClick={() => transitionTo('CHAOS')}
            className={`
              px-8 py-3 rounded-none border border-[#FFD700]/30
              text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all duration-700
              ${activeState === 'CHAOS' 
                ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.2)]' 
                : 'bg-transparent text-white/40 hover:text-[#FFD700] hover:border-[#FFD700]/60'}
            `}
          >
            Dissolve
          </button>
        </div>
        
        {/* Footer Credit */}
        <div className="text-[9px] text-white/30 tracking-[0.3em] uppercase mt-2">
           Sequence Active // {activeState}
        </div>
      </div>
    </div>
  );
};
