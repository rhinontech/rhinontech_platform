const {
  tickets,
  customers,
  chatbots,
  forms,
  users,
  users_accounts,
  users_profiles,
  users_roles,
  organizations,
  emails,
} = require("../models");
const { sendEmail } = require("../utils/sendEmail");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { logActivity } = require("../utils/activityLogger");
const { Op } = require("sequelize");

const ticketWebhook = async (req, res) => {
  const io = req.app.get("io");

  console.log("\n--- Webhook received ---");
  console.log("Request Body:", JSON.stringify(req.body, null, 2));

  const {
    messageId,
    inReplyTo,
    from,
    to,
    subject,
    htmlBody,
    attachments = [],
  } = req.body;

  try {
    // Step 1: Extract ticket ID from subject (if present)
    const ticketIdMatch = subject?.match(/#([A-Za-z0-9]+)/);
    const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;

    // Step 2: Identify organization
    const toEmail = Array.isArray(to) ? to[0] : to;
    const org = await organizations.findOne({
      where: { company_email: toEmail },
    });

    if (!org) {
      console.warn("  No organization found for:", toEmail);
      return res.status(400).json({ message: "Organization not found" });
    }

    const organization_id = org.id;

    // Step 3: If ticket ID exists → append to ticket
    if (ticketId) {
      const ticket = await tickets.findOne({ where: { ticket_id: ticketId } });
      if (!ticket) {
        console.warn(`  Ticket with ID ${ticketId} not found`);
        return res.status(404).send("Ticket not found");
      }

      const newEntry = {
        role: "customer",
        text: htmlBody || "(No Content)",
        attachments,
        timestamp: new Date().toISOString(),
      };

      const updatedConversations = Array.isArray(ticket.conversations)
        ? [...ticket.conversations, newEntry]
        : [newEntry];

      await ticket.update({
        conversations: updatedConversations,
        is_new: true,
        updated_at: new Date(),
      });

      io.emit("ticket:updated", {
        ticketId: ticket.ticket_id,
        newMessage: newEntry,
        updatedTicket: ticket,
      });

      console.log(`✅ Appended message to existing ticket #${ticketId}`);
      return res.status(200).send("Appended to existing ticket");
    }

    // Step 4: Handle via emails (non-ticket message)
    console.log("ℹ️ No ticket ID — handling as email thread");

    // Step 5: Prevent duplicates
    const existingMessage = await emails.findOne({
      where: { email_thread_id: messageId, organization_id },
    });
    if (existingMessage) {
      console.log("  Duplicate messageId detected — skipping insert");
      return res.status(200).send("Duplicate email ignored");
    }

    // Step 6: Find parent thread only if inReplyTo exists
    let emailRecord = null;

    if (inReplyTo) {
      // Try direct match (inReplyTo equals parent’s messageId)
      emailRecord = await emails.findOne({
        where: { email_thread_id: inReplyTo, organization_id },
      });

      // If not found, check if parent exists inside conversations
      if (!emailRecord) {
        const possibleThreads = await emails.findAll({
          where: { organization_id },
        });
        for (const thread of possibleThreads) {
          const found = thread.conversations?.some(
            (msg) => msg.messageId === inReplyTo
          );
          if (found) {
            emailRecord = thread;
            break;
          }
        }
      }
    }

    const newEntry = {
      role: "customer",
      text: htmlBody || "(No Content)",
      attachments,
      messageId,
      inReplyTo,
      timestamp: new Date().toISOString(),
    };

    if (emailRecord) {
      // ✅ Append to existing email thread
      console.log(`📩 Found existing thread → ${emailRecord.email_thread_id}`);

      const updatedConversations = Array.isArray(emailRecord.conversations)
        ? [...emailRecord.conversations, newEntry]
        : [newEntry];

      await emailRecord.update({
        conversations: updatedConversations,
        is_new: true,
        updated_at: new Date(),
      });

      io.emit("email:updated", {
        messageId: emailRecord.email_thread_id,
        newMessage: newEntry,
        updatedEmail: emailRecord,
      });

      console.log(`✅ Appended to thread ${emailRecord.email_thread_id}`);
    } else {
      // 🆕 Always create new email thread if inReplyTo is null or no match found
      console.log("📧 Creating new email thread...");

      const newEmail = await emails.create({
        email_thread_id: messageId,
        email: from,
        in_reply_to: inReplyTo || null,
        organization_id,
        subject: subject || "(No Subject)",
        conversations: [newEntry],
        is_new: true,
        processed: false,
      });

      io.emit("email:new", {
        messageId,
        newEmail,
      });

      console.log(`🆕 Created new email thread: ${messageId}`);
    }

    return res.status(200).send("Email processed successfully");
  } catch (err) {
    console.error("❌ Error processing email webhook:", err);
    return res.status(500).send("Internal Server Error");
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const ticketsDetails = await tickets.findAll({
      where: { organization_id },
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: customers,
        },
        {
          model: users,
          attributes: ["email"],
          include: [
            {
              model: users_profiles,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
    });

    if (ticketsDetails.length === 0) {
      return res.status(404).json({
        message: "No tickets found for this organization.",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Tickets retrieved successfully.",
      data: ticketsDetails,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getClosedTicketsByCustomer = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { ticket_id } = req.params;

    // Fetch the current ticket
    const currentTicket = await tickets.findOne({
      where: { ticket_id, organization_id },
      include: [{ model: customers }],
    });

    if (!currentTicket) {
      return res.status(404).json({
        message: "Ticket not found",
        data: [],
      });
    }

    const customerEmail = currentTicket.customer.email;

    // Fetch ALL resolved tickets for same customer
    const closedTickets = await tickets.findAll({
      where: {
        organization_id,
        status: "Resolved",
      },
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: customers,
          where: { email: customerEmail },
        },
        {
          model: users,
          attributes: ["email"],
          include: [
            {
              model: users_profiles,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      message: "Closed tickets retrieved successfully",
      data: closedTickets,
    });
  } catch (error) {
    console.error("History fetch failed:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { ticket_id } = req.params;

    const ticketDetails = await tickets.findOne({
      where: { ticket_id, organization_id },
      include: [
        {
          model: customers,
        },
        {
          model: users,
          attributes: ["email"],
          include: [
            {
              model: users_profiles,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
    });

    if (!ticketDetails) {
      return res.status(404).json({
        message: "Ticket not found for this organization.",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Ticket retrieved successfully.",
      data: ticketDetails,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createTicket = async (req, res) => {
  const io = req.app.get("io");
  try {
    const {
      chatbot_id,
      customer_email,
      subject,
      custom_data = {},
      conversations,
      status = "Open",
      priority = "Medium",
      assigned_user_id = null, // NEW: assignee
      tags = [],
    } = req.body;

    if (!customer_email || !chatbot_id) {
      return res
        .status(400)
        .json({ message: "customer_email and chatbot_id are required" });
    }

    //  Get organization
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });
    if (!chatbot) {
      return res.status(400).json({ message: "chatbot_id not found." });
    }

    //  Get form configuration for the organization
    const formConfig = await forms.findOne({
      where: { organization_id: chatbot.organization_id },
    });

    const ticketFormFields = formConfig?.ticket_form || [];
    const preChatFormConfig = formConfig?.pre_chat_form || {
      fields: [],
      enabled: false,
    };
    const preChatFormFields = preChatFormConfig.fields || [];

    //  Separate data based on form config
    const ticketData = {};
    const preChatData = {};

    // Defaults
    let customerEmailValue = customer_email;
    let subjectValue = subject;
    let descriptionValue = null;

    // --- Ticket form handling ---
    for (const field of ticketFormFields) {
      const normalizedKey = field.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      if (custom_data[normalizedKey] !== undefined) {
        if (normalizedKey === "email" || normalizedKey === "email_address") {
          customerEmailValue = custom_data[normalizedKey];
        } else if (normalizedKey === "subject") {
          subjectValue = custom_data[normalizedKey];
        } else if (normalizedKey === "description") {
          descriptionValue = custom_data[normalizedKey];
        } else {
          ticketData[normalizedKey] = custom_data[normalizedKey];
        }
      }
    }

    // --- Pre-chat form handling ---
    for (const field of preChatFormFields) {
      const normalizedKey = field.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      if (custom_data[normalizedKey] !== undefined) {
        preChatData[normalizedKey] = custom_data[normalizedKey];
      }
    }

    // Ensure extra fields are stored
    if (custom_data.customer_name) {
      ticketData.customer_name = custom_data.customer_name;
    }
    if (custom_data.reference_number) {
      ticketData.reference_number = custom_data.reference_number;
    }
    if (custom_data.service_type) {
      ticketData.service_type = custom_data.service_type;
    }

    // Check or create customer
    let customer = await customers.findOne({
      where: {
        email: customerEmailValue,
        organization_id: chatbot.organization_id,
      },
    });

    if (!customer) {
      customer = await customers.create({
        email: customerEmailValue,
        organization_id: chatbot.organization_id,
        custom_data: preChatData,
      });
    }

    // Normalize conversation timestamps
    const conversation = (conversations || []).map((convo) => ({
      ...convo,
      timestamp: convo.timestamp || new Date().toISOString(),
    }));

    // generate ticket ID
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
    const new_ticket_id = nanoid();

    // Create ticket
    const newTicket = await tickets.create({
      ticket_id: new_ticket_id,
      customer_id: customer.id,
      organization_id: chatbot.organization_id,
      assigned_user_id,
      custom_data: ticketData, // dynamic custom fields
      customer_email: customerEmailValue, // save normalized email
      subject: subjectValue, // save subject
      description: descriptionValue, // optional if column exists
      conversations: conversation || [],
      is_new: true,
      status,
      priority,
      tags,
    });

    // --- Send ticket creation email ---
    try {
      const emailHtml = `
    <h2>New Support Ticket Created</h2>
    <p>Dear ${ticketData.customer_name || "Customer"},</p>
    <p>Your support ticket has been created successfully. Here are the details:</p>
    <ul>
      <li><strong>Ticket ID:</strong> ${new_ticket_id}</li>
      <li><strong>Subject:</strong> ${subjectValue}</li>
      <li><strong>Status:</strong> ${status}</li>
      <li><strong>Priority:</strong> ${priority}</li>
    </ul>
    <p>Our support team will get back to you shortly.</p>
    <br/>
    <p>Thank you,<br/>${chatbot.organization_name || "Support Team"}</p>
  `;

      // Send email to customer
      await sendEmail(
        customerEmailValue,
        `Ticket Created - ${subjectValue}`,
        emailHtml,
        true
      );

      // Optionally: send to internal support team
      // if (process.env.SUPPORT_TEAM_EMAIL) {
      //   await sendEmail(
      //     process.env.SUPPORT_TEAM_EMAIL,
      //     `New Ticket #${new_ticket_id}`,
      //     `<p>A new ticket has been raised by <strong>${customerEmailValue}</strong> for chatbot <strong>${chatbot.name}</strong>.</p>
      //  <p><strong>Subject:</strong> ${subjectValue}</p>
      //  <p><strong>Priority:</strong> ${priority}</p>
      //  <p><strong>Status:</strong> ${status}</p>`,
      //     true
      //   );
      // }

      console.log(`Ticket creation email sent to ${customerEmailValue}`);
    } catch (emailError) {
      console.error("Error sending ticket creation email:", emailError);
    }

    // Populate ticket with relations
    const populatedTicket = await tickets.findOne({
      where: { id: newTicket.id },
      include: [
        { model: customers },
        {
          model: users,
          attributes: ["email"],
          include: [
            {
              model: users_profiles,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
    });

    io.emit("ticket:created", {
      ticket: populatedTicket,
    });

    return res.status(201).json({
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    // Find ticket
    const ticket = await tickets.findOne({ where: { ticket_id } });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({
      message: "Ticket deleted successfully",
      ticket_id,
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTicket = async (req, res) => {
  const { organization_id } = req.user;
  const { status, priority, assignee_id, notes, isOpened } = req.body;
  const { ticket_id } = req.params;

  try {
    const ticket = await tickets.findOne({ where: { ticket_id } });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Validate and assign agent if provided
    if (assignee_id) {
      const agentExists = await users.findOne({
        where: { id: assignee_id, organization_id },
      });
      if (!agentExists) {
        return res
          .status(400)
          .json({ message: "Invalid assignee_id: Agent not found" });
      }
      ticket.assigned_user_id = assignee_id;
    }

    // Update basic fields
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (isOpened) {
      ticket.is_new = false;
    }

    if (notes) {
      const newEntry = {
        role: "note",
        text: notes,
        timestamp: new Date().toISOString(),
      };

      // Ensure conversations is an array
      const conv = Array.isArray(ticket.conversations)
        ? [...ticket.conversations, newEntry]
        : [newEntry];

      ticket.conversations = conv;
    }

    await ticket.save();

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      message: "Error updating ticket",
      error: error.message,
    });
  }
};

const sendTicketReplyEmail = async (req, res) => {
  const { ticket_id } = req.params;
  const { provider, subject, message, attachment } = req.body;
  const { user_id, organization_id } = req.user;

  if (!provider || !subject || !message) {
    return res.status(400).json({
      message: "provider, subject and message are required.",
    });
  }

  // 1. Fetch ticket with customer email
  const ticket = await tickets.findOne({
    where: { ticket_id },
    include: [{ model: customers, as: "customer", attributes: ["email"] }],
  });

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const organization = await organizations.findOne({
    where: { id: organization_id },
  });

  if (!organization) {
    return res.status(404).json({ message: "Organization not found" });
  }
  const originalMessageId = organization.company_email || null;
  const toEmail = ticket.customer.email;

  // -------------- RHINON EMAIL HELPER -----------------
  const sendRhinonEmail = async (recipientEmail, subject, htmlBody) => {
    // Configure AWS SES client
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Determine the sender address — prefer company_email if present

    // Prepare SES params
    const params = {
      Source: originalMessageId, // must be a verified email/domain in SES
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      console.log("RHINON Email sent:", response.MessageId);
      return response;
    } catch (err) {
      console.error("RHINON email send failed:", err);
      throw err;
    }
  };
  // ----------------------------------------------------

  // RHINON provider flow
  if (provider === "SUPPORT") {
    try {
      await sendRhinonEmail(toEmail, `${subject} #${ticket_id}`, message);
    } catch (err) {
      return res.status(500).json({
        message: "Failed to send RHINON email",
        error: err.message,
      });
    }
  } else {
    // -------------------- GOOGLE / MICROSOFT --------------------
    const account = await users_accounts.findOne({
      where: { user_id, provider },
    });

    if (!account) {
      return res
        .status(404)
        .json({ message: "No linked account for that provider" });
    }

    let email;
    try {
      let profileUrl =
        provider === "GOOGLE"
          ? "https://www.googleapis.com/oauth2/v3/userinfo"
          : "https://graph.microsoft.com/v1.0/me";

      const profileRes = await fetch(profileUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          Accept: "application/json",
        },
      });

      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        throw new Error(
          `Failed to get user profile: ${profileRes.status} - ${errorText}`
        );
      }

      const profileData = await profileRes.json();
      email =
        provider === "GOOGLE"
          ? profileData.email
          : profileData.mail || profileData.userPrincipalName;
    } catch (err) {
      console.error("Error fetching user profile:", err.message);
      return res.status(500).json({
        message: "Failed to retrieve user profile",
        error: err.message,
      });
    }

    try {
      if (provider === "GOOGLE") {
        let mimeLines;

        if (attachment) {
          const boundary = "boundary123";
          mimeLines = [
            `From: ${email}`,
            `To: ${toEmail}`,
            `Subject: ${subject} #${ticket_id}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary=${boundary}`,
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset="UTF-8"`,
            ``,
            message.replace(/\r?\n/g, "\r\n"),
            ``,
            `--${boundary}`,
            `Content-Type: ${attachment.type}; name="${attachment.name}"`,
            `Content-Disposition: attachment; filename="${attachment.name}"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            attachment.data,
            ``,
            `--${boundary}--`,
          ];
        } else {
          mimeLines = [
            `From: ${email}`,
            `To: ${toEmail}`,
            `Subject: ${subject} #${ticket_id}`,
            `Reply-To: ${originalMessageId}`,
            `In-Reply-To: ${originalMessageId}`,
            `References: ${originalMessageId}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset="UTF-8"`,
            ``,
            message.replace(/\r?\n/g, "\r\n"),
          ];
        }

        const raw = Buffer.from(mimeLines.join("\r\n"))
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const gmailRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
          }
        );

        if (!gmailRes.ok) {
          const errorText = await gmailRes.text();
          throw new Error(`Gmail API error ${gmailRes.status}: ${errorText}`);
        }
      } else if (provider === "MICROSOFT") {
        const msPayload = {
          message: {
            subject: `${subject} #${ticket_id}`,
            body: {
              contentType: "HTML",
              content: message,
            },
            toRecipients: [{ emailAddress: { address: toEmail } }],
            replyTo: [{ emailAddress: { address: originalMessageId } }],
            attachments: attachment
              ? [
                {
                  "@odata.type": "#microsoft.graph.fileAttachment",
                  name: attachment.name,
                  contentType: attachment.type,
                  contentBytes: attachment.data, // must be raw base64 (no prefix)
                },
              ]
              : [],
          },
          saveToSentItems: true,
        };

        const msRes = await fetch(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(msPayload),
          }
        );

        if (!msRes.ok) {
          const errorText = await msRes.text();
          throw new Error(
            `Microsoft Graph API error ${msRes.status}: ${errorText}`
          );
        }
      }
    } catch (err) {
      console.error("Email sending error:", err.message);
      return res.status(500).json({
        message: "Error sending email",
        error: err.message,
      });
    }
  }

  // 5. Append conversation
  const newEntry = {
    role: "support",
    text: message,
    timestamp: new Date().toISOString(),
  };

  const conv = Array.isArray(ticket.conversations)
    ? [...ticket.conversations, newEntry]
    : [newEntry];

  ticket.conversations = conv;
  ticket.subject = subject;
  ticket.is_new = false;
  await ticket.save();

  logActivity(user_id, organization_id, "TICKET", "Replied to ticket", {
    ticket_id,
  });

  return res.status(200).json({
    message: "Reply sent and ticket updated",
    ticket,
  });
};

const createFromTicket = async (req, res) => {
  const io = req.app.get("io");
  try {
    const {
      chatbot_id,
      customer_email,
      subject,
      custom_data = {},
      conversations,
      status = "Open",
      priority = "Medium",
      assigned_user_id = null, // NEW: assignee
      tags = [],
    } = req.body;

    if (!customer_email || !chatbot_id) {
      return res
        .status(400)
        .json({ message: "customer_email and chatbot_id are required" });
    }

    //  Get chatbot entry
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });
    if (!chatbot) {
      return res.status(400).json({ message: "chatbot_id not found." });
    }

    //  Extract organization_id from chatbot
    const organizationId = chatbot.organization_id;

    //  Get form configuration for the organization
    const formConfig = await forms.findOne({
      where: { organization_id: organizationId },
    });

    const ticketFormFields = formConfig?.ticket_form || [];
    const preChatFormConfig = formConfig?.pre_chat_form || {
      fields: [],
      enabled: false,
    };
    const preChatFormFields = preChatFormConfig.fields || [];

    //  Separate data based on form config
    const ticketData = {};
    const preChatData = {};

    // Defaults
    let customerEmailValue = customer_email;
    let subjectValue = subject;
    let descriptionValue = null;

    // --- Ticket form handling ---
    for (const field of ticketFormFields) {
      const normalizedKey = field.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      if (custom_data[normalizedKey] !== undefined) {
        if (normalizedKey === "email" || normalizedKey === "email_address") {
          customerEmailValue = custom_data[normalizedKey];
        } else if (normalizedKey === "subject") {
          subjectValue = custom_data[normalizedKey];
        } else if (normalizedKey === "description") {
          descriptionValue = custom_data[normalizedKey];
        } else {
          ticketData[normalizedKey] = custom_data[normalizedKey];
        }
      }
    }

    // --- Pre-chat form handling ---
    for (const field of preChatFormFields) {
      const normalizedKey = field.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      if (custom_data[normalizedKey] !== undefined) {
        preChatData[normalizedKey] = custom_data[normalizedKey];
      }
    }

    // Ensure extra fields are stored
    if (custom_data.customer_name) {
      ticketData.customer_name = custom_data.customer_name;
    }
    if (custom_data.reference_number) {
      ticketData.reference_number = custom_data.reference_number;
    }
    if (custom_data.service_type) {
      ticketData.service_type = custom_data.service_type;
    }

    //  Check or create customer
    let customer = await customers.findOne({
      where: {
        email: customerEmailValue,
        organization_id: organizationId,
      },
    });

    if (!customer) {
      customer = await customers.create({
        email: customerEmailValue,
        organization_id: organizationId,
        custom_data: preChatData,
      });
    }

    // Normalize conversation timestamps
    const conversation = (conversations || []).map((convo) => ({
      ...convo,
      timestamp: convo.timestamp || new Date().toISOString(),
    }));

    //  generate ticket ID
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
    const new_ticket_id = nanoid();

    //  Create ticket
    const newTicket = await tickets.create({
      ticket_id: new_ticket_id,
      customer_id: customer.id,
      organization_id: organizationId,
      assigned_user_id,
      custom_data: ticketData, // dynamic custom fields
      customer_email: customerEmailValue, // save normalized email
      subject: subjectValue, // save subject
      description: descriptionValue, // optional if column exists
      conversations: conversation || [],
      is_new: true,
      status,
      priority,
      tags,
    });

    //  Populate ticket with relations
    const populatedTicket = await tickets.findOne({
      where: { id: newTicket.id },
      include: [
        { model: customers },
        {
          model: users,
          attributes: ["email"],
          include: [
            {
              model: users_profiles,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
    });

    io.emit("ticket:created", {
      ticket: populatedTicket,
    });

    return res.status(201).json({
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTicketforChatbot = async (req, res) => {
  const { chatbot_id, user_email } = req.body;

  try {
    const chatbot = await chatbots.findOne({
      where: { chatbot_id },
    });

    if (!chatbot) {
      return res.status(404).json({
        message: "Organization not found with the provided chatbot ID.",
      });
    }

    const customer = await customers.findOne({
      where: { organization_id: chatbot.organization_id, email: user_email },
    });

    if (!customer) {
      return res.status(404).json({
        message: "User not found with the provided organization ID and email.",
      });
    }

    const ticketsData = await tickets.findAll({
      where: { customer_id: customer.id },
    });

    if (ticketsData.length === 0) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user." });
    }

    // Map tickets to only include required fields
    const filteredTickets = ticketsData.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      status: ticket.status,
      rating: ticket.rating,
      assigned_user_id: ticket.assigned_user_id,
      updated_at: ticket.updated_at,
    }));

    res.json(filteredTickets);
  } catch (error) {
    console.error("Error retrieving tickets:", error);
    res
      .status(500)
      .json({ message: "Error retrieving tickets", error: error.message });
  }
};

const updateTicketRating = async (req, res) => {
  try {
    const { ticket_id, rating } = req.body;

    // Validate input
    if (!ticket_id) {
      return res.status(400).json({ error: "ticket_id is required" });
    }
    if (rating == null || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "rating must be a number between 1 and 5" });
    }

    // Find ticket
    const ticket = await tickets.findOne({ where: { ticket_id } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Update rating
    ticket.rating = rating;
    await ticket.save();

    return res.json({
      message: "Ticket rating updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error updating ticket rating:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllEmails = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const emailDetails = await emails.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });

    if (emailDetails.length === 0) {
      return res.status(404).json({
        message: "No emails found for this organization.",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Emails retrieved successfully.",
      data: emailDetails,
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getEmailById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { email_id } = req.params; // use the numeric `id` or string `email_thread_id`, as per your API design

    const emailDetails = await emails.findOne({
      where: {
        id: email_id, // or `email_thread_id` if you prefer unique Gmail ID
        organization_id,
      },
    });

    if (!emailDetails) {
      return res.status(404).json({
        message: "Email not found for this organization.",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Email retrieved successfully.",
      data: emailDetails,
    });
  } catch (error) {
    console.error("Error fetching email:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const mergeSupportEmailToTicket = async (req, res) => {
  try {
    const { emailId, ticketId } = req.query;

    console.log("✋", emailId);
    // Fetch the email
    const email = await emails.findOne({ where: { id: emailId } });
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    let ticket;

    // CASE 1: Existing ticket provided
    if (ticketId && ticketId !== "null" && ticketId !== "undefined") {
      ticket = await tickets.findOne({ where: { ticket_id: ticketId } });
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
    }

    //CASE 2: No ticket provided → create new ticket
    if (!ticket) {
      // Try to find or create a customer from email (if you track customers)
      let customer = await customers.findOne({
        where: { email: email.email },
      });

      if (!customer) {
        customer = await customers.create({
          email: email.email,
          organization_id: email.organization_id,
          custom_data: {},
        });
      }

      // generate ticket ID
      const { customAlphabet } = await import("nanoid");
      const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
      const new_ticket_id = nanoid();

      ticket = await tickets.create({
        customer_id: customer.id,
        organization_id: email.organization_id,
        ticket_id: new_ticket_id,
        subject: email.subject || "Untitled Email Ticket",
        conversations: email.conversations || [],
        status: "Open",
        priority: "Medium",
        is_new: true,
        custom_data: {
          merged_from_email_thread: email.email_thread_iup,
        },
      });

      // Mark email as processed & link to ticket
      await email.update({
        ticket_id: ticket.ticket_id,
        processed: true,
        updated_at: new Date(),
      });

      return res.status(201).json({
        message: "New ticket created from email",
        data: {
          ticket_id: ticket.ticket_id,
          email_id: email.id,
          total_conversations: ticket.conversations.length,
        },
      });
    }

    //  CASE 3: Merge email → existing ticket
    const emailConversations = email.conversations || [];
    const ticketConversations = ticket.conversations || [];

    // Avoid duplicates (same messageId)
    const newConversations = emailConversations.filter(
      (ec) =>
        !ticketConversations.some(
          (tc) => tc.messageId && tc.messageId === ec.messageId
        )
    );

    const mergedConversations = [
      ...ticketConversations,
      ...newConversations.map((conv) => ({
        ...conv,
        merged_from_email: email.email_thread_id,
      })),
    ];

    await ticket.update({
      conversations: mergedConversations,
      updated_at: new Date(),
    });

    await email.update({
      ticket_id: ticket.ticket_id,
      processed: true,
      updated_at: new Date(),
    });

    return res.status(200).json({
      message: "Email successfully merged into existing ticket",
      data: {
        ticket_id: ticket.ticket_id,
        email_id: email.id,
        total_conversations: mergedConversations.length,
      },
    });
  } catch (error) {
    console.error("Error merging email into ticket:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const mergeEmailToTicket = async (req, res) => {
  try {
    const { conversations = [], ticketId, email, subject } = req.body;
    const { organization_id } = req.user; // Provided from auth middleware

    if (!Array.isArray(conversations) || conversations.length === 0) {
      return res.status(400).json({
        message: "Conversations array is required and cannot be empty.",
      });
    }

    if (!organization_id) {
      return res.status(400).json({
        message: "Organization ID is required from user context.",
      });
    }

    let ticket;

    // --- CASE 1: Merge into existing ticket ---
    if (ticketId && ticketId !== "null" && ticketId !== "undefined") {
      ticket = await tickets.findOne({ where: { ticket_id: ticketId } });
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found." });
      }

      const existingConversations = ticket.conversations || [];
      const mergedConversations = [
        ...existingConversations,
        ...conversations.map((conv) => ({
          ...conv,
          merged_from: "gmail",
          merged_at: new Date(),
        })),
      ];

      await ticket.update({
        conversations: mergedConversations,
        updated_at: new Date(),
      });

      return res.status(200).json({
        message: "Conversations merged into existing ticket successfully.",
        data: {
          ticket_id: ticket.ticket_id,
          total_conversations: mergedConversations.length,
        },
      });
    }

    // --- CASE 2: Create new ticket ---
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
    const new_ticket_id = nanoid();

    //  Try to find customer by email
    let customer = null;
    if (email) {
      customer = await customers.findOne({
        where: { email, organization_id },
      });
    }

    // If no customer found, create one
    if (!customer) {
      customer = await customers.create({
        email: email,
        organization_id,
        custom_data: {},
      });
    }

    // Create new ticket
    ticket = await tickets.create({
      customer_id: customer.id,
      organization_id,
      ticket_id: new_ticket_id,
      subject: subject ? subject : "New Email Thread",
      conversations: conversations.map((conv) => ({
        ...conv,
        merged_from: "gmail",
        merged_at: new Date(),
      })),
      status: "Open",
      priority: "Medium",
      is_new: true,
      custom_data: {
        created_from: "gmail_merge",
        merged_email: email,
      },
    });

    return res.status(201).json({
      message: "New ticket created with email conversations.",
      data: {
        ticket_id: ticket.ticket_id,
        email: customer.email,
        total_conversations: ticket.conversations.length,
      },
    });
  } catch (error) {
    console.error(" Error merging email conversations:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTickets,
  getClosedTicketsByCustomer,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  sendTicketReplyEmail,
  ticketWebhook,
  createFromTicket,
  getTicketforChatbot,
  updateTicketRating,
  getAllEmails,
  getEmailById,
  mergeEmailToTicket,
  mergeSupportEmailToTicket,
};
