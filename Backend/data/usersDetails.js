import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    checkIsProperString,
    validateId,
    checkIsAlphanumeric,
    validateEmail,
  } from "./helper.js";
  import moment from "moment";

const exportedMethods = {
    async fetchAllUsersData() {
        // Obtain the users collection reference
        const usersCollection = await users();

        // Fetch data from the collection
        const userData = await usersCollection
        .find(
            {},
            { projection: { firstName: 1, lastName: 1, username: 1, email: 1 } }
        )
        .toArray();
    return userData; // Return the fetched user data
},

    async removeUser(id) {
        id = validateId(id, "user id");

        const usersCollection = await users();

        const deletionInfo = await usersCollection.findOneAndDelete({
        _id: ObjectId.createFromHexString(id),
        });

        if (!deletionInfo) {
            throw new Error(`Could not delete user with id of ${id}`);
        }

        const { _id } = deletionInfo;
        return { _id: _id, deleted: true };
    },

    async updateUserInfo(id, updateObject) {
        id = validateId(id, "user id");
        updateObject.firstName = checkIsProperString(
          updateObject.firstName,
          "firstName"
        );
        updateObject.lastName = checkIsProperString(
          updateObject.lastName,
          "lastName"
        );
        
        updateObject.username = checkIsAlphanumeric(updateObject.username, "username")
        updateObject.email = validateEmail(updateObject.email);
    
        const usersCollection = await users();
    
        const updateUser = await usersCollection.findOneAndUpdate(
          {
            _id: ObjectId.createFromHexString(id),
          },
          {
            $set: updateObject,
          },
          {
            returnDocument: "after",
          }
        );
    
        return updateUser;
      },
    };

    export default exportedMethods;
