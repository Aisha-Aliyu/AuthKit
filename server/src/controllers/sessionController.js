const { PrismaClient } = require("@prisma/client");
const {
  getUserSessions,
  revokeSessionById,
  revokeAllUserSessions,
} = require("../services/tokenService");
const auditService = require("../services/auditService");

const prisma = new PrismaClient();

// @route GET /api/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await getUserSessions(req.user.id);
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/sessions/:id
const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    await revokeSessionById(id, req.user.id);

    await auditService.log({
      userId: req.user.id,
      action: "SESSION_REVOKE",
      req,
      metadata: { sessionId: id },
    });

    res.status(200).json({ success: true, message: "Session revoked" });
  } catch (error) {
    if (error.message === "Not authorized to revoke this session") {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === "Session not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @route DELETE /api/sessions
// Revoke all sessions except the current one
const revokeAllSessions = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Revoke all
    await revokeAllUserSessions(req.user.id);

    await auditService.log({
      userId: req.user.id,
      action: "SESSION_REVOKE",
      req,
      metadata: { scope: "all" },
    });

    res.status(200).json({
      success: true,
      message: "All sessions revoked. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSessions, revokeSession, revokeAllSessions };
