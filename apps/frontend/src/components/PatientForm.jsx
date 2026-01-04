import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";

const PatientForm = ({ onSubmit, patient }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        dob: moment(patient.dob).format("YYYY-MM-DD"),
        gender: patient.gender,
        email: patient.email,
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
  };

  const genderOptions = [
    { label: "Male", value: 0 },
    { label: "Female", value: 1 },
    { label: "Others", value: 2 },
    { label: "Prefer Not to Say", value: 3 },
  ];
  const validateForm = async () => {
    const data = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      dob: moment(formData.dob).format("MM/DD/YYYY"),
      gender: formData.gender?.trim(),
      email: formData.email?.trim(),
    };
    if (!data.firstName) {
      setError("First Name is invalid!");
      return;
    }
    if (!data.lastName) {
      setError("Last Name is invalid!");
      return;
    }
    if (!data.gender) {
      setError("Gender is invalid!");
      return;
    }
    // if (!usPhoneNumberRegex.test(data.contact)) {
    //   setError("Invalid Contact! Please follow US standard");
    //   return;
    // }
    if (
      !moment(data.dob).isValid() ||
      moment(data.dob, "MM/DD/YYYY").isAfter(moment(), "day")
    ) {
      setError("Birth Date should be today or before");
      return;
    }
    setError("");
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await validateForm();
    if (data) {
      data.gender = genderOptions.find(
        (gender) => gender.label === data.gender
      ).value;
      onSubmit(patient ? { id: patient?._id, ...data } : data);
      setFormData({
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        email: "",
      });
    }
  };

  return (
    <div className="p-2">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </motion.div>
        )}

        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
            required
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
            required
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label
            htmlFor="dob"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            id="dob"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            max={moment().format("YYYY-MM-DD")}
            required
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Gender */}
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Gender <span className="text-rose-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select gender</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="patient@example.com"
            required
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 shadow-md shadow-emerald-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            {patient ? "Update Patient" : "Add Patient"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
