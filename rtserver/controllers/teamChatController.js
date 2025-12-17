const {
    teams_channels,
    teams_members,
    teams_messages,
    users,
    users_profiles,
    organizations,
} = require("../models");
const { Op } = require("sequelize");

// Get all channels for user's organization
exports.getChannels = async (req, res) => {
    try {
        const { organization_id } = req.user;

        const channels = await teams_channels.findAll({
            where: { organization_id },
            include: [
                {
                    model: teams_members,
                    attributes: ["user_id", "role"],
                },
            ],
            order: [["created_at", "ASC"]],
        });

        // Format response to match frontend structure
        const formattedChannels = channels.map((channel) => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            members: channel.teams_members.map((m) => m.user_id.toString()),
            createdBy: channel.created_by,
            createdAt: channel.created_at,
        }));

        res.status(200).json({
            success: true,
            channels: formattedChannels,
        });
    } catch (error) {
        console.error("Error fetching channels:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch channels",
            error: error.message,
        });
    }
};

// Get all users in organization with presence status
exports.getUsers = async (req, res) => {
    try {
        const { organization_id } = req.user;

        const orgUsers = await users.findAll({
            where: { organization_id },
            attributes: ["id", "email"],
            include: [
                {
                    model: users_profiles,
                    attributes: ["first_name", "last_name", "image_url"],
                },
            ],
        });

        // Format response to match frontend structure
        const formattedUsers = orgUsers.map((user) => ({
            id: user.id.toString(),
            name: user.users_profile
                ? `${user.users_profile.first_name} ${user.users_profile.last_name}`
                : user.email.split("@")[0], // Fallback to email username if no profile
            email: user.email,
            status: "offline", // Default status, will be updated via Socket.io
            avatar: user.users_profile?.image_url || null,
        }));

        res.status(200).json({
            success: true,
            users: formattedUsers,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

// Get messages for a channel or DM
exports.getMessages = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const { scope_type, scope_id, limit = 50, offset = 0 } = req.query;

        if (!scope_type || !scope_id) {
            return res.status(400).json({
                success: false,
                message: "scope_type and scope_id are required",
            });
        }

        const messages = await teams_messages.findAll({
            where: {
                organization_id,
                scope_type,
                scope_id,
            },
            include: [
                {
                    model: users,
                    as: "sender",
                    attributes: ["id", "email"],
                    include: [
                        {
                            model: users_profiles,
                            attributes: ["first_name", "last_name"],
                        },
                    ],
                },
            ],
            order: [["created_at", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        // Format response to match frontend structure
        const formattedMessages = messages.reverse().map((msg) => ({
            id: msg.id,
            senderId: msg.sender_id.toString(),
            senderName: msg.sender.users_profile
                ? `${msg.sender.users_profile.first_name} ${msg.sender.users_profile.last_name}`
                : msg.sender.email.split("@")[0],
            content: msg.content,
            timestamp: msg.created_at,
        }));

        res.status(200).json({
            success: true,
            messages: formattedMessages,
            hasMore: messages.length === parseInt(limit),
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { organization_id, user_id } = req.user;
        const { scope_type, scope_id, content } = req.body;

        if (!scope_type || !scope_id || !content) {
            return res.status(400).json({
                success: false,
                message: "scope_type, scope_id, and content are required",
            });
        }

        // Get sender info
        const sender = await users.findByPk(user_id, {
            attributes: ["id", "email"],
            include: [
                {
                    model: users_profiles,
                    attributes: ["first_name", "last_name"],
                },
            ],
        });

        // Create message
        const message = await teams_messages.create({
            organization_id,
            scope_type,
            scope_id,
            sender_id: user_id,
            content: content.trim(),
        });

        // Format response
        const formattedMessage = {
            id: message.id,
            senderId: message.sender_id.toString(),
            senderName: sender.users_profile
                ? `${sender.users_profile.first_name} ${sender.users_profile.last_name}`
                : sender.email.split("@")[0],
            content: message.content,
            timestamp: message.created_at,
        };

        // Emit Socket.io event
        const io = req.app.get("io");
        if (io) {
            const room = scope_type === "channel" ? `channel:${scope_id}` : `dm:${scope_id}`;
            io.to(room).emit("team_message", {
                scopeType: scope_type,
                scopeId: scope_id,
                message: formattedMessage,
            });
        }

        res.status(201).json({
            success: true,
            message: formattedMessage,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

// Create a new channel
exports.createChannel = async (req, res) => {
    try {
        const { organization_id, user_id } = req.user;
        const { name, type = "public", member_ids = [] } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Channel name is required",
            });
        }

        // Create channel
        const channel = await teams_channels.create({
            organization_id,
            name: name.trim(),
            type,
            created_by: user_id,
        });

        // Add creator as admin member, ensure no duplicates by converting to numbers
        const uniqueMemberIds = new Set([
            user_id,
            ...member_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
        ]);
        const memberIds = Array.from(uniqueMemberIds);

        // Add members
        const memberPromises = memberIds.map((memberId, index) =>
            teams_members.create({
                channel_id: channel.id,
                user_id: memberId,
                organization_id,
                role: memberId === user_id ? "admin" : "member", // Creator is admin
            })
        );

        await Promise.all(memberPromises);

        // Fetch complete channel data
        const completeChannel = await teams_channels.findByPk(channel.id, {
            include: [
                {
                    model: teams_members,
                    attributes: ["user_id", "role"],
                },
            ],
        });

        // Format response
        const formattedChannel = {
            id: completeChannel.id,
            name: completeChannel.name,
            type: completeChannel.type,
            members: completeChannel.teams_members.map((m) => m.user_id.toString()),
            createdBy: completeChannel.created_by,
            createdAt: completeChannel.created_at,
        };

        // Emit Socket.io event to notify members
        const io = req.app.get("io");
        if (io) {
            memberIds.forEach((memberId) => {
                io.to(`user:${memberId}`).emit("channel_created", formattedChannel);
            });
        }

        res.status(201).json({
            success: true,
            channel: formattedChannel,
        });
    } catch (error) {
        console.error("Error creating channel:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create channel",
            error: error.message,
        });
    }
};

// Get channel members
exports.getChannelMembers = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const { channelId } = req.params;

        const members = await teams_members.findAll({
            where: {
                channel_id: channelId,
                organization_id,
            },
            include: [
                {
                    model: users,
                    attributes: ["id", "email"],
                    include: [
                        {
                            model: users_profiles,
                            attributes: ["first_name", "last_name", "image_url"],
                        },
                    ],
                },
            ],
        });

        // Format response
        const formattedMembers = members.map((member) => ({
            id: member.user.id.toString(),
            name: member.user.users_profile
                ? `${member.user.users_profile.first_name} ${member.user.users_profile.last_name}`
                : member.user.email.split("@")[0],
            email: member.user.email,
            role: member.role,
            avatar: member.user.users_profile?.image_url || null,
            joinedAt: member.joined_at,
        }));

        res.status(200).json({
            success: true,
            members: formattedMembers,
        });
    } catch (error) {
        console.error("Error fetching channel members:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch channel members",
            error: error.message,
        });
    }
};
