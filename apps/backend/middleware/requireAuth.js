/**
 * requireAuth Middleware
 * Ensures user is authenticated by checking session.
 *
 * Usage: Apply to any route requiring authentication
 * Returns: 401 if not authenticated
 *
 * Includes diagnostic logging to help debug production auth issues.
 */
export const requireAuth = (req, res, next) => {
  // Log diagnostic info for auth debugging (safe - no sensitive data logged)
  const hasCookieHeader = !!req.headers.cookie;
  const hasSession = !!req.session;
  const hasUser = hasSession && !!req.session.user;

  // Only log auth failures or when DEBUG_AUTH is set to reduce noise
  if (!hasUser || process.env.DEBUG_AUTH === "true") {
    console.log(`[Auth] ${req.method} ${req.path}:`, {
      cookiePresent: hasCookieHeader,
      sessionPresent: hasSession,
      userPresent: hasUser,
      sessionID: req.sessionID ? req.sessionID.slice(0, 8) + "..." : null,
      origin: req.headers.origin || "none",
    });
  }

  // Check if user session exists
  if (!hasSession || !hasUser) {
    // Provide helpful debug hints
    let hint = "Session or user not found";
    if (!hasCookieHeader) {
      hint = "No cookie header - ensure frontend sends withCredentials: true";
    } else if (!hasSession) {
      hint = "Cookie received but session not found - possible session store issue";
    } else if (!hasUser) {
      hint = "Session exists but no user - session may have expired or user never logged in";
    }

    console.log(`[Auth] 401 Unauthorized for ${req.method} ${req.path}: ${hint}`);

    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to perform this action",
      code: "AUTH_REQUIRED",
      // Only include hint in non-production for debugging
      ...(process.env.NODE_ENV !== "production" && { hint }),
    });
  }

  // User is authenticated, proceed
  next();
};
