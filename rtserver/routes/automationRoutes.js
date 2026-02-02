const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  getAllAutomation,
  createOrUpdateAutomation,
  getArticleForAutomation,
  analyzeURL
} = require("../controllers/automationController");
const router = express.Router();

router.get("/", verifyToken, getAllAutomation);
router.post("/update-automation", verifyToken, createOrUpdateAutomation);
router.get("/get-article", verifyToken, getArticleForAutomation);
router.post("/analyze-url", verifyToken, analyzeURL);

module.exports = router;
