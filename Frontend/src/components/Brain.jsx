/* eslint-disable react/no-unknown-property */
import React, { Suspense, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Plane } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import Loader from "./Loader";

const BrainModel = ({ onClick }) => {
  const texture = useLoader(THREE.TextureLoader, "/obj/blender/Brain.png");
  const brain = useGLTF("/obj/blender/Brain2.gltf");
  const [hovered, setHovered] = useState(false);
  const handleClick = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    if (event.intersections.length > 0) {
      const intersect = event.intersections[0];
      const { point } = intersect;
      const popup = document.createElement("div");
      popup.textContent = event.object.name + " clicked!";
      popup.style.position = "absolute";
      popup.style.top = `${event.y}px`;
      popup.style.left = `${event.x}px`;
      popup.style.background = "white";
      popup.style.padding = "10px";
      popup.style.border = "1px solid black";
      popup.style.zIndex = "1000";
      document.body.appendChild(popup);

      setTimeout(() => {
        document.body.removeChild(popup);
      }, 2000);
      onClick(point);
    }
  };
  const createCustomMaterial = (texture) => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
      fragmentShader: `
            varying vec2 vUv;

            void main() {
                // Simulate heatmap texture

                // Determine the vertical position (normalized)
                float t = clamp(vUv.y, 0.0, 1.0); // Clamp vUv.y to the range [0, 1]

                vec3 color;
                if (t < 0.2) {
                  // color = oxf2aeb1;
                } else if (t < 0.4) {
                  // Yellow to Orange
                  color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.2) * 5.0);
                } else if (t < 0.6) {
                  // Orange to Red
                  color = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.4) * 5.0);
                } else if (t < 0.8) {
                  // Red to Dark Red
                  color = mix(vec3(1.0, 0.0, 0.0), vec3(0.5, 0.0, 0.0), (t - 0.6) * 5.0);
                } else if (t < 0.9) {
                  // Green to Yellow
                  color = mix(vec3(0.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), t * 5.0);
                } else {
                  // Dark Red
                  color = vec3(0.5, 0.0, 0.0);
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });
  };

  const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

  brain.scene.traverse((child) => {
    if (child.isMesh) {
      switch (child.name) {
        case "Brain_Part_02":
          child.material.color = new THREE.Color(0x3f0a0c);
          break;
        case "Brain_Part_04":
          child.material.color = new THREE.Color(0xffffff);
          break;
        case "Brain_Part_05":
          child.material.color = new THREE.Color(0xffffb1);
          break;
        case "Brain_Part_06":
          child.material.color = new THREE.Color(0xf2aeb1);
          child.material = createCustomMaterial(texture);
          break;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <mesh onClick={handleClick}>
      <directionalLight intensity={1} position={[0, 1, 0]} castShadow />
      <directionalLight intensity={1} position={[0, -1, 0]} castShadow />
      <directionalLight intensity={1} position={[1, 0, 0]} />
      <directionalLight intensity={1} position={[-1, 0, 0]} />
      <directionalLight intensity={1} position={[0, 0, 1]} />
      <directionalLight intensity={1} position={[0, 0, -1]} />

      <primitive object={brain.scene} scale={15} position={[1, -3, 0]} />
    </mesh>
  );
};

const Brain = () => {
  const handleClick = (event) => {
    // Handle click event on brain model
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            3D Brain Visualization Demo
          </h1>
          <p className="text-slate-600">
            Interactive 3D model showing brain localization capabilities
          </p>
        </motion.div>

        {/* Brain Canvas Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]"
        >
          <div className="mb-6 pb-4 border-b border-emerald-50">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              Interactive Brain Model
            </h2>
            <p className="text-sm text-slate-600">
              Click and drag to rotate • Scroll to zoom • Click on brain regions to interact
            </p>
          </div>

          <div
            className="brain-canvas rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50"
            style={{ height: '600px' }}
          >
            <Canvas
              frameloop="demand"
              shadows
              camera={{ position: [10, 10, 10], fov: 30 }}
              gl={{ preserveDrawingBuffer: true }}
            >
              <Suspense fallback={<Loader />}>
                <OrbitControls
                  enableZoom={true}
                  maxPolarAngle={Math.PI / 2}
                  minPolarAngle={Math.PI / 2}
                />
                <BrainModel onClick={handleClick} />
              </Suspense>
              <Preload all />
            </Canvas>
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-4 border-t border-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Interaction
                </p>
                <p className="text-sm text-slate-900">Click & Drag to Rotate</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Zoom
                </p>
                <p className="text-sm text-slate-900">Scroll to Zoom In/Out</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Regions
                </p>
                <p className="text-sm text-slate-900">Click to Identify Areas</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            About This Visualization
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            This 3D brain model demonstrates the interactive visualization capabilities of EpiCareHub.
            In the full application, EEG data is processed to highlight seizure source locations across
            multiple anatomical views, enabling precise presurgical planning for epilepsy patients.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Brain;
