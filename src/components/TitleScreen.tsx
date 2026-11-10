import React, { useEffect } from 'react';
import { Compass, Sparkles, Volume2 } from 'lucide-react';
import { GraphicsQuality } from '../game/types';

interface TitleScreenProps {
  onStart: () => void;
  quality: GraphicsQuality;
  onQualityChange: (q: GraphicsQuality) => void;
  savedSecretsCount: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  quality,
  onQualityChange,
  savedSecretsCount,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-8 sm:p-12 select-none text-white">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#12161ce6] border border-[#2a3848] px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium text-[#9fc2db]">
          <Compass className="w-3.5 h-3.5 text-[#e5a855]" />
          <span>Interactive 3D Prototype · v1.0</span>
        </div>

        {savedSecretsCount > 0 && (
          <div className="flex items-center gap-2 bg-[#12161ce6] border border-[#2a3848] px-3.5 py-1.5 rounded-full text-xs text-[#eed891]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{savedSecretsCount} / 5 Secrets Discovered</span>
          </div>
        )}
      </div>

      {/* Main Title Centerpiece */}
      <div className="max-w-xl mx-auto text-center pointer-events-auto my-auto">
        {/* Inline SVG Title Lockup */}
        <div className="flex justify-center mb-3">
          <svg
            className="w-full max-w-[420px] h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            viewBox="0 0 520 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="48"
              textAnchor="middle"
              className="font-serif tracking-[0.22em] text-[36px] font-bold fill-[#fff5e4]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              WHISPERING
            </text>
            <text
              x="50%"
              y="75"
              textAnchor="middle"
              className="tracking-[0.45em] text-[18px] font-semibold fill-[#e5a855]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              HORIZONS
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-[#d8e2eb] font-light tracking-wide max-w-md mx-auto mb-8 leading-relaxed drop-shadow">
          An atmospheric coastal exploration. Traverse weathered sea cliffs, 
          uncover ancient secrets, and reach the summit lighthouse before night falls.
        </p>

        {/* Start Button CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="group relative px-8 py-3.5 bg-gradient-to-r from-[#d97736] to-[#b35422] hover:from-[#e88846] hover:to-[#c6602b] active:scale-95 text-[#fff8ee] text-base font-semibold tracking-widest uppercase rounded-lg shadow-xl shadow-orange-950/40 border border-[#f5b078]/40 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <span>Begin Exploration</span>
              <span className="text-xs bg-black/30 px-2 py-0.5 rounded text-[#fde4cf]">
                Enter / Space
              </span>
            </span>
          </button>

          {/* Graphics Quality Preset Selector */}
          <div className="flex items-center gap-2 mt-2 bg-[#0c1117cc] border border-[#212f3d] px-3 py-1.5 rounded-full text-xs">
            <span className="text-[#8ca1b3]">Graphics:</span>
            {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                className={`px-2.5 py-0.5 rounded capitalize font-medium transition-colors cursor-pointer ${
                  quality === q
                    ? 'bg-[#e5a855] text-black font-semibold'
                    : 'text-[#9fc2db] hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flat Control Hints Footer */}
      <div className="pointer-events-auto mx-auto bg-[#0a0e14d9] border border-[#212f3d] px-5 py-2.5 rounded-xl text-xs sm:text-sm text-[#9eb6cc] flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        <span><strong className="text-white">WASD / Stick</strong> Move</span>
        <span><strong className="text-white">Shift</strong> Run</span>
        <span><strong className="text-white">Mouse Drag / Touch</strong> Camera</span>
        <span><strong className="text-white">Space</strong> Jump</span>
        <span><strong className="text-white">E</strong> Read Lore</span>
      </div>
    </div>
  );
};
