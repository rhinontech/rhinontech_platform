const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || "production";

const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// User.belongsTo(db.organizations, { foreignKey: "organization_id" });
// User.hasOne(db.users_profiles, { foreignKey: "user_id" });
// Organization.hasMany(db.users, { foreignKey: "organization_id" });
// UserProfile.belongsTo(db.users, { foreignKey: "user_id" });
// UserProfile.belongsTo(db.users, {
//   as: "AssignedByUser",
//   foreignKey: "assigned_by",
// });

// --- DEFINE ASSOCIATIONS HERE ---

// Users and Organizations association (one-to-many)
db.users.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.users, { foreignKey: "organization_id" });

// Users and User_Profiles association (one-to-one)
db.users_profiles.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasOne(db.users_profiles, { foreignKey: "user_id" });

// Users and User_Accounts association (one-to-many)
db.users_accounts.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.users_accounts, { foreignKey: "user_id" });

// users_roles belongs to user
db.users_roles.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasOne(db.users_roles, { foreignKey: "user_id" });

// (Optional) If roles table exists with JSONB access field
db.roles.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.roles, { foreignKey: "organization_id" });

// forms belongs to Organizations
db.forms.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasOne(db.forms, {
  foreignKey: "organization_id",
});

// customers belongs to Organizations
db.customers.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.customers, { foreignKey: "organization_id" });

// tickets belongs to Organizations
db.tickets.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.tickets, { foreignKey: "organization_id" });

// tickets belongs to customers
db.tickets.belongsTo(db.customers, { foreignKey: "customer_id" });
db.customers.hasMany(db.tickets, { foreignKey: "customer_id" });

// tickets belongs to users (assigned agent)
db.tickets.belongsTo(db.users, { foreignKey: "assigned_user_id" });
db.users.hasMany(db.tickets, { foreignKey: "assigned_user_id" });

// tickets belongs to users (assigned agent)
// db.tickets.belongsTo(db.users, { foreignKey: "assigned_user_id", as: "assigned_user" });
// db.users.hasMany(db.tickets, { foreignKey: "assigned_user_id", as: "assigned_tickets" });

//automations belongs to organizations
db.automations.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.automations, { foreignKey: "organization_id" });

//subscriptions belongs to organizations
db.subscriptions.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.subscriptions, { foreignKey: "organization_id" });

//subscriptions belongs to organizations
db.transactions.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.transactions, { foreignKey: "organization_id" });

// Chatbot belongs to Organization
db.chatbots.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.chatbots, { foreignKey: "organization_id" });

// ChatbotCampaign belongs to Organization
db.chatbot_campaigns.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.chatbot_campaigns, { foreignKey: "organization_id" });

db.knowledge_bases.belongsTo(db.organizations, {
  foreignKey: "organization_id",
});
db.organizations.hasOne(db.knowledge_bases, { foreignKey: "organization_id" });

// Activity belongs to Organization
db.activities.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.activities, { foreignKey: "organization_id" });

// Activity belongs to User
db.activities.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.activities, { foreignKey: "user_id" });

// Onboarding belongs to Organization
db.onboardings.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasOne(db.onboardings, { foreignKey: "organization_id" });

// --- Knowledge Base Models ---

// folders belong to organizations
db.folders.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.folders, { foreignKey: "organization_id" });

// folders can have parent folders
db.folders.belongsTo(db.folders, {
  foreignKey: "parent_id",
  as: "parent_folder",
});
db.folders.hasMany(db.folders, {
  foreignKey: "parent_id",
  as: "sub_folders",
});

// articles belong to folders
db.articles.belongsTo(db.folders, { foreignKey: "folder_id" });
db.folders.hasMany(db.articles, { foreignKey: "folder_id" });

// articles belong to organizations
db.articles.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.articles, { foreignKey: "organization_id" });

// email to organization
db.emails.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.emails, { foreignKey: "organization_id" });

db.emails.belongsTo(db.tickets, { foreignKey: "ticket_id" });

// Tasks belongs to Organizations
db.tasks.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.tasks, { foreignKey: "organization_id" });

// Tasks belongs to Users (Assignee)
db.tasks.belongsTo(db.users, { as: "assignee", foreignKey: "assignee_id" });
db.users.hasMany(db.tasks, { foreignKey: "assignee_id" });

// Tasks belongs to Users (Reporter)
db.tasks.belongsTo(db.users, { as: "reporter", foreignKey: "reporter_id" });
db.users.hasMany(db.tasks, { foreignKey: "reporter_id" });

// Tasks self-referencing (Parent-Child relationship for subtasks)
db.tasks.belongsTo(db.tasks, { as: "parentTask", foreignKey: "parent_task_id" });
db.tasks.hasMany(db.tasks, { as: "subtasks", foreignKey: "parent_task_id" });

// --- TeamChat Associations ---

// TeamsChannel belongs to Organization
db.teams_channels.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.teams_channels, { foreignKey: "organization_id" });

// TeamsChannel created by User
db.teams_channels.belongsTo(db.users, { as: "creator", foreignKey: "created_by" });
db.users.hasMany(db.teams_channels, { foreignKey: "created_by" });

// TeamsChannel has many Members
db.teams_channels.hasMany(db.teams_members, { foreignKey: "channel_id" });
db.teams_members.belongsTo(db.teams_channels, { foreignKey: "channel_id" });

// TeamsChannel has many Messages
db.teams_channels.hasMany(db.teams_messages, { foreignKey: "scope_id", constraints: false });

// TeamsMember belongs to User
db.teams_members.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.teams_members, { foreignKey: "user_id" });

// TeamsMember belongs to Organization
db.teams_members.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.teams_members, { foreignKey: "organization_id" });

// TeamsMessage belongs to Organization
db.teams_messages.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.teams_messages, { foreignKey: "organization_id" });

// TeamsMessage sent by User
db.teams_messages.belongsTo(db.users, { as: "sender", foreignKey: "sender_id" });
db.users.hasMany(db.teams_messages, { foreignKey: "sender_id" });

// --- WhatsApp Associations ---

// WhatsAppAccount belongs to Organization
db.whatsapp_accounts.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.whatsapp_accounts, { foreignKey: "organization_id" });

// WhatsAppAccount belongs to User (optional)
db.whatsapp_accounts.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.whatsapp_accounts, { foreignKey: "user_id" });

// WhatsAppMessage belongs to WhatsAppAccount
db.whatsapp_messages.belongsTo(db.whatsapp_accounts, { foreignKey: "account_id" });
db.whatsapp_accounts.hasMany(db.whatsapp_messages, { foreignKey: "account_id" });

// WhatsAppMessage belongs to Organization
db.whatsapp_messages.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.whatsapp_messages, { foreignKey: "organization_id" });

// WhatsAppContact belongs to WhatsAppAccount
db.whatsapp_contacts.belongsTo(db.whatsapp_accounts, { foreignKey: "account_id" });
db.whatsapp_accounts.hasMany(db.whatsapp_contacts, { foreignKey: "account_id" });

// WhatsAppContact belongs to Organization
db.whatsapp_contacts.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.whatsapp_contacts, { foreignKey: "organization_id" });

// WhatsAppWebhook belongs to WhatsAppAccount (optional)
db.whatsapp_webhooks.belongsTo(db.whatsapp_accounts, { foreignKey: "account_id" });
db.whatsapp_accounts.hasMany(db.whatsapp_webhooks, { foreignKey: "account_id" });

// WhatsAppWebhook belongs to Organization
db.whatsapp_webhooks.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.whatsapp_webhooks, { foreignKey: "organization_id" });

// --- Traffic / Live Visitors Associations ---

// LiveVisitor has one SupportConversation (based on visitor_id = user_id)
db.live_visitors.hasOne(db.support_conversations, {
  foreignKey: "user_id",
  sourceKey: "visitor_id",
  as: "support_conversation"
});
db.support_conversations.belongsTo(db.live_visitors, {
  foreignKey: "user_id",
  targetKey: "visitor_id"
});



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
