import * as THREE from 'three';
import { createBarkTexture, createRockTexture } from './proceduralTextures';

/**
 * Procedural Composite Models for Whispering Horizons
 * Follows the 3-12 part procedural model standard with varied roughness/metalness.
 */

// Materials shared across procedural props
const stoneMat = new THREE.MeshStandardMaterial({
  color: '#848079',
  roughness: 0.85,
  metalness: 0.05,
});

const whitePlasterMat = new THREE.MeshStandardMaterial({
  color: '#e8e6df',
  roughness: 0.7,
  metalness: 0.02,
});

const redTrimMat = new THREE.MeshStandardMaterial({
  color: '#8f2923',
  roughness: 0.6,
  metalness: 0.1,
});

const brassMat = new THREE.MeshStandardMaterial({
  color: '#d4af37',
  roughness: 0.25,
  metalness: 0.85,
});

const copperRoofMat = new THREE.MeshStandardMaterial({
  color: '#3d7864', // aged verdigris copper
  roughness: 0.55,
  metalness: 0.35,
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#d4f2f7',
  roughness: 0.1,
  metalness: 0.1,
  transparent: true,
  opacity: 0.45,
});

const woodMat = new THREE.MeshStandardMaterial({
  color: '#5a422e',
  roughness: 0.8,
  metalness: 0.05,
});

/**
 * 1. The Grand Lighthouse (Summit Landmark at 18, -30)
 * 8-part composite architectural structure
 */
export interface LighthouseStructure {
  group: THREE.Group;
  beaconLight: THREE.SpotLight;
  beaconMesh: THREE.Mesh;
  lightCone: THREE.Mesh;
  update: (delta: number) => void;
}

export function createLighthouse(): LighthouseStructure {
  const group = new THREE.Group();

  // Part 1: Flared Octagonal Stone Plinth Foundation
  const baseGeom = new THREE.CylinderGeometry(4.2, 4.8, 2.5, 8);
  const base = new THREE.Mesh(baseGeom, stoneMat);
  base.position.y = 1.25;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Entrance steps
  const stepsGeom = new THREE.BoxGeometry(2.0, 0.4, 2.2);
  const steps = new THREE.Mesh(stepsGeom, stoneMat);
  steps.position.set(0, 0.2, 4.5);
  steps.castShadow = true;
  group.add(steps);

  // Wooden entrance door
  const doorGeom = new THREE.BoxGeometry(1.2, 2.0, 0.2);
  const door = new THREE.Mesh(doorGeom, woodMat);
  door.position.set(0, 1.8, 4.0);
  door.castShadow = true;
  group.add(door);

  // Part 2: Main Tapered White Masonry Shaft
  const shaftGeom = new THREE.CylinderGeometry(2.6, 3.8, 14.0, 12);
  const shaft = new THREE.Mesh(shaftGeom, whitePlasterMat);
  shaft.position.y = 9.5;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Horizontal decorative red navigation bands
  const bandGeom = new THREE.CylinderGeometry(3.3, 3.4, 1.8, 12);
  const band = new THREE.Mesh(bandGeom, redTrimMat);
  band.position.y = 8.5;
  band.castShadow = true;
  group.add(band);

  const upperBandGeom = new THREE.CylinderGeometry(2.8, 2.9, 1.4, 12);
  const upperBand = new THREE.Mesh(upperBandGeom, redTrimMat);
  upperBand.position.y = 13.5;
  upperBand.castShadow = true;
  group.add(upperBand);

  // Part 3: Observation Gallery Platform
  const galleryFloorGeom = new THREE.CylinderGeometry(3.6, 3.0, 0.8, 12);
  const galleryFloor = new THREE.Mesh(galleryFloorGeom, stoneMat);
  galleryFloor.position.y = 16.8;
  galleryFloor.castShadow = true;
  group.add(galleryFloor);

  // Gallery Railing (Iron)
  const railingGeom = new THREE.CylinderGeometry(3.55, 3.55, 1.0, 12, 1, true);
  const railingMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.5, metalness: 0.8, wireframe: true });
  const railing = new THREE.Mesh(railingGeom, railingMat);
  railing.position.y = 17.7;
  group.add(railing);

  // Part 4: Lantern Room Glass Enclosure
  const lanternGlassGeom = new THREE.CylinderGeometry(2.2, 2.2, 2.8, 8);
  const lanternGlass = new THREE.Mesh(lanternGlassGeom, glassMat);
  lanternGlass.position.y = 18.6;
  group.add(lanternGlass);

  // Part 5: Copper Dome Cupola & Weather Vane
  const domeGeom = new THREE.SphereGeometry(2.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeom, copperRoofMat);
  dome.position.y = 20.0;
  dome.castShadow = true;
  group.add(dome);

  // Weather vane spire
  const spireGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6);
  const spire = new THREE.Mesh(spireGeom, brassMat);
  spire.position.y = 21.8;
  group.add(spire);

  // Part 6: Glowing Fresnel Lens Core & Rotating Beacon
  const beaconCoreGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: '#fff6c2' });
  const beaconMesh = new THREE.Mesh(beaconCoreGeom, beaconMat);
  beaconMesh.position.y = 18.6;
  group.add(beaconMesh);

  // High-intensity Rotating Spotlight
  const beaconLight = new THREE.SpotLight(0xfff1aa, 12, 120, Math.PI / 8, 0.3, 1.2);
  beaconLight.position.set(0, 18.6, 0);
  beaconLight.castShadow = false; // keep frame rates silky smooth

  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(40, 16, 0);
  group.add(lightTarget);
  beaconLight.target = lightTarget;
  group.add(beaconLight);

  // Volumetric Light Beam Cone
  const coneGeom = new THREE.ConeGeometry(8, 70, 16, 1, true);
  coneGeom.rotateX(Math.PI / 2);
  coneGeom.translate(0, 0, 35);
  const coneMat = new THREE.MeshBasicMaterial({
    color: '#ffefa0',
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lightCone = new THREE.Mesh(coneGeom, coneMat);
  lightCone.position.set(0, 18.6, 0);
  group.add(lightCone);

  let angle = 0;

  return {
    group,
    beaconLight,
    beaconMesh,
    lightCone,
    update: (delta: number) => {
      angle += delta * 0.8;
      const tx = Math.cos(angle) * 60;
      const tz = Math.sin(angle) * 60;
      lightTarget.position.set(tx, 16, tz);
      lightCone.rotation.y = -angle + Math.PI / 2;
    },
  };
}

/**
 * 2. Third-Person Explorer Character (The Wanderer)
 * 10-part procedural character with articulated joints for walk/run animations
 */
export interface CharacterModel {
  group: THREE.Group;
  lanternLight: THREE.PointLight;
  setAnimation: (speed: number, delta: number, isGrounded: boolean) => void;
}

export function createCharacter(): CharacterModel {
  const group = new THREE.Group();

  // Apparel materials
  const coatMat = new THREE.MeshStandardMaterial({
    color: '#2a4452', // deep teal voyager coat
    roughness: 0.7,
    metalness: 0.1,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: '#3d372e', // sturdy travel breeches
    roughness: 0.8,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: '#4e2a14', // brown leather boots & satchel
    roughness: 0.6,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#d99f77',
    roughness: 0.85,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: '#252525', // explorer brimmed hat
    roughness: 0.7,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: '#9e3223', // red traveler scarf
    roughness: 0.6,
  });

  // Torso / Jacket
  const torsoGeom = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const torso = new THREE.Mesh(torsoGeom, coatMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Satchel / Explorer Backpack
  const packGeom = new THREE.BoxGeometry(0.42, 0.45, 0.22);
  const backpack = new THREE.Mesh(packGeom, leatherMat);
  backpack.position.set(0, 1.08, -0.25);
  backpack.castShadow = true;
  group.add(backpack);

  // Rolled blanket on top of pack
  const bedrollGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.48, 8);
  bedrollGeom.rotateZ(Math.PI / 2);
  const bedroll = new THREE.Mesh(bedrollGeom, scarfMat);
  bedroll.position.set(0, 1.34, -0.25);
  group.add(bedroll);

  // Neck & Scarf
  const scarfGeom = new THREE.TorusGeometry(0.2, 0.08, 6, 12);
  scarfGeom.rotateX(Math.PI / 2);
  const scarf = new THREE.Mesh(scarfGeom, scarfMat);
  scarf.position.y = 1.4;
  group.add(scarf);

  // Head
  const headGeom = new THREE.SphereGeometry(0.18, 10, 8);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  // Explorer Hat (Crown + Brim)
  const hatCrownGeom = new THREE.CylinderGeometry(0.19, 0.2, 0.22, 10);
  const hatCrown = new THREE.Mesh(hatCrownGeom, hatMat);
  hatCrown.position.y = 1.74;
  group.add(hatCrown);

  const hatBrimGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.03, 12);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.position.y = 1.66;
  group.add(hatBrim);

  // Left Arm Joint & Mesh
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.35, 1.3, 0);
  const armGeom = new THREE.BoxGeometry(0.14, 0.55, 0.14);
  armGeom.translate(0, -0.25, 0);
  const leftArm = new THREE.Mesh(armGeom, coatMat);
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  group.add(leftArmPivot);

  // Right Arm Joint & Mesh
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.35, 1.3, 0);
  const rightArm = new THREE.Mesh(armGeom, coatMat);
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  group.add(rightArmPivot);

  // Left Leg Pivot & Mesh (Thigh + Boot)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.16, 0.75, 0);
  const thighGeom = new THREE.BoxGeometry(0.18, 0.45, 0.18);
  thighGeom.translate(0, -0.2, 0);
  const leftThigh = new THREE.Mesh(thighGeom, pantsMat);
  leftThigh.castShadow = true;
  leftLegPivot.add(leftThigh);

  const bootGeom = new THREE.BoxGeometry(0.2, 0.35, 0.28);
  bootGeom.translate(0, -0.55, 0.04);
  const leftBoot = new THREE.Mesh(bootGeom, leatherMat);
  leftBoot.castShadow = true;
  leftLegPivot.add(leftBoot);
  group.add(leftLegPivot);

  // Right Leg Pivot & Mesh
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.16, 0.75, 0);
  const rightThigh = new THREE.Mesh(thighGeom, pantsMat);
  rightThigh.castShadow = true;
  rightLegPivot.add(rightThigh);

  const rightBoot = new THREE.Mesh(bootGeom, leatherMat);
  rightBoot.castShadow = true;
  rightLegPivot.add(rightBoot);
  group.add(rightLegPivot);

  // Hip Brass Lantern that glows warmly as day transitions into dusk/night
  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0.34, 0.85, 0.12);

  const lanternCaseGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 6);
  const lanternCase = new THREE.Mesh(lanternCaseGeom, brassMat);
  lanternPivot.add(lanternCase);

  const lanternGlowGeom = new THREE.SphereGeometry(0.06, 6, 6);
  const lanternGlowMat = new THREE.MeshBasicMaterial({ color: '#ffbd59' });
  const lanternGlow = new THREE.Mesh(lanternGlowGeom, lanternGlowMat);
  lanternPivot.add(lanternGlow);

  const lanternLight = new THREE.PointLight(0xffae42, 1.8, 8, 1.5);
  lanternPivot.add(lanternLight);
  group.add(lanternPivot);

  let walkCycle = 0;

  return {
    group,
    lanternLight,
    setAnimation: (speed: number, delta: number, isGrounded: boolean) => {
      if (!isGrounded) {
        // Jumping / Airborne pose
        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, -0.4, 0.2);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0.3, 0.2);
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.6, 0.2);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.6, 0.2);
        torso.position.y = 1.08;
        return;
      }

      if (speed > 0.1) {
        // Walking or running cadence
        const cadence = speed > 5 ? 12 : 8;
        walkCycle += delta * cadence;
        const legAngle = Math.sin(walkCycle) * (speed > 5 ? 0.75 : 0.45);
        leftLegPivot.rotation.x = legAngle;
        rightLegPivot.rotation.x = -legAngle;

        leftArmPivot.rotation.x = -legAngle * 0.9;
        rightArmPivot.rotation.x = legAngle * 0.9;

        // Torso natural bobbing
        torso.position.y = 1.05 + Math.abs(Math.sin(walkCycle * 2)) * 0.05;
        torso.rotation.y = Math.sin(walkCycle) * 0.06;

        // Lantern sway
        lanternPivot.rotation.z = Math.sin(walkCycle) * 0.2;
      } else {
        // Idle breathing pose
        walkCycle += delta * 2;
        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0, 0.15);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0, 0.15);
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0, 0.15);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0, 0.15);
        torso.position.y = 1.05 + Math.sin(walkCycle) * 0.015;
        torso.rotation.y = 0;
        lanternPivot.rotation.z = 0;
      }
    },
  };
}

/**
 * 3. Ancient Stone Shrine (Glade Landmark at -18, 8)
 * 4-part composite ancient monolith with floating rune crystal
 */
export interface ShrineObject {
  group: THREE.Group;
  crystal: THREE.Mesh;
  light: THREE.PointLight;
  update: (time: number) => void;
}

export function createAncientShrine(): ShrineObject {
  const group = new THREE.Group();

  // Tiered stone dais base
  const daisGeom = new THREE.CylinderGeometry(3.5, 4.0, 0.5, 8);
  const dais = new THREE.Mesh(daisGeom, stoneMat);
  dais.position.y = 0.25;
  dais.receiveShadow = true;
  group.add(dais);

  // Twin ancient standing stones / archway
  const pillarGeom = new THREE.BoxGeometry(0.8, 3.8, 0.7);
  const leftPillar = new THREE.Mesh(pillarGeom, stoneMat);
  leftPillar.position.set(-1.4, 2.1, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeom, stoneMat);
  rightPillar.position.set(1.4, 2.1, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // Lintel arch cross-stone
  const lintelGeom = new THREE.BoxGeometry(3.8, 0.7, 0.8);
  const lintel = new THREE.Mesh(lintelGeom, stoneMat);
  lintel.position.set(0, 4.2, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Levitating ancient azure crystal
  const crystalGeom = new THREE.OctahedronGeometry(0.45, 0);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: '#42e3f5',
    emissive: '#1a7587',
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const crystal = new THREE.Mesh(crystalGeom, crystalMat);
  crystal.position.set(0, 2.3, 0);
  group.add(crystal);

  const crystalLight = new THREE.PointLight(0x42e3f5, 1.5, 7);
  crystalLight.position.set(0, 2.3, 0);
  group.add(crystalLight);

  return {
    group,
    crystal,
    light: crystalLight,
    update: (time: number) => {
      crystal.rotation.y = time * 0.9;
      crystal.position.y = 2.3 + Math.sin(time * 2.0) * 0.12;
    },
  };
}

/**
 * 4. Sunset Lookout Perch (Cliff Landmark at -15, -25)
 * Weathered cedar bench + brass telescope overlooking the western sea
 */
export function createSunsetPerch(): THREE.Group {
  const group = new THREE.Group();

  // Stone viewing flagstones
  const flagGeom = new THREE.CylinderGeometry(3.0, 3.2, 0.2, 7);
  const flagstone = new THREE.Mesh(flagGeom, stoneMat);
  flagstone.position.y = 0.1;
  flagstone.receiveShadow = true;
  group.add(flagstone);

  // Wooden bench (Backrest, seat, armrests, legs)
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), woodMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.08), woodMat);
  backrest.position.set(0, 0.75, -0.28);
  backrest.castShadow = true;
  bench.add(backrest);

  for (const x of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), woodMat);
    leg.position.set(x, 0.22, 0);
    leg.castShadow = true;
    bench.add(leg);
  }
  bench.position.set(0, 0.1, -0.8);
  group.add(bench);

  // Brass coastal telescope on tripod
  const tripod = new THREE.Group();
  const standGeom = new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6);
  const stand = new THREE.Mesh(standGeom, brassMat);
  stand.position.y = 0.55;
  tripod.add(stand);

  const scopeGeom = new THREE.CylinderGeometry(0.07, 0.11, 0.8, 8);
  scopeGeom.rotateX(Math.PI / 2);
  const scope = new THREE.Mesh(scopeGeom, brassMat);
  scope.position.set(0, 1.15, 0.1);
  scope.rotation.x = -0.15;
  tripod.add(scope);

  tripod.position.set(0.9, 0.1, 0.8);
  group.add(tripod);

  return group;
}

/**
 * 5. Interactive Lore Pedestal / Journal Discovery Point
 * Monolith with floating parchment scroll and golden aura
 */
export interface LorePedestal {
  group: THREE.Group;
  scroll: THREE.Group;
  auraLight: THREE.PointLight;
  id: string;
  update: (time: number) => void;
}

export function createLorePedestal(id: string): LorePedestal {
  const group = new THREE.Group();

  // Stone plinth
  const plinthGeom = new THREE.CylinderGeometry(0.35, 0.45, 0.9, 6);
  const plinth = new THREE.Mesh(plinthGeom, stoneMat);
  plinth.position.y = 0.45;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Floating rolled parchment scroll
  const scroll = new THREE.Group();
  const parchmentMat = new THREE.MeshStandardMaterial({
    color: '#faeed1',
    roughness: 0.6,
  });
  const rollGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
  rollGeom.rotateZ(Math.PI / 2);
  const roll = new THREE.Mesh(rollGeom, parchmentMat);
  scroll.add(roll);

  // Golden ribbon tie
  const ribbonGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8);
  ribbonGeom.rotateZ(Math.PI / 2);
  const ribbon = new THREE.Mesh(ribbonGeom, brassMat);
  scroll.add(ribbon);

  scroll.position.y = 1.25;
  group.add(scroll);

  // Soft discovery aura light
  const auraLight = new THREE.PointLight(0xffd573, 1.2, 5);
  auraLight.position.y = 1.3;
  group.add(auraLight);

  return {
    group,
    scroll,
    auraLight,
    id,
    update: (time: number) => {
      scroll.rotation.y = time * 1.4;
      scroll.position.y = 1.25 + Math.sin(time * 3.0) * 0.08;
    },
  };
}
