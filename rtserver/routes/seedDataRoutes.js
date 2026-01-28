const express = require("express");
const router = express.Router();
const seedDataController = require("../controllers/seedDataController");
const verifyToken = require("../middleware/verifyToken");

// All routes require authentication (assuming auth middleware is applied globally or at app level)
// Get seed data status
router.get("/status", verifyToken, seedDataController.getStatus);

// Add seed data
router.post("/", verifyToken, seedDataController.addSeedData);

// Delete seed data
router.delete("/", verifyToken, seedDataController.deleteSeedData);

module.exports = router;
