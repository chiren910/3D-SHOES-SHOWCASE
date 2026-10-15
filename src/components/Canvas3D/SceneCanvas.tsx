import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { ColorwayPreset, CustomPartOverrides } from '../../data/shoeData';
import { ShoeModel3D } from './ShoeModel3D';
import { WindTunnelParticles } from './WindTunnelParticles';
import { scrollStore } from '../../utils/scrollStore';

interface SceneCanvasProps {
  colorway: ColorwayPreset;
  customOverrides: CustomPartOverrides;
  manualExplode: number | null;
  xrayMode: boolean;
  windTunnelActive: boolean;
  freeOrbitMode: boolean;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  cadenceMode: 'idle' | 'walk' | 'tempo' | 'sprint';
  studioEnvMode: 'cyber-void' | 'daylight-atelier' | 'neon-tunnel';
}

// Unified Frame Ticker (priority -1): Ticks Lenis AND synchronizes sub-pixel progress BEFORE 3D meshes render
const LenisFrameTicker: React.FC = () => {
  useFrame(() => {
    const lenis = scrollStore.lenis;
    if (lenis) {
      lenis.raf(performance.now());
      if (Number.isFinite(lenis.progress)) {
        scrollStore.progress = lenis.progress;
      }
      scrollStore.velocity = lenis.velocity || 0;
    }
  }, -1);
  return null;
};

// Bake the studio cubemap reflection ONCE (frames={1}) so it never stalls startup or scroll
const StudioReflectionEnv = React.memo(() => (
  <Environment frames={1} resolution={128}>
    <group rotation={[-Math.PI / 4, -0.3, 0]}>
      <Lightformer
        intensity={3.8}
        rotation-x={Math.PI / 2}
        position={[0, 5, -9]}
        scale={[10, 10, 1]}
      />
      <Lightformer
        intensity={2.2}
        rotation-y={Math.PI / 2}
        position={[-5, 1, -1]}
        scale={[12, 2, 1]}
        color="#D4FF00"
      />
      <Lightformer
        intensity={2.0}
        rotation-y={-Math.PI / 2}
        position={[10, 1, 0]}
        scale={[16, 3, 1]}
        color="#00F0FF"
      />
      <Lightformer
        form="ring"
        color="#ffffff"
        intensity={2.5}
        scale={4}
        position={[0, 3, 3]}
      />
    </group>
  </Environment>
));

export const SceneCanvas: React.FC<SceneCanvasProps> = React.memo(
  ({
    colorway,
    customOverrides,
    manualExplode,
    xrayMode,
    windTunnelActive,
    freeOrbitMode,
    selectedPartId,
    onSelectPart,
    cadenceMode,
    studioEnvMode,
  }) => {
    const keyLightIntensity =
      studioEnvMode === 'daylight-atelier' ? 3.2 : studioEnvMode === 'neon-tunnel' ? 1.8 : 2.5;

    return (
      <div
        className={`fixed inset-0 z-10 ${
          freeOrbitMode
            ? 'pointer-events-auto cursor-grab active:cursor-grabbing'
            : 'pointer-events-none'
        }`}
      >
        <Canvas
          dpr={[1, 1.25]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <LenisFrameTicker />
          <PerspectiveCamera makeDefault position={[0, 0.35, 4.4]} fov={36} near={0.1} far={50} />

          {/* Multi-Point Footwear Studio Lighting Rig */}
          <ambientLight intensity={studioEnvMode === 'daylight-atelier' ? 0.95 : 0.55} />
          <directionalLight position={[5, 7, 5]} intensity={keyLightIntensity} />
          <spotLight
            position={[-5, 4, -3]}
            angle={0.5}
            penumbra={0.9}
            intensity={2.6}
            color={colorway.accentHex}
          />
          <pointLight
            position={[0, -2.2, 2.5]}
            intensity={1.4}
            color={colorway.secondaryHex}
          />
          <directionalLight position={[0, 5, -5]} intensity={1.8} color="#ffffff" />

          <StudioReflectionEnv />

          <Suspense fallback={null}>
            <ShoeModel3D
              colorway={colorway}
              customOverrides={customOverrides}
              manualExplode={manualExplode}
              xrayMode={xrayMode}
              freeOrbitMode={freeOrbitMode}
              selectedPartId={selectedPartId}
              onSelectPart={onSelectPart}
              cadenceMode={cadenceMode}
            />

            <WindTunnelParticles
              accentHex={colorway.accentHex}
              secondaryHex={colorway.secondaryHex}
              windTunnelActive={windTunnelActive}
            />
          </Suspense>

          {freeOrbitMode && (
            <OrbitControls
              makeDefault
              enablePan={false}
              enableZoom={true}
              minDistance={2.5}
              maxDistance={6.8}
              dampingFactor={0.07}
              rotateSpeed={0.75}
            />
          )}
        </Canvas>
      </div>
    );
  }
);
