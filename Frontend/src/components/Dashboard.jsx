import axios from "axios";
import { useEffect, useState } from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryPie,
  VictoryLabel,
} from "victory";

export const KPICard = ({ label, value }) => {
  return (
    <div className="group rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-emerald-600">
        {Math.max(0, value || 0)}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${apiUrl}/patients/statistics`,
      headers: {},
    };

    axios
      .request(config)
      .then((response) => {
        const tempData = response.data;
        // Normalize data: handle totatScans typo by checking both fields
        if (!tempData.totalScans && tempData.totatScans) {
          tempData.totalScans = tempData.totatScans;
        }
        // Ensure arrays exist and have defaults
        tempData.ageGroupsData = tempData.ageGroupsData || [];
        tempData.uploadScansDateWiseData = tempData.uploadScansDateWiseData || [];
        tempData.createdDateWiseData = tempData.createdDateWiseData || [];
        setData(tempData);
      })
      .catch((error) => {
        setError(error.message || "Failed to load dashboard data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    return () => {
      setData(null);
    };
  }, []);

  // Loading state with skeleton UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
          {/* Header skeleton */}
          <div className="mb-10">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded w-96 animate-pulse" />
          </div>
          {/* KPI skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-emerald-50 bg-white p-6 h-28 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-emerald-50 bg-white p-6 h-96 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 bg-white p-8 max-w-md w-full shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Unable to load dashboard
          </h2>
          <p className="text-slate-600 mb-6">
            {error}. Please check your connection or try again.
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

  // Empty state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No data available</p>
          <button
            onClick={fetchData}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Clinical overview
          </h1>
          <p className="text-slate-600">
            Track patient volume, scan activity, and epilepsy diagnosis at a glance.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPICard label="Total Patients" value={data.totalPatients} />
          <KPICard label="Total Scans" value={data.totalScans} />
          <KPICard label="Epilepsy Patients" value={data.epilepsyPatient} />
          <KPICard label="Non-Epilepsy Patients" value={data.nonEpilepsyCount} />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Age Distribution Chart */}
          <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Patient age distribution
              </h2>
              <p className="text-sm text-slate-600">
                How patients are distributed across age groups.
              </p>
            </div>
            {data.ageGroupsData && data.ageGroupsData.length > 0 ? (
              <div style={{ height: "320px" }}>
                <VictoryChart width={500} height={320} domainPadding={40}>
                  <VictoryAxis
                    style={{ tickLabels: { fontSize: 12 } }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => parseInt(x, 10)}
                  />
                  <VictoryBar
                    data={data.ageGroupsData}
                    x="ageGroup"
                    y="number"
                    style={{ data: { fill: "#10b981" } }}
                  />
                </VictoryChart>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </div>

          {/* Epilepsy Status Pie Chart */}
          <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Epilepsy diagnosis
              </h2>
              <p className="text-sm text-slate-600">
                Patient distribution by diagnosis status.
              </p>
            </div>
            {data.epilepsyPatient !== undefined && data.nonEpilepsyCount !== undefined ? (
              <div style={{ height: "320px" }}>
                <VictoryChart width={500} height={320}>
                  <VictoryPie
                    data={[
                      { x: "Epilepsy", y: data.epilepsyPatient },
                      { x: "Non-epilepsy", y: data.nonEpilepsyCount },
                    ]}
                    colorScale={["#10b981", "#f3f4f6"]}
                    style={{
                      labels: { fontSize: 14, fontWeight: 600, fill: "#1f2937" },
                    }}
                    labelComponent={
                      <VictoryLabel
                        text={({ datum }) => [`${datum.x}: ${datum.y}`]}
                      />
                    }
                  />
                </VictoryChart>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Secondary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scan Volume Over Time */}
          <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Scan volume over time
              </h2>
              <p className="text-sm text-slate-600">
                EEG scans performed by date.
              </p>
            </div>
            {data.uploadScansDateWiseData && data.uploadScansDateWiseData.length > 0 ? (
              <div style={{ height: "320px" }}>
                <VictoryChart width={500} height={320} domainPadding={40}>
                  <VictoryAxis
                    tickFormat={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    tickCount={5}
                    style={{ tickLabels: { fontSize: 11 } }}
                  />
                  <VictoryAxis dependentAxis tickFormat={(x) => parseInt(x, 10)} />
                  <VictoryBar
                    data={data.uploadScansDateWiseData}
                    x="date"
                    y="value"
                    style={{ data: { fill: "#10b981" } }}
                  />
                </VictoryChart>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </div>

          {/* New Patients Over Time */}
          <div className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                New patients over time
              </h2>
              <p className="text-sm text-slate-600">
                Patient enrollment by date.
              </p>
            </div>
            {data.createdDateWiseData && data.createdDateWiseData.length > 0 ? (
              <div style={{ height: "320px" }}>
                <VictoryChart width={500} height={320} domainPadding={40}>
                  <VictoryAxis
                    tickFormat={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    tickCount={5}
                    style={{ tickLabels: { fontSize: 11 } }}
                  />
                  <VictoryAxis dependentAxis tickFormat={(x) => parseInt(x, 10)} />
                  <VictoryBar
                    data={data.createdDateWiseData}
                    x="date"
                    y="value"
                    style={{ data: { fill: "#10b981" } }}
                  />
                </VictoryChart>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
