const express = require("express");
const router = express.Router();
const {
  getTableColumns,
  updateTableColumns,
  addTableColumn,
  deleteTableColumn,
  reorderTableColumns,
  toggleColumnVisibility,
  renameTableColumn,
} = require("../../controllers/crmControllers/tableController");
const verifyToken = require("../../middleware/verifyToken");

// table view routes
router.get("/view/:view_id/table-columns", verifyToken, getTableColumns);

router.put("/view/:view_id/table-columns", verifyToken, updateTableColumns);

router.post("/view/:view_id/table-columns", verifyToken, addTableColumn);

router.delete(
  "/view/:view_id/table-columns/:key",
  verifyToken,
  deleteTableColumn
);

router.put(
  "/view/:view_id/table-columns/reorder",
  verifyToken,
  reorderTableColumns
);

router.put(
  "/view/:view_id/table-columns/:key/visibility",
  verifyToken,
  toggleColumnVisibility
);

router.put(
  "/view/:view_id/table-columns/:key/rename",
  verifyToken,
  renameTableColumn
);

module.exports = router;
