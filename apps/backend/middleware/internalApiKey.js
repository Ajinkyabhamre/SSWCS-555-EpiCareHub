/**
 * Internal API Key Middleware
 * Protects internal endpoints (e.g., Python → Node callbacks) with a simple API key.
 *
 * Usage:
 *   Apply to specific routes that should only be called by internal services.
 *
 * Environment Variables:
 *   EPICARE_INTERNAL_API_KEY - The API key to validate against
 *
 * Behavior:
 *   - If EPICARE_INTERNAL_API_KEY is not set: Skip validation (dev-friendly)
 *   - If set: Require x-epicare-key header to match
 */

export const validateInternalApiKey = (req, res, next) => {
  const expectedApiKey = process.env.EPICARE_INTERNAL_API_KEY;

  // If no API key is configured, skip validation (development mode)
  if (!expectedApiKey) {
    return next();
  }

  // Check for API key in request headers
  const providedApiKey = req.headers["x-epicare-key"];

  if (!providedApiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing x-epicare-key header",
    });
  }

  if (providedApiKey !== expectedApiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key",
    });
  }

  // API key is valid, proceed
  next();
};
