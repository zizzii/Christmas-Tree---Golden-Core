import React, { createContext, useContext, useState, useRef, ReactNode, MutableRefObject, useCallback } from 'react';

export type TreeState = 'FORMED' | 'CHAOS' | 'FOCUS';

export interface HandData {
  x: number;      // -1 (Left) to 1 (Right)
  y: number;      // -1 (Top) to 1 (Bottom)
  z: number;      // 0 (Far) to 1 (Close/Zoomed)
  gesture: 'OPEN' | 'CLOSED' | 'NONE';
  isPresent: boolean;
}

interface TreeContextType {
  activeState: TreeState;
  transitionTo: (state: TreeState) => void;
  handDataRef: MutableRefObject<HandData>;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

export const TreeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeState, setActiveState] = useState<TreeState>('FORMED');
  
  // We use a Ref for hand data because it updates 60 times a second.
  // Using useState would cause the entire React tree to re-render 60fps, killing performance.
  const handDataRef = useRef<HandData>({
    x: 0,
    y: 0,
    z: 0,
    gesture: 'NONE',
    isPresent: false
  });

  // Memoize to ensure reference stability
  const transitionTo = useCallback((state: TreeState) => {
    setActiveState(state);
  }, []);

  return (
    <TreeContext.Provider value={{ activeState, transitionTo, handDataRef }}>
      {children}
    </TreeContext.Provider>
  );
};

export const useTreeContext = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return context;
};