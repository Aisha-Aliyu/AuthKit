const crypto = require("crypto");
const zxcvbn = require("zxcvbn");

// Generate a cryptographically secure token
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

// Check password strength: returns { strong, score, feedback }
const checkPasswordStrength = (password) => {
  const result = zxcvbn(password);
  return {
    score: result.score, // 0-4
    strong: result.score >= 3,
    feedback: result.feedback.suggestions.join(" "),
    warning: result.feedback.warning || null,
  };
};

// Sanitize user object before sending to client, never expose secrets
const sanitizeUser = (user) => {
  const {
    password,
    twoFactorSecret,
    emailVerifyToken,
    emailVerifyExpiry,
    resetToken,
    resetTokenExpiry,
    loginAttempts,
    ...safe
  } = user;
  return safe;
};

// Parse expiry string to seconds 
const parseExpiryToSeconds = (expiry) => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 60);
};

module.exports = {
  generateSecureToken,
  checkPasswordStrength,
  sanitizeUser,
  parseExpiryToSeconds,
};
