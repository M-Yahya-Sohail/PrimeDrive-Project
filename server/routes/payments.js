const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { query, queryOne } = require('../config/database');

// Get payment details for a booking
router.get('/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await queryOne(`
      SELECT 
        b.booking_id as id, 
        b.booking_total_price as total_price, 
        b.booking_payment_status as payment_status, 
        b.booking_status as status, 
        c.car_make, 
        c.car_model,
        cust.customer_user_id
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (req.user.role !== 'admin' && booking.customer_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      id: booking.id,
      total_price: parseFloat(booking.total_price),
      payment_status: booking.payment_status,
      status: booking.status,
      car_make: booking.car_make,
      car_model: booking.car_model
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status (admin only)
router.put('/booking/:bookingId', authenticate, isAdmin, [
  body('payment_status').isIn(['paid', 'unpaid', 'partial']).withMessage('Valid payment status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { payment_status } = req.body;
    const bookingId = req.params.bookingId;

    const result = await query(
      'UPDATE bookings SET booking_payment_status = ? WHERE booking_id = ?',
      [payment_status, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = await queryOne(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    // Return response with car_make and car_model
    res.json({
      id: booking.booking_id,
      car_id: booking.booking_car_id,
      start_date: booking.booking_start_date,
      end_date: booking.booking_end_date,
      total_price: parseFloat(booking.booking_total_price),
      status: booking.booking_status,
      payment_status: booking.booking_payment_status,
      car_make: booking.car_make,
      car_model: booking.car_model,
      type: booking.type,
      user_name: booking.user_name,
      user_email: booking.user_email,
      created_at: booking.booking_created_at
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const payments = await query(`
      SELECT 
        b.booking_id as id, 
        b.booking_total_price as total_price, 
        b.booking_payment_status as payment_status, 
        b.booking_status as status, 
        b.booking_created_at as created_at,
        c.car_make, 
        c.car_model,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, 
        u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      ORDER BY b.booking_created_at DESC
    `);

    res.json(payments.map(payment => ({
      id: payment.id,
      total_price: parseFloat(payment.total_price),
      payment_status: payment.payment_status,
      status: payment.status,
      created_at: payment.created_at,
      car_make: payment.car_make,
      car_model: payment.car_model,
      user_name: payment.user_name,
      user_email: payment.user_email
    })));
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
