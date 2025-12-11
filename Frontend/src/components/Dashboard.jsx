import axios from "axios";
import { useEffect, useState } from "react";
import BarChart from "./charts/BarChart";
import PieChart from "./charts/PieChart";

export const KPICard = ({ label, value }) => {
  return (
    <div className="group rounded-2xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
          {/* Header skeleton */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="h-8 sm:h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-48 sm:w-64 mb-2 animate-pulse" />
            <div className="h-4 sm:h-5 bg-gray-100 dark:bg-slate-800 rounded w-64 sm:w-96 animate-pulse" />
          </div>
          {/* KPI skeleton */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 h-28 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 h-80 sm:h-72 md:h-80 lg:h-96 animate-pulse"
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 max-w-md w-full shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Unable to load dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error}. Please check your connection or try again.
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

  // Empty state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No data available</p>
          <button
            onClick={fetchData}
            className="rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-all duration-200"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Clinical overview
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Track patient volume, scan activity, and epilepsy diagnosis at a glance.
          </p>
        </div>

        {/* KPI Cards - Responsive Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8 md:mb-10">
          <KPICard label="Total Patients" value={data.totalPatients} />
          <KPICard label="Total Scans" value={data.totalScans} />
          <KPICard label="Epilepsy Patients" value={data.epilepsyPatient} />
          <KPICard label="Non-Epilepsy Patients" value={data.nonEpilepsyCount} />
        </div>

        {/* Main Charts Grid - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2 mb-4 sm:mb-6">
          {/* Age Distribution Chart */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="h-80 sm:h-72 md:h-80 lg:h-96">
              <BarChart
                data={data.ageGroupsData || []}
                xKey="ageGroup"
                yKey="number"
                title="Patient age distribution"
                description="How patients are distributed across age groups."
                height={320}
              />
            </div>
          </div>

          {/* Epilepsy Status Pie Chart */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="h-80 sm:h-72 md:h-80 lg:h-96">
              <PieChart
                data={[
                  { x: "Epilepsy", y: data.epilepsyPatient || 0 },
                  { x: "Non-epilepsy", y: data.nonEpilepsyCount || 0 },
                ]}
                title="Epilepsy diagnosis"
                description="Patient distribution by diagnosis status."
                height={320}
              />
            </div>
          </div>
        </div>

        {/* Secondary Charts Grid - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Scan Volume Over Time */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="h-80 sm:h-72 md:h-80 lg:h-96">
              <BarChart
                data={(data.uploadScansDateWiseData || []).map((d) => {
                  try {
                    const dateObj = new Date(d.date);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    return {
                      date: formattedDate !== "Invalid Date" ? formattedDate : d.date,
                      value: d.value || 0,
                    };
                  } catch {
                    return {
                      date: d.date || "",
                      value: d.value || 0,
                    };
                  }
                })}
                xKey="date"
                yKey="value"
                title="Scan volume over time"
                description="EEG scans performed by date."
                height={320}
              />
            </div>
          </div>

          {/* New Patients Over Time */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="h-80 sm:h-72 md:h-80 lg:h-96">
              <BarChart
                data={(data.createdDateWiseData || []).map((d) => {
                  try {
                    const dateObj = new Date(d.date);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    return {
                      date: formattedDate !== "Invalid Date" ? formattedDate : d.date,
                      value: d.value || 0,
                    };
                  } catch {
                    return {
                      date: d.date || "",
                      value: d.value || 0,
                    };
                  }
                })}
                xKey="date"
                yKey="value"
                title="New patients over time"
                description="Patient enrollment by date."
                height={320}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
