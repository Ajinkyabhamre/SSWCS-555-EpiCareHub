import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Brain from "./Brain";

const PatientDetails = () => {
  let { id } = useParams();
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

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
  return (
    <div className="bg-gray-400 h-full p-4 grid grid-cols-1 lg:grid-cols-2 overflow-hidden w-full mx-auto gap-4">
      {patient && (
        <>
          <div className="p-4 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Patient Details
            </h2>
            <div className="border-b-2 border-gray-300 mb-4"></div>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">First Name:</span>
                <span className="text-blue-600">{patient.firstName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Last Name:</span>
                <span className="text-blue-600">{patient.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">
                  Date of Birth:
                </span>
                <span className="text-blue-600">{patient.dob}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Gender:</span>
                <span className="text-blue-600">{patient.gender}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-blue-600">{patient.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Epilepsy:</span>
                <span
                  className={`text-blue-600 ${
                    patient.isEpilepsy ? "font-semibold" : ""
                  }`}
                >
                  {patient.isEpilepsy ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Age:</span>
                <span className="text-blue-600">{patient.age}</span>
              </div>
              <div className="bg-eh-4 hover:bg-eh-3 text-white font-bold py-2 px-4 rounded w-fit">
                <Link to={"/patients"}>Go Back to Patients List</Link>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Latest Report
            </h2>
            <div className="border-b-2 border-gray-300 mb-4"></div>
            <Brain />
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDetails;
