import { db } from "../db/connect.js";

export const query = async (text, params) => {
  try {
    const result = await db.query(text, params);
    return result;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  }
};
