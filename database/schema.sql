-- ============================================
-- PrimeDrive Car Rental System
-- MySQL Database Schema (Normalized)
-- ============================================

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE (Base user information)
-- ============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_fname VARCHAR(100) NOT NULL,
    user_lname VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    user_contact VARCHAR(20) DEFAULT NULL,
    user_role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (user_email),
    INDEX idx_role (user_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMINS TABLE (Admin-specific information)
-- ============================================
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    admin_level VARCHAR(50) DEFAULT 'standard',
    admin_no_of_cars_owned INT DEFAULT 0,
    admin_address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_user (admin_user_id),
    INDEX idx_admin_user (admin_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMERS TABLE (Customer-specific information)
-- ============================================
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_user_id INT NOT NULL,
    customer_license VARCHAR(100) DEFAULT NULL,
    customer_address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_user (customer_user_id),
    INDEX idx_customer_user (customer_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CARS TABLE (Car information)
-- ============================================
CREATE TABLE cars (
    car_id INT AUTO_INCREMENT PRIMARY KEY,
    car_reg_no VARCHAR(50) UNIQUE NOT NULL,
    car_make VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    car_year INT NOT NULL,
    car_type VARCHAR(50) NOT NULL,
    car_hourly_rate DECIMAL(10, 2) NOT NULL,
    car_status ENUM('available', 'rented', 'maintenance', 'unavailable') DEFAULT 'available',
    car_mileage INT DEFAULT 0,
    car_color VARCHAR(50) DEFAULT NULL,
    car_location VARCHAR(255) DEFAULT NULL,
    car_description TEXT DEFAULT NULL,
    car_image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reg_no (car_reg_no),
    INDEX idx_status (car_status),
    INDEX idx_type (car_type),
    INDEX idx_make_model (car_make, car_model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BOOKINGS TABLE (Rental bookings)
-- ============================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_customer_id INT NOT NULL,
    booking_car_id INT NOT NULL,
    booking_start_date DATE NOT NULL,
    booking_end_date DATE NOT NULL,
    booking_start_time TIME DEFAULT NULL,
    booking_end_time TIME DEFAULT NULL,
    booking_total_price DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    booking_payment_status ENUM('paid', 'unpaid', 'partial') DEFAULT 'unpaid',
    booking_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booking_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_car_id) REFERENCES cars(car_id) ON DELETE CASCADE,
    INDEX idx_customer (booking_customer_id),
    INDEX idx_car (booking_car_id),
    INDEX idx_status (booking_status),
    INDEX idx_dates (booking_start_date, booking_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- ============================================
-- Password: admin123 (hashed with bcrypt)
-- Note: This hash will be created by the application on first run
-- The application will automatically create the admin user if it doesn't exist
-- Default credentials: admin@primedrive.com / admin123

-- ============================================
-- VIEWS FOR EASIER DATA ACCESS
-- ============================================

-- View for admin with user details
CREATE OR REPLACE VIEW v_admin_details AS
SELECT 
    a.admin_id,
    a.admin_user_id,
    u.user_id,
    u.user_fname,
    u.user_lname,
    u.user_email,
    u.user_gender,
    u.user_contact,
    a.admin_level,
    a.admin_no_of_cars_owned,
    a.admin_address,
    u.created_at
FROM admins a
INNER JOIN users u ON a.admin_user_id = u.user_id;

-- View for customer with user details
CREATE OR REPLACE VIEW v_customer_details AS
SELECT 
    c.customer_id,
    c.customer_user_id,
    u.user_id,
    u.user_fname,
    u.user_lname,
    u.user_email,
    u.user_gender,
    u.user_contact,
    c.customer_license,
    c.customer_address,
    u.created_at
FROM customers c
INNER JOIN users u ON c.customer_user_id = u.user_id;

-- View for booking details with customer and car info
CREATE OR REPLACE VIEW v_booking_details AS
SELECT 
    b.booking_id,
    b.booking_customer_id,
    b.booking_car_id,
    b.booking_start_date,
    b.booking_end_date,
    b.booking_start_time,
    b.booking_end_time,
    b.booking_total_price,
    b.booking_status,
    b.booking_payment_status,
    b.booking_created_at,
    CONCAT(cd.user_fname, ' ', cd.user_lname) AS customer_name,
    cd.user_email AS customer_email,
    cd.user_contact AS customer_contact,
    CONCAT(car.car_make, ' ', car.car_model) AS car_name,
    car.car_reg_no,
    car.car_type,
    car.car_hourly_rate
FROM bookings b
INNER JOIN v_customer_details cd ON b.booking_customer_id = cd.customer_id
INNER JOIN cars car ON b.booking_car_id = car.car_id;

