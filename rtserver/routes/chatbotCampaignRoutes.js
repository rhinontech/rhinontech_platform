const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
    getAllCampaigns,
    getAllCampaignsForChatbot,
    getCampaignsByType,
    getCampaignById,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
} = require("../controllers/chatbotCampaignController");

const router = express.Router();

// Get all campaigns for the organization
router.get("/", verifyToken, getAllCampaigns);

// Get all campaigns for the organization
router.get("/all", getAllCampaignsForChatbot);

// Get campaigns filtered by type (recurring or one-time)
router.get("/type/:type", verifyToken, getCampaignsByType);

// Get a single campaign by ID
router.get("/:id", verifyToken, getCampaignById);

// Create a new campaign
router.post("/", verifyToken, createCampaign);

// Update an existing campaign
router.put("/:id", verifyToken, updateCampaign);

// Update campaign status only
router.patch("/:id/status", verifyToken, updateCampaignStatus);

// Delete a campaign
router.delete("/:id", verifyToken, deleteCampaign);

module.exports = router;
