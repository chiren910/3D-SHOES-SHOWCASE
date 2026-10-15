import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  ColorwayPreset,
  CustomPartOverrides,
  SHOE_PARTS_SPECS,
  SCROLL_CHOREOGRAPHY,
} from '../../data/shoeData';
import { soundFX } from '../../utils/soundEngine';
import { scrollStore } from '../../utils/scrollStore';

interface ShoeModel3DProps {
  colorway: ColorwayPreset;
  customOverrides: CustomPartOverrides;
  manualExplode: number | null;
  xrayMode: boolean;
  freeOrbitMode: boolean;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  cadenceMode: 'idle' | 'walk' | 'tempo' | 'sprint';
}

// Pre-allocated vectors to prevent garbage collection inside 120FPS useFrame loop
const targetPosVec = new THREE.Vector3();
const pedScaleVec = new THREE.Vector3();

export const ShoeModel3D: React.FC<ShoeModel3DProps> = React.memo(
  ({
    colorway,
    customOverrides,
    manualExplode,
    xrayMode,
    freeOrbitMode,
    selectedPartId,
    onSelectPart,
    cadenceMode,
  }) => {
    const rootGroupRef = useRef<THREE.Group>(null);
    const floatGroupRef = useRef<THREE.Group>(null);
    const pedestalRef = useRef<THREE.Group>(null);
    const shadowMeshRef = useRef<THREE.Mesh>(null);
    const partMeshRefs = useRef<Record<string, THREE.Mesh>>({});
    const partMatRefs = useRef<Record<string, THREE.MeshStandardMaterial>>({});
    const currentExplodeRef = useRef(0);

    // Load real 3D scanned multi-part shoe GLB and baked PBR diffuse + normal + ORM scan maps
    const shoeGLTF = useGLTF('/models/aether-apex-01.glb');
    const pedestalGLTF = useGLTF('/models/aero-pedestal.glb');
    const textures = useTexture({
      diffuseStreet: '/textures/shoe-diffuse-street.jpg',
      diffuseMidnight: '/textures/shoe-diffuse-midnight.jpg',
      diffuseBeach: '/textures/shoe-diffuse-beach.jpg',
      shoeNormal: '/textures/shoe-normal.jpg',
      shoeOrm: '/textures/shoe-orm.jpg',
    });

    // Generate a 1-triangle-pair soft radial shadow texture once
    const softShadowTexture = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
      grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.36)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }, []);

    // Extract the 12 anatomical part geometries from the real shoe scan once
    const extractedParts = useMemo(() => {
      const list: Array<{ id: string; geometry: THREE.BufferGeometry }> = [];
      shoeGLTF.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry.attributes.uv && !mesh.geometry.attributes.uv1) {
            mesh.geometry.setAttribute('uv1', mesh.geometry.attributes.uv);
          }
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
          list.push({
            id: mesh.name,
            geometry: mesh.geometry,
          });
        }
      });
      return list;
    }, [shoeGLTF]);

    const pedestalMeshes = useMemo(() => {
      const list: Array<{ id: string; geometry: THREE.BufferGeometry }> = [];
      pedestalGLTF.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
          list.push({ id: mesh.name, geometry: mesh.geometry });
        }
      });
      return list;
    }, [pedestalGLTF]);

    // Create MeshStandardMaterial instances once per part wired to the real scanned PBR maps
    const materialsByPart = useMemo(() => {
      [textures.diffuseStreet, textures.diffuseMidnight, textures.diffuseBeach].forEach((t) => {
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.needsUpdate = true;
      });

      textures.shoeNormal.flipY = false;
      textures.shoeNormal.colorSpace = THREE.NoColorSpace;
      textures.shoeNormal.anisotropy = 4;
      textures.shoeNormal.needsUpdate = true;

      textures.shoeOrm.flipY = false;
      textures.shoeOrm.colorSpace = THREE.NoColorSpace;
      textures.shoeOrm.anisotropy = 4;
      textures.shoeOrm.needsUpdate = true;

      const map: Record<string, THREE.MeshStandardMaterial> = {};
      for (const spec of SHOE_PARTS_SPECS) {
        const mat = new THREE.MeshStandardMaterial({
          map: textures.diffuseStreet,
          normalMap: textures.shoeNormal,
          normalScale: new THREE.Vector2(1.0, 1.0),
          aoMap: textures.shoeOrm,
          aoMapIntensity: 1.0,
          roughnessMap: textures.shoeOrm,
          roughness: 0.85,
          metalness: 0.1,
          envMapIntensity: 1.35,
          side: THREE.DoubleSide,
        });

        if (spec.id === 'Eyelets_Hardware') {
          mat.metalnessMap = textures.shoeOrm;
          mat.metalness = 1.0;
          mat.roughness = 0.4;
        }

        map[spec.id] = mat;
      }
      partMatRefs.current = map;
      return map;
    }, [textures]);

    // Dispose imperative GPU materials and canvas textures on unmount
    useEffect(() => {
      return () => {
        softShadowTexture.dispose();
        Object.values(materialsByPart).forEach((mat) => mat.dispose());
      };
    }, [softShadowTexture, materialsByPart]);

    // Update material uniforms WITHOUT triggering shader recompilations during scroll
    useEffect(() => {
      const p = colorway.parts;
      const activeDiffuse =
        colorway.id === 'cryo-zero'
          ? textures.diffuseMidnight
          : colorway.id === 'solar-flare'
          ? textures.diffuseBeach
          : textures.diffuseStreet;

      for (const spec of SHOE_PARTS_SPECS) {
        const mat = materialsByPart[spec.id];
        if (!mat) continue;

        if (mat.map !== activeDiffuse) {
          mat.map = activeDiffuse;
        }

        const partPreset = p[spec.id as keyof typeof p];
        // Use #ffffff on main scanned fabric/sole parts by default so the authentic photographic scan texture shines through
        const isScannedBasePart =
          spec.id === 'Upper_PrimeKnit' ||
          spec.id === 'Overlays_Exoskeleton' ||
          spec.id === 'Midsole_AeroFoam' ||
          spec.id === 'Tongue_AeroMesh' ||
          spec.id === 'Laces_CrossWeave';

        let targetColor = isScannedBasePart ? '#ffffff' : partPreset.color;
        let roughness = isScannedBasePart
          ? 0.85
          : 'roughness' in partPreset
          ? partPreset.roughness
          : 0.35;
        let metalness =
          spec.id === 'Eyelets_Hardware'
            ? 1.0
            : isScannedBasePart
            ? 0.08
            : 'metalness' in partPreset
            ? partPreset.metalness
            : 0.25;
        let emissiveHex = 'emissive' in partPreset ? partPreset.emissive : '#000000';
        const emissiveIntensity =
          'emissiveIntensity' in partPreset ? partPreset.emissiveIntensity : 0.0;

        if (spec.id === 'Upper_PrimeKnit' && customOverrides.upperColor) {
          targetColor = customOverrides.upperColor;
        }
        if (spec.id === 'Upper_PrimeKnit' && customOverrides.upperFinish) {
          if (customOverrides.upperFinish === 'matte-leather') {
            roughness = 0.35;
            metalness = 0.18;
          } else if (customOverrides.upperFinish === 'cyber-iridescent') {
            roughness = 0.2;
            metalness = 0.78;
          }
        }

        if (
          (spec.id === 'Overlays_Exoskeleton' || spec.id === 'Heel_Counter_Clip') &&
          customOverrides.cageColor
        ) {
          targetColor = customOverrides.cageColor;
        }
        if (
          (spec.id === 'Overlays_Exoskeleton' || spec.id === 'Heel_Counter_Clip') &&
          customOverrides.cageFinish
        ) {
          if (customOverrides.cageFinish === 'forged-carbon') {
            roughness = 0.2;
            metalness = 0.88;
          } else if (customOverrides.cageFinish === 'brushed-alloy') {
            roughness = 0.25;
            metalness = 0.96;
          }
        }

        if (spec.id === 'Midsole_AeroFoam' && customOverrides.midsoleColor) {
          targetColor = customOverrides.midsoleColor;
        }

        if (
          (spec.id === 'Air_Energy_Pods' ||
            spec.id === 'Signature_Blade_Logo' ||
            spec.id === 'Insole_Footbed') &&
          customOverrides.accentColor
        ) {
          targetColor = customOverrides.accentColor;
          if (spec.id !== 'Insole_Footbed') {
            emissiveHex = customOverrides.accentColor;
          }
        }

        if (spec.id === 'Laces_CrossWeave' && customOverrides.lacesColor) {
          targetColor = customOverrides.lacesColor;
        }

        if (spec.id === 'Eyelets_Hardware' && customOverrides.hardwareColor) {
          targetColor = customOverrides.hardwareColor;
        }

        const isSelected = selectedPartId === spec.id;
        const needsShaderRebuild =
          mat.wireframe !== xrayMode || mat.transparent !== xrayMode;

        if (xrayMode) {
          mat.wireframe = true;
          mat.transparent = true;
          mat.opacity = isSelected ? 0.95 : 0.38;
          mat.color.set(isSelected ? colorway.accentHex : '#00F0FF');
          mat.emissive.set(isSelected ? colorway.accentHex : '#00F0FF');
          mat.emissiveIntensity = isSelected ? 0.9 : 0.35;
        } else {
          mat.wireframe = false;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.color.set(targetColor);
          mat.roughness = roughness;
          mat.metalness = metalness;
          mat.emissive.set(isSelected ? colorway.accentHex : emissiveHex);
          mat.emissiveIntensity = isSelected
            ? Math.max(0.28, emissiveIntensity)
            : emissiveIntensity;
        }

        // Only trigger WebGL program re-validation when X-Ray mode is explicitly toggled
        if (needsShaderRebuild) {
          mat.needsUpdate = true;
        }
      }
    }, [colorway, customOverrides, xrayMode, selectedPartId, materialsByPart, textures]);

    // 120FPS Animation Loop locked 1-to-1 with scrollStore.progress (Zero React Re-Renders & Zero Frame Mismatch!)
    useFrame((state, delta) => {
      const dt = Math.min(delta, 0.05);
      const t = state.clock.elapsedTime;
      const scrollProgress = scrollStore.progress;
      const currentSec = scrollStore.activeSection;

      // 1. Evaluate exact scroll choreography pose from scrollStore.progress [0..1]
      const totalStages = SCROLL_CHOREOGRAPHY.length - 1;
      const scaledScroll = Math.max(0, Math.min(totalStages, scrollProgress * totalStages));
      const idx0 = Math.min(totalStages - 1, Math.floor(scaledScroll));
      const idx1 = idx0 + 1;
      const frac = scaledScroll - idx0;
      const smoothFrac = frac * frac * (3 - 2 * frac);

      const pose0 = SCROLL_CHOREOGRAPHY[idx0];
      const pose1 = SCROLL_CHOREOGRAPHY[idx1];

      targetPosVec.set(
        THREE.MathUtils.lerp(pose0.shoePos[0], pose1.shoePos[0], smoothFrac),
        THREE.MathUtils.lerp(pose0.shoePos[1], pose1.shoePos[1], smoothFrac),
        THREE.MathUtils.lerp(pose0.shoePos[2], pose1.shoePos[2], smoothFrac)
      );

      let targetRotX = THREE.MathUtils.lerp(pose0.shoeRot[0], pose1.shoeRot[0], smoothFrac);
      let targetRotY = THREE.MathUtils.lerp(pose0.shoeRot[1], pose1.shoeRot[1], smoothFrac);
      let targetRotZ = THREE.MathUtils.lerp(pose0.shoeRot[2], pose1.shoeRot[2], smoothFrac);

      const targetScale = THREE.MathUtils.lerp(pose0.shoeScale, pose1.shoeScale, smoothFrac);
      const scrollExplode = THREE.MathUtils.lerp(
        pose0.explodeAmount,
        pose1.explodeAmount,
        smoothFrac
      );

      if (freeOrbitMode) {
        targetPosVec.set(0, 0.08, 0);
        targetRotX = 0.12;
        targetRotY = -0.45;
        targetRotZ = -0.04;
      }

      // Lock directly to Lenis scroll progress during scroll to prevent any frame lag/mismatch;
      // use frame-rate-independent smoothing only when switching into/out of freeOrbitMode.
      const blend = freeOrbitMode ? 1 - Math.exp(-12 * dt) : 1.0;

      if (rootGroupRef.current) {
        if (blend >= 0.999) {
          rootGroupRef.current.position.copy(targetPosVec);
          rootGroupRef.current.rotation.set(targetRotX, targetRotY, targetRotZ);
          rootGroupRef.current.scale.setScalar(targetScale);
        } else {
          rootGroupRef.current.position.lerp(targetPosVec, blend);
          rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            rootGroupRef.current.rotation.x,
            targetRotX,
            blend
          );
          rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            rootGroupRef.current.rotation.y,
            targetRotY,
            blend
          );
          rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            rootGroupRef.current.rotation.z,
            targetRotZ,
            blend
          );
          const s = THREE.MathUtils.lerp(rootGroupRef.current.scale.x, targetScale, blend);
          rootGroupRef.current.scale.setScalar(s);
        }

        if (shadowMeshRef.current) {
          shadowMeshRef.current.position.x = rootGroupRef.current.position.x;
          shadowMeshRef.current.position.z = rootGroupRef.current.position.z;
        }
      }

      // 2. Subtle zero-gravity levitation + Biomechanics Cadence Compression
      let cadenceFreq = 1.6;
      let cadenceAmp = 0.035;
      let soleCompression = 0;

      if (cadenceMode === 'walk') {
        cadenceFreq = 3.2;
        cadenceAmp = 0.065;
        soleCompression = Math.max(0, Math.sin(t * cadenceFreq)) * 0.04;
      } else if (cadenceMode === 'tempo') {
        cadenceFreq = 6.0;
        cadenceAmp = 0.095;
        soleCompression = Math.max(0, Math.sin(t * cadenceFreq)) * 0.075;
      } else if (cadenceMode === 'sprint') {
        cadenceFreq = 9.5;
        cadenceAmp = 0.125;
        soleCompression = Math.max(0, Math.sin(t * cadenceFreq)) * 0.11;
      }

      if (floatGroupRef.current) {
        floatGroupRef.current.position.y = Math.sin(t * cadenceFreq) * cadenceAmp;
        floatGroupRef.current.rotation.z =
          cadenceMode !== 'idle' ? Math.cos(t * cadenceFreq) * 0.055 : Math.sin(t * 1.1) * 0.015;
      }

      // 3. 12-Part 3D Exploded View Disassembly (Locked 1-to-1 during scroll, smoothed on manual button toggle)
      const effectiveManual =
        scrollStore.manualExplode !== null ? scrollStore.manualExplode : manualExplode;
      const desiredExplode = effectiveManual !== null ? effectiveManual : scrollExplode;
      if (effectiveManual !== null) {
        currentExplodeRef.current = THREE.MathUtils.lerp(
          currentExplodeRef.current,
          desiredExplode,
          1 - Math.exp(-14 * dt)
        );
      } else {
        currentExplodeRef.current = desiredExplode;
      }
      const exp = currentExplodeRef.current;

      for (let i = 0; i < SHOE_PARTS_SPECS.length; i++) {
        const spec = SHOE_PARTS_SPECS[i];
        const mesh = partMeshRefs.current[spec.id];
        if (!mesh) continue;

        const isSelected = selectedPartId === spec.id && currentSec === 2;
        const selectBoost = isSelected ? 1.25 : 1.0;

        let cadenceYOffset = 0;
        if (
          cadenceMode !== 'idle' &&
          (spec.id === 'Outsole_Tread' ||
            spec.id === 'Carbon_Torsion_Plate' ||
            spec.id === 'Air_Energy_Pods')
        ) {
          cadenceYOffset = soleCompression;
        }

        mesh.position.set(
          spec.explodeVector[0] * exp * selectBoost,
          spec.explodeVector[1] * exp * selectBoost + cadenceYOffset,
          spec.explodeVector[2] * exp * selectBoost
        );
      }

      // Pulse Nitro-Air Pods emissive glow with cadence & time
      const podsMat = partMatRefs.current['Air_Energy_Pods'];
      if (podsMat && !xrayMode) {
        const baseEmissive = colorway.parts.Air_Energy_Pods.emissiveIntensity;
        const pulse = 0.22 * Math.sin(t * (cadenceMode === 'idle' ? 2.8 : cadenceFreq * 2));
        podsMat.emissiveIntensity = baseEmissive + pulse + soleCompression * 5.0;
      }

      // Rotate studio turbine pedestal ring
      if (pedestalRef.current) {
        pedestalRef.current.rotation.y = t * 0.25;
        const pedVisible = currentSec === 0 || currentSec === 4 || freeOrbitMode;
        const targetPedScale = pedVisible ? 1 : 0.0001;
        pedScaleVec.set(targetPedScale, targetPedScale, targetPedScale);
        pedestalRef.current.scale.lerp(pedScaleVec, 1 - Math.exp(-10 * dt));
        pedestalRef.current.visible = pedestalRef.current.scale.x > 0.01;
      }
    });

    return (
      <group>
        <group ref={rootGroupRef}>
          <group ref={floatGroupRef}>
            {extractedParts.map(({ id, geometry }) => (
              <mesh
                key={id}
                name={id}
                ref={(el) => {
                  if (el) partMeshRefs.current[id] = el;
                }}
                geometry={geometry}
                material={materialsByPart[id]}
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playHoverTick();
                  onSelectPart(selectedPartId === id ? null : id);
                }}
              />
            ))}
          </group>
        </group>

        {/* Ultra-fast 2-triangle Studio Contact Shadow Plane */}
        <mesh
          ref={shadowMeshRef}
          position={[0.15, -0.82, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[4.4, 2.3]} />
          <meshBasicMaterial
            map={softShadowTexture}
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </mesh>

        {/* Companion 3D Studio Pedestal Ring Asset */}
        <group ref={pedestalRef} position={[0, -0.18, 0]}>
          {pedestalMeshes.map(({ id, geometry }) => (
            <mesh key={id} geometry={geometry}>
              <meshStandardMaterial
                color={id.includes('Inner') ? colorway.accentHex : '#181B24'}
                emissive={id.includes('Inner') ? colorway.accentHex : '#000000'}
                emissiveIntensity={id.includes('Inner') ? 0.8 : 0}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      </group>
    );
  }
);

useGLTF.preload('/models/aether-apex-01.glb');
useGLTF.preload('/models/aero-pedestal.glb');
