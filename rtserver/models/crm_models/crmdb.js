const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../../config/config.js").crmdb;

const crmdb = {};

const sequelizeCrmDB = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// load models from /crm_models
fs.readdirSync(path.join(__dirname))
  .filter(
    (file) =>
      file.endsWith(".js") &&
      file !== "crmdb.js" && // ignore this file
      !file.startsWith(".")
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelizeCrmDB,
      Sequelize.DataTypes
    );
    crmdb[model.name] = model;
  });

// Views → Groups
crmdb.views.belongsTo(crmdb.groups, { foreignKey: "group_id" });
crmdb.groups.hasMany(crmdb.views, { foreignKey: "group_id" });

// Pipelines → Views (NEW main relation)
crmdb.pipelines.belongsTo(crmdb.views, { foreignKey: "view_id" });
crmdb.views.hasMany(crmdb.pipelines, { foreignKey: "view_id" });

// People → Company
crmdb.peoples.belongsTo(crmdb.companies, { foreignKey: "company_id" });
crmdb.companies.hasMany(crmdb.peoples, { foreignKey: "company_id" });

// deals → People
crmdb.deals.belongsTo(crmdb.peoples, { foreignKey: "contact_id" });
crmdb.peoples.hasMany(crmdb.deals, { foreignKey: "contact_id" });

// deals → Companies
crmdb.deals.belongsTo(crmdb.companies, { foreignKey: "company_id" });
crmdb.companies.hasMany(crmdb.deals, { foreignKey: "company_id" });

// UNIVERSAL History → Pipeline
crmdb.pipeline_stage_histories.belongsTo(crmdb.pipelines, {
  foreignKey: "pipeline_id",
});
crmdb.pipelines.hasMany(crmdb.pipeline_stage_histories, {
  foreignKey: "pipeline_id",
});

// No direct FK for entity_id because it's dynamic

crmdb.sequelize = sequelizeCrmDB;
crmdb.Sequelize = Sequelize;

module.exports = crmdb;
