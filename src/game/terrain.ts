import * as THREE from 'three';
import {
  createGrassMaterials,
  createCliffRockMaterials,
  createCobblestoneMaterials,
  createWetSandMaterials,
  createWoodPlankMaterials,
} from './proceduralTextures';

export const ISLAND_RADIUS = 96;

// Main walking path coordinates winding through the island
export const PATH_WAYPOINTS: [number, number][] = [
  [0, 56],      // Pelican Cove Pier & Beach
  [-6, 44],     // Sandy cove trail entrance
  [-14, 30],    // Wildflower meadow junction
  [-22, 12],    // Ancient Whisper Shrine
  [-12, -4],    // Valley Creek Crossing & Rustic Bridge
  [6, -14],     // Lower Lighthouse switchback
  [18, -27],    // Lighthouse Summit Plateau
  [-16, -26],   // Falcon's Perch Sunset Lookout
  [28, 4],      // Waterfall gorge path
  [42, 11],     // Emerald Cascade overlook
];

export function distanceToPath(x: number, z: number): number {
  let minDist = 999;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [x1, z1] = PATH_WAYPOINTS[i];
    const [x2, z2] = PATH_WAYPOINTS[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    let t = ((x - x1) * dx + (z - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx;
    const pz = z1 + t * dz;
    const d = Math.hypot(x - px, z - pz);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Domain-warped natural geological noise (removes artificial/repetitive patterns)
function domainWarpNoise(x: number, z: number): number {
  const qx = Math.sin(x * 0.02 + z * 0.015) * 8.0;
  const qz = Math.cos(x * 0.015 + z * 0.02) * 8.0;
  const rx = Math.sin((x + qx) * 0.035) * 4.0;
  const rz = Math.cos((z + qz) * 0.035) * 4.0;

  return (
    Math.sin((x + rx) * 0.032 + (z + rz) * 0.026) * 4.6 +
    Math.cos((x - rx) * 0.062 - (z - rz) * 0.052) * 2.8 +
    Math.sin(x * 0.12 + z * 0.11) * 1.4 +
    Math.cos(x * 0.24 - z * 0.21) * 0.6 +
    Math.sin(x * 0.45 + z * 0.4) * 0.22
  );
}

export function getTerrainHeight(x: number, z: number): number {
  const dist = Math.hypot(x, z);

  if (dist > ISLAND_RADIUS + 35) {
    return -16;
  }

  // Smooth organic coast radial falloff
  const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 1.85));
  let h = domainWarpNoise(x, z);

  // 1. Central/North-East Mountain Peak (Lighthouse Summit at 18, -27)
  const distSummit = Math.hypot(x - 18, z - (-27));
  if (distSummit < 38) {
    const s = Math.max(0, 1 - distSummit / 38);
    h += Math.pow(s, 1.7) * 18.0;
  }

  // 2. Rugged Western & Northern Sea Cliffs (around x < 0, z < -8)
  if (z < -8) {
    const cFactor = Math.max(0, -z / 65);
    h += cFactor * 8.6;
    if (dist > 48 && z < -18) {
      const drop = Math.pow((dist - 48) / 28, 2.2) * 24;
      h -= drop;
    }
  }

  // 3. Falcon's Perch Scenic Bluff at (-16, -26)
  const distPerch = Math.hypot(x - (-16), z - (-26));
  if (distPerch < 18) {
    const p = Math.max(0, 1 - distPerch / 18);
    h += p * 5.8;
  }

  // 4. Southern Beach Bay at (0, 52)
  const distBeach = Math.hypot(x - 0, z - 52);
  if (distBeach < 38) {
    const b = Math.max(0, 1 - distBeach / 38);
    h = h * (1 - b * 0.88) + b * 0.45;
  }

  // 5. Eastern Waterfall Gorge at (42, 11)
  const distGorge = Math.hypot(x - 42, z - 11);
  if (distGorge < 24) {
    const g = Math.max(0, 1 - distGorge / 24);
    h -= g * 7.8;
  }

  let finalH = (h + 4.2) * mask;

  // Carve smooth footpath
  const pDist = distanceToPath(x, z);
  if (pDist < 2.5 && finalH > 0.5) {
    const indent = Math.max(0, 1 - pDist / 2.5);
    finalH -= indent * 0.28;
  }

  // Shore water blending
  if (dist > ISLAND_RADIUS - 8) {
    const t = (dist - (ISLAND_RADIUS - 8)) / 8;
    finalH = THREE.MathUtils.lerp(finalH, -3.5, Math.min(1, t));
  }

  return finalH;
}

export function getTerrainNormal(x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  const eps = 0.4;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  out.set((hL - hR) / (2 * eps), 1.0, (hD - hU) / (2 * eps)).normalize();
  return out;
}

export interface TerrainWorld {
  mesh: THREE.Mesh;
  trees: THREE.InstancedMesh;
  bushes: THREE.InstancedMesh;
  rocks: THREE.InstancedMesh;
  flowers: THREE.InstancedMesh;
  grassBlades: THREE.InstancedMesh;
  seaStacks: THREE.Group;
  distantMountains: THREE.Group;
  dock: THREE.Group;
  bridge: THREE.Group;
  benchRest: THREE.Group;
  fireEmbers: THREE.Points;
  fireLight: THREE.PointLight;
  waterfallSpray: THREE.Points;
  fireflies: THREE.Points;
  update: (time: number) => void;
}

export function createTerrainWorld(scene: THREE.Scene, isLowQuality: boolean = false): TerrainWorld {
  const size = 280;
  const segments = isLowQuality ? 130 : 200;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;
  const count = pos.count;

  // Vertex coloring for seamless multi-biome blending
  const colors = new Float32Array(count * 3);
  const colSand = new THREE.Color('#caa572');
  const colWetSand = new THREE.Color('#826038');
  const colGrass = new THREE.Color('#416d2b');
  const colGrassSun = new THREE.Color('#5f9435');
  const colMoss = new THREE.Color('#2d4c1d');
  const colRockCliff = new THREE.Color('#585551');
  const colDarkSlate = new THREE.Color('#383633');
  const colPath = new THREE.Color('#786752');

  const tempNorm = new THREE.Vector3();
  const tempCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = getTerrainHeight(x, z);
    pos.setY(i, y);

    getTerrainNormal(x, z, tempNorm);
    const slope = 1.0 - tempNorm.y;
    const pDist = distanceToPath(x, z);

    if (y < 0.6) {
      tempCol.copy(colWetSand);
    } else if (y < 1.8) {
      const sandT = (y - 0.6) / 1.2;
      tempCol.copy(colWetSand).lerp(colSand, sandT);
    } else if (pDist < 1.9 && slope < 0.45) {
      const pathT = 1.0 - pDist / 1.9;
      tempCol.copy(colGrass).lerp(colPath, pathT * 0.85);
    } else if (slope > 0.42 || (y > 11 && slope > 0.32)) {
      const cliffT = Math.min(1, (slope - 0.36) * 2.8);
      tempCol.copy(colGrass).lerp(colRockCliff, cliffT);
      if (slope > 0.62) tempCol.lerp(colDarkSlate, 0.5);
    } else {
      const altT = Math.min(1, Math.max(0, y / 18));
      tempCol.copy(colGrass).lerp(colGrassSun, altT * 0.45);
      if (y < 4.5) tempCol.lerp(colMoss, 0.22);
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const grassData = createGrassMaterials();

  const terrainMaterial = new THREE.MeshStandardMaterial({
    map: grassData.map,
    normalMap: grassData.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: grassData.roughnessMap,
    roughness: 0.85,
    metalness: 0.04,
    vertexColors: true,
  });

  const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;
  scene.add(terrainMesh);

  // 1. Distant Mountain Range Horizons
  const distantMountains = createDistantMountains();
  scene.add(distantMountains);

  // 2. Offshore Sea Stacks & Jagged Reefs
  const seaStacks = createOffshoreSeaStacks();
  scene.add(seaStacks);

  // Shared wind uniform for GPU vertex shader wind animation
  const windUniform = { value: 0 };

  // 3. Dense Realistic Maritime Pine & Hardwood Trees
  const treeCount = isLowQuality ? 85 : 160;
  const treeGeom = createRealisticBranchingPineGeometry();
  const treeMat = new THREE.MeshStandardMaterial({
    color: '#28461f',
    roughness: 0.72,
    metalness: 0.06,
  });

  // Inject subtle wind sway on tree branches
  treeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.vertexShader = `
      uniform float uTime;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float treeWind = sin(uTime * 1.6 + transformed.x * 0.2 + transformed.z * 0.2) * 0.12;
      transformed.x += treeWind * smoothstep(1.5, 6.0, transformed.y);
      transformed.z += treeWind * 0.5 * smoothstep(1.5, 6.0, transformed.y);
      `
    );
  };

  const treesMesh = new THREE.InstancedMesh(treeGeom, treeMat, treeCount);
  treesMesh.castShadow = !isLowQuality;
  treesMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const treeTint = new THREE.Color();
  let placedTrees = 0;
  let attempts = 0;

  while (placedTrees < treeCount && attempts < 950) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * (ISLAND_RADIUS - 22);
    const tx = Math.cos(angle) * r;
    const tz = Math.sin(angle) * r;
    const ty = getTerrainHeight(tx, tz);
    getTerrainNormal(tx, tz, tempNorm);

    if (ty > 2.0 && ty < 16.5 && tempNorm.y > 0.78 && distanceToPath(tx, tz) > 3.6) {
      if (Math.hypot(tx - 18, tz - (-27)) > 15 && Math.hypot(tx - (-16), tz - (-26)) > 10) {
        const s = 0.82 + Math.random() * 0.55;
        dummy.position.set(tx, ty - 0.25, tz);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.rotation.x = (Math.random() - 0.5) * 0.12;
        dummy.rotation.z = (Math.random() - 0.5) * 0.12;
        dummy.scale.set(s, s * (0.92 + Math.random() * 0.25), s);
        dummy.updateMatrix();
        treesMesh.setMatrixAt(placedTrees, dummy.matrix);

        const h = 0.28 + (Math.random() - 0.5) * 0.07;
        const sat = 0.44 + Math.random() * 0.18;
        const l = 0.2 + Math.random() * 0.12;
        treeTint.setHSL(h, sat, l);
        treesMesh.setColorAt(placedTrees, treeTint);
        placedTrees++;
      }
    }
  }
  treesMesh.count = placedTrees;
  treesMesh.instanceMatrix.needsUpdate = true;
  if (treesMesh.instanceColor) treesMesh.instanceColor.needsUpdate = true;
  treesMesh.computeBoundingSphere();
  scene.add(treesMesh);

  // 4. Coastal Bushes and Shrubbery (Sprawling junipers hugging cliff edges)
  const bushCount = isLowQuality ? 40 : 80;
  const bushGeom = createBushGeometry();
  const bushMat = new THREE.MeshStandardMaterial({
    color: '#345828',
    roughness: 0.8,
    metalness: 0.05,
  });
  const bushesMesh = new THREE.InstancedMesh(bushGeom, bushMat, bushCount);
  bushesMesh.castShadow = !isLowQuality;
  bushesMesh.receiveShadow = true;

  let placedBushes = 0;
  attempts = 0;
  while (placedBushes < bushCount && attempts < 600) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * (ISLAND_RADIUS - 15);
    const bx = Math.cos(angle) * r;
    const bz = Math.sin(angle) * r;
    const by = getTerrainHeight(bx, bz);
    getTerrainNormal(bx, bz, tempNorm);

    if (by > 1.5 && by < 17 && tempNorm.y > 0.72 && distanceToPath(bx, bz) > 1.5) {
      const bs = 0.75 + Math.random() * 0.6;
      dummy.position.set(bx, by - 0.1, bz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(bs * 1.3, bs * 0.8, bs * 1.3);
      dummy.updateMatrix();
      bushesMesh.setMatrixAt(placedBushes, dummy.matrix);
      placedBushes++;
    }
  }
  bushesMesh.count = placedBushes;
  bushesMesh.instanceMatrix.needsUpdate = true;
  bushesMesh.computeBoundingSphere();
  scene.add(bushesMesh);

  // 5. Realistic Sculpted Rocks & Boulders
  const rockCount = isLowQuality ? 60 : 120;
  const rockMatData = createCliffRockMaterials();
  const boulderGeom = createSculptedBoulderGeometry();
  const boulderMat = new THREE.MeshStandardMaterial({
    map: rockMatData.map,
    normalMap: rockMatData.normalMap,
    roughness: 0.88,
    metalness: 0.08,
  });
  const rocksMesh = new THREE.InstancedMesh(boulderGeom, boulderMat, rockCount);
  rocksMesh.castShadow = !isLowQuality;
  rocksMesh.receiveShadow = true;

  let placedRocks = 0;
  attempts = 0;
  while (placedRocks < rockCount && attempts < 800) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 16 + Math.random() * (ISLAND_RADIUS - 6);
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;
    const ry = getTerrainHeight(rx, rz);
    getTerrainNormal(rx, rz, tempNorm);

    if (ry > 0.1 && (tempNorm.y < 0.76 || ry < 2.8 || Math.hypot(rx - 42, rz - 11) < 22)) {
      const sx = 1.0 + Math.random() * 2.4;
      const sy = 0.8 + Math.random() * 1.8;
      const sz = 1.0 + Math.random() * 2.4;
      dummy.position.set(rx, ry - 0.4, rz);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      rocksMesh.setMatrixAt(placedRocks, dummy.matrix);
      placedRocks++;
    }
  }
  rocksMesh.count = placedRocks;
  rocksMesh.instanceMatrix.needsUpdate = true;
  rocksMesh.computeBoundingSphere();
  scene.add(rocksMesh);

  // 6. Wildflower Meadows (Poppies, Lupines, Daisies) with wind sway
  const flowerCount = isLowQuality ? 110 : 260;
  const flowerGeom = new THREE.ConeGeometry(0.24, 0.52, 5);
  flowerGeom.translate(0, 0.26, 0);
  const flowerMat = new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.05,
  });

  flowerMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.vertexShader = `
      uniform float uTime;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float fWind = sin(uTime * 2.2 + transformed.x * 0.4 + transformed.z * 0.4) * 0.15;
      transformed.x += fWind * smoothstep(0.1, 0.5, transformed.y);
      transformed.z += fWind * 0.5 * smoothstep(0.1, 0.5, transformed.y);
      `
    );
  };

  const flowersMesh = new THREE.InstancedMesh(flowerGeom, flowerMat, flowerCount);

  const flowerPalette = [
    new THREE.Color('#e85338'), // California poppy
    new THREE.Color('#ffb703'), // Golden buttercup
    new THREE.Color('#4361ee'), // Mountain lupine
    new THREE.Color('#7209b7'), // Wild thistle purple
    new THREE.Color('#f72585'), // Coastal pink mallow
    new THREE.Color('#ffffff'), // Sea chamomile
  ];

  let placedFlowers = 0;
  attempts = 0;
  while (placedFlowers < flowerCount && attempts < 900) {
    attempts++;
    const fx = -14 + (Math.random() - 0.5) * 45;
    const fz = 25 + (Math.random() - 0.5) * 45;
    const fy = getTerrainHeight(fx, fz);
    getTerrainNormal(fx, fz, tempNorm);

    if (fy > 1.6 && fy < 13 && tempNorm.y > 0.82 && distanceToPath(fx, fz) > 1.0) {
      dummy.position.set(fx, fy, fz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15);
      const s = 0.7 + Math.random() * 0.6;
      dummy.scale.set(s, s * 1.2, s);
      dummy.updateMatrix();
      flowersMesh.setMatrixAt(placedFlowers, dummy.matrix);
      const chosen = flowerPalette[Math.floor(Math.random() * flowerPalette.length)];
      flowersMesh.setColorAt(placedFlowers, chosen);
      placedFlowers++;
    }
  }
  flowersMesh.count = placedFlowers;
  flowersMesh.instanceMatrix.needsUpdate = true;
  if (flowersMesh.instanceColor) flowersMesh.instanceColor.needsUpdate = true;
  flowersMesh.computeBoundingSphere();
  scene.add(flowersMesh);

  // 7. Dense Volumetric Grass Blades with GPU Wind Shader
  const grassCount = isLowQuality ? 140 : 360;
  const grassGeom = createGrassTuftGeometry();
  const grassMat = new THREE.MeshStandardMaterial({
    color: '#497c2a',
    roughness: 0.85,
    metalness: 0.02,
  });

  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.vertexShader = `
      uniform float uTime;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      // Natural blade bending in coastal wind
      float gWind = sin(uTime * 2.5 + transformed.x * 0.35 + transformed.z * 0.35) * 0.22;
      transformed.x += gWind * smoothstep(0.1, 0.75, transformed.y);
      transformed.z += gWind * 0.6 * smoothstep(0.1, 0.75, transformed.y);
      `
    );
  };

  const grassBlades = new THREE.InstancedMesh(grassGeom, grassMat, grassCount);

  let placedGrass = 0;
  attempts = 0;
  while (placedGrass < grassCount && attempts < 1000) {
    attempts++;
    const gx = (Math.random() - 0.5) * 125;
    const gz = (Math.random() - 0.5) * 125;
    const gy = getTerrainHeight(gx, gz);
    getTerrainNormal(gx, gz, tempNorm);

    if (gy > 1.4 && gy < 16 && tempNorm.y > 0.8 && distanceToPath(gx, gz) > 0.6) {
      const s = 0.75 + Math.random() * 0.6;
      dummy.position.set(gx, gy, gz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      grassBlades.setMatrixAt(placedGrass, dummy.matrix);
      placedGrass++;
    }
  }
  grassBlades.count = placedGrass;
  grassBlades.instanceMatrix.needsUpdate = true;
  grassBlades.computeBoundingSphere();
  scene.add(grassBlades);

  // 8. Arrival Pier at Pelican Cove
  const dock = createArtisanPier();
  dock.position.set(0, 0.45, 56);
  scene.add(dock);

  // 9. Rustic Arch Bridge across the stream
  const bridge = createWoodenArchBridge();
  const bY = getTerrainHeight(-12, -4);
  bridge.position.set(-12, bY + 0.2, -4);
  bridge.rotation.y = Math.PI / 3;
  scene.add(bridge);

  // 10. Falcon's Perch Campfire & Sunset Bench
  const { group: benchRest, fireLight, fireEmbers } = createCliffRestingLocation();
  const restY = getTerrainHeight(-16, -26);
  benchRest.position.set(-16, restY, -26);
  benchRest.rotation.y = Math.PI / 4;
  scene.add(benchRest);

  // 11. Waterfall Basin Spray Particles
  const sprayCount = 180;
  const sprayGeom = new THREE.BufferGeometry();
  const sprayPositions = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    sprayPositions[i * 3] = 42 + (Math.random() - 0.5) * 6.0;
    sprayPositions[i * 3 + 1] = 0.3 + Math.random() * 3.5;
    sprayPositions[i * 3 + 2] = 11 + (Math.random() - 0.5) * 6.0;
  }
  sprayGeom.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: '#dcf6ff',
    size: 0.45,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const waterfallSpray = new THREE.Points(sprayGeom, sprayMat);
  scene.add(waterfallSpray);

  // 12. Twilight Fireflies
  const fireflyCount = 95;
  const fireflyGeom = new THREE.BufferGeometry();
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyBasePos: { x: number; y: number; z: number; speed: number }[] = [];

  for (let i = 0; i < fireflyCount; i++) {
    const fx = -20 + (Math.random() - 0.5) * 65;
    const fz = 10 + (Math.random() - 0.5) * 65;
    const fy = getTerrainHeight(fx, fz) + 1.0 + Math.random() * 2.5;
    fireflyPositions[i * 3] = fx;
    fireflyPositions[i * 3 + 1] = fy;
    fireflyPositions[i * 3 + 2] = fz;
    fireflyBasePos.push({ x: fx, y: fy, z: fz, speed: 0.6 + Math.random() * 0.8 });
  }
  fireflyGeom.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: '#ffea78',
    size: 0.65,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fireflies = new THREE.Points(fireflyGeom, fireflyMat);
  scene.add(fireflies);

  return {
    mesh: terrainMesh,
    trees: treesMesh,
    bushes: bushesMesh,
    rocks: rocksMesh,
    flowers: flowersMesh,
    grassBlades,
    seaStacks,
    distantMountains,
    dock,
    bridge,
    benchRest,
    fireEmbers,
    fireLight,
    waterfallSpray,
    fireflies,
    update: (time: number) => {
      // Update global GPU wind time
      windUniform.value = time;

      // Fireflies floating
      const fPos = fireflyGeom.attributes.position;
      for (let i = 0; i < fireflyCount; i++) {
        const bp = fireflyBasePos[i];
        fPos.setY(i, bp.y + Math.sin(time * bp.speed + i) * 0.45);
        fPos.setX(i, bp.x + Math.cos(time * bp.speed * 0.7 + i) * 0.35);
        fPos.setZ(i, bp.z + Math.sin(time * bp.speed * 0.5 + i) * 0.35);
      }
      fPos.needsUpdate = true;

      // Waterfall spray
      const sPos = sprayGeom.attributes.position;
      for (let i = 0; i < sprayCount; i++) {
        let sy = sPos.getY(i) + 0.04;
        if (sy > 4.2) sy = 0.2 + Math.random() * 0.5;
        sPos.setY(i, sy);
      }
      sPos.needsUpdate = true;

      // Campfire flicker
      fireLight.intensity = 2.2 + Math.sin(time * 12.0) * 0.3 + Math.cos(time * 22.0) * 0.2;

      // Campfire rising embers
      const ePos = fireEmbers.geometry.attributes.position;
      for (let i = 0; i < ePos.count; i++) {
        let ey = ePos.getY(i) + 0.025;
        if (ey > 2.2) ey = 0.3 + Math.random() * 0.2;
        ePos.setY(i, ey);
        ePos.setX(i, Math.sin(time * 3 + i) * 0.15);
        ePos.setZ(i, 0.8 + Math.cos(time * 3 + i) * 0.15);
      }
      ePos.needsUpdate = true;
    },
  };
}

function createDistantMountains(): THREE.Group {
  const group = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({
    color: '#344558',
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const ranges: { angle: number; dist: number; width: number; height: number }[] = [
    { angle: -0.85, dist: 320, width: 230, height: 70 },
    { angle: -0.22, dist: 370, width: 290, height: 90 },
    { angle: 0.48, dist: 340, width: 250, height: 80 },
    { angle: 1.38, dist: 390, width: 270, height: 85 },
    { angle: 2.28, dist: 350, width: 220, height: 65 },
  ];

  for (const r of ranges) {
    const geom = new THREE.ConeGeometry(r.width * 0.5, r.height, 7);
    geom.scale(1.0, 1.0, 0.45);
    const mesh = new THREE.Mesh(geom, mountainMat);
    const mx = Math.cos(r.angle) * r.dist;
    const mz = Math.sin(r.angle) * r.dist;
    mesh.position.set(mx, r.height * 0.4 - 10, mz);
    mesh.rotation.y = r.angle + Math.PI / 2;
    group.add(mesh);
  }

  return group;
}

function createOffshoreSeaStacks(): THREE.Group {
  const group = new THREE.Group();
  const stackMat = new THREE.MeshStandardMaterial({
    color: '#464340',
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });

  const stacks: [number, number, number, number][] = [
    [-65, -85, 9, 22],
    [-92, -55, 7, 18],
    [75, -70, 8, 20],
    [90, 40, 6, 14],
    [-78, 65, 8, 16],
  ];

  for (const [x, z, r, h] of stacks) {
    const geom = new THREE.CylinderGeometry(r * 0.4, r, h, 6);
    const mesh = new THREE.Mesh(geom, stackMat);
    mesh.position.set(x, h * 0.4 - 2, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.rotation.x = (Math.random() - 0.5) * 0.15;
    group.add(mesh);
  }

  return group;
}

function createRealisticBranchingPineGeometry(): THREE.BufferGeometry {
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, 1.2, 0.06),
    new THREE.Vector3(-0.06, 2.6, 0.12),
    new THREE.Vector3(0, 4.0, 0),
  ]);
  const trunkGeom = new THREE.TubeGeometry(trunkCurve, 8, 0.3, 7, false);

  // Staggered tiered canopy clusters
  const f1 = new THREE.DodecahedronGeometry(2.1, 1);
  f1.scale(1.25, 0.7, 1.25);
  f1.translate(0, 3.6, 0);

  const f2 = new THREE.DodecahedronGeometry(1.7, 1);
  f2.scale(1.15, 0.65, 1.15);
  f2.translate(0.18, 4.8, -0.12);

  const f3 = new THREE.DodecahedronGeometry(1.25, 1);
  f3.scale(1.05, 0.6, 1.05);
  f3.translate(-0.12, 5.8, 0.12);

  const f4 = new THREE.DodecahedronGeometry(0.85, 1);
  f4.translate(0, 6.7, 0);

  const geoms = [trunkGeom, f1, f2, f3, f4];
  let vCount = 0;
  for (const g of geoms) vCount += g.attributes.position.count;

  const mPos = new Float32Array(vCount * 3);
  const mNorm = new Float32Array(vCount * 3);
  let off = 0;

  for (const g of geoms) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      mPos[(off + i) * 3] = p.getX(i);
      mPos[(off + i) * 3 + 1] = p.getY(i);
      mPos[(off + i) * 3 + 2] = p.getZ(i);
      if (n) {
        mNorm[(off + i) * 3] = n.getX(i);
        mNorm[(off + i) * 3 + 1] = n.getY(i);
        mNorm[(off + i) * 3 + 2] = n.getZ(i);
      }
    }
    off += p.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mNorm, 3));
  return merged;
}

function createBushGeometry(): THREE.BufferGeometry {
  const g1 = new THREE.DodecahedronGeometry(1.0, 1);
  g1.scale(1.2, 0.7, 1.1);
  g1.translate(0, 0.5, 0);

  const g2 = new THREE.DodecahedronGeometry(0.8, 1);
  g2.scale(1.0, 0.6, 1.0);
  g2.translate(0.4, 0.45, 0.2);

  const geoms = [g1, g2];
  let vCount = 0;
  for (const g of geoms) vCount += g.attributes.position.count;

  const mPos = new Float32Array(vCount * 3);
  const mNorm = new Float32Array(vCount * 3);
  let off = 0;

  for (const g of geoms) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      mPos[(off + i) * 3] = p.getX(i);
      mPos[(off + i) * 3 + 1] = p.getY(i);
      mPos[(off + i) * 3 + 2] = p.getZ(i);
      if (n) {
        mNorm[(off + i) * 3] = n.getX(i);
        mNorm[(off + i) * 3 + 1] = n.getY(i);
        mNorm[(off + i) * 3 + 2] = n.getZ(i);
      }
    }
    off += p.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mNorm, 3));
  return merged;
}

function createSculptedBoulderGeometry(): THREE.BufferGeometry {
  const geom = new THREE.DodecahedronGeometry(1.5, 1);
  const p = geom.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const jx = p.getX(i) * (0.8 + Math.random() * 0.4);
    const jy = p.getY(i) * (0.7 + Math.random() * 0.4);
    const jz = p.getZ(i) * (0.8 + Math.random() * 0.4);
    p.setXYZ(i, jx, jy, jz);
  }
  geom.computeVertexNormals();
  return geom;
}

function createGrassTuftGeometry(): THREE.BufferGeometry {
  // Curved individual grass blades
  const g1 = new THREE.PlaneGeometry(0.7, 0.85);
  g1.translate(0, 0.42, 0);

  const g2 = new THREE.PlaneGeometry(0.7, 0.85);
  g2.rotateY(Math.PI / 3);
  g2.translate(0, 0.42, 0);

  const g3 = new THREE.PlaneGeometry(0.7, 0.85);
  g3.rotateY((Math.PI / 3) * 2);
  g3.translate(0, 0.42, 0);

  const geoms = [g1, g2, g3];
  let vCount = 0;
  for (const g of geoms) vCount += g.attributes.position.count;

  const mPos = new Float32Array(vCount * 3);
  const mNorm = new Float32Array(vCount * 3);
  let off = 0;

  for (const g of geoms) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      mPos[(off + i) * 3] = p.getX(i);
      mPos[(off + i) * 3 + 1] = p.getY(i);
      mPos[(off + i) * 3 + 2] = p.getZ(i);
      if (n) {
        mNorm[(off + i) * 3] = n.getX(i);
        mNorm[(off + i) * 3 + 1] = n.getY(i);
        mNorm[(off + i) * 3 + 2] = n.getZ(i);
      }
    }
    off += p.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mNorm, 3));
  return merged;
}

function createArtisanPier(): THREE.Group {
  const pier = new THREE.Group();
  const woodData = createWoodPlankMaterials();
  const pierMat = new THREE.MeshStandardMaterial({
    map: woodData.map,
    normalMap: woodData.normalMap,
    roughness: 0.85,
    metalness: 0.05,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#342618',
    roughness: 0.9,
    metalness: 0.02,
  });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 14), pierMat);
  deck.position.set(0, 0.35, 0);
  deck.castShadow = true;
  deck.receiveShadow = true;
  pier.add(deck);

  const pilingGeom = new THREE.CylinderGeometry(0.18, 0.2, 3.2, 8);
  for (const x of [-1.65, 1.65]) {
    for (let z = -6; z <= 6; z += 3) {
      const p = new THREE.Mesh(pilingGeom, darkWoodMat);
      p.position.set(x, -1.0, z);
      p.castShadow = true;
      pier.add(p);
    }
  }

  const bollardGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.65, 8);
  const b1 = new THREE.Mesh(bollardGeom, darkWoodMat);
  b1.position.set(-1.5, 0.75, 6.2);
  const b2 = new THREE.Mesh(bollardGeom, darkWoodMat);
  b2.position.set(1.5, 0.75, 6.2);
  pier.add(b1, b2);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 6), darkWoodMat);
  post.position.set(1.5, 1.5, 6.2);
  pier.add(post);

  const lanternCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.45, 0.3),
    new THREE.MeshStandardMaterial({ color: '#1a1816', roughness: 0.5, metalness: 0.8 })
  );
  lanternCase.position.set(1.5, 2.7, 6.2);
  pier.add(lanternCase);

  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#ffbd59' })
  );
  lanternBulb.position.set(1.5, 2.7, 6.2);
  pier.add(lanternBulb);

  const lanternLight = new THREE.PointLight(0xffb042, 1.8, 10);
  lanternLight.position.set(1.5, 2.7, 6.2);
  pier.add(lanternLight);

  return pier;
}

function createWoodenArchBridge(): THREE.Group {
  const bridge = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#654f3b',
    roughness: 0.82,
    metalness: 0.05,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: '#463524',
    roughness: 0.85,
  });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 7.5), woodMat);
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);

  const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
  const railGeom = new THREE.BoxGeometry(0.1, 0.1, 7.5);

  for (const x of [-1.15, 1.15]) {
    const rail = new THREE.Mesh(railGeom, railMat);
    rail.position.set(x, 0.85, 0);
    rail.castShadow = true;
    bridge.add(rail);

    for (let z = -3.2; z <= 3.2; z += 1.6) {
      const p = new THREE.Mesh(postGeom, railMat);
      p.position.set(x, 0.45, z);
      p.castShadow = true;
      bridge.add(p);
    }
  }

  return bridge;
}

function createCliffRestingLocation(): {
  group: THREE.Group;
  fireLight: THREE.PointLight;
  fireEmbers: THREE.Points;
} {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#5c4532',
    roughness: 0.78,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#686561',
    roughness: 0.9,
  });

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.2, 8), stoneMat);
  floor.position.y = 0.1;
  floor.receiveShadow = true;
  group.add(floor);

  // Wooden bench
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.65), woodMat);
  seat.position.set(0, 0.52, -1.2);
  seat.castShadow = true;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.1), woodMat);
  back.position.set(0, 0.85, -1.5);
  back.castShadow = true;
  group.add(back);

  for (const x of [-0.95, 0.95]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.55), woodMat);
    leg.position.set(x, 0.25, -1.2);
    leg.castShadow = true;
    group.add(leg);
  }

  // Stone ring campfire
  const fireRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.14, 6, 8), stoneMat);
  fireRing.rotateX(Math.PI / 2);
  fireRing.position.set(0, 0.25, 0.8);
  group.add(fireRing);

  // Campfire logs
  const logMat = new THREE.MeshStandardMaterial({ color: '#2b1b11', roughness: 0.9 });
  const logGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
  logGeom.rotateZ(Math.PI / 3);
  const log1 = new THREE.Mesh(logGeom, logMat);
  log1.position.set(0, 0.26, 0.8);
  const log2 = new THREE.Mesh(logGeom, logMat);
  log2.position.set(0, 0.26, 0.8);
  log2.rotation.y = Math.PI / 2;
  group.add(log1, log2);

  // Glowing coals
  const coals = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 6, 5),
    new THREE.MeshBasicMaterial({ color: '#ff5500' })
  );
  coals.position.set(0, 0.28, 0.8);
  group.add(coals);

  const fireLight = new THREE.PointLight(0xff7700, 2.4, 9, 1.2);
  fireLight.position.set(0, 0.65, 0.8);
  group.add(fireLight);

  // Rising fire embers particles
  const emberCount = 35;
  const emberGeom = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPositions[i * 3] = (Math.random() - 0.5) * 0.4;
    emberPositions[i * 3 + 1] = 0.3 + Math.random() * 1.5;
    emberPositions[i * 3 + 2] = 0.8 + (Math.random() - 0.5) * 0.4;
  }
  emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: '#ffbb33',
    size: 0.2,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fireEmbers = new THREE.Points(emberGeom, emberMat);
  group.add(fireEmbers);

  return { group, fireLight, fireEmbers };
}
