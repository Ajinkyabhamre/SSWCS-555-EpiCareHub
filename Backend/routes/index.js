import paitentRoutes from "./patients.js";

const constructorMethod = (app) => {
  app.use("/patients", paitentRoutes);

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
