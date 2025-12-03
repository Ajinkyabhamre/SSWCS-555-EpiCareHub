/* eslint-disable react/no-unknown-property */
/**
 * BrainHeroCanvas.jsx
 *
 * Canvas wrapper for the 3D brain visualization.
 * Loads a GLB brain model with animated seizure hotspots using React Three Fiber.
 *
 * SAFETY NOTES:
 * - NO Preload, CubeCamera, Environment, or custom uniforms
 * - Only standard THREE materials (meshStandardMaterial)
 * - Suspense boundary for graceful model loading
 * - Fallback UI if model cannot be loaded
 * - This avoids all refreshUniformsCommon / undefined uniform.value errors
 *
 * ASSET SETUP:
 * - Brain model should be placed at: Frontend/public/models/brain_epicarehub.glb
 * - If missing, a placeholder sphere will be shown
 */

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import BrainModel from "./BrainModel";

/**
 * Loading fallback component
 */
function BrainLoadingFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block mb-3">
          <div className="w-10 h-10 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-emerald-700">Loading brain visualization...</p>
      </div>
    </div>
  );
}

/**
 * Error fallback component
 */
function BrainErrorFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-emerald-700">Brain preview unavailable</p>
        <p className="text-xs text-emerald-600 mt-2">Please ensure brain_epicarehub.glb is placed in public/models/</p>
      </div>
    </div>
  );
}

/**
 * Scene component with lighting
 */
function BrainScene() {
  return (
    <>
      {/* Lighting Setup - Clinical, soft look */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#ffffff"
      />
      <directionalLight
        position={[-4, -3, -5]}
        intensity={0.35}
        color="#34d399"
      />
      <pointLight position={[0, 0, 3]} intensity={0.2} color="#a855f7" />

      {/* Brain model with hotspots */}
      <Suspense fallback={null}>
        <BrainModel />
      </Suspense>
    </>
  );
}

/**
 * BrainHeroCanvas
 * Main export: Canvas wrapper that loads the brain model with proper error handling
 */
export function BrainHeroCanvas() {
  return (
    <Suspense fallback={<BrainLoadingFallback />}>
      <ErrorBoundary fallback={<BrainErrorFallback />}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            depth: true,
          }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "1.5rem",
          }}
        >
          <BrainScene />
        </Canvas>
      </ErrorBoundary>
    </Suspense>
  );
}

/**
 * Simple error boundary to catch any rendering errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error("BrainHeroCanvas error:", error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default BrainHeroCanvas;
