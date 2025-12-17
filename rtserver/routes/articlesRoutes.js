// Add your article routes here
const express = require("express");
const router = express.Router();
const {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticle,
} = require("../controllers/articleController");
const verifyToken = require("../middleware/verifyToken");

router.post("/", verifyToken, createArticle);
router.get("/:articleId", getArticle);
router.put("/:id", verifyToken, updateArticle);
router.delete("/:id", deleteArticle);

module.exports = router;
