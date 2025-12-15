const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { query, queryOne } = require('../config/database');

// Helper function to check car availability
const checkAvailability = async (carId, startDate, endDate, excludeBookingId = null) => {
  try {
    let sql = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE booking_car_id = ? 
      AND booking_status IN ('pending', 'confirmed')
      AND (
        (booking_start_date <= ? AND booking_end_date >= ?) OR
        (booking_start_date <= ? AND booking_end_date >= ?) OR
        (booking_start_date >= ? AND booking_end_date <= ?)
      )
    `;
    const params = [carId, startDate, startDate, endDate, endDate, startDate, endDate];
    
    if (excludeBookingId) {
      sql += ' AND booking_id != ?';
      params.push(excludeBookingId);
    }

    const result = await queryOne(sql, params);
    return result.count === 0;
  } catch (error) {
    console.error('Check availability error:', error);
    return false;
  }
};

// Calculate total price
const calculatePrice = async (carId, startDate, endDate) => {
  try {
    const car = await queryOne('SELECT car_hourly_rate FROM cars WHERE car_id = ?', [carId]);
    
    if (!car) {
      throw new Error('Car not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = parseFloat(car.car_hourly_rate) * days;
    return totalPrice;
  } catch (error) {
    throw error;
  }
};

// Get customer ID from user ID
const getCustomerId = async (userId) => {
  try {
    const customer = await queryOne(
      'SELECT customer_id FROM customers WHERE customer_user_id = ?',
      [userId]
    );
    return customer ? customer.customer_id : null;
  } catch (error) {
    console.error('Get customer ID error:', error);
    return null;
  }
};

// Create booking
router.post('/', authenticate, [
  body('car_id').isInt().withMessage('Valid car ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { car_id, start_date, end_date } = req.body;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates
    if (startDate < today) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Get customer ID
    const customerId = await getCustomerId(req.user.id);
    if (!customerId) {
      return res.status(400).json({ message: 'Customer profile not found. Please complete your profile.' });
    }

    // Check if car exists and is available
    const car = await queryOne('SELECT * FROM cars WHERE car_id = ? AND car_status = ?', [car_id, 'available']);
    if (!car) {
      return res.status(404).json({ message: 'Car not found or not available' });
    }

    // Check availability
    const isAvailable = await checkAvailability(car_id, start_date, end_date);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Car is not available for the selected dates' });
    }

    // Calculate price
    const totalPrice = await calculatePrice(car_id, start_date, end_date);

    // Create booking
    const result = await query(
      `INSERT INTO bookings (booking_customer_id, booking_car_id, booking_start_date, booking_end_date, booking_total_price, booking_status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, car_id, start_date, end_date, totalPrice, 'pending']
    );

    const bookingId = result.insertId;

    // Fetch complete booking with car and customer details
    const booking = await queryOne(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, c.car_image_url as image_url,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    // Return response with car_make and car_model
    const transformedBooking = {
      id: booking.booking_id,
      user_id: req.user.id,
      car_id: booking.booking_car_id,
      start_date: booking.booking_start_date,
      end_date: booking.booking_end_date,
      total_price: parseFloat(booking.booking_total_price),
      status: booking.booking_status,
      payment_status: booking.booking_payment_status,
      car_make: booking.car_make,
      car_model: booking.car_model,
      type: booking.type,
      image_url: booking.image_url,
      user_name: booking.user_name,
      user_email: booking.user_email,
      created_at: booking.booking_created_at
    };

    // Send notification (async, don't wait)
    const notificationService = require('../services/notificationService');
    notificationService.sendBookingConfirmation(transformedBooking).catch(console.error);

    res.status(201).json(transformedBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const customerId = await getCustomerId(req.user.id);
    if (!customerId) {
      return res.json([]);
    }

    const bookings = await query(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, 
        c.car_image_url as image_url, c.car_hourly_rate as price_per_day
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      WHERE b.booking_customer_id = ?
      ORDER BY b.booking_created_at DESC
    `, [customerId]);

    // Return response with car_make and car_model
    const transformedBookings = bookings.map(booking => ({
      id: booking.booking_id,
      user_id: req.user.id,
      car_id: booking.booking_car_id,
      start_date: booking.booking_start_date,
      end_date: booking.booking_end_date,
      total_price: parseFloat(booking.booking_total_price),
      status: booking.booking_status,
      payment_status: booking.booking_payment_status,
      car_make: booking.car_make,
      car_model: booking.car_model,
      type: booking.type,
      image_url: booking.image_url,
      price_per_day: parseFloat(booking.price_per_day),
      created_at: booking.booking_created_at
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const bookings = await query(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, c.car_image_url as image_url,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      ORDER BY b.booking_created_at DESC
    `);

    // Return response with car_make and car_model
    const transformedBookings = bookings.map(booking => ({
      id: booking.booking_id,
      customer_id: booking.booking_customer_id,
      car_id: booking.booking_car_id,
      start_date: booking.booking_start_date,
      end_date: booking.booking_end_date,
      total_price: parseFloat(booking.booking_total_price),
      status: booking.booking_status,
      payment_status: booking.booking_payment_status,
      car_make: booking.car_make,
      car_model: booking.car_model,
      type: booking.type,
      image_url: booking.image_url,
      user_name: booking.user_name,
      user_email: booking.user_email,
      created_at: booking.booking_created_at
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await queryOne(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, c.car_image_url as image_url, c.car_hourly_rate as price_per_day,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email,
        cust.customer_user_id
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      WHERE b.booking_id = ?
    `, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (req.user.role !== 'admin' && booking.customer_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return response with car_make and car_model
    res.json({
      id: booking.booking_id,
      user_id: booking.customer_user_id,
      car_id: booking.booking_car_id,
      start_date: booking.booking_start_date,
      end_date: booking.booking_end_date,
      total_price: parseFloat(booking.booking_total_price),
      status: booking.booking_status,
      payment_status: booking.booking_payment_status,
      car_make: booking.car_make,
      car_model: booking.car_model,
      type: booking.type,
      image_url: booking.image_url,
      price_per_day: parseFloat(booking.price_per_day),
      user_name: booking.user_name,
      user_email: booking.user_email,
      created_at: booking.booking_created_at
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking status
router.put('/:id/status', authenticate, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const bookingId = req.params.id;

    // Get booking
    const booking = await queryOne(`
      SELECT b.*, cust.customer_user_id
      FROM bookings b
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions: users can confirm or cancel their own bookings, admins can change any status
    if (req.user.role !== 'admin') {
      if (booking.customer_user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Customers can confirm (which marks as paid) or cancel their bookings
      if (status !== 'cancelled' && status !== 'confirmed') {
        return res.status(403).json({ message: 'You can only confirm or cancel your bookings' });
      }
      // Only allow confirming pending bookings
      if (status === 'confirmed' && booking.booking_status !== 'pending') {
        return res.status(400).json({ message: 'Only pending bookings can be confirmed' });
      }
    }

    // Update status and payment status
    // If status is being changed to 'confirmed', automatically mark as paid
    let paymentStatusUpdate = booking.booking_payment_status;
    if (status === 'confirmed' && booking.booking_payment_status !== 'paid') {
      paymentStatusUpdate = 'paid';
      await query(
        'UPDATE bookings SET booking_status = ?, booking_payment_status = ? WHERE booking_id = ?',
        [status, paymentStatusUpdate, bookingId]
      );
      console.log(`✅ Booking ${bookingId} confirmed and marked as paid by ${req.user.role === 'admin' ? 'admin' : 'customer'}`);
    } else {
      await query(
        'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
        [status, bookingId]
      );
    }

    // Fetch updated booking
    const updatedBooking = await queryOne(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, c.car_image_url as image_url,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      WHERE b.booking_id = ?
    `, [bookingId]);

    // Return response with car_make and car_model
    const transformedBooking = {
      id: updatedBooking.booking_id,
      car_id: updatedBooking.booking_car_id,
      start_date: updatedBooking.booking_start_date,
      end_date: updatedBooking.booking_end_date,
      total_price: parseFloat(updatedBooking.booking_total_price),
      status: updatedBooking.booking_status,
      payment_status: updatedBooking.booking_payment_status,
      car_make: updatedBooking.car_make,
      car_model: updatedBooking.car_model,
      type: updatedBooking.type,
      image_url: updatedBooking.image_url,
      user_name: updatedBooking.user_name,
      user_email: updatedBooking.user_email,
      created_at: updatedBooking.booking_created_at
    };

    // Send notification if cancelled or confirmed
    const notificationService = require('../services/notificationService');
    if (status === 'cancelled') {
      notificationService.sendCancellationConfirmation(transformedBooking).catch(console.error);
    } else if (status === 'confirmed' && paymentStatusUpdate === 'paid') {
      // Send confirmation notification when customer confirms and payment is marked as paid
      notificationService.sendBookingConfirmation(transformedBooking).catch(console.error);
    }

    res.json(transformedBooking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await queryOne(`
      SELECT b.*, cust.customer_user_id
      FROM bookings b
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      WHERE b.booking_id = ?
    `, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (req.user.role !== 'admin' && booking.customer_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (booking.booking_status === 'completed' || booking.booking_status === 'cancelled') {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Update status to cancelled
    await query(
      'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
      ['cancelled', req.params.id]
    );

    // Fetch updated booking
    const updatedBooking = await queryOne(`
      SELECT 
        b.*,
        c.car_make, c.car_model, c.car_type as type, c.car_image_url as image_url,
        CONCAT(u.user_fname, ' ', u.user_lname) as user_name, u.user_email as user_email
      FROM bookings b
      INNER JOIN cars c ON b.booking_car_id = c.car_id
      INNER JOIN customers cust ON b.booking_customer_id = cust.customer_id
      INNER JOIN users u ON cust.customer_user_id = u.user_id
      WHERE b.booking_id = ?
    `, [req.params.id]);

    // Return response with car_make and car_model
    const transformedBooking = {
      id: updatedBooking.booking_id,
      car_id: updatedBooking.booking_car_id,
      start_date: updatedBooking.booking_start_date,
      end_date: updatedBooking.booking_end_date,
      total_price: parseFloat(updatedBooking.booking_total_price),
      status: updatedBooking.booking_status,
      payment_status: updatedBooking.booking_payment_status,
      car_make: updatedBooking.car_make,
      car_model: updatedBooking.car_model,
      type: updatedBooking.type,
      image_url: updatedBooking.image_url,
      user_name: updatedBooking.user_name,
      user_email: updatedBooking.user_email,
      created_at: updatedBooking.booking_created_at
    };

    // Send cancellation notification
    const notificationService = require('../services/notificationService');
    notificationService.sendCancellationConfirmation(transformedBooking).catch(console.error);

    res.json(transformedBooking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
