import React, { useCallback, useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DataTableComponent from "./DataTableComponent";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import axios from "axios";
import PatientForm from "./PatientForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import FileUploadIcon from "@mui/icons-material/FileUpload";

const Patients = () => {
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visual, setVisual] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isFile, setIsFile] = useState(false);
  const [message, setMessage] = useState("Successfully Added Patient");
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", selectedPatient._id);
      setVisual(true);

      const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

      axios
        .post(`${pythonApiUrl}/visualize_brain`, formData)
        .then((response) => {
          dispatch(selectUpload(response.data.data.uploadId));
          navigate(`/patient/${selectedPatient._id}`);
          setSelectedFile(null);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          setMessage("Error uploading file.");
          setOpen(true);
        })
        .finally(() => {
          setVisual(false);
        });
    } else {
      setMessage("No file selected.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading patients...</p>
        </div>
      </div>
    );
  }

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

  if (error && !data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 max-w-md w-full shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Unable to load patients
          </h2>
          <p className="text-slate-600 mb-6">
            {error}. Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={fetchData}
            className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Patients
          </h1>
          <p className="text-slate-600 mb-6">
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
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
            >
              + Add patient
            </button>
            <button
              onClick={fetchData}
              className="rounded-full border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold px-6 py-3 transition-all duration-200"
            >
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="rounded-2xl border border-emerald-50 bg-white p-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Patients
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.length}
              </p>
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
          <div className="mb-6 border-b border-emerald-50 pb-6">
            <p className="text-lg font-semibold text-slate-900">All patients</p>
          </div>
          <DataTableComponent
            data={data}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onUploadClick={handleUploadClick}
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
      </div>
    </div>
  );
};

export default Patients;
