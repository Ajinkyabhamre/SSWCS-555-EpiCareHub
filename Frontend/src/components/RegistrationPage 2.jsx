import { useEffect, useState } from "react";
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
//import moment from "moment";

const UserInput = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Successfully Added User");
  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const emailRegex =
    /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/;

  const validateForm = async () => {
    const data = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      username: formData.username?.trim(),
      //dob: moment(formData.dob).format("MM/DD/YYYY"),
      email: formData.email?.trim(),
      password: formData.password?.trim(),
    };
    if (!data.firstName) {
      setError("First Name is invalid!");
      return;
    }
    if (!data.lastName) {
      setError("Last Name is invalid!");
      return;
    }
    if (!data.username) {
      setError("username is invalid!");
      return;
    }
    if (!emailRegex.test(data.email)) {
      setError("Invalid Email!");
      return;
    }
    if (!data.password) {
      setError("password is invalid!");
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
      axios.post("http://localhost:3000/users", data).then((res) => {
        setOpen(true);
        setFormData({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          password: "",
        });
      });
  };

  return (
    <div className="page-container">
      <Typography variant="h4">Register</Typography>
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
            id="username"
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            // InputLabelProps={{
            //   shrink: true,
            // }}
            // inputProps={{
            //   max: moment().format("YYYY-MM-DD"),
            // }}
            required
          />
        </div>
        <div>
          <TextField
            id="email"
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <TextField
            id="password"
            label="Password"
            type="password"
            name="password"
            value={formData.password}
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

export default UserInput;
