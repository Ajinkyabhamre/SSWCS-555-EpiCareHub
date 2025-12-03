// Server entry point - handles starting the Express app
import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("We've now got a server!");
  console.log(`Your routes will be running on http://localhost:${PORT}`);
});
