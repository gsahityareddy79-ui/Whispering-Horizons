import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  ShieldCheck,
  Smartphone,
  Monitor,
  X,
  Radio,
} from 'lucide-react';
import { GraphicsQuality } from '../game/types';
import { soundEngine } from '../game/audio';

interface PauseMenuProps {
  onResume: () => void;
  quality: GraphicsQuality;
  onQualityChange: (q: GraphicsQuality) => void;
  onResetProgress: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  quality,
  onQualityChange,
  onResetProgress,
}) => {
  const [volume, setVolume] = useState(80);
  const [serverStatus, setServerStatus] = useState<string>('Checking...');
  const [activeTab, setActiveTab] = useState<'settings' | 'controls' | 'online'>('settings');

  useEffect(() => {
    // Check server backend health
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setServerStatus(`Connected · ${data.activeExplorers || 1} Explorer(s) Online`);
      })
      .catch(() => {
        setServerStatus('Offline (Local Mode)');
      });
  }, []);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundEngine.setMasterVolume(newVol / 100);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 select-none text-white">
      <div className="relative w-full max-w-lg bg-[#0c121af8] border border-[#233549] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1c2c3e]">
          <div>
            <div
              className="text-xl font-bold tracking-widest text-[#f0f4f8]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              PAUSED
            </div>
            <div className="text-xs text-[#8ca4b8]">Whispering Horizons</div>
          </div>

          <button
            onClick={onResume}
            className="w-8 h-8 rounded-full bg-[#16212e] hover:bg-[#202f42] text-[#9eb6cc] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 my-4 border-b border-[#1c2c3e] pb-3 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#e5a855] text-black'
                : 'text-[#8ca4b8] hover:text-white'
            }`}
          >
            Graphics & Audio
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-[#e5a855] text-black'
                : 'text-[#8ca4b8] hover:text-white'
            }`}
          >
            Controls Guide
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'online'
                ? 'bg-[#e5a855] text-black'
                : 'text-[#8ca4b8] hover:text-white'
            }`}
          >
            Server & Online
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 space-y-5 text-xs text-[#c4d7e8] flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Graphics Quality */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#9fc2db]">
                  Graphics Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => onQualityChange(q)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                        quality === q
                          ? 'bg-[#3b82f6] border-[#60a5fa] text-white shadow-md'
                          : 'bg-[#121a24] border-[#1e2c3c] text-[#8ca4b8] hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#7891a6]">
                  {quality === 'low' && 'Optimized for Android phones. Standard pixel ratio, shadow mapping off.'}
                  {quality === 'medium' && 'Balanced performance. 1.25x pixel ratio and directional shadows.'}
                  {quality === 'high' && 'Cinematic fidelity. High pixel ratio, soft PCF shadows and lush foliage.'}
                </p>
              </div>

              {/* Master Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[#9fc2db]">
                    Master Sound Volume
                  </span>
                  <span className="tabular-nums font-mono text-[#e5a855]">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#1b2633] rounded-lg appearance-none cursor-pointer accent-[#e5a855]"
                />
              </div>

              {/* Reset Progress */}
              <div className="pt-2 border-t border-[#1c2c3e]">
                <button
                  onClick={() => {
                    if (confirm('Reset your discovered notes and exploration progress?')) {
                      onResetProgress();
                    }
                  }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Saved Exploration Progress</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="bg-[#121a24] p-3.5 rounded-2xl border border-[#1e2c3c] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Monitor className="w-4 h-4 text-[#e5a855]" />
                  <span>Desktop & Laptop Keyboard</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8ca4b8]">
                  <div><strong className="text-white">WASD / Arrows:</strong> Walk</div>
                  <div><strong className="text-white">Left Shift:</strong> Run / Sprint</div>
                  <div><strong className="text-white">Spacebar:</strong> Jump</div>
                  <div><strong className="text-white">Mouse Drag:</strong> Orbit Camera</div>
                  <div><strong className="text-white">Mouse Wheel:</strong> Zoom In / Out</div>
                  <div><strong className="text-white">E Key:</strong> Read Note / Inspect</div>
                </div>
              </div>

              <div className="bg-[#121a24] p-3.5 rounded-2xl border border-[#1e2c3c] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Smartphone className="w-4 h-4 text-[#73cf87]" />
                  <span>Mobile & Touchscreen</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8ca4b8]">
                  <div><strong className="text-white">Left Virtual Stick:</strong> 360° Movement</div>
                  <div><strong className="text-white">Right Half Touch:</strong> Orbit Camera</div>
                  <div><strong className="text-white">Arrow Up Icon:</strong> Jump</div>
                  <div><strong className="text-white">Zap Icon:</strong> Toggle Sprint</div>
                  <div><strong className="text-white">TAP Button:</strong> Read Note</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="bg-[#121a24] p-4 rounded-2xl border border-[#1e2c3c] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Radio className="w-4 h-4 text-[#73cf87]" />
                    <span>Node.js Backend Engine</span>
                  </div>
                  <span className="text-[10px] bg-[#1a2f22] text-[#73cf87] px-2 py-0.5 rounded border border-[#2e573a]">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#8ca4b8] leading-relaxed">
                  Status: <span className="text-white font-mono">{serverStatus}</span>
                </p>
                <p className="text-[11px] text-[#8ca4b8] leading-relaxed">
                  The backend enables shared community drift bottle notes and tracks live explorer
                  heartbeats. In future releases, real-time WebSocket synchronization will allow seeing other
                  explorers moving across the island in real time!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-[#1c2c3e] flex items-center justify-between">
          <span className="text-[11px] text-[#637a8f]">Whispering Horizons © 2026</span>
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#e5a855] hover:bg-[#f3be73] active:scale-95 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Resume Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
