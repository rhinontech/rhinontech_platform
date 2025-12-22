const express = require("express");
const cors = require("cors");
const swaggerDocs = require("./swagger.js");

const { sequelize } = require("./models");
// const { connectMongoDB } = require("./config/mongo");
const { Server } = require("socket.io");
const http = require("http");

const dotenv = require("dotenv");
dotenv.config();
const app = express();
const server = http.createServer(app);

// ---- CORS Setup ----
// Allow all origins
const corsOptions = {
  origin: true, // true means reflect request origin, allows all
  credentials: true, // allow cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON and URL-encoded payloads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ---- Socket.io Setup ----
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for WebSocket connections
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

app.set("io", io);
app.set("trust proxy", true); // trust reverse proxy headers

// Route imports
const authRouter = require("./routes/authRoutes");
const onboardingRouter = require("./routes/onboardingRoutes");
const whatsppRouter = require("./routes/whatsappRoutes");
const userDetailsRouter = require("./routes/userDetailsRoutes");
const providerRouter = require("./routes/providerRoutes");
const userManagementRouter = require("./routes/userManagementRoutes");
const seoRouter = require("./routes/seoRoutes");
const foldersRoutes = require("./routes/foldersRoutes.js");
const articlesRoutes = require("./routes/articlesRoutes.js");
const formRoutor = require("./routes/formRoutes");
const ticketRoutor = require("./routes/ticketRoutes");
const automationRoutor = require("./routes/automationRoutes");
const awsRoutor = require("./routes/awsRoutes");
const transactionRoutor = require("./routes/transactionRoutes");
const chatbotConfig = require("./routes/chatbot.js");
const chatbotCampaignRoutes = require("./routes/chatbotCampaignRoutes.js");
const conversationRoutor = require("./routes/conversationRoutes.js");
const trafficRouter = require("./routes/trafficRoutes.js");
const knowledgeBaseRoutes = require("./routes/knowledgeBaseRoutes.js");
const emailRoutes = require("./routes/emailRoutes.js");
const teamChatRoutes = require("./routes/teamChatRoutes.js");
const route53Routes = require("./config/route53Config");

const crmGroupsRoutes = require("./routes/crmRoutes/groupsRoutes.js");
const crmEntitiesRoutes = require("./routes/crmRoutes/entitiesRoutes.js");
const crmPipelinesRoutes = require("./routes/crmRoutes/pipelinesRoutes.js");
const crmTablesRoutes = require("./routes/crmRoutes/tablesRoutes.js");
const linkedInCampaignRoutes = require("./routes/linkedin_campaignRoutes.js");
const linkedInAuthRoutes = require("./routes/linkedin_authRoutes.js");

//Socket handler
const socketHandler = require("./utils/socket.js");

app.get("/", (req, res) => {
  res.send("Hello, Rhinon Tech Server is LIVE!");
});

// Health check endpoint
app.get("/health", async (req, res) => {
  const healthStatus = {
    service: "rtserver",
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check PostgreSQL
  try {
    await sequelize.authenticate();
    healthStatus.checks.postgresql = { status: "healthy" };
  } catch (error) {
    healthStatus.checks.postgresql = { status: "unhealthy", error: error.message };
    healthStatus.status = "degraded";
  }

  // Check Redis (if available)
  const io = req.app.get('io');
  if (io) {
    healthStatus.checks.socketio = { status: "healthy", connections: io.engine.clientsCount };
  }

  // Check AI Backend
  try {
    const axios = require('axios');
    const aiUrl = process.env.AI_API_URL || 'http://localhost:5002';
    await axios.get(`${aiUrl}/health`, { timeout: 3000 });
    healthStatus.checks.backendai = { status: "healthy" };
  } catch (error) {
    healthStatus.checks.backendai = { status: "unhealthy", error: error.message };
  }

  const statusCode = healthStatus.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Route setup
app.use("/api/auth", /** #swagger.tags = ['AUTH'] */ authRouter);
app.use("/api/onboarding", /** #swagger.tags = ['AUTH'] */ onboardingRouter);
app.use("/api/whatsapp", /** #swagger.tags = ['WHATSAPP'] */ whatsppRouter);
app.use(
  "/api/user-details",
  /** #swagger.tags = ['USER-DATA'] */ userDetailsRouter
);
app.use("/api/provider", /** #swagger.tags = ['PROVIDER'] */ providerRouter);
app.use(
  "/api/user-management",
  /** #swagger.tags = ['TEAM'] */ userManagementRouter
);
app.use("/api/seo", /** #swagger.tags = ['SEO'] */ seoRouter);
app.use("/api/folders", /** #swagger.tags = ['ARTICLE'] */ foldersRoutes);
app.use("/api/articles", /** #swagger.tags = ['ARTICLE'] */ articlesRoutes);
app.use("/api/forms", /** #swagger.tags = ['FORM'] */ formRoutor);
app.use("/api/tickets", /** #swagger.tags = ['TICKET'] */ ticketRoutor);
app.use(
  "/api/automations",
  /** #swagger.tags = ['AUTOMATION'] */ automationRoutor
);
app.use("/api/aws", /** #swagger.tags = ['AWS'] */ awsRoutor);
app.use(
  "/api/transactions",
  /** #swagger.tags = ['TRANSACTION'] */ transactionRoutor
);
app.use("/api/chatbot", /** #swagger.tags = ['CHATBOT'] */ chatbotConfig);

app.use(
  "/api/campaigns/chatbot",
  /** #swagger.tags = ['CHATBOT'] */ chatbotCampaignRoutes
);

app.use(
  "/api/conversations",
  /** #swagger.tags = ['CONVERSATION'] */ conversationRoutor
);
app.use("/api/traffic", /** #swagger.tags = ['TRAFFIC'] */ trafficRouter);

app.use("/api/crm/groups", /** #swagger.tags = ['CRM'] */ crmGroupsRoutes);
app.use("/api/crm/entities", /** #swagger.tags = ['CRM'] */ crmEntitiesRoutes);
app.use(
  "/api/crm/pipelines",
  /** #swagger.tags = ['CRM'] */ crmPipelinesRoutes
);
app.use("/api/crm/tables", /** #swagger.tags = ['CRM'] */ crmTablesRoutes);

app.use("/api/kb", knowledgeBaseRoutes);

app.use("/api/route53", route53Routes);

app.use("/api/email", emailRoutes);
app.use("/api/teamchat", /** #swagger.tags = ['TEAMCHAT'] */ teamChatRoutes);
app.use("/api/tasks", /** #swagger.tags = ['TASKS'] */ require("./routes/taskRoutes"));
app.use("/api/linkedin", /** #swagger.tags = ['LINKEDIN-AUTH'] */ linkedInAuthRoutes);
app.use("/api/linkedin-campaigns", /** #swagger.tags = ['LINKEDIN-CAMPAIGNS'] */ linkedInCampaignRoutes);

//swagger
swaggerDocs(app);

// Call it with io
// require("./utils/socket.js")(io);
socketHandler(io);

// connectMongoDB().then(() => {
sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL connected...");
  })
  .catch((error) => console.error("PostgreSQL connection error:", error));
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
