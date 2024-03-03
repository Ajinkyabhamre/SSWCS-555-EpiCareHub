import express from "express";
import cors from "cors";
const app = express();
import configRoutesFunction from "./routes/index.js";

import bodyParser from "body-parser";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

configRoutesFunction(app);
app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});
