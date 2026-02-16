// Add your article routes here
const express = require("express");
const router = express.Router();
const {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticle,
  updateArticleStats
} = require("../controllers/articleController");
const verifyToken = require("../middleware/verifyToken");

router.post("/", verifyToken, createArticle);
router.get("/:articleId", getArticle);
router.put("/:id", verifyToken, updateArticle);
router.delete("/:id", deleteArticle);
router.post("/stats", verifyToken, updateArticleStats);
module.exports = router;
