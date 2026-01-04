import { Router } from "express";
const router = Router();
import { eegStudiesData } from "../data/index.js";
import { validateId } from "../data/helper.js";
import crypto from "crypto";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

/**
 * GET /patients/:patientId/studies
 * Get all EEG studies for a specific patient
 */
router.get("/patients/:patientId/studies", requireAuth, async (req, res) => {
  try {
    // Validate patientId
    const patientId = validateId(req.params.patientId, "patient id");

    // Fetch all studies for this patient
    const studies = await eegStudiesData.findByPatientId(patientId);

    return res.status(200).json({
      success: true,
      patientId: patientId,
      count: studies.length,
      studies: studies,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /studies/:studyId
 * Get a single EEG study by its ID
 */
router.get("/studies/:studyId", requireAuth, async (req, res) => {
  try {
    // Validate studyId
    const studyId = validateId(req.params.studyId, "study id");

    // Fetch study
    const study = await eegStudiesData.getStudyById(studyId);

    if (!study) {
      return res.status(404).json({
        success: false,
        error: `Study with id ${studyId} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      study: study,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /patients/:patientId/studies
 * Create a new EEG study for a patient (ADMIN ONLY)
 *
 * PHASE 3: This endpoint is used to initiate a study BEFORE uploading to Python.
 * The workflow is:
 * 1. Frontend calls this endpoint to create a study with status "PROCESSING"
 * 2. Frontend sends file + uploadId to Python
 * 3. Python processes and calls back to /patients/upload with uploadId
 * 4. Backend updates the study to status "COMPLETED"
 *
 * If uploadId is not provided, one will be generated automatically.
 */
router.post("/patients/:patientId/studies", requireAdmin, async (req, res) => {
  try {
    // Validate patientId
    const patientId = validateId(req.params.patientId, "patient id");

    // Extract study data from request body
    const {
      uploadId,
      title,
      status,
      uploadDate,
      figureUrls,
      metadata,
    } = req.body;

    // Generate uploadId if not provided (PHASE 3 enhancement)
    const finalUploadId = uploadId || crypto.randomUUID();

    // Default status to PROCESSING for new uploads (PHASE 3)
    const finalStatus = status || "PROCESSING";

    // Build study data
    const studyData = {
      patientId: patientId,
      uploadId: finalUploadId,
      status: finalStatus,
      title: title || null,
      uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
      completionDate: null, // Will be set when status becomes COMPLETED
      summary: null,
      hotspots: [],
      figureUrls: figureUrls || {
        topomap: null,
        brainViews: [],
        annotated: [],
      },
      reportUrl: null,
      errorMessage: null,
      processingTime: null,
      metadata: metadata || {
        modelVersion: null,
        mneVersion: null,
      },
    };

    // Create study
    const newStudy = await eegStudiesData.createStudy(studyData);

    console.log(
      `[POST /patients/:patientId/studies] Created study with uploadId=${finalUploadId} status=${finalStatus}`
    );

    return res.status(201).json({
      success: true,
      message: "Study created successfully",
      study: newStudy,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /studies/:studyId/status
 * Update the status of an EEG study
 */
router.patch("/studies/:studyId/status", requireAuth, async (req, res) => {
  try {
    // Validate studyId
    const studyId = validateId(req.params.studyId, "study id");

    // Extract status from request body
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status is required",
      });
    }

    // Update status
    const updatedStudy = await eegStudiesData.updateStatus(studyId, status);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      study: updatedStudy,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /studies/:studyId
 * Delete an EEG study (ADMIN ONLY)
 */
router.delete("/studies/:studyId", requireAdmin, async (req, res) => {
  try {
    // Validate studyId
    const studyId = validateId(req.params.studyId, "study id");

    // Delete study
    const result = await eegStudiesData.deleteStudy(studyId);

    return res.status(200).json({
      success: true,
      message: "Study deleted successfully",
      result: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
