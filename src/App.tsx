import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import {
  Activity,
  ArrowUpRight,
  Box,
  Check,
  Compass,
  Cpu,
  Download,
  Eye,
  Flame,
  Gauge,
  Layers,
  Orbit,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import {
  COLLECTION_MODELS,
  COLORWAY_PRESETS,
  ColorwayPreset,
  CustomPartOverrides,
  SHOE_PARTS_SPECS,
} from './data/shoeData';
import { SceneCanvas } from './components/Canvas3D/SceneCanvas';
import { Navbar } from './components/UI/Navbar';
import { FloatingHUD } from './components/UI/FloatingHUD';
import { CartDrawer, CartItem } from './components/UI/CartDrawer';
import { soundFX } from './utils/soundEngine';
import { scrollStore } from './utils/scrollStore';

const US_SIZES = ['7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0', '10.5', '11.0', '11.5', '12.0', '13.0'];

const CUSTOM_SWATCHES = [
  { name: 'Obsidian', hex: '#11131A' },
  { name: 'Glacier', hex: '#E4EAF2' },
  { name: 'Cyber Volt', hex: '#D4FF00' },
  { name: 'Hyper Crimson', hex: '#FF2A54' },
  { name: 'Cryo Cyan', hex: '#00F0FF' },
  { name: 'Molten Orange', hex: '#FF6B00' },
  { name: '24K Gold', hex: '#F3C65F' },
  { name: 'Cobalt Aero', hex: '#3B82F6' },
];

export function App() {
  const [colorway, setColorway] = useState<ColorwayPreset>(COLORWAY_PRESETS[0]);
  const [customOverrides, setCustomOverrides] = useState<CustomPartOverrides>({});
  const [activeSection, setActiveSection] = useState(0);

  // Interactive 3D Modes
  const [manualExplode, setManualExplode] = useState<number | null>(null);
  const [xrayMode, setXrayMode] = useState(false);
  const [windTunnelActive, setWindTunnelActive] = useState(false);
  const [freeOrbitMode, setFreeOrbitMode] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>('Carbon_Torsion_Plate');
  const [cadenceMode, setCadenceMode] = useState<'idle' | 'walk' | 'tempo' | 'sprint'>('idle');
  const [studioEnvMode, setStudioEnvMode] = useState<'cyber-void' | 'daylight-atelier' | 'neon-tunnel'>('cyber-void');

  // Bespoke Atelier E-Commerce State
  const [selectedSize, setSelectedSize] = useState('10.0');
  const [engravingText, setEngravingText] = useState('APEX // 01');
  const [activeCustomTab, setActiveCustomTab] = useState<'upper' | 'cage' | 'sole' | 'accents' | 'env'>('upper');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      uid: 'initial-flagship',
      name: 'AETHER APEX-01',
      colorwayName: 'VOLT PROTO',
      accentHex: '#D4FF00',
      sizeUS: '10.0',
      price: 340,
      quantity: 1,
      engravingText: 'APEX // 01',
      customSummary: 'Tri-Axial Carbon Plate • AeroWeave™ Shell',
    },
  ]);

  const lenisRef = useRef<Lenis | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const effectiveAccent = customOverrides.accentColor || colorway.accentHex;
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', effectiveAccent);
  }, [effectiveAccent]);

  // Initialize Lenis with autoRaf: false — Ticked deterministically by R3F LenisFrameTicker (priority -1)
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    scrollStore.lenis = lenis;

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      const prog = Number.isFinite(e.progress) ? e.progress : 0;
      scrollStore.progress = prog;
      scrollStore.velocity = e.velocity || 0;

      // Update top navbar progress bar directly on DOM node (0ms React overhead)
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${Math.max(0.01, prog)})`;
      }

      // Only update React state when crossing a section boundary (5 transitions total)
      const secIdx = Math.min(5, Math.max(0, Math.round(prog * 5)));
      if (scrollStore.activeSection !== secIdx) {
        scrollStore.activeSection = secIdx;
        setActiveSection(secIdx);
      }
    });

    return () => {
      scrollStore.lenis = null;
      lenis.destroy();
    };
  }, []);

  const handleScrollToSection = useCallback((sectionId: string) => {
    setFreeOrbitMode(false);
    const el = document.getElementById(sectionId);
    if (el && lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: 0, duration: 1.2 });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleScrollToAtelier = useCallback(() => {
    handleScrollToSection('section-atelier');
  }, [handleScrollToSection]);

  const handleOpenCart = useCallback(() => {
    setCartOpen(true);
  }, []);

  const handleCloseCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  const handleSelectColorway = useCallback((cw: ColorwayPreset) => {
    setColorway(cw);
    setCustomOverrides({});
  }, []);

  const handleChangeManualExplode = useCallback((val: number | null) => {
    scrollStore.manualExplode = val;
    setManualExplode(val);
  }, []);

  const isCurrentlyExploded =
    manualExplode !== null ? manualExplode > 0.4 : activeSection === 2;

  const handleToggleExplode = useCallback(() => {
    setManualExplode((prev) => {
      const currentlyExp = prev !== null ? prev > 0.4 : scrollStore.activeSection === 2;
      const next = currentlyExp ? 0 : 1;
      scrollStore.manualExplode = next;
      return next;
    });
  }, []);

  const handleToggleFreeOrbit = useCallback(() => {
    setFreeOrbitMode((v) => !v);
  }, []);

  const handleToggleXray = useCallback(() => {
    setXrayMode((v) => !v);
  }, []);

  const handleToggleWindTunnel = useCallback(() => {
    setWindTunnelActive((v) => !v);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      if (next) soundFX.playHoverTick();
      return next;
    });
  }, []);

  const handleAddBespokeToBag = (
    customName?: string,
    customPrice?: number,
    presetCw?: ColorwayPreset
  ) => {
    soundFX.playColorSwitch();
    const targetCw = presetCw || colorway;
    const hasCustomizations = Object.keys(customOverrides).length > 0;
    const summaryParts: string[] = [];
    if (customOverrides.upperFinish) summaryParts.push(`Upper: ${customOverrides.upperFinish}`);
    if (customOverrides.cageFinish) summaryParts.push(`Cage: ${customOverrides.cageFinish}`);
    if (hasCustomizations && summaryParts.length === 0) summaryParts.push('Bespoke Atelier Spec');

    const newItem: CartItem = {
      uid: `${targetCw.id}-${selectedSize}-${Date.now()}`,
      name: customName || 'AETHER APEX-01 BESPOKE',
      colorwayName: hasCustomizations ? `${targetCw.name} (CUSTOM)` : targetCw.name,
      accentHex: customOverrides.accentColor || targetCw.accentHex,
      sizeUS: selectedSize,
      price: customPrice || (hasCustomizations ? targetCw.price + 45 : targetCw.price),
      quantity: 1,
      engravingText: engravingText.trim() || undefined,
      customSummary:
        summaryParts.length > 0
          ? summaryParts.join(' • ')
          : 'Tri-Axial Carbon Plate • 12-Part GLB Spec',
    };

    setCartItems((prev) => [newItem, ...prev]);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2600);
  };

  const selectedPartSpec =
    SHOE_PARTS_SPECS.find((p) => p.id === selectedPartId) || SHOE_PARTS_SPECS[3];

  const totalShoeWeight = SHOE_PARTS_SPECS.reduce((acc, s) => acc + s.weightGrams, 0);

  return (
    <div
      className={`relative min-h-screen selection:bg-[#D4FF00] selection:text-[#06070B] ${
        studioEnvMode === 'daylight-atelier'
          ? 'bg-[#12151E]'
          : studioEnvMode === 'neon-tunnel'
          ? 'bg-[#04060D]'
          : 'bg-[#06070B]'
      }`}
    >
      {/* Zero-Cost Radial Gradient Studio Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-tech-grid"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 48%, ${effectiveAccent}1F 0%, transparent 55%), radial-gradient(circle at 82% 85%, ${colorway.secondaryHex}14 0%, transparent 45%)`,
        }}
      />

      {/* Fixed Full-Viewport 3D WebGL Canvas (Zero React Re-Renders on Scroll) */}
      <SceneCanvas
        colorway={colorway}
        customOverrides={customOverrides}
        manualExplode={manualExplode}
        xrayMode={xrayMode}
        windTunnelActive={windTunnelActive}
        freeOrbitMode={freeOrbitMode}
        selectedPartId={selectedPartId}
        onSelectPart={setSelectedPartId}
        cadenceMode={cadenceMode}
        studioEnvMode={studioEnvMode}
      />

      {/* Top Navigation & 3D Mode Bar (Memoized with stable callback props) */}
      <Navbar
        colorway={colorway}
        activeSection={activeSection}
        progressBarRef={progressBarRef}
        freeOrbitMode={freeOrbitMode}
        onToggleFreeOrbit={handleToggleFreeOrbit}
        isExploded={isCurrentlyExploded}
        onToggleExplode={handleToggleExplode}
        xrayMode={xrayMode}
        onToggleXray={handleToggleXray}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={handleOpenCart}
        onScrollToSection={handleScrollToSection}
      />

      {/* Bottom Persistent 3D Colorway & Telemetry Dock (Memoized with stable callback props) */}
      <FloatingHUD
        colorway={colorway}
        onSelectColorway={handleSelectColorway}
        activeSection={activeSection}
        windTunnelActive={windTunnelActive}
        onToggleWindTunnel={handleToggleWindTunnel}
        manualExplode={manualExplode}
        onChangeManualExplode={handleChangeManualExplode}
        onScrollToAtelier={handleScrollToAtelier}
      />

      {/* Toast Notification on Add to Bag */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 glass-panel-strong px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#06070B]"
            style={{ backgroundColor: effectiveAccent }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-white">ADDED TO ATELIER BAG</p>
            <p className="text-[11px] text-white/60">
              {colorway.name} • US {selectedSize}
            </p>
          </div>
          <button
            onClick={handleOpenCart}
            className="ml-2 text-xs font-mono underline"
            style={{ color: effectiveAccent }}
          >
            VIEW BAG
          </button>
        </div>
      )}

      {/* Shopping Bag Slide-Over Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={handleCloseCart}
        items={cartItems}
        onUpdateQty={(uid, delta) => {
          setCartItems((prev) =>
            prev
              .map((item) =>
                item.uid === uid ? { ...item, quantity: item.quantity + delta } : item
              )
              .filter((item) => item.quantity > 0)
          );
        }}
        onRemove={(uid) => setCartItems((prev) => prev.filter((item) => item.uid !== uid))}
        onClearCart={() => setCartItems([])}
        accentHex={effectiveAccent}
      />

      {/* =====================================================================
          SCROLLABLE EDITORIAL & INTERACTIVE ENGINEERING SECTIONS (LENIS)
      ===================================================================== */}
      <main
        className={`relative z-20 transition-opacity duration-300 ${
          freeOrbitMode ? 'opacity-20 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* -------------------------------------------------------------------
            SECTION 01: HERO — THE ARCHITECTURE OF ZERO GRAVITY
        ------------------------------------------------------------------- */}
        <section
          id="section-hero"
          className="relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 pt-28 pb-24 flex flex-col justify-between pointer-events-none"
        >
          <div className="mt-2 sm:mt-6 select-none">
            <div className="flex flex-wrap items-center gap-3 mb-4 pointer-events-auto">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#06070B]"
                style={{ backgroundColor: effectiveAccent }}
              >
                {colorway.badgeText}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest glass-panel text-white/75">
                3D ASSET // 12-PART SCULPTED GLB (120FPS OPTIMIZED)
              </span>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest glass-panel text-white/60">
                LENIS SMOOTH KINETIC ENGINE
              </span>
            </div>

            <h1 className="font-display font-extrabold tracking-tight leading-[0.88] text-5xl sm:text-7xl lg:text-[96px] xl:text-[116px] uppercase text-white">
              AETHER{' '}
              <span
                className="text-stroke-accent"
                style={{ WebkitTextStrokeColor: effectiveAccent }}
              >
                APEX—01
              </span>
            </h1>
            <p className="font-wide text-xs sm:text-sm tracking-[0.32em] text-white/50 uppercase mt-3">
              {colorway.subtitle} — {colorway.tagline}
            </p>
          </div>

          <div className="my-auto py-24 sm:py-32 flex items-center justify-between">
            <div className="hidden lg:flex flex-col gap-3 pointer-events-auto glass-panel p-4 rounded-2xl max-w-[230px]">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                <span>CAD TELEMETRY</span>
                <Cpu className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              </div>
              <div className="space-y-2 border-t border-white/10 pt-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-white/50">TOTAL MASS:</span>
                  <span className="text-white font-bold">{totalShoeWeight}g (US 9)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">PROPULSION:</span>
                  <span style={{ color: effectiveAccent }} className="font-bold">
                    94.8% RETURN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">AERO DRAG:</span>
                  <span className="text-white font-bold">0.14 Cd</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-2.5 pointer-events-auto glass-panel p-4 rounded-2xl max-w-[240px]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                INTERACTIVE 3D CONTROLS
              </span>
              <button
                onClick={() => {
                  soundFX.playExplodeServo(!isCurrentlyExploded);
                  handleToggleExplode();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <span>12-Part Exploded View</span>
                <Layers className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              </button>
              <button
                onClick={() => {
                  soundFX.playColorSwitch();
                  setFreeOrbitMode(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <span>Grab & Spin 360°</span>
                <Orbit className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              </button>
              <button
                onClick={() => {
                  soundFX.playHoverTick();
                  setXrayMode((v) => !v);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <span>{xrayMode ? 'Disable X-Ray Scan' : 'X-Ray CAD Wireframe'}</span>
                <Box className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pointer-events-auto pb-8">
            <div className="lg:col-span-5 glass-panel p-6 rounded-3xl">
              <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-5">
                Sculpted from 12 precision-engineered 3D components—combining a{' '}
                <strong className="text-white">Torayca® T1100G tri-axial carbon plate</strong>,
                pressurized <strong className="text-white">28-PSI NitroPods™</strong>, and a
                seamless <strong className="text-white">AeroWeave™ monofilament shell</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleAddBespokeToBag()}
                  className="px-6 py-3.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider text-[#06070B] flex items-center gap-2 transition-transform hover:scale-105 shadow-xl"
                  style={{
                    backgroundColor: effectiveAccent,
                    boxShadow: `0 0 28px ${effectiveAccent}55`,
                  }}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ACQUIRE — ${colorway.price}</span>
                </button>

                <button
                  onClick={() => handleScrollToSection('section-anatomy')}
                  className="px-5 py-3.5 rounded-full font-mono text-xs uppercase tracking-wider glass-panel hover:border-white/35 text-white flex items-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4" style={{ color: effectiveAccent }} />
                  <span>DECONSTRUCT 3D</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'CARBON RETURN', value: '94.8%', sub: 'Torayca® T1100G Plate' },
                { label: 'FEATHERWEIGHT', value: '184g', sub: 'Supercritical N2 Foam' },
                { label: 'NITRO PRESSURE', value: '28.5 PSI', sub: 'Quad Chamber Pods' },
                { label: '3D MESH PARTS', value: '12 NODES', sub: 'Real-Time Explodable' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass-panel p-4 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-white/25 transition-colors"
                >
                  <span className="text-[10px] font-mono text-white/45 tracking-widest uppercase">
                    {stat.label}
                  </span>
                  <span
                    className="font-display text-2xl sm:text-3xl font-extrabold my-1"
                    style={{ color: i === 0 ? effectiveAccent : '#FFFFFF' }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-white/55">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 02: AERODYNAMICS & WIND-TUNNEL PROPULSION
        ------------------------------------------------------------------- */}
        <section
          id="section-aero"
          className="cv-section relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-28 flex items-center pointer-events-none"
        >
          <div className="w-full lg:w-6/12 space-y-6 pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel">
              <Wind className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                02 // WIND-TUNNEL LAMINAR ARCHITECTURE
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-[0.95]">
              SCULPTED BY{' '}
              <span style={{ color: effectiveAccent }}>MACH-FLOW</span> TELEMETRY.
            </h2>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              Every millimeter of the <strong className="text-white">AETHER APEX-01</strong> last was
              iteratively shaped inside our sub-sonic wind tunnel. The cantilevered rear heel
              spoiler detaches turbulent wake vortices, while side-wall speed channels accelerate
              cooling airflow straight through the plantar lattice.
            </p>

            <div className="glass-panel-strong p-6 rounded-3xl border border-white/15 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                    LIVE 3D WIND TUNNEL STREAMLINES
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Laminar Vortex Flow Visualization
                  </h3>
                </div>
                <button
                  onClick={() => {
                    soundFX.playColorSwitch();
                    setWindTunnelActive((v) => !v);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                    windTunnelActive
                      ? 'text-[#06070B]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  style={windTunnelActive ? { backgroundColor: effectiveAccent } : undefined}
                >
                  <Wind className="w-4 h-4" />
                  <span>{windTunnelActive ? 'STREAMLINES ACTIVE' : 'ACTIVATE WIND TUNNEL'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-center">
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] font-mono text-white/45">DRAG COEFF</p>
                  <p className="font-mono text-lg font-bold text-white mt-0.5">0.142 Cd</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] font-mono text-white/45">WAKE TURBULENCE</p>
                  <p className="font-mono text-lg font-bold" style={{ color: effectiveAccent }}>
                    -38.4%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] font-mono text-white/45">VENTILATION</p>
                  <p className="font-mono text-lg font-bold text-white mt-0.5">420 CFM</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Compass,
                  title: 'Cantilevered Tail-Fin',
                  desc: 'Rear midsole extension smooths heel-strike transition and slices air wake.',
                },
                {
                  icon: Shield,
                  title: 'Exoskeleton Cage',
                  desc: 'Ultrasonic TPU ribs lock the 1st and 5th metatarsals onto the carbon platform.',
                },
                {
                  icon: Flame,
                  title: 'Thermal Exhaust',
                  desc: 'Perforated gusseted neoprene tongue vents 68% of internal foot heat.',
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/25 transition-colors"
                  >
                    <Icon className="w-5 h-5 mb-3" style={{ color: effectiveAccent }} />
                    <h4 className="font-display font-bold text-sm text-white mb-1.5">
                      {card.title}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 03: 12-PART ANATOMICAL 3D DECONSTRUCTION (EXPLODED VIEW)
        ------------------------------------------------------------------- */}
        <section
          id="section-anatomy"
          className="cv-section relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-28 flex items-center justify-end pointer-events-none"
        >
          <div className="w-full lg:w-6/12 space-y-5 pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel">
                <Layers className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                  03 // 12-PART 3D CAD DECONSTRUCTION
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFX.playExplodeServo(!isCurrentlyExploded);
                    handleToggleExplode();
                  }}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider text-[#06070B]"
                  style={{ backgroundColor: effectiveAccent }}
                >
                  {isCurrentlyExploded ? 'ASSEMBLE SHOE' : 'EXPLODE 12 PARTS'}
                </button>
                <button
                  onClick={() => {
                    soundFX.playHoverTick();
                    setXrayMode((v) => !v);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border ${
                    xrayMode
                      ? 'bg-[#00F0FF] text-[#06070B] font-bold border-[#00F0FF]'
                      : 'glass-panel text-white/80 hover:text-white'
                  }`}
                >
                  {xrayMode ? 'X-RAY: ON' : 'X-RAY CAD'}
                </button>
              </div>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[0.95]">
              EVERY LAYER.{' '}
              <span style={{ color: effectiveAccent }}>ZERO COMPROMISE.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/65 leading-relaxed">
              Click any of the <strong className="text-white">12 sculpted 3D components</strong>{' '}
              below—or click the floating hotspot pins directly on the exploded 3D shoe—to isolate
              the mesh and inspect its structural telemetry.
            </p>

            {/* Manual 3D Disassembly Scrubber */}
            <div className="glass-panel px-5 py-3.5 rounded-2xl flex items-center justify-between gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                3D EXPLOSION DEPTH:
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={manualExplode !== null ? manualExplode : activeSection === 2 ? 1 : 0}
                onChange={(e) => handleChangeManualExplode(parseFloat(e.target.value))}
                className="aether-slider flex-1"
              />
              <span className="text-xs font-mono font-bold w-12 text-right" style={{ color: effectiveAccent }}>
                {Math.round(
                  (manualExplode !== null ? manualExplode : activeSection === 2 ? 1 : 0) * 100
                )}
                %
              </span>
            </div>

            {/* Active Selected Part Deep-Dive Telemetry Card */}
            <div className="glass-panel-strong p-6 rounded-3xl border border-white/15 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#06070B]"
                      style={{ backgroundColor: effectiveAccent }}
                    >
                      {selectedPartSpec.code}
                    </span>
                    <span className="text-xs font-mono text-white/50 uppercase">
                      {selectedPartSpec.category}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                    {selectedPartSpec.label}
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-white/45 block">PART MASS</span>
                  <span className="text-xl font-bold" style={{ color: effectiveAccent }}>
                    {selectedPartSpec.weightGrams}g
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                {selectedPartSpec.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/10 text-xs font-mono">
                <div className="bg-white/[0.03] p-2.5 rounded-xl">
                  <span className="text-[10px] text-white/45 block">COMPOSITION</span>
                  <span className="text-white font-medium">{selectedPartSpec.materialFormula}</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl">
                  <span className="text-[10px] text-white/45 block">TENSILE / RATING</span>
                  <span className="text-white font-medium">{selectedPartSpec.tensileStrength}</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl">
                  <span className="text-[10px] text-white/45 block">PERFORMANCE GAIN</span>
                  <span style={{ color: effectiveAccent }} className="font-medium">
                    {selectedPartSpec.energyContribution}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 12-Part Selector Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SHOE_PARTS_SPECS.map((part) => {
                const isSelected = selectedPartId === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      soundFX.playHoverTick();
                      setSelectedPartId(isSelected ? null : part.id);
                    }}
                    className={`p-2.5 rounded-xl text-left transition-colors border flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/15 border-white/40 text-white shadow-lg'
                        : 'glass-panel border-white/5 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span
                        className="text-[9px] font-mono block"
                        style={{ color: isSelected ? effectiveAccent : undefined }}
                      >
                        {part.code} • {part.weightGrams}g
                      </span>
                      <span className="text-xs font-medium truncate block">
                        {part.label.replace('™', '')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 04: BIOMECHANICS & SOLE TELEMETRY LAB
        ------------------------------------------------------------------- */}
        <section
          id="section-telemetry"
          className="cv-section relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-28 flex items-center pointer-events-none"
        >
          <div className="w-full lg:w-6/12 space-y-6 pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel">
              <Activity className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                04 // BIOMECHANICS & FORCE-PLATE LAB
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-[0.95]">
              94.8% KINETIC{' '}
              <span style={{ color: effectiveAccent }}>PROPULSION</span> RETURN.
            </h2>

            <p className="text-white/70 text-base leading-relaxed">
              As the camera sweeps beneath the undercarriage, inspect the exposed{' '}
              <strong className="text-white">central torsion channel</strong> and directional{' '}
              <strong className="text-white">Graphene-X chevron lugs</strong>. Select a runner
              cadence below to stress-test the 3D NitroPods™ and carbon plate in real time.
            </p>

            <div className="glass-panel-strong p-6 rounded-3xl border border-white/15 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/45">
                    REAL-TIME 3D COMPRESSION SIMULATOR
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Select Impact Cadence Mode
                  </h3>
                </div>
                <Gauge className="w-5 h-5" style={{ color: effectiveAccent }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'idle', label: 'ZERO-G FLOAT', spm: '0 SPM', force: '1.0G' },
                  { id: 'walk', label: 'RECOVERY WALK', spm: '112 SPM', force: '1.8G' },
                  { id: 'tempo', label: 'MARATHON PACE', spm: '180 SPM', force: '3.2G' },
                  { id: 'sprint', label: 'MAX SPRINT', spm: '214 SPM', force: '4.6G' },
                ].map((mode) => {
                  const active = cadenceMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        soundFX.playColorSwitch();
                        setCadenceMode(mode.id as 'idle' | 'walk' | 'tempo' | 'sprint');
                      }}
                      className={`p-3 rounded-2xl text-left font-mono transition-colors border ${
                        active
                          ? 'text-[#06070B] font-bold border-transparent shadow-lg'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white'
                      }`}
                      style={active ? { backgroundColor: effectiveAccent } : undefined}
                    >
                      <span className="text-[10px] block opacity-75">{mode.spm}</span>
                      <span className="text-xs font-bold block my-0.5">{mode.label}</span>
                      <span className="text-[10px] block opacity-85">LOAD: {mode.force}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-white font-bold">
                      AETHER APEX-01 (Tri-Axial Carbon + N2 NitroPods)
                    </span>
                    <span style={{ color: effectiveAccent }} className="font-bold">
                      94.8% RETURN
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '94.8%',
                        backgroundColor: effectiveAccent,
                        boxShadow: `0 0 12px ${effectiveAccent}`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-white/55 mb-1">
                    <span>Standard Carbon Marathon Super-Shoe</span>
                    <span>81.2% RETURN</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[81.2%] bg-white/35 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-white/45 mb-1">
                    <span>Conventional EVA Foam Trainer</span>
                    <span>64.0% RETURN</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[64%] bg-white/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 05: BESPOKE 3D STUDIO ATELIER (REAL-TIME CUSTOMIZER)
        ------------------------------------------------------------------- */}
        <section
          id="section-atelier"
          className="cv-section relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-28 flex items-center justify-end pointer-events-none"
        >
          <div className="w-full lg:w-6/12 glass-panel-strong p-6 sm:p-8 rounded-[32px] border border-white/15 space-y-6 pointer-events-auto shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" style={{ color: effectiveAccent }} />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-white/60">
                    05 // BESPOKE 3D ATELIER CONFIGURATOR
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase text-white mt-1">
                  CRAFT YOUR <span style={{ color: effectiveAccent }}>APEX—01</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFX.playHoverTick();
                    setCustomOverrides({});
                  }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-mono bg-white/8 hover:bg-white/15 text-white/75 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
                <button
                  onClick={() => {
                    soundFX.playColorSwitch();
                    setFreeOrbitMode((v) => !v);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold text-[#06070B] flex items-center gap-1.5"
                  style={{ backgroundColor: effectiveAccent }}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>360° SPIN</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 block mb-2.5">
                BASE EDITION ARCHETYPE
              </label>
              <div className="grid grid-cols-5 gap-2">
                {COLORWAY_PRESETS.map((cw) => {
                  const active = cw.id === colorway.id;
                  return (
                    <button
                      key={cw.id}
                      onClick={() => {
                        soundFX.playColorSwitch();
                        handleSelectColorway(cw);
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-colors ${
                        active
                          ? 'bg-white/15 border-white text-white shadow-lg'
                          : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full mx-auto block mb-1.5"
                        style={{
                          backgroundColor: cw.accentHex,
                          boxShadow: `0 0 10px ${cw.accentHex}88`,
                        }}
                      />
                      <span className="text-[10px] font-mono font-bold block truncate">
                        {cw.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5 bg-white/[0.04] p-1.5 rounded-2xl">
                {[
                  { id: 'upper', label: '01 Upper Shell' },
                  { id: 'cage', label: '02 Exoskeleton' },
                  { id: 'sole', label: '03 Midsole' },
                  { id: 'accents', label: '04 Nitro & Blade' },
                  { id: 'env', label: '05 Studio Light' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundFX.playHoverTick();
                      setActiveCustomTab(tab.id as typeof activeCustomTab);
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-mono transition-colors ${
                      activeCustomTab === tab.id
                        ? 'bg-white text-[#06070B] font-bold shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                {activeCustomTab === 'upper' && (
                  <>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        AEROWEAVE™ UPPER PIGMENT
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {CUSTOM_SWATCHES.map((sw) => (
                          <button
                            key={sw.hex}
                            onClick={() => {
                              soundFX.playHoverTick();
                              setCustomOverrides((p) => ({ ...p, upperColor: sw.hex }));
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                              customOverrides.upperColor === sw.hex
                                ? 'border-white scale-110'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        SURFACE TEXTURE FINISH
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'knit', label: 'AeroWeave Knit' },
                          { id: 'matte-leather', label: 'Matte Track Skin' },
                          { id: 'cyber-iridescent', label: 'Cyber Anodized' },
                        ].map((fin) => (
                          <button
                            key={fin.id}
                            onClick={() => {
                              soundFX.playHoverTick();
                              setCustomOverrides((p) => ({
                                ...p,
                                upperFinish: fin.id as CustomPartOverrides['upperFinish'],
                              }));
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-mono border ${
                              (customOverrides.upperFinish || 'knit') === fin.id
                                ? 'border-white bg-white/15 text-white font-bold'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {fin.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeCustomTab === 'cage' && (
                  <>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        EXOSKELETON & HEEL CLIP PIGMENT
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {CUSTOM_SWATCHES.map((sw) => (
                          <button
                            key={sw.hex}
                            onClick={() => {
                              soundFX.playHoverTick();
                              setCustomOverrides((p) => ({ ...p, cageColor: sw.hex }));
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                              customOverrides.cageColor === sw.hex
                                ? 'border-white scale-110'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        STRUCTURAL COMPOSITE FINISH
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'tpu-satin', label: 'Satin Ballistic TPU' },
                          { id: 'forged-carbon', label: '12K Forged Carbon' },
                          { id: 'brushed-alloy', label: 'Brushed Titanium' },
                        ].map((fin) => (
                          <button
                            key={fin.id}
                            onClick={() => {
                              soundFX.playHoverTick();
                              setCustomOverrides((p) => ({
                                ...p,
                                cageFinish: fin.id as CustomPartOverrides['cageFinish'],
                              }));
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-mono border ${
                              (customOverrides.cageFinish || 'tpu-satin') === fin.id
                                ? 'border-white bg-white/15 text-white font-bold'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {fin.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeCustomTab === 'sole' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase text-white/50 block">
                      SUPERCRITICAL AEROFOAM MIDSOLE PIGMENT
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {CUSTOM_SWATCHES.map((sw) => (
                        <button
                          key={sw.hex}
                          onClick={() => {
                            soundFX.playHoverTick();
                            setCustomOverrides((p) => ({ ...p, midsoleColor: sw.hex }));
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            customOverrides.midsoleColor === sw.hex
                              ? 'border-white scale-110'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                          title={sw.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeCustomTab === 'accents' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        NITROPODS™ & VECTOR BLADE NEON CORE
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {CUSTOM_SWATCHES.map((sw) => (
                          <button
                            key={sw.hex}
                            onClick={() => {
                              soundFX.playColorSwitch();
                              setCustomOverrides((p) => ({
                                ...p,
                                accentColor: sw.hex,
                                hardwareColor: sw.hex,
                              }));
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                              customOverrides.accentColor === sw.hex
                                ? 'border-white scale-110'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block mb-2">
                        DYNEEMA® LACE CORDAGE COLOR
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {CUSTOM_SWATCHES.map((sw) => (
                          <button
                            key={sw.hex}
                            onClick={() => {
                              soundFX.playHoverTick();
                              setCustomOverrides((p) => ({ ...p, lacesColor: sw.hex }));
                            }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                              customOverrides.lacesColor === sw.hex
                                ? 'border-white scale-110'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeCustomTab === 'env' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase text-white/50 block">
                      3D STUDIO LIGHTING & ATMOSPHERE
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'cyber-void', label: 'Obsidian Void' },
                        { id: 'daylight-atelier', label: 'Daylight Atelier' },
                        { id: 'neon-tunnel', label: 'Neon Wind Tunnel' },
                      ].map((env) => (
                        <button
                          key={env.id}
                          onClick={() => {
                            soundFX.playColorSwitch();
                            setStudioEnvMode(env.id as typeof studioEnvMode);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-mono border ${
                            studioEnvMode === env.id
                              ? 'border-white bg-white/15 text-white font-bold'
                              : 'border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {env.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 block mb-2">
                  SELECT US TRACK SIZE
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {US_SIZES.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        soundFX.playHoverTick();
                        setSelectedSize(sz);
                      }}
                      className={`py-2 rounded-xl text-xs font-mono transition-colors border ${
                        selectedSize === sz
                          ? 'text-[#06070B] font-bold border-transparent'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white'
                      }`}
                      style={
                        selectedSize === sz ? { backgroundColor: effectiveAccent } : undefined
                      }
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 block mb-2">
                  HEEL TITANIUM ENGRAVING
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value.toUpperCase())}
                  placeholder="E.G. APEX // 01"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-white/50"
                />
                <span className="text-[10px] font-mono text-white/40 mt-1 block">
                  Laser-etched onto CNC Heel Clip
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-white/45 block">
                  BESPOKE ALLOCATION PRICE
                </span>
                <span className="font-display text-3xl font-extrabold text-white">
                  $
                  {Object.keys(customOverrides).length > 0
                    ? colorway.price + 45
                    : colorway.price}{' '}
                  <span className="text-xs font-mono font-normal text-white/50">USD</span>
                </span>
              </div>

              <button
                onClick={() => handleAddBespokeToBag()}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-mono text-xs font-bold uppercase tracking-widest text-[#06070B] flex items-center justify-center gap-2.5 transition-transform hover:scale-105 shadow-xl"
                style={{
                  backgroundColor: effectiveAccent,
                  boxShadow: `0 0 30px ${effectiveAccent}66`,
                }}
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>ADD BESPOKE 3D BUILD TO BAG</span>
              </button>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 06: ARCHIVE COLLECTION & 3D ASSET PIPELINE MANIFEST
        ------------------------------------------------------------------- */}
        <section
          id="section-collection"
          className="cv-section relative min-h-screen w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-28 flex flex-col justify-between pointer-events-auto"
        >
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel mb-3">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                    06 // AETHER HYPER-FOOTWEAR SERIES
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-none">
                  THE PROTO <span style={{ color: effectiveAccent }}>ARCHIVE.</span>
                </h2>
              </div>
              <p className="text-sm text-white/60 max-w-md">
                Load any archetype directly into the live WebGL 3D studio above to inspect its
                material shaders, carbon torsion geometry, and exploded assembly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {COLLECTION_MODELS.map((item) => {
                const preset =
                  COLORWAY_PRESETS.find((c) => c.id === item.colorwayId) || COLORWAY_PRESETS[0];
                const isLoaded = colorway.id === preset.id;

                return (
                  <div
                    key={item.id}
                    className={`glass-panel-strong rounded-3xl p-6 flex flex-col justify-between border transition-colors duration-300 ${
                      isLoaded
                        ? 'border-white/40 shadow-[0_0_35px_rgba(255,255,255,0.08)]'
                        : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono text-white/45">
                          {item.seriesCode}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#06070B]"
                          style={{ backgroundColor: preset.accentHex }}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <div className="h-40 rounded-2xl bg-[#07090F] border border-white/10 flex items-center justify-center mb-5 relative overflow-hidden group">
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/15 font-mono text-[10px] text-white/90">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: preset.accentHex }}
                          />
                          <span>{preset.name}</span>
                        </div>
                      </div>

                      <h3 className="font-display text-xl font-bold text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs font-mono text-white/50 mb-3">{item.category}</p>
                      <p className="text-xs text-white/65 leading-relaxed mb-5">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                        <div className="bg-white/[0.03] py-1.5 rounded-lg">
                          <span className="text-[9px] text-white/40 block">MASS</span>
                          <span className="text-white font-bold">{item.weight}</span>
                        </div>
                        <div className="bg-white/[0.03] py-1.5 rounded-lg">
                          <span className="text-[9px] text-white/40 block">DROP</span>
                          <span className="text-white font-bold">{item.drop}</span>
                        </div>
                        <div className="bg-white/[0.03] py-1.5 rounded-lg">
                          <span className="text-[9px] text-white/40 block">RETURN</span>
                          <span style={{ color: preset.accentHex }} className="font-bold">
                            {item.energyReturn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundFX.playColorSwitch();
                            handleSelectColorway(preset);
                            handleScrollToSection('section-hero');
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: preset.accentHex }} />
                          <span>{isLoaded ? 'ACTIVE IN 3D' : 'LOAD IN 3D'}</span>
                        </button>

                        <button
                          onClick={() => handleAddBespokeToBag(item.name, item.price, preset)}
                          className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold text-[#06070B] transition-transform active:scale-95"
                          style={{ backgroundColor: preset.accentHex }}
                        >
                          +${item.price}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono" style={{ color: effectiveAccent }}>
                  <Box className="w-4 h-4" />
                  <span>REAL 3D SCANNED GLTF 2.0 BINARY ASSETS (.GLB) + 2K PBR MAPS</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-white">
                  Real-Time Multi-Node 3D Scanned Footwear Architecture
                </h3>
                <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                  Powered by our 12-part partitioned 3D laser-scanned sneaker geometry (
                  <code className="text-white/90 font-mono">public/models/aether-apex-01.glb</code>{' '}
                  — 13,540 vertices, 22,700 triangles across 12 independent anatomical nodes) and
                  baked 2048×2048 normal, ORM, and diffuse PBR texture maps.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="/models/aether-apex-01.glb"
                  download="aether-apex-01.glb"
                  className="px-5 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#06070B] flex items-center gap-2"
                  style={{ backgroundColor: effectiveAccent }}
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD 3D .GLB (704 KB)</span>
                </a>
                <a
                  href="/models/asset-manifest.json"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-full text-xs font-mono uppercase tracking-wider glass-panel text-white/80 hover:text-white flex items-center gap-1.5"
                >
                  <span>3D MANIFEST JSON</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <footer className="mt-20 pt-8 pb-20 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/45">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: effectiveAccent }}
              />
              <span className="text-white font-bold tracking-widest">AETHER // LABS</span>
              <span>— 3D FOOTWEAR ENGINEERING</span>
            </div>
            <div className="flex items-center gap-6">
              <span>THREE.JS + R3F</span>
              <span>LENIS 120FPS SCROLL</span>
              <span>12-PART GLB 2.0</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
export default App;
