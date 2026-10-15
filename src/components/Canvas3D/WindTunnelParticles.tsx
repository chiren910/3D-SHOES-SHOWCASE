import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCROLL_CHOREOGRAPHY } from '../../data/shoeData';
import { scrollStore } from '../../utils/scrollStore';

interface WindTunnelParticlesProps {
  accentHex: string;
  secondaryHex: string;
  windTunnelActive: boolean;
}

const tempVec = new THREE.Vector3();

export const WindTunnelParticles: React.FC<WindTunnelParticlesProps> = React.memo(
  ({ accentHex, secondaryHex, windTunnelActive }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const ribbonsGroupRef = useRef<THREE.Group>(null);
    const evenMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const oddMatRef = useRef<THREE.MeshBasicMaterial>(null);

    const count = 140;
    const { positions, speeds, phases } = useMemo(() => {
      const pos = new Float32Array(count * 3);
      const spd = new Float32Array(count);
      const phs = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
        spd[i] = 0.6 + Math.random() * 1.6;
        phs[i] = Math.random() * Math.PI * 2;
      }
      return { positions: pos, speeds: spd, phases: phs };
    }, []);

    // Generate 8 sleek aerodynamic wind-tunnel laminar flow ribbons
    const ribbonCurves = useMemo(() => {
      const curves: THREE.CatmullRomCurve3[] = [];
      for (let i = 0; i < 8; i++) {
        const zOffset = ((i % 4) - 1.5) * 0.42;
        const yBase = -0.3 + Math.floor(i / 2) * 0.25;
        const archDeflection = Math.exp(-Math.pow(zOffset / 0.7, 2)) * 0.36;

        const pts = [
          new THREE.Vector3(3.2, yBase - 0.1, zOffset),
          new THREE.Vector3(1.5, yBase + archDeflection * 0.35, zOffset * 1.05),
          new THREE.Vector3(0.0, yBase + archDeflection * 0.95, zOffset * 1.15),
          new THREE.Vector3(-1.5, yBase + archDeflection * 0.75, zOffset * 1.05),
          new THREE.Vector3(-3.2, yBase + 0.15, zOffset * 0.9),
        ];
        curves.push(new THREE.CatmullRomCurve3(pts));
      }
      return curves;
    }, []);

    useFrame((state, delta) => {
      const dt = Math.min(delta, 0.05);
      const stage = SCROLL_CHOREOGRAPHY[scrollStore.activeSection] || SCROLL_CHOREOGRAPHY[0];
      const windIntensity = stage.windIntensity;
      const effectiveWind = windTunnelActive ? Math.max(0.95, windIntensity) : windIntensity;
      const speedMultiplier =
        1.0 + effectiveWind * 3.0 + Math.min(3.5, Math.abs(scrollStore.velocity) * 0.06);

      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const elapsed = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
          arr[i * 3] -= speeds[i] * speedMultiplier * dt * 1.3;
          arr[i * 3 + 1] += Math.sin(elapsed * 1.4 + phases[i]) * dt * 0.1;
          if (arr[i * 3] < -5.0) {
            arr[i * 3] = 5.0;
          }
        }
        posAttr.needsUpdate = true;
      }

      if (ribbonsGroupRef.current) {
        const showRibbons = windTunnelActive || windIntensity > 0.55;
        const targetScale = showRibbons ? 1 : 0.0001;
        tempVec.set(targetScale, targetScale, targetScale);
        ribbonsGroupRef.current.scale.lerp(tempVec, dt * 6);
        ribbonsGroupRef.current.visible = ribbonsGroupRef.current.scale.x > 0.01;

        if (ribbonsGroupRef.current.visible) {
          const elapsed = state.clock.elapsedTime;
          const baseAlpha = windTunnelActive ? 0.42 : Math.max(0, (windIntensity - 0.45) * 0.65);
          if (evenMatRef.current) {
            evenMatRef.current.opacity = baseAlpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 4.2)));
          }
          if (oddMatRef.current) {
            oddMatRef.current.opacity = baseAlpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 4.2 - 1.4)));
          }
        }
      }
    });

    return (
      <group>
        <points ref={pointsRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
              count={count}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={accentHex}
            size={0.032}
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        <group ref={ribbonsGroupRef}>
          {ribbonCurves.map((curve, idx) => (
            <mesh key={idx}>
              <tubeGeometry args={[curve, 24, 0.006, 5, false]} />
              {idx % 2 === 0 ? (
                <meshBasicMaterial
                  ref={idx === 0 ? evenMatRef : undefined}
                  color={accentHex}
                  transparent
                  opacity={0.3}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              ) : (
                <meshBasicMaterial
                  ref={idx === 1 ? oddMatRef : undefined}
                  color={secondaryHex}
                  transparent
                  opacity={0.3}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              )}
            </mesh>
          ))}
        </group>
      </group>
    );
  }
);
