export const searchUsers = async (req, res, next) => {
  try {
    const { query: searchQuery = "", page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const searchTerm = `%${searchQuery}%`;

    // Total count
    const countResult = await query(
      `
      SELECT COUNT(*) 
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
      `,
      [searchTerm]
    );

    const total = parseInt(countResult.rows[0].count);

    // Paginated fetch
    const users = await query(
      `
      SELECT id, name, email
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [searchTerm, limitNum, offset]
    );

    res.json({
      success: true,
      page: pageNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      users: users.rows,
    });

  } catch (error) {
    next(error);
  }
};
