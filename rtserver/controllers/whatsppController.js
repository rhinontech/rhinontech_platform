const {
  whatsapp_accounts,
  whatsapp_messages,
  whatsapp_contacts,
  whatsapp_webhooks,
} = require("../models");
const axios = require("axios");
const { encryptToken, decryptToken } = require("../utils/encryption");
const { Op } = require("sequelize");

/**
 * Exchange OAuth code for access token and store WhatsApp account
 * Uses data from embedded signup callback (phone_number_id, waba_id)
 */
const exchangeCode = async (req, res) => {
  const { code, phone_number_id, waba_id, business_id } = req.body;

  const { organization_id, user_id } = req.user;

  if (!code || !organization_id) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: code and organization_id",
    });
  }

  try {
    console.log("Exchanging code for access token...");

    // 1. Exchange code for access token
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code: code,
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;
    console.log(" Access token received");

    // Calculate expiry date safely (default to 60 days if missing)
    const expiresInSeconds = expires_in ? parseInt(expires_in) : 5184000; // 60 days in seconds
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 2. If phone_number_id and waba_id are provided (from embedded signup), use them directly
    if (phone_number_id && waba_id) {
      console.log(" Using credentials from embedded signup");
      console.log("Phone Number ID:", phone_number_id);
      console.log("WABA ID:", waba_id); // Changed to waba_id as per original context

      let finalBusinessId = business_id;

      // If business_id is missing, try to fetch it
      if (!finalBusinessId) {
        console.log("  Business ID missing, fetching from Graph API...");
        try {
          // Try to get business ID from WABA
          const wabaResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${waba_id}`, // Changed to waba_id as per original context
            {
              params: {
                access_token,
                fields: "owner_business_info",
              },
            }
          );

          if (wabaResponse.data.owner_business_info?.owner_business_id) {
            finalBusinessId =
              wabaResponse.data.owner_business_info.owner_business_id;
            console.log(" Fetched Business ID from WABA:", finalBusinessId);
          } else {
            // Fallback: Get from /me/businesses
            const businessResponse = await axios.get(
              "https://graph.facebook.com/v23.0/me/businesses",
              { params: { access_token } }
            );
            if (
              businessResponse.data.data &&
              businessResponse.data.data.length > 0
            ) {
              finalBusinessId = businessResponse.data.data[0].id;
              console.log(
                " Fetched Business ID from /me/businesses:",
                finalBusinessId
              );
            }
          }
        } catch (err) {
          console.error("❌ Failed to fetch business ID:", err.message);
        }
      }

      console.log("Final Business ID:", finalBusinessId);

      // Get phone number details
      const phoneResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${phone_number_id}`,
        {
          params: {
            access_token,
            fields: "id,display_phone_number,verified_name,quality_rating",
          },
        }
      );

      const phoneData = phoneResponse.data;

      // Check if account already exists
      const existingAccount = await whatsapp_accounts.findOne({
        where: { phone_number_id: phoneData.id },
      });

      if (existingAccount) {
        // Update existing account
        const encryptedToken = encryptToken(access_token);
        await existingAccount.update({
          access_token: encryptedToken,
          token_expires_at: tokenExpiresAt,
          status: "active",
          verified_name: phoneData.verified_name,
          quality_rating: phoneData.quality_rating,
          last_sync_at: new Date(),
        });

        return res.json({
          success: true,
          message: "WhatsApp account reconnected successfully",
          account: {
            id: existingAccount.id,
            phone_number_id: existingAccount.phone_number_id,
            display_phone_number: existingAccount.display_phone_number,
            verified_name: phoneData.verified_name,
            waba_id: existingAccount.waba_id,
            status: "active",
          },
        });
      }

      // Encrypt access token
      const encryptedToken = encryptToken(access_token);

      // Check if this is the first account for the organization
      const existingAccountCount = await whatsapp_accounts.count({
        where: { organization_id },
      });
      const isFirstAccount = existingAccountCount === 0;

      // Store new account in database
      const account = await whatsapp_accounts.create({
        organization_id,
        user_id: user_id || null,
        phone_number_id: phoneData.id,
        waba_id: waba_id,
        business_id: finalBusinessId || "", // Use the resolved business_id
        display_phone_number: phoneData.display_phone_number,
        verified_name: phoneData.verified_name,
        quality_rating: phoneData.quality_rating,
        access_token: encryptedToken,
        token_type: "Bearer",
        token_expires_at: tokenExpiresAt,
        status: "active",
        is_default: isFirstAccount, // Set as default if first account
        last_sync_at: new Date(),
      });

      console.log(" Account saved to database");

      // Subscribe App to WABA (for Webhooks)
      try {
        await axios.post(
          `https://graph.facebook.com/v23.0/${waba_id}/subscribed_apps`,
          {},
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
        console.log("✅ App subscribed to WABA");
      } catch (subError) {
        console.error("⚠️ Failed to subscribe app to WABA:", subError.response?.data || subError.message);
      }

      // Register Phone Number (Required for Cloud API)
      try {
        console.log(`🔄 Attempting to register phone number: ${phoneData.id}`);
        const registerResponse = await axios.post(
          `https://graph.facebook.com/v23.0/${phoneData.id}/register`,
          {
            messaging_product: "whatsapp",
            pin: "123456", // Default PIN, user can change later in WhatsApp Manager if needed
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ Phone number registered with Cloud API:", registerResponse.data);
      } catch (regError) {
        const errorData = regError.response?.data?.error;
        const errorCode = errorData?.code;
        const errorMessage = errorData?.message || regError.message;

        console.error("⚠️ Phone registration error:", {
          code: errorCode,
          message: errorMessage,
          fullError: regError.response?.data
        });

        // If error is "already registered" (code 131031), we can ignore it
        if (errorCode === 131031 || errorMessage?.includes("already registered")) {
          console.log("ℹ️ Phone number is already registered, continuing...");
        } else {
          // For other errors, we should fail the entire process
          console.error("❌ Critical registration error - account may not be able to send messages");
          throw new Error(`Phone registration failed: ${errorMessage}. Please ensure the phone number is properly set up in Meta Business Manager.`);
        }
      }

      return res.json({
        success: true,
        message: "WhatsApp account connected successfully",
        account: {
          id: account.id,
          phone_number_id: account.phone_number_id,
          display_phone_number: account.display_phone_number,
          verified_name: account.verified_name,
          waba_id: account.waba_id,
          status: account.status,
        },
      });
    }

    // 3. Fallback: If no embedded signup data, fetch manually (legacy flow)
    console.log("  No embedded signup data, fetching manually...");

    // 2. Get business accounts
    const businessResponse = await axios.get(
      "https://graph.facebook.com/v23.0/me/businesses",
      {
        params: { access_token },
      }
    );

    if (
      !businessResponse.data.data ||
      businessResponse.data.data.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "No business accounts found. Please use the embedded signup flow.",
      });
    }

    const businessId = businessResponse.data.data[0].id;
    console.log(" Business ID:", businessId);

    // 3. Get WhatsApp Business Account (WABA)
    const wabaResponse = await axios.get(
      `https://graph.facebook.com/v23.0/${businessId}/client_whatsapp_business_accounts`,
      {
        params: { access_token },
      }
    );

    if (!wabaResponse.data.data || wabaResponse.data.data.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No WhatsApp Business Account found",
      });
    }

    const fetchedWabaId = wabaResponse.data.data[0].id;
    console.log(" WABA ID:", fetchedWabaId);

    // 4. Get phone numbers
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v23.0/${fetchedWabaId}/phone_numbers`,
      {
        params: { access_token },
      }
    );

    if (!phoneResponse.data.data || phoneResponse.data.data.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No phone numbers found for this WhatsApp Business Account",
      });
    }

    const phoneData = phoneResponse.data.data[0];
    console.log(" Phone Number:", phoneData.display_phone_number);

    // 5. Check if account already exists
    const existingAccount = await whatsapp_accounts.findOne({
      where: { phone_number_id: phoneData.id },
    });

    if (existingAccount) {
      // Update existing account
      const encryptedToken = encryptToken(access_token);
      await existingAccount.update({
        access_token: encryptedToken,
        token_expires_at: new Date(Date.now() + expires_in * 1000),
        status: "active",
        verified_name: phoneData.verified_name,
        quality_rating: phoneData.quality_rating,
        last_sync_at: new Date(),
      });

      return res.json({
        success: true,
        message: "WhatsApp account reconnected successfully",
        account: {
          id: existingAccount.id,
          phone_number_id: existingAccount.phone_number_id,
          display_phone_number: existingAccount.display_phone_number,
          verified_name: phoneData.verified_name,
          waba_id: existingAccount.waba_id,
          status: "active",
        },
      });
    }

    // 6. Encrypt access token
    const encryptedToken = encryptToken(access_token);

    // Check if this is the first account for the organization
    const existingAccountCount = await whatsapp_accounts.count({
      where: { organization_id },
    });
    const isFirstAccount = existingAccountCount === 0;

    // 7. Store new account in database
    const account = await whatsapp_accounts.create({
      organization_id,
      user_id: user_id || null,
      phone_number_id: phoneData.id,
      waba_id: fetchedWabaId,
      business_id: businessId,
      display_phone_number: phoneData.display_phone_number,
      verified_name: phoneData.verified_name,
      quality_rating: phoneData.quality_rating,
      access_token: encryptedToken,
      token_type: "Bearer",
      token_expires_at: new Date(Date.now() + expires_in * 1000),
      status: "active",
      is_default: isFirstAccount, // Set as default if first account
      last_sync_at: new Date(),
    });

    console.log(" Account saved to database");

    res.json({
      success: true,
      message: "WhatsApp account connected successfully",
      account: {
        id: account.id,
        phone_number_id: account.phone_number_id,
        display_phone_number: account.display_phone_number,
        verified_name: account.verified_name,
        waba_id: account.waba_id,
        status: account.status,
      },
    });
  } catch (error) {
    console.error(
      "❌ Exchange code error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: "Failed to connect WhatsApp account",
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Get all WhatsApp accounts for an organization
 */
const getAccounts = async (req, res) => {
  const { organization_id, user_id } = req.user;

  if (!organization_id) {
    return res.status(400).json({
      success: false,
      error: "Missing organization_id",
    });
  }

  try {
    const accounts = await whatsapp_accounts.findAll({
      where: { organization_id, user_id },
      attributes: [
        "id",
        "phone_number_id",
        "display_phone_number",
        "verified_name",
        "quality_rating",
        "status",
        "is_default",
        "created_at",
        "updated_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("❌ Get accounts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch WhatsApp accounts",
      details: error.message,
    });
  }
};

/**
 * Disconnect a WhatsApp account and deregister the phone number
 */
const disconnectAccount = async (req, res) => {
  const { account_id } = req.params;
  const { organization_id } = req.user;

  if (!organization_id) {
    return res.status(400).json({
      success: false,
      error: "Missing organization_id",
    });
  }

  try {
    const account = await whatsapp_accounts.findOne({
      where: {
        id: account_id,
        organization_id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    // 1. Deregister from WhatsApp API
    if (account.status === "active" && account.access_token) {
      try {
        const accessToken = decryptToken(account.access_token);
        console.log(
          `Attempting to deregister phone number: ${account.phone_number_id}`
        );

        await axios.post(
          `https://graph.facebook.com/v23.0/${account.phone_number_id}/deregister`,
          {
            messaging_product: "whatsapp",
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Phone number deregistered from Meta");
      } catch (apiError) {
        console.error(
          "  Failed to deregister from Meta:",
          apiError.response?.data || apiError.message
        );
        // We continue with local disconnect even if API fails,
        // but ideally we should inform the user.
        // For now, we log it and proceed to ensure local cleanup.
      }
    }

    // 2. Update local status
    await account.update({ status: "disconnected" });

    res.json({
      success: true,
      message: "WhatsApp account disconnected and deregistered successfully",
    });
  } catch (error) {
    console.error("❌ Disconnect account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect account",
      details: error.message,
    });
  }
};

/**
 * Set a WhatsApp account as the default for the organization
 */
const setDefaultWhatsAppAccount = async (req, res) => {
  const { account_id } = req.params;
  const { organization_id } = req.user;

  if (!organization_id) {
    return res.status(400).json({
      success: false,
      error: "Missing organization_id",
    });
  }

  try {
    // 1. Find the account to set as default
    const account = await whatsapp_accounts.findOne({
      where: {
        id: account_id,
        organization_id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    // 2. Unset any existing default for this organization
    await whatsapp_accounts.update(
      { is_default: false },
      {
        where: {
          organization_id,
          is_default: true,
        },
      }
    );

    // 3. Set the new default
    await account.update({ is_default: true });

    res.json({
      success: true,
      message: "Default WhatsApp account updated successfully",
      account: {
        id: account.id,
        phone_number_id: account.phone_number_id,
        display_phone_number: account.display_phone_number,
        is_default: true,
      },
    });
  } catch (error) {
    console.error("❌ Set default account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to set default account",
      details: error.message,
    });
  }
};

/**
 * Send a WhatsApp message
 */
const sendMessage = async (req, res) => {
  const { account_id, to, type, text, media, template } = req.body;

  if (!account_id || !to || !type) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: account_id, to, type",
    });
  }

  try {
    // 1. Get account with credentials
    const account = await whatsapp_accounts.findByPk(account_id);

    if (!account || account.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Invalid or inactive WhatsApp account",
      });
    }

    // 2. Decrypt access token
    const accessToken = decryptToken(account.access_token);

    // 3. Prepare message payload
    const messagePayload = {
      messaging_product: "whatsapp",
      to: to,
      type: type,
    };

    if (type === "text") {
      messagePayload.text = { body: text.body };
    } else if (type === "template") {
      messagePayload.template = template;
    } else if (
      type === "image" ||
      type === "document" ||
      type === "audio" ||
      type === "video"
    ) {
      // Fix for Media ID vs. Link
      // If the 'link' is actually an ID (doesn't start with http), usage 'id' instead.
      // WhatsApp API requires { id: "..." } for IDs and { link: "..." } for URLs.
      let mediaPayload = { ...media };
      if (mediaPayload.link && !mediaPayload.link.startsWith("http")) {
        mediaPayload.id = mediaPayload.link;
        delete mediaPayload.link;
      }
      messagePayload[type] = mediaPayload;
    }

    // 4. Send via WhatsApp API
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v23.0/${account.phone_number_id}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 5. Store message in database
      let content = null;
      if (type === "text") {
        content = text.body;
      } else if (type === "template") {
        content = `Template: ${template.name}`;
      }

      // Sanitize phone for DB storage to match "getMessages" format
      const sanitizedTo = to.replace(/\D/g, "");

      const message = await whatsapp_messages.create({
        account_id: account.id,
        organization_id: account.organization_id,
        message_id: response.data.messages[0].id,
        from_number: account.display_phone_number,
        to_number: sanitizedTo, // Store cleaned number
        direction: "outbound",
        message_type: type,
        content: content,
        media_url: media?.link || null,
        status: "sent",
        sent_at: new Date(),
      });

      // 6. Emit socket event for real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(`org_${account.organization_id}`).emit("whatsapp:message:sent", {
          message: message,
        });
      }

      res.json({
        success: true,
        message: {
          id: message.id,
          message_id: message.message_id,
          status: message.status,
          sent_at: message.sent_at,
        },
      });
    } catch (sendError) {
      const errorData = sendError.response?.data?.error;
      const errorCode = errorData?.code;
      const errorSubcode = errorData?.error_subcode;

      // Check if error is "Account not registered" (code 133010, subcode 2593006)
      if (errorCode === 133010 && errorSubcode === 2593006) {
        console.log("⚠️ Phone number not registered, attempting to register now...");

        try {
          // Attempt to register the phone number
          const registerResponse = await axios.post(
            `https://graph.facebook.com/v23.0/${account.phone_number_id}/register`,
            {
              messaging_product: "whatsapp",
              pin: "123456",
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ Phone number registered successfully:", registerResponse.data);

          // Retry sending the message
          const retryResponse = await axios.post(
            `https://graph.facebook.com/v23.0/${account.phone_number_id}/messages`,
            messagePayload,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Store message in database
          let content = null;
          if (type === "text") {
            content = text.body;
          } else if (type === "template") {
            content = `Template: ${template.name}`;
          }

          const message = await whatsapp_messages.create({
            account_id: account.id,
            organization_id: account.organization_id,
            message_id: retryResponse.data.messages[0].id,
            from_number: account.display_phone_number,
            to_number: to,
            direction: "outbound",
            message_type: type,
            content: content,
            media_url: media?.link || null,
            status: "sent",
            sent_at: new Date(),
          });

          // Emit socket event
          const io = req.app.get("io");
          if (io) {
            io.to(`org_${account.organization_id}`).emit("whatsapp:message:sent", {
              message: message,
            });
          }

          return res.json({
            success: true,
            message: {
              id: message.id,
              message_id: message.message_id,
              status: message.status,
              sent_at: message.sent_at,
            },
            info: "Phone number was registered automatically before sending",
          });
        } catch (registerError) {
          console.error("❌ Failed to register phone number:", registerError.response?.data || registerError.message);
          return res.status(500).json({
            success: false,
            error: "Phone number is not registered with WhatsApp Cloud API",
            details: registerError.response?.data || registerError.message,
            solution: "Please complete the phone number setup in Meta Business Manager or try reconnecting your WhatsApp account.",
          });
        }
      }

      // For other errors, throw them
      throw sendError;
    }
  } catch (error) {
    console.error(
      "❌ Send message error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: "Failed to send message",
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Webhook verification (GET)
 */
const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log(" Webhook verified");
    res.status(200).send(challenge);
  } else {
    console.error("❌ Webhook verification failed");
    res.sendStatus(403);
  }
};

/**
 * Webhook handler (POST) - Receive incoming messages and status updates
 */
const handleWebhook = async (req, res) => {
  const body = req.body;

  try {
    // Log webhook for debugging
    await whatsapp_webhooks.create({
      event_type: "webhook_received",
      payload: body,
      processed: false,
    });

    // Process webhook entries
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          const value = change.value;
          const phoneNumberId = value.metadata.phone_number_id;

          // Find account
          const account = await whatsapp_accounts.findOne({
            where: { phone_number_id: phoneNumberId },
          });

          if (!account) {
            console.warn(
              "  Account not found for phone_number_id:",
              phoneNumberId
            );
            continue;
          }

          // Process incoming messages
          if (value.messages) {
            for (const messageData of value.messages) {
              await processIncomingMessage(
                account,
                messageData,
                req.app.get("io")
              );
            }
          }

          // Process status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await processStatusUpdate(account, status, req.app.get("io"));
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.sendStatus(500);
  }
};

/**
 * Process incoming WhatsApp message
 */
/**
 * Process incoming WhatsApp message
 */
async function processIncomingMessage(account, messageData, io) {
  try {
    // Check if message already exists
    const existing = await whatsapp_messages.findOne({
      where: { message_id: messageData.id },
    });

    if (existing) {
      console.log("  Message already processed:", messageData.id);
      return;
    }

    const accessToken = decryptToken(account.access_token);

    // Extract message content based on type
    let content = null;
    let mediaUrl = null;
    let caption = null;

    if (messageData.type === "text") {
      content = messageData.text.body;
    } else if (
      ["image", "document", "audio", "video", "sticker"].includes(
        messageData.type
      )
    ) {
      if (messageData[messageData.type].caption) {
        caption = messageData[messageData.type].caption;
      }

      // Store the Media ID directly. The frontend will proxy it to get a fresh URL.
      // Fetching the URL here is bad because it expires.
      mediaUrl = messageData[messageData.type].id;
    }

    // Create message record
    const message = await whatsapp_messages.create({
      account_id: account.id,
      organization_id: account.organization_id,
      message_id: messageData.id,
      wamid: messageData.id,
      from_number: messageData.from,
      to_number: account.display_phone_number,
      direction: "inbound",
      message_type: messageData.type,
      content: content,
      media_url: mediaUrl,
      caption: caption,
      status: "received",
      created_at: new Date(messageData.timestamp * 1000),
    });

    // Update or create contact (Strip + from phone if present, though webhook usually has raw digits)
    const contactPhone = messageData.from;

    await whatsapp_contacts
      .findOrCreate({
        where: {
          account_id: account.id,
          phone_number: contactPhone,
        },
        defaults: {
          organization_id: account.organization_id,
          phone_number: contactPhone,
          profile_name: messageData.profile?.name || null,
          last_message_at: new Date(),
        },
      })
      .then(([contact, created]) => {
        if (!created) {
          contact.update({ last_message_at: new Date() });
        }
      });

    // Emit socket event for real-time update
    if (io) {
      io.to(`org_${account.organization_id}`).emit(
        "whatsapp:message:received",
        {
          message: message,
        }
      );
    }

    console.log(" Incoming message processed:", message.id);
  } catch (error) {
    console.error("❌ Process incoming message error:", error);
  }
}

/**
 * Process WhatsApp message status update
 */
async function processStatusUpdate(account, statusData, io) {
  try {
    const message = await whatsapp_messages.findOne({
      where: { message_id: statusData.id },
    });

    if (!message) {
      console.warn("  Message not found for status update:", statusData.id);
      return;
    }

    const updates = { status: statusData.status };

    if (statusData.status === "delivered") {
      updates.delivered_at = new Date(statusData.timestamp * 1000);
    } else if (statusData.status === "read") {
      updates.read_at = new Date(statusData.timestamp * 1000);
    } else if (statusData.status === "failed") {
      updates.error_code = statusData.errors?.[0]?.code;
      updates.error_message = statusData.errors?.[0]?.title;
    }

    await message.update(updates);

    // Emit socket event for real-time update
    if (io) {
      io.to(`org_${account.organization_id}`).emit("whatsapp:message:status", {
        message_id: message.id,
        status: statusData.status,
        ...updates,
      });
    }

    console.log(
      " Status update processed:",
      statusData.id,
      "->",
      statusData.status
    );
  } catch (error) {
    console.error("❌ Process status update error:", error);
  }
}

/**
 * Get message templates for a WhatsApp Business Account
 */
const getTemplates = async (req, res) => {
  const { account_id } = req.query;
  const { organization_id } = req.user;

  if (!account_id) {
    return res.status(400).json({
      success: false,
      error: "Missing account_id",
    });
  }

  try {
    const account = await whatsapp_accounts.findOne({
      where: { id: account_id, organization_id },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    const accessToken = decryptToken(account.access_token);

    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${account.waba_id}/message_templates`,
      {
        params: {
          access_token: accessToken,
          fields: "name,status,language,category,components",
          limit: 100,
        },
      }
    );

    // Filter only approved templates
    const approvedTemplates = response.data.data.filter(
      (t) => t.status === "APPROVED"
    );

    res.json({
      success: true,
      templates: approvedTemplates,
    });
  } catch (error) {
    console.error(
      "❌ Get templates error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Get all WhatsApp contacts for an account
 */
const getContacts = async (req, res) => {
  const { account_id } = req.query;
  const { organization_id } = req.user;

  try {
    const whereClause = { organization_id };
    if (account_id) {
      whereClause.account_id = account_id;
    }

    const contacts = await whatsapp_contacts.findAll({
      where: whereClause,
      order: [["last_message_at", "DESC"]],
      limit: 50,
    });

    res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("❌ Get contacts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contacts",
      details: error.message,
    });
  }
};

/**
 * Get messages for a specific contact
 */
const getMessages = async (req, res) => {
  const { contact_id, limit = 50, offset = 0 } = req.query;
  const { organization_id } = req.user;

  if (!contact_id) {
    return res.status(400).json({
      success: false,
      error: "Missing contact_id",
    });
  }

  try {
    // 1. Get contact to find phone number
    const contact = await whatsapp_contacts.findOne({
      where: { id: contact_id, organization_id },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: "Contact not found",
      });
    }

    // 2. Fetch messages
    const messages = await whatsapp_messages.findAll({
      where: {
        organization_id,
        [Op.or]: [
          { from_number: contact.phone_number },
          { to_number: contact.phone_number },
        ],
      },
      order: [["created_at", "DESC"]], // Newest first
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Return oldest first for chat UI
      contact,
    });
  } catch (error) {
    console.error("❌ Get messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
      details: error.message,
    });
  }
};


const getMediaProxy = async (req, res) => {
  const { media_id } = req.params;
  const { account_id } = req.query;

  // console.log("Proxying media:", media_id, "Account:", account_id);

  if (!media_id || !account_id) {
    return res.status(400).send("Missing media_id or account_id");
  }

  try {
    let account = await whatsapp_accounts.findOne({
      where: { id: account_id },
    });

    if (!account) {
      return res.status(404).send("Account not found");
    }

    // FALLBACK LOGIC:
    // If the requested account is disconnected, try to find the organization's default/active account.
    // This allows viewing media history even if the original account is gone, assuming they share access or it's just a credential issue.
    if (account.status !== 'active') {
      console.log(`⚠️ Requesting media with disconnected account ${account_id}. Attempting fallback...`);
      const fallbackAccount = await whatsapp_accounts.findOne({
        where: {
          organization_id: account.organization_id,
          status: 'active'
        },
        order: [['is_default', 'DESC'], ['updated_at', 'DESC']] // Prefer default, then most recently updated
      });

      if (fallbackAccount) {
        console.log(`✅ Using fallback account ${fallbackAccount.id} (${fallbackAccount.display_phone_number})`);
        account = fallbackAccount;
      } else {
        console.warn("❌ No fallback active account found.");
        // We continue with the disconnected account, which will likely fail on the Graph API call below,
        // but that is the correct behavior if no valid credentials exist.
      }
    }

    const accessToken = decryptToken(account.access_token);

    // 1. Get Media URL and MIME Type from Graph API
    let downloadUrl;
    let mimeType;
    let targetId = media_id;
    let skipMeta = false;

    // Handle case where media_id is a full URL (e.g. from lookaside.fbsbx.com)
    if (media_id.startsWith("http") || media_id.startsWith("https")) {
      try {
        const urlObj = new URL(media_id);
        const mid = urlObj.searchParams.get("mid");
        if (mid) {
          console.log(`  Extracted Media ID ${mid} from URL`);
          targetId = mid;
        } else {
          // If no ID found, we must try to download the URL directly
          console.log("  No 'mid' found in URL, using direct download");
          downloadUrl = media_id;
          skipMeta = true;
        }
      } catch (e) {
        console.warn("  Failed to parse media ID URL:", e.message);
        downloadUrl = media_id;
        skipMeta = true;
      }
    }

    try {
      if (!skipMeta) {
        const metaResponse = await axios.get(
          `https://graph.facebook.com/v23.0/${targetId}`,
          {
            params: { access_token: accessToken, fields: "url,mime_type" },
          }
        );
        downloadUrl = metaResponse.data.url;
        mimeType = metaResponse.data.mime_type;
      }
    } catch (metaError) {
      console.error(`  Meta fetch failed for ID ${targetId}: ${metaError.message}`);
      if (metaError.response) {
        if (metaError.response.status === 404) return res.status(404).send("Media ID not found on WhatsApp");
      }
      // If meta fails but we have a URL (from input), try to fallback? 
      // Unlikely to work if it's an ID, but if it was a URL that failed extraction logic...
      // For now, assume strict failure if ID was assumed.
      throw metaError;
    }

    // 2. Download and Stream
    const mediaResponse = await axios.get(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: "stream",
    });

    // CRITICAL: Always prioritize the MIME type from the metadata call.
    // WhatsApp's download URL sometimes returns generic types like application/octet-stream.
    if (mimeType) {
      res.setHeader("Content-Type", mimeType);
    } else if (mediaResponse.headers["content-type"]) {
      res.setHeader("Content-Type", mediaResponse.headers["content-type"]);
    }

    // Set caching to prevent repeated fetches for the same immutable media ID
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    // Using 'inline' helps browsers display images/videos/pdfs directly instead of downloading
    res.setHeader("Content-Disposition", "inline");

    // Pipe the stream
    mediaResponse.data.pipe(res);

  } catch (error) {
    console.error(`❌ Media proxy error for ID ${media_id}:`, error.message);
    if (!res.headersSent) {
      res.status(500).send("Failed to fetch media");
    }
  }
};

/**
 * Upload Media to WhatsApp
 */
const uploadMedia = async (req, res) => {
  try {
    const { account_id } = req.body;
    const file = req.file;

    if (!account_id || !file) {
      return res.status(400).json({ error: "Missing account_id or file" });
    }

    const account = await whatsapp_accounts.findByPk(account_id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const accessToken = decryptToken(account.access_token);

    // Prepare FormData for Facebook Graph API
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");

    // Create a Blob-like object for the file stream
    const fileBlob = new Blob([file.buffer], { type: file.mimetype });
    formData.append("file", fileBlob, file.originalname);

    console.log(`📤 Uploading ${file.originalname} (${file.mimetype}) to WhatsApp for account ${account.phone_number_id}...`);

    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${account.phone_number_id}/media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data", // axios/FormData handles boundary automatically
        },
      }
    );

    console.log("✅ Media uploaded successfully, ID:", response.data.id);

    res.json({
      success: true,
      media_id: response.data.id,
    });

  } catch (error) {
    console.error("❌ Media upload error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to upload media to WhatsApp" });
  }
};


module.exports = {
  exchangeCode,
  getAccounts,
  disconnectAccount,
  setDefaultWhatsAppAccount,
  sendMessage,
  verifyWebhook,
  handleWebhook,
  getTemplates,
  getContacts,
  getMessages,
  getMediaProxy,
  uploadMedia,
};
