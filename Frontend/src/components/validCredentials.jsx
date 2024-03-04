//Temporary file for validating the input functionality
import md5 from 'md5';

const validCredentials = {
    username: 'user1', // Replace with the actual username
    password: md5('password@123'), // Store a hashed password for security
  };

export default validCredentials;