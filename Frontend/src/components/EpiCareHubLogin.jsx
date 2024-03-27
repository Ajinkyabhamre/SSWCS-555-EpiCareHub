import React, { useState } from "react";
import md5 from "md5";
import { useNavigate } from "react-router-dom";
import validCredentials from "./validCredentials";
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
//import useAuth from './useAuth';

const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem("isLoggedIn", true);
    navigate("/");
    // if (
    //   username === validCredentials.username &&
    //   md5(password) === validCredentials.password
    // ) {
    //   // Login successful
    //   //login();
    //   localStorage.setItem("isLoggedIn", true);
    //   navigate("/");
    // } else {
    //   setError("Invalid username or password");
    // }
  };

  return (
    <div className="page-container">
      <Typography variant="h4" align="center">
        Sign In
      </Typography>
      <form className="form-container" onSubmit={handleSubmit}>
        <div>
          <TextField
            type="text"
            id="username"
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <TextField
            type="password"
            id="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
      <p className="error" style={{ color: "red" }}>
        {error}
      </p>
    </div>
  );
};

export default Signin;
