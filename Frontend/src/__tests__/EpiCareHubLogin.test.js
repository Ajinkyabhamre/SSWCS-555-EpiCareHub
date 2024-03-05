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

  test('submits form with valid credentials', () => {
    const mockNavigate = useNavigate();

    render(<Router><Signin /></Router>);
    
    // Fill out form with valid credentials
    userEvent.type(screen.getByLabelText('username'), 'validUsername');
    userEvent.type(screen.getByLabelText('password'), 'validPassword');

    // Submit form
    act(() => {
      fireEvent.click(screen.getByText('Submit'));
    });

    // Assert navigation and error message absence
    expect(mockNavigate).toHaveBeenCalledWith('/home');
    expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument();
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

  test('clears input fields on focus', async () => {
    render(<Router><Signin /></Router>);

    // Focus on username field
  await userEvent.click(screen.getByLabelText('username'));
  expect(screen.getByLabelText('username').value).toBe('');

  // Focus on password field
  await userEvent.click(screen.getByLabelText('password'));
  expect(screen.getByLabelText('password').value).toBe('');
  });
});

{/*
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});

test('renders Signin component', () => {
  render(
    <Router> 
      <Signin />
    </Router>
  );
  
  // Check that the Signin component renders
  expect(screen.getByText('Sign In')).toBeInTheDocument();
});

test('submits form with valid credentials', () => {
  const mockNavigate = useNavigate();
  
  render(
    <Router> 
      <Signin />
    </Router>
  );
  
  // Mock navigate function
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));


  // Fill out the form
  userEvent.type(screen.getByLabelText('username'), 'user1');
  userEvent.type(screen.getByLabelText('password'), 'password@123');

  // Submit the form
  act(() => {
    fireEvent.click(screen.getByText('Submit'));
  });

  // Check that the navigation occurred
  console.log('mockNavigate calls:', mockNavigate.mock.calls);

  // Update component state (assuming the component stores login state)
  /*render(<Signin isLoggedIn={true} />); // Pass updated state or utilize state setter

  // Check navigation and error message clearing
  expect(mockNavigate).toHaveBeenCalledWith('/home');
  expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument();

  // Check that the navigation occurred
  //expect(mockNavigate).toHaveBeenCalledWith('/home');
});

test('displays error message with invalid credentials', () => {
    render(
      <Router> 
        <Signin />
      </Router>
    );

    // Fill out the form with invalid credentials
    userEvent.type(screen.getByLabelText('username'), 'user2');
    userEvent.type(screen.getByLabelText('password'), 'passw@123');
  
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
  
    // Check that the error message is displayed
    expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
  });
*/}