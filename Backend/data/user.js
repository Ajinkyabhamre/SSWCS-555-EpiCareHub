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
  async addUser(firstName, lastName, username, email, password) {
    firstName = checkIsProperString(firstName, "firstName");
    lastName = checkIsProperString(lastName, "lastName");
    username = checkIsProperUsername(username);
    email = validateEmail(email);
    password = checkPassword(password);

    let hashedPassword = await bcrypt.hash(password, saltRounds);
    let newUser = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: hashedPassword,
    };

    const usersCollection = await users();

    const newInsertInformation = await usersCollection.insertOne(newUser);

    if (!newInsertInformation.insertedId)
      throw new Error("Error: Insert failed!");
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

    const { password, ...rest } = user;
    return rest;
  },
};

export default exportedMethods;
