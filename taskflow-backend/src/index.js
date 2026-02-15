import express from "express";
import authRoutes from "./routes/authroutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";


const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "TaskFlow API Running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/tasks", taskRoutes);



app.get("/api/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

export default app;
