const { PrismaClient } = require("@prisma/client");
const { getAllAuditLogs } = require("../services/auditService");
const { revokeAllUserSessions } = require("../services/tokenService");
const auditService = require("../services/auditService");
const { sanitizeUser } = require("../utils/helpers");

const prisma = new PrismaClient();

// @route GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatar: true,
          role: true,
          provider: true,
          isEmailVerified: true,
          isActive: true,
          twoFactorEnabled: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { sessions: true, auditLogs: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        provider: true,
        isEmailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
        loginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        sessions: {
          where: { isRevoked: false, expiresAt: { gt: new Date() } },
          select: {
            id: true, deviceInfo: true, ipAddress: true,
            createdAt: true, lastUsedAt: true,
          },
          orderBy: { lastUsedAt: "desc" },
        },
        _count: { select: { sessions: true, auditLogs: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["USER", "MODERATOR", "ADMIN"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Prevent self-demotion
    if (req.params.id === req.user.id && role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot change your own admin role",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    await auditService.log({
      userId: req.user.id,
      action: "ROLE_CHANGE",
      req,
      metadata: {
        targetUserId: req.params.id,
        newRole: role,
        targetEmail: user.email,
      },
    });

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    // If deactivating, revoke all their sessions
    if (!user.isActive) {
      await revokeAllUserSessions(user.id);
    }

    res.status(200).json({
      success: true,
      message: user.isActive ? "Account activated" : "Account deactivated",
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users/:id/unlock
const unlockAccount = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    await auditService.log({
      userId: req.user.id,
      action: "ACCOUNT_UNLOCKED",
      req,
      metadata: { targetUserId: req.params.id, targetEmail: user.email },
    });

    res.status(200).json({
      success: true,
      message: "Account unlocked successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const page    = parseInt(req.query.page)   || 1;
    const limit   = parseInt(req.query.limit)  || 50;
    const filters = {
      action:  req.query.action   || undefined,
      userId:  req.query.userId   || undefined,
      success: req.query.success !== undefined
        ? req.query.success === "true"
        : undefined,
    };

    const result = await getAllAuditLogs(page, limit, filters);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminCount,
      moderatorCount,
      twoFAUsers,
      oauthUsers,
      lockedUsers,
      recentLogins,
      failedLogins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MODERATOR" } }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.user.count({ where: { provider: { not: "LOCAL" } } }),
      prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
      prisma.auditLog.count({
        where: {
          action: "LOGIN",
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: "LOGIN_FAILED",
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          locked: lockedUsers,
          admins: adminCount,
          moderators: moderatorCount,
          withTwoFA: twoFAUsers,
          oauthUsers,
        },
        activity: {
          loginsLast24h: recentLogins,
          failedLoginsLast24h: failedLogins,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  changeUserRole,
  toggleUserActive,
  unlockAccount,
  getAuditLogs,
  getStats,
};
