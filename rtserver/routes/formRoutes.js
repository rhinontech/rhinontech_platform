const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const {
  getForms,
  updateForms,
  getFormsForChstbot,
  saveCustomerDetailsFromPreChatForm
} = require("../controllers/formController");

const router = express.Router();

router.get("/", verifyToken, getForms);
router.get("/chatbot-forms", getFormsForChstbot);
router.post("/update-forms", verifyToken, updateForms);

router.post("/save-prechat-forms-values", saveCustomerDetailsFromPreChatForm);

module.exports = router;
