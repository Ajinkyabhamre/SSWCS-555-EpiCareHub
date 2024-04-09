import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/patients/statistics",
      headers: {},
    };

    axios
      .request(config)
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        // setError(error);
      })
      .finally(() => {
        // setLoading(false);
      });

    return () => {
      setData(null);
    };
  }, []);

  return (
    <div className="flex flex-col mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Patients Overview</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-3xl font-bold text-eh-4">
                  {data.totalPatients}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Scans</p>
                <p className="text-3xl font-bold text-eh-3">
                  {data.totatScans}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Epilepsy Patients</p>
                <p className="text-3xl font-bold text-eh-4">
                  {data.epilepsyPatient}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Non-Epilepsy Patients</p>
                <p className="text-3xl font-bold text-eh-3">
                  {data.nonEpilepsyCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Age Groups Distribution
            </h2>
            <Bar
              data={{
                labels: Object.keys(data.ageGroups),
                datasets: [
                  {
                    label: "Patients",
                    backgroundColor: "#65A19F",
                    borderColor: "#65A19F",
                    borderWidth: 1,
                    hoverBackgroundColor: "#65A19F",
                    hoverBorderColor: "#65A19F",
                    data: Object.values(data.ageGroups),
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Chart.js Bar Chart",
                  },
                },
              }}
            />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Epilepsy Status</h2>
            <Doughnut
              data={{
                labels: ["Epilepsy Patients", "Non-Epilepsy Patients"],
                datasets: [
                  {
                    label: "Epilepsy Status",
                    data: [data.epilepsyPatient, data.nonEpilepsyCount],
                    backgroundColor: ["#E49B42", "#65A19F"],
                    borderColor: ["#E49B42", "#65A19F"],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
