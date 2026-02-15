import express from "express";
import { createList, getListsByBoard, updateList, deleteList } from "../controllers/listController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createList);
router.get("/:boardId", protect, getListsByBoard);
router.put("/:id", protect, updateList);
router.delete("/:id", protect, deleteList);

export default router;
