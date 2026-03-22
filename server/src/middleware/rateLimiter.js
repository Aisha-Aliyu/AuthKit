const rateLimit = require("express-rate-limit");

const { ipKeyGenerator } = rateLimit;

// General API: 100/hr
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: { success: false, message: "Too many requests. Try again later." },
});

// Auth routes: 10/15min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    success: false,
    message: "Too many auth attempts. Try again in 15 minutes.",
  },
});

// Password reset: 3/hr
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    success: false,
    message: "Too many password reset requests. Try again later.",
  },
});

module.exports = { apiLimiter, authLimiter, resetLimiter };
