import * as THREE from 'three';
import { createWoodPlankMaterials, createCliffRockMaterials } from './proceduralTextures';

/**
 * High-Fidelity 3D Models for Whispering Horizons
 * Features a realistic proportioned humanoid character, detailed architectural lighthouse,
 * and intricate coastal structures.
 */

// Shared PBR materials
const stoneMasonryMat = new THREE.MeshStandardMaterial({
  color: '#8c8880',
  roughness: 0.82,
  metalness: 0.05,
});

const whitePlasterMat = new THREE.MeshStandardMaterial({
  color: '#ece9e2',
  roughness: 0.65,
  metalness: 0.02,
});

const maritimeRedMat = new THREE.MeshStandardMaterial({
  color: '#9e2a2b',
  roughness: 0.55,
  metalness: 0.08,
});

const verdigrisCopperMat = new THREE.MeshStandardMaterial({
  color: '#387361',
  roughness: 0.5,
  metalness: 0.35,
});

const polishedBrassMat = new THREE.MeshStandardMaterial({
  color: '#d4af37',
  roughness: 0.22,
  metalness: 0.88,
});

const glassLensMat = new THREE.MeshPhysicalMaterial({
  color: '#e4f7fa',
  roughness: 0.08,
  metalness: 0.1,
  transparent: true,
  opacity: 0.5,
});

/**
 * 1. The Grand Summit Lighthouse
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

  // Tier 1: Octagonal Stone Foundation Plinth
  const plinthGeom = new THREE.CylinderGeometry(4.8, 5.4, 3.2, 8);
  const plinth = new THREE.Mesh(plinthGeom, stoneMasonryMat);
  plinth.position.y = 1.6;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Arched Stone Entrance Portico
  const porticoGeom = new THREE.BoxGeometry(2.2, 3.0, 1.2);
  const portico = new THREE.Mesh(porticoGeom, stoneMasonryMat);
  portico.position.set(0, 1.5, 4.8);
  portico.castShadow = true;
  group.add(portico);

  // Studded heavy oak entrance door
  const doorGeom = new THREE.BoxGeometry(1.4, 2.3, 0.2);
  const doorMat = new THREE.MeshStandardMaterial({ color: '#4a3319', roughness: 0.85 });
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(0, 1.35, 5.4);
  door.castShadow = true;
  group.add(door);

  // Entry flight of stone steps
  for (let s = 0; s < 3; s++) {
    const stepGeom = new THREE.BoxGeometry(2.4 - s * 0.2, 0.25, 0.6);
    const step = new THREE.Mesh(stepGeom, stoneMasonryMat);
    step.position.set(0, 0.12 + s * 0.25, 5.6 + (2 - s) * 0.55);
    step.castShadow = true;
    group.add(step);
  }

  // Tier 2: Tapered Main Masonry Tower Shaft
  const shaftGeom = new THREE.CylinderGeometry(2.8, 4.2, 16.0, 16);
  const shaft = new THREE.Mesh(shaftGeom, whitePlasterMat);
  shaft.position.y = 11.2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Decorative Navigation Bands (Deep Maritime Red)
  const band1 = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.75, 2.0, 16), maritimeRedMat);
  band1.position.y = 9.0;
  band1.castShadow = true;
  group.add(band1);

  const band2 = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.25, 2.0, 16), maritimeRedMat);
  band2.position.y = 14.5;
  band2.castShadow = true;
  group.add(band2);

  // Arched Windows in shaft
  const windowGeom = new THREE.BoxGeometry(0.5, 0.9, 0.2);
  const windowMat = new THREE.MeshStandardMaterial({ color: '#16222f', roughness: 0.2, metalness: 0.8 });
  for (const y of [7.5, 12.0, 16.5]) {
    const win = new THREE.Mesh(windowGeom, windowMat);
    win.position.set(0, y, 3.4 - (y - 7.5) * 0.08);
    group.add(win);
  }

  // Tier 3: Observation Gallery with Corbels & Iron Railing
  const galleryBase = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 3.2, 1.0, 16), stoneMasonryMat);
  galleryBase.position.y = 19.5;
  galleryBase.castShadow = true;
  group.add(galleryBase);

  // Iron Railing
  const railGeom = new THREE.CylinderGeometry(3.95, 3.95, 1.1, 16, 1, true);
  const railMat = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.5,
    metalness: 0.85,
    wireframe: true,
  });
  const railing = new THREE.Mesh(railGeom, railMat);
  railing.position.y = 20.5;
  group.add(railing);

  // Tier 4: Glass Lantern Room Housing
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.2, 12), glassLensMat);
  lanternRoom.position.y = 21.6;
  group.add(lanternRoom);

  // Brass Frame Mullions
  const frameRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.08, 6, 16), polishedBrassMat);
  frameRing.rotateX(Math.PI / 2);
  frameRing.position.y = 21.6;
  group.add(frameRing);

  // Tier 5: Verdigris Copper Cupola Dome & Spire
  const cupolaGeom = new THREE.SphereGeometry(2.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const cupola = new THREE.Mesh(cupolaGeom, verdigrisCopperMat);
  cupola.position.y = 23.2;
  cupola.castShadow = true;
  group.add(cupola);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.2, 6), polishedBrassMat);
  spire.position.y = 25.2;
  group.add(spire);

  // Tier 6: Glowing Fresnel Beacon Core
  const beaconMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 1.4, 8),
    new THREE.MeshBasicMaterial({ color: '#fff9d6' })
  );
  beaconMesh.position.y = 21.6;
  group.add(beaconMesh);

  // High-Powered Sweeping Searchlight
  const beaconLight = new THREE.SpotLight(0xfff3b0, 16, 160, Math.PI / 7, 0.25, 1.1);
  beaconLight.position.set(0, 21.6, 0);
  const targetObj = new THREE.Object3D();
  targetObj.position.set(50, 18, 0);
  group.add(targetObj);
  beaconLight.target = targetObj;
  group.add(beaconLight);

  // Volumetric Sweeping Light Beam Cone
  const coneGeom = new THREE.ConeGeometry(9, 85, 16, 1, true);
  coneGeom.rotateX(Math.PI / 2);
  coneGeom.translate(0, 0, 42.5);
  const coneMat = new THREE.MeshBasicMaterial({
    color: '#ffefa8',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lightCone = new THREE.Mesh(coneGeom, coneMat);
  lightCone.position.set(0, 21.6, 0);
  group.add(lightCone);

  let rotAngle = 0;

  return {
    group,
    beaconLight,
    beaconMesh,
    lightCone,
    update: (delta: number) => {
      rotAngle += delta * 0.75;
      const lx = Math.cos(rotAngle) * 70;
      const lz = Math.sin(rotAngle) * 70;
      targetObj.position.set(lx, 18, lz);
      lightCone.rotation.y = -rotAngle + Math.PI / 2;
    },
  };
}

/**
 * 2. Proper Humanoid Explorer Character
 * Features natural human proportions, articulated skeleton, and multi-state animations
 * (Walk, Run, Idle Breathing, and Sitting/Resting).
 */
export interface CharacterModel {
  group: THREE.Group;
  lanternLight: THREE.PointLight;
  setAnimation: (speed: number, delta: number, isGrounded: boolean, isSitting: boolean) => void;
}

export function createHumanoidCharacter(): CharacterModel {
  const group = new THREE.Group();

  // Natural fabric and anatomical materials
  const coatMat = new THREE.MeshStandardMaterial({
    color: '#264653', // Deep maritime teal voyager duster
    roughness: 0.7,
    metalness: 0.08,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: '#e9d8a6', // Linen undershirt
    roughness: 0.75,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: '#343a40', // Charcoal explorer breeches
    roughness: 0.8,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: '#5c3d28', // Brown oiled leather
    roughness: 0.55,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#e0a96d', // Warm skin tone
    roughness: 0.75,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: '#332211',
    roughness: 0.85,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: '#2b2d42', // Fedora grey-navy
    roughness: 0.65,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: '#b23a22', // Red wool scarf
    roughness: 0.6,
  });

  // Root Pelvis Node
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.88;
  group.add(pelvis);

  // Pelvis / Waist mesh
  const waistGeom = new THREE.BoxGeometry(0.42, 0.22, 0.28);
  const waist = new THREE.Mesh(waistGeom, pantsMat);
  waist.castShadow = true;
  pelvis.add(waist);

  // Leather Belt with Brass Buckle
  const beltGeom = new THREE.BoxGeometry(0.44, 0.08, 0.3);
  const belt = new THREE.Mesh(beltGeom, leatherMat);
  pelvis.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.32), polishedBrassMat);
  buckle.position.z = 0.02;
  pelvis.add(buckle);

  // Spine & Chest Node
  const spine = new THREE.Group();
  spine.position.y = 0.12;
  pelvis.add(spine);

  // Torso / Voyager Jacket
  const chestGeom = new THREE.BoxGeometry(0.52, 0.55, 0.34);
  const chest = new THREE.Mesh(chestGeom, coatMat);
  chest.position.y = 0.28;
  chest.castShadow = true;
  spine.add(chest);

  // Shirt V-neck insert
  const shirtInsert = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.36), shirtMat);
  shirtInsert.position.set(0, 0.42, 0.01);
  spine.add(shirtInsert);

  // Explorer Satchel / Backpack on spine
  const packGeom = new THREE.BoxGeometry(0.42, 0.46, 0.24);
  const pack = new THREE.Mesh(packGeom, leatherMat);
  pack.position.set(0, 0.3, -0.26);
  pack.castShadow = true;
  spine.add(pack);

  // Rolled blanket bedroll on top of pack
  const bedrollGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.48, 8);
  bedrollGeom.rotateZ(Math.PI / 2);
  const bedroll = new THREE.Mesh(bedrollGeom, scarfMat);
  bedroll.position.set(0, 0.58, -0.26);
  spine.add(bedroll);

  // Red Wool Scarf around neck
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.08, 6, 12), scarfMat);
  scarfRing.rotateX(Math.PI / 2);
  scarfRing.position.y = 0.6;
  spine.add(scarfRing);

  // Neck & Head Node
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.65;
  spine.add(headPivot);

  // Sculpted Head & Face
  const headGeom = new THREE.SphereGeometry(0.19, 10, 8);
  headGeom.scale(0.85, 1.05, 0.95);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.16;
  head.castShadow = true;
  headPivot.add(head);

  // Hair
  const hairGeom = new THREE.SphereGeometry(0.2, 8, 6);
  hairGeom.scale(0.9, 0.95, 1.0);
  const hair = new THREE.Mesh(hairGeom, hairMat);
  hair.position.set(0, 0.19, -0.02);
  headPivot.add(hair);

  // Explorer Brimmed Hat (Crown + Flared Brim + Leather Band)
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.24, 12), hatMat);
  hatCrown.position.y = 0.34;
  headPivot.add(hatCrown);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 14), hatMat);
  hatBrim.position.y = 0.25;
  hatBrim.rotation.x = -0.05; // stylish tilt
  headPivot.add(hatBrim);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.202, 0.202, 0.06, 12), leatherMat);
  hatBand.position.y = 0.28;
  headPivot.add(hatBand);

  // Left Arm Chain (Shoulder -> Upper Arm -> Forearm -> Hand)
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.34, 0.48, 0);
  spine.add(leftShoulder);

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.32, 6), coatMat);
  leftUpperArm.position.y = -0.16;
  leftUpperArm.castShadow = true;
  leftShoulder.add(leftUpperArm);

  const leftElbow = new THREE.Group();
  leftElbow.position.y = -0.32;
  leftShoulder.add(leftElbow);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.3, 6), coatMat);
  leftForearm.position.y = -0.15;
  leftForearm.castShadow = true;
  leftElbow.add(leftForearm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), skinMat);
  leftHand.position.y = -0.34;
  leftElbow.add(leftHand);

  // Right Arm Chain (Shoulder -> Upper Arm -> Forearm -> Hand)
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.34, 0.48, 0);
  spine.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.32, 6), coatMat);
  rightUpperArm.position.y = -0.16;
  rightUpperArm.castShadow = true;
  rightShoulder.add(rightUpperArm);

  const rightElbow = new THREE.Group();
  rightElbow.position.y = -0.32;
  rightShoulder.add(rightElbow);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.3, 6), coatMat);
  rightForearm.position.y = -0.15;
  rightForearm.castShadow = true;
  rightElbow.add(rightForearm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), skinMat);
  rightHand.position.y = -0.34;
  rightElbow.add(rightHand);

  // Left Leg Chain (Hip -> Thigh -> Knee -> Calf -> Boot)
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.16, 0, 0);
  pelvis.add(leftHip);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.42, 8), pantsMat);
  leftThigh.position.y = -0.21;
  leftThigh.castShadow = true;
  leftHip.add(leftThigh);

  const leftKnee = new THREE.Group();
  leftKnee.position.y = -0.42;
  leftHip.add(leftKnee);

  const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), pantsMat);
  leftCalf.position.y = -0.19;
  leftCalf.castShadow = true;
  leftKnee.add(leftCalf);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.28), leatherMat);
  leftBoot.position.set(0, -0.36, 0.05);
  leftBoot.castShadow = true;
  leftKnee.add(leftBoot);

  // Right Leg Chain (Hip -> Thigh -> Knee -> Calf -> Boot)
  const rightHip = new THREE.Group();
  rightHip.position.set(0.16, 0, 0);
  pelvis.add(rightHip);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.42, 8), pantsMat);
  rightThigh.position.y = -0.21;
  rightThigh.castShadow = true;
  rightHip.add(rightThigh);

  const rightKnee = new THREE.Group();
  rightKnee.position.y = -0.42;
  rightHip.add(rightKnee);

  const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), pantsMat);
  rightCalf.position.y = -0.19;
  rightCalf.castShadow = true;
  rightKnee.add(rightCalf);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.28), leatherMat);
  rightBoot.position.set(0, -0.36, 0.05);
  rightBoot.castShadow = true;
  rightKnee.add(rightBoot);

  // Hip Brass Explorer Lantern
  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0.28, 0.05, 0.16);

  const lanternCase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.22, 6), polishedBrassMat);
  lanternPivot.add(lanternCase);

  const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: '#ffb347' }));
  lanternPivot.add(lanternBulb);

  const lanternLight = new THREE.PointLight(0xffaa33, 1.6, 9, 1.4);
  lanternPivot.add(lanternLight);
  pelvis.add(lanternPivot);

  let cycle = 0;

  return {
    group,
    lanternLight,
    setAnimation: (speed: number, delta: number, isGrounded: boolean, isSitting: boolean) => {
      // 1. Sitting Animation Pose
      if (isSitting) {
        pelvis.position.y = 0.52; // Lower to bench level
        leftHip.rotation.x = -Math.PI / 2;
        rightHip.rotation.x = -Math.PI / 2;
        leftKnee.rotation.x = Math.PI / 2;
        rightKnee.rotation.x = Math.PI / 2;

        leftShoulder.rotation.x = -0.4;
        rightShoulder.rotation.x = -0.4;
        leftElbow.rotation.x = -0.5;
        rightElbow.rotation.x = -0.5;

        spine.rotation.x = 0.08;
        headPivot.rotation.x = -0.05;
        return;
      }

      pelvis.position.y = 0.88;

      // 2. Airborne / Jump Pose
      if (!isGrounded) {
        leftHip.rotation.x = THREE.MathUtils.lerp(leftHip.rotation.x, -0.5, 0.2);
        rightHip.rotation.x = THREE.MathUtils.lerp(rightHip.rotation.x, 0.35, 0.2);
        leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, 0.8, 0.2);
        rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, 0.3, 0.2);

        leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, 0.7, 0.2);
        rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, 0.7, 0.2);
        return;
      }

      // 3. Locomotion Kinematics (Walk & Run)
      if (speed > 0.15) {
        const isRun = speed > 5.0;
        const cadence = isRun ? 13 : 8.5;
        cycle += delta * cadence;

        const maxStride = isRun ? 0.78 : 0.48;
        const stride = Math.sin(cycle) * maxStride;

        leftHip.rotation.x = stride;
        rightHip.rotation.x = -stride;

        // Realistic knee bending on back-kick
        leftKnee.rotation.x = Math.max(0, -stride * 1.2);
        rightKnee.rotation.x = Math.max(0, stride * 1.2);

        // Counter-arm pump
        leftShoulder.rotation.x = -stride * 0.95;
        rightShoulder.rotation.x = stride * 0.95;
        leftElbow.rotation.x = -0.2 - Math.abs(stride) * 0.4;
        rightElbow.rotation.x = -0.2 - Math.abs(stride) * 0.4;

        // Torso natural vertical bounce & slight twist
        spine.position.y = 0.12 + Math.abs(Math.sin(cycle * 2)) * (isRun ? 0.08 : 0.04);
        spine.rotation.y = Math.sin(cycle) * 0.08;
        spine.rotation.x = isRun ? 0.14 : 0.04; // forward lean when sprinting

        // Lantern rhythmic sway
        lanternPivot.rotation.z = Math.sin(cycle) * 0.25;
      } else {
        // 4. Idle Breathing & Organic Weight Shift
        cycle += delta * 1.8;

        leftHip.rotation.x = THREE.MathUtils.lerp(leftHip.rotation.x, 0, 0.1);
        rightHip.rotation.x = THREE.MathUtils.lerp(rightHip.rotation.x, 0, 0.1);
        leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, 0, 0.1);
        rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, 0, 0.1);

        leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, 0.05, 0.1);
        rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, 0.05, 0.1);
        leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, -0.1, 0.1);
        rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, -0.1, 0.1);

        // Gentle breathing chest expansion
        spine.position.y = 0.12 + Math.sin(cycle) * 0.015;
        spine.rotation.x = 0;
        spine.rotation.y = 0;
        headPivot.rotation.y = Math.sin(cycle * 0.4) * 0.12; // looking around comfortably
        lanternPivot.rotation.z = 0;
      }
    },
  };
}

/**
 * 3. Ancient Whisper Shrine (Glade Landmark)
 */
export interface ShrineObject {
  group: THREE.Group;
  crystal: THREE.Mesh;
  light: THREE.PointLight;
  update: (time: number) => void;
}

export function createAncientShrine(): ShrineObject {
  const group = new THREE.Group();

  // Tiered ancient stone dais
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 0.6, 10), stoneMasonryMat);
  dais.position.y = 0.3;
  dais.receiveShadow = true;
  group.add(dais);

  // Twin monolith standing stones
  const pillarGeom = new THREE.BoxGeometry(0.9, 4.2, 0.8);
  const p1 = new THREE.Mesh(pillarGeom, stoneMasonryMat);
  p1.position.set(-1.6, 2.4, 0);
  p1.castShadow = true;
  group.add(p1);

  const p2 = new THREE.Mesh(pillarGeom, stoneMasonryMat);
  p2.position.set(1.6, 2.4, 0);
  p2.castShadow = true;
  group.add(p2);

  // Lintel arch
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 0.9), stoneMasonryMat);
  lintel.position.set(0, 4.7, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Levitating ancient azure crystal
  const crystalGeom = new THREE.OctahedronGeometry(0.55, 0);
  crystalGeom.scale(0.8, 1.4, 0.8);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const crystal = new THREE.Mesh(crystalGeom, crystalMat);
  crystal.position.set(0, 2.5, 0);
  group.add(crystal);

  const light = new THREE.PointLight(0x38bdf8, 2.0, 9);
  light.position.set(0, 2.5, 0);
  group.add(light);

  return {
    group,
    crystal,
    light,
    update: (time: number) => {
      crystal.rotation.y = time * 0.85;
      crystal.position.y = 2.5 + Math.sin(time * 2.2) * 0.14;
    },
  };
}

/**
 * 4. Interactive Lore Pedestal / Discovery Point
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

  // Carved stone plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.0, 8), stoneMasonryMat);
  plinth.position.y = 0.5;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Floating rolled parchment with golden wax seal
  const scroll = new THREE.Group();
  const parchmentMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.65 });
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.44, 8), parchmentMat);
  roll.rotateZ(Math.PI / 2);
  scroll.add(roll);

  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8), polishedBrassMat);
  ribbon.rotateZ(Math.PI / 2);
  scroll.add(ribbon);

  scroll.position.y = 1.35;
  group.add(scroll);

  const auraLight = new THREE.PointLight(0xf59e0b, 1.4, 6);
  auraLight.position.y = 1.4;
  group.add(auraLight);

  return {
    group,
    scroll,
    auraLight,
    id,
    update: (time: number) => {
      scroll.rotation.y = time * 1.5;
      scroll.position.y = 1.35 + Math.sin(time * 3.2) * 0.09;
    },
  };
}
