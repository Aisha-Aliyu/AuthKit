# AuthKit

![AuthKit](docs/authkit-banner.png)

**A production-grade authentication system built with Node.js, Passport.js, PostgreSQL, and Redis. Covers every auth pattern a senior engineer would expect to see in a real product.**

![Stack](https://img.shields.io/badge/Stack-Node.js_+_React-8a2b2b?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-Passport.js_+_JWT-3b0a0a?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-f2c9c9?style=flat-square)

-----

## What it is

AuthKit is a full-stack authentication system that goes well beyond username and password. It implements the complete surface area of authentication that production apps actually need: multiple login strategies, cryptographically secure token management, role-based access control, two-factor authentication, device session management, and a tamper-resistant audit trail.

The frontend is a clean React dashboard where users manage their own security settings, and admins get a full control panel with platform statistics, user management, and audit log access.

-----

## Live Demo

**Frontend:** [humsy-authkit.vercel.app](https://humsy-authkit.vercel.app)  
**API:** [authentication-system-production-6764.up.railway.app/health](https://authentication-system-production-6764.up.railway.app/health)

**Demo credentials:**

```
Admin:  admin@authkit.dev  /  Admin@AuthKit1!
```

-----

## Auth Strategies

|Strategy        |Implementation                                                    |
|----------------|------------------------------------------------------------------|
|Email + Password|Passport LocalStrategy, bcrypt (12 rounds), zxcvbn strength check |
|Google OAuth 2.0|Passport google-oauth20, automatic account creation               |
|GitHub OAuth    |Passport github2, email scope, automatic account creation         |
|JWT             |Short-lived access tokens (15min) + long-lived refresh tokens (7d)|

-----

## Feature Overview

**Token architecture**

- Access tokens expire in 15 minutes. short enough to limit damage if leaked
- Refresh tokens are UUIDs stored in PostgreSQL, not in the JWT itself
- Refresh token rotation, every refresh issues a new token and invalidates the old one
- Logout blacklists the access token in Redis so it cannot be reused before expiry
- All sessions are stored in the database — every active device is visible and revocable

**Security layer**

- Account lockout after 5 consecutive failed login attempts (configurable)
- Lockout stored in Redis with a 15-minute TTL, automatically unlocks
- Password strength validation via zxcvbn (score 3+ required)
- NoSQL operator stripping on all request bodies which prevents injection via `$where`, `$gt`
- XSS sanitization via recursive sanitizer on all string inputs
- Helmet with hardened CSP, `X-Frame-Options: DENY`, `HSTS`, `Referrer-Policy`
- Body size limited to 10kb to prevent DoS via large payloads
- Account enumeration prevention: forgot password returns the same response regardless of whether the email exists

**Role-based access control**

- Three roles: `USER`, `MODERATOR`, `ADMIN`
- Role hierarchy middleware: `requireMinRole("MODERATOR")` checks level, not just label
- Self-demotion prevention: admins cannot demote themselves
- Admin routes require `MODERATOR` minimum; destructive actions require `ADMIN`

**Two-factor authentication**

- TOTP compatible with Google Authenticator, Authy, and any RFC 6238 app
- QR code generated server-side with speakeasy + qrcode
- Temporary secret stored until user verifies with a valid code
- All existing sessions revoked when 2FA is enabled. Forces re-login with 2FA
- Disable requires current TOTP code. It cannot be disabled without the device

**Session management**

- Every login creates a session record in PostgreSQL
- Sessions store device info (parsed from User-Agent), IP address, creation time, last used time
- Users see all active sessions from the dashboard
- Any individual session can be revoked — kicks that device out immediately
- “Revoke all” option logs out every other device at once
- Expired and revoked sessions are cleaned up automatically

**Audit log**

- Every auth event is logged: register, login, failed login, logout, token refresh, password change, password reset, email verify, 2FA enable/disable, session revoke, account lock/unlock, OAuth login, role change
- Logs store user ID, IP address, User-Agent, timestamp, success flag, and metadata
- PostgreSQL indexes on userId, action, and createdAt for fast queries
- Admins can filter logs by action, user, or success status

**Email flows**

- Email verification sent on register; 24-hour expiry token
- Password reset email; 1-hour expiry token
- Both use cryptographically random 32-byte hex tokens via `crypto.randomBytes`

-----

## Tech Stack

|Layer           |Technology                                             |
|----------------|-------------------------------------------------------|
|Backend         |Node.js, Express 5                                     |
|Auth            |Passport.js (Local, JWT, Google, GitHub strategies)    |
|Database        |PostgreSQL via Neon, Prisma ORM                        |
|Cache / Sessions|Redis (token blacklist, rate limiting, account lockout)|
|Frontend        |React 18, Vite                                         |
|State           |Zustand with persistence                               |
|Server state    |TanStack Query v5                                      |
|Email           |Nodemailer                                             |
|2FA             |speakeasy (TOTP), qrcode                               |
|Security        |Helmet, express-rate-limit, xss, zxcvbn, bcryptjs      |
|Deployment      |Railway (backend), Vercel (frontend)                   |

-----

## API Reference

**Auth (public)**

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/login/2fa
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify-email?token=
GET  /api/auth/google
GET  /api/auth/github
```

**Auth (protected)**

```
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
POST /api/auth/logout
POST /api/auth/resend-verification
```

**Two-Factor Auth**

```
GET  /api/2fa/status
POST /api/2fa/setup
POST /api/2fa/enable
POST /api/2fa/disable
```

**Sessions**

```
GET    /api/sessions
DELETE /api/sessions
DELETE /api/sessions/:id
```

**Admin (MODERATOR+)**

```
GET  /api/admin/stats
GET  /api/admin/users
GET  /api/admin/users/:id
PUT  /api/admin/users/:id/role
PUT  /api/admin/users/:id/toggle-active
POST /api/admin/users/:id/unlock
GET  /api/admin/audit-logs
```

-----

## Database Schema

```
User
  id, email, password (hashed), displayName, avatar
  role (USER | MODERATOR | ADMIN)
  provider (LOCAL | GOOGLE | GITHUB), providerId
  isEmailVerified, emailVerifyToken, emailVerifyExpiry
  resetToken, resetTokenExpiry
  twoFactorEnabled, twoFactorSecret
  loginAttempts, lockedUntil, isActive

Session
  id, userId, refreshToken (unique)
  deviceInfo, ipAddress, userAgent
  isRevoked, expiresAt, lastUsedAt

AuditLog
  id, userId, action (enum, 18 values)
  ipAddress, userAgent, metadata (JSON)
  success, createdAt
```

-----

## Getting Started

**Prerequisites:** Node.js 18+, PostgreSQL (Neon free tier), Redis

**Clone the repo**

```bash
git clone https://github.com/Aisha-Aliyu/AuthKit.git
cd AuthKit
```

**Backend setup**

```bash
cd server
npm install
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, JWT secrets, OAuth keys
npx prisma generate
npx prisma db push
npm run db:seed        # Creates admin@authkit.dev
npm run dev
```

**Frontend setup**

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm run dev
```

**Generate secure JWT secrets**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

-----

## Environment Variables

**server/.env**

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host/authkit
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=64_char_hex
JWT_REFRESH_SECRET=64_char_hex
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=AuthKit <noreply@authkit.dev>
CLIENT_URL=http://localhost:5173
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINS=15
```

**client/.env**

```
VITE_API_URL=http://localhost:5000/api
```

-----

## Design Decisions

**Why PostgreSQL over MongoDB?**
Auth systems have relational data. Users have sessions. Sessions have audit logs. Roles have a defined hierarchy. A relational schema enforces these relationships at the database level; foreign keys, cascading deletes, and indexed joins. MongoDB would work but requires manual enforcement of what PostgreSQL gives for free.

**Why store refresh tokens in the database instead of as JWTs?**
A JWT refresh token cannot be revoked before expiry without a blacklist, which defeats the purpose of using JWTs. By storing refresh tokens as opaque UUIDs in PostgreSQL, revocation is instant; delete the row and the token is dead. The session table also enables the device management feature, which is impossible with stateless tokens.

**Why Redis for the access token blacklist instead of PostgreSQL?**
Access tokens expire in 15 minutes. Blacklisting them only needs to last until expiry. Redis with a TTL is purpose-built for this, a SET with EXPIRY is a single O(1) operation. Querying PostgreSQL on every request would add unnecessary latency and table bloat.

**Why Passport.js over a custom auth implementation?**
Passport has battle-tested strategy implementations for every OAuth provider. The alternative is manually handling OAuth 2.0 authorization codes, token exchanges, and provider-specific quirks for each provider. Passport handles that. What this project builds on top of it: token management, RBAC, session tracking, audit logging, is where the engineering actually lives.

**Why refresh token rotation?**
Without rotation, a stolen refresh token gives an attacker permanent access until the user logs out. With rotation, every use of a refresh token issues a new one and invalidates the old. If a token is used twice, it means someone has a copy of it, the second use should invalidate the entire session.

-----

## What I learned building this

The hardest part was getting the 2FA login flow right. The problem is that Passport’s `done(null, user)` callback immediately creates a session, but with 2FA you need to verify a TOTP code first. The solution was intercepting after Passport validates credentials, issuing a temporary short-lived token stored in Redis, and only issuing the real JWT pair after the TOTP code is verified against that temp token. The temp token acts as a pending session that only gets promoted on successful 2FA.

Refresh token rotation introduced a race condition I didn’t anticipate. If two requests hit the refresh endpoint simultaneously with the same token, both would succeed and issue different new tokens, leaving one request with a now-invalid token. The fix is handling this at the database level with Prisma’s unique constraint on `refreshToken`. The second concurrent write fails with a unique violation, which the client handles by retrying with the new token from the first response.

Building the audit log to never crash the application required wrapping every `auditService.log()` call in its own try-catch that swallows errors silently. An audit log failure is never worth taking down the feature that triggered it.

-----

## Author

**Aisha Aliyu (Hums)**  
Founder, BLOODLINE Studios  
Software Engineer and Aspiring Roboticist

[GitHub](https://github.com/Aisha-Aliyu) · [Portfolio](https://humairah.netlify.app)

-----

## License

MIT. Build on it, study it, ship it.
