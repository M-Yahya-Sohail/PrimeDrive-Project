const nodemailer = require('nodemailer');

// Create transporter (configure with your email settings)
const createTransporter = () => {
  // For development, you can use a test account or configure with real SMTP
  // Using Gmail as example - you'll need to set up an App Password
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured. Skipping notification.');
      return;
    }

    const transporter = createTransporter();
    const userEmail = booking.user_email || booking.email;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Car Rental Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Confirmation</h2>
          <p>Dear ${booking.user_name || 'Customer'},</p>
          <p>Your car rental booking has been confirmed!</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Car:</strong> ${booking.brand} ${booking.model}</p>
            <p><strong>Type:</strong> ${booking.type}</p>
            <p><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
            <p><strong>Total Price:</strong> $${booking.total_price.toFixed(2)}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
          </div>
          <p>Thank you for choosing our car rental service!</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${userEmail}`);

    // Also notify admin
    await notifyAdminNewBooking(booking);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};

// Send cancellation confirmation email
const sendCancellationConfirmation = async (booking) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured. Skipping notification.');
      return;
    }

    const transporter = createTransporter();
    const userEmail = booking.user_email || booking.email;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Car Rental Booking Cancelled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Cancelled</h2>
          <p>Dear ${booking.user_name || 'Customer'},</p>
          <p>Your car rental booking has been cancelled.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Car:</strong> ${booking.brand} ${booking.model}</p>
            <p><strong>Type:</strong> ${booking.type}</p>
            <p><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
            <p><strong>Total Price:</strong> $${booking.total_price.toFixed(2)}</p>
          </div>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending cancellation confirmation email:', error);
  }
};

// Notify admin of new booking
const notifyAdminNewBooking = async (booking) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return;
    }

    const transporter = createTransporter();
    const db = require('../config/database').getDb();

    // Get admin email
    db.get("SELECT email FROM users WHERE role = 'admin' LIMIT 1", async (err, admin) => {
      if (err || !admin) {
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: 'New Car Rental Booking',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Booking Notification</h2>
            <p>A new car rental booking has been created.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Booking Details:</h3>
              <p><strong>Customer:</strong> ${booking.user_name}</p>
              <p><strong>Email:</strong> ${booking.user_email}</p>
              <p><strong>Car:</strong> ${booking.brand} ${booking.model}</p>
              <p><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
              <p><strong>Total Price:</strong> $${booking.total_price.toFixed(2)}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`New booking notification sent to admin`);
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

// Test email functions
const sendTestBookingEmail = async (email) => {
  const testBooking = {
    user_name: 'Test User',
    user_email: email,
    brand: 'Toyota',
    model: 'Camry',
    type: 'Sedan',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_price: 350,
    status: 'confirmed'
  };
  await sendBookingConfirmation(testBooking);
};

const sendTestCancellationEmail = async (email) => {
  const testBooking = {
    user_name: 'Test User',
    user_email: email,
    brand: 'Toyota',
    model: 'Camry',
    type: 'Sedan',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_price: 350
  };
  await sendCancellationConfirmation(testBooking);
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationConfirmation,
  notifyAdminNewBooking,
  sendTestBookingEmail,
  sendTestCancellationEmail
};





