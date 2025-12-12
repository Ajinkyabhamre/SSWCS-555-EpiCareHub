import axios from "axios";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  // Prepare chart data
  // Age groups data - map from backend format
  const ageData = (data.ageGroupsData || []).map(item => ({
    label: item.ageGroup,
    count: item.number || 0
  }));

  // Scan volume data - format dates
  const scanVolumeData = (data.uploadScansDateWiseData || []).map(item => {
    try {
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: formattedDate !== "Invalid Date" ? formattedDate : item.date,
        count: item.value || 0,
      };
    } catch {
      return {
        date: item.date || "",
        count: item.value || 0,
      };
    }
  });

  // New patients data - format dates
  const newPatientsData = (data.createdDateWiseData || []).map(item => {
    try {
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: formattedDate !== "Invalid Date" ? formattedDate : item.date,
        count: item.value || 0,
      };
    } catch {
      return {
        date: item.date || "",
        count: item.value || 0,
      };
    }
  });

  // Pie chart data for epilepsy diagnosis
  const epilepsyPieData = [
    { name: "Epilepsy", value: data.epilepsyPatient || 0 },
    { name: "Non-epilepsy", value: data.nonEpilepsyCount || 0 },
  ];

  const PIE_COLORS = {
    light: ["#10b981", "#e5e7eb"],
    dark: ["#10b981", "#475569"]
  };

  // Custom tooltip with proper dark/light mode support
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg backdrop-blur-sm">
          <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-1.5">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{entry.name}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty state component
  const EmptyChartState = ({ message }) => (
    <div className="flex h-60 items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {message || "No data yet. Add patients to see this chart."}
        </p>
      </div>
    </div>
  );

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
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Patient age distribution
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                How patients are distributed across age groups.
              </p>
            </div>
            {ageData.length === 0 ? (
              <EmptyChartState message="No patient age data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ageData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.15)"
                    className="dark:opacity-40"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    name="Patients"
                    className="transition-opacity hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Epilepsy Status Pie Chart */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Epilepsy diagnosis
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Patient distribution by diagnosis status.
              </p>
            </div>
            {(data.epilepsyPatient || 0) + (data.nonEpilepsyCount || 0) === 0 ? (
              <EmptyChartState message="No diagnosis data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={epilepsyPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {epilepsyPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#10b981' : '#64748b'}
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '13px'
                    }}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Secondary Charts Grid - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Scan Volume Over Time */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Scan volume over time
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                EEG scans performed by date.
              </p>
            </div>
            {scanVolumeData.length === 0 ? (
              <EmptyChartState message="No scan data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scanVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.15)"
                    className="dark:opacity-40"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    name="Scans"
                    className="transition-opacity hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* New Patients Over Time */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                New patients over time
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Patient enrollment by date.
              </p>
            </div>
            {newPatientsData.length === 0 ? (
              <EmptyChartState message="No enrollment data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={newPatientsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.15)"
                    className="dark:opacity-40"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                    name="New Patients"
                    className="transition-opacity"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
