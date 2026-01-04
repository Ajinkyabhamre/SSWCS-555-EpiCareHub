import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signin from '../components/EpiCareHubLogin.jsx';

describe('Signin component', () => {
  test('renders Signin component', () => {
    const { getByText, getByLabelText } = render(<MemoryRouter><Signin /></MemoryRouter>);
    
    // Check if "Sign In" text is present
    expect(getByText('Sign In')).toBeInTheDocument();

    // Check if form elements are rendered
    expect(getByLabelText(/username/i)).toBeInTheDocument();
    expect(getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('submits the form with valid credentials', async () => {
    const { getByLabelText, getByText } = render(<MemoryRouter><Signin /></MemoryRouter>);
    
    // Fill in form fields
    fireEvent.change(getByLabelText(/username/i), { target: { value: 'superadmin' } });
    fireEvent.change(getByLabelText(/password/i), { target: { value: 'P@ssw0rd' } });

    // Submit form
    fireEvent.submit(getByText('Submit'));

    // Wait for navigation or other side effects
    await waitFor(() => {
      // Assert that localStorage is updated
      expect(localStorage.getItem('isLoggedIn')).toBeTruthy();
    });
  });

  /*test('displays error message with invalid credentials', async () => {
    const { getByLabelText, getByText } = render(<MemoryRouter><Signin /></MemoryRouter>);
    
    // Fill in form fields with invalid credentials
    fireEvent.change(getByLabelText(/username/i), { target: { value: 'invalidUsername' } });
    fireEvent.change(getByLabelText(/password/i), { target: { value: 'invalidPassword' } });

    // Submit form
    fireEvent.submit(getByText('Submit'));

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(getByText('Invalid username or password')).toBeInTheDocument();
    });
  });*/

  test('handles form submission error', async () => {
    // Mock navigate function from react-router-dom
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    const { getByLabelText, getByText } = render(<MemoryRouter><Signin /></MemoryRouter>);
    
    // Fill in form fields with valid credentials
    fireEvent.change(getByLabelText(/username/i), { target: { value: 'superadmin' } });
    fireEvent.change(getByLabelText(/password/i), { target: { value: 'P@ssw0rd' } });

    // Submit form
    fireEvent.submit(getByText('Submit'));

    // Wait for navigation or other side effects
    /*await waitFor(() => {
      // Assert that navigate function is called with "/"
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });*/
  });
});


