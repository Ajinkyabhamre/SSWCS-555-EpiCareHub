import React, { useState } from 'react';
import md5 from 'md5';
import { useNavigate } from 'react-router-dom'; 
import validCredentials from './validCredentials';
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
//import useAuth from './useAuth';

const Signin = () => {
  const [username, setUsername] = useState('username');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 
  //const { login } = useAuth();

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    
      if (username === validCredentials.username && md5(password) === validCredentials.password) {
        // Login successful
        //login();
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/home');
      } else {
        setError('Invalid username or password');
      }

    };

  return (
    <div className="page-container" >
      <Typography variant="h4" align='center'>Sign In</Typography>
      <form className="form-container" onSubmit={handleSubmit}>
        <div>
          <TextField
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setUsername('')}
            className="text_input"
            required
          />
        </div>
        <div>
          <TextField
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPassword('')}
            className="text_input"
            required
          />
        </div>
        {/*<div className="todo-errors">{error && <span>{error}</span>}</div>*/}
        <Button type="submit">Submit</Button>
      </form>
      <p style={{ color: 'red' }}>{error}</p>
      <a className="link" href="/register">
        Sign Up
      </a>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
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

export default Signin;
