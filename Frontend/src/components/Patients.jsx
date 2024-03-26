import React, { useCallback, useMemo, useEffect } from "react";
import { useTable, useFilters } from "react-table";
import DataTableComponent from "./DataTableComponent";

const Patients = () => {
  const data = [
    {
      firstName: "Hines",
      lastName: "Fowler",
      dob: "22/4/1995",
      gender: "Male",
      email: "hinesfowler@buzzness.com",
      isEpilepsy: true,
    },
  ];

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 ease-in-out">
      <DataTableComponent data={data} />
    </div>
  );
};

export default Patients;
