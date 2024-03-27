import { useEffect, useState } from "react";
import axios from "axios";
import { TextField, Button } from "@mui/material";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import moment from "moment";

const PatientForm = ({ onSubmit, patient }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
  });
  const [error, setError] = useState("");

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
    <div className="flex justify-center">
      <form
        className="form-container flex flex-col p-5 gap-4"
        onSubmit={handleSubmit}
      >
        <div>
          <TextField
            id="firstName"
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <TextField
            id="lastName"
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <TextField
            id="dob"
            label="Date of Birth"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              max: moment().format("YYYY-MM-DD"),
            }}
            required
          />
        </div>
        <div>
          <FormControl fullWidth>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              {genderOptions.map((option) => (
                <MenuItem key={option.value} value={option.label}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div>
          <TextField
            id="email"
            label="Email"
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="todo-errors">{error && <span>{error}</span>}</div>
        <Button type="submit">{patient ? "Update" : "Submit"}</Button>
      </form>
    </div>
  );
};

export default PatientForm;
