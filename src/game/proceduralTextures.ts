import * as THREE from 'three';

/**
 * Procedural texture generator for Whispering Horizons
 * Ensures 100% zero external assets / zero 404 dependencies.
 */

export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base lush grass green
  ctx.fillStyle = '#3a6828';
  ctx.fillRect(0, 0, 512, 512);

  // Noise layers for organic sod, moss and clover
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random();
    if (r < 0.35) {
      ctx.fillStyle = '#4c8234';
    } else if (r < 0.65) {
      ctx.fillStyle = '#2d521f';
    } else if (r < 0.85) {
      ctx.fillStyle = '#5a963e';
    } else {
      ctx.fillStyle = '#6e7a32'; // earthy dry patch
    }
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  // Subtle blades
  ctx.strokeStyle = '#28461b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 600; i++) {
    const bx = Math.random() * 512;
    const by = Math.random() * 512;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (Math.random() - 0.5) * 6, by - 4 - Math.random() * 6);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered granite base
  ctx.fillStyle = '#555452';
  ctx.fillRect(0, 0, 512, 512);

  // Strata bands
  for (let y = 0; y < 512; y += 4) {
    const darkness = 70 + Math.sin(y * 0.05) * 20 + (Math.random() - 0.5) * 15;
    ctx.fillStyle = `rgb(${darkness}, ${darkness - 4}, ${darkness - 8})`;
    ctx.fillRect(0, y, 512, 4);
  }

  // Granular speckle and cracks
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = Math.floor(Math.random() * 80) + 40;
    ctx.fillStyle = `rgba(${v}, ${v + 2}, ${v - 2}, 0.6)`;
    ctx.fillRect(x, y, 2 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Lichen patches
  for (let i = 0; i < 15; i++) {
    const lx = Math.random() * 512;
    const ly = Math.random() * 512;
    const lr = 10 + Math.random() * 25;
    ctx.fillStyle = 'rgba(80, 95, 65, 0.45)';
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPathTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm packed dirt and gravel
  ctx.fillStyle = '#7a6750';
  ctx.fillRect(0, 0, 512, 512);

  // Cobblestones
  ctx.strokeStyle = '#4e4133';
  ctx.lineWidth = 2;
  const rows = 16;
  const cols = 16;
  const w = 512 / cols;
  const h = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (w / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * w + offset + (Math.random() - 0.5) * 4;
      const y = r * h + (Math.random() - 0.5) * 4;
      const stoneShade = 100 + Math.floor((Math.random() - 0.5) * 40);
      ctx.fillStyle = `rgb(${stoneShade + 15}, ${stoneShade + 5}, ${stoneShade - 10})`;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
      ctx.fill();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm golden shore sand
  ctx.fillStyle = '#d4b483';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const c = Math.random() < 0.5 ? '#c4a26f' : '#e6c89c';
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3e271a';
  ctx.fillRect(0, 0, 256, 256);

  // Vertical tree bark fissures
  for (let x = 0; x < 256; x += 4) {
    const v = Math.random() * 40;
    ctx.fillStyle = `rgb(${45 + v}, ${30 + v * 0.7}, ${20 + v * 0.5})`;
    ctx.fillRect(x, 0, 3, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWaterFoamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a3d52';
  ctx.fillRect(0, 0, 256, 256);

  // Sea foam lacing
  ctx.strokeStyle = 'rgba(235, 250, 255, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    let cx = Math.random() * 256;
    let cy = Math.random() * 256;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 40;
      cy += (Math.random() - 0.5) * 40;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
