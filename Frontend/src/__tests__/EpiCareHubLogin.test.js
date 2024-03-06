import React from 'react';
import userEvent from '@testing-library/user-event';
import { TextField, Button, Typography } from "@mui/material";
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import * as ReactRouterDOM from 'react-router-dom'; 
import Signin from '../components/EpiCareHubLogin.jsx';
import { act } from '@testing-library/react';


// Mocking dependencies
jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});

// Mock the react-router-dom library
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');

  return {
    ...originalModule,
    useNavigate: jest.fn(),
  };
});

// Test cases
describe('Signin component', () => {
  test('renders Signin component', () => {
    render(<Router><Signin /></Router>);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('displays error message with invalid credentials', () => {
    render(<Router><Signin /></Router>);

    // Fill out form with invalid credentials
    userEvent.type(screen.getByLabelText('username'), 'invalidUser');
    userEvent.type(screen.getByLabelText('password'), 'invalidPassword');

    // Submit form
    act(() => {
      fireEvent.click(screen.getByText('Submit'));
    });

    // Check error message
    expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
  });

  test('renders link to register page', () => {
    render(<Router><Signin /></Router>);
  
    // Use querySelector to find the link element
    const link = screen.queryByText(/Sign Up/i); // Case-insensitive matching
  
    // Check if the link exists
    expect(link).toBeInTheDocument();
  
    // Check if the link has the correct class
    expect(link).toHaveClass('link');
  
    // Check if the link has the correct href attribute
    expect(link).toHaveAttribute('href', '/register');
  });
});
