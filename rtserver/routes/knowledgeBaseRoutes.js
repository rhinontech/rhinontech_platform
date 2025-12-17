// routes/knowledgeBaseRoutes.js
const express = require("express");
const router = express.Router();
const { getKBByIdentifier, createKBForOrg, getKBByOrgId, updateKBTheme } = require("../controllers/knowledgeBaseController");
const verifyToken = require("../middleware/verifyToken");

// GET KB by UUID
router.get("/org", verifyToken, getKBByOrgId);
router.get("/create", verifyToken, createKBForOrg);
router.put("/theme", verifyToken, updateKBTheme);
router.get("/:identifier", getKBByIdentifier);



module.exports = router;
