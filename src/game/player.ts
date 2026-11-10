import * as THREE from 'three';
import { CharacterModel, createCharacter } from './models';
import { getTerrainHeight, getTerrainNormal, ISLAND_RADIUS } from './terrain';
import { PlayerInput } from './types';
import { soundEngine } from './audio';

// Reusable scratch math helpers to avoid garbage collection
const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _normal = new THREE.Vector3();

export class PlayerController {
  public character: CharacterModel;
  public position = new THREE.Vector3(0, 0.4, 46); // Start near the scenic arrival dock
  public velocity = new THREE.Vector3();
  public rotationY = Math.PI; // Face north initially toward the island interior
  public isGrounded = true;
  public moveSpeed = 0;

  private walkSpeed = 3.8;
  private runSpeed = 7.5;
  private gravity = -20.0;
  private jumpVelocity = 7.2;

  constructor(scene: THREE.Scene) {
    this.character = createCharacter();
    this.position.y = getTerrainHeight(this.position.x, this.position.z);
    this.character.group.position.copy(this.position);
    this.character.group.rotation.y = this.rotationY;
    scene.add(this.character.group);
  }

  public update(
    delta: number,
    input: PlayerInput,
    camera: THREE.Camera
  ) {
    // 1. Calculate input vector in camera space
    let inputX = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.joystickX;
    let inputZ = (input.forward ? 1 : 0) - (input.backward ? 1 : 0) + input.joystickY;

    // Clamp input magnitude to 1.0 (for analog joysticks)
    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 1.0) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    // 2. Camera-relative movement direction
    camera.getWorldDirection(_camForward);
    _camForward.y = 0;
    _camForward.normalize();

    _camRight.crossVectors(_camForward, camera.up).normalize();

    _moveDir.set(0, 0, 0);
    if (inputLen > 0.05) {
      _moveDir.addScaledVector(_camRight, inputX);
      _moveDir.addScaledVector(_camForward, inputZ);
      _moveDir.normalize();
    }

    const isRunning = input.run;
    const targetSpeed = inputLen > 0.05 ? (isRunning ? this.runSpeed : this.walkSpeed) : 0;

    // Smooth speed acceleration/deceleration
    this.moveSpeed = THREE.MathUtils.damp(this.moveSpeed, targetSpeed, 12, delta);

    // 3. Smooth character rotation toward travel direction
    if (_moveDir.lengthSq() > 0.001) {
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      // Smooth angle interpolation avoiding wrap-around glitches
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1, 14 * delta);
    }
    this.character.group.rotation.y = this.rotationY;

    // 4. Horizontal displacement
    const targetVx = _moveDir.x * this.moveSpeed;
    const targetVz = _moveDir.z * this.moveSpeed;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 14, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVz, 14, delta);

    // 5. Jump & Gravity
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpVelocity;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
    }

    // 6. Proposed new position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextY = this.position.y + this.velocity.y * delta;

    // Island perimeter constraint (keep on island & dock)
    const distFromCenter = Math.hypot(nextX, nextZ);
    const maxAllowedDist = ISLAND_RADIUS + 4;

    if (distFromCenter < maxAllowedDist) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      // Natural water barrier repulsion
      this.velocity.x *= 0.2;
      this.velocity.z *= 0.2;
    }

    // 7. Ground collision detection against exact terrain height
    const groundHeight = getTerrainHeight(this.position.x, this.position.z);
    getTerrainNormal(this.position.x, this.position.z, _normal);

    // Check steep cliff slip (if slope > 0.7, cannot climb up easily)
    if (_normal.y < 0.65 && groundHeight > this.position.y) {
      this.position.x -= this.velocity.x * delta * 1.2;
      this.position.z -= this.velocity.z * delta * 1.2;
    }

    // Water level minimum (allow wading into shallow surf, but prevent sinking below water)
    const effectiveGround = Math.max(0.12, groundHeight);

    if (nextY <= effectiveGround) {
      this.position.y = effectiveGround;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      // Slight tolerance for ground detachment
      this.isGrounded = (this.position.y - effectiveGround) < 0.15;
    }

    // Update 3D mesh position
    this.character.group.position.copy(this.position);

    // Procedural footstep sound trigger during grounded movement
    if (this.isGrounded && this.moveSpeed > 0.5) {
      soundEngine.playFootstep(isRunning);
    }

    // Update character skeletal walking/running kinematics
    this.character.setAnimation(this.moveSpeed, delta, this.isGrounded);

    // Update audio listener spatial positions for waterfall & coastal surf
    soundEngine.updatePlayerPosition(this.position.x, this.position.z);
  }
}
