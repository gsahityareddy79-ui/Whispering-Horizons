import * as THREE from 'three';
import {
  createOceanNormalMap,
  createWaterFoamTexture,
  createWaterfallSplashTexture,
} from './proceduralTextures';

export interface OceanWorld {
  oceanMesh: THREE.Mesh;
  waterfallGroup: THREE.Group;
  foamGroup: THREE.Group;
  update: (time: number) => void;
}

export function createOceanWorld(scene: THREE.Scene, isLowQuality: boolean = false): OceanWorld {
  const oceanSize = 850;
  const segments = isLowQuality ? 70 : 130;
  const oceanGeom = new THREE.PlaneGeometry(oceanSize, oceanSize, segments, segments);
  oceanGeom.rotateX(-Math.PI / 2);

  const oceanNormalMap = createOceanNormalMap();

  // High-fidelity PBR Ocean Material with realistic depth coloring & specular glint
  // Using onBeforeCompile to blend shallow turquoise near island (dist < 85) to deep oceanic teal
  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#083244',
    roughness: 0.05,
    metalness: 0.16,
    normalMap: oceanNormalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    transparent: true,
    opacity: 0.94,
  });

  oceanMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vWorldPos;
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vWorldPos;
      `
    );

    // Inject shallow coastal turquoise gradient into base color
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float d = length(vWorldPos.xz);
      // Shallow crystal turquoise near shore (d < 85) transitioning to deep coastal sapphire
      float shallowFactor = 1.0 - smoothstep(60.0, 95.0, d);
      vec3 shallowColor = vec3(0.08, 0.52, 0.58);
      vec3 deepColor = diffuseColor.rgb;
      diffuseColor.rgb = mix(deepColor, shallowColor, shallowFactor * 0.72);
      `
    );
  };

  const oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
  oceanMesh.position.y = 0.0;
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  // Shoreline breathing foam ring with procedural lace texture
  const foamGroup = new THREE.Group();
  const foamTex = createWaterFoamTexture();

  const outerFoamGeom = new THREE.RingGeometry(72, 88, 64);
  outerFoamGeom.rotateX(-Math.PI / 2);
  const outerFoamMat = new THREE.MeshBasicMaterial({
    map: foamTex,
    color: '#e4fcff',
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const outerFoam = new THREE.Mesh(outerFoamGeom, outerFoamMat);
  outerFoam.position.y = 0.07;
  foamGroup.add(outerFoam);

  const innerFoamGeom = new THREE.RingGeometry(64, 76, 64);
  innerFoamGeom.rotateX(-Math.PI / 2);
  const innerFoamMat = new THREE.MeshBasicMaterial({
    map: foamTex,
    color: '#ffffff',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const innerFoam = new THREE.Mesh(innerFoamGeom, innerFoamMat);
  innerFoam.position.y = 0.09;
  foamGroup.add(innerFoam);

  scene.add(foamGroup);

  // ==================== WATERFALL SYSTEM ====================
  // Cascades down from the eastern cliff at (44, 12) into the sea
  const waterfallGroup = new THREE.Group();
  waterfallGroup.position.set(44, 0, 12);

  // 1. Upper Feeder Brook
  const feederGeom = new THREE.PlaneGeometry(6, 16, 6, 8);
  feederGeom.rotateX(-Math.PI / 2);
  const feederMat = new THREE.MeshStandardMaterial({
    color: '#9ce0f5',
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    normalMap: oceanNormalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
  });
  const feederMesh = new THREE.Mesh(feederGeom, feederMat);
  feederMesh.position.set(-6, 12.8, -4);
  feederMesh.rotation.y = -Math.PI / 4;
  waterfallGroup.add(feederMesh);

  // 2. Main Curved Cascading Water Curtain
  const cascadeGeom = new THREE.PlaneGeometry(7, 14.5, 10, 24);
  const cPos = cascadeGeom.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const y = cPos.getY(i);
    // Natural ballistic arch as water leaps off the rock face
    const normalizedY = (y + 7.25) / 14.5;
    const arch = Math.sin(normalizedY * Math.PI) * 1.5;
    cPos.setZ(i, cPos.getZ(i) + arch);
  }
  cascadeGeom.computeVertexNormals();

  const cascadeMat = new THREE.MeshStandardMaterial({
    color: '#c2effc',
    roughness: 0.02,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
    normalMap: oceanNormalMap,
    normalScale: new THREE.Vector2(1.6, 1.6),
    side: THREE.DoubleSide,
  });
  const cascadeMesh = new THREE.Mesh(cascadeGeom, cascadeMat);
  cascadeMesh.position.set(0, 6.8, 0);
  cascadeMesh.rotation.y = -Math.PI / 4;
  waterfallGroup.add(cascadeMesh);

  // 3. Impact Plunge Pool Foam Ring
  const plungeGeom = new THREE.RingGeometry(1.5, 7.5, 32);
  plungeGeom.rotateX(-Math.PI / 2);
  const plungeMat = new THREE.MeshBasicMaterial({
    map: foamTex,
    color: '#ffffff',
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const plungeRing = new THREE.Mesh(plungeGeom, plungeMat);
  plungeRing.position.set(1.2, 0.12, 1.2);
  waterfallGroup.add(plungeRing);

  // 4. Waterfall Mist Spray Particle Cloud
  const splashTex = createWaterfallSplashTexture();
  const sprayCount = isLowQuality ? 16 : 32;
  const sprayGeom = new THREE.BufferGeometry();
  const sprayPositions = new Float32Array(sprayCount * 3);
  const sprayVelocities: { x: number; y: number; z: number; life: number; maxLife: number }[] = [];

  for (let i = 0; i < sprayCount; i++) {
    sprayPositions[i * 3] = (Math.random() - 0.5) * 5;
    sprayPositions[i * 3 + 1] = 0.2 + Math.random() * 4.5;
    sprayPositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    sprayVelocities.push({
      x: (Math.random() - 0.3) * 1.8,
      y: 1.2 + Math.random() * 2.2,
      z: (Math.random() - 0.3) * 1.8,
      life: Math.random() * 2.0,
      maxLife: 1.8 + Math.random() * 1.2,
    });
  }

  sprayGeom.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
  const sprayMat = new THREE.PointsMaterial({
    map: splashTex,
    size: 5.5,
    color: '#ffffff',
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sprayPoints = new THREE.Points(sprayGeom, sprayMat);
  sprayPoints.position.set(1.2, 0.2, 1.2);
  waterfallGroup.add(sprayPoints);

  scene.add(waterfallGroup);

  // Retain baseline Y positions for Gerstner wave displacement
  const origY = new Float32Array(oceanGeom.attributes.position.count);
  for (let i = 0; i < origY.length; i++) {
    origY[i] = oceanGeom.attributes.position.getY(i);
  }

  return {
    oceanMesh,
    waterfallGroup,
    foamGroup,
    update: (time: number) => {
      // 1. Gerstner Waves Simulation (sharper crests, natural ocean swell)
      const pos = oceanGeom.attributes.position;
      const step = isLowQuality ? 2 : 1;

      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const dist = Math.hypot(x, z);

        // Calm water near island shore, rolling waves in open sea
        const waveDamp = Math.min(1.0, Math.max(0.06, (dist - 65) / 55));

        // Primary Gerstner swell
        const k1 = 0.04;
        const phase1 = x * 0.035 + z * 0.028 + time * 1.5;
        const w1 = Math.sin(phase1);
        const g1 = Math.sin(phase1) - Math.cos(phase1) * 0.25; // Crest steepening

        // Secondary cross swell
        const phase2 = x * 0.07 - z * 0.05 + time * 1.1;
        const g2 = Math.cos(phase2) * 0.24;

        // High frequency ripple
        const phase3 = (x + z) * 0.14 - time * 2.4;
        const g3 = Math.sin(phase3) * 0.08;

        const totalWave = (g1 * 0.5 + g2 + g3) * waveDamp;
        pos.setY(i, origY[i] + totalWave);
      }
      pos.needsUpdate = true;

      // 2. Dual Normal Map Scrolling (simulates criss-crossing surface capillary waves)
      oceanNormalMap.offset.x = (time * 0.028) % 1;
      oceanNormalMap.offset.y = (time * 0.022) % 1;

      // 3. Shoreline Foam Surge Breathing Animation
      const surge1 = Math.sin(time * 0.75) * 0.035;
      outerFoam.scale.set(1 + surge1, 1, 1 + surge1);
      outerFoam.position.y = 0.07 + Math.sin(time * 0.75) * 0.03;
      outerFoamMat.opacity = 0.42 + Math.sin(time * 0.75) * 0.12;

      const surge2 = Math.cos(time * 0.75 + 0.5) * 0.04;
      innerFoam.scale.set(1 + surge2, 1, 1 + surge2);
      innerFoam.position.y = 0.09 + Math.cos(time * 0.75 + 0.5) * 0.03;

      // 4. Waterfall Rushing Flow & Mist Particle Dynamics
      feederMat.normalMap!.offset.y = (-time * 0.65) % 1;
      cascadeMat.normalMap!.offset.y = (-time * 1.1) % 1;

      // Plunge pool pulsing ripples
      const plungeScale = 1 + Math.sin(time * 3.5) * 0.08;
      plungeRing.scale.set(plungeScale, 1, plungeScale);
      plungeMat.opacity = 0.65 + Math.sin(time * 3.5) * 0.18;

      // Mist spray drifting
      const dt = 0.016;
      const sPositions = sprayGeom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < sprayCount; i++) {
        const vel = sprayVelocities[i];
        vel.life += dt;
        if (vel.life > vel.maxLife) {
          vel.life = 0;
          sPositions.setXYZ(
            i,
            (Math.random() - 0.5) * 3,
            0.2 + Math.random() * 0.8,
            (Math.random() - 0.5) * 3
          );
        } else {
          const curX = sPositions.getX(i);
          const curY = sPositions.getY(i);
          const curZ = sPositions.getZ(i);
          sPositions.setXYZ(
            i,
            curX + vel.x * dt,
            curY + vel.y * dt * 0.7,
            curZ + vel.z * dt
          );
        }
      }
      sPositions.needsUpdate = true;
    },
  };
}
