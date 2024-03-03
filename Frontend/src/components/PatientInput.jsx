import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";

const PatientInput = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    contact: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const usPhoneNumberRegex =
    /^(?:\+?1\s*(?:[.-]\s*)?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:#|x\.?)\s*\d{1,6})?$/;

  const validateForm = async () => {
    const data = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      dob: moment(formData.dob).format("MM/DD/YYYY"),
      address: formData.address?.trim(),
      contact: formData.contact?.trim(),
    };
    if (!data.firstName) {
      setError("First Name is invalid!");
      return;
    }
    if (!data.lastName) {
      setError("Last Name is invalid!");
      return;
    }
    if (!data.address) {
      setError("Address is invalid!");
      return;
    }
    if (!usPhoneNumberRegex.test(data.contact)) {
      setError("Invalid Contact! Please follow US standard");
      return;
    }
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
      axios.post("http://localhost:3000/paitents", data).then((res) => {
        console.log(res);
      });
    }
  };

  return (
    <div className="page-container">
      <h1>Patient Information Form</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="dob">Date of Birth:</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            max={moment().format("YYYY-MM-DD")}
            required
          />
        </div>
        <div>
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="contact">Contact:</label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </div>
        <div className="todo-errors">{error && <span>{error}</span>}</div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
export default PatientInput;
