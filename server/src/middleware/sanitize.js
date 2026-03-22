const xss = require("xss");

const sanitizeValue = (value) => {
  if (typeof value === "string") return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$")) continue;
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};

module.exports = sanitizeRequest;
