import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createCloudDensityTexture } from './proceduralTextures';

export interface SkyEnvironment {
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  skyDome: THREE.Mesh;
  stars: THREE.Points;
  cloudsGroup: THREE.Group;
  updateTimeOfDay: (hour: number) => void;
  updateClouds: (delta: number) => void;
}

export function setupSkyAndLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): SkyEnvironment {
  // 1. Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // 2. Cinematic Directional Key Sun/Moon Light
  const sunLight = new THREE.DirectionalLight(0xffecd1, 2.4);
  sunLight.position.set(70, 50, 45);
  sunLight.castShadow = !isSoftwareGl;
  if (sunLight.castShadow) {
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 240;
    const d = 65;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  // 3. Cool Ambient Fill (Sky Zenith to Earth Bounce)
  const hemiLight = new THREE.HemisphereLight(0xa6dcff, 0x5a4835, 0.75);
  scene.add(hemiLight);

  // 4. Horizon-Matched Atmospheric Fog
  scene.fog = new THREE.FogExp2(0xf59858, 0.0075);

  // 5. Procedural Sky Dome with Sun Corona & Horizon Gradient
  const skyGeom = new THREE.SphereGeometry(380, 32, 20);
  skyGeom.scale(-1, 1, 1);

  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x193252) },
      bottomColor: { value: new THREE.Color(0xf59858) },
      sunPosition: { value: new THREE.Vector3(70, 50, 45).normalize() },
      offset: { value: 15 },
      exponent: { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 sunPosition;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float f = max(0.0, pow(max(0.0, 1.0 - h), exponent));
        vec3 col = mix(topColor, bottomColor, f);

        // Sun disc and atmospheric golden halo
        vec3 dir = normalize(vWorldPosition);
        float sunDot = max(0.0, dot(dir, normalize(sunPosition)));
        if (sunPosition.y > -0.08) {
          col += vec3(1.0, 0.95, 0.75) * pow(sunDot, 256.0) * 1.4; // Sun disc
          col += vec3(1.0, 0.65, 0.35) * pow(sunDot, 18.0) * 0.45;  // Warm corona
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const skyDome = new THREE.Mesh(skyGeom, skyMat);
  scene.add(skyDome);

  // 6. Volumetric 3D Drifting Cumulus Clouds
  const cloudsGroup = new THREE.Group();
  const cloudTex = createCloudDensityTexture();
  const cloudMat = new THREE.MeshStandardMaterial({
    map: cloudTex,
    color: '#ffddbc', // warm golden-hour tinted cloud underbelly
    transparent: true,
    opacity: 0.72,
    roughness: 0.9,
    metalness: 0.0,
    depthWrite: false,
  });

  const cloudCount = 18;
  const cloudPuffs: THREE.Mesh[] = [];

  for (let i = 0; i < cloudCount; i++) {
    const puffGeom = new THREE.DodecahedronGeometry(22 + Math.random() * 16, 1);
    puffGeom.scale(1.8 + Math.random() * 0.8, 0.45 + Math.random() * 0.25, 1.4 + Math.random() * 0.6);
    const puff = new THREE.Mesh(puffGeom, cloudMat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 160;
    puff.position.set(
      Math.cos(angle) * dist,
      95 + Math.random() * 45,
      Math.sin(angle) * dist
    );
    puff.rotation.y = Math.random() * Math.PI;
    cloudsGroup.add(puff);
    cloudPuffs.push(puff);
  }
  scene.add(cloudsGroup);

  // 7. Nighttime Starlight Field
  const starCount = 800;
  const starGeom = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.95);
    const r = 370;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 1.4,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeom, starMat);
  scene.add(stars);

  // Time of Day progression
  const updateTimeOfDay = (hour: number) => {
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunDist = 110;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist * 0.88;
    const sunZ = Math.cos(sunAngle * 0.5) * 45;

    sunLight.position.set(sunX, Math.max(-25, sunY), sunZ);
    skyMat.uniforms.sunPosition.value.set(sunX, sunY, sunZ).normalize();

    if (hour >= 6 && hour < 16) {
      // Crisp Bright Midday
      skyMat.uniforms.topColor.value.set('#1a5385');
      skyMat.uniforms.bottomColor.value.set('#8ee4f5');
      sunLight.color.set('#fff9eb');
      sunLight.intensity = 2.5;
      hemiLight.color.set('#d8f3dc');
      hemiLight.groundColor.set('#4b6845');
      hemiLight.intensity = 0.85;
      cloudMat.color.set('#ffffff');
      cloudMat.opacity = 0.65;
      (scene.fog as THREE.FogExp2).color.set('#8ee4f5');
      starMat.opacity = 0.0;
    } else if (hour >= 16 && hour < 19) {
      // Signature Cinematic Golden Hour & Sunset (5:30 PM)
      const t = (hour - 16) / 3;
      const sunsetZenith = new THREE.Color('#1f223a').lerp(new THREE.Color('#0f172a'), t * 0.4);
      const sunsetHorizon = new THREE.Color('#f77f00').lerp(new THREE.Color('#d62828'), t * 0.7);

      skyMat.uniforms.topColor.value.copy(sunsetZenith);
      skyMat.uniforms.bottomColor.value.copy(sunsetHorizon);
      sunLight.color.set('#ff9f43').lerp(new THREE.Color('#f35b04'), t);
      sunLight.intensity = 2.3 - t * 0.7;
      hemiLight.color.set('#f4a261');
      hemiLight.groundColor.set('#3a2416');
      hemiLight.intensity = 0.7;
      cloudMat.color.set('#ffc187');
      cloudMat.opacity = 0.8;
      (scene.fog as THREE.FogExp2).color.copy(sunsetHorizon);
      starMat.opacity = Math.max(0, (t - 0.5) * 0.6);
    } else if (hour >= 19 && hour < 21) {
      // Atmospheric Twilight / Mauve Dusk
      const t = (hour - 19) / 2;
      skyMat.uniforms.topColor.value.set('#0b132b');
      skyMat.uniforms.bottomColor.value.set('#4a154b').lerp(new THREE.Color('#1c1936'), t);
      sunLight.color.set('#d97706');
      sunLight.intensity = Math.max(0.25, 1.5 - t * 1.25);
      hemiLight.color.set('#6a4c93');
      hemiLight.groundColor.set('#1a162b');
      hemiLight.intensity = 0.5;
      cloudMat.color.set('#7b6888');
      cloudMat.opacity = 0.55;
      (scene.fog as THREE.FogExp2).color.set('#2d1a3b');
      starMat.opacity = 0.35 + t * 0.55;
    } else if (hour >= 21 || hour < 5) {
      // Peaceful Starry Midnight with Moon
      skyMat.uniforms.topColor.value.set('#03071e');
      skyMat.uniforms.bottomColor.value.set('#0a1128');
      sunLight.color.set('#8da9c4'); // soft moonlight
      sunLight.intensity = 0.5;
      hemiLight.color.set('#1c2541');
      hemiLight.groundColor.set('#0b090a');
      hemiLight.intensity = 0.35;
      cloudMat.color.set('#1c2541');
      cloudMat.opacity = 0.35;
      (scene.fog as THREE.FogExp2).color.set('#0b132b');
      starMat.opacity = 0.95;
    } else {
      // Dawn (5 to 6 AM)
      const t = hour - 5;
      skyMat.uniforms.topColor.value.set('#1c2541');
      skyMat.uniforms.bottomColor.value.set('#fcbf49').lerp(new THREE.Color('#8ee4f5'), t);
      sunLight.color.set('#f77f00');
      sunLight.intensity = 1.7;
      hemiLight.color.set('#90e0ef');
      hemiLight.groundColor.set('#2d3a1f');
      hemiLight.intensity = 0.65;
      cloudMat.color.set('#ffe3b3');
      cloudMat.opacity = 0.7;
      (scene.fog as THREE.FogExp2).color.set('#fcbf49');
      starMat.opacity = Math.max(0, 1 - t * 2);
    }
  };

  updateTimeOfDay(17.5); // Default to cinematic sunset

  return {
    sunLight,
    hemiLight,
    skyDome,
    stars,
    cloudsGroup,
    updateTimeOfDay,
    updateClouds: (delta: number) => {
      // Gently drift clouds across the sky
      for (const puff of cloudPuffs) {
        puff.position.x += delta * 1.4;
        if (puff.position.x > 220) {
          puff.position.x = -220;
        }
      }
    },
  };
}
