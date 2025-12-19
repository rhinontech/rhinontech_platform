const { automations, onboardings, articles } = require("../models");
const axios = require("axios");
const { logActivity } = require("../utils/activityLogger");

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
      io.emit("onboarding:updated", { organization_id }); // emit WS
    } else {
      const installationGuide = onboardingRecord.installation_guide || {};
      if (!installationGuide.syncWebsite) {
        installationGuide.syncWebsite = true;
        onboardingRecord.installation_guide = installationGuide;
        onboardingRecord.changed("installation_guide", true);
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id }); // emit WS
      }
    }

    // STEP 3: Sync to AI Engine (RAG)
    // We send the automation data to Python service for ingestion
    // try {
    //   const pythonBackendUrl1 =
    //     "http://localhost:5002/standard/set_user_assistant";
    //   // We need to fetch the chatbot_id for this organization to send to Python
    //   // Assuming 1-to-1 mapping or just taking one.
    //   // Based on old query: JOIN chatbots c ON a.organization_id = c.organization_id
    //   const { chatbots } = require("../models");
    //   const chatbot = await chatbots.findOne({ where: { organization_id } });

    //   if (chatbot) {
    //     const payload = {
    //       chatbot_id: chatbot.chatbot_id,
    //       // training_url: automation.training_url,
    //       // training_pdf: automation.training_pdf,
    //       // training_article: automation.training_article,
    //     };

    //     // Non-blocking call or awaited? User said "send datas", presumably fire-and-forget or await but verify processing.
    //     // Let's await it to log success/failure
    //     await axios.post(pythonBackendUrl1, payload);
    //     console.log("Automatically synced data to AI Brain");
    //   } else {
    //     console.warn("No chatbot found for this org, skipped AI sync");
    //   }
    // } catch (aiError) {
    //   console.error("Failed to sync with AI Backend:", aiError.message);
    //   // We do NOT fail the request, just log it.
    // }

    return res
      .status(200)
      .json({ message: "Automation processed successfully", automation });
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

module.exports = {
  analyzeURL,
  getAllAutomation,
  createOrUpdateAutomation,
  getArticleForAutomation,
};
