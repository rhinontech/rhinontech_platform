const {
  organizations,
  users,
  users_profiles,
  roles,
  users_roles,
  subscriptions,
  sequelize,
  chatbots,
  forms,
  onboardings,
} = require("../models");
const jwt = require("jsonwebtoken");
const generateEmailHtml = require("../utils/generateEmail");
const { sendEmail } = require("../utils/sendEmail");
const { logActivity } = require("../utils/activityLogger");
const { customAlphabet } = require("nanoid");
const crypto = require("crypto");

// const signUp = async (req, res) => {
//   const {
//     organization_name,
//     first_name,
//     last_name,
//     email,
//     password,
//     company_size,
//   } = req.body;

//   const t = await sequelize.transaction(); // Start transaction

//   try {
//     const existingUser = await users.findOne({
//       where: { email },
//       transaction: t,
//     });

//     if (existingUser) {
//       await t.rollback();
//       return res.status(400).json({
//         message: "Email already exists. Please use a different email.",
//       });
//     }

//     const organization = await organizations.create(
//       {
//         organization_name,
//         company_size,
//       },
//       { transaction: t }
//     );

//     const subscription = await subscriptions.create(
//       {
//         organization_id: organization.id,
//         subscription_tier: "Trail",
//         subscription_start_date: new Date(),
//         subscription_end_date: new Date(
//           new Date().setDate(new Date().getDate() + 14)
//         ),
//       },
//       { transaction: t }
//     );

//     const user = await users.create(
//       {
//         email,
//         password_hash: password,
//         organization_id: organization.id,
//       },
//       { transaction: t }
//     );

//     const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
//     const customEmail = `${sanitize(first_name)}${sanitize(
//       last_name
//     )}.${sanitize(organization.organization_name)}@tickets.rhinontech.com`;

//     await users_profiles.create(
//       {
//         first_name,
//         last_name,
//         user_id: user.id,
//         assigned_by: null,
//         custom_email: customEmail,
//       },
//       { transaction: t }
//     );

//     await roles.create(
//       {
//         organization_id: organization.id,
//         roles: ["superadmin"],
//         access: {},
//       },
//       { transaction: t }
//     );

//     await users_roles.create(
//       {
//         user_id: user.id,
//         current_role: "superadmin",
//         assigned_roles: ["superadmin"],
//         permissions: {},
//       },
//       { transaction: t }
//     );

//     const { customAlphabet } = await import("nanoid");
//     const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
//     const new_chatbot_id = nanoid();

//     const newChatbot = await chatbots.create(
//       {
//         organization_id: organization.id,
//         chatbot_id: new_chatbot_id,
//       },
//       { transaction: t }
//     );

//     const defaultPreChatForm = [
//       {
//         id: "email-default",
//         type: "email",
//         label: "Email Address",
//         required: true,
//         placeholder: "Enter your email",
//       },
//     ];

//     const defaultTicketForm = [
//       {
//         id: "email-default",
//         type: "email",
//         label: "Email Address",
//         required: true,
//         placeholder: "Enter your email",
//       },
//       {
//         id: "subject-default",
//         type: "text",
//         label: "Subject",
//         required: true,
//         placeholder: "Enter subject",
//       },
//       {
//         id: "description-default",
//         type: "textarea",
//         label: "Description",
//         required: true,
//         placeholder: "Enter description",
//       },
//     ];

//     await forms.create(
//       {
//         organization_id: organization.id,
//         chatbot_id: newChatbot.chatbot_id,
//         pre_chat_form: defaultPreChatForm,
//         ticket_form: defaultTicketForm,
//         post_chat_form: {}, // empty by default
//       },
//       { transaction: t }
//     );
//     // Commit transaction before sending email
//     await t.commit();

//     // Token & email sending happen *after* DB commit
//     const emailToken = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     const confirmationUrl = `${process.env.FRONT_END_URL}/auth/verify?token=${emailToken}`;
//     const emailHtml = generateEmailHtml(confirmationUrl);

//     await sendEmail(user.email, "Confirm your email", emailHtml, true);

//     //log activity
//     logActivity(
//       user.id,
//       organization.id,
//       "SIGNUP",
//       "Organization and superadmin created",
//       { email, organization_name }
//     );
//     return res.status(201).json({
//       message:
//         "Organization and Admin created. Please check your email to confirm your account.",
//     });
//   } catch (error) {
//     await t.rollback(); // Undo all DB actions
//     console.error("Error during signup:", error);
//     return res.status(500).json({
//       message: "Error during signup",
//       error: error.message,
//     });
//   }
// };

// const resendVerificationEmail = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await users.findOne({ where: { email } });

//     if (!user) {
//       return res.status(404).json({ message: "user not found" });
//     }

//     if (user.is_email_confirmed) {
//       return res.status(400).json({ message: "Email is already confirmed" });
//     }

//     const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     const confirmationUrl = `${process.env.FRONT_END_URL}/auth/verify?token=${token}`;
//     const emailHtml = generateEmailHtml(confirmationUrl);

//     await sendEmail(user.email, "Confirm your email", emailHtml, true);
//     res.status(200).json({
//       message: "Verification email resent successfully",
//     });
//   } catch (error) {
//     console.error("Error resending verification email:", error);
//     res.status(500).json({ message: "Error resending verification email" });
//   }
// };

// const verifyEmail = async (req, res) => {
//   const { token } = req.body;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     console.log(decoded);

//     const user = await users.findByPk(decoded.user_id);

//     if (!user) {
//       return res.status(400).json({ message: "Invalid token" });
//     }

//     if (user.is_email_confirmed) {
//       return res.status(400).json({ message: "Email is already confirmed" });
//     }

//     user.is_email_confirmed = true;
//     await user.save();

//     res
//       .status(200)
//       .json({ Result: "SUCCESS", message: "Email confirmed successfully" });
//   } catch (error) {
//     console.error("Error during email verification:", error);
//     res.status(400).json({ message: "Invalid token" });
//   }
// };

const signUp = async (req, res) => {
  const { email, password, phone_number } = req.body;

  try {
    const existingUser = await users.findOne({ where: { email } });

    if (existingUser) {
      // --- Check user status ---
      if (!existingUser.is_email_confirmed) {
        return res.status(200).json({
          Result: "NotVerified",
          Email: existingUser.email,
          message: "Please verify your email before continuing.",
        });
      }

      if (!existingUser.is_onboarded) {
        return res.status(200).json({
          Result: "NotOnboarded",
          Email: existingUser.email,
          message: "Please complete your onboarding process.",
        });
      }

      return res.status(200).json({
        Result: "AlreadyRegistered",
        message: "Your account is already registered. Please log in.",
      });
    }

    // --- New signup flow ---
    const user = await users.create({
      email,
      phone_number,
      password_hash: password,
      is_email_confirmed: false,
      is_onboarded: false,
    });

    const otp = crypto.randomBytes(4).toString("hex").toUpperCase();
    user.email_otp = otp;
    user.email_otp_expires_at = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailHtml = `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
    `;
    await sendEmail(user.email, "Verify your email", emailHtml, true);

    return res.status(201).json({
      Result: "SUCCESS",
      Email: user.email,
      message:
        "Account created successfully. Please verify your email to continue.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      Result: "Error",
      message: "Signup failed",
      error: error.message,
    });
  }
};

const googleSignUp = async (req, res) => {
  const { code } = req.body;

  try {
    if (!code) {
      return res
        .status(400)
        .json({ message: "Missing Google authorization code" });
    }

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.FRONT_END_URL}/auth/signup`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json({
        message:
          tokenData.error_description ||
          "Failed to exchange Google authorization code",
      });
    }

    const { access_token } = tokenData;

    // Step 2: Fetch user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      return res.status(400).json({
        message:
          userData.error_description || "Failed to fetch Google user info",
      });
    }

    const { email, given_name } = userData;
    if (!email)
      return res
        .status(400)
        .json({ message: "No email found from Google account" });

    // Step 3: Check existing user
    const existingUser = await users.findOne({ where: { email } });

    if (existingUser) {
      if (!existingUser.is_email_confirmed) {
        return res.status(200).json({
          Result: "NotVerified",
          Email: existingUser.email,
          message: "Please verify your email before continuing.",
        });
      }

      if (!existingUser.is_onboarded) {
        return res.status(200).json({
          Result: "NotOnboarded",
          Email: existingUser.email,
          message: "Please complete your onboarding process.",
        });
      }

      return res.status(200).json({
        Result: "AlreadyRegistered",
        message: "Your account is already registered. Please log in.",
      });
    }

    // Step 4: Create user
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const user = await users.create({
      email,
      password_hash: randomPassword,
      is_email_confirmed: false,
      is_onboarded: false,
    });

    // Step 5: Send OTP
    const otp = crypto.randomBytes(4).toString("hex").toUpperCase();
    user.email_otp = otp;
    user.email_otp_expires_at = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailHtml = `
      <h2>Email Verification</h2>
      <p>Hello ${given_name || "User"},</p>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
    `;
    await sendEmail(user.email, "Verify your email", emailHtml, true);

    logActivity(
      user.id,
      null,
      "SIGNUP",
      "Google signup - verification email sent",
      { email }
    );

    return res.status(201).json({
      Result: "SUCCESS",
      Email: user.email,
      message: "Google signup successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({
      Result: "Error",
      message: "Google signup failed",
      error: error.message,
    });
  }
};

const microsoftSignUp = async (req, res) => {
  const { code, codeVerifier } = req.body;

  try {
    if (!code) {
      return res
        .status(400)
        .json({ message: "Missing Microsoft authorization code" });
    }

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.FRONT_END_URL}/auth/signup`,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json({
        message:
          tokenData.error_description ||
          "Failed to exchange authorization code",
      });
    }

    const { access_token } = tokenData;

    // Step 2: Fetch user info
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      return res.status(400).json({
        message:
          userData.error_description || "Failed to fetch Microsoft user info",
      });
    }

    const email = userData.mail || userData.userPrincipalName;
    const firstName = userData.givenName || "";
    if (!email)
      return res
        .status(400)
        .json({ message: "No email found from Microsoft account" });

    // Step 3: Check existing user
    const existingUser = await users.findOne({ where: { email } });

    if (existingUser) {
      if (!existingUser.is_email_confirmed) {
        return res.status(200).json({
          Result: "NotVerified",
          Email: existingUser.email,
          message: "Please verify your email before continuing.",
        });
      }

      if (!existingUser.is_onboarded) {
        return res.status(200).json({
          Result: "NotOnboarded",
          Email: existingUser.email,
          message: "Please complete your onboarding process.",
        });
      }

      return res.status(200).json({
        Result: "AlreadyRegistered",
        message: "Your account is already registered. Please log in.",
      });
    }

    // Step 4: Create user
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const user = await users.create({
      email,
      password_hash: randomPassword,
      is_email_confirmed: false,
      is_onboarded: false,
    });

    // Step 5: Send OTP
    const otp = crypto.randomBytes(4).toString("hex").toUpperCase();
    user.email_otp = otp;
    user.email_otp_expires_at = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailHtml = `
      <h2>Email Verification</h2>
      <p>Hello ${firstName || "User"},</p>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
    `;
    await sendEmail(email, "Verify your email", emailHtml, true);

    logActivity(
      user.id,
      null,
      "SIGNUP",
      "Microsoft signup - verification email sent",
      { email }
    );

    return res.status(201).json({
      Result: "SUCCESS",
      Email: user.email,
      message: "Microsoft signup successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Microsoft signup error:", error);
    return res.status(500).json({
      Result: "Error",
      message: "Microsoft signup failed",
      error: error.message,
    });
  }
};

const completeOnboarding = async (req, res) => {
  const { organization_name, company_size, organization_type, first_name, last_name } = req.body;
  const { user_id } = req.user;
  const t = await sequelize.transaction();

  try {
    const user = await users.findByPk(user_id, { transaction: t });
    if (!user || !user.is_email_confirmed) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "User not verified or not found." });
    }

    let organization;

    // Helper: sanitize org name for use in email
    const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Helper: generate unique company_email
    const generateUniqueOrgEmail = async (baseOrgName) => {
      let baseEmail = `support@${sanitize(baseOrgName)}.rhinontech.in`;
      let uniqueEmail = baseEmail;
      let counter = 1;

      // Check for existing org with same email
      while (
        await organizations.findOne({
          where: { company_email: uniqueEmail },
          transaction: t,
        })
      ) {
        uniqueEmail = `support@${sanitize(
          baseOrgName
        )}${counter}.rhinontech.in`;
        counter++;
      }

      return uniqueEmail;
    };

    // If user already has an organization, update it
    if (user.organization_id) {
      organization = await organizations.findByPk(user.organization_id, {
        transaction: t,
      });

      if (organization) {
        // Check if name changed → regenerate unique support email
        let newCompanyEmail = organization.company_email;
        if (organization.organization_name !== organization_name) {
          newCompanyEmail = await generateUniqueOrgEmail(organization_name);
        }

        await organization.update(
          {
            organization_name,
            company_size,
            organization_type,
            company_email: newCompanyEmail,
          },
          { transaction: t }
        );
      } else {
        // edge case: ID exists but record not found → create new one
        const uniqueEmail = await generateUniqueOrgEmail(organization_name);
        organization = await organizations.create(
          { organization_name, company_size, organization_type, company_email: uniqueEmail },
          { transaction: t }
        );
        user.organization_id = organization.id;
      }
    } else {
      // Create a new organization (original behavior)
      const uniqueEmail = await generateUniqueOrgEmail(organization_name);
      organization = await organizations.create(
        {
          organization_name,
          company_size,
          organization_type,
          company_email: uniqueEmail,
        },
        { transaction: t }
      );

      // Determine subscription tier based on email domain
      let subscriptionTier = "Trial"; // default 14-day trial
      if (user.email.toLowerCase().includes("@theproductspace")) {
        subscriptionTier = "Free"; // special Free plan
      }

      // Subscription entry
      await subscriptions.create(
        {
          organization_id: organization.id,
          subscription_tier: subscriptionTier,
          subscription_start_date: new Date(),
          subscription_end_date: new Date(
            new Date().setDate(new Date().getDate() + 14)
          ),
        },
        { transaction: t }
      );

      // Roles + Assignments
      await roles.create(
        { organization_id: organization.id, roles: ["superadmin"], access: {} },
        { transaction: t }
      );

      await users_roles.create(
        {
          user_id,
          current_role: "superadmin",
          assigned_roles: ["superadmin"],
          permissions: {},
        },
        { transaction: t }
      );

      // Onboarding
      await onboardings.create(
        {
          organization_id: organization.id,
          tours_completed: {},
          banners_seen: {},
          installation_guide: { syncWebsite: false, customizeChatbot: false },
          chatbot_installed: false,
        },
        { transaction: t }
      );

      // Chatbot + Forms
      const { customAlphabet } = await import("nanoid");
      const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
      const chatbot_id = nanoid();

      await chatbots.create(
        { organization_id: organization.id, chatbot_id },
        { transaction: t }
      );

      const defaultPreChatForm = [
        { id: "email", type: "email", label: "Email Address", placeholder: "Enter your email", required: true },
      ];

      const defaultTicketForm = [
        ...defaultPreChatForm,
        { id: "subject", type: "text", label: "Subject", placeholder: "Enter your subject", required: true },
        {
          id: "description",
          type: "textarea",
          label: "Description",
          placeholder: "Enter your description",
          required: true,
        },
      ];

      await forms.create(
        {
          organization_id: organization.id,
          chatbot_id,
          pre_chat_form: defaultPreChatForm,
          ticket_form: defaultTicketForm,
          post_chat_form: {},
        },
        { transaction: t }
      );
    }

    // Update user info
    user.organization_id = organization.id;
    user.is_onboarded = true;
    await user.save({ transaction: t });

    const existingProfile = await users_profiles.findOne({
      where: { user_id },
      transaction: t,
    });

    if (existingProfile) {
      await existingProfile.update(
        {
          first_name,
          last_name,
        },
        { transaction: t }
      );
    } else {
      await users_profiles.create(
        {
          user_id,
          first_name,
          last_name,
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Log + Token
    logActivity(
      user_id,
      organization.id,
      "ONBOARDING",
      "Organization created/updated",
      {
        organization_name,
        organization_type,
      }
    );

    const payload = {
      user_id: user.id,
      email: user.email,
      is_onboarded: user.is_onboarded,
      organization_id: user.organization_id,
      role: "superadmin",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return res.status(201).json({
      Result: "SUCCESS",
      Token: token,
      Role: "superadmin",
      is_onboarded: user.is_onboarded,
      message: "Onboarding completed successfully.",
      organization,
    });
  } catch (error) {
    await t.rollback();
    console.error("Onboarding error:", error);
    return res
      .status(500)
      .json({ message: "Onboarding failed", error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_email_confirmed) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (
      !user.email_otp ||
      user.email_otp !== otp ||
      Date.now() > user.email_otp_expires_at
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    let payload = {
      user_id: user.id,
      email: user.email,
      is_onboarded: user.is_onboarded,
    };
    // Mark as verified
    user.is_email_confirmed = true;
    user.email_otp = null;
    user.email_otp_expires_at = null;
    await user.save();

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.status(200).json({
      Result: "SUCCESS",
      is_onboarded: user.is_onboarded,
      Token: token,
      message: "Email verified successfully. Proceed to onboarding.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_email_confirmed) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new 8-character alphanumeric OTP
    const otp = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g., "A9F3B7C1"

    // Save OTP and expiry (10 minutes)
    user.email_otp = otp;
    user.email_otp_expires_at = Date.now() + 10 * 60 * 1000; // 10 mins from now
    await user.save();

    // Email content
    const emailHtml = `
      <h2>Verify Your Email</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 3px;">${otp}</h1>
      <p>This code expires in <b>10 minutes</b>.</p>
    `;

    await sendEmail(
      user.email,
      "Your Email Verification Code",
      emailHtml,
      true
    );

    return res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      message: "Error resending verification code",
      error: error.message,
    });
  }
};

const previewEmail = async (req, res) => {
  try {
    // Generate a dummy token for preview
    const emailToken = jwt.sign(
      { user_id: "dummyAdminId" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const confirmationUrl = `${process.env.FRONT_END_URL}/auth/verify?token=${emailToken}`;
    const emailHtml = generateEmailHtml(confirmationUrl);

    await sendEmail(
      "rhinontech@gmail.com",
      "Confirm your email",
      emailHtml,
      true
    );

    res.status(201).json({
      message:
        "Organization and Admin created. Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error("Error generating email preview:", error);
    res.status(500).json({
      message: "Error generating email preview",
      error: error.message,
    });
  }
};

const checkEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await users.findOne({ where: { email } });
    if (user) {
      return res.status(200).json({ isEmailAvailable: false });
    }
    res.status(200).json({ isEmailAvailable: true });
  } catch (error) {
    res
      .status(500)
      .json({ isEmailAvailable: true, message: "Server error", error: error });
  }
};

module.exports = {
  signUp,
  microsoftSignUp,
  googleSignUp,
  resendVerificationEmail,
  completeOnboarding,
  verifyEmail,
  previewEmail,
  checkEmail,
};
