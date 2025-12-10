import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { useSelector } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import { useDispatch } from "react-redux";
import { Carousel } from "primereact/carousel";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import noImage from "/image.png";
import PDFGenerator from "./PDFGenerator";
import EEGProcessingOverlay from "./EEGProcessingOverlay";
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
  const [visual, setVisual] = useState(false);
  const [isEpilepsy, setIsEpilepsy] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [studies, setStudies] = useState([]); // PHASE 3: Track EEG studies
  const [activeTab, setActiveTab] = useState("gallery"); // PHASE 4: Tab state

  // PHASE 6: Processing overlay state
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

  // PHASE 6: Refs for cleanup
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

  const navigate = useNavigate();
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
        .catch((error) => {})
        .finally(() => {});
    },
    [isEpilepsy, comments]
  );

  const handleVisualize = useCallback((visualId) => {
    setVisual(true);
    const formData = new FormData();
    formData.append("uploadId", visualId);

    const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

    axios
      .post(`${pythonApiUrl}/visualize_brain_historic`, formData)
      .then((response) => {})
      .catch((error) => {})
      .finally(() => {
        setVisual(false);
      });
  }, []);

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

    // PHASE 6: Show overlay with first step
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

    // Close the upload dialog
    setVisible(false);

    try {
      // ====================================================
      // STEP 1: Create study in Node backend first
      // ====================================================
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      console.log("[PHASE 6] Creating study record...");
      const studyResponse = await axios.post(
        `${apiUrl}/patients/${patientId}/studies`,
        {
          title: "Baseline EEG",
          status: "PROCESSING",
        }
      );

      const createdStudy = studyResponse.data.study;
      const uploadId = createdStudy.uploadId;

      console.log(`[PHASE 6] Study created with uploadId: ${uploadId}`);

      // Update overlay: upload done, move to preprocess
      setProcessingOverlay((prev) => ({
        ...prev,
        currentStepId: "preprocess",
        uploadId: uploadId,
      }));

      // ====================================================
      // STEP 2: Call Python with uploadId
      // ====================================================
      const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";
      const endpoint = devMode ? "/visualize_brain_dev" : "/visualize_brain";

      if (devMode) {
        console.log("[PHASE 6] [DEV MODE] Using dev endpoint:", endpoint);
      }

      // Build FormData with uploadId
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", patientId);
      formData.append("uploadId", uploadId);

      console.log(`[PHASE 6] Calling Python ${endpoint} with uploadId: ${uploadId}`);

      // PHASE 6: Progress through ML pipeline steps while Python is working
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
      }, devMode ? 500 : 3000); // Faster in dev mode

      // Call Python endpoint (async, Python will callback to Node)
      await axios.post(`${pythonApiUrl}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(stepIntervalRef.current);

      console.log("[PHASE 6] Python processing initiated successfully");

      // ====================================================
      // STEP 3: Poll for study completion
      // ====================================================
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

                // Show completion
                setProcessingOverlay((prev) => ({
                  ...prev,
                  status: "COMPLETED",
                }));

                // Wait 2 seconds to show success message, then refresh data
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

                  // Refresh patient data
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

                  // Refresh studies list
                  const studiesResponse2 = await axios.get(`${apiUrl}/patients/${id}/studies`);
                  if (studiesResponse2.data.success && studiesResponse2.data.studies) {
                    setStudies(studiesResponse2.data.studies);
                  }

                  setSelectedFile(null);
                }, 2000);
              } else if (matchingStudy.status === "FAILED") {
                clearInterval(pollingIntervalRef.current);

                // Show error
                setProcessingOverlay((prev) => ({
                  ...prev,
                  status: "FAILED",
                }));
              }
            }
          }
        } catch (pollError) {
          console.error("[PHASE 6] Polling error:", pollError);
        }
      }, devMode ? 2000 : 5000); // Poll every 2s in dev, 5s in production
    } catch (error) {
      console.error("[PHASE 6] Error in upload flow:", error);

      // Clear intervals
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      let errorMessage = "Error uploading file.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setProcessingOverlay((prev) => ({
        ...prev,
        status: "FAILED",
      }));

      setMessage(errorMessage);
      setVisible(true);
    }
  };

  // PHASE 3: Helper to get study status for an uploadId
  const getStudyStatus = useCallback(
    (uploadId) => {
      const study = studies.find((s) => s.uploadId === uploadId);
      return study?.status || null;
    },
    [studies]
  );

  const viewTemplate = useCallback(
    (image) => {
      return (
        <div className="border border-emerald-100 rounded-2xl text-center">
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
    [selectedUpload]
  );

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    // Fetch patient data
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
      .catch((error) => {
        console.error('Error fetching patient data:', error);
      });

    // PHASE 3: Fetch studies data
    axios
      .get(`${apiUrl}/patients/${id}/studies`)
      .then((response) => {
        if (response.data.success && response.data.studies) {
          setStudies(response.data.studies);
        }
      })
      .catch((error) => {
        console.error('Error fetching studies:', error);
      });
  }, [dispatch, id, selectedUpload]);

  // PHASE 6: Cleanup intervals on unmount
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

  // PHASE 4: Helper to determine current study
  const getCurrentStudy = () => {
    // Prefer latest COMPLETED or PROCESSING study
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

    // Fallback to latest eegVisual
    if (selectedUpload) {
      return {
        study: null,
        upload: selectedUpload,
      };
    }

    return { study: null, upload: null };
  };

  // PHASE 4: Helper to format dates
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

  // PHASE 4: Helper to get status badge styling
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

  // PHASE 4: Get current study and upload for display
  const { study: currentStudy, upload: currentUpload } = getCurrentStudy();
  const currentUploadId = currentUpload?.uploadId;

  return (
    <>
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex flex-col gap-6 px-8 py-6">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        {/* Left: Patient name + status */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                patient.isEpilepsy
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
              }`}
            >
              {patient.isEpilepsy ? "Epilepsy Diagnosed" : "No Epilepsy Diagnosis"}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Patient ID: {patient._id?.slice(-8)}
            </span>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap gap-3">
          <PDFGenerator patient={patient} currentReport={selectedUpload} />
          <button
            onClick={() => setVisible(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-5 py-2 transition-all duration-200"
          >
            <FileUploadIcon style={{ fontSize: "1.2rem" }} />
            Upload EEG Data
          </button>
          <button
            onClick={() => currentUploadId && navigate(`/patient/${id}/brain/${currentUploadId}`)}
            disabled={!currentUploadId}
            className={`inline-flex items-center gap-2 rounded-full font-semibold px-5 py-2 transition-all duration-200 ${
              currentUploadId
                ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <ViewInArIcon style={{ fontSize: "1.2rem" }} />
            Open 3D Brain
          </button>
          <Link
            to="/patients"
            className="inline-flex items-center rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-5 py-2 transition-all duration-200"
          >
            ← Back
          </Link>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-[1.1fr,1.4fr] gap-6 items-start"
      >
        {/* Left Column: Patient Snapshot */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Patient Snapshot</h2>

          {/* Demographics */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Demographics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-slate-700 p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Age</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{patient.age}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-slate-700 p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Gender</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{patient.gender}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-slate-700 p-3 col-span-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Date of Birth</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{patient.dob}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-slate-700 p-3 col-span-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Email</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{patient.email}</p>
              </div>
            </div>
          </div>

          {/* Diagnosis Status */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Diagnosis
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEpilepsy(true)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isEpilepsy
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Epilepsy
              </button>
              <button
                onClick={() => setIsEpilepsy(false)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  !isEpilepsy
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Non-epilepsy
              </button>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Clinical Notes
            </label>
            <textarea
              className="w-full rounded-xl border border-emerald-100 dark:border-slate-600 bg-emerald-50/40 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm resize-none outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder="Enter clinical observations, notes, or recommendations..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={() => handleSubmit(patient)}
            className="w-full rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-all duration-200 shadow-md"
          >
            Save Changes
          </button>
        </div>

        {/* Right Column: Current EEG Study Viewer */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-6">
          {currentUpload ? (
            <>
              {/* Study Header */}
              <div className="mb-6 pb-4 border-b border-emerald-50 dark:border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {currentStudy?.title || "Latest EEG Study"}
                  </h2>
                  {currentStudy?.status && getStatusBadge(currentStudy.status)}
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                  <span>Uploaded: {formatDate(currentUpload.uploadDate || currentStudy?.createdAt)}</span>
                  {currentStudy?.metadata?.processingTime && (
                    <span>Processed in {currentStudy.metadata.processingTime}s</span>
                  )}
                </div>
              </div>

              {/* Tabbed Content */}
              <div className="mb-4">
                <div className="inline-flex gap-2 p-1 bg-emerald-50 dark:bg-slate-700 rounded-full">
                  <button
                    onClick={() => setActiveTab("gallery")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeTab === "gallery"
                        ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Image Gallery
                  </button>
                  <button
                    onClick={() => setActiveTab("topomap")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeTab === "topomap"
                        ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Topomap
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeTab === "preview"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    3D Preview
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
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
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-emerald-100 rounded-xl">
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
                        <p className="text-sm text-slate-600 mt-3">EEG Topomap Visualization</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-slate-600">Topomap not available for this study</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "preview" && (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-100 rounded-xl">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <ViewInArIcon className="text-emerald-600" style={{ fontSize: "2.5rem" }} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Interactive 3D Brain View
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        Explore the brain localization in an interactive 3D environment
                      </p>
                      {currentUploadId ? (
                        <button
                          onClick={() => navigate(`/patient/${id}/brain/${currentUploadId}`)}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
                        >
                          <ViewInArIcon />
                          Open 3D View
                        </button>
                      ) : (
                        <p className="text-sm text-slate-500">Upload ID not available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No EEG Studies Yet
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                Upload an EEG recording to generate brain visualizations and start analysis
              </p>
              <button
                onClick={() => setVisible(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
              >
                <FileUploadIcon />
                Upload First EEG Recording
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Previous EEG Studies Section - PHASE 4 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_18px_45px_rgba(15,118,110,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] p-6"
      >
        <div className="mb-6 pb-4 border-b border-emerald-50 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Previous EEG Studies
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View and explore historical EEG analyses for this patient
          </p>
        </div>

        <div className="space-y-3">
          {studies.length > 0 ? (
            studies
              .filter((study) => study.uploadId !== currentUploadId) // Exclude current study
              .map((study, index) => {
                const upload = patient.eegVisuals?.find(
                  (v) => v.uploadId === study.uploadId
                );
                return (
                  <div
                    key={study.uploadId || study._id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-emerald-50 dark:border-slate-700 rounded-xl p-4 bg-white/80 dark:bg-slate-700/50 hover:bg-emerald-50/30 dark:hover:bg-slate-600/50 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {study.title || `Study #${index + 1}`}
                        </p>
                        {getStatusBadge(study.status)}
                        {/* 3D badge for studies with MNE brain view images */}
                        {study.brainViews && Object.keys(study.brainViews).length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-700">
                            <span>📍</span>
                            3D Images Ready ({Object.keys(study.brainViews).length})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Uploaded {formatDate(upload?.uploadDate || study.createdAt)}
                        {study.metadata?.processingTime && (
                          <> • Processed in {study.metadata.processingTime}s</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (upload) {
                            dispatch(selectUpload(upload));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="rounded-full border-2 border-emerald-200 dark:border-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-4 py-2 text-sm transition-all duration-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/patient/${id}/brain/${study.uploadId}`)}
                        className="rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2 text-sm transition-all duration-200"
                      >
                        3D Brain
                      </button>
                    </div>
                  </div>
                );
              })
          ) : patient.eegVisuals && patient.eegVisuals.length > 1 ? (
            // Fallback to eegVisuals if no studies but we have legacy uploads
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

          {/* Drag and Drop Area */}
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

          {/* File Preview */}
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

          {/* Submit Button */}
          <button
            onClick={handleFileSubmit}
            disabled={!selectedFile}
            className="w-full rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Start Analysis
          </button>
        </div>
      </Dialog>

      {/* PHASE 6: Processing Overlay */}
      <EEGProcessingOverlay
        open={processingOverlay.open}
        currentStepId={processingOverlay.currentStepId}
        status={processingOverlay.status}
        patientName={processingOverlay.patientName}
        studyTitle={processingOverlay.studyTitle}
        devMode={processingOverlay.devMode}
        onCancel={() => {
          // Clear intervals
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
          // Close overlay
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
