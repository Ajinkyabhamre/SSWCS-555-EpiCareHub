import paitentRoutes from "./paitents.js";

const constructorMethod = (app) => {
  app.use("/paitents", paitentRoutes);

  app.use("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });
};

export default constructorMethod;
