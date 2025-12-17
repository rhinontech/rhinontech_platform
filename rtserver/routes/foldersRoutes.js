// Add your folder routes here
const express = require("express");
const router = express.Router();
const {
  createOrUpdateFolder,
  getFolderStructureWithArticles,
  deleteFolder,
  getFolderStructureWithArticlesForChatbot,
} = require("../controllers/folderController");
const verifyToken = require("../middleware/verifyToken");

router.post("/", verifyToken, createOrUpdateFolder);
router.get("/structure", verifyToken, getFolderStructureWithArticles);
router.delete("/:folderId", deleteFolder);

//for chatbot
router.get("/chatbot-structure", getFolderStructureWithArticlesForChatbot);

module.exports = router;
