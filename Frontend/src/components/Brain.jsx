import React,{ useEffect, useRef } from 'react'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const Brain = () => {
  const containerRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const objectRef = useRef(null);

    useEffect(() => {
        init();
        animate();

        return () => {
            // Cleanup if necessary
        };
    }, []);

    const init = () => {
        const container = containerRef.current;
        const camera = new THREE.PerspectiveCamera(45, 500 / 500, 1, 2000);
        camera.position.z = -10;
        cameraRef.current = camera;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const ambientLight = new THREE.AmbientLight(0x880808, 0.9);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        camera.add(pointLight);
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(500, 500);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 10;
        controls.maxDistance = 80;
        controls.rotateSpeed = 3.0;
        controls.maxPolarAngle = Math.PI / 2;
        controlsRef.current = controls;

        loadModel();
    };

    const loadModel = () => {
        const { current: scene } = sceneRef;
        const loader = new OBJLoader();
        loader.load(
            '/obj/brain.Obj',
            (object) => {
                scene.add(object);
                objectRef.current = object;
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
                console.error('An error happened', error);
            }
        );
    };

    const animate = () => {
        requestAnimationFrame(animate);
        const { current: controls } = controlsRef;
        if (controls) {
            controls.update();
        }
        renderScene();
    };

    const renderScene = () => {
        const { current: camera } = cameraRef;
        const { current: scene } = sceneRef;
        const { current: renderer } = rendererRef;
        if (camera && renderer) {
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        }
    };

    return <div ref={containerRef} style={{ width: '500px', height: '500px' }} />;
};

export default Brain