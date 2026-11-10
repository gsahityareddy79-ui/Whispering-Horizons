import * as THREE from 'three';
import { createWaterFoamTexture } from './proceduralTextures';

export interface OceanWorld {
  oceanMesh: THREE.Mesh;
  waterfallMesh: THREE.Mesh;
  update: (time: number) => void;
}

export function createOceanWorld(scene: THREE.Scene, isLowQuality: boolean = false): OceanWorld {
  // Vast ocean expanse
  const oceanSize = 600;
  const oceanSegments = isLowQuality ? 40 : 80;
  const oceanGeom = new THREE.PlaneGeometry(oceanSize, oceanSize, oceanSegments, oceanSegments);
  oceanGeom.rotateX(-Math.PI / 2);

  const foamTex = createWaterFoamTexture();

  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#08485e',
    roughness: 0.12,
    metalness: 0.15,
    bumpMap: foamTex,
    bumpScale: 0.18,
    transparent: true,
    opacity: 0.88,
  });

  const oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
  oceanMesh.position.y = 0.0;
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  // Shoreline foam ring
  const ringGeom = new THREE.RingGeometry(72, 85, 48);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    map: foamTex,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    color: '#c2f0f7',
  });
  const foamRing = new THREE.Mesh(ringGeom, ringMat);
  foamRing.position.y = 0.08;
  scene.add(foamRing);

  // Distant Waterfall at (45, 10)
  // Waterfall falls from cliff height ~8.5m down to sea level 0m
  const wfGeom = new THREE.PlaneGeometry(5, 11, 8, 16);
  // Curve slightly outward like flowing water
  const wfPos = wfGeom.attributes.position;
  for (let i = 0; i < wfPos.count; i++) {
    const y = wfPos.getY(i);
    // Arc forward in Z
    const curve = Math.sin((y / 11 + 0.5) * Math.PI) * 0.8;
    wfPos.setZ(i, wfPos.getZ(i) + curve);
  }
  wfGeom.computeVertexNormals();

  const wfMat = new THREE.MeshStandardMaterial({
    color: '#b0e4f5',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    bumpMap: foamTex,
    bumpScale: 0.25,
  });

  const waterfallMesh = new THREE.Mesh(wfGeom, wfMat);
  waterfallMesh.position.set(45, 5.0, 10);
  waterfallMesh.rotation.y = -Math.PI / 4;
  scene.add(waterfallMesh);

  // Top pool / stream before falling
  const streamGeom = new THREE.PlaneGeometry(4, 12);
  streamGeom.rotateX(-Math.PI / 2);
  const streamMesh = new THREE.Mesh(streamGeom, wfMat);
  streamMesh.position.set(41, 9.8, 8);
  streamMesh.rotation.y = -Math.PI / 4;
  scene.add(streamMesh);

  // Retain original vertex Y positions for procedural wave swell
  const origY = new Float32Array(oceanGeom.attributes.position.count);
  for (let i = 0; i < origY.length; i++) {
    origY[i] = oceanGeom.attributes.position.getY(i);
  }

  return {
    oceanMesh,
    waterfallMesh,
    update: (time: number) => {
      // Gentle swell on ocean vertices (only every few frames or gentle sine)
      const pos = oceanGeom.attributes.position;
      const step = isLowQuality ? 2 : 1;
      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Avoid disturbing close shoreline violently
        const dist = Math.hypot(x, z);
        const damp = Math.min(1, Math.max(0, (dist - 60) / 40));
        const wave = (Math.sin(x * 0.05 + time * 1.5) + Math.cos(z * 0.05 + time * 1.2)) * 0.35 * damp;
        pos.setY(i, origY[i] + wave);
      }
      pos.needsUpdate = true;

      // Scroll waterfall texture UVs downwards
      if (wfMat.bumpMap) {
        wfMat.bumpMap.offset.y = -(time * 1.6) % 1;
      }
      if (oceanMat.bumpMap) {
        oceanMat.bumpMap.offset.x = (time * 0.03) % 1;
        oceanMat.bumpMap.offset.y = (time * 0.02) % 1;
      }
    },
  };
}
