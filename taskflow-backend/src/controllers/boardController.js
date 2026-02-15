import { db } from "../db/connect.js";
import { query } from "../utils/query.js";
import { logActivity } from "../utils/activityLogger.js";


export const createBoard = async (req, res, next) => {
  const client = await db.connect();

  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Board title is required",
      });
    }

    const userId = req.user.id;

    await client.query("BEGIN");

    const boardResult = await client.query(
      "INSERT INTO boards (title, owner_id) VALUES ($1,$2) RETURNING *",
      [title, userId]
    );

    const board = boardResult.rows[0];

    await client.query(
      "INSERT INTO board_members (board_id, user_id, role) VALUES ($1,$2,$3)",
      [board.id, userId, "admin"]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      board,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

export const getUserBoards = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `
      SELECT b.*
      FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE bm.user_id = $1
      ORDER BY b.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      boards: result.rows,
    });

  } catch (error) {
    next(error);
  }
};


export const getSingleBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await query(
      `
      SELECT * FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Fetch board
    const boardResult = await query(
      "SELECT * FROM boards WHERE id = $1",
      [id]
    );

    if (boardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    res.json({
      success: true,
      board: boardResult.rows[0],
    });

  } catch (error) {
    next(error);
  }
};



export const addBoardMember = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 1️⃣ Check current user membership + role
    const currentMember = await query(
      `
      SELECT role FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, currentUserId]
    );

    if (currentMember.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (currentMember.rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can add members",
      });
    }

    // 2️⃣ Check target user exists
    const userExists = await query(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Check if already member
    const alreadyMember = await query(
      `
      SELECT id FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, userId]
    );

    if (alreadyMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    // 4️⃣ Insert member
    const result = await query(
      `
      INSERT INTO board_members (board_id, user_id, role)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [boardId, userId, role || "member"]
    );

    await logActivity({
        boardId: boardId,
        userId: currentUserId,
        actionType: "MEMBER_ADDED",
        entityType: "board",
        entityId: boardId,
        metadata: {
            addedUserId: userId
        }
    });


    res.status(201).json({
      success: true,
      member: result.rows[0],
    });

  } catch (error) {
    next(error);
  }
};


export const removeBoardMember = async (req, res, next) => {
  try {
    const { boardId, userId } = req.params;
    const currentUserId = req.user.id;

    // 1️⃣ Check current user role
    const currentMember = await query(
      `
      SELECT role FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, currentUserId]
    );

    if (currentMember.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (currentMember.rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can remove members",
      });
    }

    // 2️⃣ Check target exists in board
    const targetMember = await query(
      `
      SELECT role FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, userId]
    );

    if (targetMember.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // 3️⃣ Prevent removing last admin
    if (targetMember.rows[0].role === "admin") {
      const adminCount = await query(
        `
        SELECT COUNT(*) FROM board_members
        WHERE board_id = $1 AND role = 'admin'
        `,
        [boardId]
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove last admin",
        });
      }
    }

    // 4️⃣ Delete member
    await query(
      `
      DELETE FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, userId]
    );

    await logActivity({
        boardId: boardId,
        userId: currentUserId,
        actionType: "MEMBER_REMOVED",
        entityType: "board",
        entityId: boardId,
        metadata: {
            removedUserId: userId
        }
    });


    res.json({
      success: true,
      message: "Member removed successfully",
    });

  } catch (error) {
    next(error);
  }
};


export const getBoardMembers = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check membership
    const membership = await query(
      `
      SELECT id FROM board_members
      WHERE board_id = $1 AND user_id = $2
      `,
      [boardId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 2️⃣ Fetch members
    const result = await query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        bm.role,
        bm.joined_at
      FROM board_members bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.board_id = $1
      ORDER BY bm.joined_at ASC
      `,
      [boardId]
    );

    res.json({
      success: true,
      members: result.rows,
    });

  } catch (error) {
    next(error);
  }
};




export const getBoardActivity = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await query(
      "SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const activities = await query(
      `
      SELECT a.*, u.name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.board_id = $1
      ORDER BY a.created_at DESC
      LIMIT 50
      `,
      [boardId]
    );

    res.json({
      success: true,
      activities: activities.rows,
    });

  } catch (error) {
    next(error);
  }
};
