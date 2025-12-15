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
  body('role').optional().isIn(['customer', 'admin']).withMessage('Role must be either customer or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address, gender, role } = req.body;
    const userRole = role || 'customer';
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT user_id FROM users WHERE user_email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - use database pool directly to get insertId
    const db = require('../config/database').getDb();
    const [userResult] = await db.execute(
      `INSERT INTO users (user_fname, user_lname, user_email, user_password, user_gender, user_contact, user_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, gender || null, phone || null, userRole]
    );

    const userId = userResult.insertId;
    
    if (!userId) {
      throw new Error('Failed to create user - no insertId returned');
    }

    // Create admin or customer record
    if (userRole === 'admin') {
      try {
        const [adminResult] = await db.execute(
          'INSERT INTO admins (admin_user_id, admin_level, admin_no_of_cars_owned, admin_address) VALUES (?, ?, ?, ?)',
          [userId, 'standard', 0, address || null]
        );
        console.log(`✅ Admin record created successfully for user_id: ${userId}, admin_id: ${adminResult.insertId}`);
      } catch (adminError) {
        console.error('❌ Error creating admin record:', adminError);
        // Rollback user creation if admin creation fails
        await db.execute('DELETE FROM users WHERE user_id = ?', [userId]);
        throw new Error('Failed to create admin record: ' + adminError.message);
      }
    } else {
      try {
        const [customerResult] = await db.execute(
          'INSERT INTO customers (customer_user_id, customer_license, customer_address) VALUES (?, ?, ?)',
          [userId, null, address || null]
        );
        console.log(`✅ Customer record created successfully for user_id: ${userId}, customer_id: ${customerResult.insertId}`);
      } catch (customerError) {
        console.error('❌ Error creating customer record:', customerError);
        // Rollback user creation if customer creation fails
        await db.execute('DELETE FROM users WHERE user_id = ?', [userId]);
        throw new Error('Failed to create customer record: ' + customerError.message);
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: userId, email, role: userRole },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: userRole
      }
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



