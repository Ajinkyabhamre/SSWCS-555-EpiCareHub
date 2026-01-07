// MUST be first: Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Then import other modules that depend on env vars
import express from "express";
import cors from "cors";
import configRoutesFunction from "./routes/index.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const errorMsg = `Missing required environment variables: ${missingEnvVars.join(", ")}`;
  if (process.env.NODE_ENV === "test") {
    // In test environment, log warning but continue (tests may mock DB)
    console.warn(`[app.js] ${errorMsg} (skipping process.exit in test environment)`);
  } else {
    // In production/development, fail fast
    console.error(`ERROR: ${errorMsg}`);
    console.error("Please create a .env file with the required variables.");
    process.exit(1);
  }
}

const app = express();

// Trust proxy for Railway deployment (required for HTTPS/secure cookies behind proxy)
app.set("trust proxy", 1);

// CORS Configuration - Environment-based origin whitelist
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Add localhost default for development if no origins configured
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173");
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Allow if origin is in the whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject other origins
    callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Session store configuration
// In production, use MongoStore for persistence across restarts
// In development/test, fall back to MemoryStore for simplicity
const sessionConfig = {
  name: "AuthenticationSession",
  secret: process.env.SESSION_SECRET || "change_me_in_production",
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production, false in dev
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'lax' for dev, 'none' for prod with HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
};

// Use MongoDB session store in production for persistence across Railway restarts
if (process.env.NODE_ENV === "production" && process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: 60 * 60 * 24, // 24 hours (same as cookie maxAge)
    autoRemove: "native", // Use MongoDB TTL index for session cleanup
    touchAfter: 24 * 3600, // Lazy session update (only update once per 24h unless data changes)
  });
  console.log("[Session] Using MongoDB session store for production persistence");
} else {
  console.log("[Session] Using MemoryStore (dev/test mode - sessions lost on restart)");
}

app.use(session(sessionConfig));

// Body parser with size limits to prevent abuse
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));

// File upload with configurable size limits (default 100MB for Render/Railway compatibility)
const uploadMaxMB = parseInt(process.env.UPLOAD_MAX_MB || '100', 10);
app.use(fileUpload({
  limits: { fileSize: uploadMaxMB * 1024 * 1024 },
  abortOnLimit: true,
  limitHandler: (_req, res) => {
    res.status(413).json({
      error: `File too large. Maximum size is ${uploadMaxMB}MB. Consider uploading to object storage directly.`
    });
  }
}));

// Serve static files (brain meshes, etc.)
app.use(express.static("public"));

configRoutesFunction(app);

export default app;
