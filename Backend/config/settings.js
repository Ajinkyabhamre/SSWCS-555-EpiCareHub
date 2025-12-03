// Load MongoDB configuration from environment variables
export const mongoConfig = {
  serverUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/epicarehub",
  database: process.env.MONGODB_DB_NAME || "epicarehub",
};
