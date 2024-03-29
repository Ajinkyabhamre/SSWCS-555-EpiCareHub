// You can add and export any helper functions you want here. If you aren't using any, then you can just leave this file as is.

import { ObjectId } from "mongodb";

import moment from "moment";

export const isInputProvided = (variable, variableName) => {
  if (variable === undefined || variable === null)
    throw new Error(`Error: ${variableName || "variable"} not provided`);
};

export const checkIsProperString = (str, strName) => {
  isInputProvided(str, strName);
  if (typeof str !== "string")
    throw new Error(`Error: ${strName || "provided variable"} is not a string`);

  str = str.trim();
  if (str.length === 0)
    throw new Error(
      `Error: ${strName || "provided variable"} is a empty string`
    );

  return str;
};

export const validateId = (id) => {
  isInputProvided(id, "id");
  id = checkIsProperString(id, "id");

  if (!ObjectId.isValid(id)) throw new Error(`Error: Invalid object Id`);

  return id;
};

export const calulateAge = (birthDateStr) => {
  const birthDate = moment(birthDateStr, "MM/DD/YYYY");
  let today = moment();
  const yearsDiff = today.diff(moment(birthDate), "years");

  return yearsDiff;
};

export const isDateValid = (dateStr, varName) => {
  isInputProvided(dateStr, varName);
  let today = moment();

  let date = moment(dateStr, "MM/DD/YYYY");

  if (date.isAfter(today))
    throw new Error(`Error: ${varName} should be today or before`);

  if (!date.isValid()) throw new Error(`Error: ${varName} is not valid`);

  return dateStr;
};

export const validateEmail = (email) => {
  checkIsProperString(email, "email");
  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!email.match(validRegex)) throw new Error("email is invald");

  return email;
};

export const checkIsProperNumber = (val, variableName) => {
  if (typeof val !== "number") {
    throw new Error(
      `Error: ${variableName || "provided variable"} is not a number`
    );
  }

  if (isNaN(val)) {
    throw new Error(`Error: ${variableName || "provided variable"} is NaN`);
  }
};


export const mapGender = {
  0 : "Male",
  1 : "Female",
  2 : "Others",
  3 : "Prefer not to say"
};

export const checkIsAlphanumeric = (str, strName) => {
  // Check if str is provided
  if (!str) {
    throw new Error(`Error: ${strName || "String"} not provided`);
  }

  // Check if str is a string
  if (typeof str !== "string") {
    throw new Error(`Error: ${strName || "Provided variable"} is not a string`);
  }

  // Check if str contains only alphanumeric characters
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(str)) {
    throw new Error(`Error: ${strName || "String"} contains non-alphanumeric characters`);
  }

  return str; // Return true if str contains only alphanumeric characters
};
