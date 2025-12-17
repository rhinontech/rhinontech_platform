const express = require("express");
const {
  login,
  sendVerificationEmailForForgotPassword,
  verifyForgotPasswordToken,
  changePassword,
  getOutLookToken,
  getOutLookRefreshToken,
  googleLogin,
  microsoftLogin
} = require("../controllers/authController");
const router = express.Router();

router.post("/login", login);

router.post(
  "/send-change-password-token",
  sendVerificationEmailForForgotPassword
);

router.post("/verify-change-password-token", verifyForgotPasswordToken);

router.post("/change-password", changePassword);

router.post("/google-login", googleLogin);

router.post("/microsoft-login", microsoftLogin);

router.post("/get_outlook_token", getOutLookToken);

router.post("/get_outlook_refresh_token", getOutLookRefreshToken);

module.exports = router;
