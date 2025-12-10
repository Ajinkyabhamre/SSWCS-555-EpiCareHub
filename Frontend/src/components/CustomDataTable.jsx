import { useMemo, useState } from "react";
import moment from "moment";
import { Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";

const CustomDataTable = ({
  data,
  onEditClick,
  onDeleteClick,
}) => {
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    gender: "All",
    isEpilepsy: "All",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const navigate = useNavigate();

  const genderOptions = [
    { label: "All", value: "All" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Others", value: "Others" },
    { label: "Prefer Not to Say", value: "Prefer Not to Say" },
  ];

  const epilepsyOptions = [
    { label: "All", value: "All" },
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply filters
    if (filters.firstName) {
      filtered = filtered.filter((item) =>
        item.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
      );
    }
    if (filters.lastName) {
      filtered = filtered.filter((item) =>
        item.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
      );
    }
    if (filters.gender !== "All") {
      filtered = filtered.filter((item) => item.gender === filters.gender);
    }
    if (filters.isEpilepsy !== "All") {
      filtered = filtered.filter(
        (item) => item.isEpilepsy === (filters.isEpilepsy === true)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleRowClick = (patient) => {
    navigate(`/patient/${patient._id}`);
  };

  const formatDOB = (dob) => {
    return moment(dob, "MM/DD/YYYY").format("DD MMM YYYY");
  };

  const getGenderStyles = (gender) => {
    const genderLower = gender?.toLowerCase();
    if (genderLower === "male") {
      return "text-blue-600 dark:text-blue-400";
    } else if (genderLower === "female") {
      return "text-pink-600 dark:text-pink-400";
    } else if (genderLower === "prefer not to say") {
      return "text-slate-500 dark:text-slate-400";
    }
    return "text-slate-700 dark:text-slate-300";
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-slate-400 dark:text-slate-600">⇅</span>;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUpwardIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowDownwardIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First Name Filter */}
        <div className="relative">
          <input
            type="text"
            value={filters.firstName}
            onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
            placeholder="Search first name..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
        </div>

        {/* Last Name Filter */}
        <div className="relative">
          <input
            type="text"
            value={filters.lastName}
            onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
            placeholder="Search last name..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
        </div>

        {/* Gender Filter */}
        <select
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all cursor-pointer"
        >
          {genderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Epilepsy Filter */}
        <select
          value={filters.isEpilepsy}
          onChange={(e) => {
            const value = e.target.value === "true" ? true : e.target.value === "false" ? false : "All";
            setFilters({ ...filters, isEpilepsy: value });
          }}
          className="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all cursor-pointer"
        >
          {epilepsyOptions.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-emerald-100 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-emerald-50 dark:bg-slate-700/50">
            <tr>
              <th
                onClick={() => handleSort("firstName")}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  First Name
                  <SortIcon columnKey="firstName" />
                </div>
              </th>
              <th
                onClick={() => handleSort("lastName")}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Last Name
                  <SortIcon columnKey="lastName" />
                </div>
              </th>
              <th
                onClick={() => handleSort("dob")}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  DOB
                  <SortIcon columnKey="dob" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Gender
              </th>
              <th
                onClick={() => handleSort("email")}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Email
                  <SortIcon columnKey="email" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Diagnosis
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-emerald-100 dark:divide-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((patient, index) => (
                <tr
                  key={patient._id || index}
                  onClick={() => handleRowClick(patient)}
                  className="hover:bg-emerald-50/30 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {patient.firstName}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {patient.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDOB(patient.dob)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${getGenderStyles(patient.gender)}`}>
                    {patient.gender}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {patient.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        patient.isEpilepsy
                          ? "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
                          : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {patient.isEpilepsy ? "Epilepsy" : "No Epilepsy"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Tooltip title="Edit" arrow>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(patient);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-colors"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(patient);
                          }}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors"
                        >
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-medium">No patients found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {processedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, processedData.length)} of{" "}
              {processedData.length} patients
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and adjacent pages
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-slate-400 dark:text-slate-600">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 rounded-lg font-semibold text-sm transition-all ${
                      currentPage === page
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white"
                        : "bg-white dark:bg-slate-700 border border-emerald-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-emerald-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDataTable;
