import React from 'react';
import {
  Box,
  Layers,
  Orbit,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ColorwayPreset } from '../../data/shoeData';
import { soundFX } from '../../utils/soundEngine';

interface NavbarProps {
  colorway: ColorwayPreset;
  activeSection: number;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  freeOrbitMode: boolean;
  onToggleFreeOrbit: () => void;
  isExploded: boolean;
  onToggleExplode: () => void;
  xrayMode: boolean;
  onToggleXray: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onScrollToSection: (id: string) => void;
}

const NAV_ITEMS = [
  { index: 0, id: 'section-hero', code: '01', label: 'OVERVIEW' },
  { index: 1, id: 'section-aero', code: '02', label: 'AERODYNAMICS' },
  { index: 2, id: 'section-anatomy', code: '03', label: 'DECONSTRUCTION' },
  { index: 3, id: 'section-telemetry', code: '04', label: 'TELEMETRY' },
  { index: 4, id: 'section-atelier', code: '05', label: '3D ATELIER' },
  { index: 5, id: 'section-collection', code: '06', label: 'ARCHIVE' },
];

export const Navbar: React.FC<NavbarProps> = React.memo(
  ({
    colorway,
    activeSection,
    progressBarRef,
    freeOrbitMode,
    onToggleFreeOrbit,
    isExploded,
    onToggleExplode,
    xrayMode,
    onToggleXray,
    soundEnabled,
    onToggleSound,
    cartCount,
    onOpenCart,
    onScrollToSection,
  }) => {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        {/* Top Lenis Scroll Progress Bar (Updated directly via DOM ref at 120FPS, zero React re-renders) */}
        <div className="w-full h-[2px] bg-white/5 overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full origin-left will-change-transform"
            style={{
              backgroundColor: colorway.accentHex,
              transform: 'scaleX(0.01)',
            }}
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-4 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <button
            onClick={() => {
              soundFX.playHoverTick();
              onScrollToSection('section-hero');
            }}
            className="pointer-events-auto glass-panel px-4 py-2.5 rounded-full flex items-center gap-3 hover:border-white/25 transition-all group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
              style={{
                backgroundColor: colorway.accentHex,
                boxShadow: `0 0 10px ${colorway.accentHex}`,
              }}
            />
            <span className="font-wide text-xs sm:text-sm tracking-[0.22em] font-bold text-white">
              AETHER
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-white/45 border-l border-white/15 pl-3">
              APEX-01 // GLB-3D
            </span>
          </button>

          {/* Center Section Navigation Links (Lenis Smooth Scroll) */}
          <nav className="hidden xl:flex items-center pointer-events-auto glass-panel px-2 py-1.5 rounded-full">
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.index;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFX.playHoverTick();
                    onScrollToSection(item.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-white/12 text-white font-semibold shadow-inner'
                      : 'text-white/55 hover:text-white'
                  }`}
                >
                  <span
                    style={{ color: active ? colorway.accentHex : undefined }}
                    className={active ? 'font-bold' : 'opacity-50'}
                  >
                    {item.code}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right 3D Quick Action Controls & Bag */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                soundFX.playColorSwitch();
                onToggleFreeOrbit();
              }}
              title="Toggle Interactive 360° Mouse Drag Orbit"
              className={`px-3.5 py-2.5 rounded-full text-xs font-mono tracking-wider flex items-center gap-2 transition-all border ${
                freeOrbitMode
                  ? 'text-[#06070B] font-bold border-transparent shadow-lg'
                  : 'glass-panel text-white/85 hover:border-white/30'
              }`}
              style={
                freeOrbitMode
                  ? {
                      backgroundColor: colorway.accentHex,
                      boxShadow: `0 0 22px ${colorway.accentHex}66`,
                    }
                  : undefined
              }
            >
              <Orbit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {freeOrbitMode ? '360° ACTIVE' : '360° ORBIT'}
              </span>
            </button>

            <button
              onClick={() => {
                soundFX.playExplodeServo(!isExploded);
                onToggleExplode();
              }}
              title="Explode / Assemble 12 Anatomical 3D Parts"
              className={`px-3.5 py-2.5 rounded-full text-xs font-mono tracking-wider flex items-center gap-2 transition-all border ${
                isExploded
                  ? 'bg-white text-[#06070B] font-bold border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'glass-panel text-white/85 hover:border-white/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExploded ? 'ASSEMBLE' : 'EXPLODE 3D'}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playHoverTick();
                onToggleXray();
              }}
              title="Toggle Holographic CAD Wireframe Mode"
              className={`p-2.5 rounded-full text-xs font-mono transition-all border ${
                xrayMode
                  ? 'bg-[#00F0FF] text-[#06070B] font-bold border-[#00F0FF] shadow-[0_0_18px_#00F0FF]'
                  : 'glass-panel text-white/75 hover:text-white'
              }`}
            >
              <Box className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute UI Telemetry Audio' : 'Enable UI Telemetry Audio'}
              className="hidden sm:flex p-2.5 rounded-full glass-panel text-white/70 hover:text-white transition-all"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 opacity-50" />
              )}
            </button>

            <button
              onClick={() => {
                soundFX.playHoverTick();
                onOpenCart();
              }}
              className="glass-panel-strong px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-white/30 transition-all"
            >
              <ShoppingBag className="w-4 h-4" style={{ color: colorway.accentHex }} />
              <span className="text-xs font-mono font-bold">{cartCount}</span>
            </button>
          </div>
        </div>

        {freeOrbitMode && (
          <div className="mt-3 flex justify-center pointer-events-none">
            <div className="pointer-events-auto glass-panel-strong px-5 py-2 rounded-full flex items-center gap-3 border border-white/20 shadow-2xl">
              <Sparkles className="w-3.5 h-3.5" style={{ color: colorway.accentHex }} />
              <span className="text-xs font-mono tracking-wider text-white">
                360° INTERACTIVE VIEWER ACTIVE — DRAG TO ROTATE • SCROLL TO ZOOM • CLICK ANY PART
              </span>
              <button
                onClick={onToggleFreeOrbit}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[10px] font-mono uppercase text-white"
              >
                Exit 360°
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }
);
