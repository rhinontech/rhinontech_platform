const express = require("express");
const {
  updateOrCreateUser,
  getUser,
  deleteUser,
} = require("../controllers/providerController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/user", verifyToken, updateOrCreateUser);
router.post("/get-user", verifyToken, getUser);
router.delete("/delete-user", verifyToken, deleteUser);

module.exports = router;
