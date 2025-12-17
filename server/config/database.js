const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let pool = null;

// Create MySQL connection pool
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
};

const init = async () => {
  try {
    pool = createPool();

    // Test connection
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database: ${process.env.DB_NAME}");
    connection.release();

    // Create default admin if not exists
    await createDefaultAdmin();

    return pool;
  } catch (error) {
    console.error("Error connecting to MySQL database:", error);
    throw error;
  }
};

const createDefaultAdmin = async () => {
  try {
    const defaultAdminEmail = "admin@primedrive.com";
    const defaultAdminPassword = "admin123";

    // Check if admin exists
    const [users] = await pool.execute(
      "SELECT user_id FROM users WHERE user_email = ?",
      [defaultAdminEmail]
    );

    if (users.length === 0) {
      // Hash password
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

      // Insert user
      const [result] = await pool.execute(
        `INSERT INTO users (user_fname, user_lname, user_email, user_password, user_role, user_contact) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "Admin",
          "User",
          defaultAdminEmail,
          hashedPassword,
          "admin",
          "1234567890",
        ]
      );

      const userId = result.insertId;

      // Insert admin
      await pool.execute(
        `INSERT INTO admins (admin_user_id, admin_level, admin_no_of_cars_owned, admin_address) 
         VALUES (?, ?, ?, ?)`,
        [userId, "super_admin", 0, null]
      );

      console.log(
        "Default admin user created: admin@primedrive.com / admin123"
      );
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
    // Don't throw - allow app to continue even if admin creation fails
  }
};

const getDb = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call init() first.");
  }
  return pool;
};

const close = async () => {
  if (pool) {
    await pool.end();
    console.log("MySQL connection pool closed");
  }
};

// Helper function to execute queries
const query = async (sql, params = []) => {
  const db = getDb();
  try {
    const [results] = await db.execute(sql, params);
    // For INSERT/UPDATE/DELETE, return the result object with insertId/affectedRows
    // For SELECT, return the array of rows
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Helper function to get a single row
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
};

module.exports = {
  init,
  getDb,
  close,
  query,
  queryOne,
};
