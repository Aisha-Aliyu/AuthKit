const express = require("express");
const { getSessions, revokeSession, revokeAllSessions } = require("../controllers/sessionController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", getSessions);
router.delete("/", revokeAllSessions);
router.delete("/:id", revokeSession);

module.exports = router;
