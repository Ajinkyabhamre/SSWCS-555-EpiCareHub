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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", selectedPatient._id);

      axios
        .post("http://127.0.0.1:8000/visualize_brain", formData)
        .then((response) => {
          console.log(response.data);
          navigate(`/patient/${selectedPatient._id}`);
          setSelectedFile(null);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          setMessage("Error uploading file.");
          setOpen(true);
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
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-t-4 border-r-4 border-b-4 border-l-4 border-gray-900 animate-spin"></div>
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
        onHide={() => setVisible(false)}
      >
        {isFile ? (
          <div className="mt-4">
            <label
              htmlFor="fileInput"
              className="block text-sm font-medium text-gray-700"
            >
              Upload FIF File
            </label>
            <input
              id="fileInput"
              name="fileInput"
              type="file"
              accept=".fif"
              onChange={handleFileChange}
              className="mt-2 block w-full px-3 py-2 border border-eh-4 rounded-md shadow-sm focus:outline-none focus:ring-eh-3 focus:border-eh-3 sm:text-sm"
            />
            <button
              className="bg-eh-4 mt-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
              type="button"
              onClick={handleFileSubmit}
            >
              Submit File
            </button>
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
