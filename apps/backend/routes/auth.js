/**
 * Auth Routes
 *
 * Diagnostic endpoints for authentication debugging in production.
 * These endpoints help verify that sessions and cookies are working correctly.
 */
import { Router } from "express";

const router = Router();

/**
 * GET /auth/me
 *
 * Returns the current authentication state.
 * Useful for debugging session/cookie issues in production.
 *
 * Response:
 * - authenticated: boolean - whether user is logged in
 * - user: object | null - user info (id, email, name) if authenticated
 * - session: object - session metadata (for debugging)
 */
router.get("/me", (req, res) => {
  const hasCookie = !!req.headers.cookie;
  const hasSession = !!req.session;
  const hasUser = hasSession && !!req.session.user;

  // Log diagnostic info (safe - no sensitive data)
  console.log("[/auth/me] Request diagnostics:", {
    hasCookieHeader: hasCookie,
    hasSession: hasSession,
    hasUser: hasUser,
    sessionID: req.sessionID ? req.sessionID.slice(0, 8) + "..." : null,
    origin: req.headers.origin || "none",
  });

  if (hasUser) {
    const user = req.session.user;
    return res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        userType: user.userType,
      },
      session: {
        id: req.sessionID ? req.sessionID.slice(0, 8) + "..." : null,
        cookiePresent: hasCookie,
      },
    });
  }

  return res.json({
    authenticated: false,
    user: null,
    session: {
      id: req.sessionID ? req.sessionID.slice(0, 8) + "..." : null,
      cookiePresent: hasCookie,
    },
    hint: !hasCookie
      ? "No cookie header received - check withCredentials on frontend"
      : "Cookie present but no session user - session may have expired or been cleared",
  });
});

/**
 * GET /auth/debug
 *
 * Extended debug info for development/troubleshooting.
 * Only available in non-production environments.
 */
router.get("/debug", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Debug endpoint disabled in production" });
  }

  return res.json({
    environment: process.env.NODE_ENV || "development",
    session: {
      id: req.sessionID,
      cookie: req.session?.cookie,
      user: req.session?.user ? { id: req.session.user._id, email: req.session.user.email } : null,
    },
    headers: {
      cookie: req.headers.cookie ? "present" : "missing",
      origin: req.headers.origin,
      host: req.headers.host,
    },
    cors: {
      allowedOrigins: process.env.CORS_ORIGIN || "not set",
    },
  });
});

export default router;
