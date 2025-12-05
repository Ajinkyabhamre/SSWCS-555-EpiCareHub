import { Router } from "express";
const router = Router();
import { eegStudiesData } from "../data/index.js";
import { validateId } from "../data/helper.js";

/**
 * GET /patients/:patientId/studies
 * Get all EEG studies for a specific patient
 */
router.get("/patients/:patientId/studies", async (req, res) => {
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
router.get("/:studyId", async (req, res) => {
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
 * Create a new EEG study for a patient
 *
 * NOTE: In the current synchronous flow, the frontend sends files directly to Python,
 * and Python calls back to /patients/upload. This endpoint is prepared for future
 * async workflows where we might:
 * 1. Create a study with status "UPLOADED"
 * 2. Send file to Python
 * 3. Python updates the study via callback
 *
 * For now, this is a thin wrapper for manual study creation (if needed).
 */
router.post("/patients/:patientId/studies", async (req, res) => {
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

    // Validate required fields
    if (!uploadId) {
      return res.status(400).json({
        success: false,
        error: "uploadId is required",
      });
    }

    // Build study data
    const studyData = {
      patientId: patientId,
      uploadId: uploadId,
      status: status || "UPLOADED", // Default to UPLOADED for new studies
      title: title || null,
      uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
      figureUrls: figureUrls || {
        topomap: null,
        brainViews: [],
        annotated: [],
      },
      metadata: metadata || {
        modelVersion: null,
        mneVersion: null,
      },
    };

    // Create study
    const newStudy = await eegStudiesData.createStudy(studyData);

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
router.patch("/:studyId/status", async (req, res) => {
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
 * Delete an EEG study
 */
router.delete("/:studyId", async (req, res) => {
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
