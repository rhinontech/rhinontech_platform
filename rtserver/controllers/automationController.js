const { automations, onboardings, articles } = require("../models");
const axios = require("axios");
const { logActivity } = require("../utils/activityLogger");

/**
 * Normalize training items to ensure they have is_trained field
 */
function normalizeTrainingItems(items, type) {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    is_trained: item.is_trained !== undefined ? item.is_trained : false
  }));
}

const getAllAutomation = async (req, res) => {
  const { organization_id } = req.user;

  if (!organization_id) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    // Assuming organization_id is NOT the primary key
    const automation = await automations.findOne({
      where: { organization_id },
    });

    if (automation) {
      // Normalize existing data to ensure all items have is_trained field
      if (automation.training_url) {
        automation.training_url = normalizeTrainingItems(automation.training_url, 'url');
      }
      if (automation.training_pdf) {
        automation.training_pdf = normalizeTrainingItems(automation.training_pdf, 'pdf');
      }
      if (automation.training_article) {
        automation.training_article = normalizeTrainingItems(automation.training_article, 'article');
      }

      return res.status(200).json(automation);
    } else {
      return res.status(404).json({ error: "Automation not found" });
    }
  } catch (error) {
    console.error("Error fetching automation:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createOrUpdateAutomation = async (req, res) => {
  const io = req.app.get("io"); // get WebSocket instance
  const { organization_id, user_id } = req.user;
  const { training_url, training_pdf, training_article, isChatbotTrained } =
    req.body;

  if (
    !training_url &&
    !training_pdf &&
    !training_article &&
    !isChatbotTrained
  ) {
    return res.status(400).json({
      error:
        "At least one of 'training_url', 'training_pdf', 'training_article', or 'isChatbotTrained' must be provided",
    });
  }

  try {
    // STEP 1: create/update automation
    let automation = await automations.findOne({ where: { organization_id } });

    if (automation) {
      if (training_url) automation.training_url = training_url;
      if (training_pdf) automation.training_pdf = training_pdf;
      if (training_article) automation.training_article = training_article;
      if (typeof isChatbotTrained !== "undefined")
        automation.is_chatbot_trained = isChatbotTrained;

      await automation.save();
    } else {
      automation = await automations.create({
        organization_id,
        training_url: training_url || [],
        training_pdf: training_pdf || [],
        training_article: training_article || [],
        is_chatbot_trained: isChatbotTrained || false,
      });
    }

    // STEP 2: Conditionally update onboarding
    let onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });

    if (!onboardingRecord) {
      onboardingRecord = await onboardings.create({
        organization_id,
        installation_guide: { syncWebsite: true },
      });
      io.emit("onboarding:updated", { organization_id });
    } else {
      const installationGuide = onboardingRecord.installation_guide || {};
      if (!installationGuide.syncWebsite) {
        installationGuide.syncWebsite = true;
        onboardingRecord.installation_guide = installationGuide;
        onboardingRecord.changed("installation_guide", true);
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id });
      }
    }

    // STEP 4: Return success (training will be triggered separately from frontend)
    return res.status(200).json({
      message: "Automation data saved successfully",
      automation
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getArticleForAutomation = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const article = await articles.findAll({ where: { organization_id } });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const analyzeURL = async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url, { timeout: 5000 });
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No title found";

    const domain = new URL(url).hostname;

    let sitemapExists = false;
    let pageCount = null;

    try {
      const sitemapUrl = new URL("/sitemap.xml", url).href;
      const sitemapRes = await fetch(sitemapUrl, { timeout: 5000 });

      if (sitemapRes.ok) {
        const sitemapXml = await sitemapRes.text();

        if (
          sitemapXml.includes("<urlset") ||
          sitemapXml.includes("<sitemapindex")
        ) {
          sitemapExists = true;
          pageCount = (sitemapXml.match(/<url>/g) || []).length;
        }
      }
    } catch (error) {
      console.error("failed to check sitemap", error);
    }
    res.json({
      success: true,
      url,
      title,
      domain,
      sitemap: {
        exists: sitemapExists,
        pageCount,
      },
      nextAction: sitemapExists ? "auto_scrape" : "manual_urls",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Website not reachable" });
  }
};

const triggerTraining = async (req, res) => {
  const io = req.app.get("io");
  const { organization_id } = req.user;

  try {
    // Get chatbot for this organization
    const { chatbots } = require("../models");
    const chatbot = await chatbots.findOne({ where: { organization_id } });

    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // Check current status to prevent double-triggering
    const automation = await automations.findOne({ where: { organization_id } });
    if (automation && automation.training_status === 'training') {
      return res.status(200).json({
        status: 'already_training',
        message: 'Training already in progress'
      });
    }

    // Call backendai with webhook URL
    const AI_URL = process.env.INTERNAL_AI_API_URL || "http://backendai:5002";
    const RTSERVER_URL = process.env.INTERNAL_RTSERVER_URL || "http://rtserver:5000";

    const response = await axios.post(`${AI_URL}/api/ingest`, {
      chatbot_id: chatbot.chatbot_id,
      webhook_url: `${RTSERVER_URL}/api/automations/training-webhook`
    });

    // backendai will call webhook which will emit WebSocket events
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error triggering training:", error);

    // Emit error event
    io.emit(`training:error:${organization_id}`, {
      message: "Failed to start training",
      organization_id,
      error: error.message
    });

    return res.status(500).json({
      error: "Failed to trigger training",
      message: error.message
    });
  }
};

// Webhook endpoint for backendai to send progress updates
const trainingWebhook = async (req, res) => {
  const io = req.app.get("io");
  const { organization_id, status, progress, message, error } = req.body;

  try {
    // Update database
    const automation = await automations.findOne({ where: { organization_id } });
    if (automation) {
      automation.training_status = status;
      automation.training_progress = progress;
      automation.training_message = message;
      await automation.save();
    }

    // Emit WebSocket event based on status
    if (status === 'training') {
      io.emit(`training:progress:${organization_id}`, {
        organization_id,
        progress,
        message
      });
    } else if (status === 'completed') {
      io.emit(`training:completed:${organization_id}`, {
        organization_id,
        message
      });
    } else if (status === 'failed') {
      io.emit(`training:error:${organization_id}`, {
        organization_id,
        message,
        error
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteTrainingSource = async (req, res) => {
  const { organization_id } = req.user;
  const { source, type } = req.body;

  if (!source || !type) {
    return res.status(400).json({ error: "Source and type are required" });
  }

  try {
    const { chatbots } = require("../models");
    const chatbot = await chatbots.findOne({ where: { organization_id } });

    if (!chatbot) {
      // Should usually exist if they are deleting
      console.warn(`Chatbot not found for org ${organization_id} during delete`);
    }

    // 1. Call backendai to delete vectors (idempotent - if not found, ok)
    if (chatbot) {
      const AI_URL = process.env.INTERNAL_AI_API_URL || "http://backendai:5002";
      try {
        await axios.post(`${AI_URL}/api/delete_source`, {
          chatbot_id: chatbot.chatbot_id,
          source: source
        });
      } catch (aiError) {
        console.error("Failed to delete source from AI backend:", aiError.message);
        // Continue to remove from DB even if vector delete fails (clean up reference)
      }
    }

    // 2. Remove from 'automations' list in Postgres (JSONB)
    // NOTE: The frontend actually sends a full 'createOrUpdateAutomation' call after this
    // OR the frontend *only* calls this?
    // User logic: "currently if delete any thing it just remove from the automation table"
    // The frontend code I saw calls `createOrUpdateAutomation` with the *filtered* list.
    // So the list update is handled by the frontend calling 'createOrUpdateAutomation'.
    // BUT we need this NEW endpoint to handle the VECTOR deletion.
    // So frontend should call:
    // 1. deleteTrainingSource (to clean vectors)
    // 2. createOrUpdateAutomation (to clean list) - OR -
    // BETTER: deleteTrainingSource should do BOTH.

    // For now, I will assume Frontend calls this *in addition* or I update the frontend to call this *instead*.
    // Updating frontend to call this *instead* is cleaner.

    const automation = await automations.findOne({ where: { organization_id } });
    if (automation) {
      let updated = false;
      if (type === 'url' && automation.training_url) {
        const initialLen = automation.training_url.length;
        automation.training_url = automation.training_url.filter(item => item.url !== source);
        if (automation.training_url.length !== initialLen) updated = true;
      } else if (type === 'file' && automation.training_pdf) {
        const initialLen = automation.training_pdf.length;
        automation.training_pdf = automation.training_pdf.filter(item => item.s3Name !== source);
        if (automation.training_pdf.length !== initialLen) updated = true;
      } else if (type === 'article' && automation.training_article) {
        const initialLen = automation.training_article.length;
        automation.training_article = automation.training_article.filter(item => item.id !== source);
        if (automation.training_article.length !== initialLen) updated = true;
      }

      if (updated) {
        await automation.save();
      }
    }

    return res.status(200).json({ message: "Source deleted successfully" });

  } catch (error) {
    console.error("Delete source error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  analyzeURL,
  getAllAutomation,
  createOrUpdateAutomation,
  getArticleForAutomation,
  triggerTraining,
  trainingWebhook,
  deleteTrainingSource
};
