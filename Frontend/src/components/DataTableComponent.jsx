import React, { useMemo, useState } from "react";
import { useTable, useFilters } from "react-table";
import { TextField, MenuItem } from "@mui/material";
import moment from "moment";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const DataTableComponent = ({ data }) => {
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    gender: "All",
    isEpilepsy: "All",
  });

  const handleFilterChange = (filterKey, value) => {
    setFilters({ ...filters, [filterKey]: value });
  };

  const columns = useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "firstName",
        Filter: ({ column }) => (
          <TextField
            value={filters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            placeholder="Filter by First Name"
            className="p-2"
          />
        ),
      },
      {
        Header: "Last Name",
        accessor: "lastName",
        Filter: ({ column }) => (
          <TextField
            value={filters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            placeholder="Filter by Last Name"
            className="p-2"
          />
        ),
      },
      {
        Header: "DOB",
        accessor: "dob",
        Cell: ({ value }) => moment(value, "DD/MM/YYYY").format("DD MMM YYYY"),
      },
      {
        Header: "Gender",
        accessor: "gender",
        Filter: ({ column }) => (
          <TextField
            select
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            placeholder="Filter by Gender"
            className="p-2"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </TextField>
        ),
        Cell: ({ value }) =>
          value === "Male" ? (
            <MaleIcon color="primary" />
          ) : (
            <FemaleIcon color="primary" />
          ),
      },
      { Header: "Email", accessor: "email" },
      {
        Header: "Is Epilepsy",
        accessor: "isEpilepsy",
        Filter: ({ column }) => (
          <TextField
            select
            value={filters.isEpilepsy}
            onChange={(e) => handleFilterChange("isEpilepsy", e.target.value)}
            placeholder="Filter by Is Epilepsy"
            className="p-2"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value={true}>Yes</MenuItem>
            <MenuItem value={false}>No</MenuItem>
          </TextField>
        ),
        Cell: ({ value }) =>
          value ? <CheckCircleIcon color="success" /> : null,
      },
    ],
    [filters]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      filterTypes: {
        text: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = row.values[id];
            return rowValue !== undefined
              ? String(rowValue)
                  .toLowerCase()
                  .includes(filterValue.toLowerCase())
              : true;
          });
        },
        select: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = row.values[id];
            return filterValue === "" || String(rowValue) === filterValue;
          });
        },
      },
    },
    useFilters
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <div className="overflow-x-auto">
      <table
        {...getTableProps()}
        className="min-w-full divide-y divide-gray-200 bg-white shadow overflow-hidden sm:rounded-lg"
      >
        <thead className="bg-eh-2">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  key={column.id}
                  {...column.getHeaderProps()}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.Header}
                  <div>{column.Filter ? column.render("Filter") : null}</div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody
          {...getTableBodyProps()}
          className="bg-white divide-y divide-gray-200"
        >
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr key={row.id} {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td
                    key={cell.column.id}
                    {...cell.getCellProps()}
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTableComponent;
