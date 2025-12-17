const express = require("express");
const verifyToken = require("../../middleware/verifyToken");

const {
  getPipelinesByView,
  createPipeline,
  updatePipeline,
  deletePipeline,

  removeStage,
  reorderStages,
  getPipelineView,

  moveEntityStage,
  deleteEntity,
  getEntityPipelines,
} = require("../../controllers/crmControllers/pipelineController");

const router = express.Router();

// Get pipelines belonging to a view
router.get("/view/:view_id/pipelines", verifyToken, getPipelinesByView);

// Create pipeline inside a view
router.post("/view/:view_id/pipeline", verifyToken, createPipeline);

// Update or delete pipeline
router.put("/pipeline/:pipeline_id", verifyToken, updatePipeline);
router.delete("/pipeline/:pipeline_id", verifyToken, deletePipeline);

// Stage ops
router.delete(
  "/pipeline/:pipeline_id/stage/:stage_id",
  verifyToken,
  removeStage
);
router.patch("/pipeline/:pipeline_id/reorder", verifyToken, reorderStages);

// UI Kanban
router.get("/pipeline/:pipeline_id/kanban", verifyToken, getPipelineView);

// Move ANY entity (company/people/deal)
router.post(
  "/entity/:entity_type/:entity_id/move",
  verifyToken,
  moveEntityStage
);

router.delete("/entity/:entity_type/:entity_id", verifyToken, deleteEntity);

// Get all pipelines containing an entity
router.get(
  "/entity/:entity_type/:entity_id/pipelines",
  verifyToken,
  getEntityPipelines
);

module.exports = router;
