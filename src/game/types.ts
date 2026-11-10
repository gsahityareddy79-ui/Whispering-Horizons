export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  quality: GraphicsQuality;
  pixelRatio: number;
  shadows: boolean;
  soundVolume: number;
  ambienceVolume: number;
  musicMuted: boolean;
  timeOfDay: number; // 0 to 24 (17.5 = 5:30 PM golden hour)
  autoCycleTime: boolean;
  touchControls: boolean;
  showCinematicBars: boolean;
  zenMode: boolean; // 100% clean screen without any HUD
}

export interface Landmark {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  actionType: 'read' | 'sit' | 'inspect';
  promptLabel: string;
  noteContent?: {
    header: string;
    body: string;
    author: string;
    date: string;
  };
}

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  interact: boolean;
  sit: boolean;
  joystickX: number; // -1 to 1
  joystickY: number; // -1 to 1
  cameraDeltaX: number;
  cameraDeltaY: number;
}

export interface GameState {
  playing: boolean;
  paused: boolean;
  isSitting: boolean;
  timeOfDay: number;
  currentLocationName: string;
  activeLandmark: Landmark | null;
  readingNote: Landmark | null;
  fps: number;
  zenMode: boolean;
  cinematicLetterbox: boolean;
}
