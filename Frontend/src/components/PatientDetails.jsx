import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { useSelector } from "react-redux";
import { selectUpload } from "../features/patientSlice";
import { useDispatch } from "react-redux";
import { Carousel } from "primereact/carousel";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import noImage from "/image.png";
import PDFGenerator from "./PDFGenerator";
import EEGProcessingOverlay from "./EEGProcessingOverlay";
import BrainStudyViewer from "./BrainStudyViewer";
import React from "react";

const views = [
  "medial",
  "rostral",
  "caudal",
  "dorsal",
  "ventral",
  "frontal",
  "parietal",
  "axial",
  "sagittal",
  "coronal",
  "lateral",
];

const PatientDetails = () => {
  let { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [isEpilepsy, setIsEpilepsy] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [visible, setVisible] = useState(false);
  const [studies, setStudies] = useState([]);
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedStudyForViewer, setSelectedStudyForViewer] = useState(null);

  // Processing overlay state
  const [processingOverlay, setProcessingOverlay] = useState({
    open: false,
    currentStepId: null,
    status: "PROCESSING",
    uploadId: null,
    patientId: null,
    patientName: null,
    studyTitle: null,
    devMode: false,
  });

  // Refs for cleanup
  const pollingIntervalRef = React.useRef(null);
  const stepIntervalRef = React.useRef(null);

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.target.files = event.dataTransfer.files;
    handleFileChange(event);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const selectedUpload = useSelector((state) => state.patients.selectedUpload);
  const dispatch = useDispatch();

  const handleSubmit = useCallback(
    (patient) => {
      patient.id = patient._id;
      patient.isEpilepsy = isEpilepsy;
      patient.comments = comments;

      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      let submitConfig = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${apiUrl}/patients/`,
        headers: {
          "Content-Type": "application/json",
        },
        data: patient,
      };
      axios
        .request(submitConfig)
        .then((response) => {
          if (!response.data.success) {
            throw response.data.message || "Error";
          }
          setPatient(response.data.patientUpdated);
        })
        .catch(() => {})
        .finally(() => {});
    },
    [isEpilepsy, comments]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      setMessage("No file selected.");
      setVisible(true);
      return;
    }

    const devMode = import.meta.env.VITE_EPICARE_DEV_MODE === "true";
    const patientId = patient._id;
    const patientFullName = `${patient.firstName} ${patient.lastName}`;

    setProcessingOverlay({
      open: true,
      currentStepId: "upload",
      status: "PROCESSING",
      uploadId: null,
      patientId: patientId,
      patientName: patientFullName,
      studyTitle: "Baseline EEG",
      devMode: devMode,
    });

    setVisible(false);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      const studyResponse = await axios.post(
        `${apiUrl}/patients/${patientId}/studies`,
        {
          title: "Baseline EEG",
          status: "PROCESSING",
        }
      );

      const createdStudy = studyResponse.data.study;
      const uploadId = createdStudy.uploadId;

      setProcessingOverlay((prev) => ({
        ...prev,
        currentStepId: "preprocess",
        uploadId: uploadId,
      }));

      const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";
      const endpoint = devMode ? "/visualize_brain_dev" : "/visualize_brain";

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", patientId);
      formData.append("uploadId", uploadId);

      const stepSequence = ["localize", "visualize", "save", "summarize"];
      let stepIndex = 0;

      stepIntervalRef.current = setInterval(() => {
        if (stepIndex < stepSequence.length) {
          setProcessingOverlay((prev) => ({
            ...prev,
            currentStepId: stepSequence[stepIndex],
          }));
          stepIndex++;
        }
      }, devMode ? 500 : 3000);

      await axios.post(`${pythonApiUrl}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(stepIntervalRef.current);

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const studiesResponse = await axios.get(`${apiUrl}/patients/${patientId}/studies`);

          if (studiesResponse.data.success && studiesResponse.data.studies) {
            const matchingStudy = studiesResponse.data.studies.find(
              (s) => s.uploadId === uploadId
            );

            if (matchingStudy) {
              if (matchingStudy.status === "COMPLETED") {
                clearInterval(pollingIntervalRef.current);

                setProcessingOverlay((prev) => ({
                  ...prev,
                  status: "COMPLETED",
                }));

                setTimeout(async () => {
                  setProcessingOverlay({
                    open: false,
                    currentStepId: null,
                    status: "PROCESSING",
                    uploadId: null,
                    patientId: null,
                    patientName: null,
                    studyTitle: null,
                    devMode: false,
                  });

                  const patientResponse = await axios.get(`${apiUrl}/patients/${id}`);
                  setPatient(patientResponse.data);
                  const tempPatient = patientResponse.data;
                  setIsEpilepsy(tempPatient.isEpilepsy);
                  setComments(tempPatient.comments);

                  if (
                    !selectedUpload &&
                    tempPatient.eegVisuals &&
                    tempPatient.eegVisuals.length > 0
                  ) {
                    dispatch(
                      selectUpload(
                        tempPatient.eegVisuals[tempPatient.eegVisuals.length - 1]
                      )
                    );
                  }

                  const studiesResponse2 = await axios.get(`${apiUrl}/patients/${id}/studies`);
                  if (studiesResponse2.data.success && studiesResponse2.data.studies) {
                    setStudies(studiesResponse2.data.studies);
                  }

                  setSelectedFile(null);
                }, 2000);
              } else if (matchingStudy.status === "FAILED") {
                clearInterval(pollingIntervalRef.current);

                setProcessingOverlay((prev) => ({
                  ...prev,
                  status: "FAILED",
                }));
              }
            }
          }
        } catch (pollError) {
          // Polling error - will retry
        }
      }, devMode ? 2000 : 5000);
    } catch (error) {
      console.error("EEG upload failed:", error.message);

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      setProcessingOverlay((prev) => ({
        ...prev,
        status: "FAILED",
      }));

      setVisible(true);
    }
  };

  const viewTemplate = useCallback(
    (image) => {
      return (
        <div className="border border-emerald-100 dark:border-slate-700 rounded-2xl text-center">
          <div className="mb-3">
            <img
              className="w-full h-60 object-cover object-center rounded-t-2xl"
              src={image}
              onError={(e) => {
                e.target.src = noImage;
              }}
              alt="Brain visualization"
            />
          </div>
          <div className="pb-3">
            <Tag
              value={views.find((view) => image.includes(view))}
              severity="success"
            />
          </div>
        </div>
      );
    },
    []
  );

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${apiUrl}/patients/${id}`,
      headers: {},
    };
    axios
      .request(config)
      .then((response) => {
        setPatient(response.data);
        const tempPatient = response.data;
        setIsEpilepsy(tempPatient.isEpilepsy);
        setComments(tempPatient.comments);
        if (
          !selectedUpload &&
          tempPatient.eegVisuals &&
          tempPatient.eegVisuals.length > 0
        )
          dispatch(
            selectUpload(
              tempPatient.eegVisuals[tempPatient.eegVisuals.length - 1]
            )
          );
      })
      .catch(() => {});

    axios
      .get(`${apiUrl}/patients/${id}/studies`)
      .then((response) => {
        if (response.data.success && response.data.studies) {
          setStudies(response.data.studies);
          const latestCompletedStudy = response.data.studies.find(
            (s) => s.status === "COMPLETED" && (s.brainViews && Object.keys(s.brainViews).length > 0)
          );
          if (latestCompletedStudy && !selectedStudyForViewer) {
            setSelectedStudyForViewer(latestCompletedStudy);
          }
        }
      })
      .catch(() => {});
  }, [dispatch, id, selectedUpload, selectedStudyForViewer]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const getCurrentStudy = () => {
    const latestStudy = studies.find(
      (s) => s.status === "COMPLETED" || s.status === "PROCESSING"
    ) || studies[0];

    if (latestStudy) {
      return {
        study: latestStudy,
        upload: patient?.eegVisuals?.find(
          (v) => v.uploadId === latestStudy.uploadId
        ),
      };
    }

    if (selectedUpload) {
      return {
        study: null,
        upload: selectedUpload,
      };
    }

    return { study: null, upload: null };
  };

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

  const getStatusBadge = (status) => {
    if (!status) return null;

    const statusConfig = {
      COMPLETED: { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-300", label: "Completed" },
      PROCESSING: { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300", label: "Processing" },
      FAILED: { bg: "bg-rose-100 dark:bg-rose-900", text: "text-rose-700 dark:text-rose-300", label: "Failed" },
    };

    const config = statusConfig[status] || { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-400", label: status };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex items-center justify-center">
        <div className="rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-400 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading patient details...</p>
        </div>
      </div>
    );
  }

  const { study: currentStudy, upload: currentUpload } = getCurrentStudy();
  const currentUploadId = currentUpload?.uploadId;

  // Check if baseline EEG has data
  const hasBaselineData = currentUpload && currentUpload.images && currentUpload.images.length > 0;

  return (
    <>
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        {/* Left: Patient name + status */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold ${
                patient.isEpilepsy
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
              }`}
            >
              {patient.isEpilepsy ? "Epilepsy Diagnosed" : "No Epilepsy Diagnosis"}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Patient ID: {patient._id?.slice(-8)}
            </span>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap gap-3">
          <PDFGenerator patient={patient} currentReport={selectedUpload} study={selectedStudyForViewer} />
          <button
            onClick={() => setVisible(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-5 py-2 transition-all duration-200"
          >
            <FileUploadIcon style={{ fontSize: "1.2rem" }} />
            Upload EEG Data
          </button>
          <button
            onClick={() => {
              const brainSection = document.getElementById('brain-visualization-section');
              if (brainSection) {
                brainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            disabled={!selectedStudyForViewer}
            className={`inline-flex items-center gap-2 rounded-full font-semibold px-5 py-2 transition-all duration-200 ${
              selectedStudyForViewer
                ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <ViewInArIcon style={{ fontSize: "1.2rem" }} />
            View 3D Brain
          </button>
          <Link
            to="/patients"
            className="inline-flex items-center rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-5 py-2 transition-all duration-200"
          >
            ← Back
          </Link>
        </div>
      </motion.div>

      {/* 1. Brain Visualization Section - PRIMARY FOCUS */}
      {selectedStudyForViewer && (
        <motion.div
          id="brain-visualization-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Brain Visualization
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Study: {selectedStudyForViewer.title || "EEG Analysis"} • Uploaded {formatDate(selectedStudyForViewer.createdAt)}
            </p>
          </div>
          <BrainStudyViewer
            patient={patient}
            study={selectedStudyForViewer}
            onAnalysisComplete={() => {
              const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
              axios
                .get(`${apiUrl}/patients/${id}/studies`)
                .then((response) => {
                  if (response.data.success && response.data.studies) {
                    setStudies(response.data.studies);
                    const updatedStudy = response.data.studies.find(
                      (s) => s.uploadId === selectedStudyForViewer.uploadId
                    );
                    if (updatedStudy) {
                      setSelectedStudyForViewer(updatedStudy);
                    }
                  }
                })
                .catch(() => {});
            }}
          />
        </motion.div>
      )}

      {/* 2. Patient Snapshot - COMPACT */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: selectedStudyForViewer ? 0.2 : 0.1 }}
        className="rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-5"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Patient Snapshot</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demographics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Demographics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 dark:bg-slate-700 p-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Age</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">{patient.age}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-slate-700 p-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Gender</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">{patient.gender}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-slate-700 p-2 col-span-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Date of Birth</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{patient.dob}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-slate-700 p-2 col-span-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Email</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{patient.email}</p>
              </div>
            </div>

            {/* Diagnosis Status */}
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Diagnosis
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEpilepsy(true)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                    isEpilepsy
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Epilepsy
                </button>
                <button
                  onClick={() => setIsEpilepsy(false)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                    !isEpilepsy
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Non-epilepsy
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Clinical Notes
            </label>
            <textarea
              className="flex-1 rounded-lg border border-emerald-100 dark:border-slate-600 bg-emerald-50/40 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm resize-none outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder="Enter clinical observations, notes, or recommendations..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
            <button
              onClick={() => handleSubmit(patient)}
              className="mt-3 rounded-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2 transition-all duration-200 shadow-sm text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3. Baseline EEG - DE-EMPHASIZED WITH EMPTY STATE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: selectedStudyForViewer ? 0.25 : 0.15 }}
        className="rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-5"
      >
        <div className="mb-4 pb-3 border-b border-emerald-50 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Baseline EEG</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Image galleries and topographic maps for the latest baseline recording
          </p>
        </div>

        {!hasBaselineData ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No Baseline EEG Data Available
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
              Baseline EEG data is not available for this patient yet. This section will display image galleries and topographic maps when data is added.
            </p>
            <button
              onClick={() => setVisible(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-semibold px-4 py-2 text-sm transition-all duration-200"
            >
              <FileUploadIcon style={{ fontSize: "1rem" }} />
              Upload EEG Data
            </button>
          </div>
        ) : (
          /* Baseline EEG Data Present */
          <>
            {currentStudy?.status && (
              <div className="mb-3">
                {getStatusBadge(currentStudy.status)}
                {currentStudy?.createdAt && (
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    Uploaded {formatDate(currentStudy.createdAt)}
                  </span>
                )}
              </div>
            )}

            {/* Tabbed Content */}
            <div className="mb-3">
              <div className="inline-flex gap-1 p-1 bg-emerald-50 dark:bg-slate-700 rounded-lg">
                <button
                  onClick={() => setActiveTab("gallery")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeTab === "gallery"
                      ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Image Gallery
                </button>
                <button
                  onClick={() => setActiveTab("topomap")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeTab === "topomap"
                      ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Topomap
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeTab === "preview"
                      ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  3D Preview
                </button>
              </div>
            </div>

            {/* Tab Content - Compact */}
            <div className="min-h-[300px]">
              {activeTab === "gallery" && (
                <div>
                  <Carousel
                    value={currentUpload.images}
                    numVisible={2}
                    numScroll={1}
                    itemTemplate={viewTemplate}
                    className="patient-details-carousel"
                  />
                </div>
              )}

              {activeTab === "topomap" && (
                <div className="flex items-center justify-center p-6 border-2 border-dashed border-emerald-100 dark:border-slate-700 rounded-lg">
                  {currentStudy?.figureUrls?.topomap || currentUpload.figUrl ? (
                    <div className="text-center">
                      <img
                        src={currentStudy?.figureUrls?.topomap || currentUpload.figUrl}
                        alt="EEG Topomap"
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">EEG Topomap Visualization</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">📊</div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Topomap not available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "preview" && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-100 dark:border-slate-700 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ViewInArIcon className="text-emerald-600 dark:text-emerald-400" style={{ fontSize: "2rem" }} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Interactive 3D Brain View
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Explore brain localization in 3D
                    </p>
                    {currentUploadId ? (
                      <button
                        onClick={() => {
                          const brainSection = document.getElementById('brain-visualization-section');
                          if (brainSection) {
                            brainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2 text-sm transition-all duration-200"
                      >
                        <ViewInArIcon style={{ fontSize: "1.2rem" }} />
                        View 3D Brain
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500">3D view not available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* 4. Previous EEG Studies Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: selectedStudyForViewer ? 0.3 : 0.2 }}
        className="rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-6"
      >
        <div className="mb-6 pb-4 border-b border-emerald-50 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Previous EEG Studies
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View and explore all EEG analyses for this patient. Click to view brain visualization.
          </p>
        </div>

        <div className="space-y-3">
          {studies.length > 0 ? (
            studies.map((study, index) => {
              const upload = patient.eegVisuals?.find(
                (v) => v.uploadId === study.uploadId
              );
              const isSelected = selectedStudyForViewer?.uploadId === study.uploadId;
              const hasVisualization = study.brainViews && Object.keys(study.brainViews).length > 0;

              return (
                <div
                  key={study.uploadId || study._id}
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm"
                      : "border-emerald-50 dark:border-slate-700 bg-white/80 dark:bg-slate-700/50 hover:bg-emerald-50/30 dark:hover:bg-slate-600/50"
                  }`}
                  onClick={() => {
                    if (hasVisualization) {
                      setSelectedStudyForViewer(study);
                      setTimeout(() => {
                        const brainSection = document.getElementById('brain-visualization-section');
                        if (brainSection) {
                          brainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {study.title || `Study #${index + 1}`}
                      </p>
                      {getStatusBadge(study.status)}
                      {hasVisualization && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-700">
                          <span>📍</span>
                          3D Visualization ({Object.keys(study.brainViews).length} views)
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white">
                          <span>👁</span>
                          Viewing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Uploaded {formatDate(upload?.uploadDate || study.createdAt)}
                      {study.metadata?.processingTime && (
                        <> • Processed in {study.metadata.processingTime}s</>
                      )}
                    </p>
                    {!hasVisualization && study.status === "COMPLETED" && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        No 3D visualization available for this study
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {upload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(selectUpload(upload));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="rounded-full border-2 border-emerald-200 dark:border-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-4 py-2 text-sm transition-all duration-200"
                      >
                        View Images
                      </button>
                    )}
                    {hasVisualization && !isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudyForViewer(study);
                          setTimeout(() => {
                            const brainSection = document.getElementById('brain-visualization-section');
                            if (brainSection) {
                              brainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                        className="rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2 text-sm transition-all duration-200"
                      >
                        View 3D Brain
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : patient.eegVisuals && patient.eegVisuals.length > 1 ? (
            patient.eegVisuals
              .filter((v) => v.uploadId !== currentUploadId)
              .map((visual, index) => (
                <div
                  key={visual.uploadId}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-emerald-50 dark:border-slate-700 rounded-xl p-4 bg-white/80 dark:bg-slate-700/50 hover:bg-emerald-50/30 dark:hover:bg-slate-600/50 transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        Legacy Upload #{index + 1}
                      </p>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        Legacy
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Uploaded {formatDate(visual.uploadDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        dispatch(selectUpload(visual));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-full border-2 border-emerald-200 dark:border-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-4 py-2 text-sm transition-all duration-200"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">No previous EEG studies yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload additional EEG files to build a study history
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>

      {/* EEG Upload Dialog */}
      <Dialog
        header="Upload EEG Data"
        visible={visible}
        onHide={() => {
          setVisible(false);
          setSelectedFile(null);
        }}
        className="w-full md:w-2/3 lg:w-1/2"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Upload a FIF EEG file to generate a 3D localization visualization for this patient.
          </p>

          <div
            className="rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-600 bg-emerald-50 dark:bg-slate-800 p-8 text-center cursor-pointer hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <FileUploadIcon className="mx-auto mb-3 text-emerald-600 dark:text-emerald-400" style={{ fontSize: "2rem" }} />
            <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">
              Drag & drop your .fif file here, or click to browse
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Only .fif files are supported
            </p>
            <input
              id="fileInput"
              type="file"
              accept=".fif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-sm underline"
            >
              Browse files
            </button>
          </div>

          {selectedFile && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-600 bg-emerald-50 dark:bg-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUploadIcon className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={handleFileSubmit}
            disabled={!selectedFile}
            className="w-full rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Start Analysis
          </button>
        </div>
      </Dialog>

      {/* Processing Overlay */}
      <EEGProcessingOverlay
        open={processingOverlay.open}
        currentStepId={processingOverlay.currentStepId}
        status={processingOverlay.status}
        patientName={processingOverlay.patientName}
        studyTitle={processingOverlay.studyTitle}
        devMode={processingOverlay.devMode}
        onCancel={() => {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
          setProcessingOverlay({
            open: false,
            currentStepId: null,
            status: "PROCESSING",
            uploadId: null,
            patientId: null,
            patientName: null,
            studyTitle: null,
            devMode: false,
          });
        }}
      />
    </>
  );
};

export default PatientDetails;
