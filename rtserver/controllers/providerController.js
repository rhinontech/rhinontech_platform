const { users_accounts } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const updateOrCreateUser = async (req, res) => {
  const { organization_id, user_id } = req.user;

  try {
    const {
      provider,
      access_token,
      id_token,
      refresh_token,
      scope,
      token_type,
      expires_in,
    } = req.body;

    const expires_time = new Date(Date.now() + expires_in * 1000).toISOString();

    const data = {
      user_id,
      provider,
      access_token,
      id_token,
      refresh_token,
      scope,
      token_type,
      expires_in: expires_time,
    };

    // Check if the user account exists
    let userAccount = await users_accounts.findOne({
      where: { user_id, provider },
    });

    if (userAccount) {
      // Update the existing record
      await userAccount.update(data);
    } else {
      // Create a new record
      await users_accounts.create(data);
    }

    //log activity
    logActivity(
      user_id,
      organization_id,
      "PROVIDER",
      "New email provider added",
      { provider }
    );
    return res.status(200).json({
      message: "User account updated or created successfully.",
      data: userAccount,
    });
  } catch (error) {
    console.error("Error updating or creating user account:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getUser = async (req, res) => {
  const { user_id } = req.user;
  const { provider } = req.body;

  if (!provider) {
    return res.status(400).json({ message: "Provider is required." });
  }

  try {
    const accountDetails = await users_accounts.findOne({
      where: { user_id: user_id, provider: provider },
    });

    if (!accountDetails) {
      return res.status(403).json({
        message: "User account details not found.",
      });
    }

    return res.status(200).json({
      message: "User account retrieved successfully",
      data: accountDetails,
    });
  } catch (error) {
    console.error("Error getting user account:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const deleteUser = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { provider } = req.query;

  if (!provider) {
    return res.status(400).json({ message: "Provider is required." });
  }

  try {
    const account = await users_accounts.findOne({
      where: { user_id, provider },
    });

    if (!account) {
      return res.status(404).json({ message: "User account not found." });
    }

    await account.destroy();

    //log activity
    logActivity(
      user_id,
      organization_id,
      "PROVIDER",
      "Email provider deleted",
      { provider }
    );
    return res.status(200).json({
      message: "User account deleted successfully.",
      data: provider,
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  updateOrCreateUser,
  getUser,
  deleteUser,
};
