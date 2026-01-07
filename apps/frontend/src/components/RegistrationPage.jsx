import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../utils/api';

const UserInput = () => {
  // NOTE: Secret key validation must be done on backend, never expose secrets in frontend
  // Backend should validate the secret key against secure configuration
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    secretKey: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [registrationError, setRegistrationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validation functions
  const validateFirstName = (value) => {
    if (!value.trim()) {
      return 'First name is required';
    }
    if (value.trim().length < 2) {
      return 'First name must be at least 2 characters';
    }
    return '';
  };

  const validateLastName = (value) => {
    if (!value.trim()) {
      return 'Last name is required';
    }
    if (value.trim().length < 2) {
      return 'Last name must be at least 2 characters';
    }
    return '';
  };

  const validateUsername = (value) => {
    if (!value.trim()) {
      return 'Username is required';
    }
    if (value.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.trim().length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

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
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== formData.password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const validateSecretKey = (value) => {
    if (formData.userType === 'admin' && !value.trim()) {
      return 'Secret key is required for admin registration';
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};

    const firstNameError = validateFirstName(formData.firstName);
    const lastNameError = validateLastName(formData.lastName);
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword);
    const secretKeyError = validateSecretKey(formData.secretKey);

    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
    if (usernameError) errors.username = usernameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    if (secretKeyError) errors.secretKey = secretKeyError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldBlur = (field) => {
    let error = '';
    switch (field) {
      case 'firstName':
        error = validateFirstName(formData.firstName);
        break;
      case 'lastName':
        error = validateLastName(formData.lastName);
        break;
      case 'username':
        error = validateUsername(formData.username);
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'password':
        error = validatePassword(formData.password);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.confirmPassword);
        break;
      case 'secretKey':
        error = validateSecretKey(formData.secretKey);
        break;
      default:
        break;
    }

    if (formData[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission (remove confirmPassword before sending to backend)
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        secretKey: formData.secretKey,
      };

      // Using apiClient ensures withCredentials: true for session cookies
      const response = await apiClient.post('/register', submitData);

      setSuccessMessage('Registration successful! Redirecting to sign in...');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'user',
        secretKey: '',
      });

      // Navigate to sign in page after showing success message
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      // Display backend error message if available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Please try again.';
      setRegistrationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950">
      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 items-start">
            {/* Left Column: Register Form */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col justify-start"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Create Account
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Register to access EpiCareHub and manage patient data
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <div className="rounded-2xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Success Message */}
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-300"
                      >
                        {successMessage}
                      </motion.div>
                    )}

                    {/* Registration Error */}
                    {registrationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300"
                      >
                        {registrationError}
                      </motion.div>
                    )}

                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('firstName')}
                        placeholder="John"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.firstName
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.firstName && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600"
                        >
                          {fieldErrors.firstName}
                        </motion.p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('lastName')}
                        placeholder="Doe"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.lastName
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.lastName && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600"
                        >
                          {fieldErrors.lastName}
                        </motion.p>
                      )}
                    </div>

                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('username')}
                        placeholder="johndoe"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.username
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.username && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                        >
                          {fieldErrors.username}
                        </motion.p>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        3-20 characters, letters, numbers, and underscores only
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder="john@example.com"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.email
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
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
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('password')}
                        placeholder="Enter password"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.password
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                        >
                          {fieldErrors.password}
                        </motion.p>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Must be 8+ characters with uppercase, lowercase, number, and special character
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('confirmPassword')}
                        placeholder="Confirm password"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          fieldErrors.confirmPassword
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                            : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      {fieldErrors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-sm text-red-600"
                        >
                          {fieldErrors.confirmPassword}
                        </motion.p>
                      )}
                    </div>

                    {/* User Type */}
                    <div>
                      <label htmlFor="userType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        User Type
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                      >
                        <option value="user">Regular User</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {/* Secret Key (conditional) */}
                    {formData.userType === 'admin' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <label htmlFor="secretKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Admin Secret Key
                        </label>
                        <input
                          id="secretKey"
                          type="password"
                          name="secretKey"
                          value={formData.secretKey}
                          onChange={handleChange}
                          onBlur={() => handleFieldBlur('secretKey')}
                          placeholder="Enter admin secret key"
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                            fieldErrors.secretKey
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 text-slate-900 dark:text-slate-100'
                              : 'border-emerald-100 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-emerald-500 text-slate-900 dark:text-slate-100'
                          }`}
                        />
                        {fieldErrors.secretKey && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                          >
                            {fieldErrors.secretKey}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {/* Register Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full rounded-full bg-emerald-600 dark:bg-emerald-700 py-3 font-semibold text-white shadow-md shadow-emerald-600/40 transition-all duration-200 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      {isSubmitting ? 'Registering...' : 'Create Account'}
                    </motion.button>
                  </form>
                </div>

                {/* Sign In Link */}
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Already have an account?{' '}
                  <Link
                    to="/signin"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-1"
                  >
                    Sign in here
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
                <div className="mb-6 text-8xl">🔐</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Secure Registration
                </h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-xs">
                  Create a secure account to manage your neurological research and patient data
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInput;
