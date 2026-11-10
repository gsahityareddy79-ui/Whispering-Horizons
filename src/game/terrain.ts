import * as THREE from 'three';
import {
  createGrassTexture,
  createRockTexture,
  createSandTexture,
} from './proceduralTextures';

/**
 * Procedural Island Geography & Heightmap
 * Compact coastal island with cliffs, green hills, lighthouse summit,
 * beach bay, waterfall ravine, and winding paths.
 */

export const ISLAND_RADIUS = 85;

// Main path waypoints for distance calculation and path flattening
const PATH_WAYPOINTS: [number, number][] = [
  [0, 52],      // 1. Arrival Dock
  [-8, 40],     // 2. Coastal Bay entry
  [-12, 25],    // 3. Flower Meadow junction
  [-18, 8],     // 4. Ancient Shrine glade
  [-5, -5],     // 5. Central Ridge fork
  [12, -18],    // 6. Lighthouse lower switchback
  [18, -30],    // 7. Lighthouse summit platform
  [-15, -25],   // 8. Western Sunset lookout branch
  [30, 2],      // 9. East waterfall trail branch
  [45, 10],     // 10. Waterfall overlook
];

function distanceToPath(x: number, z: number): number {
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

// Pseudo-noise function for procedural hills and ridges without heavy external libraries
function pseudoNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.04 + z * 0.03) * 3.5 +
    Math.cos(x * 0.08 - z * 0.06) * 2.0 +
    Math.sin(x * 0.15 + z * 0.12) * 0.8 +
    Math.cos(x * 0.3 - z * 0.25) * 0.3
  );
}

/**
 * Analytical height function of the island terrain
 */
export function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);

  // Deep ocean falloff beyond island perimeter
  if (distFromCenter > ISLAND_RADIUS + 25) {
    return -12;
  }

  // Base radial island shape: high in center/north, sloping to south beach
  const radialFactor = Math.max(0, 1 - Math.pow(distFromCenter / ISLAND_RADIUS, 1.8));

  // Organic hill noise
  let h = pseudoNoise(x, z);

  // 1. Lighthouse Summit Peak (North-East ridge) around (18, -30)
  const distToSummit = Math.hypot(x - 18, z - (-30));
  const summitHump = Math.max(0, 1 - distToSummit / 26);
  h += summitHump * summitHump * 13;

  // 2. North & North-West rugged Sea Cliffs around (x < 5, z < -10)
  if (z < -10) {
    const cliffFactor = Math.max(0, -z / 60);
    h += cliffFactor * 6.5;
    // Sheer dropoff cliff edge near perimeter
    if (distFromCenter > 55 && z < -20) {
      const drop = Math.pow((distFromCenter - 55) / 25, 2) * 16;
      h -= drop;
    }
  }

  // 3. South-East Coastal Bay & Sandy Beach around (0, 50)
  const distToBeach = Math.hypot(x - 0, z - 50);
  if (distToBeach < 35) {
    const beachFade = Math.max(0, 1 - distToBeach / 35);
    h = h * (1 - beachFade * 0.85) + beachFade * 0.5;
  }

  // 4. Waterfall Ravine on East side around (45, 10)
  const distToWaterfall = Math.hypot(x - 45, z - 10);
  if (distToWaterfall < 20) {
    const gorgeFade = Math.max(0, 1 - distToWaterfall / 20);
    h -= gorgeFade * 5;
  }

  // Scale overall by island perimeter radial mask
  let finalHeight = (h + 3.0) * radialFactor;

  // Smooth trail carving: lower terrain slightly where paths wind
  const pDist = distanceToPath(x, z);
  if (pDist < 2.5 && finalHeight > 0.6) {
    const pathFlatten = Math.max(0, 1 - pDist / 2.5);
    finalHeight -= pathFlatten * 0.35;
  }

  // Shoreline clamp: near water edge
  if (distFromCenter > ISLAND_RADIUS - 6) {
    const edgeT = (distFromCenter - (ISLAND_RADIUS - 6)) / 6;
    finalHeight = THREE.MathUtils.lerp(finalHeight, -2.5, Math.min(1, edgeT));
  }

  return finalHeight;
}

export function getTerrainNormal(x: number, z: number, outNormal: THREE.Vector3): THREE.Vector3 {
  const eps = 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  outNormal.set((hL - hR) / (2 * eps), 1.0, (hD - hU) / (2 * eps)).normalize();
  return outNormal;
}

export interface TerrainWorld {
  mesh: THREE.Mesh;
  trees: THREE.InstancedMesh;
  rocks: THREE.InstancedMesh;
  flowers: THREE.InstancedMesh;
  grassTufts: THREE.InstancedMesh;
  dock: THREE.Group;
  waterfallSpray: THREE.Points;
}

export function createTerrainWorld(scene: THREE.Scene, isLowQuality: boolean = false): TerrainWorld {
  const size = 220;
  const segments = isLowQuality ? 100 : 150;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const count = posAttr.count;

  // Prepare vertex colors for blending: sand, grass, rock cliffs, and stone path
  const colors = new Float32Array(count * 3);
  const colorSand = new THREE.Color('#d2b27b');
  const colorGrass = new THREE.Color('#3f7329');
  const colorGrassHighlight = new THREE.Color('#589437');
  const colorCliff = new THREE.Color('#585754');
  const colorPath = new THREE.Color('#8a755d');
  const tempNormal = new THREE.Vector3();
  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);

    getTerrainNormal(x, z, tempNormal);
    const slope = 1.0 - tempNormal.y; // 0 = flat, 1 = vertical cliff

    const pDist = distanceToPath(x, z);

    if (y < 1.4) {
      // Shoreline sand
      const sandMix = Math.max(0, Math.min(1, (1.4 - y) / 1.4));
      tempColor.copy(colorGrass).lerp(colorSand, sandMix);
    } else if (pDist < 1.8 && slope < 0.45) {
      // Stone trail
      const pathFade = 1.0 - pDist / 1.8;
      tempColor.copy(colorGrass).lerp(colorPath, pathFade * 0.85);
    } else if (slope > 0.48 || (y > 12 && slope > 0.35)) {
      // Steep rock cliff
      const cliffMix = Math.min(1, (slope - 0.4) * 2.5);
      tempColor.copy(colorGrass).lerp(colorCliff, cliffMix);
    } else {
      // Rich rolling grass with subtle height tint
      const heightTint = Math.min(1, Math.max(0, y / 16));
      tempColor.copy(colorGrass).lerp(colorGrassHighlight, heightTint * 0.4);
    }

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  // Terrain material using procedural grass texture and vertex coloring
  const grassTex = createGrassTexture();
  const rockTex = createRockTexture();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    bumpMap: rockTex,
    bumpScale: 0.12,
    roughness: 0.85,
    metalness: 0.05,
    vertexColors: true,
  });

  const terrainMesh = new THREE.Mesh(geometry, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;
  scene.add(terrainMesh);

  // 1. Instanced Pine Trees (Composite design: trunk + 3 cone layers)
  // We combine the pine tree into a single merged geometry for ultra-efficient InstancedMesh!
  const treeCount = isLowQuality ? 60 : 110;
  const treeGeom = createPineTreeGeometry();
  const treeMat = new THREE.MeshStandardMaterial({
    color: '#28461f',
    roughness: 0.8,
    metalness: 0.1,
  });
  const treesMesh = new THREE.InstancedMesh(treeGeom, treeMat, treeCount);
  treesMesh.castShadow = true;
  treesMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const treeTint = new THREE.Color();
  let placedTrees = 0;
  let attempts = 0;

  while (placedTrees < treeCount && attempts < 800) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * (ISLAND_RADIUS - 18);
    const tx = Math.cos(angle) * r;
    const tz = Math.sin(angle) * r;
    const ty = getTerrainHeight(tx, tz);
    getTerrainNormal(tx, tz, tempNormal);

    // Only plant trees on gentle grassy slopes above water and away from main paths
    if (ty > 2.0 && ty < 14.5 && tempNormal.y > 0.82 && distanceToPath(tx, tz) > 3.5) {
      // Avoid placing right on the lighthouse platform
      if (Math.hypot(tx - 18, tz - (-30)) > 12) {
        const scale = 0.8 + Math.random() * 0.45;
        dummy.position.set(tx, ty - 0.2, tz);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.rotation.x = (Math.random() - 0.5) * 0.08;
        dummy.rotation.z = (Math.random() - 0.5) * 0.08;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        treesMesh.setMatrixAt(placedTrees, dummy.matrix);

        // Tint variation: deep forest pine to sunlit green
        treeTint.setHSL(0.3 + (Math.random() - 0.5) * 0.05, 0.45, 0.22 + Math.random() * 0.1);
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

  // 2. Instanced Weathered Boulders along cliffs and coast
  const rockCount = isLowQuality ? 45 : 90;
  const boulderGeom = new THREE.DodecahedronGeometry(1.4, 1);
  // Jitter vertices for organic rock roughness
  const bPos = boulderGeom.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    bPos.setXYZ(
      i,
      bPos.getX(i) * (0.85 + Math.random() * 0.3),
      bPos.getY(i) * (0.85 + Math.random() * 0.3),
      bPos.getZ(i) * (0.85 + Math.random() * 0.3)
    );
  }
  boulderGeom.computeVertexNormals();

  const boulderMat = new THREE.MeshStandardMaterial({
    map: rockTex,
    color: '#706e6a',
    roughness: 0.9,
    metalness: 0.05,
  });
  const rocksMesh = new THREE.InstancedMesh(boulderGeom, boulderMat, rockCount);
  rocksMesh.castShadow = true;
  rocksMesh.receiveShadow = true;

  let placedRocks = 0;
  attempts = 0;
  while (placedRocks < rockCount && attempts < 600) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 25 + Math.random() * (ISLAND_RADIUS - 10);
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;
    const ry = getTerrainHeight(rx, rz);
    getTerrainNormal(rx, rz, tempNormal);

    if (ry > 0.2 && (tempNormal.y < 0.75 || ry < 2.5 || Math.hypot(rx - 45, rz - 10) < 25)) {
      const scaleX = 0.8 + Math.random() * 1.6;
      const scaleY = 0.6 + Math.random() * 1.2;
      const scaleZ = 0.8 + Math.random() * 1.6;
      dummy.position.set(rx, ry - 0.3, rz);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.updateMatrix();
      rocksMesh.setMatrixAt(placedRocks, dummy.matrix);

      treeTint.setRGB(
        0.35 + Math.random() * 0.12,
        0.34 + Math.random() * 0.12,
        0.32 + Math.random() * 0.12
      );
      rocksMesh.setColorAt(placedRocks, treeTint);
      placedRocks++;
    }
  }
  rocksMesh.count = placedRocks;
  rocksMesh.instanceMatrix.needsUpdate = true;
  if (rocksMesh.instanceColor) rocksMesh.instanceColor.needsUpdate = true;
  rocksMesh.computeBoundingSphere();
  scene.add(rocksMesh);

  // 3. Instanced Wildflowers (Coastal Poppies & Bluebells in meadows)
  const flowerCount = isLowQuality ? 70 : 160;
  const flowerGeom = new THREE.SphereGeometry(0.18, 5, 4);
  const flowerMat = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.0,
  });
  const flowersMesh = new THREE.InstancedMesh(flowerGeom, flowerMat, flowerCount);

  let placedFlowers = 0;
  attempts = 0;
  const flowerPalette = [
    new THREE.Color('#e04838'), // wild poppy orange-red
    new THREE.Color('#4c7fe0'), // coastal bluebell
    new THREE.Color('#f0c438'), // buttercup yellow
    new THREE.Color('#f4f4f4'), // sea daisy white
    new THREE.Color('#c25ce6'), // mountain lavender
  ];

  while (placedFlowers < flowerCount && attempts < 800) {
    attempts++;
    // Cluster near the flower meadow around (-12, 25) and sunny hillsides
    const clusterCenterX = -12 + (Math.random() - 0.5) * 35;
    const clusterCenterZ = 20 + (Math.random() - 0.5) * 35;
    const fx = clusterCenterX + (Math.random() - 0.5) * 12;
    const fz = clusterCenterZ + (Math.random() - 0.5) * 12;
    const fy = getTerrainHeight(fx, fz);
    getTerrainNormal(fx, fz, tempNormal);

    if (fy > 1.8 && fy < 11 && tempNormal.y > 0.85 && distanceToPath(fx, fz) > 1.2) {
      dummy.position.set(fx, fy + 0.15, fz);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(1, 1.4, 1);
      dummy.updateMatrix();
      flowersMesh.setMatrixAt(placedFlowers, dummy.matrix);
      const chosenColor = flowerPalette[Math.floor(Math.random() * flowerPalette.length)];
      flowersMesh.setColorAt(placedFlowers, chosenColor);
      placedFlowers++;
    }
  }
  flowersMesh.count = placedFlowers;
  flowersMesh.instanceMatrix.needsUpdate = true;
  if (flowersMesh.instanceColor) flowersMesh.instanceColor.needsUpdate = true;
  flowersMesh.computeBoundingSphere();
  scene.add(flowersMesh);

  // 4. Instanced Grass Tufts for volumetric ground cover
  const tuftCount = isLowQuality ? 80 : 200;
  const tuftGeom = new THREE.ConeGeometry(0.35, 0.7, 4);
  tuftGeom.translate(0, 0.35, 0);
  const tuftMat = new THREE.MeshStandardMaterial({
    color: '#467527',
    roughness: 0.9,
    metalness: 0.0,
  });
  const grassTufts = new THREE.InstancedMesh(tuftGeom, tuftMat, tuftCount);

  let placedTufts = 0;
  attempts = 0;
  while (placedTufts < tuftCount && attempts < 900) {
    attempts++;
    const gx = (Math.random() - 0.5) * 110;
    const gz = (Math.random() - 0.5) * 110;
    const gy = getTerrainHeight(gx, gz);
    getTerrainNormal(gx, gz, tempNormal);

    if (gy > 1.5 && gy < 14 && tempNormal.y > 0.8 && distanceToPath(gx, gz) > 0.8) {
      const s = 0.7 + Math.random() * 0.6;
      dummy.position.set(gx, gy, gz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
      dummy.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
      dummy.updateMatrix();
      grassTufts.setMatrixAt(placedTufts, dummy.matrix);
      placedTufts++;
    }
  }
  grassTufts.count = placedTufts;
  grassTufts.instanceMatrix.needsUpdate = true;
  grassTufts.computeBoundingSphere();
  scene.add(grassTufts);

  // 5. Arrival Wooden Dock at (0, 52)
  const dock = createWoodenDock();
  dock.position.set(0, 0.35, 52);
  scene.add(dock);

  // 6. Waterfall Spray Particles at (45, -0.2, 10)
  const sprayCount = 120;
  const sprayGeom = new THREE.BufferGeometry();
  const sprayPos = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    sprayPos[i * 3] = 45 + (Math.random() - 0.5) * 4.5;
    sprayPos[i * 3 + 1] = 0.2 + Math.random() * 2.2;
    sprayPos[i * 3 + 2] = 10 + (Math.random() - 0.5) * 4.5;
  }
  sprayGeom.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: '#e4f6fc',
    size: 0.35,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const waterfallSpray = new THREE.Points(sprayGeom, sprayMat);
  scene.add(waterfallSpray);

  return {
    mesh: terrainMesh,
    trees: treesMesh,
    rocks: rocksMesh,
    flowers: flowersMesh,
    grassTufts,
    dock,
    waterfallSpray,
  };
}

/**
 * Composite pine tree geometry (trunk + 3 staggered foliage cones)
 */
function createPineTreeGeometry(): THREE.BufferGeometry {
  const trunkGeom = new THREE.CylinderGeometry(0.2, 0.35, 2.5, 6);
  trunkGeom.translate(0, 1.25, 0);

  const foliage1 = new THREE.ConeGeometry(1.8, 2.6, 7);
  foliage1.translate(0, 3.2, 0);

  const foliage2 = new THREE.ConeGeometry(1.4, 2.3, 7);
  foliage2.translate(0, 4.4, 0);

  const foliage3 = new THREE.ConeGeometry(0.9, 1.8, 6);
  foliage3.translate(0, 5.4, 0);

  // Merge geometries into one
  const geometries = [trunkGeom, foliage1, foliage2, foliage3];
  let totalVertices = 0;
  for (const g of geometries) totalVertices += g.attributes.position.count;

  const mergedPos = new Float32Array(totalVertices * 3);
  const mergedNorm = new Float32Array(totalVertices * 3);
  let offset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      mergedPos[(offset + i) * 3] = pos.getX(i);
      mergedPos[(offset + i) * 3 + 1] = pos.getY(i);
      mergedPos[(offset + i) * 3 + 2] = pos.getZ(i);
      if (norm) {
        mergedNorm[(offset + i) * 3] = norm.getX(i);
        mergedNorm[(offset + i) * 3 + 1] = norm.getY(i);
        mergedNorm[(offset + i) * 3 + 2] = norm.getZ(i);
      }
    }
    offset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  return merged;
}

/**
 * Composite wooden dock at the coastal landing bay
 */
function createWoodenDock(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#654f3b',
    roughness: 0.85,
    metalness: 0.05,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#3d2e20',
    roughness: 0.9,
    metalness: 0.05,
  });

  // Dock walkway planks
  const plankGeom = new THREE.BoxGeometry(3.2, 0.16, 0.7);
  for (let z = -5; z <= 7; z += 0.8) {
    const plank = new THREE.Mesh(plankGeom, woodMat);
    plank.position.set(0, 0.4, z);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // Support stilts sunken into the seabed
  const postGeom = new THREE.CylinderGeometry(0.12, 0.14, 2.5, 6);
  for (const x of [-1.4, 1.4]) {
    for (const z of [-4, 0, 4, 7]) {
      const post = new THREE.Mesh(postGeom, darkWoodMat);
      post.position.set(x, -0.6, z);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Mooring bollards & lantern post
  const bollardGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6);
  const bollard1 = new THREE.Mesh(bollardGeom, darkWoodMat);
  bollard1.position.set(-1.4, 0.7, 6.8);
  const bollard2 = new THREE.Mesh(bollardGeom, darkWoodMat);
  bollard2.position.set(1.4, 0.7, 6.8);
  group.add(bollard1, bollard2);

  // Small rowboat moored to the dock
  const boat = createRowboat();
  boat.position.set(3.0, -0.15, 4.5);
  boat.rotation.y = -0.35;
  group.add(boat);

  return group;
}

function createRowboat(): THREE.Group {
  const boat = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: '#8b4513',
    roughness: 0.75,
  });
  const interiorMat = new THREE.MeshStandardMaterial({
    color: '#5c2c0e',
    roughness: 0.85,
  });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 3.2), hullMat);
  hull.castShadow = true;
  boat.add(hull);

  const interior = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 2.8), interiorMat);
  interior.position.y = 0.15;
  boat.add(interior);

  // Oars
  const oarMat = new THREE.MeshStandardMaterial({ color: '#c29b68' });
  const oar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5), oarMat);
  oar1.rotation.z = Math.PI / 3;
  oar1.position.set(-0.8, 0.4, 0);
  boat.add(oar1);

  return boat;
}
