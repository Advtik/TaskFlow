import express from "express";
import { createTask, getTasksByList, updateTask, deleteTask, moveTask, assignUserToTask, removeUserFromTask, getTaskAssignees, searchTasks } from "../controllers/taskController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTask);
router.get("/list/:listId", protect, getTasksByList);
router.put("/:taskId", protect, updateTask);
router.delete("/:taskId", protect, deleteTask);
router.patch("/:taskId/move", protect, moveTask);
router.post("/:taskId/assign", protect, assignUserToTask);
router.delete("/:taskId/assign/:userId", protect, removeUserFromTask);
router.get("/:taskId/assignees", protect, getTaskAssignees);
router.get("/search", protect, searchTasks);

export default router;
