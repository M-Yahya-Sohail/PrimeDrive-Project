# Database Migration Guide: SQLite to MySQL

## Overview
This guide helps you migrate from SQLite to MySQL for the PrimeDrive Car Rental System.

## Step 1: Backup SQLite Data (if you have existing data)

If you have existing data in SQLite, export it first:

```bash
# Using sqlite3 command line
sqlite3 server/data/car_rental.db .dump > sqlite_backup.sql
```

## Step 2: Install MySQL

### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and follow setup wizard
3. Remember the root password you set

### Mac
```bash
brew install mysql
brew services start mysql
```

### Linux
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

## Step 3: Create MySQL Database

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE primedrive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## Step 4: Import Schema

```bash
mysql -u root -p primedrive < database/schema.sql
```

## Step 5: Update Environment Variables

Create/update `server/.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=primedrive
DB_PORT=3306
```

## Step 6: Install MySQL Dependencies

```bash
cd server
npm install mysql2
```

## Step 7: Update Code

The database.js file has been updated to use MySQL. All routes will automatically use the new database structure.

## Step 8: Test Connection

Start the server:
```bash
npm run dev
```

You should see: "Connected to MySQL database: primedrive"

## AwardSpace Hosting Setup

### Step 1: Sign Up
1. Go to https://www.awardspace.com/
2. Click "Free Hosting"
3. Complete registration

### Step 2: Access Control Panel
1. Login to AwardSpace Control Panel
2. Find "MySQL Databases" section

### Step 3: Create Database
1. Click "Create Database"
2. Database Name: `primedrive` (will be prefixed with your username)
3. Note the full database name (e.g., `username_primedrive`)

### Step 4: Create Database User
1. Go to "MySQL Users"
2. Create user:
   - Username: `primedrive_user`
   - Password: (strong password)
3. Note the full username (e.g., `username_primedrive_user`)

### Step 5: Assign Privileges
1. Go to "User Privileges"
2. Assign user to database
3. Grant ALL privileges

### Step 6: Get Connection Details
From AwardSpace, note:
- **Host**: Usually `localhost` or `mysql.yourdomain.com`
- **Database**: `username_primedrive`
- **User**: `username_primedrive_user`
- **Password**: (your password)
- **Port**: `3306`

### Step 7: Import Database
1. Access phpMyAdmin from AwardSpace Control Panel
2. Select your database
3. Click "Import"
4. Upload `database/schema.sql`
5. Click "Go"

### Step 8: Update Production .env

Update your production `.env` file:
```env
DB_HOST=mysql.yourdomain.com
DB_USER=username_primedrive_user
DB_PASSWORD=your_awardspace_password
DB_NAME=username_primedrive
DB_PORT=3306
```

## Schema Differences

### Old SQLite Schema
- Single `users` table with role field
- Simple structure

### New MySQL Schema
- Normalized: `users`, `admins`, `customers` tables
- Separate tables for admin and customer specific data
- Better data integrity with foreign keys

## Data Migration (if needed)

If you have existing SQLite data, you'll need to:
1. Export data from SQLite
2. Transform data to match new schema
3. Import into MySQL

Contact support if you need help with data migration.

## Troubleshooting

### Connection Refused
- Check MySQL service is running
- Verify credentials in .env
- Check firewall settings

### Access Denied
- Verify username and password
- Check user privileges
- Ensure user is assigned to database

### Character Encoding Issues
- Ensure database uses utf8mb4
- Check connection charset setting

## Support

For issues:
1. Check MySQL error logs
2. Verify .env configuration
3. Test connection with MySQL client
4. Check AwardSpace documentation





