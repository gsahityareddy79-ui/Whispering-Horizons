import * as THREE from 'three';
import { createOceanNormalMap } from './proceduralTextures';

export interface OceanWorld {
  oceanMesh: THREE.Mesh;
  waterfallMesh: THREE.Mesh;
  foamRing: THREE.Mesh;
  update: (time: number) => void;
}

export function createOceanWorld(scene: THREE.Scene, isLowQuality: boolean = false): OceanWorld {
  const oceanSize = 800;
  const segments = isLowQuality ? 60 : 120;
  const oceanGeom = new THREE.PlaneGeometry(oceanSize, oceanSize, segments, segments);
  oceanGeom.rotateX(-Math.PI / 2);

  const oceanNormalMap = createOceanNormalMap();

  // High-fidelity PBR Ocean Material with specular sun glint
  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#07364a',
    roughness: 0.08,
    metalness: 0.18,
    normalMap: oceanNormalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    transparent: true,
    opacity: 0.92,
  });

  const oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
  oceanMesh.position.y = 0.0;
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  // Shoreline breathing foam ring
  const ringGeom = new THREE.RingGeometry(76, 92, 64);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#d4f7ff',
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const foamRing = new THREE.Mesh(ringGeom, ringMat);
  foamRing.position.y = 0.06;
  scene.add(foamRing);

  // Distant Waterfall Cascading into Sea at (44, 12)
  const wfGeom = new THREE.PlaneGeometry(6, 14, 8, 20);
  const wfPos = wfGeom.attributes.position;
  for (let i = 0; i < wfPos.count; i++) {
    const y = wfPos.getY(i);
    // Natural outward curve as water plunges over cliff
    const arc = Math.sin((y / 14 + 0.5) * Math.PI) * 1.2;
    wfPos.setZ(i, wfPos.getZ(i) + arc);
  }
  wfGeom.computeVertexNormals();

  const wfMat = new THREE.MeshStandardMaterial({
    color: '#b6e8f7',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.86,
    normalMap: oceanNormalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
  });

  const waterfallMesh = new THREE.Mesh(wfGeom, wfMat);
  waterfallMesh.position.set(44, 6.2, 12);
  waterfallMesh.rotation.y = -Math.PI / 4;
  scene.add(waterfallMesh);

  // Upper mountain feeder stream
  const feederGeom = new THREE.PlaneGeometry(5, 18);
  feederGeom.rotateX(-Math.PI / 2);
  const feederMesh = new THREE.Mesh(feederGeom, wfMat);
  feederMesh.position.set(38, 12.8, 8);
  feederMesh.rotation.y = -Math.PI / 4;
  scene.add(feederMesh);

  // Retain baseline Y positions for Gerstner wave displacement
  const origY = new Float32Array(oceanGeom.attributes.position.count);
  for (let i = 0; i < origY.length; i++) {
    origY[i] = oceanGeom.attributes.position.getY(i);
  }

  return {
    oceanMesh,
    waterfallMesh,
    foamRing,
    update: (time: number) => {
      // 1. Gerstner & Directional Ocean Swell Simulation
      const pos = oceanGeom.attributes.position;
      const step = isLowQuality ? 2 : 1;

      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const dist = Math.hypot(x, z);

        // Calm water near island shore, rolling waves in open sea
        const waveDamp = Math.min(1.0, Math.max(0.08, (dist - 65) / 50));

        // Multi-frequency wave formula
        const w1 = Math.sin(x * 0.045 + z * 0.035 + time * 1.6) * 0.45;
        const w2 = Math.cos(x * 0.08 - z * 0.06 + time * 1.2) * 0.22;
        const w3 = Math.sin((x + z) * 0.15 - time * 2.2) * 0.08;

        const totalWave = (w1 + w2 + w3) * waveDamp;
        pos.setY(i, origY[i] + totalWave);
      }
      pos.needsUpdate = true;

      // 2. Normal Map Dual Scrolling UVs
      oceanNormalMap.offset.x = (time * 0.035) % 1;
      oceanNormalMap.offset.y = (time * 0.025) % 1;

      // 3. Shoreline Foam Surge Breathing Animation
      const surge = Math.sin(time * 0.8) * 0.04;
      foamRing.scale.set(1 + surge, 1 + surge, 1 + surge);
      foamRing.position.y = 0.08 + Math.sin(time * 0.8) * 0.04;
    },
  };
}
