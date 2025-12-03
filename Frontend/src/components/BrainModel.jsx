/**
 * BrainModel.jsx
 *
 * Loads and renders a 3D brain model (GLB) with animated seizure hotspots.
 *
 * SETUP INSTRUCTIONS:
 * 1. Place your brain GLB model at: Frontend/public/models/brain_epicarehub.glb
 * 2. If the GLB contains named hotspot meshes (e.g., "Hotspot_1", "Hotspot_2"), update the
 *    hotspotNames array below to match those exact names.
 * 3. If your GLB has a different naming convention, adjust the mesh traversal logic
 *    in the loadBrainModel function.
 * 4. The component gracefully falls back to a simple sphere if the model is missing.
 *
 * CURRENT ASSUMPTIONS:
 * - Main brain mesh is the first or largest mesh in the GLB
 * - Hotspot meshes are either named with "Hotspot" in their name, or the first 2-3
 *   non-brain child meshes are hotspots
 * - All meshes use standard materials (no custom shaders)
 */

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Hotspot configuration
const HOTSPOT_NAMES = [
  "Hotspot_1",      // UPDATE: Match your GLB's hotspot mesh names
  "Hotspot_2",
  "Hotspot_3",
];

const HOTSPOT_COLORS = [
  "#f97316",        // orange
  "#ef4444",        // red
  "#fbbf24",        // yellow
];

const HOTSPOT_EMISSIVES = [
  "#c2410c",        // darker orange
  "#b91c1c",        // darker red
  "#ca8a04",        // darker yellow
];

/**
 * Attempt to load the brain model. If it fails, return null.
 * This prevents the whole component from crashing.
 */
function loadBrainModel() {
  try {
    return useGLTF("/models/brain_epicarehub.glb");
  } catch (error) {
    console.warn("Failed to load brain model:", error);
    return null;
  }
}

export function BrainModel() {
  const groupRef = useRef();
  const hotspotRefs = useRef([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [hotspotMeshes, setHotspotMeshes] = useState([]);
  const [brainMesh, setBrainMesh] = useState(null);

  // Try to load the GLB model
  let gltf = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    gltf = useGLTF("/models/brain_epicarehub.glb");
  } catch (error) {
    // Model not found or failed to load; we'll render a fallback
    console.warn("Brain model not loaded. Showing placeholder.", error);
  }

  // Extract brain mesh and hotspots from the loaded model
  useEffect(() => {
    if (!gltf || !gltf.scene) {
      setModelLoaded(false);
      return;
    }

    try {
      const hotspots = [];
      let mainBrain = null;

      // Traverse the scene to find brain mesh and hotspots
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Look for hotspots by name
          if (HOTSPOT_NAMES.some((name) => child.name.includes(name))) {
            hotspots.push(child);
          }
          // If no named hotspots found, check if this looks like the main brain
          // (larger mesh or specific naming convention)
          else if (
            child.name.toLowerCase().includes("brain") ||
            child.name.toLowerCase().includes("cortex") ||
            (!mainBrain && child.geometry.attributes.position.count > 1000)
          ) {
            if (!mainBrain) {
              mainBrain = child;
            }
          }
        }
      });

      if (mainBrain) {
        setBrainMesh(mainBrain);
      }

      // If we found hotspots, use them; otherwise create synthetic ones
      if (hotspots.length > 0) {
        setHotspotMeshes(hotspots);
      } else {
        // Fallback: create invisible hotspot positions to track
        // (the actual rendering will use simple spheres)
        setHotspotMeshes([
          { name: "Hotspot_1", position: new THREE.Vector3(0.7, 0.35, 0.5) },
          { name: "Hotspot_2", position: new THREE.Vector3(-0.6, 0.6, -0.3) },
          { name: "Hotspot_3", position: new THREE.Vector3(-0.3, -0.5, 0.6) },
        ]);
      }

      setModelLoaded(true);
    } catch (error) {
      console.warn("Error processing brain model:", error);
      setModelLoaded(false);
    }
  }, [gltf]);

  // Apply materials to brain mesh
  useEffect(() => {
    if (!brainMesh) return;

    const brainMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#a855f7"),    // purple
      roughness: 0.5,
      metalness: 0.15,
      emissive: new THREE.Color("#7c3aed"),
      emissiveIntensity: 0.08,
    });

    brainMesh.material = brainMaterial;
  }, [brainMesh]);

  // Apply materials to hotspot meshes
  useEffect(() => {
    hotspotRefs.current = hotspotMeshes.map((hotspot, idx) => {
      if (hotspot.isMesh && hotspot.material) {
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(HOTSPOT_COLORS[idx % HOTSPOT_COLORS.length]),
          emissive: new THREE.Color(
            HOTSPOT_EMISSIVES[idx % HOTSPOT_EMISSIVES.length]
          ),
          emissiveIntensity: 0.7,
          roughness: 0.35,
          metalness: 0.2,
        });

        hotspot.material = material;
        return { mesh: hotspot, material, originalScale: hotspot.scale.clone() };
      }
      return null;
    });
  }, [hotspotMeshes]);

  // Animation loop: rotate brain and pulse hotspots
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Slow, meditative rotation
    const elapsed = clock.getElapsedTime();
    groupRef.current.rotation.y = elapsed * 0.15;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.1;

    // Animate hotspots
    hotspotRefs.current.forEach((hotspot, idx) => {
      if (!hotspot) return;

      const { mesh, material, originalScale } = hotspot;

      // Pulsing effect with phase offset
      const phase = elapsed * 2.5 + (idx * Math.PI) / 1.5;
      const pulse = (Math.sin(phase) + 1) / 2; // 0 to 1

      // Animate emissive intensity
      material.emissiveIntensity = 0.4 + pulse * 0.8;

      // Animate scale with breathing effect
      const scale = 0.95 + pulse * 0.15;
      mesh.scale.copy(originalScale).multiplyScalar(scale);
    });
  });

  // If model didn't load, show a fallback sphere
  if (!modelLoaded || !gltf || !gltf.scene) {
    return (
      <group ref={groupRef}>
        {/* Fallback: simple brain-like sphere */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#a855f7"
            roughness={0.5}
            metalness={0.15}
            emissive="#7c3aed"
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* Fallback hotspots */}
        {[
          { pos: [0.7, 0.35, 0.5], color: "#f97316" },
          { pos: [-0.6, 0.6, -0.3], color: "#ef4444" },
          { pos: [-0.3, -0.5, 0.6], color: "#fbbf24" },
        ].map((hotspot, idx) => (
          <mesh key={idx} position={hotspot.pos}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial
              color={hotspot.color}
              emissive={hotspot.color}
              emissiveIntensity={0.7}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // Render the loaded model
  return (
    <group ref={groupRef}>
      {/* Main brain model from GLB */}
      <primitive object={gltf.scene.clone()} />

      {/* If GLB hotspots weren't found, render synthetic ones at common positions */}
      {hotspotMeshes.length === 0 && (
        <>
          {[
            { pos: [0.7, 0.35, 0.5], color: "#f97316", idx: 0 },
            { pos: [-0.6, 0.6, -0.3], color: "#ef4444", idx: 1 },
            { pos: [-0.3, -0.5, 0.6], color: "#fbbf24", idx: 2 },
          ].map((hotspot) => (
            <mesh
              key={hotspot.idx}
              position={hotspot.pos}
              ref={(mesh) => {
                if (mesh && !hotspotRefs.current[hotspot.idx]) {
                  const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(hotspot.color),
                    emissive: new THREE.Color(hotspot.color),
                    emissiveIntensity: 0.7,
                    roughness: 0.35,
                    metalness: 0.2,
                  });
                  mesh.material = material;
                  hotspotRefs.current[hotspot.idx] = {
                    mesh,
                    material,
                    originalScale: mesh.scale.clone(),
                  };
                }
              }}
            >
              <sphereGeometry args={[0.15, 32, 32]} />
              <meshStandardMaterial
                color={hotspot.color}
                emissive={hotspot.color}
                emissiveIntensity={0.7}
                roughness={0.35}
                metalness={0.2}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

export default BrainModel;
