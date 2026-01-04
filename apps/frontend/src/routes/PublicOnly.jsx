/**
 * PublicOnly.jsx
 * Route guard for public-only pages (login/register)
 * - Redirects to /dashboard if user is already authenticated
 * - Allows access if not authenticated
 */

import { Navigate } from 'react-router-dom';

const PublicOnly = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (isLoggedIn) {
    // Redirect authenticated users to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicOnly;
