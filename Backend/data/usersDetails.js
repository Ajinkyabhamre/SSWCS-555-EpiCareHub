import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    checkIsProperString,
    validateId,
    checkIsAlphanumeric,
    validateEmail,
  } from "./helper.js";

const UserOperations = {
  // Adding this helper function for removing the code duplication of usersCollection call reference
  async getUsersCollection() {
    return await users(); 
  },

  async fetchAllUsersData() {
    try {
        // Obtain the users collection reference
        const usersCollection = await this.getUsersCollection();
        const userData = await usersCollection.find({}, { projection: { firstName: 1, lastName: 1, username: 1, email: 1 } }).toArray();
        return userData;
    } catch (error) {
        throw new Error("Failed to fetch user data.");
    }
  },

  async removeUser(id) {
    try {
      id = validateId(id);
      // Obtain the users collection reference
      const usersCollection = await this.getUsersCollection();

      // Deleting the user record on the basis of id
      const deletionInfo = await usersCollection.findOneAndDelete({
      _id: ObjectId.createFromHexString(id),
      });

      // Error handling for deleted user's record
      if (!deletionInfo) {
        throw new Error(`Could not delete user with id of ${id}`);
      }
      const { _id } = deletionInfo;
      return { _id: _id, deleted: true };
    } catch (error) {
      throw new Error("Failed to remove user.");
    }
  },

  async updateUserInfo(id, updateObject) {
    try {
      id = validateId(id);
      updateObject.firstName = checkIsProperString(updateObject.firstName, "firstName");
      updateObject.lastName = checkIsProperString(updateObject.lastName, "lastName");
      updateObject.username = checkIsAlphanumeric(updateObject.username, "username");
      updateObject.email = validateEmail(updateObject.email);

      // Obtain the users collection reference
      const usersCollection = await this.getUsersCollection();

      // Update a user record on basis  of an object containing the fields to be updated.
      const updateUser = await usersCollection.findOneAndUpdate(
        { _id: ObjectId.createFromHexString(id) },
        { $set: updateObject },
        { returnDocument: "after" }
      );
      return updateUser;
    } catch (error) {
      throw new Error("Failed to update user info.");
    }
  },
};

export default UserOperations;
