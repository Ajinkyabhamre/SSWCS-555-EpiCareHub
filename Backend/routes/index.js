import paitentRoutes from "./patients.js";
import userRoutes from "./user.js";
import usersDetailRoutes from "./usersDetails.js";
import mlRoutes from "./ml.js";
import studiesRoutes from "./studies.js";
import devRoutes from "./dev.js";
import debugRoutes from "./debug.js";
import { Router } from "express";

const constructorMethod = (app) => {
  const router = Router();

  app.use("/patients", paitentRoutes);
  app.use("/", userRoutes);
  app.use("/usersDetails", usersDetailRoutes);
  app.use("/studies", studiesRoutes);

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

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
