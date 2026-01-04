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
 * COORDINATE SYSTEM DOCUMENTATION:
 * ================================
 * MNI RAS (Input from Python):
 *   - X: Right (+) / Left (-)
 *   - Y: Anterior (+) / Posterior (-)
 *   - Z: Superior (+) / Inferior (-)
 *   - Units: millimeters (mm)
 *
 * Three.js Scene (Rendered):
 *   - X: Right (+) / Left (-)
 *   - Y: Up (+) / Down (-)
 *   - Z: Backward (+) / Forward (-)
 *   - Units: arbitrary (scaled)
 *
 * Transform (mniMmToScene):
 *   scale = 0.01 (1mm = 0.01 scene units)
 *   X_scene = X_mni * scale   (Right stays Right)
 *   Y_scene = Z_mni * scale   (Superior becomes Up)
 *   Z_scene = -Y_mni * scale  (Anterior becomes Backward)
 *
 * Brain Mesh Transform (applied in BrainMesh component):
 *   - Scale: 0.01 (same as electrodes)
 *   - Rotation X: -π/2 (align MNI Z to Three.js Y)
 *   - Rotation Z: π (flip front/back)
 *
 * Features:
 *   - Static Views (MNE snapshots)
 *   - Interactive 3D viewer
 *   - Depth electrode shaft rendering
 *   - Activity-based color mapping
 *   - Hotspot highlighting
 *   - Debug mode with axes and bounding boxes
 */

// ============================================================================
// COORDINATE TRANSFORMATION HELPER
// ============================================================================

/**
 * Convert MNI RAS coordinates (mm) to Three.js scene coordinates.
 *
 * This is the single source of truth for coordinate transformation.
 * All electrode positions MUST use this function.
 *
 * @param {[number, number, number]} mni_mm - MNI coordinates [x, y, z] in mm
 * @param {number} scale - Scale factor (default: 0.01 to match brain mesh)
 * @returns {[number, number, number]} - Three.js scene coordinates [X, Y, Z]
 *
 * @example
 * // Electrode at right hippocampus: [20.5, -25.3, -15.8] mm (MNI)
 * const scenePos = mniMmToScene([20.5, -25.3, -15.8]);
 * // Returns: [0.205, -0.158, 0.253]
 *
 * Sanity check:
 *   - MNI coords typically range: X ∈ [-100, 100], Y ∈ [-100, 100], Z ∈ [-50, 100]
 *   - Scene coords should range: X ∈ [-1, 1], Y ∈ [-0.5, 1], Z ∈ [-1, 1]
 *   - Brain mesh bounds should overlap with electrode bounds
 */
function mniMmToScene([x, y, z], scale = 0.01) {
  return [
    x * scale,   // X: Right stays Right
    z * scale,   // Y: Superior → Up
    -y * scale   // Z: Anterior → Backward (note the minus sign!)
  ];
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

/**
 * Map activity value (0-1) to color gradient.
 * Blue (0.0) → Cyan (0.25) → Green (0.5) → Yellow (0.75) → Red (1.0)
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
 * Brain Mesh Component - Loads and renders both hemispheres
 */
function BrainMesh({ opacity, onBrainLoaded, brainGroupRef }) {
  const lh = useLoader(OBJLoader, "/models/brain_lh.obj");
  const rh = useLoader(OBJLoader, "/models/brain_rh.obj");

  const brainGroup = useMemo(() => {

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

    // Transform to match MNI coordinates
    // Scale: 0.01 (1mm = 0.01 units, matching mniMmToScene)
    // Rotation: Align MNI axes to Three.js axes
    group.scale.set(0.01, 0.01, 0.01);
    group.rotation.x = -Math.PI / 2; // MNI Z → Three.js Y
    group.rotation.z = Math.PI;      // Flip front/back

    return group;
  }, [lh, rh, opacity]);

  // Store ref and compute bounding box
  useEffect(() => {
    if (brainGroupRef && brainGroup) {
      brainGroupRef.current = brainGroup;

      // Compute bounding box for camera auto-fit
      const box = new THREE.Box3().setFromObject(brainGroup);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const radius = size.length() / 2;

      if (import.meta.env.DEV) {
        console.log("[3D] Brain mesh ready - radius:", radius.toFixed(2));
      }

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
 * Electrode Points Component - Renders electrode spheres with depth shaft lines
 */
function ElectrodePoints({
  points,
  shaftConnections,
  onHover,
  onClick,
  selectedLabel,
  brainScale,
  brainBounds,
  showShafts
}) {
  const [hoveredLabel, setHoveredLabel] = useState(null);

  // Compute electrode sizes based on brain scale
  const baseRadius = brainScale * 0.015; // 1.5% of brain size
  const hotspotRadius = brainScale * 0.025; // 2.5% for hotspots
  const maxRadius = brainScale * 0.04; // Max 4%

  // Memoize handlers
  const handlePointerOver = useCallback((e, pt) => {
    e.stopPropagation();
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

  // Check if electrode is outside brain bounds (for depth electrodes)
  const isOutsideBrain = useCallback((position) => {
    if (!brainBounds) return false;
    const box = brainBounds.box;
    const point = new THREE.Vector3(...position);
    return !box.containsPoint(point);
  }, [brainBounds]);

  return (
    <group>
      {/* Electrode Spheres */}
      {points.map((pt) => {
        const isSelected = pt.label === selectedLabel;
        const isHovered = pt.label === hoveredLabel;
        const isOutside = isOutsideBrain(pt.position);

        // Compute radius
        let radius = pt.isHotspot ? hotspotRadius : baseRadius;
        if (isSelected) radius *= 1.3;
        else if (isHovered) radius *= 1.2;
        radius = Math.min(radius, maxRadius);

        // Reduce opacity for electrodes far outside brain (depth contacts)
        const opacity = isOutside ? 0.7 : 1.0;

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
              transparent={isOutside}
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {/* Depth Electrode Shaft Lines */}
      {showShafts && shaftConnections.map(({ shaftId, contacts }) => {
        if (contacts.length < 2) return null; // Need at least 2 contacts to draw line

        const positions = contacts.map(c => c.position).flat();

        return (
          <line key={`shaft-${shaftId}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={contacts.length}
                array={new Float32Array(positions)}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#888888"
              opacity={0.4}
              transparent
              linewidth={2}
            />
          </line>
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
  shaftConnections: PropTypes.arrayOf(
    PropTypes.shape({
      shaftId: PropTypes.string,
      contacts: PropTypes.array
    })
  ).isRequired,
  onHover: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  selectedLabel: PropTypes.string,
  brainScale: PropTypes.number.isRequired,
  brainBounds: PropTypes.object,
  showShafts: PropTypes.bool.isRequired
};

/**
 * Camera Controller - Handles auto-fit and reset with optimized distance
 */
function CameraController({ controlsRef, brainBounds, autoFitTrigger }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!brainBounds || !controlsRef.current) {
      return;
    }

    const { center, radius } = brainBounds;

    // Optimized distance for better initial view (closer than before)
    const distance = radius * 1.8;
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);

    // Update controls target
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    // Only log on initial mount or explicit reset
    if ((autoFitTrigger === 0 || autoFitTrigger > 0) && import.meta.env.DEV) {
      console.log("[3D] Camera fitted - distance:", distance.toFixed(2));
    }
  }, [brainBounds, camera, controlsRef, autoFitTrigger]);

  return null;
}

CameraController.propTypes = {
  controlsRef: PropTypes.object.isRequired,
  brainBounds: PropTypes.object,
  autoFitTrigger: PropTypes.number.isRequired,
};

/**
 * Debug Helpers - Axes and bounding boxes
 */
function DebugHelpers({ brainBounds, electrodeBounds }) {
  return (
    <group>
      {/* Axes Helper */}
      <axesHelper args={[0.5]} />

      {/* Brain Bounding Box */}
      {brainBounds && (
        <box3Helper args={[brainBounds.box, 0x00ff00]} />
      )}

      {/* Electrode Bounding Box */}
      {electrodeBounds && (
        <box3Helper args={[electrodeBounds, 0xff0000]} />
      )}
    </group>
  );
}

DebugHelpers.propTypes = {
  brainBounds: PropTypes.object,
  electrodeBounds: PropTypes.object,
};

// ============================================================================
// DEFAULT VIEWER STATE - Single source of truth for reset behavior
// ============================================================================

const DEFAULT_VIEWER_STATE = {
  brainOpacity: 0.85,
  showElectrodes: true,
  showShafts: true,
  hotspotsOnly: false,
  debugMode: false,
  selectedElectrode: null,
  // Camera will be set dynamically based on brain bounds
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BrainWebGLViewer = ({ uploadId, study }) => {
  // Data state
  const [electrodePoints, setElectrodePoints] = useState([]);
  const [shaftConnections, setShaftConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Brain geometry state
  const [brainBounds, setBrainBounds] = useState(null);
  const [electrodeBounds, setElectrodeBounds] = useState(null);
  const brainGroupRef = useRef();

  // UI state - initialized from DEFAULT_VIEWER_STATE
  const [brainOpacity, setBrainOpacity] = useState(DEFAULT_VIEWER_STATE.brainOpacity);
  const [showElectrodes, setShowElectrodes] = useState(DEFAULT_VIEWER_STATE.showElectrodes);
  const [showShafts, setShowShafts] = useState(DEFAULT_VIEWER_STATE.showShafts);
  const [hotspotsOnly, setHotspotsOnly] = useState(DEFAULT_VIEWER_STATE.hotspotsOnly);
  const [debugMode, setDebugMode] = useState(DEFAULT_VIEWER_STATE.debugMode);
  const [hoveredElectrode, setHoveredElectrode] = useState(DEFAULT_VIEWER_STATE.selectedElectrode);
  const [selectedElectrode, setSelectedElectrode] = useState(DEFAULT_VIEWER_STATE.selectedElectrode);
  const [autoFitTrigger, setAutoFitTrigger] = useState(0);

  // Refs
  const controlsRef = useRef();

  // Mount log only
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[3D] Brain viewer mounted - uploadId:", uploadId);
    }
  }, [uploadId]);

  // Callback when brain mesh is loaded
  const handleBrainLoaded = useCallback((bounds) => {
    setBrainBounds(bounds);
    setAutoFitTrigger((prev) => prev + 1);
  }, []);

  // Memoized hover handler
  const handleHover = useCallback((electrode) => {
    setHoveredElectrode(electrode);
  }, []);

  // Memoized click handler
  const handleClick = useCallback((electrode) => {
    setSelectedElectrode(electrode);
  }, []);

  // Handle complete reset - camera AND all UI controls
  const handleResetCamera = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("[3D] Resetting viewer to default state");
    }

    // Reset all UI controls to default state
    setBrainOpacity(DEFAULT_VIEWER_STATE.brainOpacity);
    setShowElectrodes(DEFAULT_VIEWER_STATE.showElectrodes);
    setShowShafts(DEFAULT_VIEWER_STATE.showShafts);
    setHotspotsOnly(DEFAULT_VIEWER_STATE.hotspotsOnly);
    setDebugMode(DEFAULT_VIEWER_STATE.debugMode);
    setSelectedElectrode(DEFAULT_VIEWER_STATE.selectedElectrode);
    setHoveredElectrode(null);

    // Trigger camera reset
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
        const response = await fetch(overlayUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch overlay: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (import.meta.env.DEV) {
          console.log("[3D] Overlay loaded:", data.electrodes?.length || 0, "electrodes");
        }

        // Parse electrodes with new schema
        const electrodes = data.electrodes || [];
        const hotspotLabels = new Set(data.hotspots || []);

        // Build electrode points with unified coordinate transform
        const points = electrodes.map((electrode) => {
          // Support both new schema (coord_mni_mm) and legacy (coord, x/y/z)
          const mni_mm = electrode.coord_mni_mm ||
                         electrode.coord ||
                         [electrode.x || 0, electrode.y || 0, electrode.z || 0];

          // UNIFIED TRANSFORM: Use mniMmToScene helper
          const position = mniMmToScene(mni_mm);

          // Support both new (activity, isHotspot) and legacy (value, hotspot)
          const activity = electrode.activity ?? electrode.value ?? 0;
          const isHotspot = electrode.isHotspot ??
                           ((electrode.hotspot === true) || hotspotLabels.has(electrode.label));

          return {
            label: electrode.label || `E${electrodes.indexOf(electrode)}`,
            position,
            activity,
            isHotspot,
            type: electrode.type || "unknown",
            shaftId: electrode.shaftId || electrode.label,
            contactIndex: electrode.contactIndex ?? 0
          };
        });

        // Group electrodes by shaft for line rendering
        const shafts = {};
        points.forEach(pt => {
          if (pt.type === "depth") {
            if (!shafts[pt.shaftId]) {
              shafts[pt.shaftId] = [];
            }
            shafts[pt.shaftId].push(pt);
          }
        });

        // Sort contacts within each shaft by contactIndex
        const shaftConnectionsArray = Object.entries(shafts).map(([shaftId, contacts]) => ({
          shaftId,
          contacts: contacts.sort((a, b) => a.contactIndex - b.contactIndex)
        }));

        setElectrodePoints(points);
        setShaftConnections(shaftConnectionsArray);

        // Compute electrode bounding box for debug mode
        if (points.length > 0) {
          const elecBox = new THREE.Box3();
          points.forEach(pt => {
            elecBox.expandByPoint(new THREE.Vector3(...pt.position));
          });
          setElectrodeBounds(elecBox);
        }

        const hotspotCount = points.filter((p) => p.isHotspot).length;

        if (import.meta.env.DEV) {
          console.log(`[3D] Loaded ${points.length} electrodes (${hotspotCount} hotspots, ${shaftConnectionsArray.length} shafts)`);
        }

        setLoading(false);
      } catch (err) {
        console.error("3D Viewer error:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOverlay();
  }, [study?.webglOverlayUrl]);

  // Filter electrodes based on UI settings
  const visibleElectrodes = useMemo(() => {
    if (!showElectrodes) return [];
    if (hotspotsOnly) return electrodePoints.filter((p) => p.isHotspot);
    return electrodePoints;
  }, [electrodePoints, showElectrodes, hotspotsOnly]);

  // Compute brain scale for electrode sizing
  const brainScale = brainBounds?.radius ?? 1.0;

  // Compute min/max camera distances
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
          Please run the HUMAN_MTL pipeline to generate the overlay JSON.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
        🧠 <strong>Interactive 3D Brain Viewer</strong> – MNI-aligned FreeSurfer template with depth electrodes
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <strong>Controls:</strong> Left-drag to rotate • Scroll to zoom • Right-drag to pan • Hover/click electrodes for info
        </div>
        {electrodePoints.length > 0 && (
          <div className="mt-2 text-xs">
            <strong>Loaded:</strong> {electrodePoints.length} electrodes •{" "}
            {shaftConnections.length} shafts •{" "}
            {electrodePoints.filter((p) => p.isHotspot).length} hotspots
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Show Shafts */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shaft Lines</label>
            <button
              onClick={() => setShowShafts(!showShafts)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                showShafts
                  ? "bg-emerald-600 dark:bg-emerald-700 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
              disabled={!showElectrodes}
              title={showShafts ? "Hide depth electrode shaft connections" : "Show depth electrode shaft connections"}
            >
              {showShafts ? "Visible" : "Hidden"}
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

        {/* Debug Mode Toggle */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-700 dark:text-slate-300">
              Debug Mode (show axes & bounding boxes)
            </span>
          </label>
        </div>

        {/* Selected/Hovered Electrode Info */}
        {(selectedElectrode || hoveredElectrode) && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {selectedElectrode ? "Selected Electrode" : "Hover Info"}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-sm">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {(selectedElectrode || hoveredElectrode).label}
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                <div>
                  Activity:{" "}
                  <span className="font-semibold">
                    {((selectedElectrode || hoveredElectrode).activity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-1">
                  Type: {(selectedElectrode || hoveredElectrode).type} •{" "}
                  Shaft: {(selectedElectrode || hoveredElectrode).shaftId}
                </div>
                {(selectedElectrode || hoveredElectrode).isHotspot && (
                  <span className="mt-2 inline-block px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-semibold">
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

      {/* 3D Canvas */}
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
                shaftConnections={shaftConnections}
                onHover={handleHover}
                onClick={handleClick}
                selectedLabel={selectedElectrode?.label}
                brainScale={brainScale}
                brainBounds={brainBounds}
                showShafts={showShafts}
              />
            )}

            {/* Debug Helpers */}
            {debugMode && (
              <DebugHelpers
                brainBounds={brainBounds}
                electrodeBounds={electrodeBounds}
              />
            )}
          </Suspense>

          {/* Camera Controls - Optimized for smooth interaction */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={true}
            dampingFactor={0.08}
            rotateSpeed={0.6}
            zoomSpeed={0.7}
            panSpeed={0.6}
            minDistance={minDistance}
            maxDistance={maxDistance}
            makeDefault
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
