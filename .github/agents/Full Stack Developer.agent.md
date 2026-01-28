---
description: 'Full Stack Agent for Rhinon Tech Platform - Expert in backendai (FastAPI/Python AI), rhinon (Next.js), rhinonbot-sdk (Chatbot Widget), and rtserver (Node.js/Express Backend)'
tools:
  - edit
  - search
  - shell
---

# Rhinon Tech - Full Stack Agent (Comprehensive Guide)

You are an expert full-stack AI agent for the **Rhinon Tech** platform - an all-in-one customer engagement platform. You have deep knowledge of all four codebases: **backendai**, **rhinon**, **rhinonbot-sdk**, and **rtserver**.

---

## 🚀 Development Environment

The entire platform is designed to run in a containerized environment using Docker, managed by a set of simple shell scripts and a `Makefile`.

### One-Command Setup & Start

1.  **First-Time Setup**: Run `./setup.sh` to create the required `.env` files for each service from their `sampleenv.txt` templates.
2.  **Start All Services**: Execute `./start-all.sh`. This is the primary way to start the development environment.
    -   It uses `docker-compose up` to run `rtserver`, `backendai`, `postgres`, and `redis`.
    -   It runs the `rhinon` Next.js frontend on the host machine using `npm run dev` via `nohup` for background execution.
3.  **Stop All Services**: Run `./stop-all.sh`.
4.  **View Logs**:
    -   Backend services: `./view-logs.sh` (tails Docker Compose logs).
    -   Frontend service: `./view-frontend-logs.sh` (tails `rhinon/rhinon.log`).

### Service URLs (Local)
-   **Frontend**: `http://localhost:4000`
-   **Backend API**: `http://localhost:3000`
-   **AI Service**: `http://localhost:5002`
-   **PostgreSQL**: `localhost:5432`
-   **Redis**: `localhost:6380` (maps to 6379 in container)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RHINON TECH PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────┐              ┌─────────────────────────────────┐      │
│   │   RHINON (Next.js)  │              │   RHINONBOT-SDK (Widget)        │      │
│   │   Port: 4000        │              │   @rhinon/botsdk (npm)          │      │
│   │                     │              │   Embedded on customer sites    │      │
│   │   Admin Dashboard   │              │                                 │      │
│   │   • CRM, Tickets    │              │   • Chat Messenger UI           │      │
│   │   • Chatbot Config  │              │   • Pre/Post Chat Forms         │      │
│   │   • SEO Analytics   │              │   • Voice Input                 │      │
│   │   • LinkedIn AI     │              │   • Help/KB Screen              │      │
│   │   • Knowledge Base  │              │   • Campaigns Display           │      │
│   │   • Team Chat       │              │   • Ticket Submission           │      │
│   └─────────┬───────────┘              └─────────────┬───────────────────┘      │
│             │                                        │                          │
│             │ REST + Socket.io                       │ REST + Socket.io         │
│             ▼                                        ▼                          │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                         API LAYER                                    │      │
│   │                                                                      │      │
│   │   ┌─────────────────────┐      ┌─────────────────────────────────┐  │      │
│   │   │ RTSERVER (Express)  │      │ BACKENDAI (FastAPI/Python)      │  │      │
│   │   │ Port: 3000          │      │ Port: 5002                      │  │      │
│   │   │                     │      │                                 │  │      │
│   │   │ • Auth (JWT)        │      │ • AI Chatbot (OpenAI/Gemini)    │  │      │
│   │   │ • User Management   │      │ • AI Co-pilot                   │  │      │
│   │   │ • Tickets/CRM       │      │ • LinkedIn AI (7 features)      │  │      │
│   │   │ • Chatbot Config    │      │ • Image Gen (DALL-E 3)          │  │      │
│   │   │ • WhatsApp/Email    │      │ • Voice Processing              │  │      │
│   │   │ • SEO Analytics     │      │ • Streaming Responses           │  │      │
│   │   │ • Socket.io Server  │      │                                 │  │      │
│   │   └─────────┬───────────┘      └──────────────┬──────────────────┘  │      │
│   └─────────────┼──────────────────────────────────┼────────────────────┘      │
│                 │                                  │                            │
│                 ▼                                  ▼                            │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                      DATA LAYER                                      │      │
│   │                                                                      │      │
│   │   ┌───────────────────────────────────────────────────────────────┐ │      │
│   │   │           PostgreSQL (AWS RDS) - PRIMARY DATABASE             │ │      │
│   │   │                                                               │ │      │
│   │   │   rt-database (Main)          │   rt-crm-beta (CRM)           │ │      │
│   │   │   • organizations, users      │   • groups, views             │ │      │
│   │   │   • tickets, customers        │   • pipelines, peoples        │ │      │
│   │   │   • chatbots, forms           │   • companies, deals          │ │      │
│   │   │   • knowledge_bases, articles │                               │ │      │
│   │   │   • teams, whatsapp, seo      │                               │ │      │
│   │   └───────────────────────────────────────────────────────────────┘ │      │
│   │                                                                      │      │
│   │   ┌─────────────────────┐      ┌─────────────────────────────────┐  │      │
│   │   │ Redis (Planned)     │      │ External Services               │  │      │
│   │   │ • Caching           │      │ • AWS S3, SES                   │  │      │
│   │   │ • Sessions          │      │ • OpenAI, Gemini API            │  │      │
│   │   │ • Rate Limiting     │      │ • Razorpay, LinkedIn API        │  │      │
│   │   └─────────────────────┘      │ • WhatsApp Business API         │  │      │
│   │                                └─────────────────────────────────┘  │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### How They Connect (Data Flow)

```
VISITOR ON WEBSITE                      ADMIN ON DASHBOARD
       │                                       │
       ▼                                       ▼
┌──────────────┐                      ┌──────────────────┐
│ rhinonbot-sdk│                      │   rhinon (Next)  │
│  (Widget)    │                      │   (Dashboard)    │
└──────┬───────┘                      └────────┬─────────┘
       │                                       │
       │ 1. Fetch chatbot config               │ 1. Auth, CRUD operations
       │ 2. Send chat messages                 │ 2. Configure chatbot
       │ 3. Track visitor                      │ 3. View tickets/analytics
       │ 4. Submit tickets                     │ 4. Manage team/CRM
       ▼                                       ▼
┌──────────────────────────────────────────────────────────┐
│                      RTSERVER (Port 3000)                │
│                                                          │
│  • /api/chatbot/chatbot - Get chatbot config (public)    │
│  • /api/conversations - Chat messages                    │
│  • /api/tickets - Ticket management                      │
│  • /api/auth - Authentication                            │
│  • Socket.io - Real-time updates                         │
│                                                          │
│  PostgreSQL (Sequelize ORM)                              │
└────────────────────────┬─────────────────────────────────┘
                         │
       ┌─────────────────┴─────────────────┐
       │ AI Chat/LinkedIn/Image requests   │
       ▼                                   │
┌──────────────────────────────────────────┴───────────────┐
│                    BACKENDAI (Port 5002)                  │
│                                                          │
│  • /api/chat - Stream AI response                        │
│  • /api/linkedin-ai/* - LinkedIn automation              │
│  • /generate-image - DALL-E 3 images                     │
│  • /copilot/* - AI co-pilot                              │
│                                                          │
│  OpenAI / Gemini APIs                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 PROJECT STRUCTURES

### RTSERVER (Express.js Backend)

```
rtserver/
├── app.js                       # Express entry (Port 3000)
├── config/
│   ├── config.js                # DB configs (main + CRM)
│   └── route53Config.js         # AWS Route53 DNS
├── .sequelizerc.main            # Main DB migration config
├── .sequelizerc.crm             # CRM DB migration config
├── controllers/                 # 29 controllers
│   ├── authController.js
│   ├── ticketController.js
│   ├── conversationController.js
│   ├── chatbotController.js
│   ├── userManagementController.js
│   ├── knowledgeBaseController.js
│   ├── automationController.js
│   ├── teamChatController.js
│   ├── subscriptionController.js
│   ├── seoAnalyticsController.js
│   ├── whatsppController.js
│   ├── linkedin_campaignController.js
│   └── crmControllers/
│       ├── groupsControllers.js
│       ├── entitiesController.js
│       ├── pipelineController.js
│       └── tableController.js
├── routes/                      # 28 route files
├── models/                      # 47 Sequelize models
│   ├── index.js                 # Main DB models + associations
│   ├── users.js
│   ├── organizations.js
│   ├── tickets.js
│   ├── customers.js
│   ├── Chatbots.js
│   ├── KnowledgeBase.js
│   ├── TeamsChannel.js
│   ├── live_visitors.js
│   ├── linkedin_campaign.js
│   └── crm_models/              # CRM DB models
│       ├── crmdb.js             # CRM DB connection + associations
│       ├── Groups.js
│       ├── Veiws.js
│       ├── Pipelines.js
│       ├── Peoples.js
│       ├── Companies.js
│       ├── Deals.js
│       └── pipelineStageHistories.js
├── migrations/                  # Main DB migrations
│   ├── 20250612090526-create-organization-table.js
│   ├── 20250813065029-create-tickets-table.js
│   ├── ... (40+ migrations)
│   └── crm_migrations/          # CRM DB migrations
│       ├── 20251118141457-create-groups-table.js
│       ├── 20251119120206-create-pipelines-table.js
│       └── ... (7 migrations)
├── middleware/
│   └── verifyToken.js           # JWT auth middleware
├── utils/
│   ├── socket.js                # Socket.IO handlers
│   ├── sendEmail.js             # Email utilities
│   └── activityLogger.js        # Activity logging
└── swagger_output.json          # API documentation
```

### BACKENDAI (FastAPI/Python)

```
backendai/
├── main.py                      # FastAPI entry (Port 5002)
├── controller/
│   ├── gpt_support.py           # OpenAI chatbot
│   ├── gemini_support.py        # Gemini chatbot
│   ├── copilot_controller.py    # AI Co-pilot
│   ├── linkedin_ai_controller.py # LinkedIn AI (7 features)
│   ├── image_generation_controller.py # DALL-E 3
│   └── chatbot_config.py        # Data extraction
├── routes/
│   ├── rhinon_ai_chatbot.py     # /api/chat, /api/set_user_assistant
│   ├── gpt_support_routes.py
│   ├── copilot_routes.py        # /copilot/*
│   ├── linkedin_ai_routes.py    # /api/linkedin-ai/*
│   └── image_generation_routes.py
├── services/
│   ├── ai_provider.py           # AI provider abstraction
│   ├── openai_services.py       # OpenAI client
│   ├── gemini_services.py       # Gemini client
│   └── voice_service.py         # Voice processing
├── DB/
│   ├── postgresDB.py            # PostgreSQL (psycopg2)
│   └── mongodb.py               # MongoDB (for Gemini chats)
└── utils/
    ├── utills.py
    └── global_store.py
```

### RHINON (Next.js Frontend)

```
rhinon/
├── src/
│   ├── app/                     # App Router
│   │   ├── [role]/              # Dynamic role routes
│   │   │   ├── dashboard/
│   │   │   ├── inbox/
│   │   │   ├── tickets/
│   │   │   ├── chats/
│   │   │   ├── crm/
│   │   │   ├── seo/
│   │   │   ├── engage/
│   │   │   │   ├── chatbot/
│   │   │   │   └── campaigns/social-media/linkedin/
│   │   │   ├── knowledge-base/
│   │   │   ├── teams/
│   │   │   ├── settings/
│   │   │   └── billings/
│   │   ├── auth/
│   │   └── kb/[domain]/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── Common/
│   │   └── Pages/
│   ├── services/                # API service layers
│   │   ├── authServices.ts
│   │   ├── tickets/
│   │   ├── chatbot/
│   │   ├── crm/
│   │   ├── campaigns/
│   │   │   ├── linkedinService.ts
│   │   │   └── linkedinAIService.ts
│   │   └── teamchat/
│   ├── helpers/
│   │   ├── PrivateAxios.ts      # JWT interceptor
│   │   └── PublicAxios.ts
│   ├── store/                   # Zustand stores
│   └── types/
├── main.js                      # Electron main
└── preload.js                   # Electron preload
```

### RHINONBOT-SDK (Chatbot Widget)

```
rhinonbot-sdk/
├── src/
│   ├── index.ts                 # SDK exports
│   ├── main.tsx                 # ChatBotElement custom element
│   ├── types.ts                 # Type definitions
│   └── Messenger/
│       ├── Messenger.tsx        # Main container (788 lines)
│       ├── Messenger.scss
│       ├── HomeScreen/          # Greetings, quick actions
│       ├── ChatScreen/          # Chat conversation
│       │   ├── ChatScreen.tsx   # UI (995 lines)
│       │   └── useChatLogic.tsx # Logic (767 lines)
│       ├── ChatHistoryScreen/   # Past conversations
│       ├── HelpScreen/          # Knowledge base
│       ├── HelpArticlePage/     # Article view
│       ├── NewsScreen/          # Updates
│       ├── TicketScreen/        # Ticket submission
│       ├── Voice/               # Voice input
│       ├── Campaigns/           # Campaign display
│       └── Loader/
├── tools/
│   ├── services/
│   │   ├── chatbotConfigService.tsx
│   │   ├── formServices.tsx
│   │   ├── helpService.tsx
│   │   ├── TicketServices.tsx
│   │   └── AiRinoAssisstant/
│   │       ├── AiRhinoConvoServices.tsx
│   │       └── SocketConversationServices.tsx
│   └── utils/
│       ├── chatbotConfigStore.ts  # Zustand store
│       ├── useTracking.tsx        # Visitor tracking
│       ├── visitorTracking.ts
│       ├── campaignTargeting.ts
│       └── campaignFrequency.ts
├── dist/
│   └── rhinonbot.js             # Built bundle
└── package.json                 # @rhinon/botsdk
```

---

## 🗄️ DATABASE ARCHITECTURE

### Two PostgreSQL Databases (Same RDS Instance)

| Database | Purpose | Sequelize Config |
|----------|---------|------------------|
| **rt-database** | Main app data | `.sequelizerc.main` |
| **rt-crm-beta** | CRM module data | `.sequelizerc.crm` |

### Migration Commands

```bash
# Main database migrations
npx sequelize-cli --options-path .sequelizerc.main db:migrate

# CRM database migrations
npx sequelize-cli --options-path .sequelizerc.crm db:migrate

# Create new migration (main)
npx sequelize-cli --options-path .sequelizerc.main migration:generate --name create-new-table

# Create new migration (CRM)
npx sequelize-cli --options-path .sequelizerc.crm migration:generate --name create-crm-table
```

### Sequelize Config Files

**.sequelizerc.main** (Main DB)
```javascript
const path = require("path");

module.exports = {
  config: path.resolve("config/config.js"),
  "models-path": path.resolve("models"),
  "migrations-path": path.resolve("migrations"),
};
```

**.sequelizerc.crm** (CRM DB)
```javascript
const path = require("path");

module.exports = {
  config: path.resolve("config/config.js"),
  "models-path": path.resolve("crm_models"),
  "migrations-path": path.resolve("migrations/crm_migrations"),
  env: "crmdb",  // Uses crmdb config from config.js
};
```

**config/config.js**
```javascript
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,        // rt-database
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
  crmdb: {
    username: process.env.CRM_DB_USERNAME,
    password: process.env.CRM_DB_PASSWORD,
    database: process.env.CRM_DB_NAME,    // rt-crm-beta
    host: process.env.CRM_DB_HOST,
    port: process.env.CRM_DB_PORT,
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
```

### Model Pattern

**Migration File** (migrations/20250813065029-create-tickets-table.js)
```javascript
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tickets", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ticket_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
      },
      custom_data: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "Open",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tickets");
  },
};
```

**Model File** (models/tickets.js)
```javascript
"use strict";
module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define(
    "tickets",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ticket_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      custom_data: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Open",
      },
    },
    {
      tableName: "tickets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Ticket;
};
```

**Associations** (models/index.js)
```javascript
// Main DB models auto-loaded from /models folder
// Associations defined after loading:

// tickets belongs to organizations
db.tickets.belongsTo(db.organizations, { foreignKey: "organization_id" });
db.organizations.hasMany(db.tickets, { foreignKey: "organization_id" });

// tickets belongs to customers
db.tickets.belongsTo(db.customers, { foreignKey: "customer_id" });
db.customers.hasMany(db.tickets, { foreignKey: "customer_id" });
```

**CRM DB Connection** (models/crm_models/crmdb.js)
```javascript
const Sequelize = require("sequelize");
const config = require("../../config/config.js").crmdb;

const sequelizeCrmDB = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Load CRM models
fs.readdirSync(__dirname)
  .filter(file => file.endsWith(".js") && file !== "crmdb.js")
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelizeCrmDB, Sequelize.DataTypes);
    crmdb[model.name] = model;
  });

// CRM Associations
crmdb.views.belongsTo(crmdb.groups, { foreignKey: "group_id" });
crmdb.pipelines.belongsTo(crmdb.views, { foreignKey: "view_id" });
crmdb.peoples.belongsTo(crmdb.companies, { foreignKey: "company_id" });
crmdb.deals.belongsTo(crmdb.peoples, { foreignKey: "contact_id" });
crmdb.deals.belongsTo(crmdb.companies, { foreignKey: "company_id" });

module.exports = crmdb;
```

### Database Tables Summary

**Main Database (rt-database) - 40+ tables**
| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root entity |
| `users` | User accounts |
| `users_profiles` | User profile details |
| `users_roles` | Role assignments |
| `roles` | Role definitions (JSONB access) |
| `chatbots` | Chatbot configurations |
| `tickets` | Support tickets |
| `customers` | Customer records |
| `forms` | Custom forms (pre/post chat) |
| `automations` | Workflow rules |
| `subscriptions` | Plans & billing |
| `transactions` | Payment history |
| `knowledge_bases` | KB containers |
| `folders` | KB folders |
| `articles` | KB articles |
| `teams_channels` | Team chat channels |
| `teams_members` | Channel memberships |
| `teams_messages` | Team messages |
| `tasks` | Task items |
| `activities` | Activity logs |
| `emails` | Email records |
| `whatsapp_accounts` | WA Business accounts |
| `whatsapp_contacts` | WA contacts |
| `whatsapp_messages` | WA message history |
| `live_visitors` | Real-time tracking |
| `support_conversations` | Human support chats |
| `bot_conversations` | AI bot chats |
| `linkedin_campaigns` | LinkedIn campaigns |
| `linkedin_tokens` | LinkedIn OAuth |
| `chatbot_campaigns` | Chatbot campaigns |
| `seo_pageview` | Page analytics |
| `seo_session` | Session data |
| `seo_engagement` | Engagement metrics |
| `seo_compliance` | SEO compliance |
| `seo_performance` | Lighthouse scores |
| `onboardings` | Onboarding progress |

**CRM Database (rt-crm-beta) - 7 tables**
| Table | Purpose |
|-------|---------|
| `groups` | Contact groups |
| `views` | Saved views/filters |
| `pipelines` | Sales pipelines |
| `peoples` | Contacts/people |
| `companies` | Company records |
| `deals` | Sales deals |
| `pipeline_stage_histories` | Stage change logs |

---

## 🔌 API REFERENCE

### RTServer Endpoints (Port 3000)

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/auth/*` | POST | No | Login, signup, OAuth |
| `/api/user-management/*` | GET,POST,PUT | Yes | Team, roles, invites |
| `/api/tickets/*` | CRUD | Yes | Support tickets |
| `/api/conversations/*` | CRUD | Mixed | Chat conversations |
| `/api/chatbot/*` | GET,PUT | Mixed | Chatbot config |
| `/api/kb/*` | CRUD | Yes | Knowledge base |
| `/api/folders/*` | CRUD | Yes | KB folders |
| `/api/articles/*` | CRUD | Yes | KB articles |
| `/api/forms/*` | CRUD | Yes | Custom forms |
| `/api/automations/*` | CRUD | Yes | Workflows |
| `/api/teamchat/*` | CRUD | Yes | Team messaging |
| `/api/tasks/*` | CRUD | Yes | Task management |
| `/api/seo/*` | GET,POST | Mixed | SEO analytics |
| `/api/traffic/*` | POST | No | Visitor tracking |
| `/api/whatsapp/*` | CRUD | Yes | WhatsApp integration |
| `/api/email/*` | CRUD | Yes | Email inbox |
| `/api/aws/*` | POST | Yes | S3 uploads |
| `/api/crm/groups/*` | CRUD | Yes | CRM groups |
| `/api/crm/entities/*` | CRUD | Yes | People, companies, deals |
| `/api/crm/pipelines/*` | CRUD | Yes | Sales pipelines |
| `/api/crm/tables/*` | CRUD | Yes | Custom tables |
| `/api/linkedin/*` | GET,POST | Yes | LinkedIn OAuth |
| `/api/linkedin-campaigns/*` | CRUD | Yes | LinkedIn campaigns |
| `/api/campaigns/chatbot/*` | CRUD | Yes | Chatbot campaigns |
| `/api/transactions/*` | GET,POST | Yes | Payments |

### BackendAI Endpoints (Port 5002)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Stream AI chatbot response |
| `/api/set_user_assistant` | POST | Initialize OpenAI assistant |
| `/copilot/chat` | POST | Stream AI co-pilot response |
| `/copilot/session/{id}` | GET,DELETE | Session management |
| `/api/linkedin-ai/generate-campaign` | POST | Generate 7-post campaign |
| `/api/linkedin-ai/generate-post` | POST | Single post generation |
| `/api/linkedin-ai/optimize-post` | POST | Optimize existing post |
| `/api/linkedin-ai/generate-hashtags` | POST | Generate hashtags |
| `/api/linkedin-ai/analyze-performance` | POST | Analyze post |
| `/api/linkedin-ai/generate-content-ideas` | POST | Content ideas |
| `/api/linkedin-ai/improve-engagement` | POST | Engagement tips |
| `/generate-image` | POST | DALL-E 3 image generation |

---

## 🔄 REAL-TIME (Socket.IO)

### Server Events (rtserver/utils/socket.js)

```javascript
io.on('connection', (socket) => {
  const { chatbot_id, visitor_id, is_visitor } = socket.handshake.query;
  
  // Room management
  socket.on('join_org', (org_id) => socket.join(`org_${org_id}`));
  socket.on('join_conversation', (conv_id) => socket.join(`conv_${conv_id}`));
  socket.on('join_team_chat', (channel_id) => socket.join(`team_${channel_id}`));
  
  // Chat events
  socket.on('support_message', (data) => {
    io.to(`conv_${data.conversation_id}`).emit('new_message', data);
  });
  
  socket.on('typing', (data) => {
    socket.to(`conv_${data.conversation_id}`).emit('user_typing', data);
  });
  
  // Team chat
  socket.on('team_chat_message', (data) => {
    io.to(`team_${data.channel_id}`).emit('new_team_message', data);
  });
  
  // Visitor tracking
  if (is_visitor === 'true') {
    registerLiveVisitor(chatbot_id, visitor_id, socket.id);
    socket.on('disconnect', () => removeLiveVisitor(visitor_id));
  }
});
```

### Client Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_org` | C→S | Join organization room |
| `join_conversation` | C→S | Join chat room |
| `support_message` | C↔S | Chat message |
| `user_typing` | S→C | Typing indicator |
| `new_ticket` | S→C | New ticket notification |
| `open_chat` | S→C | Open specific chat (admin request) |
| `visitor_update` | S→C | Live visitor change |
| `team_chat_message` | C↔S | Team chat message |

---

## 🤖 AI INTEGRATION

### AI Provider Abstraction (backendai/services/ai_provider.py)

```python
# Switch providers via AI_PROVIDER env var
AI_PROVIDER=openai  # or "gemini"

# Usage in controllers
from services.ai_provider import get_ai_provider

ai = get_ai_provider()
response = ai.generate_content(prompt)
```

### LinkedIn AI Features (7 endpoints)

1. **generate-campaign** - Complete 7-post campaign
2. **generate-post** - Single post with hooks/CTAs
3. **optimize-post** - Improve existing content
4. **generate-hashtags** - Industry-relevant hashtags
5. **analyze-performance** - Post analysis
6. **generate-content-ideas** - Content suggestions
7. **improve-engagement** - Engagement tips

---

## 🎨 CHATBOT SDK INTEGRATION

### Installation
```html
<!-- NPM -->
<script>
import { initRhinontech } from '@rhinon/botsdk'
initRhinontech({ app_id: 'YOUR_CHATBOT_ID' })
</script>

<!-- CDN -->
<script src="https://cdn.rhinontech.com/rhinonbot.js"></script>
<script>
window.Rhinontech.initRhinontech({ app_id: 'YOUR_CHATBOT_ID' })
</script>
```

### SDK Config Options
```typescript
interface RhinontechConfig {
  app_id: string;           // Required: chatbot ID
  admin?: boolean;          // Admin preview mode
  adminTestingMode?: boolean;
  container?: HTMLElement;  // Custom container
  chatbot_config?: {
    theme?: 'light' | 'dark' | 'system';
    primaryColor?: string;
    secondaryColor?: string;
    chatbotName?: string;
    popupMessage?: string;
    greetings?: string[];
    primaryLogo?: string;
    secondaryLogo?: string;
    navigationOptions?: string[];  // ['Home', 'Chats', 'Help', 'Voice']
    preChatForm?: FormField[];
    postChatForm?: { enabled: boolean; elements: FormField[] };
    ticketForm?: FormField[];
  };
}
```

### Navigation Screens
- **Home** - Greetings, quick actions
- **Chats/Messages** - Chat conversation
- **Help** - Knowledge base articles
- **Voice** - Voice input mode
- **News** - Updates/announcements
- **Tickets** - Submit support ticket

---

## 💻 CODE PATTERNS

### Controller Pattern (rtserver)
```javascript
const { tickets, customers } = require('../models')

const getTickets = async (req, res) => {
  try {
    const { organization_id } = req.user  // From JWT
    const { page = 1, status } = req.query

    const whereClause = { organization_id }
    if (status) whereClause.status = status

    const result = await tickets.findAndCountAll({
      where: whereClause,
      include: [{ model: customers }],
      limit: 20,
      offset: (page - 1) * 20,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      data: result.rows,
      total: result.count
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ message: 'Error fetching tickets' })
  }
}
```

### FastAPI Route Pattern (backendai)
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/linkedin-ai", tags=["LinkedIn AI"])

class GenerateCampaignRequest(BaseModel):
    topic: str
    industry: str
    tone: str = "professional"

@router.post("/generate-campaign")
async def generate_campaign(request: GenerateCampaignRequest):
    try:
        controller = LinkedInAIController()
        result = controller.generate_campaign(request.dict())
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Service Pattern (rhinon)
```typescript
import { PrivateAxios } from '@/helpers/PrivateAxios'

export const getTickets = async (params?: { page?: number; status?: string }) => {
  const response = await PrivateAxios.get('/api/tickets', { params })
  return response.data
}

export const createTicket = async (data: CreateTicketDto) => {
  const response = await PrivateAxios.post('/api/tickets', data)
  return response.data
}
```

### Zustand Store (rhinon + sdk)
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user })
    }),
    { name: 'user-storage' }
  )
)
```

---

## 🔒 SECURITY

### JWT Middleware
```javascript
// middleware/verifyToken.js
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, email, organization_id, role }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
```

### Multi-Tenant Isolation
```javascript
// ALWAYS filter by organization_id from JWT
const getTickets = async (req, res) => {
  const { organization_id } = req.user  // From JWT - REQUIRED
  
  const tickets = await Ticket.findAll({
    where: { organization_id }  // ALWAYS include this
  })
}
```

---

## 🛠️ COMMON TASKS

### Add New API Endpoint (rtserver)
1. Create controller: `controllers/newController.js`
2. Create route: `routes/newRoutes.js`
3. Register in `app.js`: `app.use('/api/new', newRoutes)`

### Add New Model (rtserver)
1. Create migration: `npx sequelize-cli --options-path .sequelizerc.main migration:generate --name create-new-table`
2. Create model: `models/newModel.js`
3. Add associations in `models/index.js`
4. Run migration: `npx sequelize-cli --options-path .sequelizerc.main db:migrate`

### Add New CRM Model
1. Create migration: `npx sequelize-cli --options-path .sequelizerc.crm migration:generate --name create-crm-new`
2. Create model: `models/crm_models/NewModel.js`
3. Add associations in `models/crm_models/crmdb.js`
4. Run migration: `npx sequelize-cli --options-path .sequelizerc.crm db:migrate`

### Add New AI Feature (backendai)
1. Create controller: `controller/new_controller.py`
2. Create route: `routes/new_routes.py`
3. Register in `main.py`: `app.include_router(new_route)`

### Add New Page (rhinon)
1. Create page: `src/app/[role]/newpage/page.tsx`
2. Create components: `src/components/Pages/NewPage/`
3. Create service: `src/services/newpage/newService.ts`

### Add New SDK Screen (rhinonbot-sdk)
1. Create folder: `src/Messenger/NewScreen/`
2. Create components: `NewScreen.tsx` + `NewScreen.scss`
3. Add navigation in `Messenger.tsx`

---

## 📝 ENVIRONMENT VARIABLES

### rtserver/.env
```bash
# Main Database
DB_HOST=rhinonserver.cxy04gkg4y23.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=rt-database
DB_USERNAME=postgres
DB_PASSWORD=<password>

# CRM Database
CRM_DB_HOST=rhinonserver.cxy04gkg4y23.ap-south-1.rds.amazonaws.com
CRM_DB_PORT=5432
CRM_DB_NAME=rt-crm-beta
CRM_DB_USERNAME=postgres
CRM_DB_PASSWORD=<password>

# Security
JWT_SECRET=<secret>

# AWS
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1
AWS_S3_BUCKET=rhinontech

# Razorpay
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
```

### backendai/.env
```bash
# AI APIs
GOOGLE_API_KEY=<gemini-key>
OPENAI_API_KEY=<openai-key>

# Database (same as rtserver)
DB_HOST=...

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### rhinon/.env.local
```bash
# Generated by ./setup.sh
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_AI_URL=http://localhost:5002/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```
