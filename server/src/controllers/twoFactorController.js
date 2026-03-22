const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { PrismaClient } = require("@prisma/client");
const auditService = require("../services/auditService");
const { revokeAllUserSessions } = require("../services/tokenService");

const prisma = new PrismaClient();

// @route POST /api/2fa/setup
// Generates secret + QR code, user has NOT enabled 2FA yet
const setup2FA = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `AuthKit (${req.user.email})`,
      issuer: "AuthKit",
      length: 20,
    });

    // Store temp secret. Not enabled until user verifies
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      message: "Scan the QR code with Google Authenticator, then verify with a code",
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/2fa/enable
// User provides TOTP code to confirm setup and enable 2FA
const enable2FA = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "Run 2FA setup first",
      });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.replace(/\s/g, ""),
      window: 1,
    });

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid code — make sure your authenticator app is synced",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    // Revoke all existing sessions. User must re-login with 2FA
    await revokeAllUserSessions(user.id);

    await auditService.log({
      userId: user.id,
      action: "TWO_FA_ENABLE",
      req,
    });

    res.status(200).json({
      success: true,
      message: "2FA enabled successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/2fa/disable
// User provides current TOTP code to disable 2FA
const disable2FA = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.replace(/\s/g, ""),
      window: 1,
    });

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid code",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await auditService.log({
      userId: user.id,
      action: "TWO_FA_DISABLE",
      req,
    });

    res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/2fa/status
const get2FAStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    enabled: req.user.twoFactorEnabled,
  });
};

module.exports = { setup2FA, enable2FA, disable2FA, get2FAStatus };
