import { Router } from "express";
const router = Router();
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dataset Configuration
 * Maps session keys to actual .h5 file paths
 */
const HUMAN_MTL_DATASETS = {
  "Data_Subject_01_Session_01": {
    displayName: "Subject 01 - Session 01 (Working Memory Task)",
    filePath: "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5",
    description: "Human MTL single-unit recordings during working memory task (Boran et al. 2019)",
    validated: true // Known to work
  },
  // Add more sessions here as they become available and tested
  // "Data_Subject_02_Session_01": {
  //   displayName: "Subject 02 - Session 01",
  //   filePath: "datasets/human_mtl_units_wm/data_nix/Data_Subject_02_Session_01.h5",
  //   description: "Human MTL single-unit recordings - Subject 02",
  //   validated: false
  // },
};

/**
 * GET /api/analysis/datasets
 * List available demo datasets
 */
router.get("/datasets", (req, res) => {
  try {
    const datasets = Object.entries(HUMAN_MTL_DATASETS).map(([key, config]) => ({
      sessionKey: key,
      displayName: config.displayName,
      description: config.description,
      validated: config.validated
    }));

    res.json({
      success: true,
      datasets,
      message: "Available HUMAN_MTL demo datasets"
    });
  } catch (error) {
    console.error("[/api/analysis/datasets] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analysis/run-human-mtl
 * Trigger the HUMAN_MTL pipeline from the frontend
 *
 * Request body:
 * {
 *   "patientId": "string",
 *   "uploadId": "string",
 *   "sessionKey": "Data_Subject_01_Session_01"
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "message": "Pipeline started",
 *   "patientId": "...",
 *   "uploadId": "...",
 *   "sessionKey": "..."
 * }
 *
 * IMPORTANT:
 * - This endpoint spawns the Python process but does not wait for completion
 * - Python will POST results to /patients/upload when done
 * - Frontend should poll /patients/:patientId/studies to detect completion
 */
router.post("/run-human-mtl", async (req, res) => {
  try {
    const { patientId, uploadId, sessionKey } = req.body;

    // ====================================================================
    // Validation
    // ====================================================================
    if (!patientId || typeof patientId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid patientId"
      });
    }

    if (!uploadId || typeof uploadId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid uploadId"
      });
    }

    if (!sessionKey || typeof sessionKey !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid sessionKey"
      });
    }

    // Check if session key is valid
    const datasetConfig = HUMAN_MTL_DATASETS[sessionKey];
    if (!datasetConfig) {
      return res.status(400).json({
        success: false,
        error: `Unknown session key: ${sessionKey}`,
        availableKeys: Object.keys(HUMAN_MTL_DATASETS)
      });
    }

    // ====================================================================
    // Resolve file path
    // ====================================================================
    // Path to Localization-Algorithm directory
    const algorithmDir = path.resolve(__dirname, "..", "..", "Localization-Algorithm");
    const datasetFilePath = path.join(algorithmDir, datasetConfig.filePath);

    console.log(`[/api/analysis/run-human-mtl] Checking dataset file: ${datasetFilePath}`);

    // Check if file exists
    if (!fs.existsSync(datasetFilePath)) {
      return res.status(404).json({
        success: false,
        error: `Dataset file not found: ${datasetConfig.filePath}`,
        expectedPath: datasetFilePath,
        hint: "Make sure the dataset file is in the Localization-Algorithm directory"
      });
    }

    // ====================================================================
    // Prepare Python command
    // ====================================================================
    const uploadsDir = path.resolve(__dirname, "..", "..", "Localization-Algorithm", "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`[/api/analysis/run-human-mtl] Created uploads directory: ${uploadsDir}`);
    }

    const pythonArgs = [
      "brain_visualizer.py",
      "--basePath", uploadsDir,
      "--file", datasetFilePath,
      "--patientId", patientId,
      "--uploadId", uploadId,
      "--historic", "false"
    ];

    console.log("[/api/analysis/run-human-mtl] Starting Python pipeline...");
    console.log("  - Working directory:", algorithmDir);
    console.log("  - Command: python3", pythonArgs.join(" "));
    console.log("  - Patient ID:", patientId);
    console.log("  - Upload ID:", uploadId);
    console.log("  - Session Key:", sessionKey);
    console.log("  - Dataset File:", datasetFilePath);

    // ====================================================================
    // Spawn Python process
    // ====================================================================
    const pythonProcess = spawn("python3", pythonArgs, {
      cwd: algorithmDir,
      stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr
      detached: false // Keep attached to this process
    });

    // Log stdout
    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString().trim();
      console.log(`[Python STDOUT] ${output}`);
    });

    // Log stderr
    pythonProcess.stderr.on("data", (data) => {
      const output = data.toString().trim();
      console.error(`[Python STDERR] ${output}`);
    });

    // Handle process exit
    pythonProcess.on("exit", (code, signal) => {
      if (code === 0) {
        console.log(`[/api/analysis/run-human-mtl] ✓ Python pipeline completed successfully`);
      } else {
        console.error(`[/api/analysis/run-human-mtl] ✗ Python pipeline failed with code ${code}, signal ${signal}`);
      }
    });

    // Handle process errors
    pythonProcess.on("error", (error) => {
      console.error(`[/api/analysis/run-human-mtl] ✗ Python process error:`, error);
    });

    // ====================================================================
    // Return immediate response
    // ====================================================================
    // Don't wait for Python to complete - return success immediately
    // Python will POST to /patients/upload when done
    res.json({
      success: true,
      message: "HUMAN_MTL pipeline started successfully",
      patientId,
      uploadId,
      sessionKey,
      datasetFile: datasetConfig.filePath,
      note: "Pipeline is running in background. Poll /patients/:patientId/studies to check for completion."
    });

  } catch (error) {
    console.error("[/api/analysis/run-human-mtl] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

export default router;
