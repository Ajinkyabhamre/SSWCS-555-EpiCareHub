import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const UserInput = () => {
  const actualSecretKey = 'epicare';
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
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword);
    const secretKeyError = validateSecretKey(formData.secretKey);

    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
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

      const response = await axios.post('http://localhost:3000/users', submitData);
      console.log(response.data);

      setSuccessMessage('Registration successful! You can now sign in.');
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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <Navbar />

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 md:py-16">
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
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Create Account
                </h1>
                <p className="text-slate-600">
                  Register to access EpiCareHub and manage patient data
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Success Message */}
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                      >
                        {successMessage}
                      </motion.div>
                    )}

                    {/* Registration Error */}
                    {registrationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                      >
                        {registrationError}
                      </motion.div>
                    )}

                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
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
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
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

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
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
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
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
                      <p className="mt-2 text-xs text-slate-500">
                        Must be 8+ characters with uppercase, lowercase, number, and special character
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
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
                      <label htmlFor="userType" className="block text-sm font-medium text-slate-700 mb-1.5">
                        User Type
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
                        <label htmlFor="secretKey" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                              ? 'border-red-300 bg-red-50 focus:ring-red-500'
                              : 'border-emerald-100 bg-emerald-50/40 focus:bg-white focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.secretKey && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 text-sm text-red-600"
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
                      className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white shadow-md shadow-emerald-600/40 transition-all duration-200 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      {isSubmitting ? 'Registering...' : 'Create Account'}
                    </motion.button>
                  </form>
                </div>

                {/* Sign In Link */}
                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link
                    to="/signin"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-1"
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
              className="hidden md:flex md:justify-center items-start pt-8"
            >
              <div className="text-center">
                <div className="mb-6 text-8xl">🔐</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Secure Registration
                </h2>
                <p className="text-slate-600 max-w-xs">
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
