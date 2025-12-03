/**
 * RequireAuth.jsx
 * Route guard for protected pages
 * - Redirects to /signin if user is not authenticated
 * - Allows access if authenticated
 */

import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to signin, preserving the location they tried to visit
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
