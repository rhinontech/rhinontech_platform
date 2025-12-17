const { folders, articles, chatbots } = require("../models");
const { logActivity } = require("../utils/activityLogger");

exports.createOrUpdateFolder = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { topicId, name, description, parent_id } = req.body;

  try {
    if (topicId) {
      // Update folder
      const [updatedCount, [updatedFolder]] = await folders.update(
        { name, description },
        { where: { id: topicId }, returning: true }
      );

      if (!updatedCount) {
        return res.status(404).json({ error: "Folder not found" });
      }

      logActivity(
        user_id,
        organization_id,
        "KNOWLEDGE_BASE",
        "Updated the folder",
        { topicId, name, description }
      );

      return res.status(200).json(updatedFolder);
    } else {
      // Create folder
      const folder = await folders.create({
        name,
        description,
        parent_id: parent_id || null,
        organization_id,
      });

      logActivity(
        user_id,
        organization_id,
        "KNOWLEDGE_BASE",
        "Created the folder",
        { name, description }
      );

      return res.status(201).json(folder);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFolderStructureWithArticles = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const allFolders = await folders.findAll({
      where: { organization_id },
      order: [["created_at", "ASC"]],
    });

    const allArticles = await articles.findAll({
      where: { organization_id },
      order: [["created_at", "ASC"]],
    });

    // Map articles under their folder_id
    const articleMap = {};
    for (const article of allArticles) {
      const folderId = article.folder_id || "none";
      if (!articleMap[folderId]) articleMap[folderId] = [];
      articleMap[folderId].push(article);
    }

    const formattedFolders = allFolders.map((folder) => ({
      folder_id: folder.id,
      name: folder.name,
      description: folder.description,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
      articles: articleMap[folder.id] || [],
    }));

    res.json({ orgId: organization_id, folders: formattedFolders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    await articles.destroy({ where: { folder_id: folderId } });
    const deletedCount = await folders.destroy({ where: { id: folderId } });

    if (!deletedCount) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFolderStructureWithArticlesForChatbot = async (req, res) => {
  try {
    const { chatbot_id } = req.query;

    const chatbot = await chatbots.findOne({ where: { chatbot_id } });

    if (!chatbot) {
      return res.status(401).json({ error: "Chatbot ID not found" });
    }

    const allFolders = await folders.findAll({
      where: { organization_id: chatbot.organization_id },
    });

    const allArticles = await articles.findAll({
      where: { organization_id: chatbot.organization_id },
    });

    const articleMap = {};
    for (const article of allArticles) {
      const folderId = article.folder_id || "none";
      if (!articleMap[folderId]) articleMap[folderId] = [];
      articleMap[folderId].push(article);
    }

    const formattedFolders = allFolders.map((folder) => ({
      folderId: folder.id,
      name: folder.name,
      description: folder.description,
      createdAt: folder.created_at,
      articles: articleMap[folder.id] || [],
    }));

    res.json({ folders: formattedFolders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
