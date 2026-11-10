export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  quality: GraphicsQuality;
  pixelRatio: number;
  shadows: boolean;
  soundVolume: number;
  ambienceVolume: number;
  musicMuted: boolean;
  timeOfDay: number; // 0 to 24 (e.g. 17.5 = 5:30 PM sunset)
  autoCycleTime: boolean;
  touchControls: boolean;
}

export interface Landmark {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  unlocked: boolean;
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
  joystickX: number; // -1 to 1
  joystickY: number; // -1 to 1
  cameraDeltaX: number;
  cameraDeltaY: number;
}

export interface GameState {
  playing: boolean;
  paused: boolean;
  timeOfDay: number;
  currentLocationName: string;
  activeLandmark: Landmark | null;
  readingNote: Landmark | null;
  discoveredLandmarkIds: string[];
  totalLandmarks: number;
  fps: number;
}
