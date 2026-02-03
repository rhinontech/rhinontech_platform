const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  getAllAutomation,
  createOrUpdateAutomation,
  getArticleForAutomation,
  analyzeURL,
  triggerTraining,
  trainingWebhook,
  deleteTrainingSource
} = require("../controllers/automationController");
const router = express.Router();

router.get("/", verifyToken, getAllAutomation);
router.post("/update-automation", verifyToken, createOrUpdateAutomation);
router.get("/get-article", verifyToken, getArticleForAutomation);
router.post("/analyze-url", verifyToken, analyzeURL);
router.post("/trigger-training", verifyToken, triggerTraining);
router.post("/delete-source", verifyToken, deleteTrainingSource);
router.post("/training-webhook", trainingWebhook); // No auth - internal only

module.exports = router;
