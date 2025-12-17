const express = require("express");
const verifyToken = require("../../middleware/verifyToken");

const {
  createGroups,
  getAllViews,
  createView,
  getGroupsWithViews,
  deleteGroup,
  deleteView,
  updateViewTableColumns,
  getDashboardStats,
} = require("../../controllers/crmControllers/groupsControllers");

const router = express.Router();

router.get("/groups", verifyToken, getGroupsWithViews);
router.post("/group", verifyToken, createGroups);

router.delete("/:group_id/group", verifyToken, deleteGroup);
router.delete("/:view_id/view", verifyToken, deleteView);

router.get("/:group_id/views", verifyToken, getAllViews);
router.post("/:group_id/view", verifyToken, createView);

//table view
router.put("/view/:view_id/table-columns", verifyToken, updateViewTableColumns);

//dashboard
router.get("/dashboard", verifyToken, getDashboardStats);

module.exports = router;
