# PrimeDrive - Car Rental Management System

A comprehensive full-stack web application for managing car rentals with separate dashboards for customers and administrators.

## 🚀 Features

### Customer Features
- ✅ User Registration & Login
- ✅ Profile Management
- ✅ Browse Available Cars
- ✅ Search & Filter Cars (by brand, type, price, location)
- ✅ View Car Details
- ✅ Book Cars with Date Selection
- ✅ View Booking History
- ✅ Cancel Bookings
- ✅ Customer Dashboard with Statistics

### Admin Features
- ✅ Admin Login & Dashboard
- ✅ Manage Cars (Add, Edit, Delete)
- ✅ View All Cars
- ✅ Manage Users
- ✅ Manage All Bookings
- ✅ Update Booking Status
- ✅ Mark Payment Status
- ✅ View Analytics & Statistics
- ✅ Admin Dashboard with Insights

## 📋 Technology Stack

### Frontend
- HTML5, CSS3, Bootstrap 5
- Vanilla JavaScript (ES6+)
- Responsive Design
- Modern UI/UX

### Backend
- Node.js
- Express.js
- MySQL Database
- JWT Authentication
- bcrypt Password Hashing

### Database
- MySQL (Normalized Schema)

## 📁 Project Structure

```
PROJECT CODING/
├── client/                 # Frontend files
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── customer-dashboard.html  # Customer dashboard
│   ├── admin.html         # Admin dashboard
│   ├── cars.html          # Car listing & search
│   ├── bookings.html      # Booking management
│   ├── profile.html       # User profile
│   ├── css/               # Stylesheets
│   └── js/                # JavaScript files
├── server/                 # Backend files
│   ├── index.js           # Server entry point
│   ├── config/            # Configuration
│   │   └── database.js    # MySQL connection
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   └── services/           # Services (email, etc.)
├── database/               # Database files
│   ├── schema.sql         # MySQL schema
│   ├── setup.sql          # Setup script
│   ├── README.md          # Database docs
│   └── awardspace-setup.md # Hosting guide
└── package.json           # Root package.json
```

## 🗄️ Database Schema

### Normalized Tables

1. **users** - Base user information
   - user_id, user_fname, user_lname, user_email, user_password, user_gender, user_contact, user_role

2. **admins** - Admin-specific information
   - admin_id, admin_user_id (FK), admin_level, admin_no_of_cars_owned

3. **customers** - Customer-specific information
   - customer_id, customer_user_id (FK), customer_license, customer_address

4. **cars** - Car inventory
   - car_id, car_reg_no, car_make, car_model, car_year, car_type, car_hourly_rate, car_status, car_mileage

5. **bookings** - Rental bookings
   - booking_id, booking_customer_id (FK), booking_car_id (FK), booking_start_date, booking_end_date, booking_total_price, booking_status, booking_payment_status

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

### Step 1: Clone/Download Project

```bash
cd "PROJECT CODING"
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies (if needed)
cd ../client
# No npm install needed - using CDN for Bootstrap
```

### Step 3: Database Setup

#### Option A: Local MySQL

1. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE primedrive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

2. Import schema:
```bash
mysql -u root -p primedrive < database/schema.sql
```

3. Update `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=primedrive
DB_PORT=3306
```

#### Option B: AwardSpace Free Hosting

See detailed guide: `database/awardspace-setup.md`

### Step 4: Configure Environment

Create `server/.env` file:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=primedrive
DB_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

FRONTEND_URL=http://localhost:3000
```

### Step 5: Start Server

```bash
cd server
npm run dev
```

Server will start on `http://localhost:5000`

### Step 6: Open Frontend

Open `client/index.html` in your browser or use a local server:
```bash
# Using Python
cd client
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000
```

## 🔑 Default Credentials

### Admin Account
- **Email**: admin@primedrive.com
- **Password**: admin123

⚠️ **Change password after first login!**

## 📱 Usage

### For Customers

1. Register/Login as Customer
2. Browse available cars
3. Search and filter cars
4. View car details
5. Book a car (select dates)
6. View bookings in dashboard
7. Cancel bookings if needed
8. Edit profile

### For Admins

1. Login as Admin
2. View dashboard statistics
3. Manage cars (add/edit/delete)
4. View all bookings
5. Update booking status
6. Mark payment status
7. Manage users
8. View analytics

## 🌐 Deployment

### Backend Deployment Options

1. **Heroku** (Free tier available)
2. **Railway.app**
3. **Render.com**
4. **Vercel** (Serverless)

### Database Deployment

1. **AwardSpace** (Free MySQL hosting)
2. **PlanetScale** (Free tier)
3. **Railway** (Free tier)
4. **Local MySQL** (for development)

### Frontend Deployment

1. **Netlify** (Free)
2. **Vercel** (Free)
3. **GitHub Pages** (Free)
4. **AwardSpace** (Static hosting)

## 📚 Documentation

- **Database Setup**: `database/README.md`
- **Quick Start**: `database/QUICK_START.md`
- **AwardSpace Setup**: `database/awardspace-setup.md`
- **Migration Guide**: `database/migration-guide.md`

## 🔒 Security Features

- ✅ Password encryption (bcrypt)
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration

## 🎨 UI Features

- ✅ Responsive design (mobile-friendly)
- ✅ Bootstrap 5 components
- ✅ Modern gradient designs
- ✅ Smooth animations
- ✅ Interactive forms
- ✅ Password visibility toggle
- ✅ Loading states
- ✅ Error handling

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` credentials
- Test connection: `mysql -u root -p`

### Port Already in Use
- Change PORT in `.env`
- Kill process using port: `lsof -ti:5000 | xargs kill`

### Import Errors
- Check MySQL version (5.7+)
- Verify file encoding (UTF-8)
- Check user privileges

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password

### Cars
- `GET /api/cars` - Get all cars (with filters)
- `GET /api/cars/:id` - Get car details
- `POST /api/cars` - Add car (admin)
- `PUT /api/cars/:id` - Update car (admin)
- `DELETE /api/cars/:id` - Delete car (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings` - Get all bookings (admin)
- `PUT /api/bookings/:id/status` - Update status

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/analytics` - Analytics data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Car Rental Management System - PrimeDrive

## 🙏 Acknowledgments

- Bootstrap 5
- MySQL
- Node.js Community
- Railway for free hosting

---

**Made with ❤️ for Car Rental Management**





