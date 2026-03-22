require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const passport = require("./src/config/passport");
const { connectRedis } = require("./src/config/redis");
const { apiLimiter } = require("./src/middleware/rateLimiter");
const sanitizeRequest = require("./src/middleware/sanitize");
const errorHandler = require("./src/middleware/errorHandler");
const securityHeaders = require("./src/middleware/securityHeaders");

const authRoutes = require("./src/routes/auth");
const sessionRoutes = require("./src/routes/sessions");
const twoFactorRoutes = require("./src/routes/twoFactor");
const adminRoutes = require("./src/routes/admin");

const app = express();

// Trust proxy
app.set("trust proxy", 1);

// Connect Redis
connectRedis();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CLIENT_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Passport
app.use(passport.initialize());

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/2fa", twoFactorRoutes);
app.use("/api/admin", adminRoutes);

// Health
app.get("/health", (req, res) =>
  res.json({ status: "OK", app: "AuthKit API" })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`AuthKit running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
