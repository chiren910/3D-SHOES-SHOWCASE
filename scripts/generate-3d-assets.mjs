import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');
const PUBLIC_TEXTURES_DIR = path.join(ROOT_DIR, 'public', 'textures');

fs.mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_TEXTURES_DIR, { recursive: true });

// ============================================================================
// 1. ZERO-DEPENDENCY PNG ENCODER (FOR AUXILIARY STUDIO TEXTURES)
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
// 2. EXTRACT REAL EMBEDDED PBR TEXTURES FROM KHRONOS SCANNED SHOE GLB
// ============================================================================
function extractRealShoeTextures(glbBuffer, gltfJson, binOffset) {
  const textureFileNames = [
    'shoe-orm.jpg',
    'shoe-diffuse-midnight.jpg',
    'shoe-normal.jpg',
    'shoe-diffuse-beach.jpg',
    'shoe-diffuse-street.jpg',
  ];

  gltfJson.images.forEach((img, idx) => {
    const bv = gltfJson.bufferViews[img.bufferView];
    const start = binOffset + (bv.byteOffset || 0);
    const slice = glbBuffer.subarray(start, start + bv.byteLength);
    const outPath = path.join(PUBLIC_TEXTURES_DIR, textureFileNames[idx]);
    fs.writeFileSync(outPath, slice);
  });

  // Also ensure carbon-weave.png exists for carbon torsion accents
  const size = 256;
  const carbon = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const band = Math.floor(x / 8) + Math.floor(y / 8);
      const isWarp = band % 2 === 0;
      const localCoord = isWarp ? x % 8 : y % 8;
      const sheen = Math.sin((localCoord / 8) * Math.PI);
      const val = Math.floor((isWarp ? 28 : 16) + sheen * 42);
      carbon[idx] = val;
      carbon[idx + 1] = val + 2;
      carbon[idx + 2] = val + 5;
      carbon[idx + 3] = 255;
    }
  }
  writeRGBAtoPNG(path.join(PUBLIC_TEXTURES_DIR, 'carbon-weave.png'), size, size, carbon);
}

// ============================================================================
// 3. PARTITION REAL SCANNED SHOE GEOMETRY INTO 12 ANATOMICAL PART NODES
// ============================================================================
const COMPONENT_TO_PART_MAP = new Map([
  // PRT-07: Outsole_Tread (Bottom rubber waffle/chevron outsole tread)
  [11248, 'Outsole_Tread'],

  // PRT-05: Midsole_AeroFoam (Sculpted midsole sidewalls, heel bumper, toe bumper)
  [11660, 'Midsole_AeroFoam'],
  [11690, 'Midsole_AeroFoam'],
  [11695, 'Midsole_AeroFoam'],
  [11696, 'Midsole_AeroFoam'],

  // PRT-04: Carbon_Torsion_Plate (Full-length chassis plate & upper midsole torsion welt)
  [3807, 'Carbon_Torsion_Plate'],
  [11527, 'Carbon_Torsion_Plate'],
  [11606, 'Carbon_Torsion_Plate'],
  [11613, 'Carbon_Torsion_Plate'],
  [11622, 'Carbon_Torsion_Plate'],

  // PRT-06: Air_Energy_Pods (16 recessed lateral & medial kinetic gill accent pods)
  [12075, 'Air_Energy_Pods'],
  [12124, 'Air_Energy_Pods'],
  [12196, 'Air_Energy_Pods'],
  [12219, 'Air_Energy_Pods'],
  [12348, 'Air_Energy_Pods'],
  [12399, 'Air_Energy_Pods'],
  [12498, 'Air_Energy_Pods'],
  [12517, 'Air_Energy_Pods'],
  [12856, 'Air_Energy_Pods'],
  [12909, 'Air_Energy_Pods'],
  [13006, 'Air_Energy_Pods'],
  [13029, 'Air_Energy_Pods'],
  [13183, 'Air_Energy_Pods'],
  [13234, 'Air_Energy_Pods'],
  [13308, 'Air_Energy_Pods'],
  [13327, 'Air_Energy_Pods'],

  // PRT-03: Signature_Blade_Logo (4 swept lateral & medial vector gill blades)
  [12624, 'Signature_Blade_Logo'],
  [12729, 'Signature_Blade_Logo'],
  [13434, 'Signature_Blade_Logo'],
  [13539, 'Signature_Blade_Logo'],

  // PRT-12: Laces_CrossWeave (7 cross-weave lace segments + 2 bow knot loops + 2 aglet ends)
  [324, 'Laces_CrossWeave'],
  [649, 'Laces_CrossWeave'],
  [922, 'Laces_CrossWeave'],
  [1195, 'Laces_CrossWeave'],
  [1390, 'Laces_CrossWeave'],
  [1585, 'Laces_CrossWeave'],
  [1962, 'Laces_CrossWeave'],
  [7243, 'Laces_CrossWeave'],
  [7300, 'Laces_CrossWeave'],
  [7447, 'Laces_CrossWeave'],
  [7450, 'Laces_CrossWeave'],

  // PRT-11: Eyelets_Hardware (16 CNC metallic eyelets & inner lock washers)
  [8239, 'Eyelets_Hardware'],
  [8242, 'Eyelets_Hardware'],
  [8338, 'Eyelets_Hardware'],
  [8551, 'Eyelets_Hardware'],
  [8554, 'Eyelets_Hardware'],
  [8650, 'Eyelets_Hardware'],
  [8863, 'Eyelets_Hardware'],
  [8866, 'Eyelets_Hardware'],
  [8962, 'Eyelets_Hardware'],
  [9175, 'Eyelets_Hardware'],
  [9178, 'Eyelets_Hardware'],
  [9274, 'Eyelets_Hardware'],
  [9538, 'Eyelets_Hardware'],
  [9802, 'Eyelets_Hardware'],
  [10066, 'Eyelets_Hardware'],
  [10330, 'Eyelets_Hardware'],

  // PRT-08: Heel_Counter_Clip (Rear heel stabilizer cup, spine patch & pull tab loop)
  [7641, 'Heel_Counter_Clip'],
  [7790, 'Heel_Counter_Clip'],
  [7859, 'Heel_Counter_Clip'],
  [8025, 'Heel_Counter_Clip'],
  [11874, 'Heel_Counter_Clip'],
  [11880, 'Heel_Counter_Clip'],
  [11894, 'Heel_Counter_Clip'],
  [11917, 'Heel_Counter_Clip'],
  [11919, 'Heel_Counter_Clip'],

  // PRT-09: Tongue_AeroMesh (Padded gusseted mesh tongue & logo crest patch)
  [2722, 'Tongue_AeroMesh'],
  [2734, 'Tongue_AeroMesh'],
  [4537, 'Tongue_AeroMesh'],

  // PRT-10: Insole_Footbed (Interior collar lining & anatomical footbed)
  [4354, 'Insole_Footbed'],
  [4374, 'Insole_Footbed'],
  [5730, 'Insole_Footbed'],
  [5760, 'Insole_Footbed'],

  // PRT-02: Overlays_Exoskeleton (Suede/nubuck structural cage overlays & throat stays)
  [4353, 'Overlays_Exoskeleton'],
  [4357, 'Overlays_Exoskeleton'],
  [4362, 'Overlays_Exoskeleton'],
  [4375, 'Overlays_Exoskeleton'],
  [5635, 'Overlays_Exoskeleton'],
  [5649, 'Overlays_Exoskeleton'],

  // PRT-01: Upper_PrimeKnit (Breathable woven mesh upper shell)
  [5732, 'Upper_PrimeKnit'],
  [5762, 'Upper_PrimeKnit'],
  [5765, 'Upper_PrimeKnit'],
  [5769, 'Upper_PrimeKnit'],
]);

function partitionRealShoeMesh(glbBuffer, gltfJson, binOffset) {
  const getAccessorArray = (accIdx) => {
    const acc = gltfJson.accessors[accIdx];
    const bv = gltfJson.bufferViews[acc.bufferView];
    const start = binOffset + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    if (acc.componentType === 5125) {
      return new Uint32Array(glbBuffer.buffer, glbBuffer.byteOffset + start, acc.count);
    }
    if (acc.componentType === 5123) {
      return new Uint16Array(glbBuffer.buffer, glbBuffer.byteOffset + start, acc.count);
    }
    const mult = acc.type === 'VEC3' ? 3 : acc.type === 'VEC2' ? 2 : 1;
    return new Float32Array(glbBuffer.buffer, glbBuffer.byteOffset + start, acc.count * mult);
  };

  const prim = gltfJson.meshes[0].primitives[0];
  const rawPos = getAccessorArray(prim.attributes.POSITION);
  const rawNorm = getAccessorArray(prim.attributes.NORMAL);
  const rawUv = getAccessorArray(prim.attributes.TEXCOORD_0);
  const rawIdx = getAccessorArray(prim.indices);

  const numVerts = rawPos.length / 3;
  const parent = Array.from({ length: numVerts }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < rawIdx.length; i += 3) {
    union(rawIdx[i], rawIdx[i + 1]);
    union(rawIdx[i + 1], rawIdx[i + 2]);
  }

  // Group triangles by the 12 anatomical part names
  const partTriBuckets = new Map();
  for (const partName of new Set(COMPONENT_TO_PART_MAP.values())) {
    partTriBuckets.set(partName, []);
  }

  for (let i = 0; i < rawIdx.length; i += 3) {
    const root = find(rawIdx[i]);
    const partName = COMPONENT_TO_PART_MAP.get(root) || 'Upper_PrimeKnit';
    const bucket = partTriBuckets.get(partName);
    bucket.push(rawIdx[i], rawIdx[i + 1], rawIdx[i + 2]);
  }

  // Uniform scale so real scanned shoe spans [-1.48, +1.48] matching studio scene & camera
  const SCALE = 1.48;
  const Z_CENTER_OFFSET = 0.032 * SCALE;

  const extractedMeshes = new Map();
  for (const [partName, triIndices] of partTriBuckets.entries()) {
    const globalToLocal = new Map();
    const posList = [];
    const normList = [];
    const uvList = [];
    const localIndices = new Uint32Array(triIndices.length);

    for (let i = 0; i < triIndices.length; i++) {
      const gVert = triIndices[i];
      let lVert = globalToLocal.get(gVert);
      if (lVert === undefined) {
        lVert = posList.length / 3;
        globalToLocal.set(gVert, lVert);

        posList.push(
          rawPos[gVert * 3] * SCALE,
          rawPos[gVert * 3 + 1] * SCALE,
          rawPos[gVert * 3 + 2] * SCALE + Z_CENTER_OFFSET
        );
        normList.push(rawNorm[gVert * 3], rawNorm[gVert * 3 + 1], rawNorm[gVert * 3 + 2]);
        uvList.push(rawUv[gVert * 2], rawUv[gVert * 2 + 1]);
      }
      localIndices[i] = lVert;
    }

    extractedMeshes.set(partName, {
      positions: new Float32Array(posList),
      normals: new Float32Array(normList),
      uvs: new Float32Array(uvList),
      indices: localIndices,
    });
  }

  return extractedMeshes;
}

// ============================================================================
// 4. STUDIO PEDESTAL RING GENERATOR & GLTF 2.0 BINARY (.GLB) PACKAGER
// ============================================================================
function buildLoftedMesh(uSteps, vSteps, evalPointFn) {
  const numVerts = (uSteps + 1) * (vSteps + 1);
  const positions = new Float32Array(numVerts * 3);
  const normals = new Float32Array(numVerts * 3);
  const uvs = new Float32Array(numVerts * 2);

  for (let iu = 0; iu <= uSteps; iu++) {
    const u = iu / uSteps;
    for (let iv = 0; iv <= vSteps; iv++) {
      const v = iv / vSteps;
      const idx = iu * (vSteps + 1) + iv;
      const p = evalPointFn(u, v);
      positions[idx * 3] = p[0];
      positions[idx * 3 + 1] = p[1];
      positions[idx * 3 + 2] = p[2];
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  const indices = new Uint32Array(uSteps * vSteps * 6);
  let ptr = 0;
  for (let iu = 0; iu < uSteps; iu++) {
    for (let iv = 0; iv < vSteps; iv++) {
      const a = iu * (vSteps + 1) + iv;
      const b = (iu + 1) * (vSteps + 1) + iv;
      const c = (iu + 1) * (vSteps + 1) + (iv + 1);
      const d = iu * (vSteps + 1) + (iv + 1);
      indices[ptr++] = a;
      indices[ptr++] = b;
      indices[ptr++] = c;
      indices[ptr++] = a;
      indices[ptr++] = c;
      indices[ptr++] = d;
    }
  }

  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;
    const abx = positions[ib] - positions[ia];
    const aby = positions[ib + 1] - positions[ia + 1];
    const abz = positions[ib + 2] - positions[ia + 2];
    const acx = positions[ic] - positions[ia];
    const acy = positions[ic + 1] - positions[ia + 1];
    const acz = positions[ic + 2] - positions[ia + 2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    normals[ia] += nx;
    normals[ia + 1] += ny;
    normals[ia + 2] += nz;
    normals[ib] += nx;
    normals[ib + 1] += ny;
    normals[ib + 2] += nz;
    normals[ic] += nx;
    normals[ic + 1] += ny;
    normals[ic + 2] += nz;
  }

  for (let i = 0; i < numVerts; i++) {
    const idx = i * 3;
    const len =
      Math.hypot(normals[idx], normals[idx + 1], normals[idx + 2]) || 1;
    normals[idx] /= len;
    normals[idx + 1] /= len;
    normals[idx + 2] /= len;
  }

  return { positions, normals, uvs, indices };
}

function computeBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i] < min[0]) min[0] = positions[i];
    if (positions[i + 1] < min[1]) min[1] = positions[i + 1];
    if (positions[i + 2] < min[2]) min[2] = positions[i + 2];
    if (positions[i] > max[0]) max[0] = positions[i];
    if (positions[i + 1] > max[1]) max[1] = positions[i + 1];
    if (positions[i + 2] > max[2]) max[2] = positions[i + 2];
  }
  return { min, max };
}

function writeGLB(outputPath, sceneName, parts) {
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const materials = [];
  const childNodes = [];
  const binChunks = [];
  let byteOffset = 0;

  const appendBuffer = (typedArray, target) => {
    const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const padLen = (4 - (buf.length % 4)) % 4;
    const padded = padLen > 0 ? Buffer.concat([buf, Buffer.alloc(padLen)]) : buf;
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buf.length,
      target,
    });
    binChunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  };

  parts.forEach((part, idx) => {
    const { mesh, name, material, extras } = part;
    const vertCount = mesh.positions.length / 3;
    const idxCount = mesh.indices.length;
    const bounds = computeBounds(mesh.positions);

    const posView = appendBuffer(mesh.positions, 34962);
    const normView = appendBuffer(mesh.normals, 34962);
    const uvView = appendBuffer(mesh.uvs, 34962);
    const idxView = appendBuffer(mesh.indices, 34963);

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: vertCount,
      type: 'VEC3',
      min: bounds.min,
      max: bounds.max,
    });

    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: vertCount,
      type: 'VEC3',
    });

    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvView,
      componentType: 5126,
      count: vertCount,
      type: 'VEC2',
    });

    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5125,
      count: idxCount,
      type: 'SCALAR',
    });

    materials.push({
      name: `${name}_Mat`,
      pbrMetallicRoughness: {
        baseColorFactor: material.baseColorFactor || [1.0, 1.0, 1.0, 1.0],
        metallicFactor: material.metallicFactor ?? 0.2,
        roughnessFactor: material.roughnessFactor ?? 0.5,
      },
      emissiveFactor: material.emissiveFactor || [0, 0, 0],
      doubleSided: true,
    });

    meshes.push({
      name,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
            TEXCOORD_0: uvAcc,
          },
          indices: idxAcc,
          material: idx,
        },
      ],
    });

    childNodes.push({
      name,
      mesh: idx,
      extras,
    });
  });

  const nodes = [
    {
      name: `${sceneName}_Root`,
      children: childNodes.map((_, i) => i + 1),
    },
    ...childNodes,
  ];

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'AETHER-LABS Photorealistic 3D Scanned Shoe Pipeline v3.0',
    },
    scene: 0,
    scenes: [{ name: sceneName, nodes: [0] }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonString = JSON.stringify(gltfJson);
  const jsonBufRaw = Buffer.from(jsonString, 'utf8');
  const jsonPad = (4 - (jsonBufRaw.length % 4)) % 4;
  const jsonBuf =
    jsonPad > 0
      ? Buffer.concat([jsonBufRaw, Buffer.alloc(jsonPad, 0x20)])
      : jsonBufRaw;

  const binBuf = Buffer.concat(binChunks);
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuf.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  const glbBuffer = Buffer.concat([
    header,
    jsonChunkHeader,
    jsonBuf,
    binChunkHeader,
    binBuf,
  ]);

  fs.writeFileSync(outputPath, glbBuffer);
  return {
    totalLength,
    vertexCount: parts.reduce((s, p) => s + p.mesh.positions.length / 3, 0),
    triangleCount: parts.reduce((s, p) => s + p.mesh.indices.length / 3, 0),
  };
}

function createPedestalAsset() {
  const outerRing = buildLoftedMesh(48, 16, (u, v) => {
    const a = u * Math.PI * 2;
    const b = v * Math.PI * 2;
    const R = 2.15;
    const r = 0.045;
    const x = (R + r * Math.cos(b)) * Math.cos(a);
    const z = (R + r * Math.cos(b)) * Math.sin(a);
    const y = -0.78 + r * Math.sin(b) * 0.5;
    return [x, y, z];
  });

  const innerRing = buildLoftedMesh(48, 12, (u, v) => {
    const a = u * Math.PI * 2;
    const b = v * Math.PI * 2;
    const R = 1.65;
    const r = 0.025;
    const x = (R + r * Math.cos(b)) * Math.cos(a);
    const z = (R + r * Math.cos(b)) * Math.sin(a);
    const y = -0.75 + r * Math.sin(b) * 0.5;
    return [x, y, z];
  });

  return writeGLB(path.join(PUBLIC_MODELS_DIR, 'aero-pedestal.glb'), 'Aero_Studio_Pedestal', [
    {
      name: 'Pedestal_Outer_Ring',
      mesh: outerRing,
      material: { baseColorFactor: [0.12, 0.13, 0.16, 1.0], metallicFactor: 0.9, roughnessFactor: 0.2 },
      extras: { role: 'pedestal_outer' },
    },
    {
      name: 'Pedestal_Inner_Ring',
      mesh: innerRing,
      material: { baseColorFactor: [0.83, 1.0, 0.0, 1.0], metallicFactor: 0.5, roughnessFactor: 0.2, emissiveFactor: [0.4, 0.5, 0.0] },
      extras: { role: 'pedestal_inner' },
    },
  ]);
}

function buildRealShoeAssets() {
  const sourceGlbPath = path.join(PUBLIC_MODELS_DIR, 'MaterialsVariantsShoe.glb');
  if (!fs.existsSync(sourceGlbPath)) {
    throw new Error(`Missing real shoe scan at ${sourceGlbPath}`);
  }

  console.log('👟 Processing Real 3D Scanned Sneaker (MaterialsVariantsShoe.glb)...');
  const glbBuffer = fs.readFileSync(sourceGlbPath);
  const jsonLen = glbBuffer.readUInt32LE(12);
  const gltfJson = JSON.parse(glbBuffer.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen + 8;

  extractRealShoeTextures(glbBuffer, gltfJson, binOffset);
  const meshMap = partitionRealShoeMesh(glbBuffer, gltfJson, binOffset);

  const partMetadata = [
    {
      name: 'Outsole_Tread',
      label: 'Graphene-X Chevron Outsole',
      category: 'Traction Base',
      weightGrams: 34,
      explodeVector: [0, -0.82, 0],
      hotspotPos: [0.48, -0.52, 0.45],
      description: 'Directional micro-chevron graphene rubber compound engineered for 1.42G lateral wet/dry traction.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.1, roughnessFactor: 0.45 },
    },
    {
      name: 'Carbon_Torsion_Plate',
      label: 'Tri-Axial Forged Carbon Plate',
      category: 'Propulsion Core',
      weightGrams: 18,
      explodeVector: [0, -0.48, 0],
      hotspotPos: [-0.15, -0.36, 0.54],
      description: 'Full-length S-curved aerospace carbon weave with lateral stability wings delivering 94.8% propulsion return.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.6, roughnessFactor: 0.3 },
    },
    {
      name: 'Midsole_AeroFoam',
      label: 'Nitrogen Supercritical AeroFoam',
      category: 'Impact Chassis',
      weightGrams: 46,
      explodeVector: [-0.16, -0.25, 0],
      hotspotPos: [-1.18, -0.24, 0.48],
      description: 'Supercritical nitrogen-infused aliphatic TPU chassis with cantilevered rear tail-fin.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.1, roughnessFactor: 0.4 },
    },
    {
      name: 'Air_Energy_Pods',
      label: 'Dual-Chamber NitroPods™',
      category: 'Kinetic Cushioning',
      weightGrams: 22,
      explodeVector: [0.14, -0.3, 0.46],
      hotspotPos: [-0.88, -0.3, 0.48],
      description: 'Recessed lateral and medial kinetic gill pods tuned for instant rebound under high-cadence loads.',
      material: { baseColorFactor: [0.83, 1.0, 0.0, 1.0], metallicFactor: 0.15, roughnessFactor: 0.25 },
    },
    {
      name: 'Upper_PrimeKnit',
      label: 'AeroWeave™ Monofilament Upper',
      category: 'Adaptive Shell',
      weightGrams: 28,
      explodeVector: [0, 0.22, 0],
      hotspotPos: [0.58, 0.22, 0.48],
      description: 'Seamless 3D-knitted ballistic aramid & monofilament upper mapped to 14 distinct foot tension zones.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.1, roughnessFactor: 0.65 },
    },
    {
      name: 'Insole_Footbed',
      label: 'Ortho-Kinetic Lattice Footbed',
      category: 'Interior Ergonomics',
      weightGrams: 11,
      explodeVector: [-0.1, 0.54, 0],
      hotspotPos: [-0.58, 0.22, 0.0],
      description: 'DLS 3D-printed auxetic lattice insole and padded ankle collar lining.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.05, roughnessFactor: 0.55 },
    },
    {
      name: 'Tongue_AeroMesh',
      label: 'Gusseted Neoprene Air-Tongue',
      category: 'Instep Ergonomics',
      weightGrams: 8,
      explodeVector: [-0.18, 0.72, 0],
      hotspotPos: [-0.34, 0.56, 0.0],
      description: '3D-molded perforated neoprene tongue with woven signature crest patch.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.1, roughnessFactor: 0.52 },
    },
    {
      name: 'Overlays_Exoskeleton',
      label: 'TPU Exoskeleton Lockdown Cage',
      category: 'Structural Frame',
      weightGrams: 9,
      explodeVector: [0.22, 0.42, 0.38],
      hotspotPos: [0.12, 0.18, 0.54],
      description: 'Structural nubuck suede and ultrasonic-welded TPU exoskeleton panels anchoring the midfoot.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.2, roughnessFactor: 0.55 },
    },
    {
      name: 'Heel_Counter_Clip',
      label: 'Forged Titanium-Carbon Heel Cup',
      category: 'Rearfoot Lock',
      weightGrams: 12,
      explodeVector: [-0.68, 0.16, 0],
      hotspotPos: [-1.54, 0.04, 0.34],
      description: 'External anatomical rearfoot stabilizer spine and woven pull-loop preventing torsional heel slip.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.5, roughnessFactor: 0.35 },
    },
    {
      name: 'Eyelets_Hardware',
      label: 'CNC Grade-5 Titanium Eyelets',
      category: 'Precision Hardware',
      weightGrams: 4,
      explodeVector: [0.08, 0.84, 0.28],
      hotspotPos: [-0.1, 0.44, 0.3],
      description: 'Micro-machined Grade-5 Ti-6Al-4V toroid eyelets chamfered for zero-friction lace equalization.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.95, roughnessFactor: 0.18 },
    },
    {
      name: 'Laces_CrossWeave',
      label: 'Dyneema® Kevlar Tension Laces',
      category: 'Dynamic Lockdown',
      weightGrams: 5,
      explodeVector: [0.14, 0.98, 0],
      hotspotPos: [0.04, 0.5, 0.0],
      description: 'Hydrophobic braided Dyneema® cordage interwoven with micro-silicone grip threads.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.08, roughnessFactor: 0.6 },
    },
    {
      name: 'Signature_Blade_Logo',
      label: 'AETHER Kinetic Vector Blade',
      category: 'Aerodynamic Crest',
      weightGrams: 3,
      explodeVector: [0.0, 0.32, 0.72],
      hotspotPos: [-0.26, 0.06, 0.58],
      description: 'Swept lateral and medial vector gill blades functioning as boundary-layer vortex generators.',
      material: { baseColorFactor: [0.95, 0.95, 0.95, 1.0], metallicFactor: 0.4, roughnessFactor: 0.35 },
    },
  ];

  const shoeParts = partMetadata.map((meta) => ({
    ...meta,
    mesh: meshMap.get(meta.name),
  }));

  const glbPath = path.join(PUBLIC_MODELS_DIR, 'aether-apex-01.glb');
  const stats = writeGLB(
    glbPath,
    'Aether_Apex_01',
    shoeParts.map((p) => ({
      name: p.name,
      mesh: p.mesh,
      material: p.material,
      extras: {
        label: p.label,
        category: p.category,
        weightGrams: p.weightGrams,
        explodeVector: p.explodeVector,
        hotspotPos: p.hotspotPos,
        description: p.description,
      },
    }))
  );

  const pedestalStats = createPedestalAsset();

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceModel: '/models/MaterialsVariantsShoe.glb',
    flagshipModel: '/models/aether-apex-01.glb',
    pedestalModel: '/models/aero-pedestal.glb',
    textures: {
      diffuseStreet: '/textures/shoe-diffuse-street.jpg',
      diffuseMidnight: '/textures/shoe-diffuse-midnight.jpg',
      diffuseBeach: '/textures/shoe-diffuse-beach.jpg',
      normal: '/textures/shoe-normal.jpg',
      orm: '/textures/shoe-orm.jpg',
    },
    stats: {
      shoeFileSizeKB: Math.round((stats.totalLength / 1024) * 10) / 10,
      shoeVertexCount: stats.vertexCount,
      shoeTriangleCount: stats.triangleCount,
      pedestalTriangleCount: pedestalStats.triangleCount,
      partCount: shoeParts.length,
    },
    parts: shoeParts.map((p) => ({
      id: p.name,
      label: p.label,
      category: p.category,
      weightGrams: p.weightGrams,
      explodeVector: p.explodeVector,
      hotspotPos: p.hotspotPos,
      description: p.description,
      vertexCount: p.mesh.positions.length / 3,
      triangleCount: p.mesh.indices.length / 3,
    })),
  };

  fs.writeFileSync(
    path.join(PUBLIC_MODELS_DIR, 'asset-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`✅ Built Real 3D Scanned Multi-Part Shoe Asset: ${glbPath}`);
  console.log(
    `   ↳ ${stats.vertexCount.toLocaleString()} vertices | ${stats.triangleCount.toLocaleString()} triangles | ${shoeParts.length} parts | ${manifest.stats.shoeFileSizeKB} KB`
  );
}

buildRealShoeAssets();
