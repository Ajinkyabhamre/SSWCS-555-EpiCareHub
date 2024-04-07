import { Router } from "express";
const router = Router();
import { patientsData } from "../data/index.js";
import {
  checkIsProperString,
  isDateValid,
  validateId,
  validateEmail,
  checkIsProperNumber,
  mapGender,
} from "../data/helper.js";
import multer from "multer";
import { ObjectId } from "mongodb";
import path from "path";
import fs from "fs";

import axios from "axios";
import internal, { Readable } from "stream";

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
      checkIsProperNumber(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
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
        req.body.gender,
        req.body.email
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
  .put(async (req, res) => {
    try {
      req.body.id = validateId(req.body.id, "patient id");
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
      checkIsProperNumber(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(400).json(result);
    }

    try {
      const updatePatient = await patientsData.updatePatientInfo(
        req.body.id,
        req.body
      );

      const result = {
        patientAdded: updatePatient,
        message: "Patient updated succesfully",
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
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/paitents");
  });

router.route("/statistics").get(async (req, res) => {
  try {
    const getAllStats = await patientsData.getPatientStats();
    return res.json(getAllStats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "patient id");
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    try {
      const deletePaitent = await patientsData.getPaitentById(req.params.id);
      return res.status(200).json(deletePaitent);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  })
  .put(async (req, res) => {})
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

router.route("/get").post(async (req, res) => {
  try {
    if (req.body.firstName !== undefined)
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
    if (req.body.lastName !== undefined)
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
    if (req.body.dob !== undefined) {
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
    }

    if (req.body.email !== undefined)
      req.body.email = validateEmail(req.body.email, "email");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const PatientsData = await patientsData.getAllPaitents(req.body);
    return res.json(PatientsData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.route("/upload").post(async (req, res) => {
  let patientId = req.body.patientId; // Get the patient ID from the request body

  try {
    patientId = validateId(patientId, "patient Id");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const getPatient = await patientsData.getPaitentById(patientId);
    if (!getPatient.eegVisuals) getPatient.eegVisuals = [];
    getPatient.eegVisuals.push(req.body.uploadId);
    const { _id, ...allDetails } = getPatient;

    const updatePatient = await patientsData.updatePatientInfo(
      patientId,
      allDetails
    );
    return res.status(200).send("Opertaion Succefull");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
