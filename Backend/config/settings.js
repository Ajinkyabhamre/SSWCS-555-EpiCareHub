/**
 * MongoDB Configuration
 * Loads .env and provides MongoDB connection settings.
 * No localhost fallback - Atlas only.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend folder (one level up from config/)
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "epicarehubData";

if (!mongoUri) {
  console.error("[MongoDB] MONGODB_URI is not set. Please configure Backend/.env");
  throw new Error("MONGODB_URI missing");
}

export const mongoConfig = {
  serverUrl: mongoUri,
  database: dbName,
};
