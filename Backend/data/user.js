import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkIsProperString, isDateValid, validateId } from "./helper.js";

const exportedMethods = {
  async addUser(firstName, lastName, username, email, password) {
    firstName = checkIsProperString(firstName, "firstName");
    lastName = checkIsProperString(lastName, "lastName");
    username = checkIsProperString(username, "username");
    email = checkIsProperString(email, "email");
    password = checkIsProperString(password, "password");


    let newUser = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: password,
    };

    const usersCollection = await users();

    const newInsertInformation = await usersCollection.insertOne(newUser);

    if (!newInsertInformation.insertedId)
      throw new Error("Error: Insert failed!");
    return await this.getUserById(
      newInsertInformation.insertedId.toString()
    );
  },

  async getUserById(id) {
    id = validateId(id, "id");
    const UsersCollection = await users();
    const user = await UsersCollection.findOne({
      _id: ObjectId.createFromHexString(id),
    });
    if (!user) throw new Error("Error: Paitent not found");
    return user;
  },
};

export default exportedMethods;
