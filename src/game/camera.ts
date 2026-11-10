import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public target = new THREE.Vector3(0, 1.5, 52);
  public currentLookAt = new THREE.Vector3(0, 1.5, 52);

  public distance = 5.4;
  public targetDistance = 5.4;
  public minDistance = 2.2;
  public maxDistance = 12.0;

  public azimuth = Math.PI;
  public targetAzimuth = Math.PI;
  public pitch = 0.24;
  public targetPitch = 0.24;
  public minPitch = -0.18;
  public maxPitch = 1.32;

  private scratchCamPos = new THREE.Vector3();

  constructor(fov = 60, aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 550);
  }

  public updateAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public rotate(deltaX: number, deltaY: number) {
    const sensitivity = 0.0032;
    this.targetAzimuth -= deltaX * sensitivity;
    this.targetPitch += deltaY * sensitivity;
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
  }

  public zoom(deltaY: number) {
    this.targetDistance += deltaY * 0.0045;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  public update(delta: number, playerPos: THREE.Vector3, isRunning: boolean = false, isSitting: boolean = false) {
    // 1. Exponential damping on spherical coordinates
    this.azimuth = THREE.MathUtils.damp(this.azimuth, this.targetAzimuth, 15, delta);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 15, delta);
    this.distance = THREE.MathUtils.damp(this.distance, this.targetDistance, 12, delta);

    // Dynamic FOV for speed sensation
    const targetFov = isRunning ? 64 : 58;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();

    // 2. Track player eye/focal point
    const focalY = isSitting ? 1.0 : 1.48;
    this.target.set(playerPos.x, playerPos.y + focalY, playerPos.z);
    this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.target.x, 14, delta);
    this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.target.y, 14, delta);
    this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.target.z, 14, delta);

    // 3. Spherical offset
    const horizDist = this.distance * Math.cos(this.pitch);
    const vertDist = this.distance * Math.sin(this.pitch);

    let camX = this.currentLookAt.x + horizDist * Math.sin(this.azimuth);
    let camZ = this.currentLookAt.z + horizDist * Math.cos(this.azimuth);
    let camY = this.currentLookAt.y + vertDist;

    // 4. Terrain collision prevention
    const groundHeightAtCam = getTerrainHeight(camX, camZ);
    const minAllowedY = groundHeightAtCam + 0.65;
    if (camY < minAllowedY) {
      camY = minAllowedY;
    }

    this.scratchCamPos.set(camX, camY, camZ);
    this.camera.position.copy(this.scratchCamPos);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Title screen cinematic camera sweep
   */
  public updateCinematic(time: number) {
    const radius = 72;
    const camX = Math.cos(time * 0.07) * radius;
    const camZ = Math.sin(time * 0.07) * radius;
    const camY = 24 + Math.sin(time * 0.1) * 3.5;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(12, 12, -15);
  }
}
