const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const {
  createPayment,
  validatePayment,
  transactionDetails,
} = require("../controllers/subscriptionController");

const router = express.Router();

router.post("/order", verifyToken, createPayment);
router.post("/order/validate", verifyToken, validatePayment);
router.get("/get-transactions", verifyToken, transactionDetails);

module.exports = router;
