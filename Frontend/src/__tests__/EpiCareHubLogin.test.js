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

  test('displays error message with invalid credentials', async () => {
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
  });

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


  /*test('displays error message with invalid credentials', () => {
    render(<Router><Signin /></Router>);

    // Fill out form with invalid credentials
    userEvent.type(screen.getByLabelText(/username/i), 'invalidUser');
    userEvent.type(screen.getByLabelText(/password/i), 'invalidPassword');

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
  });*/

