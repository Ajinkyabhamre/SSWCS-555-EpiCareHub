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
import noImage from "/image.png";
import PDFGenerator from "./PDFGenerator";

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

    setVisual(true);

    try {
      // ====================================================
      // PHASE 3 STEP 1: Create study in Node backend first
      // ====================================================
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      console.log("[PHASE 3] Creating study record...");
      const studyResponse = await axios.post(
        `${apiUrl}/patients/${patient._id}/studies`,
        {
          title: "Baseline EEG",
          status: "PROCESSING",
        }
      );

      const createdStudy = studyResponse.data.study;
      const uploadId = createdStudy.uploadId;

      console.log(`[PHASE 3] Study created with uploadId: ${uploadId}`);

      // ====================================================
      // PHASE 3 STEP 2: Call Python with uploadId
      // ====================================================
      const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";
      const devMode = import.meta.env.VITE_EPICARE_DEV_MODE === "true";

      const endpoint = devMode ? "/visualize_brain_dev" : "/visualize_brain";

      if (devMode) {
        console.log("[DEV MODE] Using dev endpoint:", endpoint);
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", patient._id);
      formData.append("uploadId", uploadId); // PHASE 3: Include uploadId

      console.log(`[PHASE 3] Calling Python ${endpoint} with uploadId: ${uploadId}`);

      await axios.post(`${pythonApiUrl}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[PHASE 3] Python processing initiated successfully");

      // ====================================================
      // PHASE 3 STEP 3: Refresh patient data
      // ====================================================
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
      const studiesResponse = await axios.get(`${apiUrl}/patients/${id}/studies`);
      if (studiesResponse.data.success && studiesResponse.data.studies) {
        setStudies(studiesResponse.data.studies);
      }

      setSelectedFile(null);
      setVisible(false);
    } catch (error) {
      console.error("[PHASE 3] Error in upload flow:", error);

      let errorMessage = "Error uploading file.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
      setVisible(true);
    } finally {
      setVisual(false);
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

  if (visual) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 max-w-md w-full shadow-[0_18px_60px_rgba(15,118,110,0.10)] text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Visualizing EEG Data
          </h2>
          <p className="text-slate-600 mb-6">
            Please wait while we analyze and visualize the brain activity...
          </p>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500">
            Do not close or refresh the browser
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    Patient ID: {patient._id?.slice(-8)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      patient.isEpilepsy
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {patient.isEpilepsy ? "Epilepsy" : "Non-epilepsy"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <PDFGenerator patient={patient} currentReport={selectedUpload} />
              <Link
                to="/patients"
                className="inline-flex items-center rounded-full border-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold px-6 py-2 transition-all duration-200"
              >
                ← Back to Patients
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Patient Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Age
            </p>
            <p className="text-2xl font-bold text-emerald-600">{patient.age}</p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Gender
            </p>
            <p className="text-2xl font-bold text-emerald-600">{patient.gender}</p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Date of Birth
            </p>
            <p className="text-sm font-bold text-emerald-600">{patient.dob}</p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm text-center overflow-hidden">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Email
            </p>
            <p className="text-sm font-bold text-emerald-600 truncate">{patient.email}</p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brain Visualization - Left Column (2/3 width) */}
          {selectedUpload && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2 rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Brain Visualization
                </h2>
                <p className="text-sm text-slate-600">
                  Latest EEG localization results across multiple views
                </p>
              </div>
              <Carousel
                value={selectedUpload?.images}
                numVisible={2}
                numScroll={1}
                itemTemplate={viewTemplate}
                className="patient-details-carousel"
              />
            </motion.div>
          )}

          {/* Patient Controls - Right Column (1/3 width) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Epilepsy Status Card */}
            <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Diagnosis Status
              </h3>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsEpilepsy(true)}
                  className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                    isEpilepsy
                      ? "bg-rose-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Epilepsy
                </button>
                <button
                  onClick={() => setIsEpilepsy(false)}
                  className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                    !isEpilepsy
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Non-epilepsy
                </button>
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Clinical Comments
                </label>
                <textarea
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm resize-none outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Enter clinical observations, notes, or recommendations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setVisible(true)}
                  className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200 shadow-md shadow-emerald-600/40"
                >
                  Upload New EEG
                </button>
                <button
                  onClick={() => handleSubmit(patient)}
                  className="w-full rounded-full border-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold px-6 py-3 transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Previous EEG Uploads Section */}
        {/* TODO(phase3): Update this section to display studies from eegStudies collection instead of eegVisuals */}
        {/* TODO(phase3): Each study card should show: upload date, status, summary stats, and link to dedicated study view */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6 rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]"
        >
          <div className="mb-6 pb-4 border-b border-emerald-50">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              Previous EEG Uploads
            </h2>
            <p className="text-sm text-slate-600">
              View and re-run historical EEG analyses for this patient
            </p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {patient.eegVisuals && patient.eegVisuals.length > 0 ? (
              patient.eegVisuals.map((visual, index) => (
                <div
                  key={visual.uploadId}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                    selectedUpload?.uploadId === visual.uploadId
                      ? "border-emerald-300 bg-emerald-50 shadow-sm"
                      : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                  onClick={() => dispatch(selectUpload(visual))}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">
                            Study {index + 1}
                          </h4>
                          {/* PHASE 3: Display status badge */}
                          {getStudyStatus(visual.uploadId) && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                getStudyStatus(visual.uploadId) === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : getStudyStatus(visual.uploadId) === "PROCESSING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {getStudyStatus(visual.uploadId)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>{visual?.uploadDate || "N/A"}</span>
                          {visual?.rootPath && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs truncate max-w-[200px]">
                                {visual.rootPath}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisualize(visual.uploadId);
                      }}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 transition-all duration-200 whitespace-nowrap"
                    >
                      Re-run Analysis
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-slate-600 mb-2">No previous uploads</p>
                <p className="text-sm text-slate-500">
                  Upload an EEG file to start visualization
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
          <p className="text-slate-600 text-sm">
            Upload a FIF EEG file to generate a 3D localization visualization for this patient.
          </p>

          {/* Drag and Drop Area */}
          <div
            className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-8 text-center cursor-pointer hover:bg-emerald-100 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <FileUploadIcon className="mx-auto mb-3 text-emerald-600" style={{ fontSize: "2rem" }} />
            <p className="text-slate-700 font-medium mb-1">
              Drag & drop your .fif file here, or click to browse
            </p>
            <p className="text-xs text-slate-500 mb-4">
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
              className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm underline"
            >
              Browse files
            </button>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUploadIcon className="text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleFileSubmit}
            disabled={!selectedFile}
            className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Start Analysis
          </button>
        </div>
      </Dialog>
    </div>
  );
};

export default PatientDetails;
