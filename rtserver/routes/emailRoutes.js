const express = require("express");
const { sendEmailGoogle } = require("../utils/sendEmail");
const { handleIncomingEmail } = require("../controllers/emailController");

const router = express.Router();

router.post("/send", sendEmailGoogle);
router.post("/incoming", handleIncomingEmail);

module.exports = router;
