const formData = require("form-data");
const Mailgun = require("mailgun.js");
const dotenv = require("dotenv");

dotenv.config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.EMAIL_API_KEY,
});

const emailServiceForClient = async (
  companyName,
  recipientEmail,
  subject,
  message
) => {
  try {
    const domain = process.env.EMAIL_DOMAIN;
    const fromEmail = `support.${companyName}@${domain}`;

    const emailData = {
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: message,
    };

    const response = await mg.messages.create(domain, emailData);

    console.log("Email sent: " + response);
    return response;
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

module.exports = { emailServiceForClient };
