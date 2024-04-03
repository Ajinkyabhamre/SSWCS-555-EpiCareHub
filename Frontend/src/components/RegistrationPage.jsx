import React, { useState } from "react";
import {
  TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem, Snackbar, IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

const UserInput = () => {
  const actualSecretKey = "epicare";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    userType: "user",
    secretKey: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    // Validation logic here

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      
      axios.post("http://localhost:3000/users", formData)
        .then(response => {
          console.log(response.data);
          setOpenSnackbar(true);
          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            password: "",
            userType: "user",
            secretKey: "",
          });
        })
        .catch(error => {
          console.error("There was an error!", error);
        });
    }
  };

  const handleCloseSnackbar = (reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <div className="page-container" style={{ maxWidth: '500px', margin: 'auto' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Register
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="First Name"
          variant="outlined"
          fullWidth
          margin="normal"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={!!fieldErrors.firstName}
          helperText={fieldErrors.firstName}
          required
        />
        <TextField
          label="Last Name"
          variant="outlined"
          fullWidth
          margin="normal"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={!!fieldErrors.lastName}
          helperText={fieldErrors.lastName}
          required
        />
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          margin="normal"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={!!fieldErrors.username}
          helperText={fieldErrors.username}
          required
        />
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          required
          type="email"
        />
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          margin="normal"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          required
          type="password"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>User Type</InputLabel>
          <Select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            required
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        {formData.userType === 'admin' && (
          <TextField
            label="Secret Key"
            variant="outlined"
            fullWidth
            margin="normal"
            name="secretKey"
            value={formData.secretKey}
            onChange={handleChange}
            error={!!fieldErrors.secretKey}
            helperText={fieldErrors.secretKey || "Required for admin registration"}
            required
          />
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          Register
        </Button>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Registration Successful!"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default UserInput;
