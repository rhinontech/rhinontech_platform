const { Ticket, Conversation, Lead } = require("../models");

/**
 * Handles incoming email notifications from AWS Lambda (SES Wildcard Pipeline)
 * POST /api/email/incoming
 */
exports.handleIncomingEmail = async (req, res) => {
    try {
        const { messageId, timestamp, from, to, subject, company, bucket, key } = req.body;

        console.log(`[EmailIncoming] Received email for company: ${company} from: ${from}`);

        // Validate API Key (Optional but recommended if not handled by middleware)
        const apiKey = req.headers['x-api-key'];
        if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Logic: Route based on company name
        // 1. Find the company/organization in the DB (based on your schema)
        // 2. Create a ticket or conversation depending on existing logic

        // For now, let's just log and return success to ensure the pipeline works
        // In a real scenario, you might do:
        // const org = await Organization.findOne({ where: { slug: company } });

        res.status(200).json({
            message: "Email received and queued for processing",
            company,
            messageId
        });

    } catch (error) {
        console.error("[EmailIncoming] Error processing incoming email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
