/* eslint-disable react/no-unknown-property */
import { useEffect, useState, useMemo, useRef, Suspense, useCallback } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import PropTypes from "prop-types";

/**
 * BrainWebGLViewer - Interactive 3D brain viewer using React Three Fiber
 *
 * MVP Features:
 * - Load MNI-aligned brain mesh (FreeSurfer pial surfaces)
 * - Render electrodes (SEEG/ECoG) from webglOverlay.json
 * - Activity-based coloring with hotspot highlighting
 * - UI controls: brain opacity, show/hide electrodes, hotspots-only mode
 * - Hover tooltip showing electrode label + activity
 * - Click to persist selection
 * - Camera reset-to-fit
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert activity value (0-1) to color gradient
 * Blue → Cyan → Green → Yellow → Red
 */
const activityToColor = (activity, isHotspot) => {
  if (isHotspot) {
    return new THREE.Color(1, 0, 0); // Bright red for hotspots
  }

  const value = Math.max(0, Math.min(1, activity));

  if (value < 0.25) {
    const t = value / 0.25;
    return new THREE.Color(0, t, 1); // Blue to Cyan
  } else if (value < 0.5) {
    const t = (value - 0.25) / 0.25;
    return new THREE.Color(0, 1, 1 - t); // Cyan to Green
  } else if (value < 0.75) {
    const t = (value - 0.5) / 0.25;
    return new THREE.Color(t, 1, 0); // Green to Yellow
  } else {
    const t = (value - 0.75) / 0.25;
    return new THREE.Color(1, 1 - t, 0); // Yellow to Red
  }
};

// ============================================================================
// SCENE COMPONENTS
// ============================================================================

/**
 * Brain Mesh Component - Loads and renders both hemispheres with auto-fit
 */
function BrainMesh({ opacity, onBrainLoaded, brainGroupRef }) {
  const lh = useLoader(OBJLoader, "/models/brain_lh.obj");
  const rh = useLoader(OBJLoader, "/models/brain_rh.obj");

  const brainGroup = useMemo(() => {
    console.log("[3D] Mesh loaded");

    const group = new THREE.Group();

    // Left hemisphere
    const lhClone = lh.clone();
    lhClone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.8,
          metalness: 0.1,
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide,
        });
      }
    });

    // Right hemisphere
    const rhClone = rh.clone();
    rhClone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.8,
          metalness: 0.1,
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide,
        });
      }
    });

    group.add(lhClone);
    group.add(rhClone);

    // Scale and rotate to fit view (MNI coordinates in mm → scene units)
    group.scale.set(0.01, 0.01, 0.01);
    group.rotation.x = -Math.PI / 2; // Align Z→Y
    group.rotation.z = Math.PI; // Flip front/back

    return group;
  }, [lh, rh, opacity]);

  // Store ref to brain group for bounding box calculations
  useEffect(() => {
    if (brainGroupRef && brainGroup) {
      brainGroupRef.current = brainGroup;
      // Compute bounding box and notify parent
      const box = new THREE.Box3().setFromObject(brainGroup);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const radius = size.length() / 2;

      console.log("[3D] Brain bounding box computed - radius:", radius.toFixed(2));
      onBrainLoaded({ box, size, center, radius });
    }
  }, [brainGroup, brainGroupRef, onBrainLoaded]);

  // Update opacity dynamically
  useEffect(() => {
    brainGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = opacity;
        child.material.needsUpdate = true;
      }
    });
  }, [opacity, brainGroup]);

  return <primitive object={brainGroup} />;
}

BrainMesh.propTypes = {
  opacity: PropTypes.number.isRequired,
  onBrainLoaded: PropTypes.func.isRequired,
  brainGroupRef: PropTypes.object.isRequired,
};

/**
 * Electrode Points Component - Renders spheres with hover/click interaction
 * Sizes are computed relative to brain scale
 */
function ElectrodePoints({ points, onHover, onClick, selectedLabel, brainScale }) {
  const [hoveredLabel, setHoveredLabel] = useState(null);

  // Compute electrode sizes based on brain scale (much smaller than before)
  const baseRadius = brainScale * 0.015; // 1.5% of brain size
  const hotspotRadius = brainScale * 0.025; // 2.5% of brain size (clamped)
  const maxRadius = brainScale * 0.04; // Never exceed 4% of brain size

  // Memoize handlers to prevent re-creation on every render
  const handlePointerOver = useCallback((e, pt) => {
    e.stopPropagation();
    // Only update if electrode changed
    if (hoveredLabel !== pt.label) {
      setHoveredLabel(pt.label);
      onHover(pt);
    }
  }, [hoveredLabel, onHover]);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    setHoveredLabel(null);
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback((e, pt) => {
    e.stopPropagation();
    onClick(pt);
  }, [onClick]);

  return (
    <group>
      {points.map((pt) => {
        const isSelected = pt.label === selectedLabel;
        const isHovered = pt.label === hoveredLabel;

        // Compute radius with proper sizing
        let radius = pt.isHotspot ? hotspotRadius : baseRadius;
        // Scale up for hover/selection
        if (isSelected) radius *= 1.3;
        else if (isHovered) radius *= 1.2;
        // Clamp to max size
        radius = Math.min(radius, maxRadius);

        return (
          <mesh
            key={pt.label}
            position={pt.position}
            onPointerOver={(e) => handlePointerOver(e, pt)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, pt)}
          >
            <sphereGeometry args={[radius, 16, 16]} />
            <meshStandardMaterial
              color={activityToColor(pt.activity, pt.isHotspot)}
              emissive={pt.isHotspot || isSelected ? "#ff4400" : "#000000"}
              emissiveIntensity={pt.isHotspot || isSelected ? 0.4 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

ElectrodePoints.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      position: PropTypes.arrayOf(PropTypes.number).isRequired,
      activity: PropTypes.number.isRequired,
      isHotspot: PropTypes.bool,
    })
  ).isRequired,
  onHover: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  selectedLabel: PropTypes.string,
  brainScale: PropTypes.number.isRequired,
};

/**
 * Camera Controller - Handles auto-fit and reset
 */
function CameraController({ controlsRef, brainBounds, autoFitTrigger }) {
  const { camera } = useThree();

  // Auto-fit camera to brain when bounds are available or reset is triggered
  useEffect(() => {
    if (!brainBounds || !controlsRef.current) return;

    const { center, radius } = brainBounds;

    // Position camera at comfortable distance
    const distance = radius * 2.2;
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);

    // Update controls target
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    console.log("[3D] Camera auto-fit complete - distance:", distance.toFixed(2));
  }, [brainBounds, camera, controlsRef, autoFitTrigger]);

  return null;
}

CameraController.propTypes = {
  controlsRef: PropTypes.object.isRequired,
  brainBounds: PropTypes.object,
  autoFitTrigger: PropTypes.number.isRequired,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BrainWebGLViewer = ({ uploadId, study }) => {
  // Data state
  const [electrodePoints, setElectrodePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Brain geometry state
  const [brainBounds, setBrainBounds] = useState(null);
  const brainGroupRef = useRef();

  // UI state
  const [brainOpacity, setBrainOpacity] = useState(1.0);
  const [showElectrodes, setShowElectrodes] = useState(true);
  const [hotspotsOnly, setHotspotsOnly] = useState(false);
  const [hoveredElectrode, setHoveredElectrode] = useState(null);
  const [selectedElectrode, setSelectedElectrode] = useState(null);
  const [autoFitTrigger, setAutoFitTrigger] = useState(0);

  // Refs
  const controlsRef = useRef();

  console.log("[BrainWebGLViewer] uploadId:", uploadId);
  console.log("[BrainWebGLViewer] study.webglOverlayUrl:", study?.webglOverlayUrl);

  // Callback when brain mesh is loaded
  const handleBrainLoaded = useCallback((bounds) => {
    setBrainBounds(bounds);
    // Trigger initial auto-fit
    setAutoFitTrigger((prev) => prev + 1);
  }, []);

  // Memoized hover handler to prevent re-creation
  const handleHover = useCallback((electrode) => {
    setHoveredElectrode(electrode);
  }, []);

  // Memoized click handler
  const handleClick = useCallback((electrode) => {
    setSelectedElectrode(electrode);
  }, []);

  // Handle reset button - triggers auto-fit
  const handleResetCamera = useCallback(() => {
    setAutoFitTrigger((prev) => prev + 1);
  }, []);

  // Fetch overlay data
  useEffect(() => {
    const fetchOverlay = async () => {
      const overlayUrl = study?.webglOverlayUrl;

      if (!overlayUrl) {
        setLoading(false);
        return;
      }

      try {
        console.log("[3D] Fetching overlay from:", overlayUrl);
        const response = await fetch(overlayUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch overlay: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[3D] Overlay loaded");

        // Parse electrode data (support both old and new formats)
        const electrodes = data.electrodes || [];
        const hotspotLabels = new Set(data.hotspots || []);

        const points = electrodes.map((electrode) => {
          // Support both { coord: [x,y,z] } and { x, y, z }
          const x = electrode.x ?? electrode.coord?.[0] ?? 0;
          const y = electrode.y ?? electrode.coord?.[1] ?? 0;
          const z = electrode.z ?? electrode.coord?.[2] ?? 0;

          // Convert MNI mm coordinates to scene coordinates
          const scale = 0.01; // Match brain scale
          const position = [
            x * scale,
            z * scale, // Z becomes Y (up) due to rotation
            -y * scale, // Y becomes -Z (depth) due to rotation
          ];

          // Support both { value } and { activity }
          const activity = electrode.activity ?? electrode.value ?? 0;
          const isHotspot =
            electrode.hotspot === true || hotspotLabels.has(electrode.label);

          return {
            label: electrode.label || `E${electrodes.indexOf(electrode)}`,
            position,
            activity,
            isHotspot,
          };
        });

        console.log(
          `[3D] Hotspot mapping done: ${points.length} electrodes, ${
            points.filter((p) => p.isHotspot).length
          } hotspots`
        );

        setElectrodePoints(points);
        setLoading(false);
      } catch (err) {
        console.error("[3D] Error fetching overlay:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOverlay();
  }, [study?.webglOverlayUrl]);

  // Filter electrodes based on hotspots-only mode
  const visibleElectrodes = useMemo(() => {
    if (!showElectrodes) return [];
    if (hotspotsOnly) return electrodePoints.filter((p) => p.isHotspot);
    return electrodePoints;
  }, [electrodePoints, showElectrodes, hotspotsOnly]);

  // Compute brain scale for electrode sizing
  const brainScale = brainBounds?.radius ?? 1.0;

  // Compute min/max camera distances based on brain size
  const minDistance = brainScale * 0.6;
  const maxDistance = brainScale * 5.0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading 3D brain viewer...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
        <p className="font-semibold mb-1">Failed to load 3D viewer</p>
        <p>{error}</p>
      </div>
    );
  }

  // No overlay URL
  if (!study?.webglOverlayUrl) {
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm border border-amber-200 dark:border-amber-800">
        <p className="font-semibold mb-1">WebGL overlay not available</p>
        <p>
          Please rerun the HUMAN_MTL pipeline so the overlay JSON is generated and uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
        🧠 <strong>Interactive 3D brain viewer (MVP)</strong> – MNI-aligned FreeSurfer template
        with electrode positions from the analysis.
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <strong>Controls:</strong> Left-click + drag to rotate • Scroll to zoom • Right-click +
          drag to pan • Hover over electrodes for info • Click to select
        </div>
        {electrodePoints.length > 0 && (
          <div className="mt-2 text-xs">
            <strong>Loaded:</strong> {electrodePoints.length} electrodes •{" "}
            {electrodePoints.filter((p) => p.isHotspot).length} hotspots
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brain Opacity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brain Opacity
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Glass</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={brainOpacity}
                onChange={(e) => setBrainOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Solid</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
              {(brainOpacity * 100).toFixed(0)}%
            </div>
          </div>

          {/* Show Electrodes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Electrodes</label>
            <button
              onClick={() => setShowElectrodes(!showElectrodes)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                showElectrodes
                  ? "bg-emerald-600 dark:bg-emerald-700 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {showElectrodes ? "Visible" : "Hidden"}
            </button>
          </div>

          {/* Hotspots Only */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Filter</label>
            <button
              onClick={() => setHotspotsOnly(!hotspotsOnly)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                hotspotsOnly
                  ? "bg-rose-600 dark:bg-rose-700 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
              disabled={!showElectrodes}
            >
              {hotspotsOnly ? "Hotspots Only" : "All Electrodes"}
            </button>
          </div>

          {/* Reset Camera */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Camera</label>
            <button
              onClick={handleResetCamera}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Reset to Fit
            </button>
          </div>
        </div>

        {/* Selected/Hovered Electrode Info */}
        {(selectedElectrode || hoveredElectrode) && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {selectedElectrode ? "Selected Electrode" : "Hover Info"}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-sm">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {(selectedElectrode || hoveredElectrode).label}
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                Activity:{" "}
                <span className="font-semibold">
                  {((selectedElectrode || hoveredElectrode).activity * 100).toFixed(1)}%
                </span>
                {(selectedElectrode || hoveredElectrode).isHotspot && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-semibold">
                    HOTSPOT
                  </span>
                )}
              </div>
              {selectedElectrode && (
                <button
                  onClick={() => setSelectedElectrode(null)}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3D Canvas - Keep dark background for 3D viewer in both themes */}
      <div className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={["#0f172a"]} />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, -5, -5]} intensity={0.4} />

          {/* 3D Content */}
          <Suspense fallback={<Html center>Loading brain mesh...</Html>}>
            <BrainMesh
              opacity={brainOpacity}
              onBrainLoaded={handleBrainLoaded}
              brainGroupRef={brainGroupRef}
            />
            {visibleElectrodes.length > 0 && brainBounds && (
              <ElectrodePoints
                points={visibleElectrodes}
                onHover={handleHover}
                onClick={handleClick}
                selectedLabel={selectedElectrode?.label}
                brainScale={brainScale}
              />
            )}
          </Suspense>

          {/* Camera Controls with damping for smooth interaction */}
          <OrbitControls
            ref={controlsRef}
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.7}
            zoomSpeed={0.8}
            panSpeed={0.8}
            minDistance={minDistance}
            maxDistance={maxDistance}
          />

          {/* Camera Controller */}
          <CameraController
            controlsRef={controlsRef}
            brainBounds={brainBounds}
            autoFitTrigger={autoFitTrigger}
          />
        </Canvas>
      </div>
    </div>
  );
};

BrainWebGLViewer.propTypes = {
  uploadId: PropTypes.string.isRequired,
  study: PropTypes.shape({
    webglOverlayUrl: PropTypes.string,
  }).isRequired,
};

export default BrainWebGLViewer;
