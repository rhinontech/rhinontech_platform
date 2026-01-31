const {
    sequelize,
    seed_data_registry,
    customers,
    tickets,
    chatbots,
    chatbot_campaigns,
    forms,
    folders,
    articles,
    tasks,
    teams_channels,
    teams_members,
    teams_messages,
    automations,
    whatsapp_accounts,
    whatsapp_contacts,
    activities,
    notifications,
    live_visitors,
    support_conversations,
    emails,
    seo_page_views,
    seo_sessions,
    seo_engagements,
    seo_compliances,
    seo_performances,
} = require("../models");
const {
    companies,
    peoples,
    deals,
    pipelines,
    groups,
    views,
    pipeline_stage_histories,
} = require("../models/crm_models/crmdb");
const { Op } = require("sequelize");

/**
 * Get seed data status for the current organization
 * @route GET /api/seed-data/status
 */
exports.getStatus = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID not found",
            });
        }

        // Count seed data entries for this organization
        const count = await seed_data_registry.count({
            where: { organization_id: organizationId },
        });

        return res.status(200).json({
            success: true,
            hasSeedData: count > 0,
            count: count,
        });
    } catch (error) {
        console.error("Error checking seed data status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check seed data status",
            error: error.message,
        });
    }
};

/**
 * Add seed data for all features
 * @route POST /api/seed-data
 */
exports.addSeedData = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const organizationId = req.user.organization_id;
        const userId = req.user.user_id;

        if (!organizationId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Organization ID not found",
            });
        }

        // Check if seed data already exists
        const existingCount = await seed_data_registry.count({
            where: { organization_id: organizationId },
            transaction,
        });

        if (existingCount > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Seed data already exists for this organization",
            });
        }

        const summary = {};

        // Create seed data for each feature
        summary.seo = await createSeedSEO(organizationId, transaction);
        // summary.crm = await createSeedCRM(organizationId, userId, transaction);
        summary.customers = await createSeedCustomers(organizationId, transaction);
        // summary.customerPipeline = await createSeedCustomerPipeline(organizationId, userId, transaction);
        summary.tickets = await createSeedTickets(organizationId, userId, transaction);
        summary.chatbots = await createSeedChatbots(organizationId, transaction);
        summary.chatbotCampaigns = await createSeedChatbotCampaigns(organizationId, transaction);
        summary.forms = await createSeedForms(organizationId, summary.chatbots.ids, transaction);
        summary.knowledgeBase = await createSeedKnowledgeBase(organizationId, transaction);
        summary.tasks = await createSeedTasks(organizationId, userId, transaction);
        summary.teamChat = await createSeedTeamChat(organizationId, userId, transaction);
        summary.automations = await createSeedAutomations(organizationId, transaction);
        summary.whatsapp = await createSeedWhatsApp(organizationId, transaction);

        summary.liveVisitors = await createSeedLiveVisitors(organizationId, transaction);
        summary.supportConversations = await createSeedSupportConversations(organizationId, userId, transaction);
        summary.emails = await createSeedEmails(organizationId, transaction);

        summary.activities = await createSeedActivities(organizationId, userId, transaction);
        summary.notifications = await createSeedNotifications(organizationId, userId, transaction);

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: "Seed data created successfully",
            summary: summary,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error adding seed data:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add seed data",
            error: error.message,
        });
    }
};

/**
 * Delete all seed data for the current organization
 * @route DELETE /api/seed-data
 */
exports.deleteSeedData = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const organizationId = req.user.organization_id;

        if (!organizationId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Organization ID not found",
            });
        }

        // Get all seed data records for this organization
        const seedRecords = await seed_data_registry.findAll({
            where: { organization_id: organizationId },
            transaction,
        });

        if (seedRecords.length === 0) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "No seed data found for this organization",
            });
        }

        const deletionSummary = {};

        // Group records by table
        const recordsByTable = {};
        seedRecords.forEach((record) => {
            if (!recordsByTable[record.table_name]) {
                recordsByTable[record.table_name] = [];
            }
            recordsByTable[record.table_name].push(record.record_id);
        });

        // Map table names to models  
        const tableModelMap = {
            customers, tickets, chatbots, chatbot_campaigns, forms,
            articles, folders, tasks, teams_channels, teams_members, teams_messages,
            automations, whatsapp_accounts, whatsapp_contacts,
            live_visitors, support_conversations, emails, activities, notifications,
            // CRM
            companies, peoples, pipelines, deals, groups, views, pipeline_stage_histories,
            // SEO
            seo_page_views, seo_sessions, seo_engagements, seo_compliances, seo_performances,
            // ALIASES for legacy data (Singular)
            seo_engagement: seo_engagements,
            seo_compliance: seo_compliances,
        };

        // Define deletion order (children first to avoid Foreign Key constraints)
        const deletionOrder = [
            // Level 4 (Deepest dependencies)
            "teams_messages", "seo_engagements", "seo_engagement", "deals", "pipeline_stage_histories",
            // Level 3
            "support_conversations", "live_visitors",
            "teams_members", "items",
            "seo_page_views", "seo_sessions", "seo_compliances", "seo_compliance", "seo_performances",
            "pipelines", "peoples", "views",
            // Level 2
            "forms", "chatbot_campaigns", "teams_channels", "articles", "tasks", "tickets",
            "whatsapp_contacts", "companies", "groups",
            // Level 1
            "folders", "automations", "whatsapp_accounts", "emails", "activities", "notifications",
            // Level 0 (Parents)
            "chatbots", "customers",
        ];

        // 1. Delete in defined order
        for (const tableName of deletionOrder) {
            if (recordsByTable[tableName]) {
                const model = tableModelMap[tableName];
                if (model) {
                    await model.destroy({
                        where: { id: recordsByTable[tableName] },
                        transaction
                    });
                    delete recordsByTable[tableName]; // Remove processed
                }
            }
        }

        // 2. Delete any remaining tables (no specific order)
        for (const [tableName, recordIds] of Object.entries(recordsByTable)) {
            const model = tableModelMap[tableName];
            if (model) {
                await model.destroy({
                    where: { id: recordIds },
                    transaction,
                });
            }
        }

        // Finally, delete registry entries
        const registryCount = await seed_data_registry.destroy({
            where: { organization_id: organizationId },
            transaction,
        });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Seed data deleted successfully",
            deletionSummary: deletionSummary,
            registryEntriesDeleted: registryCount,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error deleting seed data:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete seed data",
            error: error.message,
        });
    }
};

// ============================================================================
// SEED DATA CREATION FUNCTIONS
// ============================================================================

/**
 * Helper function to register seed data in the registry
 */
async function registerSeedData(tableName, recordId, organizationId, transaction) {
    await seed_data_registry.create(
        {
            table_name: tableName,
            record_id: recordId,
            organization_id: organizationId,
        },
        { transaction }
    );
}

/**
 * Create seed customers
 */
async function createSeedCustomers(organizationId, transaction) {
    const customersData = [
        { name: "Alice Johnson", email: "alice.johnson@example.com", phone: "+1234567890" },
        { name: "Bob Smith", email: "bob.smith@example.com", phone: "+1234567891" },
        { name: "Carol Williams", email: "carol.williams@example.com", phone: "+1234567892" },
        { name: "David Brown", email: "david.brown@example.com", phone: "+1234567893" },
        { name: "Emma Davis", email: "emma.davis@example.com", phone: "+1234567894" },
        { name: "Frank Miller", email: "frank.miller@example.com", phone: "+1234567895" },
        { name: "Grace Wilson", email: "grace.wilson@example.com", phone: "+1234567896" },
    ];

    const createdIds = [];
    for (const customerData of customersData) {
        const customer = await customers.create(
            {
                organization_id: organizationId,
                ...customerData,
            },
            { transaction }
        );
        await registerSeedData("customers", customer.id, organizationId, transaction);
        createdIds.push(customer.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed customer pipeline (Groups, Views, Pipelines, History)
 */
async function createSeedCustomerPipeline(organizationId, userId, transaction) {
    // 1. Fetch Customers
    const existingCustomers = await customers.findAll({
        where: { organization_id: organizationId },
        transaction
    });

    if (!existingCustomers.length) return {};

    // 2. CHECK for EXISTING Pipeline (Default Customers) or Create New
    let pipeline = await pipelines.findOne({
        where: {
            organization_id: organizationId,
            pipeline_manage_type: "default_customers"
        },
        transaction
    });

    let view, group;

    if (pipeline) {
        // Use existing pipeline steps
        console.log("Found existing pipeline:", pipeline.id);
    } else {
        // Create Group
        group = await groups.create({
            organization_id: organizationId,
            created_by: userId,
            group_name: "Customer Pipeline Group",
            manage_type: "default_customers",
        }, { transaction });
        await registerSeedData("groups", group.id, organizationId, transaction);

        // Create View
        view = await views.create({
            organization_id: organizationId,
            created_by: userId,
            group_id: group.id,
            view_name: "Customer Pipeline",
            view_manage_type: "default_customers",
            view_type: "pipeline",
        }, { transaction });
        await registerSeedData("views", view.id, organizationId, transaction);

        // Create Pipeline
        pipeline = await pipelines.create({
            organization_id: organizationId,
            view_id: view.id,
            name: "Customer Onboarding",
            pipeline_manage_type: "default_customers",
            stages: [
                { id: 1, name: "New Lead", color: "#3B82F6" },
                { id: 2, name: "Contacted", color: "#F59E0B" },
                { id: 3, name: "Proposal", color: "#8B5CF6" },
                { id: 4, name: "Active", color: "#10B981" },
                { id: 5, name: "Churned", color: "#EF4444" }
            ]
        }, { transaction });
        await registerSeedData("pipelines", pipeline.id, organizationId, transaction);
    }

    // 3. Add Histories
    // Use pipeline.stages to determine valid IDs
    const stages = pipeline.stages || [];

    // Determine Stage IDs for distribution
    let stageIds = [];
    if (Array.isArray(stages) && stages.length > 0) {
        // Existing pipeline stages logic
        stageIds = stages.map(s => s.id);
    } else {
        // Fallback (likely we just created it with IDs 1-5, OR parsed JSON failed?)
        // If we created it, stages might not be reflected in object unless re-fetched or we manually set
        stageIds = [1, 2, 3, 4, 5];
    }

    let historiesCreated = 0;
    for (let i = 0; i < existingCustomers.length; i++) {
        const customer = existingCustomers[i];

        // Randomly assign or distribute
        const stageIndex = i % stageIds.length;
        const stageId = stageIds[stageIndex];

        const history = await pipeline_stage_histories.create({
            pipeline_id: pipeline.id,
            entity_id: customer.id,
            entity_type: "default_customers",
            from_stage_id: null,
            to_stage_id: stageId,
            moved_by: userId,
            moved_at: new Date(),
            duration_in_stage: 0
        }, { transaction });
        await registerSeedData("pipeline_stage_histories", history.id, organizationId, transaction);
        historiesCreated++;
    }

    return {
        pipeline: pipeline.id,
        histories: historiesCreated
    };
}

/**
 * Create seed tickets
 */
async function createSeedTickets(organizationId, userId, transaction) {
    // First get seed customers
    const seedCustomerRecords = await seed_data_registry.findAll({
        where: {
            organization_id: organizationId,
            table_name: "customers",
        },
        transaction,
    });

    const customerIds = seedCustomerRecords.map((r) => r.record_id);

    const ticketsData = [
        {
            title: "Cannot login to account",
            description: "I'm having trouble logging into my account. Password reset doesn't work.",
            status: "Open",
            priority: "High",
            conversation: [{ role: "support", text: "I'm looking into your login issue.", timestamp: new Date().toISOString() }]
        },
        {
            title: "Billing inquiry",
            description: "I was charged twice this month. Please help.",
            status: "Pending",
            priority: "Medium",
            conversation: [{ role: "support", text: "Please provide your transaction ID.", timestamp: new Date().toISOString() }]
        },
        {
            title: "Account upgrade",
            description: "How do I upgrade to the premium plan?",
            status: "Closed",
            priority: "Low",
            conversation: [{ role: "support", text: "This feature is on our roadmap.", timestamp: new Date().toISOString() }]
        },
        {
            title: "Data export not working",
            description: "Trying to export my data but getting an error.",
            status: "Pending",
            priority: "High",
            conversation: [{ role: "support", text: "We have reproduced the bug.", timestamp: new Date().toISOString() }]
        },
    ];

    const createdIds = [];
    for (let i = 0; i < ticketsData.length; i++) {
        const ticketData = ticketsData[i];
        const customer_id = customerIds[i % customerIds.length];

        // Generate unique ticket_id (e.g., TKT-1738062000123)
        const ticket_id = `TKT-${Date.now()}-${i}`;

        const ticket = await tickets.create(
            {
                organization_id: organizationId,
                customer_id: customer_id,
                assigned_user_id: userId,
                ticket_id: ticket_id,
                ...ticketData,
            },
            { transaction }
        );
        await registerSeedData("tickets", ticket.id, organizationId, transaction);
        createdIds.push(ticket.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed chatbots
 */
async function createSeedChatbots(organizationId, transaction) {
    // Check if chatbots already exist for this organization
    const existingChatbots = await chatbots.findAll({
        where: { organization_id: organizationId },
        limit: 1,
        transaction
    });

    if (existingChatbots.length > 0) {
        console.log(`Using existing chatbot ID: ${existingChatbots[0].chatbot_id}`);
        // Register this existing chatbot as "seeded" so other functions can find it via registry
        // (Optional: standard seed logic relies on registry, but we can also just rely on fetching chatbots)

        // Return existing IDs for downstream functions correctly
        return {
            count: existingChatbots.length,
            ids: existingChatbots.map(b => b.id),
            // IMPORTANT: We need to make sure downstream functions find THIS chatbot.
            // Since we aren't creating new ones, we won't add to registry.
            // But downstream functions look at registry "table_name: chatbots".
            // So we'll have to adjust downstream functions to look at REAL chatbots table too.
        };
    }

    const chatbotsData = [
        {
            name: "Customer Support Bot",
            description: "Handles common customer inquiries and support tickets",
            is_active: true,
        },
        {
            name: "Sales Assistant",
            description: "Helps qualify leads and answer product questions",
            is_active: true,
        },
    ];

    const createdIds = [];
    for (let i = 0; i < chatbotsData.length; i++) {
        const botData = chatbotsData[i];
        const chatbot_id = `SED${String(i).padStart(3, '0')}`;
        const chatbot = await chatbots.create(
            {
                organization_id: organizationId,
                chatbot_id: chatbot_id,
                ...botData,
            },
            { transaction }
        );
        await registerSeedData("chatbots", chatbot.id, organizationId, transaction);
        createdIds.push(chatbot.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed forms
 */
async function createSeedForms(organizationId, chatbotIds, transaction) {
    let chatbot_string_id = null;

    // 1. Try to use passed chatbotIds (which are internal IDs)
    if (chatbotIds && chatbotIds.length > 0) {
        const bot = await chatbots.findByPk(chatbotIds[0], { transaction });
        if (bot) chatbot_string_id = bot.chatbot_id;
    }

    // 2. Fallback: Lookup any chatbot for this org
    if (!chatbot_string_id) {
        const bot = await chatbots.findOne({
            where: { organization_id: organizationId },
            transaction
        });
        if (bot) chatbot_string_id = bot.chatbot_id;
    }

    // 3. Last resort
    if (!chatbot_string_id) chatbot_string_id = "seed_bot_1";

    const formsData = [
        {
            name: "Contact Form",
            description: "General contact and inquiry form",
            schema: JSON.stringify({
                fields: [
                    { name: "name", type: "text", required: true },
                    { name: "email", type: "email", required: true },
                    { name: "message", type: "textarea", required: true },
                ],
            }),
        },
        {
            name: "Feedback Form",
            description: "Customer feedback and suggestions",
            schema: JSON.stringify({
                fields: [
                    { name: "rating", type: "number", required: true },
                    { name: "feedback", type: "textarea", required: true },
                ],
            }),
        },
    ];

    const createdIds = [];
    for (const formData of formsData) {
        const form = await forms.create(
            {
                organization_id: organizationId,
                chatbot_id: chatbot_string_id,
                ...formData,
            },
            { transaction }
        );
        await registerSeedData("forms", form.id, organizationId, transaction);
        createdIds.push(form.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed knowledge base (folders and articles)
 */
async function createSeedKnowledgeBase(organizationId, transaction) {
    // Create folders
    const foldersData = [
        { name: "Getting Started", description: "Onboarding guides and tutorials" },
        { name: "FAQ", description: "Frequently asked questions" },
        { name: "API Documentation", description: "Developer resources" },
    ];

    const folderIds = [];
    for (const folderData of foldersData) {
        const folder = await folders.create(
            {
                organization_id: organizationId,
                ...folderData,
            },
            { transaction }
        );
        await registerSeedData("folders", folder.id, organizationId, transaction);
        folderIds.push(folder.id);
    }

    // Create articles
    const articlesData = [
        {
            folder_id: folderIds[0],
            title: "Welcome to Rhinon",
            content: "<p>This guide will help you get started with the platform.</p>",
        },
        {
            folder_id: folderIds[0],
            title: "Setting up your account",
            content: "<p>Learn how to configure your account settings.</p>",
        },
        {
            folder_id: folderIds[1],
            title: "How do I reset my password?",
            content: "<p>Follow these steps to reset your password...</p>",
        },
        {
            folder_id: folderIds[1],
            title: "What are the pricing plans?",
            content: "<p>We offer several plans to fit your needs...</p>",
        },
        {
            folder_id: folderIds[2],
            title: "API Authentication",
            content: "<p>Learn how to authenticate API requests...</p>",
        },
        {
            folder_id: folderIds[2],
            title: "Rate Limits",
            content: "<p>Understand API rate limits and best practices...</p>",
        },
    ];

    const articleIds = [];
    for (const articleData of articlesData) {
        const article = await articles.create(
            {
                organization_id: organizationId,
                ...articleData,
            },
            { transaction }
        );
        await registerSeedData("articles", article.id, organizationId, transaction);
        articleIds.push(article.id);
    }

    return {
        folders: { count: folderIds.length },
        articles: { count: articleIds.length },
    };
}

/**
 * Create seed tasks
 */
async function createSeedTasks(organizationId, userId, transaction) {
    const tasksData = [
        {
            title: "Review Q1 metrics",
            description: "Analyze the quarterly performance data",
            status: "todo",
            priority: "high",
        },
        {
            title: "Update documentation",
            description: "Add new API endpoints to docs",
            status: "in-progress",
            priority: "medium",
        },
        {
            title: "Test new feature",
            description: "QA testing for the latest release",
            status: "todo",
            priority: "high",
        },
        {
            title: "Client meeting prep",
            description: "Prepare slides for tomorrow's meeting",
            status: "in-progress",
            priority: "urgent",
        },
        {
            title: "Code review",
            description: "Review PRs from the team",
            status: "done",
            priority: "medium",
        },
        {
            title: "Deploy to staging",
            description: "Push latest changes to staging environment",
            status: "todo",
            priority: "low",
        },
    ];

    const createdIds = [];
    for (let i = 0; i < tasksData.length; i++) {
        const taskData = tasksData[i];
        const task_id = `TSK-${Date.now()}-${i}`;
        const task = await tasks.create(
            {
                organization_id: organizationId,
                task_id: task_id,
                assignee_id: userId,
                reporter_id: userId,
                ...taskData,
            },
            { transaction }
        );
        await registerSeedData("tasks", task.id, organizationId, transaction);
        createdIds.push(task.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed team chat (channels and messages)
 */
async function createSeedTeamChat(organizationId, userId, transaction) {
    console.log('🔍 createSeedTeamChat - userId:', userId, 'organizationId:', organizationId);

    const channels = [
        { name: "general", description: "General team discussion", is_private: false },
        { name: "support", description: "Customer support coordination", is_private: false },
    ];

    const channelIds = [];
    for (const channelData of channels) {
        console.log('🔍 Creating channel with userId:', userId);
        const channel = await teams_channels.create(
            {
                organization_id: organizationId,
                name: channelData.name,
                description: channelData.description,
                is_private: channelData.is_private || false,
                created_by: userId,
            },
            { transaction }
        );
        await registerSeedData("teams_channels", channel.id, organizationId, transaction);
        channelIds.push(channel.id);

        // Add creator as a member
        const member = await teams_members.create(
            {
                organization_id: organizationId,
                channel_id: channel.id,
                user_id: userId,
                role: "admin",
            },
            { transaction }
        );
        await registerSeedData("teams_members", member.id, organizationId, transaction);

        // Create some messages in each channel
        const messages = [
            { content: "Welcome to the channel!", scope_type: "channel" },
            { content: "Let's collaborate here!", scope_type: "channel" },
        ];

        for (const msgData of messages) {
            const message = await teams_messages.create(
                {
                    organization_id: organizationId,
                    scope_id: channel.id,
                    sender_id: userId,
                    ...msgData,
                },
                { transaction }
            );
            await registerSeedData("teams_messages", message.id, organizationId, transaction);
        }
    }

    return { channels: { count: channelIds.length } };
}

/**
 * Create seed automations
 */
async function createSeedAutomations(organizationId, transaction) {
    const automationsData = [
        {
            name: "Auto-assign new tickets",
            description: "Automatically assign incoming tickets to available agents",
            is_active: true,
            trigger_type: "ticket_created",
            conditions: JSON.stringify({ priority: "high" }),
            actions: JSON.stringify({ assign_to: "next_available" }),
        },
        {
            name: "Send welcome email",
            description: "Send welcome email to new customers",
            is_active: true,
            trigger_type: "customer_created",
            conditions: JSON.stringify({}),
            actions: JSON.stringify({ send_email: "welcome_template" }),
        },
    ];

    const createdIds = [];
    for (const autoData of automationsData) {
        const automation = await automations.create(
            {
                organization_id: organizationId,
                ...autoData,
            },
            { transaction }
        );
        await registerSeedData("automations", automation.id, organizationId, transaction);
        createdIds.push(automation.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed WhatsApp data (accounts and contacts)
 */
async function createSeedWhatsApp(organizationId, transaction) {
    const account = await whatsapp_accounts.create(
        {
            organization_id: organizationId,
            phone_number_id: "SEED_PHONE_001",
            waba_id: "SEED_WABA_001",
            display_phone_number: "+11234567890",
            access_token: `seed_access_token_${Date.now()}`,
            status: "active",
            is_default: true,
        },
        { transaction }
    );
    await registerSeedData("whatsapp_accounts", account.id, organizationId, transaction);

    const contacts = [
        { name: "John Doe", phone_number: "+1111111111" },
        { name: "Jane Smith", phone_number: "+2222222222" },
    ];

    const contactIds = [];
    for (const contactData of contacts) {
        const contact = await whatsapp_contacts.create(
            {
                organization_id: organizationId,
                account_id: account.id,
                ...contactData,
            },
            { transaction }
        );
        await registerSeedData("whatsapp_contacts", contact.id, organizationId, transaction);
        contactIds.push(contact.id);
    }

    return { account: 1, contacts: contactIds.length };
}

/**
 * Create seed activities
 */
async function createSeedActivities(organizationId, userId, transaction) {
    const activitiesData = [
        {
            action: "ticket_created",
            message: "Created a new support ticket",
            metadata: { ticket_id: "seed_ticket" },
        },
        {
            action: "customer_updated",
            message: "Updated customer information",
            metadata: { customer_id: "seed_customer" },
        },
        {
            action: "task_completed",
            message: "Completed a task",
            metadata: { task_id: "seed_task" },
        },
    ];

    const createdIds = [];
    for (const activityData of activitiesData) {
        const activity = await activities.create(
            {
                organization_id: organizationId,
                user_id: userId,
                ...activityData,
            },
            { transaction }
        );
        await registerSeedData("activities", activity.id, organizationId, transaction);
        createdIds.push(activity.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed notifications
 */
async function createSeedNotifications(organizationId, userId, transaction) {
    const notificationsData = [
        {
            title: "New ticket assigned",
            message: "You have been assigned a new support ticket",
            type: "info",
            is_read: false,
        },
        {
            title: "Task deadline approaching",
            message: "Your task is due tomorrow",
            type: "warning",
            is_read: false,
        },
    ];

    const createdIds = [];
    for (const notifData of notificationsData) {
        const notification = await notifications.create(
            {
                organization_id: organizationId,
                user_id: userId,
                ...notifData,
            },
            { transaction }
        );
        await registerSeedData("notifications", notification.id, organizationId, transaction);
        createdIds.push(notification.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed chatbot campaigns
 */
async function createSeedChatbotCampaigns(organizationId, transaction) {
    // Get any valid chatbot for this organization
    const existingBot = await chatbots.findOne({
        where: { organization_id: organizationId },
        transaction
    });

    if (!existingBot) {
        return { count: 0, ids: [] };
    }

    const chatbot_id = existingBot.chatbot_id;

    const campaigns = [
        {
            name: "Welcome Message",
            type: "recurring",
            status: "active",
            content: {
                template: "welcome",
                heading: "Welcome! How can we help you today?",
                buttons: ["Get Started", "Learn More"],
            },
            targeting: {
                visitor_type: "new",
                triggers: ["page_load"],
            },
        },
        {
            name: "Promo Campaign",
            type: "one-time",
            status: "draft",
            content: {
                template: "promo",
                heading: "Special Offer: 20% Off!",
                buttons: ["Claim Offer", "Maybe Later"],
            },
            targeting: {
                visitor_type: "returning",
                triggers: ["exit_intent"],
            },
        },
    ];

    const createdIds = [];
    for (const campaignData of campaigns) {
        const campaign = await chatbot_campaigns.create(
            {
                organization_id: organizationId,
                chatbot_id: chatbot_id,
                ...campaignData,
            },
            { transaction }
        );
        await registerSeedData("chatbot_campaigns", campaign.id, organizationId, transaction);
        createdIds.push(campaign.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed live visitors
 */
async function createSeedLiveVisitors(organizationId, transaction) {
    // Get any valid chatbot for this organization
    const existingBot = await chatbots.findOne({
        where: { organization_id: organizationId },
        transaction
    });

    // Use found ID or fallback
    const chatbot_id = existingBot ? existingBot.chatbot_id : "seed_bot_1";

    const visitors = [
        {
            visitor_id: `visitor_seed_${Date.now()}_001`,
            visitor_email: "visitor1@example.com",
            room: `room_seed_${Date.now()}_001`,
            socket_id: "socket_seed_001",
            chatbot_id: chatbot_id,
            ip_address: "192.168.1.100",
            city: "San Francisco",
            region: "California",
            country: "United States",
            latitude: 37.7749,
            longitude: -122.4194,
            is_online: true,
        },
        {
            visitor_id: `visitor_seed_${Date.now()}_002`,
            visitor_email: "visitor2@example.com",
            room: `room_seed_${Date.now()}_002`,
            socket_id: "socket_seed_002",
            chatbot_id: chatbot_id,
            ip_address: "192.168.1.101",
            city: "New York",
            region: "New York",
            country: "United States",
            latitude: 40.7128,
            longitude: -74.006,
            is_online: false,
        },
        {
            chatbot_id: "seed_bot_2",
            visitor_id: `visitor_seed_${Date.now()}_003`,
            visitor_email: null,
            room: `room_seed_${Date.now()}_003`,
            socket_id: "socket_seed_003",
            ip_address: "192.168.1.102",
            city: "London",
            region: "England",
            country: "United Kingdom",
            latitude: 51.5074,
            longitude: -0.1278,
            is_online: true,
        },
    ];

    const createdIds = [];
    for (const visitorData of visitors) {
        const visitor = await live_visitors.create(visitorData, { transaction });
        // Note: live_visitors doesn't have organization_id, but we MUST register it with org ID to allow deletion
        await registerSeedData("live_visitors", visitor.id, organizationId, transaction);
        createdIds.push(visitor.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed support conversations
 */
async function createSeedSupportConversations(organizationId, userId, transaction) {
    // Get any valid chatbot for this organization
    const existingBot = await chatbots.findOne({
        where: { organization_id: organizationId },
        transaction
    });

    // Use found ID or fallback
    const chatbot_id = existingBot ? existingBot.chatbot_id : "seed_bot_1";

    const conversations = [
        {
            user_id: "visitor_seed_001",
            user_email: "visitor1@example.com",
            chatbot_id: chatbot_id,
            chatbot_history: "User asked about pricing plans",
            assigned_user_id: userId,
            messages: [
                { sender: "visitor", text: "Hi, I need help with pricing", timestamp: Date.now() },
                { sender: "agent", text: "I'd be happy to help! What plan are you interested in?", timestamp: Date.now() + 1000 },
            ],
            is_closed: false,
            is_new: true,
            is_pinned: false,
        },
        {
            user_id: `visitor_seed_${Date.now()}_002`,
            user_email: "visitor2@example.com",
            chatbot_id: chatbot_id,
            chatbot_history: "User reported a bug",
            assigned_user_id: userId,
            messages: [
                { sender: "visitor", text: "I found a bug in the dashboard", timestamp: Date.now() },
                { sender: "agent", text: "Thanks for reporting! Can you describe the issue?", timestamp: Date.now() + 1000 },
                { sender: "visitor", text: "The charts are not loading properly", timestamp: Date.now() + 2000 },
            ],
            is_closed: true,
            is_new: false,
            is_pinned: true,
        },
        {
            user_id: `visitor_seed_${Date.now()}_003`,
            user_email: "visitor3@example.com",
            chatbot_id: chatbot_id,
            chatbot_history: "Feature request discussion",
            assigned_user_id: null,
            messages: [
                { sender: "visitor", text: "Do you support dark mode?", timestamp: Date.now() - 5000 },
                { sender: "agent", text: "Not yet, but it's on our roadmap!", timestamp: Date.now() - 4000 },
                { sender: "visitor", text: "Great, looking forward to it.", timestamp: Date.now() - 3000 },
            ],
            is_closed: false,
            is_new: true, // Unread by agent
            is_pinned: false,
        },
        {
            user_id: `visitor_seed_${Date.now()}_004`,
            user_email: "visitor4@example.com",
            chatbot_id: chatbot_id,
            chatbot_history: "Billing inquiry conversation",
            assigned_user_id: userId,
            messages: [
                { sender: "visitor", text: "I was charged twice.", timestamp: Date.now() - 10000 },
                { sender: "agent", text: "Let me check that for you.", timestamp: Date.now() - 9000 },
            ],
            is_closed: false,
            is_new: false,
            is_pinned: true, // Important
        },
        {
            user_id: `visitor_seed_${Date.now()}_005`,
            user_email: "visitor5@example.com",
            chatbot_id: chatbot_id,
            chatbot_history: "Integration help",
            assigned_user_id: null,
            messages: [
                { sender: "visitor", text: "How do I use the API?", timestamp: Date.now() - 20000 },
            ],
            is_closed: false,
            is_new: true,
            is_pinned: false,
        },
    ];

    const createdIds = [];
    for (const convData of conversations) {
        const conversation = await support_conversations.create(convData, { transaction });
        // support_conversations doesn't have organization_id, so we'll use a dummy org ID for registry
        await registerSeedData("support_conversations", conversation.id, organizationId, transaction);
        createdIds.push(conversation.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed emails
 */
async function createSeedEmails(organizationId, transaction) {
    const emailsData = [
        {
            email_thread_id: "thread_seed_001",
            email: "customer1@example.com",
            in_reply_to: null,
            organization_id: organizationId,
            ticket_id: null,
            subject: "Question about your service",
            conversations: JSON.stringify([
                {
                    from: "customer1@example.com",
                    to: "support@rhinon.tech",
                    subject: "Question about your service",
                    body: "Hi, I have some questions about your platform.",
                    timestamp: Date.now(),
                },
            ]),
            is_new: true,
            processed: false,
        },
        {
            email_thread_id: "thread_seed_002",
            email: "customer2@example.com",
            in_reply_to: "thread_seed_001",
            organization_id: organizationId,
            ticket_id: null,
            subject: "Re: Follow up",
            conversations: JSON.stringify([
                {
                    from: "customer2@example.com",
                    to: "support@rhinon.tech",
                    subject: "Follow up",
                    body: "Thank you for your help earlier!",
                    timestamp: Date.now(),
                },
                {
                    from: "support@rhinon.tech",
                    to: "customer2@example.com",
                    subject: "Re: Follow up",
                    body: "You're welcome! Let us know if you need anything else.",
                    timestamp: Date.now() + 10000,
                },
            ]),
            is_new: false,
            processed: true,
        },
    ];

    const createdIds = [];
    for (const emailData of emailsData) {
        const email = await emails.create(emailData, { transaction });
        await registerSeedData("emails", email.id, organizationId, transaction);
        createdIds.push(email.id);
    }

    return { count: createdIds.length, ids: createdIds };
}

/**
 * Create seed SEO data (pageviews, sessions, engagement, compliance)
 */
async function createSeedSEO(organizationId, transaction) {
    const baseTimestamp = Date.now();
    // Get any valid chatbot for this organization
    const existingBot = await chatbots.findOne({
        where: { organization_id: organizationId },
        transaction
    });

    // Use found ID or fallback
    const chatbotId = existingBot ? existingBot.chatbot_id : "seed_bot_1";

    // Create pageviews
    const pageviews = [];
    for (let i = 0; i < 10; i++) {
        pageviews.push({
            chatbot_id: chatbotId,
            sessionId: `session_seed_${i % 3}`,
            userId: `user_seed_${i % 5}`,
            url: `/page-${i % 4}`,
            referrer: i % 2 === 0 ? "https://google.com" : "https://facebook.com",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            timestamp: baseTimestamp - (i * 3600000), // 1 hour apart
            utm_source: i % 2 === 0 ? "google" : "facebook",
            utm_medium: "cpc",
            utm_campaign: "seed_campaign",
        });
    }

    const pageviewIds = [];
    for (const pvData of pageviews) {
        const pageview = await seo_page_views.create(pvData, { transaction });
        await registerSeedData("seo_page_views", pageview.id, organizationId, transaction);
        pageviewIds.push(pageview.id);
    }

    // Create sessions
    const sessions = [
        {
            chatbot_id: chatbotId,
            sessionId: "session_seed_0",
            userId: "user_seed_0",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            screenSize: "1920x1080",
            language: "en-US",
            isReturning: false,
            country: "United States",
            timestamp: baseTimestamp,
        },
        {
            chatbot_id: chatbotId,
            sessionId: "session_seed_1",
            userId: "user_seed_1",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
            screenSize: "390x844",
            language: "es-ES",
            isReturning: true,
            country: "Spain",
            timestamp: baseTimestamp - 3600000,
        },
        {
            chatbot_id: chatbotId,
            sessionId: "session_seed_2",
            userId: "user_seed_2",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            screenSize: "1366x768",
            language: "en-GB",
            isReturning: false,
            country: "United Kingdom",
            timestamp: baseTimestamp - 7200000,
        },
    ];

    const sessionIds = [];
    for (const sessionData of sessions) {
        const session = await seo_sessions.create(sessionData, { transaction });
        await registerSeedData("seo_sessions", session.id, organizationId, transaction);
        sessionIds.push(session.id);
    }

    // Create engagement data
    const engagements = [
        {
            chatbot_id: chatbotId,
            type: "click",
            url: "/page-0",
            metadata: { elementId: "cta_button", text: "Sign Up" },
            sessionId: "session_seed_0",
            timestamp: baseTimestamp,
        },
        {
            chatbot_id: chatbotId,
            type: "scroll",
            url: "/page-1",
            metadata: { elementId: "main_content", depth: 80 },
            sessionId: "session_seed_1",
            timestamp: baseTimestamp - 3600000,
        },
        {
            chatbot_id: chatbotId,
            type: "form_submit",
            url: "/contact",
            metadata: { elementId: "contact_form", formId: "contact-1" },
            sessionId: "session_seed_2",
            timestamp: baseTimestamp - 7200000,
        },
    ];

    const engagementIds = [];
    for (const engageData of engagements) {
        const engagement = await seo_engagements.create(engageData, { transaction });
        await registerSeedData("seo_engagements", engagement.id, organizationId, transaction);
        engagementIds.push(engagement.id);
    }

    // Create compliance data
    const compliances = [
        {
            chatbot_id: chatbotId,
            baseUrl: "https://example.com/page-0",
            seoScore: "85",
            passedChecks: 17,
            totalChecks: 20,
            categories: [
                {
                    category: "Performance",
                    checks: [
                        { title: "First Contentful Paint", status: "Good", fix: null },
                        { title: "Speed Index", status: "Needs Fix", fix: "Optimize images" }
                    ]
                },
                {
                    category: "Accessibility",
                    checks: [
                        { title: "ARIA Attributes", status: "Good", fix: null },
                        { title: "Color Contrast", status: "Good", fix: null }
                    ]
                },
                {
                    category: "Best Practices",
                    checks: [
                        { title: "HTTPS Usage", status: "Good", fix: null }
                    ]
                },
                {
                    category: "SEO",
                    checks: [
                        { title: "Meta Description", status: "Good", fix: null },
                        { title: "Alt Text", status: "Good", fix: null }
                    ]
                }
            ],
            actionItems: [
                { id: "alt-text", label: "Images are missing alt text", fix: "Add alt tags", priority: "High" },
                { id: "meta-desc", label: "Missing meta description", fix: "Add meta description", priority: "Medium" }
            ],
            timestamp: baseTimestamp,
        },
        // Second entry omitted/simplified for brevity if needed, but I'll keep one good entry
    ];

    const complianceIds = [];
    for (const compData of compliances) {
        const compliance = await seo_compliances.create(compData, { transaction });
        await registerSeedData("seo_compliances", compliance.id, organizationId, transaction);
        complianceIds.push(compliance.id);
    }

    // Create performance data
    const performance = await seo_performances.create({
        chatbot_id: chatbotId,
        baseUrl: "https://example.com",
        overallScore: { performance: 90, accessibility: 95, bestPractices: 85, seo: 92 },
        metrics: { fcp: "0.8s", lcp: "1.2s", cls: "0.05", tbt: "120ms" },
        accessibility: { score: 95, issues: [] },
        bestPractices: { score: 85, issues: [] },
        seo: { score: 92, issues: [] },
        opportunities: [{ title: "Eliminate render-blocking resources", savings: "1.2s" }],
        diagnostics: [{ title: "Minimize main-thread work", value: "0.5s" }],
        recommendations: [{ title: "Use HTTP/2", priority: "High" }],
    }, { transaction });
    await registerSeedData("seo_performances", performance.id, organizationId, transaction);

    return {
        pageviews: pageviewIds.length,
        sessions: sessionIds.length,
        engagement: engagementIds.length,
        compliance: complianceIds.length,
        performance: 1,
    };
}

/**
 * Create seed CRM data (companies, deals, peoples, pipelines)
 */
async function createSeedCRM(organizationId, userId, transaction) {
    // Create companies
    const companyData = [
        {
            name: "Acme Corporation",
            domain: "acmecorp.com",
            website: "https://acmecorp.com",
            industry: "Technology",
            size: "100-500",
            location: "San Francisco, CA",
        },
        {
            name: "TechStart Inc",
            domain: "techstart.io",
            website: "https://techstart.io",
            industry: "Software",
            size: "10-50",
            location: "Austin, TX",
        },
        {
            name: "Global Enterprises",
            domain: "globalent.com",
            website: "https://globalent.com",
            industry: "Consulting",
            size: "500+",
            location: "New York, NY",
        },
    ];

    const companyIds = [];
    for (const data of companyData) {
        const company = await companies.create(
            {
                organization_id: organizationId,
                created_by: userId,
                ...data,
            },
            { transaction }
        );
        await registerSeedData("companies", company.id, organizationId, transaction);
        companyIds.push(company.id);
    }

    // Create peoples (contacts)
    const peopleData = [
        {
            name: "John Smith",
            email: "john.smith@acmecorp.com",
            company_id: companyIds[0],
            position: "CEO",
            phone: "+1-555-0100",
        },
        {
            name: "Sarah Johnson",
            email: "sarah.j@techstart.io",
            company_id: companyIds[1],
            position: "CTO",
            phone: "+1-555-0101",
        },
        {
            name: "Michael Brown",
            email: "m.brown@globalent.com",
            company_id: companyIds[2],
            position: "VP of Sales",
            phone: "+1-555-0102",
        },
        {
            name: "Emily Davis",
            email: "emily.d@acmecorp.com",
            company_id: companyIds[0],
            position: "Product Manager",
            phone: "+1-555-0103",
        },
    ];

    const peopleIds = [];
    for (const data of peopleData) {
        const person = await peoples.create(
            {
                organization_id: organizationId,
                created_by: userId,
                ...data,
            },
            { transaction }
        );
        await registerSeedData("peoples", person.id, organizationId, transaction);
        peopleIds.push(person.id);
    }

    // Create Group
    const group = await groups.create({
        organization_id: organizationId,
        created_by: userId,
        group_name: "Sales",
        manage_type: "deal",
    }, { transaction });
    await registerSeedData("groups", group.id, organizationId, transaction);

    // Create View
    const view = await views.create({
        organization_id: organizationId,
        created_by: userId,
        group_id: group.id,
        view_name: "All Deals",
        view_manage_type: "deal",
        view_type: "pipeline", // changed from 'list'
    }, { transaction });
    await registerSeedData("views", view.id, organizationId, transaction);

    // Create pipeline
    const pipeline = await pipelines.create(
        {
            organization_id: organizationId,
            view_id: view.id,
            name: "Sales Pipeline",
            pipeline_manage_type: "deal",
            stages: [
                { id: 1, name: "Lead", color: "#EFF6FF", order: 0, entities: [] },
                { id: 2, name: "Qualified", color: "#F5F3FF", order: 1, entities: [] },
                { id: 3, name: "Proposal", color: "#ECFDF5", order: 2, entities: [] },
                { id: 4, name: "Negotiation", color: "#FEFCE8", order: 3, entities: [] },
                { id: 5, name: "Closed Won", color: "#ECFDF5", order: 4, entities: [] },
            ],
            created_by: userId,
        },
        { transaction }
    );
    await registerSeedData("pipelines", pipeline.id, organizationId, transaction);

    // Create deals
    const dealsData = [
        {
            title: "Enterprise Software License - Acme Corp",
            company_id: companyIds[0],
            contact_id: peopleIds[0],
            status: "Proposal",
            custom_fields: {
                dealValue: { type: "number", value: 50000, isVisible: true },
                priority: { type: "select", value: "High", isVisible: true },
                probability: { type: "number", value: 75, isVisible: true },
                currency: { type: "text", value: "USD", isVisible: true },
            },
        },
        {
            title: "Cloud Migration Services - TechStart",
            company_id: companyIds[1],
            contact_id: peopleIds[1],
            status: "Qualified",
            custom_fields: {
                dealValue: { type: "number", value: 25000, isVisible: true },
                priority: { type: "select", value: "Medium", isVisible: true },
                probability: { type: "number", value: 50, isVisible: true },
                currency: { type: "text", value: "USD", isVisible: true },
            },
        },
        {
            title: "Consulting Package - Global Enterprises",
            company_id: companyIds[2],
            contact_id: peopleIds[2],
            status: "Negotiation",
            custom_fields: {
                dealValue: { type: "number", value: 100000, isVisible: true },
                priority: { type: "select", value: "Critical", isVisible: true },
                probability: { type: "number", value: 90, isVisible: true },
                currency: { type: "text", value: "USD", isVisible: true },
            },
        },
        {
            title: "Product Training - Acme Corp",
            company_id: companyIds[0],
            contact_id: peopleIds[3],
            status: "Lead",
            custom_fields: {
                dealValue: { type: "number", value: 5000, isVisible: true },
                priority: { type: "select", value: "Low", isVisible: true },
                probability: { type: "number", value: 30, isVisible: true },
                currency: { type: "text", value: "USD", isVisible: true },
            },
        },
    ];

    const dealIds = [];
    for (const data of dealsData) {
        const deal = await deals.create(
            {
                organization_id: organizationId,
                created_by: userId,
                ...data,
            },
            { transaction }
        );
        await registerSeedData("deals", deal.id, organizationId, transaction);
        dealIds.push(deal.id);
    }

    // Create pipeline stage history for each deal
    const stageMap = { "Lead": 1, "Qualified": 2, "Proposal": 3, "Negotiation": 4, "Closed Won": 5 };

    for (let i = 0; i < dealIds.length; i++) {
        const dealId = dealIds[i];
        const status = dealsData[i].status;
        const stageId = stageMap[status];

        if (stageId) {
            const history = await pipeline_stage_histories.create({
                pipeline_id: pipeline.id,
                entity_id: dealId,
                entity_type: "deal",
                from_stage_id: null,
                to_stage_id: stageId,
                moved_by: userId,
                moved_at: new Date(),
                duration_in_stage: 0
            }, { transaction });
            await registerSeedData("pipeline_stage_histories", history.id, organizationId, transaction);
        }
    }

    return {
        pipelines: 1,
        companies: companyIds.length,
        peoples: peopleIds.length,
        deals: dealIds.length,
    };
}
