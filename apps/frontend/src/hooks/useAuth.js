import { useEffect, useState } from 'react';

/**
 * useAuth Hook
 * Provides authentication state and user role information
 *
 * Returns:
 * - isAuthenticated: boolean
 * - user: user object or null
 * - isAdmin: boolean (true if userType === "admin")
 * - checkAuth: function to re-check auth status
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isAdmin: false
  });

  const checkAuth = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userJson = localStorage.getItem('user');

    if (isLoggedIn && userJson) {
      try {
        const user = JSON.parse(userJson);
        setAuthState({
          isAuthenticated: true,
          user: user,
          isAdmin: user.userType === 'admin'
        });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setAuthState({ isAuthenticated: false, user: null, isAdmin: false });
      }
    } else {
      setAuthState({ isAuthenticated: false, user: null, isAdmin: false });
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (logout in another tab)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { ...authState, checkAuth };
};
