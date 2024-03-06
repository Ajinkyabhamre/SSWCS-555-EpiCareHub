import paitentRoutes from "./patients.js";
import userRoutes from "./user.js";

const constructorMethod = (app) => {
  app.use("/patients", paitentRoutes);
  app.use("/users", userRoutes);

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
