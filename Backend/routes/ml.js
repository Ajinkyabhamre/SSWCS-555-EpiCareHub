import axios from "axios";

const mlRoutes = (router) => {
  // Health check endpoint for the Python ML service
  router.get("/ml/health", async (req, res) => {
    try {
      const pythonApiUrl =
        process.env.PYTHON_API_URL || "http://localhost:8000";

      const response = await axios.get(`${pythonApiUrl}/health`, {
        timeout: 5000, // 5 second timeout
      });

      return res.status(200).json({
        success: true,
        mlService: response.data,
        backend: "healthy",
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: "ML service is unavailable",
        error: error.message,
        backend: "healthy",
        mlService: "unavailable",
      });
    }
  });

  // Optional: Endpoint to verify the ML service can be reached
  router.post("/ml/test-connection", async (req, res) => {
    try {
      const pythonApiUrl =
        process.env.PYTHON_API_URL || "http://localhost:8000";

      const response = await axios.get(`${pythonApiUrl}/health`, {
        timeout: 5000,
      });

      return res.status(200).json({
        success: true,
        message: "Connected to ML service successfully",
        mlService: response.data,
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: "Cannot connect to ML service",
        error: error.message,
        pythonApiUrl: process.env.PYTHON_API_URL || "http://localhost:8000",
      });
    }
  });
};

export default mlRoutes;
