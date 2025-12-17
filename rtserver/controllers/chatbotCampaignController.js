const { chatbots, chatbot_campaigns } = require("../models");

/**
 * Get all campaigns for the authenticated organization
 */
const getAllCampaigns = async (req, res) => {
    const { organization_id } = req.user;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    try {
        const campaigns = await chatbot_campaigns.findAll({
            where: { organization_id },
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all campaigns for the authenticated organization
 */
const getAllCampaignsForChatbot = async (req, res) => {
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
        return res.status(400).json({ message: "chatbot_id is required" });
    }

    // Fetch chatbot by chatbot_id
    const chatbot = await chatbots.findOne({
        where: { chatbot_id },
    });

    if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
    }

    try {
        const campaigns = await chatbot_campaigns.findAll({
            where: { organization_id: chatbot.organization_id },
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get campaigns filtered by type (recurring or one-time)
 */
const getCampaignsByType = async (req, res) => {
    const { organization_id } = req.user;
    const { type } = req.params;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    // Validate type parameter
    if (!["recurring", "one-time"].includes(type)) {
        return res.status(400).json({
            error: "Invalid type. Must be 'recurring' or 'one-time'",
        });
    }

    try {
        const campaigns = await chatbot_campaigns.findAll({
            where: { organization_id, type },
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns by type:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get a single campaign by ID
 */
const getCampaignById = async (req, res) => {
    const { organization_id } = req.user;
    const { id } = req.params;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    try {
        const campaign = await chatbot_campaigns.findOne({
            where: { id, organization_id },
        });

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        return res.status(200).json(campaign);
    } catch (error) {
        console.error("Error fetching campaign:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create a new campaign
 */
const createCampaign = async (req, res) => {
    const { organization_id } = req.user;
    const { type, status, content, targeting } = req.body;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    // Validate required fields
    if (!type || !content || !targeting) {
        return res.status(400).json({
            error: "Missing required fields: type, content, and targeting are required",
        });
    }

    // Validate type
    if (!["recurring", "one-time"].includes(type)) {
        return res.status(400).json({
            error: "Invalid type. Must be 'recurring' or 'one-time'",
        });
    }

    // Validate status if provided
    if (status && !["active", "draft", "paused"].includes(status)) {
        return res.status(400).json({
            error: "Invalid status. Must be 'active', 'draft', or 'paused'",
        });
    }

    try {
        const campaign = await chatbot_campaigns.create({
            organization_id,
            type,
            status: status || "draft",
            content,
            targeting,
        });

        return res.status(201).json(campaign);
    } catch (error) {
        console.error("Error creating campaign:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update an existing campaign
 */
const updateCampaign = async (req, res) => {
    const { organization_id } = req.user;
    const { id } = req.params;
    const { type, status, content, targeting } = req.body;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    // Validate type if provided
    if (type && !["recurring", "one-time"].includes(type)) {
        return res.status(400).json({
            error: "Invalid type. Must be 'recurring' or 'one-time'",
        });
    }

    // Validate status if provided
    if (status && !["active", "draft", "paused"].includes(status)) {
        return res.status(400).json({
            error: "Invalid status. Must be 'active', 'draft', or 'paused'",
        });
    }

    try {
        const campaign = await chatbot_campaigns.findOne({
            where: { id, organization_id },
        });

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        // Update only provided fields
        if (type) campaign.type = type;
        if (status) campaign.status = status;
        if (content) campaign.content = content;
        if (targeting) campaign.targeting = targeting;

        await campaign.save();

        return res.status(200).json(campaign);
    } catch (error) {
        console.error("Error updating campaign:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update campaign status only
 */
const updateCampaignStatus = async (req, res) => {
    const { organization_id } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    // Validate status
    if (!["active", "draft", "paused"].includes(status)) {
        return res.status(400).json({
            error: "Invalid status. Must be 'active', 'draft', or 'paused'",
        });
    }

    try {
        const campaign = await chatbot_campaigns.findOne({
            where: { id, organization_id },
        });

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        campaign.status = status;
        await campaign.save();

        return res.status(200).json(campaign);
    } catch (error) {
        console.error("Error updating campaign status:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete a campaign
 */
const deleteCampaign = async (req, res) => {
    const { organization_id } = req.user;
    const { id } = req.params;

    if (!organization_id) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    try {
        const campaign = await chatbot_campaigns.findOne({
            where: { id, organization_id },
        });

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        await campaign.destroy();

        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting campaign:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getAllCampaigns,
    getAllCampaignsForChatbot,
    getCampaignsByType,
    getCampaignById,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
};
