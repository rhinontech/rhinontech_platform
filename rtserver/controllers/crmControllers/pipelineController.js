const {
  pipelines,
  companies,
  peoples,
  deals,
} = require("../../models/crm_models/crmdb");

const { customers } = require("../../models");
/**
 * Normalize stage structure so older pipelines don't break
 * Adds missing "entities" array for old pipelines
 */
const normalizeStages = (stages = []) => {
  return stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
    entities: s.entities || [],
  }));
};

// GET PIPELINES BY VIEW
const getPipelinesByView = async (req, res) => {
  const { organization_id } = req.user;
  const { view_id } = req.params;

  try {
    const list = await pipelines.findAll({
      where: { organization_id, view_id },
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({ pipelines: list });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// CREATE PIPELINE
const createPipeline = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { view_id } = req.params;
  const { name, pipeline_manage_type, stages } = req.body;

  try {
    const existing = await pipelines.findOne({
      where: { organization_id, view_id, name },
    });

    if (existing)
      return res
        .status(400)
        .json({ message: "Pipeline name already exists in this view" });

    await pipelines.create({
      organization_id,
      view_id,
      name,
      pipeline_manage_type,
      stages,
      created_by: user_id,
    });

    const all = await pipelines.findAll({
      where: { organization_id, view_id },
    });

    return res.status(201).json({
      message: "Pipeline created successfully",
      pipelines: all,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE PIPELINE (stages + name)
const updatePipeline = async (req, res) => {
  const { pipeline_id } = req.params;
  const { name, stages: incomingStages } = req.body;

  try {
    const pipeline = await pipelines.findByPk(pipeline_id);
    if (!pipeline)
      return res.status(404).json({ message: "Pipeline not found" });

    const existingStages = normalizeStages(pipeline.stages);

    const existingMap = {};
    existingStages.forEach((s) => (existingMap[s.id] = s));

    const updatedStages = [];
    let nextStageId = Math.max(0, ...existingStages.map((s) => s.id)) + 1;

    for (const stage of incomingStages) {
      // UPDATE EXISTING STAGE
      if (stage.id && existingMap[stage.id]) {
        updatedStages.push({
          ...existingMap[stage.id],
          name: stage.name,
          color: stage.color,
          order: stage.order,
          entities: existingMap[stage.id].entities || [],
        });
      } else {
        // NEW STAGE
        updatedStages.push({
          id: nextStageId++,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          entities: [],
        });
      }
    }

    updatedStages.sort((a, b) => a.order - b.order);

    await pipelines.update(
      { name, stages: updatedStages },
      { where: { id: pipeline_id } }
    );

    return res.status(200).json({
      message: "Pipeline updated",
      stages: updatedStages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// REMOVE A STAGE (move entities to fallback stage)
const removeStage = async (req, res) => {
  const { pipeline_id, stage_id } = req.params;

  try {
    const pipeline = await pipelines.findByPk(pipeline_id);
    if (!pipeline)
      return res.status(404).json({ message: "Pipeline not found" });

    const stages = normalizeStages(pipeline.stages);

    const idx = stages.findIndex((s) => s.id === Number(stage_id));
    if (idx === -1) return res.status(404).json({ message: "Stage not found" });

    if (stages.length === 1)
      return res.status(400).json({
        message: "Pipeline must have at least one stage",
      });

    const removedStage = stages[idx];
    const fallbackStage = stages[idx - 1] || stages[idx + 1];

    // Move entities to fallback stage
    fallbackStage.entities = [
      ...(fallbackStage.entities || []),
      ...(removedStage.entities || []),
    ];

    const updatedStages = stages.filter((s) => s.id !== Number(stage_id));

    updatedStages.forEach((s, i) => (s.order = i));

    await pipelines.update(
      { stages: updatedStages },
      { where: { id: pipeline_id } }
    );

    return res.status(200).json({
      message: "Stage removed",
      updated_stages: updatedStages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// REORDER STAGES
const reorderStages = async (req, res) => {
  const { pipeline_id } = req.params;
  const { stages } = req.body;

  try {
    const updated = stages.map((s) => ({
      ...s,
      id: Number(s.id),
      order: Number(s.order),
    }));

    await pipelines.update({ stages: updated }, { where: { id: pipeline_id } });

    return res.status(200).json({
      message: "Stage order updated",
      stages: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// MOVE ENTITY BETWEEN STAGES
const moveEntityStage = async (req, res) => {
  const { entity_type, entity_id } = req.params;
  const { to_stage_id, pipeline_id } = req.body;

  try {
    const pipeline = await pipelines.findByPk(pipeline_id);
    if (!pipeline)
      return res.status(404).json({ message: "Pipeline not found" });

    // Validate entity type matches pipeline type
    if (pipeline.pipeline_manage_type !== entity_type) {
      return res.status(400).json({
        message: `Invalid entity type. Pipeline accepts '${pipeline.pipeline_manage_type}' only.`,
      });
    }

    // Validate actual entity exists
    let entity = null;

    if (entity_type === "people") {
      entity = await peoples.findByPk(entity_id);
    } else if (entity_type === "company") {
      entity = await companies.findByPk(entity_id);
    } else if (entity_type === "deal") {
      entity = await deals.findByPk(entity_id);
    } else if (entity_type === "default_customers") {
      entity = await customers.findByPk(entity_id);
    }

    if (!entity) {
      return res.status(404).json({
        message: `Entity ${entity_type} with id ${entity_id} not found`,
      });
    }

    const stages = normalizeStages(pipeline.stages);

    // Remove the entity from ALL stages
    for (const stage of stages) {
      stage.entities = stage.entities.filter(
        (e) =>
          !(e.entity_id === Number(entity_id) && e.entity_type === entity_type)
      );
    }

    // Insert into new stage
    const newStage = stages.find((s) => s.id === Number(to_stage_id));
    if (!newStage)
      return res.status(404).json({ message: "Destination stage not found" });

    newStage.entities.push({
      entity_id: Number(entity_id),
      entity_type,
      sort: newStage.entities.length,
    });

    await pipelines.update({ stages }, { where: { id: pipeline_id } });

    return res.status(200).json({ message: "Entity added to pipeline" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err });
  }
};

// GET PIPELINE VIEW (KANBAN)
const getPipelineView = async (req, res) => {
  const { organization_id } = req.user;
  const { pipeline_id } = req.params;

  try {
    const pipeline = await pipelines.findOne({
      where: { organization_id, id: pipeline_id },
    });

    if (!pipeline)
      return res.status(404).json({ message: "Pipeline not found" });

    const type = pipeline.pipeline_manage_type;
    const stages = normalizeStages(pipeline.stages);

    let entityMap = new Map();

    // Only load required entity type
    if (type === "people") {
      const allPeople = await peoples.findAll({
        where: { organization_id },
        raw: true,
      });
      entityMap = new Map(allPeople.map((p) => [p.id, p]));

      const allCompanies = await companies.findAll({
        where: { organization_id },
        raw: true,
      });

      const companyMap = new Map(allCompanies.map((c) => [c.id, c]));

      for (const [id, people] of entityMap.entries()) {
        people.company = people.company_id
          ? companyMap.get(people.company_id) || null
          : null;
        entityMap.set(id, people);
      }
    }

    if (type === "company") {
      const allCompanies = await companies.findAll({
        where: { organization_id },
        raw: true,
      });
      entityMap = new Map(allCompanies.map((c) => [c.id, c]));
    }

    if (type === "deal") {
      const allDeals = await deals.findAll({
        where: { organization_id },
        raw: true,
      });
      entityMap = new Map(allDeals.map((d) => [d.id, d]));

      const allPeople = await peoples.findAll({
        where: { organization_id },
        raw: true,
      });
      const allCompanies = await companies.findAll({
        where: { organization_id },
        raw: true,
      });

      const peopleMap = new Map(allPeople.map((p) => [p.id, p]));
      const companyMap = new Map(allCompanies.map((c) => [c.id, c]));
      for (const [id, deal] of entityMap.entries()) {
        deal.contact = deal.contact_id
          ? peopleMap.get(deal.contact_id) || null
          : null;

        deal.company = deal.company_id
          ? companyMap.get(deal.company_id) || null
          : null;

        entityMap.set(id, deal);
      }
    }

    // -----------------------------------------------
    // DEFAULT CUSTOMER PIPELINE (CHATBOT CUSTOMERS)
    // -----------------------------------------------
    if (type === "default_customers") {
      const allCustomers = await customers.findAll({
        where: { organization_id },
        raw: true,
      });

      entityMap = new Map(allCustomers.map((c) => [c.id, c]));

      // Optional formatting for UI
      for (const [id, cust] of entityMap.entries()) {
        cust.name = cust.custom_data?.name || "";
        cust.phone = cust.custom_data?.phone || "";
        entityMap.set(id, cust);
      }
    }

    const columns = stages.map((stage) => ({
      stage_id: stage.id,
      stage_name: stage.name,
      stage_color: stage.color,
      order: stage.order,
      entities: stage.entities.map((e) => ({
        ...e,
        data: entityMap.get(e.entity_id) || null,
      })),
    }));

    return res.status(200).json({
      pipeline_id: pipeline.id,
      pipeline: pipeline.name,
      manage_type: type,
      columns,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err });
  }
};

// DELETE PIPELINE
const deletePipeline = async (req, res) => {
  const { pipeline_id } = req.params;

  try {
    const deleted = await pipelines.destroy({
      where: { id: pipeline_id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    return res.status(200).json({ message: "Pipeline deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// DELETE ENTITY FROM ALL PIPELINES
const deleteEntity = async (req, res) => {
  const { entity_type, entity_id } = req.params;
  const { pipeline_id } = req.body;

  try {
    const pipeline = await pipelines.findByPk(pipeline_id);
    if (!pipeline)
      return res.status(404).json({ message: "Pipeline not found" });

    const stages = normalizeStages(pipeline.stages);

    // remove the entity from all stages of this pipeline only
    for (const stage of stages) {
      stage.entities = stage.entities.filter(
        (e) =>
          !(e.entity_id === Number(entity_id) && e.entity_type === entity_type)
      );
    }

    await pipelines.update({ stages }, { where: { id: pipeline_id } });

    return res.status(200).json({
      message: `${entity_type} detached from pipeline`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// GET ALL PIPELINES CONTAINING AN ENTITY
const getEntityPipelines = async (req, res) => {
  const { organization_id } = req.user;
  const { entity_type, entity_id } = req.params;

  try {
    // Get all pipelines of the matching type for this organization
    const allPipelines = await pipelines.findAll({
      where: {
        organization_id,
        pipeline_manage_type: entity_type
      },
    });

    // Filter pipelines that contain this entity
    const pipelinesWithEntity = [];

    for (const pipeline of allPipelines) {
      const stages = normalizeStages(pipeline.stages);

      // Check if any stage contains this entity
      const hasEntity = stages.some(stage =>
        stage.entities.some(e =>
          e.entity_id === Number(entity_id) && e.entity_type === entity_type
        )
      );

      if (hasEntity) {
        // Find which stage the entity is in
        const entityStage = stages.find(stage =>
          stage.entities.some(e =>
            e.entity_id === Number(entity_id) && e.entity_type === entity_type
          )
        );

        pipelinesWithEntity.push({
          pipeline_id: pipeline.id,
          pipeline_name: pipeline.name,
          view_id: pipeline.view_id,
          stage_id: entityStage?.id,
          stage_name: entityStage?.name,
        });
      }
    }

    return res.status(200).json({
      pipelines: pipelinesWithEntity,
    });
  } catch (error) {
    console.error("getEntityPipelines error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
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
};
