const nodemailer = require("nodemailer");
const generateMarketingEmail = require("./generateMarketingEmail");
const otpGeneration = require("../utils/EmailTemplate/otpGeneration")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // TLS for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmailGoogle = async (req, res) => {
  const { email } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Construct email body with form data
  // const emailContent = `
  //   <h2>New Contact Form Submission</h2>
  //   <p><strong>First Name:</strong> ${firstName}</p>
  //   <p><strong>Last Name:</strong> ${lastName}</p>
  //   <p><strong>Email:</strong> ${email}</p>
  //   <p><strong>Phone Number:</strong> ${phoneNumber}</p>
  //   <p><strong>Message:</strong></p>
  //   <p>${message}</p>
  // `;

  const emailContent = otpGeneration();

  try {
    const info = await transporter.sendMail({
      from: `"Rhinon Tech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `New Contact Form Submission`,
      html: emailContent,
    });

    console.log("Email sent: " + info.response);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
      info: info.response,
    });
  } catch (error) {
    console.error("Error sending email: ", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send your message. Please try again later.",
      error: error.message,
    });
  }
};

const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const info = await transporter.sendMail({
      from: `"Rhinon Tech" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      [isHtml ? "html" : "text"]: content,
    });
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

module.exports = {
  sendEmailGoogle,
  sendEmail,
};
