import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryPie,
  VictoryLegend,
  VictoryLabel,
  VictoryLine,
} from "victory";

export const KPICard = ({ label, value, isPrimary = false }) => {
  return (
    <div className="p-10 px-20 bg-white shadow-4 rounded-lg flex flex-col justify-center items-center">
      <p className="text-sm text-gray-500 font-semibold whitespace-nowrap">
        {label}
      </p>
      <p
        className={`text-3xl font-bold ${
          isPrimary ? "text-eh-4" : "text-eh-3"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

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
        const tempData = response.data;
        setData(tempData);
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
    <>
      {data && (
        <div className="flex justify-around items-center px-4 h-[85vh] m-4">
          <div className="flex flex-col justify-around h-full w-1/12">
            <KPICard
              label="Total Patients"
              value={data.totalPatients}
              isPrimary
            />
            <KPICard label="Total Scans" value={data.totatScans} isPrimary />
            <KPICard label="Epilepsy Patients" value={data.epilepsyPatient} />
            <KPICard
              label="Non-Epilepsy Patients"
              value={data.nonEpilepsyCount}
            />
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-4 p-4 h-full">
              <h2 className="text-lg font-semibold">Age Groups Distribution</h2>
              {data.ageGroupsData && (
                <VictoryChart width={600} height={350} domainPadding={50}>
                  <VictoryAxis />
                  <VictoryAxis
                    dependentAxis
                    // tickFormat specifies how ticks should be displayed
                    tickFormat={(x) => parseInt(x, 10)}
                  />
                  <VictoryBar
                    data={data.ageGroupsData}
                    x="ageGroup"
                    y="number"
                    style={{
                      data: {
                        fill: "#65A19F",
                      },
                    }}
                  />
                  <VictoryLegend
                    x={350}
                    y={0}
                    centerTitle
                    orientation="horizontal"
                    style={{
                      border: { stroke: "black" },
                      labels: { fontSize: 15 },
                    }}
                    data={[
                      {
                        name: "Patients",
                        symbol: { fill: "#65A19F" },
                      },
                    ]}
                  />
                </VictoryChart>
              )}
            </div>
            <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-4 p-4 h-full">
              <h2 className="text-lg font-semibold">Datewise Scans</h2>
              {data.uploadScansDateWiseData && (
                <VictoryChart width={600} height={350} domainPadding={50}>
                  <VictoryAxis
                    tickFormat={(date) => {
                      const convertedDate = new Date(date);
                      return `${
                        convertedDate.getMonth() + 1
                      }/${convertedDate.getDate()}`;
                    }}
                    tickCount={5}
                    style={{
                      tickLabels: { fontSize: 10 },
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => parseInt(x, 10)}
                  />
                  <VictoryLegend
                    x={350}
                    y={0}
                    orientation="horizontal"
                    style={{
                      border: { stroke: "black" },
                      labels: { fontSize: 15 },
                    }}
                    data={[
                      {
                        name: "Number of Scans",
                        symbol: { fill: "#65A19F" },
                      },
                    ]}
                  />
                  <VictoryBar
                    data={data.uploadScansDateWiseData}
                    x="date"
                    y="value"
                    style={{ data: { fill: "#65A19F" } }}
                  />
                </VictoryChart>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-4 p-4 h-full">
              <h2 className="text-lg font-semibold">Datewise Patient Entry</h2>
              {data.createdDateWiseData && (
                <VictoryChart domainPadding={50} width={600} height={350}>
                  <VictoryAxis
                    tickFormat={(date) => {
                      const convertedDate = new Date(date);
                      return `${
                        convertedDate.getMonth() + 1
                      }/${convertedDate.getDate()}`;
                    }}
                    tickCount={5}
                    style={{
                      tickLabels: { fontSize: 10 },
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => parseInt(x, 10)}
                  />
                  <VictoryLegend
                    x={350}
                    y={0}
                    centerTitle
                    orientation="horizontal"
                    style={{
                      border: { stroke: "black" },
                      labels: { fontSize: 15 },
                    }}
                    data={[
                      {
                        name: "Number of Patients",
                        symbol: { fill: "#65A19F" },
                      },
                    ]}
                  />
                  <VictoryBar
                    data={data.createdDateWiseData}
                    x="date"
                    y="value"
                    style={{ data: { fill: "#65A19F" } }}
                  />
                </VictoryChart>
              )}
            </div>
            <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-4 p-4 h-full">
              <h2 className="text-lg font-semibold">Epilepsy Status</h2>
              <VictoryChart width={600} height={350} domainPadding={50}>
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                  }}
                />
                <VictoryLegend
                  x={350}
                  y={0}
                  centerTitle
                  orientation="horizontal"
                  style={{
                    border: { stroke: "black" },
                    labels: { fontSize: 15 },
                  }}
                  data={[
                    {
                      name: "Positive",
                      symbol: { fill: "#65A19F" },
                    },
                    { name: "Negative", symbol: { fill: "#E49B42" } },
                  ]}
                />
                <VictoryPie
                  data={[
                    { x: "Positive", y: data.epilepsyPatient },
                    { x: "Negative", y: data.nonEpilepsyCount },
                  ]}
                  style={{
                    labels: {
                      fontSize: 15,
                      fontWeight: 600,
                    },
                  }}
                  colorScale={["#65A19F", "#E49B42"]}
                  labelComponent={
                    <VictoryLabel
                      text={({ datum }) => [`${datum.x}: ${datum.y}`]}
                    />
                  }
                />
              </VictoryChart>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
