import * as THREE from 'three';
import { PlayerController } from './player';
import { ThirdPersonCamera } from './camera';
import { createTerrainWorld, TerrainWorld, getTerrainHeight } from './terrain';
import { createOceanWorld, OceanWorld } from './ocean';
import { setupSkyAndLighting, SkyEnvironment } from './sky';
import {
  createLighthouse,
  LighthouseStructure,
  createAncientShrine,
  ShrineObject,
  createLorePedestal,
  LorePedestal,
} from './models';
import { GameSettings, GameState, Landmark, PlayerInput } from './types';
import { ISLAND_LANDMARKS } from './lore';
import { soundEngine } from './audio';

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraController: ThirdPersonCamera;
  private player: PlayerController;
  private ocean: OceanWorld;
  private terrain: TerrainWorld;
  private sky: SkyEnvironment;
  private lighthouse: LighthouseStructure;
  private shrine: ShrineObject;
  private lorePedestals: LorePedestal[] = [];

  private isSoftwareGl = false;
  private animationFrameId = 0;
  private clock = new THREE.Clock();

  // State
  private isRunning = false;
  private isTitleScreen = true;
  private isPaused = false;
  private timeOfDay = 17.5; // Start at golden sunset (5:30 PM)
  private autoCycle = false;
  private settings: GameSettings;
  private landmarks: Landmark[];
  private activeLandmark: Landmark | null = null;
  private readingLandmark: Landmark | null = null;

  // FPS tracking
  private frameCount = 0;
  private lastFpsCalc = 0;
  private currentFps = 60;

  // Input state
  private input: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    interact: false,
    sit: false,
    joystickX: 0,
    joystickY: 0,
    cameraDeltaX: 0,
    cameraDeltaY: 0,
  };

  private isDraggingMouse = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private onStateUpdate?: (state: GameState) => void;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    onStateUpdate?: (state: GameState) => void
  ) {
    this.container = container;
    this.settings = settings;
    this.onStateUpdate = onStateUpdate;
    this.landmarks = JSON.parse(JSON.stringify(ISLAND_LANDMARKS));

    // 1. Detect Software WebGL (Three.js skill directive)
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize WebGLRenderer with ACESFilmic Tone Mapping
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.applyQualitySettings(this.settings.quality);

    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.cameraController = new ThirdPersonCamera(58, width / height);

    this.sky = setupSkyAndLighting(this.scene, this.renderer, this.isSoftwareGl);
    this.sky.updateTimeOfDay(this.timeOfDay);

    // 4. Island Terrain & Ocean World
    const isLowQ = this.settings.quality === 'low' || this.isSoftwareGl;
    this.terrain = createTerrainWorld(this.scene, isLowQ);
    this.ocean = createOceanWorld(this.scene, isLowQ);

    // 5. Landmarks & Props
    // Lighthouse at (18, -28)
    this.lighthouse = createLighthouse();
    const lhY = getTerrainHeight(18, -28);
    this.lighthouse.group.position.set(18, lhY, -28);
    this.scene.add(this.lighthouse.group);

    // Ancient Whisper Shrine at (-22, 12)
    this.shrine = createAncientShrine();
    const shrineY = getTerrainHeight(-22, 12);
    this.shrine.group.position.set(-22, shrineY, 12);
    this.scene.add(this.shrine.group);

    // Lore Discovery Pedestals
    for (const lm of this.landmarks) {
      const ped = createLorePedestal(lm.id);
      const py = getTerrainHeight(lm.x, lm.z);
      ped.group.position.set(lm.x, py, lm.z);
      this.scene.add(ped.group);
      this.lorePedestals.push(ped);
    }

    // 6. Player Character
    this.player = new PlayerController(this.scene);

    // 7. Event listeners
    this.bindEvents();

    // 8. Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.cameraController.camera);
    }

    this.startLoop();
    this.notifyState();
  }

  public applyQualitySettings(quality: 'low' | 'medium' | 'high') {
    this.settings.quality = quality;
    if (quality === 'low' || this.isSoftwareGl) {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  public setTimeOfDay(hour: number) {
    this.timeOfDay = ((hour % 24) + 24) % 24;
    this.sky.updateTimeOfDay(this.timeOfDay);
    const isDark = this.timeOfDay < 6.5 || this.timeOfDay > 18.5;
    this.player.character.lanternLight.intensity = isDark ? 2.6 : 0.4;
    this.notifyState();
  }

  public setAutoCycle(auto: boolean) {
    this.autoCycle = auto;
  }

  public startGame() {
    this.isTitleScreen = false;
    this.isPaused = false;
    soundEngine.init();
    soundEngine.resume();
    soundEngine.playLighthouseFoghorn();
    this.notifyState();
  }

  public pauseGame() {
    this.isPaused = true;
    this.notifyState();
  }

  public resumeGame() {
    this.isPaused = false;
    soundEngine.resume();
    this.notifyState();
  }

  public openNote(landmark: Landmark) {
    this.readingLandmark = landmark;
    soundEngine.playDiscoveryChime();
    this.notifyState();
  }

  public closeNote() {
    this.readingLandmark = null;
    this.notifyState();
  }

  public triggerInteract() {
    if (!this.activeLandmark) return;

    if (this.activeLandmark.actionType === 'sit') {
      if (this.player.isSitting) {
        this.player.standUp();
      } else {
        // Sit on bench facing sunset
        const benchPos = new THREE.Vector3(-16, getTerrainHeight(-16, -26) + 0.15, -26);
        this.player.sitAt(benchPos, -Math.PI / 4);
        this.openNote(this.activeLandmark);
      }
    } else {
      this.openNote(this.activeLandmark);
    }
    this.notifyState();
  }

  // Mobile virtual joystick input
  public setJoystickInput(x: number, y: number) {
    this.input.joystickX = x;
    this.input.joystickY = y;
  }

  public setTouchCameraDelta(dx: number, dy: number) {
    this.cameraController.rotate(dx, dy);
  }

  public setTouchRun(run: boolean) {
    this.input.run = run;
  }

  public setTouchJump() {
    this.input.jump = true;
    setTimeout(() => { this.input.jump = false; }, 80);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    dom.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.run = true;
        break;
      case 'Space':
        e.preventDefault();
        this.input.jump = true;
        break;
      case 'KeyE':
        e.preventDefault();
        this.triggerInteract();
        break;
      case 'Escape':
        e.preventDefault();
        if (this.readingLandmark) {
          this.closeNote();
        } else if (!this.isTitleScreen) {
          if (this.isPaused) this.resumeGame();
          else this.pauseGame();
        }
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.run = false;
        break;
      case 'Space':
        this.input.jump = false;
        break;
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isDraggingMouse = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    soundEngine.resume();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDraggingMouse) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.cameraController.rotate(dx, dy);
  };

  private handleMouseUp = () => {
    this.isDraggingMouse = false;
  };

  private handleWheel = (e: WheelEvent) => {
    this.cameraController.zoom(e.deltaY);
  };

  private handleBlur = () => {
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
    this.input.run = false;
    this.input.jump = false;
    this.isDraggingMouse = false;
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.cameraController.updateAspect(width / height);
  };

  private startLoop() {
    this.isRunning = true;
    this.clock.start();
    this.lastFpsCalc = performance.now();

    const tick = () => {
      if (!this.isRunning) return;

      const now = performance.now();
      const rawDt = this.clock.getDelta();
      const delta = Math.min(rawDt, 0.05);

      this.frameCount++;
      if (now - this.lastFpsCalc >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalc));
        this.frameCount = 0;
        this.lastFpsCalc = now;
      }

      this.update(delta, now * 0.001);
      this.renderer.render(this.scene, this.cameraController.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animationFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animationFrameId = window.setTimeout(cb, 60);
      }
    };
    this.animationFrameId = window.setTimeout(poll, 5);
  }

  private update(delta: number, elapsed: number) {
    if (this.autoCycle && !this.isPaused) {
      this.timeOfDay = (this.timeOfDay + delta * 0.15) % 24;
      this.sky.updateTimeOfDay(this.timeOfDay);
    }

    // World animation updates
    this.ocean.update(elapsed);
    this.lighthouse.update(delta);
    this.shrine.update(elapsed);
    this.sky.updateClouds(delta);
    this.terrain.update(elapsed);

    for (const ped of this.lorePedestals) {
      ped.update(elapsed);
    }

    if (this.isTitleScreen) {
      this.cameraController.updateCinematic(elapsed);
    } else if (!this.isPaused && !this.readingLandmark) {
      this.player.update(delta, this.input, this.cameraController.camera);
      this.cameraController.update(
        delta,
        this.player.position,
        this.player.moveSpeed > 5.0,
        this.player.isSitting
      );
      this.checkLandmarksProximity();
    } else {
      this.cameraController.update(
        delta,
        this.player.position,
        false,
        this.player.isSitting
      );
    }
  }

  private checkLandmarksProximity() {
    const px = this.player.position.x;
    const pz = this.player.position.z;
    let closest: Landmark | null = null;
    let closestDist = 999;

    for (const lm of this.landmarks) {
      const d = Math.hypot(px - lm.x, pz - lm.z);
      if (d < lm.radius && d < closestDist) {
        closest = lm;
        closestDist = d;
      }
    }

    if (closest !== this.activeLandmark) {
      this.activeLandmark = closest;
      this.notifyState();
    }
  }

  private getCurrentLocationName(): string {
    const px = this.player.position.x;
    const pz = this.player.position.z;

    if (Math.hypot(px - 18, pz - (-27)) < 24) return 'Lighthouse Summit';
    if (Math.hypot(px - (-16), pz - (-26)) < 18) return "Falcon's Sunset Perch";
    if (Math.hypot(px - 42, pz - 11) < 22) return 'Emerald Cascade Falls';
    if (Math.hypot(px - (-22), pz - 12) < 18) return 'The Whisper Shrine';
    if (Math.hypot(px - 0, pz - 50) < 22) return 'Pelican Cove Pier';
    if (pz < -15) return 'North Sea Cliffs';
    return 'Lush Coastal Ridge';
  }

  private notifyState() {
    if (!this.onStateUpdate) return;
    this.onStateUpdate({
      playing: !this.isTitleScreen,
      paused: this.isPaused,
      isSitting: this.player.isSitting,
      timeOfDay: this.timeOfDay,
      currentLocationName: this.getCurrentLocationName(),
      activeLandmark: this.activeLandmark,
      readingNote: this.readingLandmark,
      fps: this.currentFps,
      zenMode: this.settings.zenMode,
      cinematicLetterbox: this.settings.showCinematicBars,
    });
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.animationFrameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('blur', this.handleBlur);

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
