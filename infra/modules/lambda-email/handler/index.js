const axios = require("axios");

exports.handler = async (event) => {
    console.log("Processing SES email event:", JSON.stringify(event));

    for (const record of event.Records) {
        const sesMessage = record.ses;
        const messageId = sesMessage.mail.messageId;
        const recipients = sesMessage.receipt.recipients || [];

        const recipient = recipients[0] || "";
        const parts = recipient.split('@');
        let company = "default";

        if (parts.length > 1) {
            const domainParts = parts[1].split('.');
            if (domainParts.length >= 3) {
                company = domainParts[0];
            }
        }

        try {
            const payload = {
                messageId: messageId,
                timestamp: sesMessage.mail.timestamp,
                source: sesMessage.mail.source,
                destination: recipients,
                subject: sesMessage.mail.commonHeaders.subject,
                company: company
            };

            await axios.post(process.env.RT_SERVER_URL, payload, {
                headers: { 'x-api-key': process.env.API_KEY }
            });
        } catch (error) {
            console.error("Error notifying RTServer:", error);
            throw error;
        }
    }
};
