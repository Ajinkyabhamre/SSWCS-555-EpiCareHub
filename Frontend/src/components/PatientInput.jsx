import { useEffect, useState } from "react";
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
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
  const [message, setMessage] = useState("Successfully Added Patient");
  const [open, setOpen] = useState(false);

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

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await validateForm();
    if (data)
      axios.post("http://localhost:3000/patients", data).then((res) => {
        setOpen(true);
        setFormData({
          firstName: "",
          lastName: "",
          dob: "",
          address: "",
          contact: "",
        });
      });
  };

  return (
    <div className="page-container">
      <Typography variant="h4">Patient Information Form</Typography>  
      <form className="form-container" onSubmit={handleSubmit}>
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
          <TextField
            id="address"
            label="Address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <TextField
            id="contact"
            label="Contact"
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </div>
        <div className="todo-errors">{error && <span>{error}</span>}</div>
        <Button type="submit">Submit</Button>
      </form>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        message={message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default PatientInput;
