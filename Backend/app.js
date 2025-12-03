// MUST be first: Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Then import other modules that depend on env vars
import express from "express";
import cors from "cors";
import configRoutesFunction from "./routes/index.js";
import session from "express-session";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `ERROR: Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("Please create a .env file with the required variables.");
  process.exit(1);
}

const app = express();

app.use(
  session({
    name: "AuthenticationSession",
    secret: process.env.SESSION_SECRET || "change_me_in_production",
    saveUninitialized: false,
    resave: false,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

configRoutesFunction(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("We've now got a server!");
  console.log(`Your routes will be running on http://localhost:${PORT}`);
});

export default app;
