import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
  checkIsProperString,
  validateId,
  checkIsProperUsername,
  checkPassword,
  validateEmail,
} from "./helper.js";
import bcrypt from "bcrypt";

const saltRounds = 14;

const exportedMethods = {
  async addUser(firstName, lastName, username, email, password, userType = "user") {
    firstName = checkIsProperString(firstName, "firstName");
    lastName = checkIsProperString(lastName, "lastName");
    username = checkIsProperUsername(username);
    email = validateEmail(email);
    password = checkPassword(password);

    // Validate userType
    if (userType && !["user", "admin"].includes(userType)) {
      throw new Error("Invalid user type. Must be 'user' or 'admin'");
    }

    const usersCollection = await users();

    // Check if email already exists
    const existingEmail = await usersCollection.findOne({ email: email });
    if (existingEmail) {
      throw new Error("Email already registered");
    }

    // Check if username already exists
    const existingUsername = await usersCollection.findOne({ username: username });
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    let hashedPassword = await bcrypt.hash(password, saltRounds);
    let newUser = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: hashedPassword,
      userType: userType || "user", // Default to "user" if not specified
    };

    const newInsertInformation = await usersCollection.insertOne(newUser);

    if (!newInsertInformation.insertedId) {
      throw new Error("Error: Insert failed!");
    }

    return { signUpCompleted: true };
  },

  async loginUser(username, password) {
    username = checkIsProperUsername(username);
    password = checkPassword(password);
    const UsersCollection = await users();
    const user = await UsersCollection.findOne({
      username: username,
    });
    if (!user) throw new Error("Either username or password is invalid");

    let passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck)
      throw new Error("Either username or password is invalid");

    const { password: hashedPassword, ...rest } = user;
    return rest;
  },

  async loginUserByEmail(email, password) {
    email = validateEmail(email);
    password = checkPassword(password);
    const UsersCollection = await users();
    const user = await UsersCollection.findOne({
      email: email,
    });
    if (!user) throw new Error("Invalid email or password");

    let passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck)
      throw new Error("Invalid email or password");

    const { password: hashedPassword, ...rest } = user;
    return rest;
  },
};

export default exportedMethods;
