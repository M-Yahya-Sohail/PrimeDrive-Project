# PrimeDrive Database Setup Guide

## Database Information
- **Database Name**: primedrive
- **Database Type**: MySQL
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

## Database Structure

### Normalized Tables

1. **users** - Base user information (shared by admins and customers)
2. **admins** - Admin-specific information (linked to users)
3. **customers** - Customer-specific information (linked to users)
4. **cars** - Car inventory information
5. **bookings** - Rental bookings and reservations

### Relationships
- `admins.admin_user_id` → `users.user_id` (One-to-One)
- `customers.customer_user_id` → `users.user_id` (One-to-One)
- `bookings.booking_customer_id` → `customers.customer_id` (Many-to-One)
- `bookings.booking_car_id` → `cars.car_id` (Many-to-One)

## Setup Instructions

### Local Development Setup

1. **Install MySQL** (if not already installed)
   ```bash
   # Windows: Download MySQL Installer
   # Mac: brew install mysql
   # Linux: sudo apt-get install mysql-server
   ```

2. **Start MySQL Service**
   ```bash
   # Windows: Start MySQL from Services
   # Mac/Linux: sudo systemctl start mysql
   ```

3. **Create Database**
   ```bash
   mysql -u root -p
   ```
   Then run:
   ```sql
   CREATE DATABASE primedrive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

4. **Import Schema**
   ```bash
   mysql -u root -p primedrive < database/schema.sql
   ```

### AwardSpace Free Hosting Setup

#### Step 1: Create Account at AwardSpace
1. Go to https://www.awardspace.com/
2. Sign up for free hosting
3. Complete email verification

#### Step 2: Access Control Panel
1. Login to AwardSpace Control Panel
2. Navigate to "MySQL Databases" section

#### Step 3: Create Database
1. Click "Create Database"
2. Database Name: `primedrive` (or `yourusername_primedrive`)
3. Note down the database name (usually prefixed with your username)

#### Step 4: Create Database User
1. Go to "MySQL Users" section
2. Create a new user:
   - Username: `primedrive_user` (or your preferred name)
   - Password: (Choose a strong password)
3. Note down the username and password

#### Step 5: Grant Privileges
1. Go to "User Privileges"
2. Assign the user to the `primedrive` database
3. Grant ALL privileges

#### Step 6: Import Database Schema
1. Go to phpMyAdmin (usually available in Control Panel)
2. Select your `primedrive` database
3. Click "Import" tab
4. Choose file: `database/schema.sql`
5. Click "Go" to import

#### Step 7: Get Connection Details
From AwardSpace Control Panel, note:
- **Database Host**: Usually `localhost` or `mysql.yourdomain.com`
- **Database Name**: `yourusername_primedrive`
- **Database User**: `yourusername_primedrive_user`
- **Database Password**: (The password you set)
- **Port**: Usually `3306`

## Database Connection String Format

```
Host: localhost (or mysql.yourdomain.com)
Database: primedrive
Username: primedrive_user
Password: [your_password]
Port: 3306
```

## Default Admin Credentials

After setup, default admin account:
- **Email**: admin@primedrive.com
- **Password**: admin123

**Important**: Change the default password after first login!

## Views Available

1. **v_admin_details** - Admin information with user details
2. **v_customer_details** - Customer information with user details
3. **v_booking_details** - Complete booking information with customer and car details

## Backup Instructions

### Using MySQL Command Line
```bash
mysqldump -u username -p primedrive > primedrive_backup.sql
```

### Using phpMyAdmin
1. Select `primedrive` database
2. Click "Export" tab
3. Choose "Quick" or "Custom" method
4. Click "Go" to download backup

## Restore Instructions

### Using MySQL Command Line
```bash
mysql -u username -p primedrive < primedrive_backup.sql
```

### Using phpMyAdmin
1. Select `primedrive` database
2. Click "Import" tab
3. Choose backup file
4. Click "Go" to restore

## Troubleshooting

### Connection Issues
- Verify database credentials in `.env` file
- Check if MySQL service is running
- Verify firewall settings allow MySQL connections

### Import Errors
- Ensure MySQL version is 5.7 or higher
- Check file encoding (should be UTF-8)
- Verify user has CREATE and INSERT privileges

### Character Encoding Issues
- Ensure database uses utf8mb4 charset
- Verify connection uses utf8mb4 encoding





