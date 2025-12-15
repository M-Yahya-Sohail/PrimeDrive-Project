const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { query, queryOne } = require('../config/database');

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT user_id, user_fname, user_lname, user_email, user_gender, user_contact, user_role, created_at 
       FROM users WHERE user_id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get customer or admin details
    let address = null;
    let license = null;
    
    if (user.user_role === 'customer') {
      const customerDetails = await queryOne(
        'SELECT customer_license, customer_address FROM customers WHERE customer_user_id = ?',
        [user.user_id]
      );
      if (customerDetails) {
        address = customerDetails.customer_address;
        license = customerDetails.customer_license;
      }
    } else if (user.user_role === 'admin') {
      const adminDetails = await queryOne(
        'SELECT admin_address FROM admins WHERE admin_user_id = ?',
        [user.user_id]
      );
      if (adminDetails) {
        address = adminDetails.admin_address;
      }
    }

    res.json({
      id: user.user_id,
      name: `${user.user_fname} ${user.user_lname}`.trim(),
      email: user.user_email,
      gender: user.user_gender,
      phone: user.user_contact,
      address: address,
      license: license,
      role: user.user_role,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('license').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, gender, license } = req.body;
    const updates = [];
    const values = [];

    // Update user table
    if (name) {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || '';
      updates.push('user_fname = ?', 'user_lname = ?');
      values.push(firstName, lastName);
    }
    if (phone !== undefined) {
      updates.push('user_contact = ?');
      values.push(phone);
    }
    if (gender !== undefined) {
      updates.push('user_gender = ?');
      values.push(gender);
    }

    if (updates.length > 0) {
      values.push(req.user.id);
      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    // Update customer or admin table based on role
    const user = await queryOne('SELECT user_role FROM users WHERE user_id = ?', [req.user.id]);
    if (user) {
      if (user.user_role === 'customer') {
        const customerUpdates = [];
        const customerValues = [];

        if (address !== undefined) {
          customerUpdates.push('customer_address = ?');
          customerValues.push(address);
        }
        if (license !== undefined) {
          customerUpdates.push('customer_license = ?');
          customerValues.push(license);
        }

        if (customerUpdates.length > 0) {
          customerValues.push(req.user.id);
          const result = await query(
            `UPDATE customers SET ${customerUpdates.join(', ')} WHERE customer_user_id = ?`,
            customerValues
          );
          console.log(`Customer profile updated for user_id: ${req.user.id}`, result);
        }
      } else if (user.user_role === 'admin') {
        // Check if admin record exists
        const adminExists = await queryOne(
          'SELECT admin_id FROM admins WHERE admin_user_id = ?',
          [req.user.id]
        );

        if (!adminExists) {
          // Create admin record if it doesn't exist
          console.log(`Admin record not found for user_id: ${req.user.id}, creating...`);
          await query(
            'INSERT INTO admins (admin_user_id, admin_level, admin_no_of_cars_owned, admin_address) VALUES (?, ?, ?, ?)',
            [req.user.id, 'standard', 0, address || null]
          );
          console.log(`Admin record created for user_id: ${req.user.id}`);
        } else {
          // Update existing admin record
          const adminUpdates = [];
          const adminValues = [];

          if (address !== undefined) {
            adminUpdates.push('admin_address = ?');
            adminValues.push(address);
          }

          if (adminUpdates.length > 0) {
            adminValues.push(req.user.id);
            const result = await query(
              `UPDATE admins SET ${adminUpdates.join(', ')} WHERE admin_user_id = ?`,
              adminValues
            );
            console.log(`Admin profile updated for user_id: ${req.user.id}`, result);
          }
        }
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await queryOne('SELECT user_password FROM users WHERE user_id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.user_password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET user_password = ? WHERE user_id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await query(`
      SELECT 
        u.user_id as id,
        CONCAT(u.user_fname, ' ', u.user_lname) as name,
        u.user_email as email,
        u.user_contact as phone,
        u.user_role as role,
        u.created_at
      FROM users u
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
