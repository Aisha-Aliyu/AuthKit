const passport = require("passport");

const authenticate = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — invalid or expired token",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before accessing this feature",
    });
  }
  next();
};

module.exports = { authenticate, requireEmailVerified };
