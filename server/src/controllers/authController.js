const bcrypt = require("bcryptjs");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const speakeasy = require("speakeasy");

const {
  createTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} = require("../services/tokenService");
const { blacklistToken } = require("../config/redis");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/email");
const auditService = require("../services/auditService");
const {
  generateSecureToken,
  checkPasswordStrength,
  sanitizeUser,
  parseExpiryToSeconds,
} = require("../utils/helpers");

const prisma = new PrismaClient();

// ── REGISTER ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    // Password strength check
    const strength = checkPasswordStrength(password);
    if (!strength.strong) {
      return res.status(400).json({
        success: false,
        message: "Password is too weak",
        feedback: strength.feedback,
        warning: strength.warning,
        score: strength.score,
      });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerifyToken = generateSecureToken();
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || email.split("@")[0],
        emailVerifyToken,
        emailVerifyExpiry,
        role: "USER",
        provider: "LOCAL",
      },
    });

    // Send verification email, non-blocking
    sendVerificationEmail(user.email, emailVerifyToken).catch((err) =>
      console.error("Email send error:", err.message)
    );

    await auditService.log({
      userId: user.id,
      action: "REGISTER",
      req,
      metadata: { email: user.email },
    });

    const { accessToken, refreshToken } = await createTokenPair(user, req);

    res.status(201).json({
      success: true,
      message: "Account created. Please verify your email.",
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ────────────────────────────────────────────────
const login = (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid credentials",
          locked: info?.locked || false,
        });
      }

      try {
        // Check if 2FA is enabled, don't issue tokens yet
        if (user.twoFactorEnabled) {
          const tempToken = generateSecureToken(16);
          // Store temp token in Redis for 5 min
          const { redisClient } = require("../config/redis");
          await redisClient.setEx(`2fa_pending:${tempToken}`, 300, user.id);

          await auditService.log({
            userId: user.id,
            action: "LOGIN",
            req,
            metadata: { step: "2fa_required" },
          });

          return res.status(200).json({
            success: true,
            requiresTwoFactor: true,
            tempToken,
            message: "2FA verification required",
          });
        }

        const { accessToken, refreshToken } = await createTokenPair(user, req);

        await auditService.log({
          userId: user.id,
          action: "LOGIN",
          req,
          metadata: { provider: "local" },
        });

        res.status(200).json({
          success: true,
          accessToken,
          refreshToken,
          user: sanitizeUser(user),
        });
      } catch (error) {
        next(error);
      }
    }
  )(req, res, next);
};

// ── LOGIN 2FA VERIFY ─────────────────────────────────────
const loginWith2FA = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        message: "Temp token and 2FA code required",
      });
    }

    const { redisClient } = require("../config/redis");
    const userId = await redisClient.get(`2fa_pending:${tempToken}`);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired 2FA session. Please log in again.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.replace(/\s/g, ""),
      window: 1,
    });

    if (!valid) {
      await auditService.log({
        userId: user.id,
        action: "TWO_FA_VERIFY",
        req,
        metadata: { success: false },
        success: false,
      });
      return res.status(401).json({ success: false, message: "Invalid 2FA code" });
    }

    // Consume temp token
    await redisClient.del(`2fa_pending:${tempToken}`);

    const { accessToken, refreshToken } = await createTokenPair(user, req);

    await auditService.log({
      userId: user.id,
      action: "TWO_FA_VERIFY",
      req,
      metadata: { success: true },
    });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ── LOGOUT ───────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.split(" ")[1];
      const expiry = parseExpiryToSeconds(process.env.JWT_ACCESS_EXPIRES);
      await blacklistToken(accessToken, expiry);
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    await auditService.log({
      userId: req.user?.id,
      action: "LOGOUT",
      req,
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ── REFRESH TOKEN ────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const { accessToken, user } = await refreshAccessToken(refreshToken, req);

    await auditService.log({
      userId: user.id,
      action: "TOKEN_REFRESH",
      req,
    });

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    if (
      error.message.includes("expired") ||
      error.message.includes("revoked") ||
      error.message.includes("not found")
    ) {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── VERIFY EMAIL ─────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    await auditService.log({
      userId: user.id,
      action: "EMAIL_VERIFY",
      req,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── RESEND VERIFICATION ──────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const emailVerifyToken = generateSecureToken();
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken, emailVerifyExpiry },
    });

    await sendVerificationEmail(user.email, emailVerifyToken);

    res.status(200).json({
      success: true,
      message: "Verification email resent",
    });
  } catch (error) {
    next(error);
  }
};

// ── FORGOT PASSWORD ──────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase() },
    });

    // Always respond the same, prevents email enumeration
    const successResponse = {
      success: true,
      message: "If an account exists, a reset link has been sent",
    };

    if (!user || user.provider !== "LOCAL") {
      return res.status(200).json(successResponse);
    }

    const resetToken = generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendPasswordResetEmail(user.email, resetToken);

    await auditService.log({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      req,
    });

    res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ───────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password required",
      });
    }

    const strength = checkPasswordStrength(password);
    if (!strength.strong) {
      return res.status(400).json({
        success: false,
        message: "Password is too weak",
        feedback: strength.feedback,
        score: strength.score,
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revoke all sessions after password reset. Security best practice
    await revokeAllUserSessions(user.id);

    await auditService.log({
      userId: user.id,
      action: "PASSWORD_RESET",
      req,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

// ── CHANGE PASSWORD (authenticated) ─────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new password required",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must differ from current password",
      });
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.strong) {
      return res.status(400).json({
        success: false,
        message: "New password is too weak",
        feedback: strength.feedback,
        score: strength.score,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await auditService.log({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      req,
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── GET ME ───────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE PROFILE ───────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatar } = req.body;
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    await auditService.log({
      userId: user.id,
      action: "PROFILE_UPDATE",
      req,
    });

    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── OAUTH CALLBACK HANDLER ───────────────────────────────
const oauthCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_failed`
      );
    }

    const { accessToken, refreshToken } = await createTokenPair(req.user, req);

    await auditService.log({
      userId: req.user.id,
      action: "OAUTH_LOGIN",
      req,
      metadata: { provider: req.user.provider },
    });

    // Redirect to frontend with tokens in query 
    res.redirect(
      `${process.env.CLIENT_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
