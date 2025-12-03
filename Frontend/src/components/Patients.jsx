import React, { useCallback, useState, useEffect } from "react";
import { useTable, useFilters } from "react-table";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DataTableComponent from "./DataTableComponent";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import axios from "axios";
import PatientForm from "./PatientForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import FilePresentIcon from "@mui/icons-material/FilePresent";

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
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/patients/get",
      headers: {},
    };

    setLoading(true);

    axios
      .request(config)
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        setError(error);
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
      let submitConfig = selectedPatient
        ? {
            method: "put",
            maxBodyLength: Infinity,
            url: `http://localhost:3000/patients/`,
            headers: {
              "Content-Type": "application/json",
            },
            data: patient,
          }
        : {
            method: "post",
            maxBodyLength: Infinity,
            url: "http://localhost:3000/patients/",
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
          setMessage(response.data.message);
          fetchData();
          setOpen(true);
          setVisible(false);
        })
        .catch((error) => {
          selectedPatient ? setVisible(false) : setError(error);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [selectedPatient]
  );
  const accept = () => {
    let deleteConfig = {
      method: "delete",
      maxBodyLength: Infinity,
      url: `http://localhost:3000/patients/${selectedPatient._id}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .request(deleteConfig)
      .then((response) => {
        setMessage("Deleted Successfully");
        fetchData();
        setSelectedPatient(null);
        setOpen(true);
        setVisible(false);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const reject = () => {
    // console.log("reject");
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
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-t-4 border-r-4 border-b-4 border-l-4 border-gray-900 animate-spin"></div>
      </div>
    );
  }

  if (visual) {
    return (
      <div className="flex justify-center items-center flex-col overflow-hidden font-crete mt-32 bg-eh-4">
        <h2 className="text-3xl text-center text-white mb-4">
          Visualizing EEG Data
        </h2>
        <p className="text-xl text-center text-white">
          Please wait while we analyze and visualize the brain activity...
        </p>
        <p className="text-xl text-center text-white mb-4">
          Do not close or refresh the browser
        </p>
        <div className="spinner mb-8"></div>
        {/* <button className="bg-eh-4 text-white px-4 py-2 rounded-lg hover:bg-opacity-80">
          Cancel Visualization
        </button> */}
      </div>
    );
  }

  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl">
      <div className="flex justify-between p-4">
        <h3 className="text-2xl font-crete">Patients List - {data?.length}</h3>
        <button
          className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            setSelectedPatient(null);
            setVisible(true);
          }}
        >
          Add Patient
        </button>
      </div>
      <DataTableComponent
        data={data}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onUploadClick={handleUploadClick}
      />
      <Dialog
        header={
          isFile
            ? "Upload EEG Data"
            : selectedPatient
            ? "Edit Patient"
            : "Add Patient"
        }
        visible={visible}
        onHide={() => {
          setVisible(false);
          setSelectedFile(null);
        }}
      >
        {isFile ? (
          <div className="relative flex flex-col items-center">
            <div
              className="mt-2 border cursor-pointer border-eh-4 rounded-md shadow-sm focus:outline-none focus:border-eh-3 focus:ring-eh-3 relative overflow-hidden"
              id="fileDropArea"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <p className="text-center bg-gradient-to-r from-eh-3 to-eh-4 py-8 px-4 text-white">
                Drag and drop your FIF file here, or click to browse
              </p>
              <input
                id="fileInput"
                name="fileInput"
                type="file"
                accept=".fif"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>
            {selectedFile && (
              <div className="mt-4 border flex items-center justify-center border-gray-300 rounded-md p-4 bg-gray-100">
                <p className="text-sm text-gray-700 mr-2">Selected File:</p>
                <div className="flex items-center">
                  <FilePresentIcon className="w-5 h-5 mr-1 text-eh-4" />
                  <p className="text-sm text-gray-900">{selectedFile.name}</p>
                </div>
              </div>
            )}

            {/* <button
              className="bg-eh-4 mt-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
              type="button"
              onClick={handleFileSubmit}
              disabled={!selectedFile}
            >
              Upload File
            </button> */}
          </div>
        ) : (
          <PatientForm patient={selectedPatient} onSubmit={handleSubmit} />
        )}
      </Dialog>
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
      <ConfirmDialog
        group="declarative"
        visible={confirmDelete}
        onHide={() => setConfirmDelete(false)}
        message={`Are you sure you want to delete ${
          selectedPatient?.firstName || "this patient"
        }?`}
        header="Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={accept}
        reject={reject}
        style={{ width: "50vw" }}
        breakpoints={{ "1100px": "75vw", "960px": "100vw" }}
      />
    </div>
  );
};

export default Patients;
