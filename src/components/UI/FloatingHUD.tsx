import React from 'react';
import { Wind, Sliders, Eye } from 'lucide-react';
import { COLORWAY_PRESETS, ColorwayPreset, SCROLL_CHOREOGRAPHY } from '../../data/shoeData';
import { soundFX } from '../../utils/soundEngine';

interface FloatingHUDProps {
  colorway: ColorwayPreset;
  onSelectColorway: (cw: ColorwayPreset) => void;
  activeSection: number;
  windTunnelActive: boolean;
  onToggleWindTunnel: () => void;
  manualExplode: number | null;
  onChangeManualExplode: (val: number | null) => void;
  onScrollToAtelier: () => void;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = React.memo(
  ({
    colorway,
    onSelectColorway,
    activeSection,
    windTunnelActive,
    onToggleWindTunnel,
    manualExplode,
    onChangeManualExplode,
    onScrollToAtelier,
  }) => {
    const stage = SCROLL_CHOREOGRAPHY[activeSection] || SCROLL_CHOREOGRAPHY[0];

    return (
      <div className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Live 3D Asset Telemetry & Wind-Tunnel Streamline Toggle */}
          <div className="hidden lg:flex items-center gap-3 pointer-events-auto glass-panel px-4 py-2 rounded-full">
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                CAM // {stage.name}
              </span>
            </div>
            <button
              onClick={() => {
                soundFX.playHoverTick();
                onToggleWindTunnel();
              }}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full transition-all ${
                windTunnelActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              <Wind
                className="w-3.5 h-3.5"
                style={{ color: windTunnelActive ? colorway.accentHex : undefined }}
              />
              <span>AERO STREAMLINES {windTunnelActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Center: Live 5-Colorway Quick Switcher Dock */}
          <div className="pointer-events-auto glass-panel-strong px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1 pr-1 hidden sm:inline">
              COLORWAY:
            </span>
            {COLORWAY_PRESETS.map((cw) => {
              const selected = cw.id === colorway.id;
              return (
                <button
                  key={cw.id}
                  onClick={() => {
                    soundFX.playColorSwitch();
                    onSelectColorway(cw);
                  }}
                  className={`group relative flex items-center gap-2 px-2.5 py-1 rounded-full transition-all ${
                    selected
                      ? 'bg-white/15 text-white ring-1 ring-white/30'
                      : 'hover:bg-white/5 text-white/55'
                  }`}
                  title={`${cw.name} — ${cw.subtitle}`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: cw.accentHex,
                      boxShadow: selected ? `0 0 12px ${cw.accentHex}` : 'none',
                    }}
                  />
                  <span className="text-[11px] font-mono tracking-wider hidden sm:inline">
                    {cw.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Quick Explode Scrubber & Studio Customizer Shortcut */}
          <div className="hidden md:flex items-center gap-3 pointer-events-auto glass-panel px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-white/55" />
              <span className="text-[10px] font-mono text-white/60 uppercase">EXPLODE</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={manualExplode !== null ? manualExplode : stage.explodeAmount}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onChangeManualExplode(v);
                }}
                className="aether-slider w-20"
              />
              {manualExplode !== null && (
                <button
                  onClick={() => onChangeManualExplode(null)}
                  className="text-[9px] font-mono text-white/45 hover:text-white underline ml-1"
                >
                  AUTO
                </button>
              )}
            </div>

            <button
              onClick={() => {
                soundFX.playHoverTick();
                onScrollToAtelier();
              }}
              className="flex items-center gap-1.5 pl-3 border-l border-white/10 text-[11px] font-mono font-semibold hover:opacity-80 transition-opacity"
              style={{ color: colorway.accentHex }}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CUSTOMIZE</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);
