/**
 * requireAdmin Middleware
 * Ensures user is authenticated AND has admin privileges.
 *
 * Usage: Apply to routes requiring admin access (delete, edit patient info)
 * Returns: 401 if not authenticated, 403 if not admin
 *
 * IMPORTANT: This middleware INCLUDES authentication check.
 * Do NOT chain with requireAuth (redundant).
 */
export const requireAdmin = (req, res, next) => {
  // Check authentication first
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to perform this action"
    });
  }

  // Check admin role (with backward compatibility)
  // Default to "user" if field missing for existing users
  const userType = req.session.user.userType || "user";

  if (userType !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin privileges required to perform this action"
    });
  }

  // User is authenticated and admin, proceed
  next();
};
