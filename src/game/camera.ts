import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public target = new THREE.Vector3(0, 1.4, 46);
  public currentLookAt = new THREE.Vector3(0, 1.4, 46);

  // Spherical camera orbit settings
  public distance = 5.2;
  public targetDistance = 5.2;
  public minDistance = 2.4;
  public maxDistance = 11.0;

  public azimuth = Math.PI; // horizontal orbit angle (radians)
  public targetAzimuth = Math.PI;
  public pitch = 0.28; // vertical elevation angle (radians)
  public targetPitch = 0.28;
  public minPitch = -0.15; // looking up slightly
  public maxPitch = 1.35; // looking almost straight down

  private scratchCamPos = new THREE.Vector3();

  constructor(fov = 60, aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 450);
  }

  public updateAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public rotate(deltaX: number, deltaY: number) {
    const sensitivity = 0.0035;
    this.targetAzimuth -= deltaX * sensitivity;
    this.targetPitch += deltaY * sensitivity;
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
  }

  public zoom(deltaY: number) {
    this.targetDistance += deltaY * 0.005;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // 1. Smoothly interpolate angles and distance with exponential damping
    this.azimuth = THREE.MathUtils.damp(this.azimuth, this.targetAzimuth, 16, delta);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 16, delta);
    this.distance = THREE.MathUtils.damp(this.distance, this.targetDistance, 14, delta);

    // 2. Smoothly track player focal point (eyes/torso)
    this.target.set(playerPos.x, playerPos.y + 1.45, playerPos.z);
    this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.target.x, 14, delta);
    this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.target.y, 14, delta);
    this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.target.z, 14, delta);

    // 3. Compute spherical offset relative to look-at point
    const horizDist = this.distance * Math.cos(this.pitch);
    const vertDist = this.distance * Math.sin(this.pitch);

    let camX = this.currentLookAt.x + horizDist * Math.sin(this.azimuth);
    let camZ = this.currentLookAt.z + horizDist * Math.cos(this.azimuth);
    let camY = this.currentLookAt.y + vertDist;

    // 4. Terrain collision prevention: keep camera above ground + buffer
    const groundHeightAtCam = getTerrainHeight(camX, camZ);
    const minAllowedCamY = groundHeightAtCam + 0.55;

    if (camY < minAllowedCamY) {
      camY = minAllowedCamY;
    }

    this.scratchCamPos.set(camX, camY, camZ);
    this.camera.position.copy(this.scratchCamPos);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Cinematic orbit camera for title screen
   */
  public updateCinematic(time: number) {
    // Elegant sweeping orbit around the central lighthouse and sunset cliffs
    const radius = 65;
    const camX = Math.cos(time * 0.08) * radius;
    const camZ = Math.sin(time * 0.08) * radius;
    const camY = 22 + Math.sin(time * 0.12) * 4;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(10, 10, -10);
  }
}
