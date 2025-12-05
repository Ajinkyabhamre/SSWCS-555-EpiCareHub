// Server entry point - handles starting the Express app
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Startup configuration warnings
if (!process.env.PYTHON_API_URL) {
  console.warn(
    "[WARNING] PYTHON_API_URL is not set. Falling back to http://localhost:8000"
  );
}

if (!process.env.NODE_API_URL) {
  console.warn(
    "[WARNING] NODE_API_URL is not set. Falling back to http://localhost:3000"
  );
}

if (!process.env.EPICARE_INTERNAL_API_KEY) {
  console.warn(
    "[WARNING] EPICARE_INTERNAL_API_KEY is not set. Python → Node callbacks will not be authenticated (OK for development, NOT OK for production)."
  );
}

app.listen(PORT, () => {
  console.log("We've now got a server!");
  console.log(`Your routes will be running on http://localhost:${PORT}`);
});
