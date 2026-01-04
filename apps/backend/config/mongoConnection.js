/**
 * MongoDB Connection Module
 * Connects to MongoDB Atlas using environment configuration.
 */

import { MongoClient } from "mongodb";
import { mongoConfig } from "./settings.js";

let _connection = undefined;
let _db = undefined;

const dbConnection = async () => {
  if (!_connection) {
    try {
      _connection = await MongoClient.connect(mongoConfig.serverUrl);

      _db = _connection.db(mongoConfig.database);
      await _db.command({ ping: 1 });

      console.log(`[MongoDB] Connected to database: ${mongoConfig.database}`);
    } catch (error) {
      console.error(`[MongoDB] Connection failed: ${error.message}`);
      throw error;
    }
  }

  return _db;
};

const closeConnection = async () => {
  if (_connection) {
    await _connection.close();
    _connection = undefined;
    _db = undefined;
    console.log("[MongoDB] Connection closed");
  }
};

export { dbConnection, closeConnection };
