import { query } from "../utils/query.js";
import { db } from "../db/connect.js";
import { logActivity } from "../utils/activityLogger.js";


export const createTask = async (req, res, next) => {
  try {
    const { listId, title, description, due_date } = req.body;
    const userId = req.user.id;

    if (!listId || !title) {
      return res.status(400).json({
        success: false,
        message: "List ID and title are required",
      });
    }

    // 1️⃣ Get list to derive board
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    const boardId = listResult.rows[0].board_id;

    // 2️⃣ Check membership
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

    // 3️⃣ Get next position
    const posResult = await query(
      "SELECT COALESCE(MAX(position),0) AS max FROM tasks WHERE list_id = $1",
      [listId]
    );

    const newPosition = posResult.rows[0].max + 1;

    // 4️⃣ Insert task
    const result = await query(
      `
      INSERT INTO tasks
      (list_id, title, description, due_date, position, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        listId,
        title,
        description || null,
        due_date || null,
        newPosition,
        userId,
      ]
    );

    await logActivity({
        boardId: boardId,
        userId: userId,
        actionType: "TASK_CREATED",
        entityType: "task",
        entityId: result.rows[0].id,
        metadata: {
            title: title
        }
    });

    res.status(201).json({
      success: true,
      task: result.rows[0],
    });

  } catch (error) {
    next(error);
  }
};



export const getTasksByList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Get list
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    const boardId = listResult.rows[0].board_id;

    // 2️⃣ Check membership
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

    // 3️⃣ Fetch tasks ordered
    const tasks = await query(
      `
      SELECT *
      FROM tasks
      WHERE list_id = $1
      ORDER BY position ASC
      `,
      [listId]
    );

    res.json({
      success: true,
      tasks: tasks.rows,
    });

  } catch (error) {
    next(error);
  }
};


export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, due_date } = req.body;
    const userId = req.user.id;

    // 1️⃣ Get task
    const taskResult = await query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const listId = taskResult.rows[0].list_id;

    // 2️⃣ Get board from list
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check membership
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

    // 4️⃣ Update
    const updated = await query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date)
      WHERE id = $4
      RETURNING *
      `,
      [
        title || null,
        description || null,
        due_date || null,
        taskId,
      ]
    );

    res.json({
      success: true,
      task: updated.rows[0],
    });

  } catch (error) {
    next(error);
  }
};



export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Get task
    const taskResult = await query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const listId = taskResult.rows[0].list_id;

    // 2️⃣ Get board from list
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check membership
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

    // Get task title for logging
    const taskInfo = await query(
    "SELECT title FROM tasks WHERE id = $1",
    [taskId]
    );

    // 4️⃣ Delete task
    await query(
      "DELETE FROM tasks WHERE id = $1",
      [taskId]
    );

    await logActivity({
        boardId: boardId,
        userId: userId,
        actionType: "TASK_DELETED",
        entityType: "task",
        entityId: taskId,
        metadata: {
            title: taskInfo.rows[0]?.title
        }
    });


    res.json({
      success: true,
      message: "Task deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};



export const moveTask = async (req, res, next) => {
  const client = await db.connect();

  try {
    const { taskId } = req.params;
    const { targetListId, newPosition } = req.body;
    const userId = req.user.id;

    if (!targetListId || !newPosition) {
      return res.status(400).json({
        success: false,
        message: "targetListId and newPosition are required",
      });
    }

    await client.query("BEGIN");

    // 1️⃣ Fetch task
    const taskResult = await client.query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error("Task not found");
    }

    const sourceListId = taskResult.rows[0].list_id;

    // 2️⃣ Get board from source list
    const listResult = await client.query(
      "SELECT board_id FROM lists WHERE id = $1",
      [sourceListId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check membership
    const membership = await client.query(
      "SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (membership.rows.length === 0) {
      throw new Error("Access denied");
    }

    // 4️⃣ Get all tasks from source list (excluding current task)
    const sourceTasks = await client.query(
      "SELECT id FROM tasks WHERE list_id = $1 AND id != $2 ORDER BY position ASC",
      [sourceListId, taskId]
    );

    // Reassign positions in source list
    for (let i = 0; i < sourceTasks.rows.length; i++) {
      await client.query(
        "UPDATE tasks SET position = $1 WHERE id = $2",
        [i + 1, sourceTasks.rows[i].id]
      );
    }

    // 5️⃣ Get tasks in target list
    const targetTasks = await client.query(
      "SELECT id FROM tasks WHERE list_id = $1 ORDER BY position ASC",
      [targetListId]
    );

    const tasksArray = targetTasks.rows.map(t => t.id);

    // Insert moved task into correct position (0-based index)
    const insertIndex = Math.max(0, Math.min(newPosition - 1, tasksArray.length));
    tasksArray.splice(insertIndex, 0, taskId);

    // 6️⃣ Update moved task list_id
    await client.query(
      "UPDATE tasks SET list_id = $1 WHERE id = $2",
      [targetListId, taskId]
    );

    // 7️⃣ Reassign positions in target list
    for (let i = 0; i < tasksArray.length; i++) {
      await client.query(
        "UPDATE tasks SET position = $1 WHERE id = $2",
        [i + 1, tasksArray[i]]
      );
    }

    await client.query("COMMIT");

    await logActivity({
        boardId: boardId,
        userId: userId,
        actionType: "TASK_MOVED",
        entityType: "task",
        entityId: taskId,
        metadata: {
            fromList: sourceListId,
            toList: targetListId,
            newPosition: newPosition
        }
    });


    res.json({
      success: true,
      message: "Task moved successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};


export const assignUserToTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 1️⃣ Get task
    const taskResult = await query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const listId = taskResult.rows[0].list_id;

    // 2️⃣ Get board
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check current user membership
    const membership = await query(
      "SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 4️⃣ Check target user membership
    const targetMembership = await query(
      "SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (targetMembership.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this board",
      });
    }

    // 5️⃣ Insert assignment
    await query(
      `
      INSERT INTO task_assignments (task_id, user_id)
      VALUES ($1,$2)
      ON CONFLICT (task_id, user_id) DO NOTHING
      `,
      [taskId, userId]
    );

    await logActivity({
        boardId: boardId,
        userId: currentUserId,
        actionType: "TASK_ASSIGNED",
        entityType: "task",
        entityId: taskId,
        metadata: {
            assignedUserId: userId
        }
    });


    res.status(201).json({
      success: true,
      message: "User assigned successfully",
    });

  } catch (error) {
    next(error);
  }
};



export const removeUserFromTask = async (req, res, next) => {
  try {
    const { taskId, userId } = req.params;
    const currentUserId = req.user.id;

    // 1️⃣ Get task
    const taskResult = await query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const listId = taskResult.rows[0].list_id;

    // 2️⃣ Get board
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check membership
    const membership = await query(
      "SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 4️⃣ Delete assignment
    await query(
      "DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2",
      [taskId, userId]
    );

    res.json({
      success: true,
      message: "Assignment removed successfully",
    });

  } catch (error) {
    next(error);
  }
};



export const getTaskAssignees = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Get task
    const taskResult = await query(
      "SELECT list_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const listId = taskResult.rows[0].list_id;

    // 2️⃣ Get board
    const listResult = await query(
      "SELECT board_id FROM lists WHERE id = $1",
      [listId]
    );

    const boardId = listResult.rows[0].board_id;

    // 3️⃣ Check membership
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

    // 4️⃣ Get assignees
    const assignees = await query(
      `
      SELECT u.id, u.name, u.email
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
      `,
      [taskId]
    );

    res.json({
      success: true,
      assignees: assignees.rows,
    });

  } catch (error) {
    next(error);
  }
};

