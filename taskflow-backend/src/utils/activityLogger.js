import { query } from "./query.js";
import { io } from "../../server.js";

export const logActivity = async ({
  boardId,
  userId,
  actionType,
  entityType,
  entityId,
  metadata = {}
}) => {
  const result = await query(
    `
    INSERT INTO activities
    (board_id, user_id, action_type, entity_type, entity_id, metadata)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [boardId, userId, actionType, entityType, entityId, metadata]
  );

  const activity = result.rows[0];

  io.to(boardId).emit("activity:new", activity);

  return activity;
};
