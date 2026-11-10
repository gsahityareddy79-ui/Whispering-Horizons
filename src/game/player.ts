import * as THREE from 'three';
import { CharacterModel, createHumanoidCharacter } from './models';
import { getTerrainHeight, getTerrainNormal, ISLAND_RADIUS } from './terrain';
import { PlayerInput } from './types';
import { soundEngine } from './audio';

const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _normal = new THREE.Vector3();

export class PlayerController {
  public character: CharacterModel;
  public position = new THREE.Vector3(0, 0.45, 52); // Start near the scenic arrival dock
  public velocity = new THREE.Vector3();
  public rotationY = Math.PI; // Face north toward the island interior
  public isGrounded = true;
  public isSitting = false;
  public moveSpeed = 0;

  private walkSpeed = 3.6;
  private runSpeed = 7.2;
  private gravity = -22.0;
  private jumpVelocity = 7.4;

  constructor(scene: THREE.Scene) {
    this.character = createHumanoidCharacter();
    this.position.y = getTerrainHeight(this.position.x, this.position.z);
    this.character.group.position.copy(this.position);
    this.character.group.rotation.y = this.rotationY;
    scene.add(this.character.group);
  }

  public sitAt(targetPos: THREE.Vector3, targetRotationY: number) {
    this.isSitting = true;
    this.position.copy(targetPos);
    this.rotationY = targetRotationY;
    this.velocity.set(0, 0, 0);
    this.moveSpeed = 0;
    this.character.group.position.copy(this.position);
    this.character.group.rotation.y = this.rotationY;
  }

  public standUp() {
    this.isSitting = false;
  }

  public update(delta: number, input: PlayerInput, camera: THREE.Camera) {
    // If sitting and player inputs movement, stand up automatically
    let inputX = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.joystickX;
    let inputZ = (input.forward ? 1 : 0) - (input.backward ? 1 : 0) + input.joystickY;
    const inputLen = Math.hypot(inputX, inputZ);

    if (this.isSitting) {
      if (inputLen > 0.1 || input.jump) {
        this.standUp();
      } else {
        this.character.setAnimation(0, delta, true, true);
        return;
      }
    }

    if (inputLen > 1.0) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    // Camera-relative movement
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

    // Smooth organic acceleration & deceleration
    this.moveSpeed = THREE.MathUtils.damp(this.moveSpeed, targetSpeed, 10, delta);

    // Smooth character turning toward travel direction
    if (_moveDir.lengthSq() > 0.001) {
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1, 12 * delta);
    }
    this.character.group.rotation.y = this.rotationY;

    // Horizontal velocity
    const targetVx = _moveDir.x * this.moveSpeed;
    const targetVz = _moveDir.z * this.moveSpeed;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 12, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVz, 12, delta);

    // Jump impulse & gravity
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpVelocity;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
    }

    // Next position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextY = this.position.y + this.velocity.y * delta;

    // Island boundary limit
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter < ISLAND_RADIUS + 5) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      this.velocity.x *= 0.2;
      this.velocity.z *= 0.2;
    }

    // Terrain ground collision detection
    const groundHeight = getTerrainHeight(this.position.x, this.position.z);
    getTerrainNormal(this.position.x, this.position.z, _normal);

    // Steep cliff sliding repulsion
    if (_normal.y < 0.62 && groundHeight > this.position.y) {
      this.position.x -= this.velocity.x * delta * 1.3;
      this.position.z -= this.velocity.z * delta * 1.3;
    }

    const minGroundY = Math.max(0.1, groundHeight);

    if (nextY <= minGroundY) {
      this.position.y = minGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      this.isGrounded = this.position.y - minGroundY < 0.18;
    }

    this.character.group.position.copy(this.position);

    // Footstep audio triggers
    if (this.isGrounded && this.moveSpeed > 0.4) {
      soundEngine.playFootstep(isRunning);
    }

    // Kinematic animation update
    this.character.setAnimation(this.moveSpeed, delta, this.isGrounded, false);

    // Spatial sound listener position
    soundEngine.updatePlayerPosition(this.position.x, this.position.z);
  }
}
