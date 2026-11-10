import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameSettings, GameState, GraphicsQuality, Landmark } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { NoteModal } from './components/NoteModal';
import { PauseMenu } from './components/PauseMenu';
import { resetDiscoveredNotes } from './game/lore';
import { soundEngine } from './game/audio';

const defaultSettings: GameSettings = {
  quality: 'high',
  pixelRatio: 1.5,
  shadows: true,
  soundVolume: 0.8,
  ambienceVolume: 0.8,
  musicMuted: false,
  timeOfDay: 17.5, // 5:30 PM Golden Sunset
  autoCycleTime: false,
  touchControls: true,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [gameState, setGameState] = useState<GameState>({
    playing: false,
    paused: false,
    timeOfDay: 17.5,
    currentLocationName: 'Pelican Cove Pier',
    activeLandmark: null,
    readingNote: null,
    discoveredLandmarkIds: [],
    totalLandmarks: 5,
    fps: 60,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [isMobileTouch, setIsMobileTouch] = useState(false);

  // Detect mobile/touch support
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobileTouch(isTouch);
  }, []);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      settings,
      (newState) => {
        setGameState((prev) => ({ ...prev, ...newState }));
      }
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Presence heartbeat for the online backend
  useEffect(() => {
    const playerId = `wanderer-${Math.random().toString(36).substring(2, 9)}`;

    const sendHeartbeat = () => {
      if (!gameState.playing) return;
      fetch('/api/island/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playerId,
          name: 'Island Traveler',
          x: 0,
          z: 0,
        }),
      }).catch(() => {});
    };

    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [gameState.playing]);

  // Handlers
  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleInteract = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerInteract();
    }
  }, []);

  const handleCloseNote = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.closeNote();
    }
  }, []);

  const handleTimeChange = useCallback((hour: number) => {
    if (engineRef.current) {
      engineRef.current.setTimeOfDay(hour);
      setSettings((s) => ({ ...s, timeOfDay: hour }));
    }
  }, []);

  const handleAutoCycleToggle = useCallback((auto: boolean) => {
    if (engineRef.current) {
      engineRef.current.setAutoCycle(auto);
      setSettings((s) => ({ ...s, autoCycleTime: auto }));
    }
  }, []);

  const handleQualityChange = useCallback((quality: GraphicsQuality) => {
    if (engineRef.current) {
      engineRef.current.applyQualitySettings(quality);
      setSettings((s) => ({ ...s, quality }));
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    setSettings((s) => ({ ...s, musicMuted: nextMuted }));
  }, [isMuted]);

  const handleResetProgress = useCallback(() => {
    resetDiscoveredNotes();
    setGameState((prev) => ({ ...prev, discoveredLandmarkIds: [] }));
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  // Virtual Joystick callbacks
  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.setJoystickInput(x, y);
    }
  }, []);

  const handleCameraMove = useCallback((dx: number, dy: number) => {
    if (engineRef.current) {
      engineRef.current.setTouchCameraDelta(dx, dy);
    }
  }, []);

  const handleJump = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setTouchJump();
    }
  }, []);

  const handleSprintToggle = useCallback((sprint: boolean) => {
    setIsSprinting(sprint);
    if (engineRef.current) {
      engineRef.current.setTouchRun(sprint);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. Stable WebGL Canvas Container outside React HUD (Three.js skill directive) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Title Screen State */}
      {!gameState.playing && (
        <TitleScreen
          onStart={handleStartGame}
          quality={settings.quality}
          onQualityChange={handleQualityChange}
          savedSecretsCount={gameState.discoveredLandmarkIds.length}
        />
      )}

      {/* 3. In-Game HUD Overlay (Low Occlusion) */}
      {gameState.playing && !gameState.paused && (
        <>
          <HUD
            gameState={gameState}
            onPause={handlePauseGame}
            onInteract={handleInteract}
            onTimeChange={handleTimeChange}
            onAutoCycleToggle={handleAutoCycleToggle}
            autoCycle={settings.autoCycleTime}
            onMuteToggle={handleMuteToggle}
            isMuted={isMuted}
            quality={settings.quality}
            onQualityChange={handleQualityChange}
            isMobileTouch={isMobileTouch}
          />

          {/* Virtual Joystick for Touch / Mobile */}
          {isMobileTouch && (
            <VirtualJoystick
              onJoystickMove={handleJoystickMove}
              onCameraMove={handleCameraMove}
              onJump={handleJump}
              onSprintToggle={handleSprintToggle}
              isSprinting={isSprinting}
            />
          )}
        </>
      )}

      {/* 4. Reading Note / Parchment Modal */}
      {gameState.readingNote && (
        <NoteModal landmark={gameState.readingNote} onClose={handleCloseNote} />
      )}

      {/* 5. Pause Menu */}
      {gameState.paused && (
        <PauseMenu
          onResume={handleResumeGame}
          quality={settings.quality}
          onQualityChange={handleQualityChange}
          onResetProgress={handleResetProgress}
        />
      )}
    </div>
  );
}
