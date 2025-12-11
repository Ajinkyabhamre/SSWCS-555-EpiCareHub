import React, { useCallback, useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CustomDataTable from "./CustomDataTable";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import axios from "axios";
import PatientForm from "./PatientForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import EEGProcessingOverlay from "./EEGProcessingOverlay";

const Patients = () => {
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isFile, setIsFile] = useState(false);
  const [message, setMessage] = useState("Successfully Added Patient");
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const dispatch = useDispatch();

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      setMessage("No file selected.");
      setOpen(true);
      return;
    }

    const devMode = import.meta.env.VITE_EPICARE_DEV_MODE === "true";
    const patientId = selectedPatient._id;
    const patientFullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;

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

                // Wait 2 seconds to show success message, then navigate
                setTimeout(() => {
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

                  dispatch(selectUpload(uploadId));
                  navigate(`/patient/${patientId}`);
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
      setOpen(true);
    }
  };

  const handleEditClick = useCallback((patient) => {
    setSelectedPatient(patient);
    setVisible(true);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const fetchData = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${apiUrl}/patients/get`,
      headers: {},
    };

    setLoading(true);
    setError(null);

    axios
      .request(config)
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        setError(error.message || "Failed to load patients");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.target.files = event.dataTransfer.files;

    handleFileChange(event);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = useCallback(
    (patient) => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      let submitConfig = selectedPatient
        ? {
            method: "put",
            maxBodyLength: Infinity,
            url: `${apiUrl}/patients/`,
            headers: {
              "Content-Type": "application/json",
            },
            data: patient,
          }
        : {
            method: "post",
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
          setMessage(response.data.message || "Patient saved successfully");
          fetchData();
          setOpen(true);
          setVisible(false);
          setSelectedPatient(null);
          setIsFile(false);
        })
        .catch((error) => {
          const errorMsg = error.message || "Error saving patient";
          setMessage(errorMsg);
          setOpen(true);
          if (!selectedPatient) {
            setError(errorMsg);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [selectedPatient]
  );
  const accept = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    let deleteConfig = {
      method: "delete",
      maxBodyLength: Infinity,
      url: `${apiUrl}/patients/${selectedPatient._id}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .request(deleteConfig)
      .then((response) => {
        setMessage("Patient deleted successfully");
        fetchData();
        setSelectedPatient(null);
        setOpen(true);
        setConfirmDelete(false);
      })
      .catch((error) => {
        const errorMsg = error.message || "Failed to delete patient";
        setMessage(errorMsg);
        setOpen(true);
        setError(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteClick = useCallback((patient) => {
    setSelectedPatient(patient);

    setConfirmDelete(true);
  }, []);

  const handleUploadClick = useCallback((patient) => {
    setSelectedPatient(patient);
    setIsFile(true);
    setVisible(true);
  }, []);

  useEffect(() => {
    dispatch(clearUpload());
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-emerald-200 dark:border-emerald-400 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error && !data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 max-w-md w-full shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Unable to load patients
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
            {error}. Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={fetchData}
            className="w-full rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Patients
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Manage epilepsy patients, upload EEG data, and start localization workflows.
          </p>

          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSelectedPatient(null);
                setIsFile(false);
                setVisible(true);
              }}
              className="rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-all duration-200"
            >
              + Add patient
            </button>
            <button
              onClick={fetchData}
              className="rounded-full border border-emerald-200 dark:border-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold px-6 py-3 transition-all duration-200"
            >
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="rounded-2xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Total Patients
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.length}
              </p>
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="mb-4 sm:mb-6 border-b border-emerald-50 dark:border-slate-700 pb-4 sm:pb-6">
            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">All patients</p>
          </div>
          <CustomDataTable
            data={data}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </div>

        {/* Add/Edit Patient Dialog */}
        <Dialog
          header={selectedPatient ? "Edit patient" : "Add new patient"}
          visible={visible && !isFile}
          onHide={() => {
            setVisible(false);
            setSelectedPatient(null);
            setIsFile(false);
            setSelectedFile(null);
          }}
          className="w-full md:w-2/3 lg:w-1/2"
        >
          <PatientForm patient={selectedPatient} onSubmit={handleSubmit} />
        </Dialog>

        {/* EEG Upload Dialog */}
        <Dialog
          header={`Upload EEG (.fif) for ${selectedPatient?.firstName || ""} ${selectedPatient?.lastName || ""}`}
          visible={visible && isFile}
          onHide={() => {
            setVisible(false);
            setSelectedPatient(null);
            setIsFile(false);
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
              Start analysis
            </button>
          </div>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
          message={message}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          group="declarative"
          visible={confirmDelete}
          onHide={() => {
            setConfirmDelete(false);
            setSelectedPatient(null);
          }}
          message={`Are you sure you want to delete ${selectedPatient?.firstName || ""} ${selectedPatient?.lastName || ""}? This action cannot be undone.`}
          header="Delete patient"
          icon="pi pi-exclamation-triangle"
          accept={accept}
          reject={() => setConfirmDelete(false)}
          style={{ width: "50vw" }}
          breakpoints={{ "1100px": "75vw", "960px": "100vw" }}
        />

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
      </div>
    </div>
  );
};

export default Patients;
