const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, queryOne } = require('../config/database');

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('role').optional().isIn(['customer', 'admin']).withMessage('Role must be either customer or admin'),
  body('adminKey').optional().trim() // Verification key for admins
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address, gender, role, adminKey } = req.body;
    const userRole = role || 'customer';

    // --- ADMIN SECURITY CHECK ---
    if (userRole === 'admin') {
      const MASTER_KEY = process.env.ADMIN_SECRET_KEY;
      if (!adminKey || adminKey !== MASTER_KEY) {
        return res.status(403).json({ message: 'Access Denied: Invalid Administrator Verification Key.' });
      }
    }

    // Split name for MySQL columns
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if user exists
    const existingUser = await queryOne('SELECT user_id FROM users WHERE user_email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = require('../config/database').getDb();

    // 1. Create User in Main Table
    const [userResult] = await db.execute(
      `INSERT INTO users (user_fname, user_lname, user_email, user_password, user_gender, user_contact, user_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, gender || null, phone || null, userRole]
    );

    const userId = userResult.insertId;

    // 2. Create Role-Specific Record (Admins or Customers)
    if (userRole === 'admin') {
      await db.execute(
        'INSERT INTO admins (admin_user_id, admin_level, admin_no_of_cars_owned, admin_address) VALUES (?, ?, ?, ?)',
        [userId, 'standard', 0, address || null]
      );
    } else {
      await db.execute(
        'INSERT INTO customers (customer_user_id, customer_license, customer_address) VALUES (?, ?, ?)',
        [userId, null, address || null]
      );
    }

    const token = jwt.sign(
      { id: userId, email, role: userRole },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, name: name.trim(), email, role: userRole }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await queryOne(
      'SELECT user_id, user_fname, user_lname, user_email, user_password, user_role FROM users WHERE user_email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.user_password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.user_id, email: user.user_email, role: user.user_role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: `${user.user_fname} ${user.user_lname}`.trim(),
        email: user.user_email,
        role: user.user_role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT user_id, user_fname, user_lname, user_email, user_gender, user_contact, user_role, created_at 
       FROM users WHERE user_id = ?`,
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.user_id,
      name: `${user.user_fname} ${user.user_lname}`.trim(),
      email: user.user_email,
      gender: user.user_gender,
      phone: user.user_contact,
      role: user.user_role,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;



