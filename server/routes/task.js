const express = require("express");
// CONTROLLER FUNCTIONS
const {
  createTask,
  getAllTasks,
  editTask,
  getSingleTask,
  deleteTask,
  checkOffTask,
} = require("../controller/chore.js");
// MIDDLEWARE
const { verifyToken } = require("../middleware/auth.js");

const router = express.Router();

//ROUTES
router.get("/", verifyToken, getAllTasks); // Get all chores for a user
router.get("/:id", verifyToken, getSingleTask); // Get a single chore
router.put("/:id", verifyToken, editTask); // Edit a chore
router.put("/:id/checked/", verifyToken, checkOffTask); // Check off a chore
router.post("/", verifyToken, createTask); // Create a chore
router.delete("/:id", verifyToken, deleteTask); // Delete a chore

module.exports = router;
