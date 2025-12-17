const { chatbots, subscriptions, onboardings, whatsapp_accounts, customers } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const getWhatsAppConfig = async (req, res) => {
  try {
    const { app_id } = req.query; // app_id corresponds to chatbot_id

    if (!app_id) {
      return res.status(400).json({ message: "app_id is required" });
    }

    // 1. Find Chatbot to get organization_id
    const chatbot = await chatbots.findOne({
      where: { chatbot_id: app_id },
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // 2. Find default WhatsApp Account for this organization
    let waAccount = await whatsapp_accounts.findOne({
      where: {
        organization_id: chatbot.organization_id,
        status: 'active',
        is_default: true
      },
    });

    // 3. Fallback to first active account if no default is set
    if (!waAccount) {
      waAccount = await whatsapp_accounts.findOne({
        where: {
          organization_id: chatbot.organization_id,
          status: 'active'
        },
      });
    }

    if (!waAccount) {
      // No WhatsApp account configured
      return res.status(200).json(null);
    }

    // 4. Return Config
    return res.status(200).json({
      phoneNumber: waAccount.display_phone_number.replace(/\D/g, ''), // Ensure numeric only
      isConnected: true,
      displayPhoneNumber: waAccount.display_phone_number
    });

  } catch (err) {
    console.error("Error fetching WhatsApp config:", err);
    return res.status(500).json({
      message: "Error fetching WhatsApp config",
      error: err.message,
    });
  }
};

const getChatbotConfigForChatbot = async (req, res) => {
  try {
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

    // Fetch subscription for chatbot’s organization
    const subscription = await subscriptions.findOne({
      where: { organization_id: chatbot.organization_id },
    });

    const plan = subscription?.subscription_tier || "Free";

    //Fetch onboarding for chatbot’s organization
    const onboarding = await onboardings.findOne({
      where: { organization_id: chatbot.organization_id },
    });

    const chatbotInstalled = onboarding?.chatbot_installed || false;

    // Load chatbot configuration (default to empty object)
    const config = chatbot.chatbot_config || {};

    //Send response
    return res.status(200).json({
      chatbot_id: chatbot.chatbot_id,
      plan,
      chatbot_base_url: chatbot.chatbot_base_url,
      isApiKeyProvided: !!chatbot.api_key,
      chatbot_config: config,
      chatbot_installed: chatbotInstalled, // Added field
    });
  } catch (err) {
    console.error("Error fetching chatbot config:", err);
    return res.status(500).json({
      message: "Error fetching chatbot config",
      error: err.message,
    });
  }
};

const setChatbotInstalled = async (req, res) => {
  const io = req.app.get("io"); // get WebSocket instance

  try {
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
      return res.status(400).json({ message: "chatbot_id is required" });
    }

    // Find the chatbot by chatbot_id
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Find onboarding record for the same organization
    let onboardingRecord = await onboardings.findOne({
      where: { organization_id: chatbot.organization_id },
    });

    if (!onboardingRecord) {
      // Create new onboarding record with chatbot_installed = true
      onboardingRecord = await onboardings.create({
        organization_id: chatbot.organization_id,
        chatbot_installed: true,
      });
      io.emit("onboarding:updated", { organization_id: chatbot.organization_id });
    } else {
      // Only update if not already true
      if (!onboardingRecord.chatbot_installed) {
        onboardingRecord.chatbot_installed = true;
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id: chatbot.organization_id });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Chatbot installation status updated successfully",
    });
  } catch (err) {
    console.error("Error updating chatbot installed:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating chatbot installed",
      error: err.message,
    });
  }
};


const createAndUpdateChatbotConfig = async (req, res) => {
  const io = req.app.get("io"); // get WebSocket instance
  const { organization_id, user_id } = req.user;
  const { chatbot_config = {}, chatbot_base_url, chatbot_id } = req.body;

  try {
    if (chatbot_id) {
      let chatbot = await chatbots.findOne({
        where: { organization_id, chatbot_id },
      });
      if (!chatbot)
        return res.status(404).json({ message: "Chatbot not found" });

      chatbot = await chatbot.update({
        chatbot_base_url: chatbot_base_url || chatbot.chatbot_base_url,
        chatbot_config: { ...chatbot.chatbot_config, ...chatbot_config },
      });

      // STEP 2: Update onboarding
      let onboardingRecord = await onboardings.findOne({
        where: { organization_id },
      });
      if (!onboardingRecord) {
        onboardingRecord = await onboardings.create({
          organization_id,
          installation_guide: { customizeChatbot: true },
        });
        io.emit("onboarding:updated", { organization_id });
      } else {
        const installationGuide = onboardingRecord.installation_guide || {};
        if (!installationGuide.customizeChatbot) {
          installationGuide.customizeChatbot = true;
          onboardingRecord.installation_guide = installationGuide;
          onboardingRecord.changed("installation_guide", true);
          await onboardingRecord.save();
          io.emit("onboarding:updated", { organization_id });
        }
      }

      return res
        .status(200)
        .json({ message: "Chatbot config updated successfully", chatbot });
    }

    // Create new chatbot if none exists
    const existingChatbot = await chatbots.findOne({
      where: { organization_id },
    });
    if (existingChatbot)
      return res.status(400).json({
        message:
          "An organization can only have one chatbot. Please update the existing chatbot instead.",
        chatbot: existingChatbot,
      });

    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
    const new_chatbot_id = nanoid();

    const newChatbot = await chatbots.create({
      organization_id,
      chatbot_id: new_chatbot_id,
      chatbot_base_url,
      chatbot_config,
    });

    // Update onboarding
    let onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });
    if (!onboardingRecord) {
      onboardingRecord = await onboardings.create({
        organization_id,
        installation_guide: { customizeChatbot: true },
      });
      io.emit("onboarding:updated", { organization_id });
    } else {
      const installationGuide = onboardingRecord.installation_guide || {};
      if (!installationGuide.customizeChatbot) {
        installationGuide.customizeChatbot = true;
        onboardingRecord.installation_guide = installationGuide;
        onboardingRecord.changed("installation_guide", true);
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id });
      }
    }

    return res
      .status(201)
      .json({ message: "Chatbot created successfully", chatbot: newChatbot });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error creating/updating chatbot", error: err.message });
  }
};

const getChatbotConfigForWebApp = async (req, res) => {
  try {
    const { organization_id } = req.user;

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }

    const chatbot = await chatbots.findOne({
      where: { organization_id },
      attributes: { exclude: ["api_key"] },
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    res.status(200).json(chatbot);
  } catch (err) {
    console.error("Error fetching chatbot configs:", err);
    res.status(500).json({
      message: "Error fetching chatbot configs",
      error: err.message,
    });
  }
};

const getApiKeyForFreeTrail = async (req, res) => {
  try {
    const { organization_id } = req.user;

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }

    const chatbot = await chatbots.findOne({
      where: { organization_id },
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    //  Consistent field name (same as in update function)
    return res.status(200).json({
      message: "API key fetched successfully",
      apiKey: chatbot.api_key, // consistent naming (camelCase)
    });
  } catch (err) {
    console.error("Error getting chatbot API key:", err);
    return res.status(500).json({
      message: "Error getting chatbot API key",
      error: err.message,
    });
  }
};

const updateApiKeyForFreeTrail = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { apiKey } = req.body;

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }

    const chatbot = await chatbots.findOne({
      where: { organization_id },
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Allow clearing API key
    if (!apiKey || apiKey.trim() === "") {
      chatbot.api_key = null; // or "" if you prefer to keep it as an empty string
      await chatbot.save();

      return res.status(200).json({
        message: "API key cleared successfully",
        id: chatbot.id,
        organization_id: chatbot.organization_id,
        apiKey: null,
      });
    }

    //Validate key format if provided
    const keyType = detectGeminiApiKey(apiKey);
    if (!keyType) {
      return res.status(400).json({
        message: "Invalid API key format. Must be a valid Gemini API key.",
      });
    }

    //  Verify with Gemini provider
    const isKeyValid = await verifyGeminiApiKey(apiKey);
    if (!isKeyValid) {
      return res.status(400).json({
        message: "The provided Gemini API key is invalid or unauthorized.",
      });
    }

    //Save valid key
    chatbot.api_key = apiKey;
    await chatbot.save();

    return res.status(200).json({
      message: "Gemini API key updated successfully",
      id: chatbot.id,
      organization_id: chatbot.organization_id,
      apiKey: chatbot.api_key,
    });
  } catch (err) {
    console.error("Error updating chatbot API key:", err);
    return res.status(500).json({
      message: "Error updating chatbot API key",
      error: err.message,
    });
  }
};

// Gemini Key Format Validation
function detectGeminiApiKey(apiKey) {
  // Typical Gemini API keys start with "AIza" followed by 35–50 characters
  if (/^AIza[0-9A-Za-z_\-]{35,}$/.test(apiKey)) return "Gemini";
  return null;
}

// Verify Key with Gemini Provider
async function verifyGeminiApiKey(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    return response.ok;
  } catch (err) {
    console.error("Gemini key verification failed:", err);
    return false;
  }
}

/**
 * Get customer phone number from custom_data
 */
const getCustomerPhone = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // Find customer by email
    const customer = await customers.findOne({
      where: { email },
    });

    if (!customer) {
      return res.status(200).json({
        hasPhone: false,
        phoneNumber: null,
      });
    }

    // Check for phone_number in custom_data
    const phoneNumber = customer.custom_data?.phone_number || null;

    return res.status(200).json({
      hasPhone: !!phoneNumber,
      phoneNumber: phoneNumber,
    });
  } catch (err) {
    console.error("Error fetching customer phone:", err);
    return res.status(500).json({
      message: "Error fetching customer phone",
      error: err.message,
    });
  }
};

/**
 * Save customer phone number to custom_data
 */
const saveCustomerPhone = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email || !phoneNumber) {
      return res.status(400).json({
        message: "email and phoneNumber are required",
      });
    }

    // Find customer by email
    const customer = await customers.findOne({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update custom_data with phone_number
    const updatedCustomData = {
      ...customer.custom_data,
      phone_number: phoneNumber,
    };

    await customer.update({
      custom_data: updatedCustomData,
    });

    return res.status(200).json({
      success: true,
      message: "Phone number saved successfully",
    });
  } catch (err) {
    console.error("Error saving customer phone:", err);
    return res.status(500).json({
      message: "Error saving customer phone",
      error: err.message,
    });
  }
};

module.exports = {
  getApiKeyForFreeTrail,
  getChatbotConfigForChatbot,
  createAndUpdateChatbotConfig,
  getChatbotConfigForWebApp,
  updateApiKeyForFreeTrail,
  setChatbotInstalled,
  getWhatsAppConfig,
  getCustomerPhone,
  saveCustomerPhone,
};
