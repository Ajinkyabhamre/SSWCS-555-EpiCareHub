import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Brain from "./Brain";
import { useSelector } from "react-redux";
import { selectUpload } from "../features/patientSlice";

const PatientDetails = () => {
  let { id } = useParams();
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();
  // const selectedUpload = useSelector((state) => state.patients.selectedUpload);
  const selectedUpload = "356f4c80-f3f6-4881-863a-802115b8e545";
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
      })
      .catch((error) => {
        console.log(error);
      });
  }, [id]);

  const handleSubmit = useCallback((patient) => {
    patient.id = patient._id;
    patient.isEpilepsy = !patient.isEpilepsy;

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
  }, []);

  return (
    <div className="bg-gray-200 px-4 py-1 w-full mx-auto">
      {patient && (
        <>
          <div className="flex justify-between items-center mt-2 px-4 py-2 bg-white shadow-sm rounded-md">
            <span className="text-3xl font-bold mx-4">
              {patient.firstName} {patient.lastName}
            </span>
            <div className="flex gap-2">
              <button
                className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded"
                onClick={() => handleSubmit(patient)}
              >
                Mark Epilepsy
              </button>
              <div className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded w-fit">
                <Link to={"/patients"}>Go Back to Patients List</Link>
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-10">
            <div
              className={`p-4 shadow-2xl rounded-lg flex flex-col justify-center text-white items-center ${
                patient.isEpilepsy ? "bg-eh-15" : "bg-eh-10"
              }`}
            >
              <span>Epilepsy</span>
              <span className="text-xl font-bold">
                {patient.isEpilepsy ? "Yes" : "No"}
              </span>
            </div>
            <div className="p-4 bg-white shadow-2xl rounded-lg flex flex-col justify-center items-center">
              <span>Age</span>
              <span className="text-xl font-bold">{patient.age}</span>
            </div>
            <div className="p-4 bg-white shadow-2xl rounded-lg flex flex-col justify-center items-center">
              <span>Gender</span>
              <span className="text-xl font-bold">{patient.gender}</span>
            </div>
            <div className="p-4 bg-white shadow-2xl rounded-lg flex flex-col justify-center items-center">
              <span>Date of Birth</span>
              <span className="text-xl font-bold">{patient.dob}</span>
            </div>
            <div className="p-4 bg-white shadow-2xl rounded-lg flex flex-col justify-center items-center">
              <span>Email</span>
              <span className="text-xl font-bold">{patient.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white shadow-md rounded-lg">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Recent EEG Information
              </h2>
              <img
                className="h-full object-contain"
                src={`http://localhost:1010/${selectedUpload}/figures/EEG_LA.png`}
              />
            </div>
            <div className="p-4 bg-white shadow-md rounded-lg">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Latest Report
              </h2>
              <div className="border-b-2 border-gray-300 mb-4"></div>
              {/* <Brain /> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDetails;
