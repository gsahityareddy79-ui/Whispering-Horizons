import React, { useState } from 'react';
import {
  Compass,
  Sun,
  Volume2,
  VolumeX,
  Pause,
  ChevronDown,
  ChevronUp,
  Film,
  Armchair,
  BookOpen,
  Eye,
  EyeOff,
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
  cinematicLetterbox: boolean;
  onToggleCinematicLetterbox: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
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
  cinematicLetterbox,
  onToggleCinematicLetterbox,
  zenMode,
  onToggleZenMode,
}) => {
  const [dockExpanded, setDockExpanded] = useState(true);

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
    if (hour >= 16 && hour < 19) return 'Golden Sunset';
    if (hour >= 19 && hour < 21) return 'Twilight';
    return 'Starlit Night';
  };

  return (
    <>
      {/* Cinematic 2.35:1 Widescreen Letterbox Bars */}
      {cinematicLetterbox && (
        <div className="pointer-events-none fixed inset-0 z-15 flex flex-col justify-between">
          <div className="w-full h-12 sm:h-16 bg-black transition-all duration-500" />
          <div className="w-full h-12 sm:h-16 bg-black transition-all duration-500" />
        </div>
      )}

      {/* Zen Mode Exit Button (only shown in Zen Mode) */}
      {zenMode && (
        <div className="pointer-events-auto fixed top-4 right-4 z-25">
          <button
            onClick={onToggleZenMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white/80 hover:text-white text-xs transition-all cursor-pointer backdrop-blur-none"
            title="Exit Zen Mode (H)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show UI</span>
          </button>
        </div>
      )}

      {/* Main HUD (hidden when Zen Mode is active) */}
      {!zenMode && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none text-white">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between w-full">
            {/* Location Badge */}
            <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0a0f16f0] border border-[#233549] px-4 py-2 rounded-2xl shadow-xl">
              <Compass className="w-4 h-4 text-[#e5a855]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#7e96ac] font-medium leading-none">
                  Location
                </div>
                <div
                  className="text-sm sm:text-base font-semibold text-[#f8fafc] tracking-wide"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {gameState.currentLocationName}
                </div>
              </div>
            </div>

            {/* Right Tools Cluster */}
            <div className="pointer-events-auto flex items-center gap-2">
              {/* Zen Mode Toggle */}
              <button
                onClick={onToggleZenMode}
                className="p-2 rounded-2xl bg-[#0a0f16f0] hover:bg-[#16212e] text-[#94a3b8] hover:text-white border border-[#233549] transition-all cursor-pointer"
                title="Zen Mode: Hide all UI (H)"
              >
                <EyeOff className="w-4 h-4" />
              </button>

              {/* Letterbox Cinema Toggle */}
              <button
                onClick={onToggleCinematicLetterbox}
                className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                  cinematicLetterbox
                    ? 'bg-[#e5a855] text-black border-[#ffd375]'
                    : 'bg-[#0a0f16f0] hover:bg-[#16212e] text-[#94a3b8] hover:text-white border-[#233549]'
                }`}
                title="Toggle Cinematic Letterbox (C)"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* FPS Badge */}
              <div className="hidden sm:flex items-center bg-[#0a0f16f0] border border-[#233549] px-2.5 py-2 rounded-2xl text-xs tabular-nums text-[#8ca3b8]">
                {gameState.fps} FPS
              </div>

              {/* Pause Menu Button */}
              <button
                onClick={onPause}
                className="flex items-center justify-center w-10 h-10 bg-[#0a0f16f0] hover:bg-[#16212e] border border-[#233549] active:scale-95 rounded-2xl text-[#cbd5e1] transition-all cursor-pointer"
                title="Pause Game (Esc)"
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
                className="group flex items-center gap-3.5 bg-[#0a0f16f8] hover:bg-[#141d2a] border border-[#e5a855]/80 hover:border-[#f5b042] px-6 py-3.5 rounded-2xl shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-[#e5a855] text-black font-extrabold flex items-center justify-center text-xs shadow-md">
                  {isMobileTouch ? 'TAP' : 'E'}
                </div>
                <div className="text-left">
                  <div className="text-[11px] uppercase tracking-wider text-[#e5a855] font-semibold flex items-center gap-1.5">
                    {gameState.activeLandmark.actionType === 'sit' ? (
                      <>
                        <Armchair className="w-3.5 h-3.5" />
                        <span>{gameState.isSitting ? 'Stand Up' : 'Rest at Campfire'}</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{gameState.activeLandmark.promptLabel || 'Inspect Landmark'}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {gameState.activeLandmark.title}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Collapsible Ergonomic Bottom Dock (Three.js Directive: <= 15% viewport) */}
          <div className="pointer-events-auto mx-auto w-full max-w-2xl flex flex-col items-center">
            <button
              onClick={() => setDockExpanded(!dockExpanded)}
              className="flex items-center gap-1.5 bg-[#0c121af2] border border-b-0 border-[#233549] px-4 py-1.5 rounded-t-xl text-[11px] font-medium text-[#9eb6cc] hover:text-white transition-colors cursor-pointer shadow-lg"
            >
              {dockExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3 text-[#e5a855]" />
                  <span>Hide Atmosphere Dock</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3 h-3 text-[#e5a855]" />
                  <span>Atmosphere & Lighting</span>
                </>
              )}
            </button>

            {dockExpanded && (
              <div className="w-full bg-[#0a0f16f8] border border-[#233549] rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Time of Day */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#e5a855]" />
                    <span className="font-semibold text-white whitespace-nowrap">
                      {formatTime(gameState.timeOfDay)}
                    </span>
                    <span className="text-[11px] text-[#8ca3b8] hidden lg:inline">
                      ({getTimePhaseName(gameState.timeOfDay)})
                    </span>
                  </div>

                  {/* Lighting Presets */}
                  <div className="flex items-center gap-1 bg-[#121a24] p-1 rounded-xl border border-[#1e2c3c]">
                    {[
                      { label: 'Dawn', hour: 6.0 },
                      { label: 'Noon', hour: 12.0 },
                      { label: 'Sunset', hour: 17.5 },
                      { label: 'Night', hour: 23.0 },
                    ].map((preset) => {
                      const isActive = Math.abs(gameState.timeOfDay - preset.hour) < 1.4;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => onTimeChange(preset.hour)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#e5a855] text-black font-semibold shadow-sm'
                              : 'text-[#9eb6cc] hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Auto Cycle */}
                  <button
                    onClick={() => onAutoCycleToggle(!autoCycle)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-colors cursor-pointer ${
                      autoCycle
                        ? 'border-[#e5a855] bg-[#e5a855]/20 text-[#ffd375]'
                        : 'border-[#233549] text-[#8ca3b8] hover:text-white'
                    }`}
                    title="Continuous time progression"
                  >
                    Auto {autoCycle ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Tools & Audio */}
                <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                  <button
                    onClick={onMuteToggle}
                    className="p-2 rounded-xl bg-[#121a24] hover:bg-[#1a2533] border border-[#1e2c3c] text-[#9eb6cc] hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#73cf87]" />
                    )}
                  </button>

                  {/* Quality */}
                  <div className="flex items-center gap-1 bg-[#121a24] p-1 rounded-xl border border-[#1e2c3c]">
                    {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                      <button
                        key={q}
                        onClick={() => onQualityChange(q)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                          quality === q
                            ? 'bg-[#3b82f6] text-white shadow-sm'
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
      )}
    </>
  );
};
