const mongoose = require("mongoose")

// Create separate connections for each database
const seoConnection = mongoose.createConnection()
const kbConnection = mongoose.createConnection()
const cbConnection = mongoose.createConnection()

const connectMongoDB = async () => {
  try {
    // Connect to SEO database (for folders)
    await seoConnection.openUri(process.env.MONGO_URI || "mongodb://localhost:27017/seo_db")
    console.log("SEO Database connected")

    // Connect to Knowledge Base database (for articles)
    await kbConnection.openUri(process.env.MONGO_URI_KB || "mongodb://localhost:27017/knowledgebase")
    console.log("Knowledge Base Database connected")

    await cbConnection.openUri(process.env.MONGO_URI_CB || "mongodb://localhost:27017/chatbot")
    console.log("Chat Bot Database connected")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

module.exports = {
  connectMongoDB,
  seoConnection,
  kbConnection,
  cbConnection
}
