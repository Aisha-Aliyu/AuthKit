const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("✅ Redis connected"));

const connectRedis = async () => {
  await redisClient.connect();
};

// Token blacklist: add revoked access tokens
const blacklistToken = async (token, expirySeconds) => {
  await redisClient.setEx(`blacklist:${token}`, expirySeconds, "1");
};

const isTokenBlacklisted = async (token) => {
  const result = await redisClient.get(`blacklist:${token}`);
  return result === "1";
};

// Account lockout helpers
const incrementLoginAttempts = async (email) => {
  const key = `lockout:${email}`;
  const attempts = await redisClient.incr(key);
  if (attempts === 1) {
    await redisClient.expire(key, parseInt(process.env.LOCKOUT_DURATION_MINS) * 60);
  }
  return attempts;
};

const getLoginAttempts = async (email) => {
  const val = await redisClient.get(`lockout:${email}`);
  return parseInt(val) || 0;
};

const clearLoginAttempts = async (email) => {
  await redisClient.del(`lockout:${email}`);
};

// Rate limiting store (used by express-rate-limit)
const rateLimitStore = {
  async increment(key) {
    const val = await redisClient.incr(`rl:${key}`);
    if (val === 1) await redisClient.expire(`rl:${key}`, 3600);
    return { totalHits: val };
  },
  async decrement(key) {
    await redisClient.decr(`rl:${key}`);
  },
  async resetKey(key) {
    await redisClient.del(`rl:${key}`);
  },
};

module.exports = {
  redisClient,
  connectRedis,
  blacklistToken,
  isTokenBlacklisted,
  incrementLoginAttempts,
  getLoginAttempts,
  clearLoginAttempts,
  rateLimitStore,
};
