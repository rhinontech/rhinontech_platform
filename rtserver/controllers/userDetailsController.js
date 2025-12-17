const {
  users,
  users_profiles,
  organizations,
  roles,
  users_roles,
  subscriptions,
  chatbots,
  activities,
  tickets,
  live_visitors,
  onboardings,
  support_conversations,
} = require("../models");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");
const { Op } = require("sequelize");

const getUserDetails = async (req, res) => {
  const { user_id, organization_id } = req.user;

  try {
    // Fetch user with related profiles, organization, roles, subscriptions
    const usersProfilesResult = await users.findOne({
      where: { id: user_id },
      include: [
        { model: users_profiles },
        {
          model: organizations,
          include: [{ model: roles }, { model: subscriptions }],
        },
        { model: users_roles },
      ],
    });

    if (!usersProfilesResult) {
      return res.status(404).json({
        message: "User profile not found for the provided user ID.",
      });
    }

    const profileData = usersProfilesResult.toJSON();
    const userData = profileData.users_profile || {};
    const organizationData = profileData.organization || {};
    const rolesData = organizationData.roles?.[0] || {};
    const subscriptionData = organizationData.subscriptions?.[0] || {};
    const userRoleData = profileData.users_role || {};

    // Fetch chatbot for this organization
    const chatbot = await chatbots.findOne({ where: { organization_id } });

    // Count new chats for this chatbot
    const AllCount = await support_conversations.findAll({
      where: { chatbot_id: chatbot?.chatbot_id },
      attributes: ["is_new"],
    });
    const chatCount = AllCount.filter((chat) => chat.is_new === true).length;

    // Count new tickets for this organization
    const allTickets = await tickets.findAll({
      where: { organization_id: organizationData.id },
      attributes: ["is_new"],
    });
    const ticketCount = allTickets.filter(
      (ticket) => ticket.is_new === true
    ).length;

    const totalVisitorsNow = await live_visitors.count({
      where: { chatbot_id: chatbot?.chatbot_id, is_online: true },
    });
    // Fetch onboarding details for this organization
    const onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });

    const onboardingData = onboardingRecord
      ? {
          tours_completed: onboardingRecord.tours_completed || {},
          banners_seen: onboardingRecord.banners_seen || {},
          installation_guide: onboardingRecord.installation_guide || {},
          chatbot_installed: onboardingRecord.chatbot_installed || false,
        }
      : {
          tours_completed: {},
          banners_seen: {},
          installation_guide: {},
          chatbot_installed: false,
        };

    // Flattened response
    const flattenedData = {
      // Organization
      organization_id: organizationData.id,
      organization_name: organizationData.organization_name,
      company_size: organizationData.company_size,
      subscription_tier: subscriptionData.subscription_tier,
      subscription_start_date: subscriptionData.subscription_start_date,
      subscription_end_date: subscriptionData.subscription_end_date,
      subscription_cycle: subscriptionData.subscription_cycle,
      seo_compliance_trigger_count:
        subscriptionData.seo_compliance_trigger_count,
      seo_performance_trigger_count:
        subscriptionData.seo_performance_trigger_count,

      // User
      email: profileData.email,
      is_email_confirmed: profileData.is_email_confirmed,
      chatbot_id: chatbot?.chatbot_id || "",

      // User profile
      user_profile_id: userData.id,
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      assigned_by: userData.assigned_by,
      image_url: userData.image_url,
      location: userData.location,
      last_active: userData.last_active,
      profile_created_at: userData.created_at,
      profile_updated_at: userData.updated_at,

      // User roles
      current_role: userRoleData.current_role,
      assigned_roles: userRoleData.assigned_roles,
      permissions: userRoleData.permissions,

      // Organization roles
      roles: rolesData.roles,
      access: rolesData.access,

      // New fields
      chat_count: chatCount,
      ticket_count: ticketCount,
      totalVisitorsNow: totalVisitorsNow,
      // Onboarding data
      onboarding: onboardingData,
    };

    res.status(200).json({
      message: "User details retrieved successfully",
      data: flattenedData,
    });
  } catch (error) {
    console.error("Error getting users details:", error);
    res.status(500).json({
      error: "Error during getting user details",
    });
  }
};

const changeUserRole = async (req, res) => {
  const { user_id } = req.user;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ message: "Role is required." });
  }

  try {
    const profileRoleData = await users_roles.findOne({
      where: { user_id: user_id },
    });

    if (!profileRoleData) {
      return res.status(404).json({
        message: "User profile not found for the authenticated user.",
      });
    }
    if (!profileRoleData.assigned_roles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role provided. Role must be one of: ${profileRoleData.assigned_roles.join(
          ", "
        )}.`,
      });
    }

    profileRoleData.current_role = role;
    await profileRoleData.save();

    res.status(200).json({
      message: "Role changed successfully",
    });
  } catch (error) {
    console.error("Error changing role:", error);
    res.status(500).json({
      error: "Error during role change",
    });
  }
};

const getProfileDetails = async (req, res) => {
  try {
    const { user_id } = req.user;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Fetch user + profile + organization (for company_email)
    const profile = await users.findOne({
      where: { id: user_id },
      attributes: ["id", "email", "phone_number", "organization_id"],
      include: [
        {
          model: users_profiles,
        },
        {
          model: organizations, // include organization for company_email
          attributes: ["organization_name", "company_email"],
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const response = {
      id: profile.id,
      user_id: profile.users_profile?.user_id || profile.id,
      email: profile.email,
      contact: profile.phone_number,
      first_name: profile.users_profile?.first_name || null,
      last_name: profile.users_profile?.last_name || null,
      company_email: profile.organization?.company_email || null, // 🔹 added
      organization_name: profile.organization?.organization_name || null, // optional extra
      location: profile.users_profile?.location || null,
      assigned_by: profile.users_profile?.assigned_by || null,
      image_url: profile.users_profile?.image_url || null,
      last_active: profile.users_profile?.last_active || null,
      created_at: profile.users_profile?.created_at || null,
      updated_at: profile.users_profile?.updated_at || null,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error fetching profile details:", err);
    return res.status(500).json({
      message: "Error fetching profile details",
      error: err.message,
    });
  }
};

const updateProfileDetails = async (req, res) => {
  try {
    const { user_id, organization_id } = req.user;
    const { location, image_url, first_name, last_name, contact } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const profile = await users_profiles.findOne({
      where: { user_id },
    });

    const user = await users.findOne({
      where: { id: user_id },
    });

    if (!profile || !user) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    // Update profile fields
    if (location) profile.location = location;
    if (image_url) profile.image_url = image_url;
    if (first_name) profile.first_name = first_name;
    if (last_name) profile.last_name = last_name;

    // Update user contact (phone number)
    if (contact) user.phone_number = contact;

    // Save both records
    await Promise.all([profile.save(), user.save()]);

    // Log activity
    logActivity(user_id, organization_id, "PROFILE", "Updated the profile", {
      location,
      image_url,
      first_name,
      last_name,
      contact,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      profile,
      phone_number: user.phone_number,
    });
  } catch (err) {
    console.error("Error updating profile details:", err.message);
    res.status(500).json({
      message: "Error updating profile details",
      error: err.message,
    });
  }
};

const changePassword = async (req, res) => {
  const { user_id, organization_id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the user
    const user = await users.findOne({
      where: { id: user_id, organization_id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update password only if different
    user.password_hash = newPassword;

    // if (user.changed("password_hash")) {
    //   const salt = await bcrypt.genSalt(10);
    //   user.password_hash = await bcrypt.hash(user.password_hash, salt);
    // }

    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

const getActivities = async (req, res) => {
  const { organization_id } = req.user;

  try {
    // Fetch all activities for this organization
    const allActivities = await activities.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });

    //Collect all unique user_ids
    const userIds = [...new Set(allActivities.map((a) => a.user_id))];

    //Fetch user profiles for these user_ids
    const userProfiles = await users_profiles.findAll({
      where: { user_id: userIds },
      attributes: ["user_id", "first_name", "last_name", "image_url"],
    });

    // console.log(userProfiles);
    //Create a lookup map for easy access
    const userMap = {};
    userProfiles.forEach((user) => {
      userMap[user.user_id] = user;
    });

    // Format activities with user info
    const formattedActivities = allActivities.map((act) => {
      const user = userMap[act.user_id];
      return {
        id: act.id,
        user_id: act.user_id,
        organization_id: act.organization_id,
        action: act.action,
        message: act.message,
        metadata: act.metadata,
        created_at: act.created_at,
        updated_at: act.updated_at,
        user_name: user ? `${user.first_name} ${user.last_name}` : null,
        user_image: user ? user.image_url : null,
      };
    });

    return res.status(200).json({ data: formattedActivities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({ error: "Failed to fetch activities" });
  }
};

const getDashboardCounts = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
      return res.status(400).json({ message: "No chatbot ID provided" });
    }

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    // Active AI chats
    const totalChatsNow = await support_conversations.count({
      where: { chatbot_id, is_closed: false },
    });

    const totalChatsWeekAgo = await support_conversations.count({
      where: {
        chatbot_id,
        is_closed: false,
        updated_at: { [Op.lte]: weekAgo },
      },
    });

    // Tickets
    const totalTicketsNow = await tickets.count({
      where: {
        organization_id,
        status: { [Op.notIn]: ["Closed", "Resolved"] },
      },
    });

    const totalTicketsWeekAgo = await tickets.count({
      where: {
        organization_id,
        status: { [Op.notIn]: ["Closed", "Resolved"] },
        created_at: { [Op.lte]: weekAgo },
      },
    });

    //  Live visitors
    const totalVisitorsNow = await live_visitors.count({
      where: { chatbot_id, is_online: true },
    });

    const totalVisitorsWeekAgo = await live_visitors.count({
      where: {
        chatbot_id,
        is_online: true,
        created_at: { [Op.lte]: weekAgo },
      },
    });

    // Team members
    const totalUsersNow = await users.count({ where: { organization_id } });
    const totalUsersWeekAgo = await users.count({
      where: {
        organization_id,
        created_at: { [Op.lte]: weekAgo },
      },
    });

    // Helper for %
    const calcPercentage = (nowCount, weekAgoCount) => {
      if (weekAgoCount === 0) return nowCount > 0 ? 100 : 0;
      return ((nowCount - weekAgoCount) / weekAgoCount) * 100;
    };

    return res.status(200).json({
      message: "Dashboard counts retrieved successfully",
      data: {
        chats: {
          count: totalChatsNow,
          weeklyChange: calcPercentage(totalChatsNow, totalChatsWeekAgo),
        },
        tickets: {
          count: totalTicketsNow,
          weeklyChange: calcPercentage(totalTicketsNow, totalTicketsWeekAgo),
        },
        liveVisitors: {
          count: totalVisitorsNow,
          weeklyChange: calcPercentage(totalVisitorsNow, totalVisitorsWeekAgo),
        },
        teamMembers: {
          count: totalUsersNow,
          weeklyChange: calcPercentage(totalUsersNow, totalUsersWeekAgo),
        },
      },
    });
  } catch (error) {
    console.error("[API] Dashboard count error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getOnboarding = async (req, res) => {
  try {
    const { organization_id } = req.user; // assumes auth middleware sets organization_id

    if (!organization_id) {
      return res.status(400).json({ message: "Organization ID not found" });
    }

    // Try to find existing onboarding
    let onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });

    // If not found, create a default onboarding record
    if (!onboardingRecord) {
      onboardingRecord = await onboardings.create({
        organization_id,
        tours_completed: {},
        banners_seen: {},
        installation_guide: { syncWebsite: false, customizeChatbot: false },
        chatbot_installed: false,
      });
    }

    return res.status(200).json({
      message: "Onboarding data retrieved successfully",
      data: {
        tours_completed: onboardingRecord.tours_completed || {},
        banners_seen: onboardingRecord.banners_seen || {},
        installation_guide: onboardingRecord.installation_guide || {},
        chatbot_installed: onboardingRecord.chatbot_installed || false,
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding:", error);
    return res.status(500).json({
      message: "Error fetching onboarding data",
      error: error.message,
    });
  }
};

module.exports = {
  getUserDetails,
  changeUserRole,
  getProfileDetails,
  updateProfileDetails,
  changePassword,
  getActivities,
  getDashboardCounts,
  getOnboarding,
};
