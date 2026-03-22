require("dotenv").config();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const { isTokenBlacklisted } = require("../config/redis");
const UAParser = require("ua-parser-js");

const prisma = new PrismaClient();

const parseDevice = (uaString) => {
  if (!uaString) return "Unknown device";
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  const os = result.os?.name || "";
  const browser = result.browser?.name || "";
  const device = result.device?.type || "";

  if (device === "mobile") return `Mobile — ${os} / ${browser}`;
  if (device === "tablet") return `Tablet — ${os} / ${browser}`;
  if (os && browser) return `${os} — ${browser}`;
  return "Unknown device";
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
    jwtid: uuidv4(),
  });
};

const generateRefreshToken = () => uuidv4();

const createTokenPair = async (user, req) => {
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const ua = req.headers["user-agent"] || "Unknown";
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.connection?.remoteAddress ||
    "Unknown";

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      deviceInfo: parseDevice(ua),
      ipAddress: ip,
      userAgent: ua,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken, req) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.isRevoked) {
    throw new Error("Session has been revoked");
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
    throw new Error("Session expired — please log in again");
  }

  if (!session.user.isActive) {
    throw new Error("Account has been deactivated");
  }

  // Rotate refresh token — invalidate old, issue new
  const newRefreshToken = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date(),
    },
  });

  const accessToken = generateAccessToken({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: session.user,
  };
};

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  await prisma.session.updateMany({
    where: { refreshToken },
    data: { isRevoked: true },
  });
};

const revokeAllUserSessions = async (userId) => {
  await prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
};

const revokeSessionById = async (sessionId, userId) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.userId !== userId) {
    throw new Error("Not authorized to revoke this session");
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
};

const getUserSessions = async (userId) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  });
  return sessions;
};

const cleanupExpiredSessions = async () => {
  const deleted = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isRevoked: true,
          updatedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });
  return deleted.count;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  createTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  revokeSessionById,
  getUserSessions,
  cleanupExpiredSessions,
};
