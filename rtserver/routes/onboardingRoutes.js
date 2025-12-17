const express = require("express");
const router = express.Router();
const {
  signUp,
  googleSignUp,
  microsoftSignUp,
  completeOnboarding,
  resendVerificationEmail,
  verifyEmail,
  previewEmail,
  checkEmail,
} = require("../controllers/onboardingController");
const verifyToken = require("../middleware/verifyToken");

router.post("/signup", signUp);

router.post("/microsoft-signup", microsoftSignUp);
router.post("/google-signup", googleSignUp);

router.post("/complete-onboarding", verifyToken, completeOnboarding);

router.post("/resend-email", resendVerificationEmail);

router.post("/verify-email", verifyEmail);

router.get("/preview-email", previewEmail);

router.post("/check-email", checkEmail);

module.exports = router;
