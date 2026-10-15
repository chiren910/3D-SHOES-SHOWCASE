import type Lenis from 'lenis';

export const scrollStore: {
  progress: number;
  velocity: number;
  activeSection: number;
  manualExplode: number | null;
  lenis: Lenis | null;
} = {
  progress: 0,
  velocity: 0,
  activeSection: 0,
  manualExplode: null,
  lenis: null,
};
