import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Zap } from 'lucide-react';

interface VirtualJoystickProps {
  onJoystickMove: (x: number, y: number) => void;
  onCameraMove: (dx: number, dy: number) => void;
  onJump: () => void;
  onSprintToggle: (sprinting: boolean) => void;
  isSprinting: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onJoystickMove,
  onCameraMove,
  onJump,
  onSprintToggle,
  isSprinting,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const cameraTouchId = useRef<number | null>(null);
  const lastCameraTouch = useRef({ x: 0, y: 0 });

  // 1. Joystick touch handling (bottom-left)
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystickPosition(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isJoystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        setIsJoystickActive(false);
        joystickTouchId.current = null;
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const angle = Math.atan2(dy, dx);
    const clampedDistance = Math.min(distance, maxRadius);

    const normX = (clampedDistance / maxRadius) * Math.cos(angle);
    const normY = (clampedDistance / maxRadius) * Math.sin(angle);

    setKnobPos({
      x: (clampedDistance * Math.cos(angle)),
      y: (clampedDistance * Math.sin(angle)),
    });

    // Pass normalized (-1 to 1) values to player controller
    // Note: forward is negative Y in screen space, so we invert Y
    onJoystickMove(normX, -normY);
  };

  // 2. Camera touch surface (right side of screen)
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (cameraTouchId.current === null) {
      cameraTouchId.current = touch.identifier;
      lastCameraTouch.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchId.current) {
        const dx = touch.clientX - lastCameraTouch.current.x;
        const dy = touch.clientY - lastCameraTouch.current.y;
        lastCameraTouch.current = { x: touch.clientX, y: touch.clientY };
        onCameraMove(dx, dy);
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchId.current) {
        cameraTouchId.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* Right Screen Half Touch Surface for Camera Orbit */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto"
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
      />

      {/* Virtual Joystick Container (Bottom Left) */}
      <div className="absolute bottom-24 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative w-28 h-28 rounded-full bg-[#121a2480] border-2 border-[#384e6690] flex items-center justify-center shadow-2xl active:border-[#e5a855]"
        >
          {/* Inner Joystick Thumb Knob */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-b from-[#e5a855] to-[#b37c34] border border-[#ffdb99] shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Side Action Buttons: Jump & Sprint */}
      <div className="absolute bottom-24 right-6 pointer-events-auto flex flex-col items-center gap-3">
        {/* Sprint Toggle Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onSprintToggle(!isSprinting);
          }}
          onClick={() => onSprintToggle(!isSprinting)}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center text-xs font-bold border shadow-xl transition-all active:scale-95 cursor-pointer ${
            isSprinting
              ? 'bg-[#e5a855] text-black border-[#ffd375]'
              : 'bg-[#121a24d0] text-[#9eb6cc] border-[#384e66]'
          }`}
          title="Toggle Sprint"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* Jump Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onJump();
          }}
          onClick={onJump}
          className="w-14 h-14 rounded-2xl bg-[#121a24d0] active:bg-[#e5a855] active:text-black hover:bg-[#1a2533] border-2 border-[#384e66] text-white flex items-center justify-center font-bold shadow-xl active:scale-90 transition-transform cursor-pointer"
          title="Jump"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
