import { Router } from "express";
const router = Router();
import { patientsData, eegStudiesData } from "../data/index.js";
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

import moment from "moment";

import axios from "axios";
import internal, { Readable } from "stream";
import { validateInternalApiKey } from "../middleware/internalApiKey.js";

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
      return res.status(400).json(result);
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
      return res.status(400).json(result);
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
      req.body.email = validateEmail(req.body.email);
      if (req.body.comments)
        req.body.comments = checkIsProperString(req.body.comments, "comment");
    } catch (error) {
      const result = {
        patientUpdated: null,
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
        patientUpdated: updatePatient,
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

// Python → Node callback endpoint (protected by API key middleware)
router.route("/upload").post(validateInternalApiKey, async (req, res) => {
  // let patientId = req.body.patientId;
  let { patientId, uploadId, figUrl, matUrl, images, metadata, ...otherFields } = req.body;

  try {
    patientId = validateId(patientId, "patient Id");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Keep track of what succeeded for error reporting
  let patientUpdateSuccess = false;
  let studyUpdateSuccess = false;

  try {
    // ====================================================
    // STEP 1: Update patient.eegVisuals (existing behavior)
    // ====================================================
    const getPatient = await patientsData.getPaitentById(patientId);
    if (!getPatient.eegVisuals) getPatient.eegVisuals = [];

    // Build the eegVisuals entry (same as before)
    const newEEGObject = {
      uploadId,
      figUrl,
      matUrl,
      images,
      uploadDate: moment().format("MM/DD/YYYY"),
      ...otherFields, // Include any other fields Python might send
    };

    getPatient.eegVisuals.push(newEEGObject);
    const { _id, ...allDetails } = getPatient;

    await patientsData.updatePatientInfo(patientId, allDetails);
    patientUpdateSuccess = true;

    // ====================================================
    // STEP 2: Update or create eegStudies document (PHASE 3)
    // ====================================================
    try {
      // Check if study already exists
      let existingStudy = null;
      if (uploadId) {
        existingStudy = await eegStudiesData.findByUploadId(uploadId);
      }

      const now = new Date();

      if (existingStudy) {
        // PHASE 3: Update existing study from PROCESSING → COMPLETED
        console.log(
          `[/patients/upload] Updating existing study: uploadId=${uploadId}, status: ${existingStudy.status} → COMPLETED`
        );

        // Calculate processing time if the study has an uploadDate
        let processingTime = null;
        if (existingStudy.uploadDate) {
          processingTime = Math.round(
            (now - new Date(existingStudy.uploadDate)) / 1000
          ); // seconds
        }

        await eegStudiesData.updateProcessingResults(uploadId, {
          status: "COMPLETED",
          completionDate: now,
          figureUrls: {
            topomap: figUrl || null,
            brainViews: images || [],
            annotated: [], // Future enhancement
          },
          metadata: metadata || {
            modelVersion: null,
            mneVersion: null,
          },
          processingTime: processingTime,
        });

        console.log(
          `[/patients/upload] ✓ Study updated to COMPLETED (processing time: ${processingTime}s)`
        );
      } else {
        // Backward compatibility: Create new study if none exists
        console.log(
          `[/patients/upload] No existing study found for uploadId=${uploadId}, creating new study with COMPLETED status`
        );

        await eegStudiesData.createStudy({
          patientId: patientId,
          uploadId: uploadId || `manual-${Date.now()}`, // Fallback if no uploadId
          status: "COMPLETED",
          uploadDate: now,
          completionDate: now,
          figureUrls: {
            topomap: figUrl || null,
            brainViews: images || [],
            annotated: [],
          },
          metadata: metadata || {
            modelVersion: null,
            mneVersion: null,
          },
        });

        console.log(`[/patients/upload] ✓ New study created with COMPLETED status`);
      }
      studyUpdateSuccess = true;
    } catch (studyError) {
      // Log error but don't fail the entire request
      console.error(
        `[/patients/upload] ✗ Failed to update eegStudies for uploadId ${uploadId}:`,
        studyError.message
      );
      // Continue - patient update succeeded, which is the critical part
    }

    return res.status(200).json({
      success: true,
      message: "Operation Successful",
      patientUpdated: patientUpdateSuccess,
      studyUpdated: studyUpdateSuccess,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
      patientUpdated: patientUpdateSuccess,
      studyUpdated: studyUpdateSuccess,
    });
  }
});

export default router;
