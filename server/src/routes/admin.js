const express = require("express");
const {
  getUsers,
  getUserById,
  changeUserRole,
  toggleUserActive,
  unlockAccount,
  getAuditLogs,
  getStats,
} = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { requireMinRole } = require("../middleware/rbac");

const router = express.Router();

// All admin routes require auth + minimum MODERATOR role
router.use(authenticate);
router.use(requireMinRole("MODERATOR"));

router.get("/stats", requireMinRole("ADMIN"), getStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", requireMinRole("ADMIN"), changeUserRole);
router.put("/users/:id/toggle-active", requireMinRole("ADMIN"), toggleUserActive);
router.post("/users/:id/unlock", unlockAccount);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
