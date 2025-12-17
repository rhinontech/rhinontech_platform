const express = require("express");
const verifyToken = require("../../middleware/verifyToken");

const {
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
} = require("../../controllers/crmControllers/entitiesController");

const router = express.Router();

// PEOPLE
router.post("/people", verifyToken, createPeople);
router.get("/people", verifyToken, getAllPeople);
router.get("/people/:id", verifyToken, getPeople);
router.put("/people/:id", verifyToken, updatePeople);
router.delete("/people/:id", verifyToken, deletePeople);

// COMPANIES
router.post("/company", verifyToken, createCompany);
router.get("/company", verifyToken, getAllCompanies);
router.get("/company/:id", verifyToken, getCompany);
router.put("/company/:id", verifyToken, updateCompany);
router.delete("/company/:id", verifyToken, deleteCompany);

// DEALS
router.post("/deal", verifyToken, createDeal);
router.get("/deal", verifyToken, getAllDeals);
router.get("/deal/:id", verifyToken, getDeal);
router.put("/deal/:id", verifyToken, updateDeal);
router.delete("/deal/:id", verifyToken, deleteDeal);

//Customer
router.post("/customers", verifyToken, createCustomer);
router.get("/customers", verifyToken, getAllCustomers);
router.get("/customers/:id", verifyToken, getCustomer);
router.put("/customers/:id", verifyToken, updateCustomer);
router.delete("/customers/:id", verifyToken, deleteCustomer);

module.exports = router;
