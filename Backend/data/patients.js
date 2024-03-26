import { patients } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkIsProperString, isDateValid, validateId } from "./helper.js";
import moment from "moment";

const exportedMethods = {
  async addPaitent(firstName, lastName, dob, gender, email, address) {
    firstName = checkIsProperString(firstName, "firstName");
    lastName = checkIsProperString(lastName, "lastName");
    dob = checkIsProperString(dob, "date of birth");
    dob = isDateValid(dob, "date of birth");
    address = checkIsProperString(address, "address");
    contact = checkIsProperString(contact, "contact");

    let newPaitent = {
      firstName: firstName,
      lastName: lastName,
      dob: dob,
      address: address,
      contact: contact,
      creationDate: moment().format(),
    };

    const patientsCollection = await patients();

    const newInsertInformation = await patientsCollection.insertOne(newPaitent);

    if (!newInsertInformation.insertedId)
      throw new Error("Error: Insert failed!");
    return await this.getPaitentById(
      newInsertInformation.insertedId.toString()
    );
  },

  async getPaitentById(id) {
    id = validateId(id, "id");
    const patientsCollection = await patients();
    const paitent = await patientsCollection.findOne({
      _id: ObjectId.createFromHexString(id),
    });
    if (!paitent) throw new Error("Error: Paitent not found");
    return paitent;
  },

  async getAllPaitents(firstName, lastName, dob, email) {
    const patientsCollection = await patients();

    let filter = {};

    if (firstName || lastName || dob || email) {
      if (firstName) filter.firstName = firstName;
      if (lastName) filter.lastName = lastName;
      if (dob) filter.dob = dob;
      if (email) filter.email = email;
    }

    // Retrieve patients based on the constructed filter
    const patientsList = await patientsCollection.find(filter).toArray();

    return patientsList;
  },

  async removePatient(id) {
    id = validateId(id, "paitent id");

    const patientsCollection = await patients();

    const deletionInfo = await patientsCollection.findOneAndDelete({
      _id: ObjectId.createFromHexString(id),
    });

    if (!deletionInfo) {
      throw new Error(`Could not delete patient with id of ${id}`);
    }

    const { _id } = deletionInfo;
    return { _id: _id, deleted: true };
  },
};

export default exportedMethods;
