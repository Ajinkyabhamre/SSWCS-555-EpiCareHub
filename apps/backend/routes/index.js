import paitentRoutes from "./patients.js";
import userRoutes from "./user.js";
import usersDetailRoutes from "./usersDetails.js";
import mlRoutes from "./ml.js";
import studiesRoutes from "./studies.js";
import devRoutes from "./dev.js";
import debugRoutes from "./debug.js";
import analysisRoutes from "./analysis.js";
import authRoutes from "./auth.js";
import { Router } from "express";

const constructorMethod = (app) => {
  const router = Router();

  app.use("/patients", paitentRoutes);
  app.use("/", userRoutes);
  app.use("/usersDetails", usersDetailRoutes);
  // Mount studies routes at root to support both:
  // - /patients/:patientId/studies (patient-specific study routes)
  // - /studies/:studyId (study-specific routes)
  app.use("/", studiesRoutes);

  // Auth diagnostic routes (always available for session debugging)
  app.use("/auth", authRoutes);

  // Analysis routes for triggering Python pipelines
  app.use("/api/analysis", analysisRoutes);

  // DEV-ONLY: Register dev routes if EPICARE_DEV_MODE is enabled
  if (process.env.EPICARE_DEV_MODE === "true") {
    console.log("[DEV MODE] Enabling /dev/* endpoints");
    app.use("/dev", devRoutes);
  }

  // DEBUG-ONLY: Register debug routes for database verification (dev/test only)
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG] Enabling /debug/* endpoints");
    app.use("/debug", debugRoutes);
  }

  // Add ML service health check routes
  mlRoutes(router);
  app.use("/", router);

  // Health check endpoint for deployment platforms (Render/Railway/etc)
  app.get("/health", async (req, res) => {
    try {
      // Import dbConnection dynamically to avoid initialization issues
      const { dbConnection } = await import("../config/mongoConnection.js");

      // Try to ping the database
      const db = await dbConnection();
      await db.command({ ping: 1 });

      return res.status(200).json({
        status: "ok",
        service: "epicarehub-backend",
        mongodb: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Service is running but DB is down - still return 200 to prevent restarts
      return res.status(200).json({
        status: "degraded",
        service: "epicarehub-backend",
        mongodb: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
