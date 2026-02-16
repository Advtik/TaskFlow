
import express from "express";
import { searchUsers} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/search", protect, searchUsers);

export default router;