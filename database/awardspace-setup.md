# AwardSpace Free Hosting Setup Guide for PrimeDrive

## Step-by-Step Instructions

### Step 1: Sign Up for AwardSpace Free Hosting

1. Visit https://www.awardspace.com/
2. Click on "Free Hosting" or "Sign Up"
3. Fill in the registration form:
   - Choose a domain name (e.g., `yourname.awardspace.com`)
   - Enter your email address
   - Create a password
4. Verify your email address
5. Complete the registration process

### Step 2: Access Control Panel

1. Login to AwardSpace Control Panel
2. You'll see the main dashboard with various options

### Step 3: Create MySQL Database

1. In the Control Panel, find **"MySQL Databases"** section
2. Click on **"Create Database"** or **"MySQL Databases"**
3. Enter database name: `primedrive`
   - Note: AwardSpace will prefix it with your username
   - Full name will be: `yourusername_primedrive`
4. Click **"Create"**
5. **IMPORTANT**: Note down the full database name

### Step 4: Create MySQL User

1. Go to **"MySQL Users"** section
2. Click **"Create User"**
3. Enter:
   - Username: `primedrive_user` (will be prefixed)
   - Password: Choose a strong password (save it!)
   - Full username will be: `yourusername_primedrive_user`
4. Click **"Create User"**
5. **IMPORTANT**: Save the username and password

### Step 5: Assign User to Database

1. Go to **"User Privileges"** or **"Assign User"**
2. Select your database: `yourusername_primedrive`
3. Select your user: `yourusername_primedrive_user`
4. Grant **ALL PRIVILEGES** (SELECT, INSERT, UPDATE, DELETE, CREATE, etc.)
5. Click **"Assign"** or **"Save"**

### Step 6: Access phpMyAdmin

1. In Control Panel, find **"phpMyAdmin"** or **"Database Tools"**
2. Click to open phpMyAdmin
3. Login with your MySQL credentials:
   - Username: `yourusername_primedrive_user`
   - Password: (your password)
   - Server: Usually `localhost`

### Step 7: Import Database Schema

1. In phpMyAdmin, select your database: `yourusername_primedrive`
2. Click on **"Import"** tab (top menu)
3. Click **"Choose File"**
4. Select the file: `database/schema.sql` from your project
5. Under "Format", select **"SQL"**
6. Click **"Go"** button at the bottom
7. Wait for import to complete
8. You should see "Import has been successfully finished"

### Step 8: Verify Database Structure

1. In phpMyAdmin, click on your database name
2. You should see these tables:
   - `users`
   - `admins`
   - `customers`
   - `cars`
   - `bookings`
3. Check that tables are created correctly

### Step 9: Get Connection Details

From AwardSpace Control Panel, collect these details:

```
Database Host: localhost (or mysql.yourdomain.com)
Database Name: yourusername_primedrive
Database User: yourusername_primedrive_user
Database Password: [the password you set]
Database Port: 3306
```

### Step 10: Update Your Application

Update `server/.env` file with AwardSpace credentials:

```env
DB_HOST=localhost
DB_USER=yourusername_primedrive_user
DB_PASSWORD=your_database_password
DB_NAME=yourusername_primedrive
DB_PORT=3306
```

### Step 11: Upload Your Application

1. Use **File Manager** in AwardSpace Control Panel
2. Upload your project files to `public_html` or `htdocs` folder
3. Or use **FTP**:
   - FTP Host: `ftp.yourdomain.com`
   - FTP User: (your AwardSpace username)
   - FTP Password: (your AwardSpace password)
   - Port: 21

### Step 12: Configure Node.js (if supported)

**Note**: AwardSpace free hosting may not support Node.js directly. You may need to:
- Use a Node.js hosting service (Heroku, Railway, Render)
- Or use AwardSpace's PHP hosting and adapt the backend

### Alternative: Use Separate Hosting

Since AwardSpace free hosting may not support Node.js:

1. **Backend (Node.js)**: Host on:
   - Heroku (free tier available)
   - Railway.app
   - Render.com
   - Vercel (for serverless)

2. **Database (MySQL)**: Use AwardSpace MySQL database

3. **Frontend**: Host on:
   - AwardSpace (static files)
   - Netlify
   - Vercel
   - GitHub Pages

### Step 13: Test Connection

1. Update your backend `.env` with AwardSpace database credentials
2. Start your server
3. Check logs for: "Connected to MySQL database: primedrive"
4. Test registration and login

## Important Notes

### AwardSpace Free Hosting Limitations

- **No Node.js support** on free tier
- Limited database size (usually 5-10 MB)
- Limited bandwidth
- May have connection limits

### Recommended Setup

1. **Database**: AwardSpace MySQL (free)
2. **Backend API**: Separate Node.js hosting (Heroku, Railway, etc.)
3. **Frontend**: AwardSpace or static hosting

### Connection String Format

```
mysql://username:password@host:port/database
```

Example:
```
mysql://yourusername_primedrive_user:password@localhost:3306/yourusername_primedrive
```

## Troubleshooting

### Can't Connect to Database
- Verify credentials in `.env`
- Check if database exists in phpMyAdmin
- Verify user has privileges
- Check if MySQL service is running

### Import Fails
- Check file size limits
- Verify SQL syntax
- Try importing in smaller chunks
- Check MySQL version compatibility

### Access Denied
- Verify username and password
- Check user privileges
- Ensure user is assigned to database
- Try resetting password

## Support Resources

- AwardSpace Support: https://www.awardspace.com/support/
- phpMyAdmin Documentation: https://www.phpmyadmin.net/docs/
- MySQL Documentation: https://dev.mysql.com/doc/

## Security Recommendations

1. **Change default admin password** after first login
2. **Use strong database passwords**
3. **Limit database user privileges** (only what's needed)
4. **Use environment variables** for credentials
5. **Enable SSL** if available
6. **Regular backups** of your database

## Next Steps

After setting up the database:
1. Test all CRUD operations
2. Verify data integrity
3. Set up automated backups
4. Monitor database performance
5. Update application with production credentials





