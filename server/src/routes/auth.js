const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const {
  register,
  login,
  loginWith2FA,
  logout,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  oauthCallback,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter, resetLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// ── Public routes ─────────────────────────────────────────

router.post(
  "/register",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Min 8 characters"),
    body("displayName").optional().trim().isLength({ max: 50 }),
  ],
  register
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  login
);

router.post("/login/2fa", authLimiter, loginWith2FA);

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }
    const { accessToken, refreshToken: newRefreshToken, user } = await refreshAccessToken(refreshToken, req);
    await auditService.log({ userId: user.id, action: "TOKEN_REFRESH", req });
    res.status(200).json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.message.includes("expired") || error.message.includes("revoked") || error.message.includes("not found")) {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.get("/verify-email", verifyEmail);

router.post(
  "/forgot-password",
  resetLimiter,
  [body("email").isEmail().normalizeEmail()],
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty(),
    body("password").isLength({ min: 8 }),
  ],
  resetPassword
);

// ── Google OAuth ──────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  oauthCallback
);

// ── GitHub OAuth ──────────────────────────────────────────

router.get(
  "/github",
  passport.authenticate("github", { session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  oauthCallback
);

// ── Protected routes ──────────────────────────────────────

router.get("/me", authenticate, getMe);

router.put(
  "/profile",
  authenticate,
  [
    body("displayName").optional().trim().isLength({ max: 50 }),
    body("avatar").optional().isURL(),
  ],
  updateProfile
);

router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  changePassword
);

router.post("/logout", authenticate, logout);

router.post("/resend-verification", authenticate, resendVerification);

module.exports = router;
