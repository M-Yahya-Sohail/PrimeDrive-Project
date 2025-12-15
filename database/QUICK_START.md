# PrimeDrive Database - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Option 1: Local MySQL Setup

1. **Install MySQL** (if not installed)
   ```bash
   # Windows: Download from mysql.com
   # Mac: brew install mysql
   # Linux: sudo apt install mysql-server
   ```

2. **Create Database**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE primedrive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

3. **Import Schema**
   ```bash
   mysql -u root -p primedrive < database/schema.sql
   ```

4. **Update .env**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=primedrive
   DB_PORT=3306
   ```

5. **Install Dependencies**
   ```bash
   cd server
   npm install mysql2
   ```

6. **Start Server**
   ```bash
   npm run dev
   ```

### Option 2: AwardSpace Free Hosting

1. **Sign Up**: https://www.awardspace.com/
2. **Create Database**: Control Panel → MySQL Databases → Create
3. **Create User**: MySQL Users → Create User
4. **Assign Privileges**: User Privileges → Assign ALL
5. **Import Schema**: phpMyAdmin → Import → Upload `schema.sql`
6. **Update .env** with AwardSpace credentials

📖 **Detailed Guide**: See `awardspace-setup.md`

## 📊 Database Structure

### Tables Created:
- ✅ `users` - Base user information
- ✅ `admins` - Admin-specific data
- ✅ `customers` - Customer-specific data  
- ✅ `cars` - Car inventory
- ✅ `bookings` - Rental bookings

### Views Created:
- ✅ `v_admin_details` - Admin with user info
- ✅ `v_customer_details` - Customer with user info
- ✅ `v_booking_details` - Complete booking info

## 🔑 Default Admin Account

- **Email**: admin@primedrive.com
- **Password**: admin123

⚠️ **Change password after first login!**

## 📝 Schema Features

- ✅ Normalized design (3NF)
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ UTF-8 support (utf8mb4)
- ✅ Timestamps (created_at, updated_at)

## 🔄 Migration from SQLite

If migrating from SQLite:
1. See `migration-guide.md`
2. Backup existing data first
3. Follow migration steps

## 🆘 Troubleshooting

### Connection Issues
```bash
# Test MySQL connection
mysql -u root -p -e "SHOW DATABASES;"

# Check if database exists
mysql -u root -p -e "USE primedrive; SHOW TABLES;"
```

### Import Errors
- Check MySQL version (5.7+)
- Verify file encoding (UTF-8)
- Check user privileges

### Common Errors
- **Access denied**: Check username/password
- **Database not found**: Create database first
- **Table exists**: Drop tables or use IF NOT EXISTS

## 📚 Documentation Files

- `schema.sql` - Complete database schema
- `setup.sql` - Database setup script
- `README.md` - Full documentation
- `migration-guide.md` - SQLite to MySQL migration
- `awardspace-setup.md` - AwardSpace hosting guide

## ✅ Next Steps

1. ✅ Database created
2. ✅ Schema imported
3. ✅ .env configured
4. ✅ Dependencies installed
5. ✅ Server running
6. ✅ Test registration/login

## 🎯 Testing

Test the connection:
```bash
# In Node.js
const db = require('./config/database');
await db.init();
console.log('Connected!');
```

Test registration:
```bash
POST http://localhost:5000/api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "customer"
}
```

## 📞 Support

- Check error logs
- Verify .env configuration
- Test MySQL connection
- Review documentation files

---

**Ready to go!** 🎉 Your PrimeDrive database is set up and ready to use.





