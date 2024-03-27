import { useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import moment from "moment";
import { Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GenerateIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";

const DataTableComponent = ({ data, onEditClick, onDeleteClick }) => {
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    gender: "All",
    isEpilepsy: "All",
  });
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

  const filteredData = useMemo(() => {
    let filtered = data;

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

    return filtered;
  }, [data, filters]);

  const dobBodyTemplate = (rowData) =>
    moment(rowData.dob, "MM/DD/YYYY").format("DD MMM YYYY");

  const genderBodyTemplate = (rowData) => {
    let genderText = "Others";
    let genderColorClass = "text-gray-700";

    if (typeof rowData.gender === "string") {
      if (rowData.gender?.toLowerCase() === "male") {
        genderText = "Male";
        genderColorClass = "text-blue-500";
      } else if (rowData.gender?.toLowerCase() === "female") {
        genderText = "Female";
        genderColorClass = "text-pink-500";
      } else if (rowData.gender?.toLowerCase() === "prefer not to say") {
        genderText = "Prefer Not to Say";
        genderColorClass = "text-gray-500";
      }
    }

    return (
      <span className={`font-semibold ${genderColorClass}`}>{genderText}</span>
    );
  };

  const epilepsyBodyTemplate = (rowData) => {
    const badgeClass = rowData.isEpilepsy
      ? "bg-green-600 text-white"
      : "bg-gray-600 text-white";

    const badgeText = rowData.isEpilepsy ? "Epilepsy" : "No Epilepsy";

    return (
      <span className={`inline-block px-2 py-1 rounded-full ${badgeClass}`}>
        {badgeText}
      </span>
    );
  };

  const actionTemplate = (rowData) => (
    <div className="flex justify-around">
      <Tooltip title="Edit" arrow>
        <EditIcon
          className="cursor-pointer text-blue-800"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(rowData);
          }}
        />
      </Tooltip>
      <Tooltip title="Delete" arrow>
        <DeleteIcon
          className="cursor-pointer text-red-800"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(rowData);
          }}
        />
      </Tooltip>
      <Tooltip title="Generate Epilepsy" arrow>
        <GenerateIcon
          className="cursor-pointer text-green-800"
          onClick={(e) => {
            e.stopPropagation();
            // console.log(rowData);
          }}
        />
      </Tooltip>
    </div>
  );

  const handleFilterChange = (filterKey, value) => {
    setFilters({ ...filters, [filterKey]: value });
  };

  const handleRowClick = (rowData) => {
    navigate(`/patient/${rowData.data._id}`);
  };

  return (
    <div className="datatable-responsive">
      <DataTable
        value={filteredData}
        className="p-datatable-sm"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 15]}
        filterDisplay="row"
        onRowClick={handleRowClick}
      >
        <Column
          field="firstName"
          header="First Name"
          filter
          filterElement={
            <InputText
              value={filters.firstName}
              onChange={(e) => handleFilterChange("firstName", e.target.value)}
              placeholder="Filter by First Name"
            />
          }
        />
        <Column
          field="lastName"
          header="Last Name"
          filter
          filterElement={
            <InputText
              value={filters.lastName}
              onChange={(e) => handleFilterChange("lastName", e.target.value)}
              placeholder="Filter by Last Name"
            />
          }
        />
        <Column
          field="dob"
          header="DOB"
          dataType="date"
          body={dobBodyTemplate}
          // filter
          // filterElement={<InputText placeholder="Filter by DOB" />}
        />
        <Column
          field="gender"
          header="Gender"
          body={genderBodyTemplate}
          filter
          filterElement={
            <Dropdown
              options={genderOptions}
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.value)}
              placeholder="Filter by Gender"
            />
          }
        />
        <Column field="email" header="Email" />
        <Column
          field="isEpilepsy"
          header="Is Epilepsy"
          body={epilepsyBodyTemplate}
          filter
          filterElement={
            <Dropdown
              options={epilepsyOptions}
              value={filters.isEpilepsy}
              onChange={(e) => handleFilterChange("isEpilepsy", e.value)}
              placeholder="Filter by Is Epilepsy"
            />
          }
        />
        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
};

export default DataTableComponent;
