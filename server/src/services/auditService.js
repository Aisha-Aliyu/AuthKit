const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const log = async ({ userId, action, req, metadata, success = true }) => {
  try {
    const ip = req?.ip || req?.connection?.remoteAddress || null;
    const ua = req?.headers?.["user-agent"] || null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        ipAddress: ip,
        userAgent: ua,
        metadata: metadata || undefined,
        success,
      },
    });
  } catch (err) {
    // Audit log failure should never crash the app
    console.error("Audit log error:", err.message);
  }
};

const getUserAuditLogs = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where: { userId } }),
  ]);
  return { logs, total, pages: Math.ceil(total / limit) };
};

const getAllAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (filters.action) where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;
  if (filters.success !== undefined) where.success = filters.success;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { email: true, displayName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total, pages: Math.ceil(total / limit) };
};

module.exports = { log, getUserAuditLogs, getAllAuditLogs };
