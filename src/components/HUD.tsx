import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Pause,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
} from 'lucide-react';
import { GameState, GraphicsQuality } from '../game/types';

interface HUDProps {
  gameState: GameState;
  onPause: () => void;
  onInteract: () => void;
  onTimeChange: (hour: number) => void;
  onAutoCycleToggle: (auto: boolean) => void;
  autoCycle: boolean;
  onMuteToggle: () => void;
  isMuted: boolean;
  quality: GraphicsQuality;
  onQualityChange: (q: GraphicsQuality) => void;
  isMobileTouch: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  onPause,
  onInteract,
  onTimeChange,
  onAutoCycleToggle,
  autoCycle,
  onMuteToggle,
  isMuted,
  quality,
  onQualityChange,
  isMobileTouch,
}) => {
  const [dockExpanded, setDockExpanded] = useState(true);

  // Format time of day into 12-hour AM/PM string
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const getTimePhaseName = (hour: number) => {
    if (hour >= 5 && hour < 8) return 'Dawn';
    if (hour >= 8 && hour < 16) return 'Midday';
    if (hour >= 16 && hour < 19) return 'Sunset (Golden Hour)';
    if (hour >= 19 && hour < 21) return 'Twilight';
    return 'Night (Starlit)';
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none text-white">
      {/* Top Bar: Location Header & Discovered Counter & Pause */}
      <div className="flex items-center justify-between w-full">
        {/* Location Banner */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0e141cd9] border border-[#233344] px-4 py-2 rounded-xl shadow-lg">
          <Compass className="w-4 h-4 text-[#e5a855]" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8ca3b8] font-medium leading-none">
              Location
            </div>
            <div
              className="text-sm sm:text-base font-semibold text-[#f5f8fb] tracking-wide"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {gameState.currentLocationName}
            </div>
          </div>
        </div>

        {/* Right Status Cluster */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Discovered Secrets Badge */}
          <div className="flex items-center gap-2 bg-[#0e141cd9] border border-[#233344] px-3 py-1.5 rounded-xl text-xs text-[#eed891] shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#e5a855]" />
            <span className="font-semibold tabular-nums">
              {gameState.discoveredLandmarkIds.length} / {gameState.totalLandmarks}
            </span>
            <span className="hidden sm:inline text-[#a6b8c7]">Secrets Found</span>
          </div>

          {/* FPS Badge */}
          <div className="hidden sm:flex items-center bg-[#0e141cd9] border border-[#233344] px-2.5 py-1.5 rounded-xl text-xs tabular-nums text-[#8da3b5]">
            {gameState.fps} FPS
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="flex items-center justify-center w-9 h-9 bg-[#0e141cd9] hover:bg-[#1a2533] border border-[#233344] active:scale-95 rounded-xl text-[#d4e4f2] transition-colors cursor-pointer"
            title="Pause Menu (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Contextual Interaction Prompt */}
      {gameState.activeLandmark && !gameState.readingNote && (
        <div className="pointer-events-auto mx-auto my-auto animate-fade-in">
          <button
            onClick={onInteract}
            className="group flex items-center gap-3 bg-[#111822f0] hover:bg-[#192331] border border-[#e5a855]/70 hover:border-[#f3be73] px-6 py-3 rounded-2xl shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-[#e5a855] text-black font-bold flex items-center justify-center text-xs shadow">
              {isMobileTouch ? 'TAP' : 'E'}
            </div>
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider text-[#e5a855] font-semibold">
                Inspect Landmark
              </div>
              <div className="text-sm font-medium text-white">
                Read {gameState.activeLandmark.title}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Dock (Three.js skill directive) */}
      <div className="pointer-events-auto mx-auto w-full max-w-3xl flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setDockExpanded(!dockExpanded)}
          className="flex items-center gap-1.5 bg-[#0e141cf2] border border-b-0 border-[#233344] px-4 py-1 rounded-t-lg text-[11px] font-medium text-[#9eb6cc] hover:text-white transition-colors cursor-pointer shadow-md"
        >
          {dockExpanded ? (
            <>
              <ChevronDown className="w-3 h-3 text-[#e5a855]" />
              <span>Hide Controls</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3 text-[#e5a855]" />
              <span>Atmosphere & Settings</span>
            </>
          )}
        </button>

        {/* Main Dock Surface */}
        {dockExpanded && (
          <div className="w-full bg-[#0a0f16f5] border border-[#233344] rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Time of Day Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#e5a855]" />
                <span className="font-semibold text-white whitespace-nowrap">
                  {formatTime(gameState.timeOfDay)}
                </span>
                <span className="text-[11px] text-[#8ca3b8] hidden md:inline">
                  ({getTimePhaseName(gameState.timeOfDay)})
                </span>
              </div>

              {/* Quick Lighting Presets */}
              <div className="flex items-center gap-1 bg-[#121922] p-1 rounded-xl border border-[#1f2b38]">
                {[
                  { label: 'Dawn', hour: 6.0 },
                  { label: 'Noon', hour: 12.0 },
                  { label: 'Sunset', hour: 17.5 },
                  { label: 'Night', hour: 23.0 },
                ].map((preset) => {
                  const isActive = Math.abs(gameState.timeOfDay - preset.hour) < 1.5;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => onTimeChange(preset.hour)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#e5a855] text-black font-semibold'
                          : 'text-[#9eb6cc] hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Auto Day/Night Cycle Toggle */}
              <button
                onClick={() => onAutoCycleToggle(!autoCycle)}
                className={`px-2 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                  autoCycle
                    ? 'border-[#e5a855] bg-[#e5a855]/20 text-[#ffd375]'
                    : 'border-[#233344] text-[#8ca3b8] hover:text-white'
                }`}
                title="Toggle continuous time progression"
              >
                Auto {autoCycle ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Right Tools: Mute, Quality & Info */}
            <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
              {/* Mute Button */}
              <button
                onClick={onMuteToggle}
                className="flex items-center justify-center p-2 rounded-xl bg-[#121922] hover:bg-[#1a2533] border border-[#1f2b38] text-[#9eb6cc] hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#73cf87]" />
                )}
              </button>

              {/* Quality Switcher */}
              <div className="flex items-center gap-1 bg-[#121922] p-1 rounded-xl border border-[#1f2b38]">
                {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => onQualityChange(q)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition-colors cursor-pointer ${
                      quality === q
                        ? 'bg-[#3b82f6] text-white'
                        : 'text-[#7d93a6] hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
