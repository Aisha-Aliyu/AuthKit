const express = require("express");
const { getSessions, revokeSession, revokeAllSessions } = require("../controllers/sessionController");
const { authenticate } = require("../middleware/auth");
const auditService = require("../services/auditService");

const router = express.Router();

router.use(authenticate);

router.get("/", getSessions);

// The signed-in user's own security log
router.get("/logs", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const result = await auditService.getUserAuditLogs(req.user.id, page, 20);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.delete("/", revokeAllSessions);
router.delete("/:id", revokeSession);

module.exports = router;
