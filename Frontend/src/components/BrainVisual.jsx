/**
 * BrainVisual.jsx
 *
 * Simple, CSS-animated brain visual for the hero card.
 * No 3D, no WebGL, no heavy dependencies.
 * Uses pure HTML + Tailwind + CSS animations.
 */

import { useState, useEffect } from "react";

export function BrainVisual() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-8">
      <div className="relative w-40 h-40">
        {/* Main brain circle background */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400 shadow-xl transition-all duration-1000 ${
            isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
          style={{
            filter: "drop-shadow(0 10px 30px rgba(168, 85, 247, 0.2))",
          }}
        >
          {/* Subtle hemisphere line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-purple-600 to-transparent opacity-30 -translate-x-1/2"></div>

          {/* Left hemisphere accent */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-1/3 rounded-l-full bg-gradient-to-r from-purple-400 to-transparent opacity-20"></div>

          {/* Right hemisphere accent */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-1/3 rounded-r-full bg-gradient-to-l from-purple-400 to-transparent opacity-20"></div>
        </div>

        {/* Seizure Hotspot 1 (upper right) */}
        <div className="absolute top-8 right-12 z-20">
          {/* Glow ring */}
          <div className="absolute inset-0 w-6 h-6 rounded-full bg-red-400 opacity-20 animate-ping"></div>

          {/* Main hotspot */}
          <div
            className={`relative w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg transition-all duration-1000 ${
              isVisible
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0"
            }`}
            style={{
              animation: "pulse-hotspot 3s ease-in-out infinite",
              filter: "drop-shadow(0 4px 12px rgba(220, 38, 38, 0.4))",
            }}
          ></div>
        </div>

        {/* Seizure Hotspot 2 (left side) */}
        <div className="absolute top-1/3 left-6 z-20">
          {/* Glow ring */}
          <div
            className="absolute inset-0 w-5 h-5 rounded-full bg-orange-400 opacity-20 animate-ping"
            style={{ animationDelay: "0.5s" }}
          ></div>

          {/* Main hotspot */}
          <div
            className={`relative w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg transition-all duration-1000 ${
              isVisible
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0"
            }`}
            style={{
              animation: "pulse-hotspot 3s ease-in-out infinite 0.5s",
              filter: "drop-shadow(0 4px 12px rgba(234, 88, 12, 0.4))",
            }}
          ></div>
        </div>

        {/* Seizure Hotspot 3 (lower right) */}
        <div className="absolute bottom-12 right-10 z-20">
          {/* Glow ring */}
          <div
            className="absolute inset-0 w-5 h-5 rounded-full bg-yellow-400 opacity-20 animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Main hotspot */}
          <div
            className={`relative w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg transition-all duration-1000 ${
              isVisible
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0"
            }`}
            style={{
              animation: "pulse-hotspot 3s ease-in-out infinite 1s",
              filter: "drop-shadow(0 4px 12px rgba(217, 119, 6, 0.4))",
            }}
          ></div>
        </div>
      </div>

      {/* Animation keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-hotspot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}

export default BrainVisual;
