import { query } from "../utils/query.js";

export const createList = async (req, res, next) => {
  try {
    const { boardId, title } = req.body;
    const userId = req.user.id;

    if (!boardId || !title) {
      return res.status(400).json({
        success: false,
        message: "Board ID and title are required",
      });
    }

    // Check membership
    const membership = await query(
      "SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find max position in this board
    const positionResult = await query(
      "SELECT COALESCE(MAX(position), 0) AS max FROM lists WHERE board_id = $1",
      [boardId]
    );

    const newPosition = positionResult.rows[0].max + 1;

    // Insert list
    const result = await query(
      "INSERT INTO lists (board_id, title, position) VALUES ($1,$2,$3) RETURNING *",
      [boardId, title, newPosition]
    );

    await logActivity({
        boardId: boardId,
        userId: userId,
        actionType: "LIST_CREATED",
        entityType: "list",
        entityId: result.rows[0].id,
        metadata: {
            title: title
        }
    });


    res.status(201).json({
      success: true,
      list: result.rows[0],
    });

  } catch (error) {
    next(error);
  }
};


export const getListsByBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await query(
      "SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const result = await query(
      `
      SELECT *
      FROM lists
      WHERE board_id = $1
      ORDER BY position ASC
      `,
      [boardId]
    );

    res.json({
      success: true,
      lists: result.rows,
    });

  } catch (error) {
    next(error);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Get list with board_id
    const listResult = await query(
      "SELECT * FROM lists WHERE id = $1",
      [id]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    const list = listResult.rows[0];

    // Check membership
    const membership = await query(
      "SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2",
      [list.board_id, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update
    const updated = await query(
      "UPDATE lists SET title = $1 WHERE id = $2 RETURNING *",
      [title, id]
    );

    res.json({
      success: true,
      list: updated.rows[0],
    });

  } catch (error) {
    next(error);
  }
};


export const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listResult = await query(
      "SELECT * FROM lists WHERE id = $1",
      [id]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    const list = listResult.rows[0];

    // Check membership
    const membership = await query(
      "SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2",
      [list.board_id, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const listInfo = await query(
        "SELECT title FROM lists WHERE id = $1",
        [id]
    );

    await query(
      "DELETE FROM lists WHERE id = $1",
      [id]
    );

    await logActivity({
        boardId: boardId,
        userId: userId,
        actionType: "LIST_DELETED",
        entityType: "list",
        entityId: listId,
        metadata: {
            title: listInfo.rows[0]?.title
        }
    });


    res.json({
      success: true,
      message: "List deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};
