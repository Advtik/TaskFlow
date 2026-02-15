import express from "express";
import { query } from "./utils/query.js";

const app = express();
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const result = await query("SELECT NOW()");
  res.json({
    status: "TaskFlow API Running",
    dbTime: result.rows[0].now,
  });
});

export default app;
