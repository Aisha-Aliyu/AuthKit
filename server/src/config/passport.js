const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: GitHubStrategy } = require("passport-github2");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { isTokenBlacklisted } = require("./redis");
const auditService = require("../services/auditService");

const prisma = new PrismaClient();

// ── LOCAL STRATEGY ────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password", passReqToCallback: true },
    async (req, email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || user.provider !== "LOCAL") {
          await auditService.log({
            action: "LOGIN_FAILED",
            req,
            metadata: { email, reason: "User not found" },
            success: false,
          });
          return done(null, false, { message: "Invalid credentials" });
        }

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockedUntil - new Date()) / 60000
          );
          return done(null, false, {
            message: `Account locked. Try again in ${minutesLeft} minute(s).`,
            locked: true,
          });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account deactivated" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          const attempts = user.loginAttempts + 1;
          const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS);
          const updateData = { loginAttempts: attempts };

          if (attempts >= maxAttempts) {
            updateData.lockedUntil = new Date(
              Date.now() + parseInt(process.env.LOCKOUT_DURATION_MINS) * 60000
            );
            await auditService.log({
              userId: user.id,
              action: "ACCOUNT_LOCKED",
              req,
              metadata: { attempts },
            });
          }

          await prisma.user.update({ where: { id: user.id }, data: updateData });
          await auditService.log({
            userId: user.id,
            action: "LOGIN_FAILED",
            req,
            metadata: { attempts },
            success: false,
          });

          return done(null, false, {
            message:
              attempts >= maxAttempts
                ? "Too many failed attempts. Account locked."
                : `Invalid credentials. ${maxAttempts - attempts} attempt(s) remaining.`,
          });
        }

        // Successful login, reset attempts
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null },
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── JWT STRATEGY ─────────────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
    },
    async (req, payload, done) => {
      try {
        // Check blacklist
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        const blacklisted = await isTokenBlacklisted(token);
        if (blacklisted) return done(null, false);

        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user || !user.isActive) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── GOOGLE STRATEGY ──────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findFirst({
          where: { provider: "GOOGLE", providerId: profile.id },
        });

        if (!user) {
          // Check if email already exists with local account
          const existingEmail = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });
          if (existingEmail) {
            return done(null, false, {
              message: "Email already registered with password login.",
            });
          }

          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              displayName: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider: "GOOGLE",
              providerId: profile.id,
              isEmailVerified: true,
              role: "USER",
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── GITHUB STRATEGY ──────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findFirst({
          where: { provider: "GITHUB", providerId: String(profile.id) },
        });

        if (!user) {
          const email =
            profile.emails?.[0]?.value ||
            `${profile.username}@github.local`;

          const existingEmail = await prisma.user.findUnique({
            where: { email },
          });
          if (existingEmail) {
            return done(null, false, {
              message: "Email already registered with another provider.",
            });
          }

          user = await prisma.user.create({
            data: {
              email,
              displayName: profile.displayName || profile.username,
              avatar: profile.photos?.[0]?.value,
              provider: "GITHUB",
              providerId: String(profile.id),
              isEmailVerified: true,
              role: "USER",
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
