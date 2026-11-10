import * as THREE from 'three';

/**
 * High-Fidelity Procedural PBR Texture & Normal Map Generator
 * Produces crisp, organic albedo, normal, and roughness maps entirely in code.
 * Ensures zero 404 dependencies and photorealistic surface response.
 */

// Multi-octave Perlin-like 2D noise generator for rich organic surfaces
function fbmNoise(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val +=
      (Math.sin(x * freq * 1.5 + Math.cos(y * freq * 2.1)) * 0.5 +
        Math.cos(y * freq * 1.8 + Math.sin(x * freq * 2.4)) * 0.5) *
      amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return (val + 1.0) * 0.5;
}

function createFbmGrid(width: number, height: number, scale: number, octaves = 4): Float32Array {
  const grid = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * scale;
      const ny = (y / height) * scale;
      grid[y * width + x] = Math.max(0, Math.min(1, fbmNoise(nx, ny, octaves)));
    }
  }
  return grid;
}

// Convert height array to normal map canvas
function heightToNormalMap(
  heights: Float32Array,
  width: number,
  height: number,
  intensity = 2.5
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const xL = (x - 1 + width) % width;
      const xR = (x + 1) % width;
      const yU = (y - 1 + height) % height;
      const yD = (y + 1) % height;

      const hL = heights[y * width + xL];
      const hR = heights[y * width + xR];
      const hU = heights[yU * width + x];
      const hD = heights[yD * width + x];

      const dx = (hL - hR) * intensity;
      const dy = (hU - hD) * intensity;
      const dz = 1.0;

      const len = Math.hypot(dx, dy, dz);
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      const pIdx = idx * 4;
      data[pIdx] = Math.floor(nx * 255);
      data[pIdx + 1] = Math.floor(ny * 255);
      data[pIdx + 2] = Math.floor(nz * 255);
      data[pIdx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 1. Lush Grassy Turf Albedo + Normal Map
 */
export function createGrassMaterials(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const heights = createFbmGrid(width, height, 8, 4);

  // Base grass color with layered organic variation
  ctx.fillStyle = '#3a6627';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < width * height; i++) {
    const h = heights[i];
    const p = i * 4;
    // Deep moss roots to vibrant sunlit tips
    const r = Math.floor(40 + h * 38 + (Math.random() - 0.5) * 6);
    const g = Math.floor(78 + h * 65 + (Math.random() - 0.5) * 8);
    const b = Math.floor(28 + h * 30 + (Math.random() - 0.5) * 6);

    data[p] = Math.max(0, Math.min(255, r));
    data[p + 1] = Math.max(0, Math.min(255, g));
    data[p + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(imgData, 0, 0);

  // Overlay fine individual grass blades
  ctx.strokeStyle = 'rgba(85, 148, 54, 0.45)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3000; i++) {
    const bx = Math.random() * width;
    const by = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (Math.random() - 0.5) * 7, by - 5 - Math.random() * 7);
    ctx.stroke();
  }

  // Little clover patches and moss dots
  ctx.fillStyle = 'rgba(118, 185, 80, 0.55)';
  for (let i = 0; i < 800; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.2 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(16, 16);
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = heightToNormalMap(heights, width, height, 3.5);
  normalMap.repeat.set(16, 16);

  // Roughness map (dry sod ~0.85, moist clover ~0.65)
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#b8b8b8';
  rCtx.fillRect(0, 0, 256, 256);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(16, 16);

  return { map, normalMap, roughnessMap };
}

/**
 * 2. Rugged Coastal Cliff & Granite Rock Textures
 */
export function createCliffRockMaterials(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const heights = new Float32Array(width * height);

  // Geological rock strata bands
  for (let y = 0; y < height; y++) {
    const strata = Math.sin(y * 0.08) * 0.32 + Math.cos(y * 0.02) * 0.22;
    for (let x = 0; x < width; x++) {
      const n = (Math.random() - 0.5) * 0.16;
      const v = Math.max(0, Math.min(1, 0.5 + strata + n));
      heights[y * width + x] = v;

      // Dark slate / weathered granite with earth undertones
      const val = Math.floor(70 + v * 60 + Math.sin(x * 0.04) * 14);
      ctx.fillStyle = `rgb(${val + 12}, ${val + 8}, ${val + 2})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Lichen & moss crevices
  ctx.fillStyle = 'rgba(82, 104, 68, 0.45)';
  for (let i = 0; i < 50; i++) {
    const lx = Math.random() * width;
    const ly = Math.random() * height;
    const lr = 8 + Math.random() * 22;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Deep fracture lines
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let fx = Math.random() * width;
    let fy = Math.random() * height;
    ctx.moveTo(fx, fy);
    for (let j = 0; j < 6; j++) {
      fx += (Math.random() - 0.5) * 45;
      fy += 10 + Math.random() * 35;
      ctx.lineTo(fx, fy);
    }
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(10, 10);
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = heightToNormalMap(heights, width, height, 4.5);
  normalMap.repeat.set(10, 10);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#dcdcdc'; // High roughness for weathered rock
  rCtx.fillRect(0, 0, 256, 256);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(10, 10);

  return { map, normalMap, roughnessMap };
}

/**
 * 3. Cobblestone Island Trail Texture + Normal Map
 */
export function createCobblestoneMaterials(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const heights = new Float32Array(width * height);

  ctx.fillStyle = '#544637';
  ctx.fillRect(0, 0, width, height);

  const cols = 12;
  const rows = 12;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const cx = c * cellW + offset + (Math.random() - 0.5) * 4;
      const cy = r * cellH + (Math.random() - 0.5) * 4;
      const w = cellW - 6 + (Math.random() - 0.5) * 4;
      const h = cellH - 6 + (Math.random() - 0.5) * 4;

      const shade = Math.floor(122 + (Math.random() - 0.5) * 38);
      ctx.fillStyle = `rgb(${shade + 18}, ${shade + 10}, ${shade - 6})`;
      ctx.strokeStyle = '#352b21';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.roundRect(cx + 3, cy + 3, w, h, 8);
      ctx.fill();
      ctx.stroke();

      const midX = Math.floor(cx + cellW * 0.5);
      const midY = Math.floor(cy + cellH * 0.5);
      const rad = Math.floor(Math.min(w, h) * 0.45);

      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const px = (midX + dx + width) % width;
          const py = (midY + dy + height) % height;
          const dist = Math.hypot(dx, dy) / rad;
          if (dist <= 1.0) {
            heights[py * width + px] = Math.max(heights[py * width + px], 1.0 - dist * dist);
          }
        }
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = heightToNormalMap(heights, width, height, 4.5);
  normalMap.repeat.set(6, 6);

  return { map, normalMap };
}

/**
 * 4. Wet Shoreline Sand Texture (Glossy & Reflective)
 */
export function createWetSandMaterials(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 256;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#caa572';
  ctx.fillRect(0, 0, width, height);

  const heights = createFbmGrid(width, height, 10, 3);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < width * height; i++) {
    const h = heights[i];
    const p = i * 4;
    const r = Math.floor(188 + h * 24);
    const g = Math.floor(152 + h * 20);
    const b = Math.floor(108 + h * 15);
    data[p] = r;
    data[p + 1] = g;
    data[p + 2] = b;
  }
  ctx.putImageData(imgData, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = heightToNormalMap(heights, width, height, 2.2);
  normalMap.repeat.set(8, 8);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#404040'; // Low roughness = glossy wet reflection!
  rCtx.fillRect(0, 0, 256, 256);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);

  return { map, normalMap, roughnessMap };
}

/**
 * 5. Weathered Timber & Pier Planks
 */
export function createWoodPlankMaterials(): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3828';
  ctx.fillRect(0, 0, width, height);

  const plankCount = 8;
  const plankH = height / plankCount;
  const heights = new Float32Array(width * height);

  for (let i = 0; i < plankCount; i++) {
    const py = i * plankH;
    const shade = 72 + Math.floor((Math.random() - 0.5) * 20);
    ctx.fillStyle = `rgb(${shade + 16}, ${shade + 5}, ${shade - 8})`;
    ctx.fillRect(0, py + 2, width, plankH - 4);

    ctx.strokeStyle = `rgb(${shade - 10}, ${shade - 15}, ${shade - 20})`;
    ctx.lineWidth = 1;
    for (let l = 0; l < 10; l++) {
      const ly = py + 3 + Math.random() * (plankH - 8);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.bezierCurveTo(
        width * 0.3,
        ly + (Math.random() - 0.5) * 4,
        width * 0.7,
        ly + (Math.random() - 0.5) * 4,
        width,
        ly
      );
      ctx.stroke();
    }

    ctx.fillStyle = '#221a14';
    ctx.beginPath();
    ctx.arc(24, py + plankH * 0.5, 3.5, 0, Math.PI * 2);
    ctx.arc(width - 24, py + plankH * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    for (let y = Math.floor(py); y < Math.floor(py + plankH); y++) {
      for (let x = 0; x < width; x++) {
        const edgeDist = Math.min(y - py, py + plankH - y);
        heights[y * width + x] = Math.min(1.0, edgeDist / 4);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = heightToNormalMap(heights, width, height, 3.5);

  return { map, normalMap };
}

/**
 * 6. Procedural Ocean Normal Map for Gerstner Wave Specular Highlights
 */
export function createOceanNormalMap(): THREE.CanvasTexture {
  const width = 256;
  const height = 256;
  const heights = createFbmGrid(width, height, 6, 4);
  const normalMap = heightToNormalMap(heights, width, height, 3.5);
  normalMap.repeat.set(14, 14);
  return normalMap;
}

/**
 * 7. Soft Cumulus Cloud Density Map
 */
export function createCloudDensityTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 240, 225, 0.55)');
  gradient.addColorStop(0.85, 'rgba(245, 215, 195, 0.16)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 8. Organic Coastal Sea Foam Lace Texture
 */
export function createWaterFoamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, 256, 256);

  // Cellular bubbly foam lace
  ctx.strokeStyle = 'rgba(240, 252, 255, 0.85)';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    if (Math.random() > 0.4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 9. Waterfall Mist & Spray Particle Texture
 */
export function createWaterfallSplashTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(240, 252, 255, 0.85)');
  grad.addColorStop(0.35, 'rgba(210, 245, 255, 0.45)');
  grad.addColorStop(0.7, 'rgba(180, 230, 250, 0.15)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
