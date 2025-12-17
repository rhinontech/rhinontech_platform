const {
  groups,
  views,
  pipelines,
  sequelize,
  peoples,
  companies,
  deals,
} = require("../../models/crm_models/crmdb");

const DEFAULT_TABLE_COLUMNS = {
  people: [
    { key: "avatar", label: "Avatar", visible: true, width: 60 },
    { key: "full_name", label: "Name", visible: true, width: 200 },
    { key: "email", label: "Email", visible: true },
    { key: "phone", label: "Phone", visible: true },
    { key: "company", label: "Company", visible: true },
    { key: "job_title", label: "Job Title", visible: false },
    { key: "custom_fields.linkedinUrl", label: "LinkedIn", visible: false },
    { key: "lastActivityAt", label: "Last Activity", visible: false },
    { key: "nextFollowupAt", label: "Next Followup", visible: false },
  ],

  company: [
    { key: "avatar", label: "Avatar", visible: true, width: 60 },
    { key: "name", label: "Company Name", visible: true },
    { key: "industry", label: "Industry", visible: true },
    { key: "size", label: "Size", visible: true },
    { key: "location", label: "Location", visible: true },
    { key: "domain", label: "Domain", visible: false },
    { key: "website", label: "Website", visible: false },
    { key: "custom_fields.source", label: "Source", visible: false },
  ],

  deal: [
    { key: "avatar", label: "Avatar", visible: false, width: 60 },
    { key: "title", label: "Deal Name", visible: true },
    { key: "company", label: "Company", visible: true },
    { key: "priority", label: "Priority", visible: true },
    { key: "dealValue", label: "Value", visible: true },
    { key: "probability", label: "Probability %", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "custom_fields.channels", label: "Channels", visible: false },
  ],
};

// Default stages (same as old)
const DEFAULT_STAGES = [
  { id: 1, name: "Prospects", color: "#EFF6FF", order: 0, entities: [] },
  { id: 2, name: "Contacted", color: "#F5F3FF", order: 1, entities: [] },
  { id: 3, name: "Qualified", color: "#ECFDF5", order: 2, entities: [] },
  { id: 4, name: "Proposal", color: "#FFF7ED", order: 3, entities: [] },
  { id: 5, name: "Negotiation", color: "#FEFCE8", order: 4, entities: [] },
  { id: 6, name: "Won", color: "#ECFDF5", order: 5, entities: [] },
];

const DEFAULT_CUSTOMER_GROUP = {
  name: "Chatbot Customers",
  manage_type: "default_customers",
};

const getAllViews = async (req, res) => {
  const { organization_id } = req.user;
  const { group_id } = req.params;

  try {
    const groupViews = await views.findAll({
      where: { organization_id, group_id },
    });

    return res.status(200).json({ views: groupViews });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const createGroups = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { group_name, manage_type } = req.body;
  const created_by = user_id;

  const t = await sequelize.transaction();

  try {
    // Check duplicate name
    const existing = await groups.findOne({
      where: { organization_id, group_name },
    });

    if (existing) {
      return res.status(400).json({
        message: "Group name already exists",
      });
    }

    //  Create group
    const newGroup = await groups.create(
      {
        organization_id,
        group_name,
        manage_type,
        created_by,
      },
      { transaction: t }
    );

    //  Create views → pipeline + table
    const createdViews = await views.bulkCreate(
      [
        {
          organization_id,
          group_id: newGroup.id,
          view_name: "Pipeline",
          view_type: "pipeline",
          view_manage_type: manage_type,
          created_by,
        },
        {
          organization_id,
          group_id: newGroup.id,
          view_name: `All ${manage_type}`,
          view_type: "table",
          view_manage_type: manage_type,
          table_columns: DEFAULT_TABLE_COLUMNS[manage_type],
          created_by,
        },
      ],
      { transaction: t }
    );

    // Find pipeline view
    const pipelineView = createdViews.find((v) => v.view_type === "pipeline");

    //  Auto create pipeline for this view
    await pipelines.create(
      {
        organization_id,
        view_id: pipelineView.id,
        pipeline_manage_type: manage_type,
        name: pipelineView.view_name,
        stages: DEFAULT_STAGES,
        created_by,
      },
      { transaction: t }
    );

    await t.commit();

    // Send response
    const allGroups = await groups.findAll({
      where: { organization_id },
      raw: true,
    });

    const allViews = await views.findAll({
      where: { organization_id },
      raw: true,
    });

    const structured = allGroups.map((g) => ({
      ...g,
      views: allViews.filter((v) => v.group_id === g.id),
    }));

    return res.status(201).json({
      message: "Group + Views + Pipeline created successfully",
      groups: structured,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: "Server error", error });
  }
};

const createView = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { group_id } = req.params;
  const { view_name, view_type, view_manage_type } = req.body;

  try {
    const existing = await views.findOne({
      where: { organization_id, group_id, view_name },
    });

    if (existing) {
      return res.status(400).json({
        message: "View name already exists",
      });
    }

    //  Create View
    const newView = await views.create({
      organization_id,
      group_id,
      view_name,
      view_type,
      view_manage_type,
      table_columns:
        view_type === "table" ? DEFAULT_TABLE_COLUMNS[view_manage_type] : [],
      created_by: user_id,
    });

    //  If pipeline view → auto create pipeline with this view_id
    if (view_type === "pipeline") {
      await pipelines.create({
        organization_id,
        view_id: newView.id,
        pipeline_manage_type: view_manage_type,
        name: newView.view_name,
        stages: DEFAULT_STAGES,
        created_by: user_id,
      });
    }

    const allViews = await views.findAll({
      where: { organization_id, group_id },
    });

    return res.status(201).json({
      message: "View created successfully",
      views: allViews,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getGroupsWithViews = async (req, res) => {
  const { organization_id } = req.user;

  try {
    // Fetch as Sequelize instances (NOT raw)
    let allGroups = await groups.findAll({
      where: { organization_id },
    });

    let allViews = await views.findAll({
      where: { organization_id },
    });

    // Check for default group
    let defaultGroup = allGroups.find(
      (g) => g.manage_type === "default_customers"
    );

    // ----------------------------------------------------------------
    // CREATE DEFAULT GROUP + PIPELINE VIEW + TABLE VIEW + PIPELINE
    // ----------------------------------------------------------------
    if (!defaultGroup) {
      defaultGroup = await groups.create({
        organization_id,
        group_name: DEFAULT_CUSTOMER_GROUP.name,
        manage_type: "default_customers",
        created_by: 0,
      });

      // ---------------------------
      // CREATE PIPELINE VIEW
      // ---------------------------
      const pipelineView = await views.create({
        organization_id,
        group_id: defaultGroup.id,
        view_name: "Pipeline",
        view_type: "pipeline",
        view_manage_type: "default_customers",
        table_columns: [],
        created_by: 0,
      });

      // CREATE PIPELINE UNDER THIS VIEW
      await pipelines.create({
        organization_id,
        view_id: pipelineView.id,
        pipeline_manage_type: "default_customers",
        name: "Pipeline",
        stages: DEFAULT_STAGES,
        created_by: 0,
      });

      // ---------------------------
      // CREATE TABLE VIEW
      // ---------------------------
      await views.create({
        organization_id,
        group_id: defaultGroup.id,
        view_name: "All Customers",
        view_type: "table",
        view_manage_type: "default_customers",
        table_columns: [
          { key: "email", label: "Email", visible: true },
          { key: "custom_data.name", label: "Name", visible: true },
          { key: "custom_data.phone", label: "Phone", visible: true },
        ],
        created_by: 0,
      });

      // RELOAD WITH RAW TRUE FOR CLEAN RESPONSE
      allGroups = await groups.findAll({
        where: { organization_id },
        raw: true,
      });

      allViews = await views.findAll({
        where: { organization_id },
        raw: true,
      });
    } else {
      // Clean reload when group already exists
      allGroups = await groups.findAll({
        where: { organization_id },
        raw: true,
      });

      allViews = await views.findAll({
        where: { organization_id },
        raw: true,
      });
    }

    // STRUCTURE FINAL RESPONSE
    const result = allGroups.map((g) => ({
      ...g,
      views: allViews.filter((v) => v.group_id === g.id),
    }));

    return res.status(200).json({ groups: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteGroup = async (req, res) => {
  const { organization_id } = req.user;
  const { group_id } = req.params;

  const t = await sequelize.transaction();

  try {
    const group = await groups.findOne({
      where: { id: group_id, organization_id },
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.manage_type === "default_customers") {
      return res.status(403).json({ message: "Cannot delete system group" });
    }

    await views.destroy({ where: { group_id }, transaction: t });
    await groups.destroy({ where: { id: group_id }, transaction: t });

    await t.commit();

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteView = async (req, res) => {
  const { organization_id } = req.user;
  const { view_id } = req.params;

  try {
    const view = await views.findOne({
      where: { id: view_id, organization_id },
    });

    if (!view) return res.status(404).json({ message: "View not found" });

    if (view.view_manage_type === "default_customers") {
      return res.status(403).json({ message: "Cannot delete system view" });
    }

    // Delete pipeline if exists
    await pipelines.destroy({ where: { view_id } });

    await views.destroy({ where: { id: view_id } });

    return res.status(200).json({ message: "View deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const updateViewTableColumns = async (req, res) => {
  const { view_id } = req.params;
  const { table_columns } = req.body;

  try {
    await views.update({ table_columns }, { where: { id: view_id } });

    return res.status(200).json({ message: "Table columns updated" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { organization_id } = req.user;

    // Load all table data
    const [allPeople, allCompanies, allDeals, allPipelines] = await Promise.all(
      [
        peoples.findAll({ where: { organization_id }, raw: true }),
        companies.findAll({ where: { organization_id }, raw: true }),
        deals.findAll({ where: { organization_id }, raw: true }),
        pipelines.findAll({ where: { organization_id } }), // NOT raw, because stages is JSON
      ]
    );

    // Create map for fast find
    const peopleMap = Object.fromEntries(allPeople.map((p) => [p.id, p]));
    const companyMap = Object.fromEntries(allCompanies.map((c) => [c.id, c]));
    const dealMap = Object.fromEntries(allDeals.map((d) => [d.id, d]));

    // ---------------------------
    // Extract ALL entities from pipelines
    // ---------------------------
    const pipelineEntities = []; // unified array

    allPipelines.forEach((p) => {
      (p.stages || []).forEach((stage) => {
        (stage.entities || []).forEach((e) => {
          pipelineEntities.push({
            pipeline_id: p.id,
            pipeline_name: p.name || p.pipeline_manage_type,
            stage: stage.name,
            entity_type: e.entity_type,
            entity_id: e.entity_id,
          });
        });
      });
    });

    // Convert pipeline entities to full entity data
    const unified = pipelineEntities
      .map((e) => {
        let record = null;

        if (e.entity_type === "people") record = peopleMap[e.entity_id];
        else if (e.entity_type === "company") record = companyMap[e.entity_id];
        else if (e.entity_type === "deal") record = dealMap[e.entity_id];
        else record = null;

        return {
          ...e,
          record,
        };
      })
      .filter((x) => x.record); // remove missing

    // Now unified[] contains:
    // { pipeline_id, pipeline_name, stage, entity_type, entity_id, record }

    // --------------------------
    // METRICS
    // --------------------------
    const totalLeads = unified.length;

    // Revenue only from deals
    const totalRevenue = unified
      .filter((x) => x.entity_type === "deal")
      .reduce(
        (sum, x) => sum + (Number(x.record.custom_fields?.dealValue) || 0),
        0
      );

    const avgDealValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    // Qualified = stage is Qualified or Negotiation
    const qualified = unified.filter(
      (x) => x.stage === "Qualified" || x.stage === "Negotiation"
    );

    const conversionRate =
      totalLeads > 0 ? (qualified.length / totalLeads) * 100 : 0;

    // --------------------------
    // Leads by Status (Stages)
    // --------------------------
    const leadsByStatusObj = {};
    unified.forEach((x) => {
      leadsByStatusObj[x.stage] = (leadsByStatusObj[x.stage] || 0) + 1;
    });
    const leadsByStatus = Object.entries(leadsByStatusObj).map(
      ([name, value]) => ({ name, value })
    );

    // --------------------------
    // Leads by Month (created_at)
    // --------------------------
    const leadsByMonthObj = {};
    unified.forEach((x) => {
      const date = getCreatedDate(x.record);
      if (!date) return;

      const month = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      leadsByMonthObj[month] = (leadsByMonthObj[month] || 0) + 1;
    });

    const leadsByMonth = Object.entries(leadsByMonthObj).map(
      ([month, count]) => ({ month, count })
    );

    // --------------------------
    // Leads by Priority (all entity types)
    // --------------------------
    const priorityObj = {};
    unified.forEach((x) => {
      const p = x.record.custom_fields?.priority || "Medium";
      priorityObj[p] = (priorityObj[p] || 0) + 1;
    });
    const leadsByPriority = Object.entries(priorityObj).map(
      ([name, value]) => ({ name, value })
    );

    // --------------------------
    // Leads by Industry (companies only)
    // --------------------------
    const industryObj = {};
    unified
      .filter((x) => x.entity_type === "company")
      .forEach((x) => {
        const ind = x.record.industry || "Unknown";
        industryObj[ind] = (industryObj[ind] || 0) + 1;
      });
    const leadsByIndustry = Object.entries(industryObj).map(
      ([name, value]) => ({ name, value })
    );

    // --------------------------
    // Revenue by Pipeline
    // --------------------------
    const revenueByPipelineObj = {};
    unified
      .filter((x) => x.entity_type === "deal")
      .forEach((x) => {
        const pipelineName = x.pipeline_name;
        const value = Number(x.record.custom_fields?.dealValue) || 0;
        revenueByPipelineObj[pipelineName] =
          (revenueByPipelineObj[pipelineName] || 0) + value;
      });
    const revenueByPipeline = Object.entries(revenueByPipelineObj).map(
      ([pipeline, revenue]) => ({ pipeline, revenue: revenue / 1000 })
    );

    // --------------------------
    // Top Deals
    // --------------------------
    const topDeals = unified
      .filter((x) => x.entity_type === "deal")
      .sort(
        (a, b) =>
          (Number(b.record.custom_fields?.dealValue) || 0) -
          (Number(a.record.custom_fields?.dealValue) || 0)
      )
      .slice(0, 5)
      .map((x) => ({
        id: x.record.id,
        name: x.record.title,
        company: companyMap[x.record.company_id]?.name || "",
        dealValue: Number(x.record.custom_fields?.dealValue) || 0,
      }));

    // --------------------------
    // Final Response
    // --------------------------
    return res.json({
      metrics: {
        totalRevenue,
        avgDealValue,
        conversionRate,
        totalLeads,
      },
      leadsByStatus,
      leadsByIndustry,
      leadsByMonth,
      revenueByPipeline,
      leadsByPriority,
      topDeals,
      counts: {
        people: allPeople.length,
        companies: allCompanies.length,
        deals: allDeals.length,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ message: "Dashboard fetch error" });
  }
};

function getCreatedDate(record) {
  // 1) Try standard column
  if (record.created_at) {
    const d = new Date(record.created_at);
    if (!isNaN(d)) return d;
  }

  // 2) Try custom field if exists
  if (record.custom_fields?.createdAtField?.value) {
    const d = new Date(record.custom_fields.createdAtField.value);
    if (!isNaN(d)) return d;
  }

  // 3) Try updated_at (fallback)
  if (record.updated_at) {
    const d = new Date(record.updated_at);
    if (!isNaN(d)) return d;
  }

  // FINAL fallback → DON'T use today's date
  // Instead use a “Unknown” bucket
  return null;
}

module.exports = {
  createGroups,
  getAllViews,
  createView,
  getGroupsWithViews,
  deleteGroup,
  deleteView,
  updateViewTableColumns,
  getDashboardStats,
};
