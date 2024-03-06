//Temporary file for validating the input functionality
import md5 from "md5";

const validCredentials = {
  username: "superadmin", // Replace with the actual username
  password: md5("P@ssw0rd"), // Store a hashed password for security
};

export default validCredentials;
