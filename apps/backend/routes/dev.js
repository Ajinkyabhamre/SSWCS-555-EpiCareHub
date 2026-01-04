import { Router } from "express";
const router = Router();
import { patientsData, eegStudiesData } from "../data/index.js";
import moment from "moment";

/**
 * DEV-ONLY ENDPOINT
 * POST /dev/seed
 *
 * Seeds the database with demo patient and study data for testing.
 * This endpoint is only available when EPICARE_DEV_MODE=true
 */
router.post("/seed", async (req, res) => {
  try {
    console.log("\n🌱 [DEV] Starting database seeding...");

    // Demo patient data
    const demoPatient = {
      firstName: "Demo",
      lastName: "Patient",
      dob: "01/15/1985",
      gender: 1, // Male
      email: "demo.patient@epicarehub.dev",
      isEpilepsy: true,
      comments: "Demo patient created for testing purposes. Safe to delete.",
    };

    // Check if demo patient already exists
    const existingPatients = await patientsData.getAllPaitents({
      email: demoPatient.email,
    });

    let patient;
    if (existingPatients && existingPatients.length > 0) {
      patient = existingPatients[0];
      console.log(`✓ [DEV] Demo patient already exists: ${patient._id}`);
    } else {
      // Create new demo patient
      patient = await patientsData.addPaitent(
        demoPatient.firstName,
        demoPatient.lastName,
        demoPatient.dob,
        demoPatient.gender,
        demoPatient.email
      );
      console.log(`✓ [DEV] Created new demo patient: ${patient._id}`);
    }

    // Generate placeholder image URLs
    const placeholderUrls = {
      topomap: "https://placehold.co/600x400/0f766e/white?text=EEG+Topomap",
      brainViews: [
        "https://placehold.co/1000x400/0f766e/white?text=Medial+View",
        "https://placehold.co/1000x400/059669/white?text=Rostral+View",
        "https://placehold.co/1000x400/10b981/white?text=Caudal+View",
        "https://placehold.co/1000x400/34d399/white?text=Dorsal+View",
        "https://placehold.co/1000x400/6ee7b7/white?text=Ventral+View",
        "https://placehold.co/1000x400/0f766e/white?text=Frontal+View",
        "https://placehold.co/1000x400/059669/white?text=Parietal+View",
        "https://placehold.co/1000x400/10b981/white?text=Axial+View",
        "https://placehold.co/1000x400/34d399/white?text=Sagittal+View",
        "https://placehold.co/1000x400/6ee7b7/white?text=Coronal+View",
        "https://placehold.co/1000x400/0f766e/white?text=Lateral+View",
      ],
      matUrl: "https://example.com/dev-data/demo-eeg-data.mat",
    };

    // Generate unique uploadId for this seed
    const uploadId = `dev-seed-${Date.now()}`;

    // Check if this study already exists
    const existingStudy = await eegStudiesData.findByUploadId(uploadId);

    if (existingStudy) {
      console.log(`⊘ [DEV] Study already exists: ${uploadId}`);
      return res.status(200).json({
        success: true,
        message: "Demo data already exists",
        patient: patient,
        study: existingStudy,
        note: "Database already seeded with this data",
      });
    }

    // ========================================
    // STEP 1: Add to patient.eegVisuals (legacy format)
    // ========================================
    const updatedPatient = await patientsData.getPaitentById(patient._id);
    if (!updatedPatient.eegVisuals) updatedPatient.eegVisuals = [];

    const newEEGObject = {
      uploadId: uploadId,
      figUrl: placeholderUrls.topomap,
      matUrl: placeholderUrls.matUrl,
      images: placeholderUrls.brainViews,
      uploadDate: moment().format("MM/DD/YYYY"),
    };

    updatedPatient.eegVisuals.push(newEEGObject);
    const { _id, ...patientDetails } = updatedPatient;

    await patientsData.updatePatientInfo(patient._id, patientDetails);
    console.log(`✓ [DEV] Updated patient.eegVisuals with ${uploadId}`);

    // ========================================
    // STEP 2: Create eegStudies document
    // ========================================
    const now = new Date();
    const studyData = {
      patientId: patient._id,
      uploadId: uploadId,
      status: "COMPLETED",
      title: "Demo EEG Study",
      uploadDate: now,
      completionDate: now,
      summary:
        "Demo study for testing. Left temporal lobe activity detected (simulated data).",
      hotspots: ["Left Temporal Lobe", "Hippocampus"],
      figureUrls: {
        topomap: placeholderUrls.topomap,
        brainViews: placeholderUrls.brainViews,
        annotated: [],
      },
      reportUrl: null,
      errorMessage: null,
      processingTime: 45, // Simulated 45 seconds
      metadata: {
        modelVersion: "ConvDip-DEV",
        mneVersion: "dev-mode",
      },
    };

    const newStudy = await eegStudiesData.createStudy(studyData);
    console.log(`✓ [DEV] Created eegStudies document: ${newStudy._id}`);

    console.log("\n🎉 [DEV] Seeding complete!\n");

    return res.status(200).json({
      success: true,
      message: "Demo data seeded successfully",
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
      },
      study: {
        _id: newStudy._id,
        uploadId: newStudy.uploadId,
        status: newStudy.status,
        title: newStudy.title,
      },
      instructions: {
        frontend: `Navigate to http://localhost:5173/patients to see demo patient`,
        patientDetails: `Click on patient to view EEG visualizations`,
        database: {
          patients: `db.patients.findOne({email: "${demoPatient.email}"})`,
          studies: `db.eegStudies.findOne({uploadId: "${uploadId}"})`,
        },
      },
    });
  } catch (error) {
    console.error("\n❌ [DEV] Seeding failed:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DEV-ONLY ENDPOINT
 * DELETE /dev/clean
 *
 * Removes all demo data from the database
 */
router.delete("/clean", async (req, res) => {
  try {
    console.log("\n🧹 [DEV] Cleaning demo data...");

    // Find all demo patients
    const demoPatients = await patientsData.getAllPaitents({
      email: "demo.patient@epicarehub.dev",
    });

    let deletedCount = 0;
    let studiesDeleted = 0;

    for (const patient of demoPatients) {
      // Delete all studies for this patient
      const studies = await eegStudiesData.findByPatientId(patient._id);
      for (const study of studies) {
        await eegStudiesData.deleteStudy(study._id.toString());
        studiesDeleted++;
      }

      // Delete the patient
      await patientsData.removePatient(patient._id);
      deletedCount++;
    }

    console.log(`✓ [DEV] Deleted ${deletedCount} demo patients`);
    console.log(`✓ [DEV] Deleted ${studiesDeleted} demo studies\n`);

    return res.status(200).json({
      success: true,
      message: "Demo data cleaned successfully",
      deleted: {
        patients: deletedCount,
        studies: studiesDeleted,
      },
    });
  } catch (error) {
    console.error("\n❌ [DEV] Cleaning failed:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
