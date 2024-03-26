import { Router } from "express";
const router = Router();
import { patientsData } from "../data/index.js";
import {
  checkIsProperString,
  isDateValid,
  validateId,
  validateEmail,
} from "../data/helper.js";

router
  .route("/")
  .get(async (req, res) => {
    return res.send("GET request to http://localhost:3000/paitents");
  })
  .post(async (req, res) => {
    try {
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
      req.body.gender = checkIsProperString(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
      req.body.address = checkIsProperString(req.body.address, "address");
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }

    try {
      const addPaitent = await patientsData.addPaitent(
        req.body.firstName,
        req.body.lastName,
        req.body.dob,
        req.body.address,
        req.body.contact
      );

      const result = {
        patientAdded: addPaitent,
        message: "Patient added succesfully",
        success: true,
      };
      return res.json(result);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .delete(async (req, res) => {
    return res.send("DELETE request to http://localhost:3000/paitents");
  })
  .put(async (req, res) => {})
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/paitents");
  });

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "patient id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deletePaitent = await patientsData.getPaitentById(req.params.id);
      return res.status(200).json(deletePaitent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
  .put(async (req, res) => {
    try {
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
      req.body.gender = checkIsProperString(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
      req.body.address = checkIsProperString(req.body.address, "address");
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .delete(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "patient id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deletePaitent = await patientsData.removePatient(req.params.id);
      return res.status(200).json(deletePaitent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

export default router;
