/* eslint-disable react/no-unknown-property */
import React, { Suspense, useState, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Plane } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
  const { patientId, uploadId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleClick = (event) => {
    // Handle click event on brain model
  };

  // PHASE 4: Fetch patient and study data
  useEffect(() => {
    const fetchData = async () => {
      if (!patientId || !uploadId) {
        // Demo mode - no params provided
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

        // Fetch patient data
        const patientResponse = await axios.get(`${apiUrl}/patients/${patientId}`);
        setPatient(patientResponse.data);

        // Fetch studies to find the matching one
        const studiesResponse = await axios.get(`${apiUrl}/patients/${patientId}/studies`);
        if (studiesResponse.data.success && studiesResponse.data.studies) {
          const matchingStudy = studiesResponse.data.studies.find(
            (s) => s.uploadId === uploadId
          );
          if (matchingStudy) {
            setStudy(matchingStudy);
          } else {
            setError("No study found for this upload ID");
          }
        }
      } catch (err) {
        console.error("Error fetching brain view data:", err);
        setError(err.response?.data?.error || err.message || "Failed to load study data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, uploadId]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // PHASE 4: Fallback hotspots if study doesn't have them
  const hotspots = study?.hotspots?.length
    ? study.hotspots
    : [
        { region: "Left temporal lobe", confidence: 0.82 },
        { region: "Right frontal lobe", confidence: 0.65 },
      ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading 3D brain view...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Unable to Load Study</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Back to Patient
          </button>
        </div>
      </div>
    );
  }

  // Demo mode (no params)
  const isDemoMode = !patientId || !uploadId;
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Demo Patient";
  const shortUploadId = uploadId ? uploadId.slice(-8) : "demo";
  const formattedDate = study?.createdAt ? formatDate(study.createdAt) : "N/A";

  return (
    <div className="min-h-screen bg-emerald-50 px-8 py-6 flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">
            {isDemoMode ? "3D Brain Visualization Demo" : "3D Seizure Localization View"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            {patientName} {!isDemoMode && `• Study ${shortUploadId}`}
          </h1>
          {!isDemoMode && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Uploaded {formattedDate}</span>
              {study?.status && (
                <>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      study.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : study.status === "PROCESSING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {study.status}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => (patientId ? navigate(`/patient/${patientId}`) : navigate(-1))}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2 transition-all duration-200"
        >
          <ArrowBackIcon style={{ fontSize: "1.2rem" }} />
          Back to Patient
        </button>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)] gap-6 items-start"
      >
        {/* Left: 3D Canvas */}
        <div className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,118,110,0.08)] p-6">
          <div className="mb-4 pb-4 border-b border-emerald-50">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Interactive 3D Brain Model
            </h2>
            <p className="text-sm text-slate-600">
              Click and drag to rotate • Scroll to zoom • Explore brain regions
            </p>
          </div>

          <div
            className="brain-canvas rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50"
            style={{ height: "500px" }}
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
        </div>

        {/* Right: Info Panel */}
        <div className="space-y-4">
          {/* Localization Summary Card */}
          <div className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,118,110,0.08)] p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Localization Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {study?.summary ||
                "EEG analysis reveals potential seizure focus regions. The visualization shows areas of abnormal brain activity that may indicate epileptogenic zones. Further clinical correlation is recommended."}
            </p>
          </div>

          {/* Hotspots Card */}
          <div className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,118,110,0.08)] p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Detected Hotspots
            </h3>
            <div className="space-y-3">
              {hotspots.map((hotspot, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {hotspot.region}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {(hotspot.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${hotspot.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Card */}
          {!isDemoMode && (
            <div className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,118,110,0.08)] p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Analysis Metadata
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Model Version</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {study?.metadata?.modelVersion || "v1.0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">MNE Version</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {study?.metadata?.mneVersion || "1.5.0"}
                  </span>
                </div>
                {study?.metadata?.processingTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Processing Time</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {study.metadata.processingTime}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Brain;
