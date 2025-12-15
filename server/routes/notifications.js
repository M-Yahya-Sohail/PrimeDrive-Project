const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Test notification endpoint (admin only)
router.post('/test', authenticate, isAdmin, async (req, res) => {
  try {
    const { email, type } = req.body;
    
    if (type === 'booking') {
      await notificationService.sendTestBookingEmail(email);
    } else if (type === 'cancellation') {
      await notificationService.sendTestCancellationEmail(email);
    } else {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.json({ message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});

module.exports = router;





