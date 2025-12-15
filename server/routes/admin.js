const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { query, queryOne } = require('../config/database');

// Get dashboard statistics
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    const stats = {};

    // Total cars
    const carsResult = await queryOne('SELECT COUNT(*) as count FROM cars');
    stats.totalCars = carsResult.count;

    // Total users
    const usersResult = await queryOne('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = usersResult.count;

    // Total bookings
    const bookingsResult = await queryOne('SELECT COUNT(*) as count FROM bookings');
    stats.totalBookings = bookingsResult.count;

    // Active rentals (confirmed bookings with current date between start and end)
    const today = new Date().toISOString().split('T')[0];
    const activeRentalsResult = await queryOne(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE booking_status = 'confirmed' 
      AND booking_start_date <= ? 
      AND booking_end_date >= ?
    `, [today, today]);
    stats.activeRentals = activeRentalsResult.count;

    // Total revenue
    const revenueResult = await queryOne(`
      SELECT SUM(booking_total_price) as total FROM bookings 
      WHERE booking_payment_status = 'paid'
    `);
    stats.totalRevenue = parseFloat(revenueResult.total) || 0;

    // Pending bookings
    const pendingResult = await queryOne('SELECT COUNT(*) as count FROM bookings WHERE booking_status = ?', ['pending']);
    stats.pendingBookings = pendingResult.count;

    // Recent bookings (last 7 days)
    const recentResult = await queryOne(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE booking_created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    stats.recentBookings = recentResult.count;

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics data
router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    const analytics = {};

    // Bookings by status
    const statusData = await query(`
      SELECT booking_status as status, COUNT(*) as count 
      FROM bookings 
      GROUP BY booking_status
    `);
    analytics.bookingsByStatus = statusData;

    // Bookings by month (last 6 months)
    const monthlyData = await query(`
      SELECT 
        DATE_FORMAT(booking_created_at, '%Y-%m') as month, 
        COUNT(*) as count, 
        SUM(booking_total_price) as revenue
      FROM bookings
      WHERE booking_created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `);
    analytics.monthlyBookings = monthlyData.map(item => ({
      month: item.month,
      count: item.count,
      revenue: parseFloat(item.revenue) || 0
    }));

    // Most popular cars
    const popularCars = await query(`
      SELECT 
        c.car_make, 
        c.car_model, 
        COUNT(b.booking_id) as booking_count
      FROM cars c
      LEFT JOIN bookings b ON c.car_id = b.booking_car_id
      GROUP BY c.car_id
      ORDER BY booking_count DESC
      LIMIT 10
    `);
    analytics.popularCars = popularCars.map(car => ({
      car_make: car.car_make,
      car_model: car.car_model,
      booking_count: car.booking_count
    }));

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
