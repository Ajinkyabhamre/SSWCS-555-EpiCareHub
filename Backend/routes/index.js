import paitentRoutes from "./patients.js";
import userRoutes from "./user.js";
import usersDetailRoutes from "./usersDetails.js";
import mlRoutes from "./ml.js";
import { Router } from "express";

const constructorMethod = (app) => {
  const router = Router();

  app.use("/patients", paitentRoutes);
  app.use("/", userRoutes);
  app.use("/usersDetails", usersDetailRoutes);

  // Add ML service health check routes
  mlRoutes(router);
  app.use("/", router);

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
