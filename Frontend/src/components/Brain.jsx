import React, { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Plane } from "@react-three/drei";
import * as THREE from "three";
import Loader from "./Loader";
import { Typography } from "@mui/material";

const BrainModel = () => {
  const texture = useLoader(THREE.TextureLoader, "/obj/blender/Brain.png");
  const brain = useGLTF("/obj/blender/Brain2.gltf");
  console.log(brain);
  if (brain.materials) {
    Object.keys(brain.materials).forEach((material) => {
      brain.materials[material].color = new THREE.Color(0x00ffff);
    });
  }
  const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue material
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red material

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
          break;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <mesh>
      <directionalLight intensity={1} position={[0, 1, 0]} castShadow />
      <directionalLight intensity={1} position={[0, -1, 0]} castShadow />
      <directionalLight intensity={1} position={[1, 0, 0]} />
      <directionalLight intensity={1} position={[-1, 0, 0]} />
      <directionalLight intensity={1} position={[0, 0, 1]} />
      <directionalLight intensity={1} position={[0, 0, -1]} />

      {/* <directionalLight position={[1, 1, 1]} />
      <directionalLight position={[-1, -1, -1]} /> */}

      <primitive object={brain.scene} scale={15} position={[0, 0, 0]} />
      {/* <meshPhongMaterial color={new THREE.Color(0xff0000)} /> */}
      {/* <Plane receiveShadow rotation={[-Math.PI / 2, 0, 0]} args={[100, 100]} /> */}
    </mesh>
  );
};

const Brain = () => {
  return (
    <div style={{ width: "100%", height: "90vh" }}>
      <Typography variant="h2">Brain Visualizer</Typography>
      <Canvas
        frameloop="demand"
        shadows
        camera={{ position: [10, 10, 10], fov: 30 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<Loader />}>
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
            autoRotate
            autoRotateSpeed={1}
          />
          <BrainModel />
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
};

export default Brain;
