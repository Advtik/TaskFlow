import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./src/index.js";
import { db } from "./src/db/connect.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Check DB before starting server
db.query("SELECT NOW()")
  .then(() => {
    console.log("Database connected successfully");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
