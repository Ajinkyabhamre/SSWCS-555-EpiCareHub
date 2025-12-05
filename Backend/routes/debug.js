/**
 * Debug Routes
 *
 * These routes provide runtime information about the database connection.
 * Useful for verifying that the application is connected to the correct database.
 *
 * SECURITY NOTE:
 * - Only enable in development/testing environments
 * - Do NOT expose in production (will be blocked by route guard)
 */

import { Router } from "express";
const router = Router();
import { dbConnection } from "../config/mongoConnection.js";
import { mongoConfig } from "../config/settings.js";

/**
 * GET /debug/db-info
 *
 * Returns information about the current database connection:
 * - Database name
 * - Collection names
 * - Connection URL (hostname only, no credentials)
 *
 * Example response:
 * {
 *   "database": "epicarehubData",
 *   "collections": ["users", "patients", "eegStudies"],
 *   "clusterHost": "clusterdb.4lydu7t.mongodb.net",
 *   "timestamp": "2024-12-04T10:30:00.000Z"
 * }
 */
router.get("/db-info", async (req, res) => {
  try {
    const db = await dbConnection();

    // Extract cluster hostname without credentials
    let clusterHost = "unknown";
    try {
      const url = new URL(mongoConfig.serverUrl);
      clusterHost = url.hostname;
    } catch (urlError) {
      // Fallback regex extraction if URL parsing fails
      const urlParts = mongoConfig.serverUrl.match(
        /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^/?]+)/
      );
      clusterHost = urlParts ? urlParts[1] : "unknown";
    }

    // Get list of collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    // Get collection document counts
    const collectionStats = {};
    for (const name of collectionNames) {
      const count = await db.collection(name).countDocuments();
      collectionStats[name] = count;
    }

    return res.status(200).json({
      database: mongoConfig.database,
      clusterHost: clusterHost,
      collections: collectionNames,
      collectionStats: collectionStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG /db-info] Error:", error.message);
    return res.status(500).json({
      error: "Failed to retrieve database information",
      message: error.message,
    });
  }
});

export default router;
