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




export const isDateValid = (dateStr, varName) => {

  isInputProvided(dateStr, varName);
  let today = moment();

  let date = moment(dateStr, "MM/DD/YYYY");

  if (date.isAfter(today)) throw new Error(`Error: ${varName} should be today or before`);

  if (!date.isValid()) throw new Error(`Error: ${varName} is not valid`);

  return dateStr;
};


export const validateEmail = (email) => {
  checkIsProperString(email, "email");
  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!email.match(validRegex)) throw new Error('email is invald');

  return email;
};


