import React, { useState } from 'react';
import md5 from 'md5';
import { useNavigate, Link } from 'react-router-dom'; // Import Link here
import validCredentials from './validCredentials';
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const Signin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false); // State to control Snackbar visibility
  const navigate = useNavigate();

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false); // Close the Snackbar
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (true) {
      // If login is successful
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/home'); // Navigate to home page
    } else {
      setError('Invalid username or password');
      setOpen(true); // Show error in Snackbar
    }
  };

  return (
    <div className="page-container">
      <Typography variant="h4" align='center'>Sign In</Typography>
      <form className="form-container" onSubmit={handleSubmit}>
        <TextField
          label="Username"
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={() => setUsername('')}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPassword('')}
          required
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Submit
        </Button>
        <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: '16px' }}>
          Not registered ? <Link to="/register" style={{ textDecoration: 'none' }}>Register </Link>
        </Typography>
      </form>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        message={error}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default Signin;
