import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface SkyEnvironment {
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  skyDome: THREE.Mesh;
  stars: THREE.Points;
  updateTimeOfDay: (hour: number) => void;
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

  // 2. Warm Key Directional Sun/Moon Light
  const sunLight = new THREE.DirectionalLight(0xfff3db, 2.2);
  sunLight.position.set(60, 45, 40);
  sunLight.castShadow = !isSoftwareGl;
  if (sunLight.castShadow) {
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 180;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  // 3. Cool Hemisphere Light Fill (Sky color against Earth bounce)
  const hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x4d3c2a, 0.7);
  scene.add(hemiLight);

  // 4. Horizon-matched Atmospheric Fog
  scene.fog = new THREE.FogExp2(0xf0aa75, 0.009);

  // 5. Procedural Sky Dome
  const skyGeom = new THREE.SphereGeometry(320, 24, 16);
  // Invert sphere normals so it faces inward
  skyGeom.scale(-1, 1, 1);

  // Sky shader with gradient between zenith and horizon
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x1d3e69) },
      bottomColor: { value: new THREE.Color(0xf59858) },
      sunPosition: { value: new THREE.Vector3(60, 45, 40).normalize() },
      offset: { value: 20 },
      exponent: { value: 0.6 },
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

        // Sun disc glow
        vec3 dir = normalize(vWorldPosition);
        float sunDot = max(0.0, dot(dir, normalize(sunPosition)));
        if (sunPosition.y > -0.1) {
          col += vec3(1.0, 0.9, 0.6) * pow(sunDot, 128.0) * 0.8;
          col += vec3(1.0, 0.6, 0.3) * pow(sunDot, 16.0) * 0.35;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const skyDome = new THREE.Mesh(skyGeom, skyMat);
  scene.add(skyDome);

  // 6. Night Sky Glittering Stars
  const starCount = 600;
  const starGeom = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.9); // upper hemisphere only
    const r = 310;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 1.2,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeom, starMat);
  scene.add(stars);

  // Time of Day function (Hour: 0 to 24)
  const updateTimeOfDay = (hour: number) => {
    // Convert hour to sun angle (e.g. 12 = noon zenith, 17.5 = sunset, 0 = midnight)
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunDist = 90;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist * 0.9;
    const sunZ = Math.cos(sunAngle * 0.5) * 35;

    sunLight.position.set(sunX, Math.max(-20, sunY), sunZ);
    skyMat.uniforms.sunPosition.value.set(sunX, sunY, sunZ).normalize();

    // Color definitions across day phases
    // 12: Noon
    // 17.5: Golden Sunset
    // 19.5: Twilight
    // 23: Night
    // 5.5: Dawn
    if (hour >= 6 && hour < 16) {
      // Crisp Bright Daytime
      skyMat.uniforms.topColor.value.set('#1e6091');
      skyMat.uniforms.bottomColor.value.set('#90e0ef');
      sunLight.color.set('#fff8e7');
      sunLight.intensity = 2.4;
      hemiLight.color.set('#d8f3dc');
      hemiLight.groundColor.set('#52796f');
      hemiLight.intensity = 0.8;
      (scene.fog as THREE.FogExp2).color.set('#90e0ef');
      starMat.opacity = 0.0;
    } else if (hour >= 16 && hour < 19) {
      // Golden Hour & Sunset (Signature Whispering Horizons Look!)
      const t = (hour - 16) / 3;
      const sunsetZenith = new THREE.Color('#22223b').lerp(new THREE.Color('#101828'), t * 0.5);
      const sunsetHorizon = new THREE.Color('#f4845f').lerp(new THREE.Color('#c95738'), t);

      skyMat.uniforms.topColor.value.copy(sunsetZenith);
      skyMat.uniforms.bottomColor.value.copy(sunsetHorizon);
      sunLight.color.set('#ff9f43').lerp(new THREE.Color('#f35b04'), t);
      sunLight.intensity = 2.2 - t * 0.8;
      hemiLight.color.set('#e29578');
      hemiLight.groundColor.set('#3d2b1f');
      hemiLight.intensity = 0.65;
      (scene.fog as THREE.FogExp2).color.copy(sunsetHorizon);
      starMat.opacity = Math.max(0, (t - 0.5) * 0.5);
    } else if (hour >= 19 && hour < 21) {
      // Twilight / Dusk
      const t = (hour - 19) / 2;
      skyMat.uniforms.topColor.value.set('#0d1b2a');
      skyMat.uniforms.bottomColor.value.set('#4a2545').lerp(new THREE.Color('#1f1a3a'), t);
      sunLight.color.set('#cf7500');
      sunLight.intensity = Math.max(0.2, 1.4 - t * 1.2);
      hemiLight.color.set('#5e503f');
      hemiLight.groundColor.set('#1c1917');
      hemiLight.intensity = 0.45;
      (scene.fog as THREE.FogExp2).color.set('#271f3b');
      starMat.opacity = 0.3 + t * 0.6;
    } else if (hour >= 21 || hour < 5) {
      // Starry Midnight with Moon
      skyMat.uniforms.topColor.value.set('#03071e');
      skyMat.uniforms.bottomColor.value.set('#0b132b');
      sunLight.color.set('#7da4cc'); // pale cool moonlight
      sunLight.intensity = 0.45;
      hemiLight.color.set('#1c2541');
      hemiLight.groundColor.set('#0b090a');
      hemiLight.intensity = 0.3;
      (scene.fog as THREE.FogExp2).color.set('#09101f');
      starMat.opacity = 0.95;
    } else {
      // Dawn (5 to 6 AM)
      const t = (hour - 5);
      skyMat.uniforms.topColor.value.set('#1d2d44');
      skyMat.uniforms.bottomColor.value.set('#ffb703').lerp(new THREE.Color('#90e0ef'), t);
      sunLight.color.set('#ffb703');
      sunLight.intensity = 1.6;
      hemiLight.color.set('#8ecae6');
      hemiLight.groundColor.set('#283618');
      hemiLight.intensity = 0.6;
      (scene.fog as THREE.FogExp2).color.set('#ffb703');
      starMat.opacity = Math.max(0, 1 - t * 2);
    }
  };

  // Default to breathtaking golden hour sunset (17.5 = 5:30 PM)
  updateTimeOfDay(17.5);

  return {
    sunLight,
    hemiLight,
    skyDome,
    stars,
    updateTimeOfDay,
  };
}
