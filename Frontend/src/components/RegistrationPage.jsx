import React, { useState } from 'react';
import axios from 'axios';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let errorMessage = '';
  
    if (name === 'email') {
      const isValidEmail = /\S+@\S+\.\S+/.test(value);
      errorMessage = isValidEmail ? '' : 'Invalid email format';
    }
  
    setFormData({
      ...formData,
      [name]: value,
    });
  
    setError(errorMessage);
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/register', formData);
      console.log(response.data);
      // Optionally, you can redirect the user to another page after successful registration
    } catch (error) {
      setError('Registration failed');
      console.error(error);
    }
  };

  return (
    <div className="registration-container">
      <h2 style={{ textAlign: 'center' }}>Registration</h2>
      <form onSubmit={handleSubmit} className="registration-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        
      <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="name"style={{ width: '100px' }}>Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />

        </div>
        <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="surname"style={{ width: '100px' }}>Surname:</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />
        </div>

        
        
        
        <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="username"style={{ width: '100px' }}>Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />
        </div>
        <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="email" style={{ width: '100px' }}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />
        </div>
        <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="password"style={{ width: '100px' }}>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />
        </div>
        <div className="form-group"style={{ marginBottom: '15px', display: 'flex' }}>

          <label htmlFor="confirmPassword"style={{ width: '100px' }}>Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ height: '30px' }}

          />
        </div>
        <div className="error" style={{ textAlign: 'center', marginBottom: '10px' }}>{error}</div>
        <button type="submit" style={{ display: 'block', margin: '0 auto', backgroundColor: 'blue', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Register</button>
      </form>
    </div>
  );
};

export default RegistrationPage;
