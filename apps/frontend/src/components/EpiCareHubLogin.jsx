import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${apiUrl}/login`, {
        email: email,
        password: password
      });

      if (response.data.isSuccess) {
        // Store user info in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        navigate('/dashboard');
      } else {
        setAuthError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Invalid email or password';
      setAuthError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldBlur = (field) => {
    if (field === 'email' && email) {
      const error = validateEmail(email);
      setFieldErrors(prev => ({
        ...prev,
        email: error
      }));
    } else if (field === 'password' && password) {
      const error = validatePassword(password);
      setFieldErrors(prev => ({
        ...prev,
        password: error
      }));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950">
      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            {/* Left Column: Sign In Form */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col justify-center"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Sign In
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Access your EpiCareHub account to continue with patient analysis
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <div className="rounded-2xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder="Enter your email"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.email
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600"
                        >
                          {fieldErrors.email}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Password Field */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => handleFieldBlur('password')}
                        placeholder="Enter your password"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.password
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600"
                        >
                          {fieldErrors.password}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Auth Error Message */}
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300"
                      >
                        {authError}
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full rounded-full bg-emerald-600 dark:bg-emerald-700 py-3 font-semibold text-white shadow-md shadow-emerald-600/40 transition-all duration-200 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      {isSubmitting ? 'Signing in...' : 'Submit'}
                    </motion.button>
                  </form>
                </div>

                {/* Register Link */}
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-1"
                  >
                    Register here
                  </Link>
                </p>
              </motion.div>
            </motion.div>

            {/* Right Column: Illustration (Hidden on Mobile) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="hidden md:flex md:justify-center items-center"
            >
              <div className="text-center">
                <div className="mb-6 text-8xl">🧠</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Secure Access
                </h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-xs">
                  Sign in with your credentials to access advanced brain imaging analysis
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
