/**
 * requireAuth Middleware
 * Ensures user is authenticated by checking session.
 *
 * Usage: Apply to any route requiring authentication
 * Returns: 401 if not authenticated
 */
export const requireAuth = (req, res, next) => {
  // Check if user session exists
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to perform this action"
    });
  }

  // User is authenticated, proceed
  next();
};
