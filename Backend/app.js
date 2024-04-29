import express from "express";
import cors from "cors";
const app = express();
import configRoutesFunction from "./routes/index.js";

import session from "express-session";

import fileUpload from "express-fileupload";

import bodyParser from "body-parser";

app.use(
  session({
    name: "AuthenticationSession",
    secret: "Epicare Hub data message",
    saveUninitialized: false,
    resave: false,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

configRoutesFunction(app);
app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});

export default app;
