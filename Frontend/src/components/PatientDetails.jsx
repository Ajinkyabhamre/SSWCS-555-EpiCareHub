import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { useSelector } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import { useDispatch } from "react-redux";
import { Carousel } from "primereact/carousel";
import { Tag } from "primereact/tag";
import FilePresentIcon from "@mui/icons-material/FilePresent";
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

      let submitConfig = {
        method: "put",
        maxBodyLength: Infinity,
        url: `http://localhost:3000/patients/`,
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

  const handleFileSubmit = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", patient._id);
      setVisual(true);

      const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

      axios
        .post(`${pythonApiUrl}/visualize_brain`, formData)
        .then((response) => {
          let config = {
            method: "get",
            maxBodyLength: Infinity,
            url: `http://localhost:3000/patients/${id}`,
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
              console.log(error);
            });
          setSelectedFile(null);
          setVisible(false);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          setMessage("Error uploading file.");
          setVisible(true);
        })
        .finally(() => {
          setVisual(false);
        });
    } else {
      setMessage("No file selected.");
      setVisible(true);
    }
  };

  const viewTemplate = useCallback(
    (image) => {
      return (
        <div className="border-1 surface-border border-round text-center h-fit">
          <div className="mb-3">
            <img
              className="w-full h-60 object-cover object-center"
              src={image}
              onError={(e) => {
                e.target.src = noImage;
              }}
            />
          </div>
          <Tag
            value={views.find((view) => image.includes(view))}
            severity="success"
          ></Tag>
        </div>
      );
    },
    [selectedUpload]
  );

  useEffect(() => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `http://localhost:3000/patients/${id}`,
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
  }, [dispatch, id, selectedUpload]);

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

  return (
    <>
      {patient && (
        <div className="grid gap-2 px-4 py-2 bg-gray-200 h-[90.5vh]">
          <div className="flex justify-between items-center px-4 bg-white shadow-sm rounded-md row-span-1">
            <span className="text-3xl font-bold mx-4">
              {patient.firstName} {patient.lastName}
            </span>
            <div className="flex gap-2">
              <PDFGenerator patient={patient} currentReport={selectedUpload} />
              <div className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded w-fit">
                <Link to={"/patients"}>Go Back to Patients List</Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 row-span-2 px-10">
            <div
              className={`shadow-sm rounded-lg flex flex-col justify-center text-white items-center ${
                patient.isEpilepsy ? "bg-eh-15" : "bg-eh-10"
              }`}
            >
              <span>Epilepsy</span>
              <span className="text-xl font-bold">
                {patient.isEpilepsy ? "Yes" : "No"}
              </span>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-center items-center">
              <span>Age</span>
              <span className="text-xl font-bold">{patient.age}</span>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-center items-center">
              <span>Gender</span>
              <span className="text-xl font-bold">{patient.gender}</span>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-center items-center">
              <span>Date of Birth</span>
              <span className="text-xl font-bold">{patient.dob}</span>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-center overflow-x-scroll">
              <span className="text-center">Email</span>
              <div className="text-xl font-bold ">{patient.email}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 row-span-5">
            <div className="flex gap-2">
              {selectedUpload && (
                <div className="p-4 bg-white shadow-md rounded-lg w-3/4 max-h-fit">
                  <h2 className="text-xl mb-2 text-gray-800">
                    Latest EEG Visuals
                  </h2>
                  <Carousel
                    value={selectedUpload?.images}
                    numVisible={2}
                    numScroll={2}
                    itemTemplate={viewTemplate}
                  />
                </div>
              )}
              <div className="bg-white shadow-md rounded-lg p-4  w-1/2 flex flex-col gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl mb-1 text-gray-800">Epilepsy:</h2>
                  <div className="border-gray-300 rounded cursor-pointer border flex w-fit h-fit">
                    <div
                      className={`border-gray-300 rounded px-4 py-2 ${
                        isEpilepsy && "bg-eh-4 text-white"
                      } hover:bg-eh-3 hover:text-white`}
                      onClick={() => setIsEpilepsy(true)}
                    >
                      Yes
                    </div>
                    <div
                      className={`border-gray-300 rounded px-4 py-2 ${
                        !isEpilepsy && "bg-eh-4 text-white"
                      } px-2  hover:bg-eh-3 hover:text-white`}
                      onClick={() => setIsEpilepsy(false)}
                    >
                      No
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl mb-1 text-gray-800">Comments:</h2>
                  <div className="border w-full border-gray-300 rounded overflow-hidden">
                    <textarea
                      className="p-2 w-full h-32 resize-none outline-none"
                      placeholder="Enter comments here..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-around items-center">
                  <button
                    className="bg-eh-4 h-fit hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setVisible(true)}
                  >
                    Upload EEG Data
                  </button>
                  <button
                    className="bg-eh-4 h-fit hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
                    onClick={() => handleSubmit(patient)}
                  >
                    Update Data
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white shadow-md rounded-lg h-full flex flex-col">
              <h2 className="text-xl mb-2 text-gray-800">
                Previous EEG Uploads
              </h2>
              <div className="border-b-2 border-gray-300 mb-4"></div>
              <div className="gap-2 flex flex-col overflow-y-scroll h-full">
                {patient.eegVisuals && patient.eegVisuals.length > 0 ? (
                  patient.eegVisuals.map((visual, index) => (
                    <div
                      className="flex justify-between items-center px-4"
                      key={visual.uploadId}
                      onClick={() => dispatch(selectUpload(visual))}
                    >
                      <div className="flex justify-between items-center py-2 px-4 w-full mr-4 hover:bg-eh-3 cursor-pointer">
                        <h4>Visual {index + 1}</h4>
                        <span>{visual?.uploadDate}</span>
                        <span>{visual?.rootPath}</span>
                      </div>
                      <button
                        className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
                        onClick={() => handleVisualize(visual.uploadId)}
                      >
                        Visualize
                      </button>
                    </div>
                  ))
                ) : (
                  <div>No previous uploads</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Dialog
        header={"Upload EEG Data"}
        visible={visible}
        onHide={() => {
          setVisible(false);
          setSelectedFile(null);
        }}
      >
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

          <button
            className="bg-eh-4 mt-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
            type="button"
            onClick={handleFileSubmit}
            disabled={!selectedFile}
          >
            Upload File
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default PatientDetails;
