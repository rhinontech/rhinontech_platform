const express = require("express");
const {
  sendEmailGoogle
} = require("../utils/sendEmail");

const router = express.Router();

router.post("/send", sendEmailGoogle);

module.exports = router;
