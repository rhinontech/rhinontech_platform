const {
  roles,
  users,
  users_profiles,
  users_roles,
  organizations,
  onboardings,
} = require("../models");
const crypto = require("crypto");
const generateEmailHtml = require("../utils/generateEmail");
const { sendEmail } = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const { logActivity } = require("../utils/activityLogger");

const getAllRoles = async (req, res) => {
  const { organization_id } = req.user;
  try {
    const orgRoles = await roles.findOne({ where: { organization_id } });

    if (!orgRoles)
      return res.status(403).json({
        message: "roles not found.",
      });

    res.status(200).json({
      message: "roles details retrieved successfully",
      data: orgRoles,
    });
  } catch (error) {
    console.log("error getting role", error);
    res.status(500).json({
      error: "Error during getting role. ",
    });
  }
};

const addNewRole = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { roleName, roleAccess } = req.body;

  if (!roleName || !roleAccess) {
    return res
      .status(400)
      .json({ message: "roleName and roleAccess are required" });
  }

  try {
    const existing = await roles.findOne({ where: { organization_id } });

    if (!existing) {
      const newRole = await roles.create({
        organization_id,
        roles: [roleName],
        access: {
          [roleName]: roleAccess,
        },
      });

      return res.status(201).json({
        message: "Role created successfully",
        data: newRole,
      });
    }

    // Role record exists — update it
    const updatedRoles = Array.from(new Set([...existing.roles, roleName])); // avoid duplicates
    const updatedAccess = {
      ...existing.access,
      [roleName]: roleAccess,
    };

    await existing.update({
      roles: updatedRoles,
      access: updatedAccess,
    });

    //log activity
    logActivity(user_id, organization_id, "TEAM", "New role added", {
      roleName,
      roleAccess,
    });
    return res.status(200).json({
      message: "Role updated successfully",
      data: existing,
    });
  } catch (error) {
    console.error("Error creating or updating role", error);
    return res
      .status(500)
      .json({ error: "Error during role creation or update." });
  }
};

const updateRole = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { oldRoleName } = req.query;
  const { roleName, roleAccess } = req.body;

  if (!oldRoleName || !roleName || !roleAccess) {
    return res.status(400).json({
      message: "oldRoleName, roleName, and roleAccess are required",
    });
  }

  try {
    const existing = await roles.findOne({ where: { organization_id } });

    if (!existing) {
      return res.status(404).json({
        message: "No roles found for organization",
      });
    }
    console.log(existing)
    if (!existing.roles.includes(oldRoleName)) {
      return res.status(404).json({
        message: `Role "${oldRoleName}" not found`,
      });
    }

    // Update the role name in the roles array
    const updatedRoles = existing.roles.map((role) =>
      role === oldRoleName ? roleName : role
    );

    // Update the access object
    const updatedAccess = { ...existing.access };

    // If role name changed, remove old key and add new one
    if (oldRoleName !== roleName) {
      delete updatedAccess[oldRoleName];
    }
    updatedAccess[roleName] = roleAccess;

    // Update the roles table
    await existing.update({
      roles: updatedRoles,
      access: updatedAccess,
    });

    // Update all users who have this role assigned
    const usersInOrg = await users.findAll({
      where: { organization_id },
      attributes: ["id"],
    });

    const userIds = usersInOrg.map((u) => u.id);

    const affectedUserRoles = await users_roles.findAll({
      where: { user_id: userIds },
    });

    for (const userRole of affectedUserRoles) {
      let needsUpdate = false;
      const currentAssigned = Array.isArray(userRole.assigned_roles)
        ? userRole.assigned_roles
        : [];

      // Update assigned_roles array
      const newAssigned = currentAssigned.map((r) => {
        if (r === oldRoleName) {
          needsUpdate = true;
          return roleName;
        }
        return r;
      });

      // Update current_role if it matches
      let newCurrent = userRole.current_role;
      if (newCurrent === oldRoleName) {
        newCurrent = roleName;
        needsUpdate = true;
      }

      // Update permissions object if role name changed
      const newPermissions = { ...userRole.permissions };
      if (oldRoleName !== roleName && newPermissions[oldRoleName]) {
        newPermissions[roleName] = newPermissions[oldRoleName];
        delete newPermissions[oldRoleName];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await userRole.update({
          assigned_roles: newAssigned,
          current_role: newCurrent,
          permissions: newPermissions,
        });
      }
    }

    // Log activity
    logActivity(user_id, organization_id, "TEAM", "Updated role", {
      oldRoleName,
      newRoleName: roleName,
      roleAccess,
    });

    return res.status(200).json({
      message: `Role "${oldRoleName}" updated successfully`,
      data: {
        roles: updatedRoles,
        access: updatedAccess,
      },
    });
  } catch (error) {
    console.error("Error updating role", error);
    return res.status(500).json({ error: "Error during role update." });
  }
};

const deleteRole = async (req, res) => {
  const { organization_id, user_id } = req.user; // current user ID
  const { roleName } = req.query;

  if (!roleName) {
    return res
      .status(400)
      .json({ message: "roleName is required to delete a role" });
  }

  try {
    //  Update roles table for the organization
    const existing = await roles.findOne({ where: { organization_id } });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "No roles found for organization" });
    }

    if (!existing.roles.includes(roleName)) {
      return res.status(404).json({ message: "Role not found" });
    }

    const updatedRoles = existing.roles.filter((role) => role !== roleName);
    const { [roleName]: _, ...updatedAccess } = existing.access;

    await existing.update({
      roles: updatedRoles,
      access: updatedAccess,
    });

    // Update all users' roles in this organization
    const usersInOrg = await users.findAll({
      where: { organization_id },
      attributes: ["id"],
    });

    const userIds = usersInOrg.map((u) => u.id);

    const affectedUserRoles = await users_roles.findAll({
      where: { user_id: userIds },
    });

    let updatedCurrentUserRoles = null;

    for (const userRole of affectedUserRoles) {
      const currentAssigned = Array.isArray(userRole.assigned_roles)
        ? userRole.assigned_roles
        : [];
      const newAssigned = currentAssigned.filter((r) => r !== roleName);

      let newCurrent = userRole.current_role;
      if (newCurrent === roleName) {
        newCurrent = newAssigned.length > 0 ? newAssigned[0] : null;
      }

      const newPermissions = { ...userRole.permissions };
      delete newPermissions[roleName];

      await userRole.update({
        assigned_roles: newAssigned,
        current_role: newCurrent,
        permissions: newPermissions,
      });

      // Capture updated roles for the current logged-in user
      if (userRole.user_id === user_id) {
        updatedCurrentUserRoles = {
          assigned_roles: newAssigned,
          current_role: newCurrent,
        };
      }
    }

    //log activity
    logActivity(user_id, organization_id, "TEAM", "Deleted the role", {
      roleName,
    });
    return res.status(200).json({
      message: `Role "${roleName}" deleted successfully and updated all users`,
      data: {
        roles: updatedRoles,
        access: updatedAccess,
        updatedUserRoles: updatedCurrentUserRoles, // send current user's updated roles
      },
    });
  } catch (error) {
    console.error("Error deleting role", error);
    return res.status(500).json({ error: "Error during role deletion." });
  }
};

const getAllUsers = async (req, res) => {
  const { organization_id } = req.user;

  try {
    const usersDetails = await users.findAll({
      where: { organization_id },
      attributes: [
        "id",
        "is_email_confirmed",
        "organization_id",
        "email",
        "created_at",
        "updated_at",
      ],
      include: [{ model: users_profiles }, { model: users_roles }],
    });

    const flattenedUsers = usersDetails.map((user) => {
      const plainUser = user.toJSON();

      return {
        ...plainUser,
        ...plainUser.users_profile,
        ...plainUser.users_role,

        users_profile: undefined,
        users_role: undefined,
      };
    });

    res.status(200).json({
      message: "Users details retrieved successfully",
      data: flattenedUsers,
    });
  } catch (error) {
    console.error("Error getting users", error);
    return res.status(500).json({ error: "Error during getting users." });
  }
};

const addNewUser = async (req, res) => {
  const io = req.app.get("io"); // get WebSocket instance
  const { organization_id, user_id } = req.user;
  const { first_name, last_name, email, roles, permissions } = req.body;

  if (!first_name || !last_name || !email || !roles?.length) {
    return res.status(400).json({
      message:
        "first_name, last_name, email, and at least one role are required.",
    });
  }

  try {
    // Check if email exists globally (not just in this organization)
    const existUser = await users.findOne({
      where: { email },
    });

    if (existUser) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    const organization = await organizations.findOne({
      where: { id: organization_id },
    });

    function generatePassword(length = 12) {
      return crypto.randomBytes(length).toString("hex").slice(0, length);
    }
    const user = await users.create({
      email,
      password_hash: generatePassword(),
      organization_id,
      is_onboarded: true,
    });

    // Generate custom email
    // const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, ""); // Removes special characters

    // const customEmail = `${sanitize(first_name)}${sanitize(
    //   last_name
    // )}.${sanitize(organization.organization_name)}@tickets.rhinontech.com`;

    const profile = await users_profiles.create({
      user_id: user.id,
      first_name,
      last_name,
      assigned_by: user_id,
      // custom_email: customEmail,
    });

    const userRole = await users_roles.create({
      user_id: user.id,
      current_role: roles[0],
      assigned_roles: roles,
      permissions: permissions || {},
    });
    const emailToken = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const confirmationUrl = `${process.env.FRONT_END_URL}/auth/teamsOnboarding?token=${emailToken}`;
    const emailHtml = generateEmailHtml(confirmationUrl);

    await sendEmail(user.email, "Confirm your email", emailHtml, true);

    let onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });
    if (!onboardingRecord) {
      onboardingRecord = await onboardings.create({
        organization_id,
        installation_guide: { addTeamMember: true },
      });
      io.emit("onboarding:updated", { organization_id });
    } else {
      const installationGuide = onboardingRecord.installation_guide || {};
      if (!installationGuide.addTeamMember) {
        installationGuide.addTeamMember = true;
        onboardingRecord.installation_guide = installationGuide;
        onboardingRecord.changed("installation_guide", true);
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id });
      }
    }
    //log activity
    logActivity(user_id, organization_id, "TEAM", "New user added", {
      first_name,
      last_name,
      email,
      roles,
      permissions,
    });
    res.status(201).json({
      message: "User created successfully and email notification sent.",
      data: {
        ...user.toJSON(),
        ...profile.toJSON(),
        ...userRole.toJSON(),
      },
    });
  } catch (error) {
    console.error("Error creating user", error);
    return res.status(500).json({ error: "Error during user creation." });
  }
};

const updateUser = async (req, res) => {
  const { organization_id } = req.user; // comes from auth middleware
  const { user_id: id, first_name, last_name, roles, permissions } = req.body;

  if (!first_name || !last_name || !roles?.length) {
    return res.status(400).json({
      message: "first_name, last_name, and at least one role are required.",
    });
  }

  try {
    // Check if user exists in the same org
    const user = await users.findOne({
      where: { id, organization_id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update profile info
    await users_profiles.update(
      { first_name, last_name },
      { where: { user_id: id } }
    );

    // Update roles
    await users_roles.update(
      {
        current_role: roles[0], // take first as active
        assigned_roles: roles,
        permissions: permissions || {},
      },
      { where: { user_id: id } }
    );

    const updatedProfile = await users_profiles.findOne({
      where: { user_id: id },
    });
    const updatedRoles = await users_roles.findOne({ where: { user_id: id } });

    //log activity
    logActivity(id, organization_id, "TEAM", "Updated the user", {
      user_id: id,
      first_name,
      last_name,
      roles,
      permissions,
    });
    res.status(200).json({
      message: "User updated successfully",
      data: {
        ...user.toJSON(),
        ...updatedProfile.toJSON(),
        ...updatedRoles.toJSON(),
      },
    });
  } catch (error) {
    console.error("Error updating user", error);
    return res.status(500).json({ error: "Error during user update." });
  }
};

const deleteUser = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { userId } = req.query;

  try {
    const user = await users.findOne({
      where: {
        id: userId,
        organization_id,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or unauthorized." });
    }

    await users_roles.destroy({ where: { user_id: userId } });
    await users_profiles.destroy({ where: { user_id: userId } });

    // Then delete the user
    await users.destroy({ where: { id: userId } });

    //log activity
    logActivity(user_id, organization_id, "TEAM", "Deleted the user", {
      userId,
    });
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Error during user deletion." });
  }
};

const verifyTeamToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(400).json({ message: "Invalid token payload." });
    }
    const user = await users.findOne({
      where: { id: decoded.user_id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.is_email_confirmed) {
      return res.status(404).json({ message: "email already verified" });
    }
    res.status(200).json({ message: "Valid token", supportEmail: user.email });
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
    res
      .status(500)
      .json({ message: "An error occurred during token verification." });
  }
};

const setTeamPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token & !password) {
    return res.status(400).json({ message: "token and password is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await users.findByPk(decoded.user_id);

    if (!user) {
      return res.status(404).json({ message: "Support user not found." });
    }

    if (user.is_email_confirmed) {
      return res.status(400).json({ message: "Email is already confirmed" });
    }

    user.password_hash = password;
    user.is_email_confirmed = true;
    await user.save();

    res.status(200).json({
      message: "Password and is_email_confirmed updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: " error during set user password ",
      error: error.message,
    });
  }
};

module.exports = {
  getAllRoles,
  addNewRole,
  updateRole,
  deleteRole,
  getAllUsers,
  addNewUser,
  updateUser,
  deleteUser,
  verifyTeamToken,
  setTeamPassword,
};
