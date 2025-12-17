const {
  peoples,
  companies,
  deals,
  pipelines,
} = require("../../models/crm_models/crmdb");

const { customers } = require("../../models");

function mergeCustomFields(defaults, incoming) {
  if (!incoming) return defaults;

  const merged = { ...defaults };

  for (const key in incoming) {
    if (
      typeof incoming[key] === "object" &&
      incoming[key] !== null &&
      merged[key] &&
      typeof merged[key] === "object"
    ) {
      merged[key] = { ...merged[key], ...incoming[key] }; // deep merge
    } else {
      merged[key] = incoming[key];
    }
  }

  return merged;
}

const createCustomer = async (req, res) => {
  const { organization_id } = req.user;
  const { email, custom_data } = req.body;

  try {
    const customer = await customers.create({
      organization_id,
      email,
      custom_data,
    });

    return res.status(201).json({ message: "Customer created", customer });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getAllCustomers = async (req, res) => {
  const { organization_id } = req.user;

  try {
    const list = await customers.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ customers: list });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await customers.findByPk(req.params.id);
    return res.status(200).json({ customer });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { email, custom_data } = req.body;

  try {
    const existing = await customers.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const mergedData = { ...existing.custom_data, ...custom_data };

    await customers.update(
      {
        email: email ?? existing.email,
        custom_data: mergedData,
      },
      { where: { id } }
    );

    const updated = await customers.findByPk(id);

    return res.status(200).json({
      message: "Customer updated",
      customer: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    await customers.destroy({ where: { id: req.params.id } });

    return res.status(200).json({ message: "Customer deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const removeEntityFromPipelines = async (entity_type, entity_id) => {
  const pipelineList = await pipelines.findAll();

  for (const pipeline of pipelineList) {
    const stages = pipeline.stages || [];

    for (const stage of stages) {
      stage.entities = stage.entities.filter(
        (e) =>
          !(e.entity_id === Number(entity_id) && e.entity_type === entity_type)
      );
    }

    await pipelines.update({ stages }, { where: { id: pipeline.id } });
  }
};
// ------------------------- PEOPLE -------------------------

const createPeople = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const {
    full_name,
    emails,
    phones,
    company_id,
    job_title,
    tags,
    custom_fields,
  } = req.body;

  try {
    const defaultFields = peoples.rawAttributes.custom_fields.defaultValue;

    const finalFields = mergeCustomFields(defaultFields, custom_fields);

    const person = await peoples.create({
      organization_id,
      full_name,
      emails,
      phones,
      company_id,
      job_title,
      tags,
      custom_fields: finalFields,
      created_by: user_id,
    });

    return res.status(201).json({
      message: "Person created successfully",
      person,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getAllPeople = async (req, res) => {
  const { organization_id } = req.user;

  try {
    const people = await peoples.findAll({
      where: { organization_id },
      include: [
        {
          model: companies,
          required: false,
          attributes: ["id", "name", "domain", "custom_fields"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ people });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getPeople = async (req, res) => {
  const { id } = req.params;

  try {
    const person = await peoples.findByPk(id);
    return res.status(200).json({ person });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const updatePeople = async (req, res) => {
  const { id } = req.params;
  const { custom_fields, ...rest } = req.body;

  try {
    const existing = await peoples.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const mergedFields = mergeCustomFields(
      existing.custom_fields,
      custom_fields
    );

    await peoples.update(
      { ...rest, custom_fields: mergedFields },
      { where: { id } }
    );

    const updated = await peoples.findByPk(id);

    return res.status(200).json({
      message: "Person updated successfully",
      person: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const deletePeople = async (req, res) => {
  const { id } = req.params;

  try {
    await peoples.destroy({ where: { id } });

    await removeEntityFromPipelines("people", id);

    return res.status(200).json({ message: "Person deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// ------------------------- COMPANIES -------------------------

const createCompany = async (req, res) => {
  const { organization_id, user_id } = req.user;

  const {
    name,
    domain,
    website,
    industry,
    size,
    location,
    tags,
    custom_fields,
  } = req.body;

  try {
    const defaultFields = companies.rawAttributes.custom_fields.defaultValue;

    const finalFields = mergeCustomFields(defaultFields, custom_fields);

    const company = await companies.create({
      organization_id,
      name,
      domain,
      website,
      industry,
      size,
      location,
      tags,
      custom_fields: finalFields,
      created_by: user_id,
    });

    return res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getAllCompanies = async (req, res) => {
  const { organization_id } = req.user;

  try {
    const list = await companies.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ companies: list });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await companies.findByPk(id);
    return res.status(200).json({ company });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { custom_fields, ...rest } = req.body;

  try {
    const existing = await companies.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const mergedFields = mergeCustomFields(
      existing.custom_fields,
      custom_fields
    );

    await companies.update(
      { ...rest, custom_fields: mergedFields },
      { where: { id } }
    );

    const updated = await companies.findByPk(id);

    return res.status(200).json({
      message: "Company updated successfully",
      company: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    await companies.destroy({ where: { id } });

    await removeEntityFromPipelines("company", id);

    return res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// ------------------------- DEALS -------------------------

const createDeal = async (req, res) => {
  const { organization_id, user_id } = req.user;
  const { title, contact_id, company_id, status, tags, custom_fields } =
    req.body;

  try {
    const defaultFields = deals.rawAttributes.custom_fields.defaultValue;

    const finalFields = mergeCustomFields(defaultFields, custom_fields);

    const deal = await deals.create({
      organization_id,
      title,
      contact_id,
      company_id,
      status,
      tags,
      custom_fields: finalFields,
      created_by: user_id,
    });

    return res.status(201).json({
      message: "Deal created successfully",
      deal,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getAllDeals = async (req, res) => {
  const { organization_id } = req.user;

  try {
    const list = await deals.findAll({
      where: { organization_id },
      include: [
        {
          model: companies,
          required: false,
          attributes: ["id", "name", "domain", "custom_fields"],
        },
        {
          model: peoples,
          required: false,
          attributes: ["id", "full_name", "emails", "custom_fields"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ deals: list });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getDeal = async (req, res) => {
  const { id } = req.params;

  try {
    const deal = await deals.findByPk(id);
    return res.status(200).json({ deal });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const updateDeal = async (req, res) => {
  const { id } = req.params;
  const { custom_fields, ...rest } = req.body;

  try {
    const existing = await deals.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const mergedFields = mergeCustomFields(
      existing.custom_fields,
      custom_fields
    );

    await deals.update(
      { ...rest, custom_fields: mergedFields },
      { where: { id } }
    );

    const updated = await deals.findByPk(id);

    return res.status(200).json({
      message: "Deal updated successfully",
      deal: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteDeal = async (req, res) => {
  const { id } = req.params;

  try {
    await deals.destroy({ where: { id } });

    await removeEntityFromPipelines("deal", id);

    return res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  createPeople,
  getAllPeople,
  getPeople,
  updatePeople,
  deletePeople,

  createCompany,
  getAllCompanies,
  getCompany,
  updateCompany,
  deleteCompany,

  createDeal,
  getAllDeals,
  getDeal,
  updateDeal,
  deleteDeal,

  createCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
