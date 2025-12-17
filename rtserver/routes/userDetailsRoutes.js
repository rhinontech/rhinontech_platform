const express = require("express");
const {
  getUserDetails,
  changeUserRole,
  getProfileDetails,
  updateProfileDetails,
  changePassword,
  getActivities,
  getDashboardCounts,
  getOnboarding,
} = require("../controllers/userDetailsController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/", verifyToken, getUserDetails);

router.post("/change-role", verifyToken, changeUserRole);

router.get("/get-profile-details", verifyToken, getProfileDetails);
router.patch("/update-profile-details", verifyToken, updateProfileDetails);
router.post("/change-password", verifyToken, changePassword);

router.get("/activities", verifyToken, getActivities);

//dashboard details

router.get("/dashboard-details", verifyToken, getDashboardCounts);
router.get("/onboarding", verifyToken, getOnboarding);

module.exports = router;
