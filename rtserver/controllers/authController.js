const bcrypt = require("bcryptjs");
const { users, users_roles, users_profiles } = require("../models");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendEmail");
const { outlook } = require("../services/outlook");
const { logActivity } = require("../utils/activityLogger");

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await users.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        Result: "Warning",
        Data: "Invalid email",
      });
    }

    const userProfile = await users_profiles.findOne({
      where: { user_id: user.id },
    });

    const profile = await users_roles.findOne({
      where: { user_id: user.id },
    });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        Result: "Warning",
        Data: "Invalid password",
      });
    }

    // If email not verified
    if (!user.is_email_confirmed) {
      return res.status(200).json({
        Result: "NotVerified",
        Data: "Email not verified",
        Email: user.email,
      });
    }

    // Build JWT payload based on onboarding status
    let payload = {
      user_id: user.id,
      email: user.email,
      is_onboarded: user.is_onboarded,
    };

    // If onboarded, add extra info
    if (user.is_onboarded) {
      payload.organization_id = user.organization_id;
      payload.role = profile?.current_role || null;
    }

    // Generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    if (userProfile) {
      userProfile.last_active = new Date();
      await userProfile.save();
    }

    logActivity(
      user.id,
      user.organization_id,
      "LOGIN",
      "User logged in successfully",
      { email }
    );

    return res.status(200).json({
      Result: "SUCCESS",
      Token: token,
      Role: profile?.current_role || null,
      is_onboarded: user.is_onboarded,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      Result: "Error",
      Data: "Error during login",
    });
  }
};

const googleLogin = async (req, res) => {
  const { code } = req.body; // Authorization code from frontend

  try {
    if (!code) {
      return res
        .status(400)
        .json({ Result: "Error", Data: "Missing Google authorization code" });
    }

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.FRONT_END_URL}/auth/login`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json({
        Result: "Error",
        Data: tokenData.error_description || "Failed to exchange code",
      });
    }

    const { access_token } = tokenData;

    // Step 2: Fetch user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const userData = await userResponse.json();
    if (!userResponse.ok) {
      return res.status(400).json({
        Result: "Error",
        Data: userData.error_description || "Failed to fetch user info",
      });
    }

    if (!userData.verified_email) {
      return res.status(200).json({
        Result: "NotVerified",
        Data: "Email not verified",
        Email: user.email,
      });
    }

    // Step 3: Match user in DB
    const user = await users.findOne({ where: { email: userData.email } });
    if (!user) {
      return res
        .status(401)
        .json({ Result: "Warning", Data: "Email not registered" });
    }

    if (!user.is_email_confirmed) {
      return res.status(200).json({
        Result: "NotVerified",
        Data: "Email not confirmed",
        Email: user.email,
      });
    }

    const userProfile = await users_profiles.findOne({
      where: { user_id: user.id },
    });
    const profile = await users_roles.findOne({ where: { user_id: user.id } });

    // Step 4: Build JWT payload
    let payload = {
      user_id: user.id,
      email: user.email,
      is_onboarded: user.is_onboarded,
    };

    if (user.is_onboarded) {
      payload.organization_id = user.organization_id;
      payload.role = profile?.current_role || null;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    // Update last active
    if (userProfile) {
      userProfile.last_active = new Date();
      await userProfile.save();
    }

    logActivity(
      user.id,
      user.organization_id,
      "LOGIN",
      "User logged in successfully",
      { email: user.email }
    );

    return res.status(200).json({
      Result: "SUCCESS",
      Token: token,
      Role: user.is_onboarded ? profile?.current_role : null,
      is_onboarded: user.is_onboarded,
    });
  } catch (error) {
    console.error("Error during Google login:", error);
    return res
      .status(500)
      .json({ Result: "Error", Data: "Internal server error" });
  }
};

const microsoftLogin = async (req, res) => {
  const { code, codeVerifier } = req.body;

  try {
    if (!code) {
      return res.status(400).json({
        Result: "Error",
        Data: "Missing Microsoft authorization code",
      });
    }

    // Exchange code for token
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.FRONT_END_URL}/auth/login`,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json({
        Result: "Error",
        Data: tokenData.error_description || "Failed to exchange code",
      });
    }

    const { access_token } = tokenData;

    // Fetch user info
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      return res.status(400).json({
        Result: "Error",
        Data: userData.error_description || "Failed to fetch user info",
      });
    }

    const email = userData.mail || userData.userPrincipalName;
    if (!email) {
      return res.status(401).json({
        Result: "Warning",
        Data: "Email not available from Microsoft",
      });
    }

    const user = await users.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ Result: "Warning", Data: "Email not registered" });
    }

    if (!user.is_email_confirmed) {
      return res.status(200).json({
        Result: "NotVerified",
        Data: "Email not confirmed",
        Email: user.email,
      });
    }

    const userProfile = await users_profiles.findOne({
      where: { user_id: user.id },
    });
    const profile = await users_roles.findOne({ where: { user_id: user.id } });

    // JWT payload
    let payload = {
      user_id: user.id,
      email: user.email,
      is_onboarded: user.is_onboarded,
    };
    if (user.is_onboarded) {
      payload.organization_id = user.organization_id;
      payload.role = profile?.current_role || null;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    if (userProfile) {
      userProfile.last_active = new Date();
      await userProfile.save();
    }

    logActivity(
      user.id,
      user.organization_id,
      "LOGIN",
      "User logged in successfully",
      { email: user.email }
    );

    return res.status(200).json({
      Result: "SUCCESS",
      Token: token,
      Role: user.is_onboarded ? profile?.current_role : null,
      is_onboarded: user.is_onboarded,
    });
  } catch (error) {
    console.error("Error during Microsoft login:", error);
    return res
      .status(500)
      .json({ Result: "Error", Data: "Internal server error" });
  }
};

const sendVerificationEmailForForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await users.findOne({
      where: { email },
      include: [
        { model: users_profiles, attributes: ["first_name", "last_name"] },
      ],
    });

    if (!user) {
      return res.status(401).json({
        Result: "Warning",
        Data: "Invalid email, User not Found",
      });
    }

    const token = jwt.sign(
      { user_id: user.id, role: "admin", email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const emailHtml = `<div>
      Hello ${user.users_profile?.first_name} ${user.users_profile?.last_name}<br/>
      As your request, we sent you the reset password link.<br/>
      To change password, click the link below:<br/>
      <a href="${process.env.FRONT_END_URL}/auth/changePassword?token=${token}">
        verification link
      </a>
    </div>`;

    await sendEmail(user.email, "Change your Password", emailHtml, true);
    res
      .status(200)
      .json({ emailHtml, message: "Change password link sended successfully" });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return res.status(500).json({
      message: "Error sending verification email",
      error: error.message,
    });
  }
};

const verifyForgotPasswordToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.user_id || !decoded.role || !decoded.email) {
      return res.status(400).json({ message: "Invalid token payload." });
    }

    const user = await users.findOne({
      where: { id: decoded.user_id, email: decoded.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({
      message: "Valid token",
      supportEmail: user.email,
    });
  } catch (error) {
    console.error("Error during token verification:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please request a new one." });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token. Please request a valid one." });
    }
    return res
      .status(500)
      .json({ message: "An error occurred during token verification." });
  }
};

const changePassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token & !password) {
    return res.status(400).json({ message: "token and password is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await users.findOne({
      where: { id: decoded.user_id, email: decoded.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password_hash = password;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: " error during Change password ",
      error: error.message,
    });
  }
};

const getOutLookToken = async (req, res) => {
  outlook.getToken(req, res);
};

const getOutLookRefreshToken = async (req, res) => {
  outlook.refreshToken(req, res);
};

module.exports = {
  login,
  sendVerificationEmailForForgotPassword,
  verifyForgotPasswordToken,
  changePassword,
  getOutLookToken,
  getOutLookRefreshToken,
  googleLogin,
  microsoftLogin,
};
