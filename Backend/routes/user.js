import { Router } from "express";
const router = Router();
import { userData } from "../data/index.js";
import { checkIsProperString, isDateValid } from "../data/helper.js";

router
  .route("/")
  .get(async (req, res) => {
    return res.send("GET request to http://localhost:3000/users");
  })
  .post(async (req, res) => {
    try {
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.username = checkIsProperString(req.body.username, "username");
      req.body.email = checkIsProperString(req.body.email, "email");
      req.body.password = checkIsProperString(req.body.password, "password");
      //req.body.contact = checkIsProperString(req.body.password, "password");
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }

    try {
      const addUser = await userData.addUser(
        req.body.firstName,
        req.body.lastName,
        req.body.username,
        req.body.email,
        req.body.password
      );

      const result = {
        userAdded: addUser,
        message: "User added succesfully",
        success: true,
      };
      return res.status(201).json(result);
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .delete(async (req, res) => {
    return res.send("DELETE request to http://localhost:3000/paitents");
  })
  .put(async (req, res) => {
    return res.send("PUT request to http://localhost:3000/paitents");
  })
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/paitents");
  });

export default router;
