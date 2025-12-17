const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  addNewRole,
  getAllUsers,
  deleteRole,
  addNewUser,
  deleteUser,
  getAllRoles,
  updateUser,
  updateRole,
  verifyTeamToken,
  setTeamPassword,
} = require("../controllers/userManagementController");

const router = express.Router();

// Roles
router.get("/get-roles", verifyToken, getAllRoles);
router.post("/create-role", verifyToken, addNewRole);
router.put("/update-role", verifyToken, updateRole);
router.delete("/delete-role", verifyToken, deleteRole);

// Users
router.get("/get-users", verifyToken, getAllUsers);
router.post("/create-user", verifyToken, addNewUser);
router.put("/update-user", verifyToken, updateUser);
router.delete("/delete-user", verifyToken, deleteUser);

router.get("/verify-token", verifyTeamToken);
router.post("/set-password", setTeamPassword);

module.exports = router;
