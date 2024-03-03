import { paitents } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

const exportedMethods = {
  async addPaitent(firstName, lastName, DOB, address, contact) {
    let newPaitent = {
      firstName: firstName,
      lastName : lastName,
      DOB : DOB,
      address: address,
      contact : contact
    };

    const paitentsCollection = await paitents();

    const newInsertInformation = await paitentsCollection.insertOne(newPaitent);

    if (!newInsertInformation.insertedId) throw new Error('Error: Insert failed!');
    return await this.getPaitentById(
      newInsertInformation.insertedId.toString()
    );
  },

  async getPaitentById(id) {
    const paitentsCollection = await paitents();
    const user = await paitentsCollection.findOne({_id: ObjectId.createFromHexString(id)});
    if (!user) throw new Error ('Error: User not found');
    return user;
  }
};

export default exportedMethods;
