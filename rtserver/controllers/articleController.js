const e = require("express");
const { articles } = require("../models");
const { logActivity } = require("../utils/activityLogger");

exports.createArticle = async (req, res) => {
  try {
    console.log("Creating article with body:", req.body);
    const { organization_id, user_id } = req.user;
    console.log("User:", { organization_id, user_id });

    const articleData = {
      ...req.body,
      organization_id,
    };

    const article = await articles.create(articleData);

    logActivity(
      user_id,
      organization_id,
      "KNOWLEDGE_BASE",
      "Created an article",
    );

    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await articles.findOne({ where: { id: articleId } });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;
    const { id } = req.params;

    const [updatedCount, [updatedArticle]] = await articles.update(req.body, {
      where: { id },
      returning: true,
    });

    if (!updatedCount) {
      return res.status(404).json({ message: "Article not found" });
    }

    logActivity(
      user_id,
      organization_id,
      "KNOWLEDGE_BASE",
      "Updated the article",
    );

    res.json(updatedArticle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await articles.destroy({ where: { id } });

    if (!deletedCount) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateArticleStats = async (req, res) => {
  try {
    const { articleId, action, previous } = req.body;

    const article = await articles.findOne({ where: { id: articleId } });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Remove previous reaction
    if (previous === "like") {
      article.likes -= 1;
    }

    if (previous === "dislike") {
      article.dislikes -= 1;
    }

    // Add new reaction
    if (action === "like") {
      article.likes += 1;
    } else if (action === "dislike") {
      article.dislikes += 1;
    } else if (action === "view") {
      article.views += 1;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await article.save();

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
