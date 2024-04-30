import { Router } from "express";
const router = Router();
import { userData } from "../data/index.js";
import {
  checkIsProperString,
  isDateValid,
  checkIsProperUsername,
  checkPassword,
  validateEmail,
} from "../data/helper.js";

router
  .route("/register")
  .get(async (req, res) => {
    return res.send("GET request to http://localhost:3000/users");
  })
  .post(async (req, res) => {
    try {
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.username = checkIsProperUsername(req.body.username);
      req.body.email = validateEmail(req.body.email);
      req.body.password = checkPassword(req.body.password);
      //req.body.contact = checkIsProperString(req.body.password, "password");
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(400).json({ isSuccess: false, message: error.message });
    }

    try {
      const addUser = await userData.addUser(
        req.body.firstName,
        req.body.lastName,
        req.body.username,
        req.body.email,
        req.body.password
      );

      if (!addUser.signUpCompleted) throw new Error("Internal Server Error");

      return res
        .status(201)
        .json({ isSuccess: true, message: "User added Succesfully" });
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  });

router.route("/login").post(async (req, res) => {
  let userData = req.body;
  if (!req.body) return res.status(400).json({ error: "No data passed" });
  try {
    userData.username = checkIsProperUsername(userData.username);
    userData.password = checkPassword(userData.password);
  } catch (error) {
    return res.status(400).json({ isSuccess: false, error: error.message });
  }

  try {
    const loginUser = await userData.loginUser(
      userData.username,
      userData.password
    );

    req.session.user = loginUser;
    return res
      .status(200)
      .json({ isSuccess: true, message: "logged in successfully" });
  } catch (error) {
    return res.status(404).json({ isSuccess: false, error: error.message });
  }
});

router.route("/logout").post(async (req, res) => {
  if (req.session.user) {
    req.session.destroy();
    return res.json({ isSuccess: true, message: "Logout Successfull" });
  }
});

export default router;
