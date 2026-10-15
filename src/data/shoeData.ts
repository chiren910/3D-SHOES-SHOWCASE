export interface ShoePartSpec {
  id: string;
  code: string;
  label: string;
  category: string;
  weightGrams: number;
  explodeVector: [number, number, number];
  hotspotPos: [number, number, number];
  description: string;
  materialFormula: string;
  tensileStrength: string;
  energyContribution: string;
}

export interface ColorwayPreset {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  tagline: string;
  price: number;
  accentHex: string;
  secondaryHex: string;
  bgGlowHex: string;
  badgeText: string;
  parts: {
    Upper_PrimeKnit: { color: string; roughness: number; metalness: number; sheen: number };
    Overlays_Exoskeleton: { color: string; roughness: number; metalness: number; clearcoat: number };
    Midsole_AeroFoam: { color: string; roughness: number; metalness: number };
    Outsole_Tread: { color: string; roughness: number; metalness: number };
    Carbon_Torsion_Plate: { color: string; roughness: number; metalness: number };
    Air_Energy_Pods: { color: string; emissive: string; emissiveIntensity: number; transmission: number };
    Heel_Counter_Clip: { color: string; roughness: number; metalness: number; clearcoat: number };
    Tongue_AeroMesh: { color: string; roughness: number; metalness: number };
    Insole_Footbed: { color: string; roughness: number; metalness: number };
    Laces_CrossWeave: { color: string; roughness: number; metalness: number };
    Eyelets_Hardware: { color: string; roughness: number; metalness: number };
    Signature_Blade_Logo: { color: string; emissive: string; emissiveIntensity: number; metalness: number; roughness: number };
  };
}

export interface CustomPartOverrides {
  upperColor?: string;
  upperFinish?: 'knit' | 'matte-leather' | 'cyber-iridescent';
  cageColor?: string;
  cageFinish?: 'tpu-satin' | 'forged-carbon' | 'brushed-alloy';
  midsoleColor?: string;
  accentColor?: string;
  lacesColor?: string;
  hardwareColor?: string;
  engravingText?: string;
}

export interface CollectionShoeItem {
  id: string;
  seriesCode: string;
  name: string;
  category: string;
  weight: string;
  drop: string;
  energyReturn: string;
  price: number;
  colorwayId: string;
  image: string;
  badge: string;
  description: string;
}

export const SHOE_PARTS_SPECS: ShoePartSpec[] = [
  {
    id: 'Upper_PrimeKnit',
    code: 'PRT-01',
    label: 'AeroWeave™ Monofilament Upper',
    category: 'Adaptive Shell',
    weightGrams: 28,
    explodeVector: [0, 0.22, 0],
    hotspotPos: [0.52, 0.08, 0.36],
    description:
      'Seamless 3D-knitted ballistic aramid & translucent monofilament shell mapped to 14 distinct foot tension zones with zero internal seams.',
    materialFormula: 'Dyneema® + Recycled High-Tenacity Polyester',
    tensileStrength: '3,400 MPa',
    energyContribution: 'Zero-stretch lateral containment',
  },
  {
    id: 'Overlays_Exoskeleton',
    code: 'PRT-02',
    label: 'TPU Exoskeleton Lockdown Cage',
    category: 'Structural Frame',
    weightGrams: 9,
    explodeVector: [0.22, 0.42, 0.38],
    hotspotPos: [0.05, -0.15, 0.34],
    description:
      'Ultrasonic-welded structural nubuck & TPU exoskeleton panels anchoring the midfoot directly into the carbon propulsion chassis.',
    materialFormula: 'Pebax® Rnew 72R Elastomer + Micro-Suede',
    tensileStrength: '92 Shore D',
    energyContribution: '+18% torsional lateral stiffness',
  },
  {
    id: 'Signature_Blade_Logo',
    code: 'PRT-03',
    label: 'AETHER Kinetic Vector Blade',
    category: 'Aerodynamic Crest',
    weightGrams: 3,
    explodeVector: [0.0, 0.32, 0.72],
    hotspotPos: [-0.05, -0.24, 0.42],
    description:
      'Electro-plated 3D swept vector gill blades functioning as micro vortex generators to trip boundary-layer airflow and reduce drag to 0.14 Cd.',
    materialFormula: 'PVD-Coated Vapor Alloy',
    tensileStrength: '1,100 MPa',
    energyContribution: '-6.4% aerodynamic drag coefficient',
  },
  {
    id: 'Carbon_Torsion_Plate',
    code: 'PRT-04',
    label: 'Tri-Axial Forged Carbon Plate',
    category: 'Propulsion Core',
    weightGrams: 18,
    explodeVector: [0, -0.48, 0],
    hotspotPos: [-0.02, -0.46, 0.40],
    description:
      'Full-length S-curved aerospace carbon weave and torsion welt engineered to snap forward at toe-off with 94.8% return.',
    materialFormula: 'Torayca® T1100G 12K Twill Carbon',
    tensileStrength: '7,000 MPa',
    energyContribution: '94.8% mechanical energy return',
  },
  {
    id: 'Midsole_AeroFoam',
    code: 'PRT-05',
    label: 'Nitrogen Supercritical AeroFoam',
    category: 'Impact Chassis',
    weightGrams: 46,
    explodeVector: [-0.16, -0.25, 0],
    hotspotPos: [-0.85, -0.56, 0.40],
    description:
      'Supercritical nitrogen-infused aliphatic TPU chassis with sculpted sidewall compression channels and protective toe/heel bumpers.',
    materialFormula: 'N2-Infused Supercritical Aliphatic Pebax®',
    tensileStrength: '0.09 g/cm³ Ultra-Low Density',
    energyContribution: '87.4% vertical impact rebound',
  },
  {
    id: 'Air_Energy_Pods',
    code: 'PRT-06',
    label: 'Dual-Chamber NitroPods™',
    category: 'Kinetic Cushioning',
    weightGrams: 22,
    explodeVector: [0.14, -0.30, 0.46],
    hotspotPos: [0.12, -0.28, 0.42],
    description:
      'Recessed lateral and medial kinetic gill pods suspended inside the midfoot stability frame for dynamic lateral rebound.',
    materialFormula: 'Multi-Layer Barrier Polyurethane + N2 Gas',
    tensileStrength: '28.5 PSI Dynamic Rated',
    energyContribution: '-41% peak tibial shock load',
  },
  {
    id: 'Outsole_Tread',
    code: 'PRT-07',
    label: 'Graphene-X Chevron Outsole',
    category: 'Traction Base',
    weightGrams: 34,
    explodeVector: [0, -0.82, 0],
    hotspotPos: [0.25, -0.72, 0.25],
    description:
      'Directional micro-chevron graphene-enhanced rubber compound with central longitudinal torsion groove and high-grip perimeter lugs.',
    materialFormula: 'Single-Atom Graphene + Silica Wet-Grip Rubber',
    tensileStrength: '1.42G Lateral Grip Coefficient',
    energyContribution: '2,400 km abrasion lifespan',
  },
  {
    id: 'Heel_Counter_Clip',
    code: 'PRT-08',
    label: 'Forged Titanium-Carbon Heel Cup',
    category: 'Rearfoot Lock',
    weightGrams: 12,
    explodeVector: [-0.68, 0.16, 0],
    hotspotPos: [-1.18, 0.22, 0.0],
    description:
      'External anatomical rearfoot stabilizer spine and ballistic pull-tab loop that eliminate heel slip under violent cornering forces.',
    materialFormula: 'Chopped Carbon Composite + Ballistic Nylon',
    tensileStrength: '2,850 MPa',
    energyContribution: 'Zero rearfoot eversion roll',
  },
  {
    id: 'Tongue_AeroMesh',
    code: 'PRT-09',
    label: 'Gusseted Neoprene Air-Tongue',
    category: 'Instep Ergonomics',
    weightGrams: 8,
    explodeVector: [-0.18, 0.72, 0],
    hotspotPos: [-0.04, 0.28, 0.0],
    description:
      '3D-molded perforated mesh tongue with stitched crest badge that distributes lace pressure evenly across the dorsal tendons.',
    materialFormula: 'Closed-Cell Aero-Neoprene + Spacer Mesh',
    tensileStrength: 'Breathability 420 CFM',
    energyContribution: 'Eliminates dorsal tendon hotspots',
  },
  {
    id: 'Insole_Footbed',
    code: 'PRT-10',
    label: 'Ortho-Kinetic Lattice Footbed',
    category: 'Interior Ergonomics',
    weightGrams: 11,
    explodeVector: [-0.10, 0.54, 0],
    hotspotPos: [-0.65, 0.18, 0.16],
    description:
      'Anatomical padded ankle collar lining and auxetic lattice footbed that expand and contract dynamically under plantar pressure.',
    materialFormula: 'Carbon® DLS Elastomeric Polyurethane',
    tensileStrength: '14,200 Micro-Strut Nodes',
    energyContribution: '+4.2% step-in initial propulsion',
  },
  {
    id: 'Eyelets_Hardware',
    code: 'PRT-11',
    label: 'CNC Grade-5 Titanium Eyelets',
    category: 'Precision Hardware',
    weightGrams: 4,
    explodeVector: [0.08, 0.84, 0.28],
    hotspotPos: [-0.06, 0.08, 0.28],
    description:
      'Micro-machined Grade-5 Ti-6Al-4V toroid eyelets and lock washers chamfered to micro-tolerances for zero-friction lace tension.',
    materialFormula: 'Ti-6Al-4V Aerospace Titanium',
    tensileStrength: '950 MPa Yield',
    energyContribution: 'Equalized 8-point tension lock',
  },
  {
    id: 'Laces_CrossWeave',
    code: 'PRT-12',
    label: 'Dyneema® Kevlar Tension Laces',
    category: 'Dynamic Lockdown',
    weightGrams: 5,
    explodeVector: [0.14, 0.98, 0],
    hotspotPos: [0.02, 0.34, 0.0],
    description:
      'Hydrophobic braided Dyneema® cordage interwoven with micro-silicone grip threads and double-loop lockdown knot.',
    materialFormula: 'UHMWPE Dyneema® + Alloy Aglets',
    tensileStrength: '15x Stronger than Steel by weight',
    energyContribution: 'Permanent micro-grip knot lock',
  },
];

export const COLORWAY_PRESETS: ColorwayPreset[] = [
  {
    id: 'volt-proto',
    code: 'CW-01',
    name: 'VOLT PROTO',
    subtitle: 'Obsidian Void / Cyber Volt / Alabaster AeroFoam',
    tagline: 'Launch Flagship Track Prototype',
    price: 340,
    accentHex: '#D4FF00',
    secondaryHex: '#00F0FF',
    bgGlowHex: '#a3cc00',
    badgeText: 'FLAGSHIP EDITION',
    parts: {
      Upper_PrimeKnit: { color: '#283044', roughness: 0.62, metalness: 0.10, sheen: 0.7 },
      Overlays_Exoskeleton: { color: '#181C26', roughness: 0.42, metalness: 0.22, clearcoat: 0.85 },
      Midsole_AeroFoam: { color: '#ECEFF4', roughness: 0.38, metalness: 0.08 },
      Outsole_Tread: { color: '#1D212C', roughness: 0.36, metalness: 0.18 },
      Carbon_Torsion_Plate: { color: '#2E3546', roughness: 0.24, metalness: 0.78 },
      Air_Energy_Pods: { color: '#D4FF00', emissive: '#D4FF00', emissiveIntensity: 0.65, transmission: 0.65 },
      Heel_Counter_Clip: { color: '#D4FF00', roughness: 0.22, metalness: 0.65, clearcoat: 1.0 },
      Tongue_AeroMesh: { color: '#222838', roughness: 0.52, metalness: 0.15 },
      Insole_Footbed: { color: '#D4FF00', roughness: 0.5, metalness: 0.1 },
      Laces_CrossWeave: { color: '#E6ECF5', roughness: 0.55, metalness: 0.10 },
      Eyelets_Hardware: { color: '#D4FF00', roughness: 0.15, metalness: 0.95 },
      Signature_Blade_Logo: { color: '#202634', emissive: '#D4FF00', emissiveIntensity: 0.12, metalness: 0.55, roughness: 0.25 },
    },
  },
  {
    id: 'crimson-apex',
    code: 'CW-02',
    name: 'CRIMSON APEX',
    subtitle: 'Stealth Anthracite / Hyper Crimson / Pure White',
    tagline: 'Nocturnal Speed Record Edition',
    price: 360,
    accentHex: '#FF2A54',
    secondaryHex: '#FF7A00',
    bgGlowHex: '#cc1439',
    badgeText: 'LIMITED DROP',
    parts: {
      Upper_PrimeKnit: { color: '#2D2830', roughness: 0.58, metalness: 0.12, sheen: 0.8 },
      Overlays_Exoskeleton: { color: '#1B171E', roughness: 0.40, metalness: 0.25, clearcoat: 0.9 },
      Midsole_AeroFoam: { color: '#F2F4F8', roughness: 0.35, metalness: 0.08 },
      Outsole_Tread: { color: '#FF2A54', roughness: 0.32, metalness: 0.20 },
      Carbon_Torsion_Plate: { color: '#2C2229', roughness: 0.22, metalness: 0.80 },
      Air_Energy_Pods: { color: '#FF2A54', emissive: '#FF1E48', emissiveIntensity: 0.72, transmission: 0.6 },
      Heel_Counter_Clip: { color: '#FF2A54', roughness: 0.20, metalness: 0.68, clearcoat: 1.0 },
      Tongue_AeroMesh: { color: '#241E28', roughness: 0.48, metalness: 0.18 },
      Insole_Footbed: { color: '#FF2A54', roughness: 0.45, metalness: 0.1 },
      Laces_CrossWeave: { color: '#ECEEF4', roughness: 0.5, metalness: 0.1 },
      Eyelets_Hardware: { color: '#F5D076', roughness: 0.12, metalness: 0.98 },
      Signature_Blade_Logo: { color: '#231C22', emissive: '#FF2A54', emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.22 },
    },
  },
  {
    id: 'cryo-zero',
    code: 'CW-03',
    name: 'CRYO ZERO',
    subtitle: 'Midnight Ocean / Cryo Cyan / Glacier White',
    tagline: 'Sub-Zero Wind Tunnel Calibration Spec',
    price: 355,
    accentHex: '#00F0FF',
    secondaryHex: '#38BDF8',
    bgGlowHex: '#00a8b5',
    badgeText: 'AERO LAB SPEC',
    parts: {
      Upper_PrimeKnit: { color: '#1F75B3', roughness: 0.52, metalness: 0.10, sheen: 0.85 },
      Overlays_Exoskeleton: { color: '#232B38', roughness: 0.38, metalness: 0.25, clearcoat: 0.95 },
      Midsole_AeroFoam: { color: '#F0F4FA', roughness: 0.32, metalness: 0.08 },
      Outsole_Tread: { color: '#00F0FF', roughness: 0.28, metalness: 0.25 },
      Carbon_Torsion_Plate: { color: '#1E2B3C', roughness: 0.20, metalness: 0.85 },
      Air_Energy_Pods: { color: '#00F0FF', emissive: '#00F0FF', emissiveIntensity: 0.7, transmission: 0.72 },
      Heel_Counter_Clip: { color: '#00F0FF', roughness: 0.18, metalness: 0.75, clearcoat: 1.0 },
      Tongue_AeroMesh: { color: '#1A5E91', roughness: 0.45, metalness: 0.15 },
      Insole_Footbed: { color: '#00F0FF', roughness: 0.45, metalness: 0.1 },
      Laces_CrossWeave: { color: '#F0F4FA', roughness: 0.48, metalness: 0.1 },
      Eyelets_Hardware: { color: '#00F0FF', roughness: 0.12, metalness: 0.95 },
      Signature_Blade_Logo: { color: '#1D2634', emissive: '#00F0FF', emissiveIntensity: 0.18, metalness: 0.65, roughness: 0.20 },
    },
  },
  {
    id: 'solar-flare',
    code: 'CW-04',
    name: 'SOLAR FLARE',
    subtitle: 'Desert Rose Sand / Molten Orange / Basalt Carbon',
    tagline: 'Marathon World-Major Prototype',
    price: 350,
    accentHex: '#FF6B00',
    secondaryHex: '#FFB800',
    bgGlowHex: '#c95200',
    badgeText: 'MARATHON SPEC',
    parts: {
      Upper_PrimeKnit: { color: '#C8AEB0', roughness: 0.58, metalness: 0.08, sheen: 0.75 },
      Overlays_Exoskeleton: { color: '#28252B', roughness: 0.40, metalness: 0.22, clearcoat: 0.85 },
      Midsole_AeroFoam: { color: '#F4F2EE', roughness: 0.36, metalness: 0.08 },
      Outsole_Tread: { color: '#FF6B00', roughness: 0.32, metalness: 0.2 },
      Carbon_Torsion_Plate: { color: '#262329', roughness: 0.22, metalness: 0.82 },
      Air_Energy_Pods: { color: '#FF6B00', emissive: '#FF5500', emissiveIntensity: 0.7, transmission: 0.65 },
      Heel_Counter_Clip: { color: '#FF6B00', roughness: 0.20, metalness: 0.70, clearcoat: 0.95 },
      Tongue_AeroMesh: { color: '#28242C', roughness: 0.5, metalness: 0.15 },
      Insole_Footbed: { color: '#FF6B00', roughness: 0.5, metalness: 0.1 },
      Laces_CrossWeave: { color: '#F4F2EE', roughness: 0.52, metalness: 0.10 },
      Eyelets_Hardware: { color: '#FF6B00', roughness: 0.14, metalness: 0.96 },
      Signature_Blade_Logo: { color: '#242028', emissive: '#FF6B00', emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.22 },
    },
  },
  {
    id: 'phantom-gold',
    code: 'CW-05',
    name: 'PHANTOM GOLD',
    subtitle: 'Velvet Onyx / 24K Champagne Gold / Ivory Foam',
    tagline: 'Atelier Bespoke Collector Reserve',
    price: 420,
    accentHex: '#F3C65F',
    secondaryHex: '#FFF0C2',
    bgGlowHex: '#b38b2d',
    badgeText: 'ATELIER RESERVE',
    parts: {
      Upper_PrimeKnit: { color: '#26242B', roughness: 0.55, metalness: 0.15, sheen: 0.9 },
      Overlays_Exoskeleton: { color: '#16151B', roughness: 0.35, metalness: 0.35, clearcoat: 1.0 },
      Midsole_AeroFoam: { color: '#EFECE6', roughness: 0.30, metalness: 0.12 },
      Outsole_Tread: { color: '#211E18', roughness: 0.30, metalness: 0.30 },
      Carbon_Torsion_Plate: { color: '#F3C65F', roughness: 0.18, metalness: 0.92 },
      Air_Energy_Pods: { color: '#F3C65F', emissive: '#E5B242', emissiveIntensity: 0.55, transmission: 0.55 },
      Heel_Counter_Clip: { color: '#F3C65F', roughness: 0.14, metalness: 0.94, clearcoat: 1.0 },
      Tongue_AeroMesh: { color: '#1F1D24', roughness: 0.48, metalness: 0.20 },
      Insole_Footbed: { color: '#F3C65F', roughness: 0.45, metalness: 0.25 },
      Laces_CrossWeave: { color: '#F3C65F', roughness: 0.45, metalness: 0.25 },
      Eyelets_Hardware: { color: '#F3C65F', roughness: 0.08, metalness: 1.0 },
      Signature_Blade_Logo: { color: '#1D1B22', emissive: '#F3C65F', emissiveIntensity: 0.15, metalness: 0.75, roughness: 0.18 },
    },
  },
];

export interface ScrollStagePose {
  sectionIndex: number;
  name: string;
  shoePos: [number, number, number];
  shoeRot: [number, number, number];
  shoeScale: number;
  explodeAmount: number;
  windIntensity: number;
}

/**
 * 6 Scroll Choreography Keyframes driven smoothly by Lenis Scroll Progress [0..1]
 */
export const SCROLL_CHOREOGRAPHY: ScrollStagePose[] = [
  // Stage 0: HERO — Iconic floating side-quarter profile
  {
    sectionIndex: 0,
    name: 'HERO PROFILE',
    shoePos: [0.15, 0.08, 0.0],
    shoeRot: [0.14, -0.38, -0.06],
    shoeScale: 1.10,
    explodeAmount: 0.0,
    windIntensity: 0.35,
  },
  // Stage 1: AERODYNAMICS — Swept nose-down wind-tunnel speed angle shifted right
  {
    sectionIndex: 1,
    name: 'AERODYNAMICS',
    shoePos: [0.95, 0.05, 0.20],
    shoeRot: [0.20, -0.78, -0.14],
    shoeScale: 1.12,
    explodeAmount: 0.0,
    windIntensity: 1.0,
  },
  // Stage 2: ANATOMICAL 3D DECONSTRUCTION — Full 12-part Exploded View in center-left!
  {
    sectionIndex: 2,
    name: '3D DECONSTRUCTION',
    shoePos: [-0.82, 0.02, 0.12],
    shoeRot: [0.28, -0.48, -0.05],
    shoeScale: 0.95,
    explodeAmount: 1.0,
    windIntensity: 0.2,
  },
  // Stage 3: BIOMECHANICS & SOLE TELEMETRY — Angled undercarriage view showing Carbon Plate & Outsole tread
  {
    sectionIndex: 3,
    name: 'SOLE TELEMETRY',
    shoePos: [0.92, 0.10, 0.25],
    shoeRot: [-0.48, -1.08, 0.16],
    shoeScale: 1.10,
    explodeAmount: 0.15,
    windIntensity: 0.45,
  },
  // Stage 4: BESPOKE 3D ATELIER — Studio pedestal presentation for interactive customization
  {
    sectionIndex: 4,
    name: 'BESPOKE ATELIER',
    shoePos: [-0.88, 0.08, 0.22],
    shoeRot: [0.16, -0.42, -0.05],
    shoeScale: 1.10,
    explodeAmount: 0.0,
    windIntensity: 0.25,
  },
  // Stage 5: COLLECTION SHOWCASE — Dramatic three-quarter heroic elevation
  {
    sectionIndex: 5,
    name: 'ARCHIVE SERIES',
    shoePos: [0.0, 0.32, -0.25],
    shoeRot: [0.14, -0.88, -0.04],
    shoeScale: 0.95,
    explodeAmount: 0.0,
    windIntensity: 0.3,
  },
];

export const COLLECTION_MODELS: CollectionShoeItem[] = [
  {
    id: 'apex-01-proto',
    seriesCode: 'SER // 01',
    name: 'AETHER APEX-01 PROTO',
    category: 'Hyper-Marathon Carbon Racer',
    weight: '184g',
    drop: '8.0 mm',
    energyReturn: '94.8%',
    price: 340,
    colorwayId: 'volt-proto',
    image: '/images/shoe-volt-proto.png',
    badge: 'BESTSELLER',
    description: 'Flagship supercritical nitrogen chassis with full-length tri-axial carbon plate and dual NitroPods.',
  },
  {
    id: 'vortex-gt-crimson',
    seriesCode: 'SER // 02',
    name: 'AETHER VORTEX-GT',
    category: 'Track & Criterion Sprint Spec',
    weight: '168g',
    drop: '6.5 mm',
    energyReturn: '96.1%',
    price: 360,
    colorwayId: 'crimson-apex',
    image: '/images/shoe-crimson-apex.png',
    badge: 'TRACK LEGAL',
    description: 'Aggressive forefoot rocker geometry with stiffened exoskeleton ribs for explosive sprint acceleration.',
  },
  {
    id: 'stratos-cryo',
    seriesCode: 'SER // 03',
    name: 'AETHER STRATOS ZERO',
    category: 'All-Weather Aero Endurance',
    weight: '196g',
    drop: '8.5 mm',
    energyReturn: '93.4%',
    price: 355,
    colorwayId: 'cryo-zero',
    image: '/images/shoe-cryo-zero.png',
    badge: 'HYDRO-SHIELD',
    description: 'Hydrophobic monofilament upper paired with Cryo-Grip silica-graphene outsole for wet tarmac dominance.',
  },
  {
    id: 'phantom-atelier',
    seriesCode: 'SER // 04',
    name: 'AETHER PHANTOM RESERVE',
    category: 'Numbered Collector Edition',
    weight: '188g',
    drop: '8.0 mm',
    energyReturn: '95.2%',
    price: 420,
    colorwayId: 'phantom-gold',
    image: '/images/shoe-phantom-gold.png',
    badge: '1 OF 500',
    description: 'PVD 24K gold-plated titanium hardware and hand-laid 12K twill carbon plate with bespoke heel engraving.',
  },
];
