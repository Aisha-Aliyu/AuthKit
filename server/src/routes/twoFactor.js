const express = require("express");
const { setup2FA, enable2FA, disable2FA, get2FAStatus } = require("../controllers/twoFactorController");
const { authenticate, requireEmailVerified } = require("../middleware/auth"); 

const router = express.Router();

router.use(authenticate);
router.use(requireEmailVerified);

router.get("/status", get2FAStatus);
router.post("/setup", setup2FA);
router.post("/enable", enable2FA);
router.post("/disable", disable2FA);

module.exports = router;
