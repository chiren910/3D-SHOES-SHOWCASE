import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');
const PUBLIC_IMAGES_DIR = path.join(ROOT_DIR, 'public', 'images');

fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });

// ============================================================================
// 1. ZERO-DEPENDENCY PNG ENCODER
// ============================================================================
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writeRGBAtoPNG(filepath, width, height, rgbaData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawData[rowStart] = 0;
    rgbaData.copy(rawData, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });
  const pngBuffer = Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filepath, pngBuffer);
}

// ============================================================================
// 2. LOAD 12-PART REAL SCANNED SHOE GLB (aether-apex-01.glb)
// ============================================================================
function loadShoePartsFromGLB(glbPath) {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen + 8;

  const getAccessor = (accIdx) => {
    const acc = gltf.accessors[accIdx];
    const bv = gltf.bufferViews[acc.bufferView];
    const start = binOffset + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    if (acc.componentType === 5125) {
      return new Uint32Array(buf.buffer, buf.byteOffset + start, acc.count);
    }
    const mult = acc.type === 'VEC3' ? 3 : acc.type === 'VEC2' ? 2 : 1;
    return new Float32Array(buf.buffer, buf.byteOffset + start, acc.count * mult);
  };

  return gltf.nodes.slice(1).map((node) => {
    const mesh = gltf.meshes[node.mesh];
    const prim = mesh.primitives[0];
    return {
      name: node.name,
      extras: node.extras || {},
      positions: getAccessor(prim.attributes.POSITION),
      normals: getAccessor(prim.attributes.NORMAL),
      uvs: getAccessor(prim.attributes.TEXCOORD_0),
      indices: getAccessor(prim.indices),
    };
  });
}

// ============================================================================
// 3. 3D Z-BUFFER STUDIO PBR RASTERIZER FOR REAL SHOE GLB
// ============================================================================
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255,
  ];
}

function rotatePoint([x, y, z], [rx, ry, rz]) {
  // Rotate Y
  const cy = Math.cos(ry), sy = Math.sin(ry);
  let x1 = x * cy + z * sy;
  let y1 = y;
  let z1 = -x * sy + z * cy;
  // Rotate X
  const cx = Math.cos(rx), sx = Math.sin(rx);
  let x2 = x1;
  let y2 = y1 * cx - z1 * sx;
  let z2 = y1 * sx + z1 * cx;
  // Rotate Z
  const cz = Math.cos(rz), sz = Math.sin(rz);
  let x3 = x2 * cz - y2 * sz;
  let y3 = x2 * sz + y2 * cz;
  let z3 = z2;
  return [x3, y3, z3];
}

function renderShoeScene({
  width,
  height,
  parts,
  palette,
  accentHex,
  secondaryHex,
  rotation = [0.16, -0.45, -0.06],
  explode = 0.0,
  wireframe = false,
  scale = 1.0,
}) {
  const rgba = Buffer.alloc(width * height * 4);
  const zbuf = new Float32Array(width * height).fill(1e9);

  const accentRgb = hexToRgb(accentHex);
  const secRgb = hexToRgb(secondaryHex);

  // 1. Render Studio Tech Grid & Radial Glow Background
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      const dx = (nx - 0.5) * (width / height);
      const dy = ny - 0.52;
      const dist = Math.hypot(dx, dy);

      const glow1 = Math.max(0, 1 - dist / 0.68);
      const glow2 = Math.max(0, 1 - Math.hypot(dx - 0.35, dy - 0.25) / 0.55);

      const isGrid = x % 48 === 0 || y % 48 === 0;
      const gridBoost = isGrid ? 0.025 : 0;

      let r = 0.024 + glow1 * glow1 * accentRgb[0] * 0.22 + glow2 * secRgb[0] * 0.12 + gridBoost;
      let g = 0.028 + glow1 * glow1 * accentRgb[1] * 0.22 + glow2 * secRgb[1] * 0.12 + gridBoost;
      let b = 0.045 + glow1 * glow1 * accentRgb[2] * 0.22 + glow2 * secRgb[2] * 0.12 + gridBoost;

      // Subtle studio floor horizon & glowing pedestal ellipse
      const floorDx = dx / 0.85;
      const floorDy = (ny - 0.78) / 0.09;
      const ringDist = Math.hypot(floorDx, floorDy);
      if (Math.abs(ringDist - 0.72) < 0.018) {
        const ringFactor = 1 - Math.abs(ringDist - 0.72) / 0.018;
        r += accentRgb[0] * ringFactor * 0.65;
        g += accentRgb[1] * ringFactor * 0.65;
        b += accentRgb[2] * ringFactor * 0.65;
      } else if (ringDist < 0.62) {
        const shadowFactor = Math.pow(1 - ringDist / 0.62, 2) * 0.55;
        r *= 1 - shadowFactor;
        g *= 1 - shadowFactor;
        b *= 1 - shadowFactor;
      }

      rgba[idx] = Math.min(255, Math.round(r * 255));
      rgba[idx + 1] = Math.min(255, Math.round(g * 255));
      rgba[idx + 2] = Math.min(255, Math.round(b * 255));
      rgba[idx + 3] = 255;
    }
  }

  // Camera & projection parameters
  const camZ = 4.15;
  const fovScale = height * 1.18 * scale;
  const centerX = width * 0.5;
  const centerY = height * 0.52;

  // Studio Lights (Normalized)
  const keyLight = [0.52, 0.72, 0.45];
  const fillLight = [-0.65, 0.35, 0.67];
  const rimLight = [0.0, 0.62, -0.78];

  const drawLine = (x0, y0, z0, x1, y1, z1, cr, cg, cb) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    if (steps > 400) return;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = Math.round(x0 + (x1 - x0) * t);
      const py = Math.round(y0 + (y1 - y0) * t);
      const pz = z0 + (z1 - z0) * t;
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const pIdx = py * width + px;
        if (pz <= zbuf[pIdx] + 0.01) {
          zbuf[pIdx] = pz;
          const cIdx = pIdx * 4;
          rgba[cIdx] = cr;
          rgba[cIdx + 1] = cg;
          rgba[cIdx + 2] = cb;
        }
      }
    }
  };

  for (const part of parts) {
    const partColorHex = palette[part.name] || '#DCE3EE';
    const baseRgb = hexToRgb(partColorHex);
    const expVec = part.extras.explodeVector || [0, 0, 0];
    const ox = expVec[0] * explode * 0.55;
    const oy = expVec[1] * explode * 0.55;
    const oz = expVec[2] * explode * 0.55;

    const pos = part.positions;
    const norm = part.normals;
    const uvs = part.uvs;
    const idx = part.indices;
    const isAccentPart =
      part.name === 'Air_Energy_Pods' ||
      part.name === 'Eyelets_Hardware' ||
      part.name === 'Heel_Counter_Clip';

    // Transform all vertices for this part
    const numV = pos.length / 3;
    const projX = new Float32Array(numV);
    const projY = new Float32Array(numV);
    const projZ = new Float32Array(numV);
    const shadeR = new Float32Array(numV);
    const shadeG = new Float32Array(numV);
    const shadeB = new Float32Array(numV);

    for (let v = 0; v < numV; v++) {
      const wx = pos[v * 3] + ox;
      const wy = pos[v * 3 + 1] + oy;
      const wz = pos[v * 3 + 2] + oz;

      const [rx, ry, rz] = rotatePoint([wx, wy, wz], rotation);
      const [nx, ny, nz] = rotatePoint(
        [norm[v * 3], norm[v * 3 + 1], norm[v * 3 + 2]],
        rotation
      );

      const depth = camZ - rz;
      projX[v] = centerX + (rx / depth) * fovScale;
      projY[v] = centerY - (ry / depth) * fovScale;
      projZ[v] = depth;

      // Procedural knit/suede micro-texture from UVs
      const u = uvs[v * 2];
      const vv = uvs[v * 2 + 1];
      let microTex = 1.0;
      if (part.name === 'Upper_PrimeKnit' || part.name === 'Tongue_AeroMesh') {
        microTex = 0.88 + 0.12 * Math.sin(u * 260) * Math.cos(vv * 260);
      } else if (part.name === 'Laces_CrossWeave') {
        microTex = 0.90 + 0.10 * Math.sin((u + vv) * 320);
      }

      const ndotl1 = Math.max(0, nx * keyLight[0] + ny * keyLight[1] + nz * keyLight[2]);
      const ndotl2 = Math.max(0, nx * fillLight[0] + ny * fillLight[1] + nz * fillLight[2]);
      const ndotl3 = Math.max(0, nx * rimLight[0] + ny * rimLight[1] + nz * rimLight[2]);
      const fresnel = Math.pow(1 - Math.abs(nz), 3);

      const spec = Math.pow(Math.max(0, (nx * 0.25 + ny * 0.55 + nz * 0.8)), isAccentPart ? 24 : 10);
      const diff = 0.28 + ndotl1 * 0.78 + ndotl2 * 0.28;

      let vr = baseRgb[0] * microTex * diff + spec * 0.28 + fresnel * accentRgb[0] * 0.28 + ndotl3 * 0.18;
      let vg = baseRgb[1] * microTex * diff + spec * 0.28 + fresnel * accentRgb[1] * 0.28 + ndotl3 * 0.18;
      let vb = baseRgb[2] * microTex * diff + spec * 0.28 + fresnel * accentRgb[2] * 0.28 + ndotl3 * 0.18;

      if (isAccentPart) {
        vr = vr * 0.75 + baseRgb[0] * 0.45;
        vg = vg * 0.75 + baseRgb[1] * 0.45;
        vb = vb * 0.75 + baseRgb[2] * 0.45;
      }

      shadeR[v] = Math.min(255, Math.max(0, vr * 255));
      shadeG[v] = Math.min(255, Math.max(0, vg * 255));
      shadeB[v] = Math.min(255, Math.max(0, vb * 255));
    }

    // Rasterize triangles
    for (let i = 0; i < idx.length; i += 3) {
      const i0 = idx[i];
      const i1 = idx[i + 1];
      const i2 = idx[i + 2];

      const x0 = projX[i0], y0 = projY[i0], z0 = projZ[i0];
      const x1 = projX[i1], y1 = projY[i1], z1 = projZ[i1];
      const x2 = projX[i2], y2 = projY[i2], z2 = projZ[i2];

      if (wireframe) {
        const cr = isAccentPart ? Math.round(accentRgb[0] * 255) : 0;
        const cg = isAccentPart ? Math.round(accentRgb[1] * 255) : 240;
        const cb = isAccentPart ? Math.round(accentRgb[2] * 255) : 255;
        drawLine(x0, y0, z0, x1, y1, z1, cr, cg, cb);
        drawLine(x1, y1, z1, x2, y2, z2, cr, cg, cb);
        continue;
      }

      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)));

      const area = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
      if (Math.abs(area) < 1e-4) continue;
      const invArea = 1 / area;

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const w0 = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) * invArea;
          const w1 = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) * invArea;
          const w2 = 1 - w0 - w1;

          if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
            const pz = w0 * z0 + w1 * z1 + w2 * z2;
            const pIdx = py * width + px;
            if (pz < zbuf[pIdx]) {
              zbuf[pIdx] = pz;
              const cIdx = pIdx * 4;
              rgba[cIdx] = Math.round(w0 * shadeR[i0] + w1 * shadeR[i1] + w2 * shadeR[i2]);
              rgba[cIdx + 1] = Math.round(w0 * shadeG[i0] + w1 * shadeG[i1] + w2 * shadeG[i2]);
              rgba[cIdx + 2] = Math.round(w0 * shadeB[i0] + w1 * shadeB[i1] + w2 * shadeB[i2]);
            }
          }
        }
      }
    }
  }

  return rgba;
}

function generateAllShowcaseImages() {
  console.log('📸 Rendering 3D Shoe Showcase Images from public/models/aether-apex-01.glb...');
  const glbPath = path.join(PUBLIC_MODELS_DIR, 'aether-apex-01.glb');
  const parts = loadShoePartsFromGLB(glbPath);

  const palettes = {
    voltProto: {
      Upper_PrimeKnit: '#2C354B',
      Overlays_Exoskeleton: '#191E2B',
      Midsole_AeroFoam: '#ECEFF4',
      Outsole_Tread: '#1D212C',
      Carbon_Torsion_Plate: '#343D52',
      Air_Energy_Pods: '#D4FF00',
      Heel_Counter_Clip: '#D4FF00',
      Tongue_AeroMesh: '#242B3D',
      Insole_Footbed: '#D4FF00',
      Laces_CrossWeave: '#E6ECF5',
      Eyelets_Hardware: '#D4FF00',
      Signature_Blade_Logo: '#D4FF00',
    },
    crimsonApex: {
      Upper_PrimeKnit: '#302A34',
      Overlays_Exoskeleton: '#1C1720',
      Midsole_AeroFoam: '#F2F4F8',
      Outsole_Tread: '#FF2A54',
      Carbon_Torsion_Plate: '#32252E',
      Air_Energy_Pods: '#FF2A54',
      Heel_Counter_Clip: '#FF2A54',
      Tongue_AeroMesh: '#261F2A',
      Insole_Footbed: '#FF2A54',
      Laces_CrossWeave: '#ECEEF4',
      Eyelets_Hardware: '#F5D076',
      Signature_Blade_Logo: '#FF2A54',
    },
    cryoZero: {
      Upper_PrimeKnit: '#1F75B3',
      Overlays_Exoskeleton: '#232B38',
      Midsole_AeroFoam: '#F0F4FA',
      Outsole_Tread: '#00F0FF',
      Carbon_Torsion_Plate: '#223247',
      Air_Energy_Pods: '#00F0FF',
      Heel_Counter_Clip: '#00F0FF',
      Tongue_AeroMesh: '#1A5E91',
      Insole_Footbed: '#00F0FF',
      Laces_CrossWeave: '#F0F4FA',
      Eyelets_Hardware: '#00F0FF',
      Signature_Blade_Logo: '#00F0FF',
    },
    phantomGold: {
      Upper_PrimeKnit: '#2A2730',
      Overlays_Exoskeleton: '#17161D',
      Midsole_AeroFoam: '#EFECE6',
      Outsole_Tread: '#242019',
      Carbon_Torsion_Plate: '#F3C65F',
      Air_Energy_Pods: '#F3C65F',
      Heel_Counter_Clip: '#F3C65F',
      Tongue_AeroMesh: '#211F26',
      Insole_Footbed: '#F3C65F',
      Laces_CrossWeave: '#F3C65F',
      Eyelets_Hardware: '#F3C65F',
      Signature_Blade_Logo: '#F3C65F',
    },
  };

  // 1. Hero Banner (1280x720)
  writeRGBAtoPNG(
    path.join(PUBLIC_IMAGES_DIR, 'hero-banner.png'),
    1280,
    720,
    renderShoeScene({
      width: 1280,
      height: 720,
      parts,
      palette: palettes.voltProto,
      accentHex: '#D4FF00',
      secondaryHex: '#00F0FF',
      rotation: [0.16, -0.42, -0.06],
      explode: 0.0,
      scale: 1.05,
    })
  );

  // 2. 12-Part Exploded Deconstruction Banner (1280x720)
  writeRGBAtoPNG(
    path.join(PUBLIC_IMAGES_DIR, 'exploded-deconstruction.png'),
    1280,
    720,
    renderShoeScene({
      width: 1280,
      height: 720,
      parts,
      palette: palettes.voltProto,
      accentHex: '#D4FF00',
      secondaryHex: '#00F0FF',
      rotation: [0.28, -0.52, -0.05],
      explode: 0.95,
      scale: 0.88,
    })
  );

  // 3. X-Ray Wireframe Telemetry Banner (1280x720)
  writeRGBAtoPNG(
    path.join(PUBLIC_IMAGES_DIR, 'xray-telemetry.png'),
    1280,
    720,
    renderShoeScene({
      width: 1280,
      height: 720,
      parts,
      palette: palettes.cryoZero,
      accentHex: '#00F0FF',
      secondaryHex: '#D4FF00',
      rotation: [0.2, -0.48, -0.06],
      explode: 0.35,
      wireframe: true,
      scale: 0.98,
    })
  );

  // 4. Four Collection Colorway Cards (640x400)
  const cardConfigs = [
    {
      file: 'shoe-volt-proto.png',
      palette: palettes.voltProto,
      accent: '#D4FF00',
      sec: '#00F0FF',
      rot: [0.15, -0.42, -0.06],
    },
    {
      file: 'shoe-crimson-apex.png',
      palette: palettes.crimsonApex,
      accent: '#FF2A54',
      sec: '#FF7A00',
      rot: [0.18, -0.48, -0.08],
    },
    {
      file: 'shoe-cryo-zero.png',
      palette: palettes.cryoZero,
      accent: '#00F0FF',
      sec: '#38BDF8',
      rot: [0.16, -0.38, -0.05],
    },
    {
      file: 'shoe-phantom-gold.png',
      palette: palettes.phantomGold,
      accent: '#F3C65F',
      sec: '#FFF0C2',
      rot: [0.16, -0.45, -0.06],
    },
  ];

  for (const cfg of cardConfigs) {
    writeRGBAtoPNG(
      path.join(PUBLIC_IMAGES_DIR, cfg.file),
      640,
      400,
      renderShoeScene({
        width: 640,
        height: 400,
        parts,
        palette: cfg.palette,
        accentHex: cfg.accent,
        secondaryHex: cfg.sec,
        rotation: cfg.rot,
        explode: 0.0,
        scale: 1.05,
      })
    );
  }

  console.log('✅ Generated 7 high-resolution 3D showcase PNGs in public/images/');
}

generateAllShowcaseImages();
