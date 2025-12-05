/**
 * Migration Script: eegVisuals → eegStudies
 *
 * This script migrates existing patient.eegVisuals entries into the new eegStudies collection.
 *
 * Usage:
 *   cd Backend
 *   npm run migrate:eegStudies
 *
 * OR:
 *   node scripts/migrateEegVisualsToStudies.js
 *
 * IMPORTANT:
 * - This script does NOT modify patient documents
 * - It only creates new documents in the eegStudies collection
 * - Safe to run multiple times (skips existing studies)
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { dbConnection } from "../config/mongoConnection.js";
import { patients } from "../config/mongoCollections.js";
import { eegStudiesData } from "../data/index.js";
import moment from "moment";

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

/**
 * Parse uploadDate string to Date object
 * @param {string} dateString - Date in format "MM/DD/YYYY"
 * @returns {Date|null} Parsed date or null
 */
function parseUploadDate(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const parsed = moment(dateString, "MM/DD/YYYY", true);
  if (parsed.isValid()) {
    return parsed.toDate();
  }

  return null;
}

/**
 * Main migration function
 */
async function migrateEegVisualsToStudies() {
  console.log(
    `\n${colors.bright}${colors.cyan}==========================================${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}EEG Visuals → EEG Studies Migration${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}==========================================${colors.reset}\n`
  );

  let db;
  let stats = {
    totalPatients: 0,
    patientsWithEegVisuals: 0,
    totalStudiesCreated: 0,
    totalStudiesSkipped: 0,
    errors: [],
  };

  try {
    // Connect to database
    console.log(`${colors.blue}→${colors.reset} Connecting to MongoDB...`);
    db = await dbConnection();
    console.log(`${colors.green}✓${colors.reset} Connected to database\n`);

    // Get patients collection
    const patientsCollection = await patients();

    // Fetch all patients
    console.log(`${colors.blue}→${colors.reset} Fetching all patients...`);
    const allPatients = await patientsCollection.find({}).toArray();
    stats.totalPatients = allPatients.length;
    console.log(
      `${colors.green}✓${colors.reset} Found ${colors.bright}${stats.totalPatients}${colors.reset} patients\n`
    );

    // Process each patient
    console.log(
      `${colors.blue}→${colors.reset} Processing patients with eegVisuals...\n`
    );

    for (const patient of allPatients) {
      // Skip patients without eegVisuals
      if (!patient.eegVisuals || !Array.isArray(patient.eegVisuals)) {
        continue;
      }

      if (patient.eegVisuals.length === 0) {
        continue;
      }

      stats.patientsWithEegVisuals++;

      console.log(
        `  ${colors.cyan}Patient:${colors.reset} ${patient.firstName} ${patient.lastName} (${patient._id})`
      );
      console.log(
        `  ${colors.cyan}EEG Visuals:${colors.reset} ${patient.eegVisuals.length} entries`
      );

      // Process each eegVisuals entry
      for (let i = 0; i < patient.eegVisuals.length; i++) {
        const visual = patient.eegVisuals[i];

        // Skip if no uploadId
        if (!visual.uploadId) {
          console.log(
            `    ${colors.yellow}⚠${colors.reset} Skipping entry ${i + 1}: missing uploadId`
          );
          continue;
        }

        try {
          // Check if study already exists
          const existingStudy = await eegStudiesData.findByUploadId(
            visual.uploadId
          );

          if (existingStudy) {
            console.log(
              `    ${colors.yellow}↷${colors.reset} Study ${i + 1} already exists (uploadId: ${visual.uploadId})`
            );
            stats.totalStudiesSkipped++;
            continue;
          }

          // Parse uploadDate
          const uploadDate = parseUploadDate(visual.uploadDate);

          // Build study document
          const studyData = {
            patientId: patient._id.toString(),
            uploadId: visual.uploadId,
            status: "COMPLETED", // Existing visuals are all completed
            title: null, // No titles in old data
            uploadDate: uploadDate,
            completionDate: uploadDate, // Assume completion date = upload date
            summary: null, // No summaries in old data
            hotspots: [], // No hotspot data in old format
            figureUrls: {
              topomap: visual.figUrl || null,
              brainViews: visual.images || [],
              annotated: [], // No annotated images in old format
            },
            reportUrl: null, // No report URLs in old data
            errorMessage: null,
            processingTime: null,
            metadata: {
              modelVersion: null,
              mneVersion: null,
            },
          };

          // Create study
          const createdStudy = await eegStudiesData.createStudy(studyData);
          console.log(
            `    ${colors.green}✓${colors.reset} Created study ${i + 1}: ${createdStudy._id} (uploadId: ${visual.uploadId})`
          );
          stats.totalStudiesCreated++;
        } catch (error) {
          console.log(
            `    ${colors.red}✗${colors.reset} Error creating study ${i + 1}: ${error.message}`
          );
          stats.errors.push({
            patientId: patient._id.toString(),
            uploadId: visual.uploadId,
            error: error.message,
          });
        }
      }

      console.log(""); // Blank line between patients
    }

    // Print summary
    console.log(
      `${colors.bright}${colors.cyan}==========================================${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.cyan}Migration Summary${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.cyan}==========================================${colors.reset}\n`
    );

    console.log(
      `${colors.cyan}Total Patients:${colors.reset}              ${colors.bright}${stats.totalPatients}${colors.reset}`
    );
    console.log(
      `${colors.cyan}Patients with EEG Visuals:${colors.reset}   ${colors.bright}${stats.patientsWithEegVisuals}${colors.reset}`
    );
    console.log(
      `${colors.green}Studies Created:${colors.reset}             ${colors.bright}${stats.totalStudiesCreated}${colors.reset}`
    );
    console.log(
      `${colors.yellow}Studies Skipped (existing):${colors.reset}  ${colors.bright}${stats.totalStudiesSkipped}${colors.reset}`
    );

    if (stats.errors.length > 0) {
      console.log(
        `${colors.red}Errors:${colors.reset}                      ${colors.bright}${stats.errors.length}${colors.reset}\n`
      );
      console.log(`${colors.red}Error Details:${colors.reset}`);
      stats.errors.forEach((err, idx) => {
        console.log(
          `  ${idx + 1}. Patient ${err.patientId}, Upload ${err.uploadId}: ${err.error}`
        );
      });
    } else {
      console.log(
        `${colors.green}Errors:${colors.reset}                      ${colors.bright}0${colors.reset}`
      );
    }

    console.log(
      `\n${colors.bright}${colors.cyan}==========================================${colors.reset}\n`
    );

    if (stats.totalStudiesCreated > 0) {
      console.log(
        `${colors.green}${colors.bright}✓ Migration completed successfully!${colors.reset}\n`
      );
    } else if (stats.totalStudiesSkipped > 0) {
      console.log(
        `${colors.yellow}${colors.bright}! All studies already exist. No new studies created.${colors.reset}\n`
      );
    } else {
      console.log(
        `${colors.yellow}${colors.bright}! No eegVisuals found to migrate.${colors.reset}\n`
      );
    }
  } catch (error) {
    console.error(
      `\n${colors.red}${colors.bright}✗ Migration failed:${colors.reset}`,
      error
    );
    process.exit(1);
  } finally {
    // Close database connection
    if (db) {
      await db.client.close();
      console.log(
        `${colors.blue}→${colors.reset} Database connection closed\n`
      );
    }
  }

  process.exit(0);
}

// Run migration
migrateEegVisualsToStudies();
