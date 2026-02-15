import express from "express";
import { createBoard,getUserBoards,getSingleBoard, addBoardMember, removeBoardMember, getBoardMembers, getBoardActivity} from "../controllers/boardController.js";
import { protect } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/", protect, createBoard);
router.get("/", protect, getUserBoards);
router.get("/:id", protect, getSingleBoard);
router.post("/:boardId/members", protect, addBoardMember);
router.delete("/:boardId/members/:userId", protect, removeBoardMember);
router.get("/:boardId/members", protect, getBoardMembers);
router.get("/:boardId/activity", protect, getBoardActivity);


export default router;
