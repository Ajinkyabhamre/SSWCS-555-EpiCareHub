import { paitents } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    checkIsProperString, isDateValid, validateId
} from './helper.js';

const exportedMethods = {
    
  async addPaitent(firstName, lastName, DOB, address, contact) {

    firstName = checkIsProperString(firstName, "firstName");
    lastName = checkIsProperString(lastName, "lastName");
    DOB = checkIsProperString(DOB, "date of birth");
    DOB = isDateValid(DOB, "date of birth");
    address = checkIsProperString(address, "address");
    contact = checkIsProperString(contact, "contact");

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
    id = validateId(id, 'id');
    const paitentsCollection = await paitents();
    const paitent = await paitentsCollection.findOne({_id: ObjectId.createFromHexString(id)});
    if (!paitent) throw new Error("Error: Paitent not found");
    return paitent;
  }
};

export default exportedMethods;
