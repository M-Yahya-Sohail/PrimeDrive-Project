// Standard Navigation Bar HTML - Use this on all pages
const getStandardNavbar = (activePage = '') => {
    const user = window.app ? window.app.getCurrentUser() : null;
    const isActive = (page) => activePage === page ? 'active' : '';
    
    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
            <div class="container">
                <a class="navbar-brand fw-bold" href="index.html">
                    <i class="bi bi-car-front-fill me-2"></i>PrimeDrive
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link ${isActive('index')}" href="index.html">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${isActive('cars')}" href="cars.html">Cars</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${isActive('bookings')}" href="bookings.html">My Bookings</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${isActive('profile')}" href="profile.html">Profile</a>
                        </li>
                        ${user && user.role === 'admin' 
                            ? `<li class="nav-item">
                                <a class="nav-link ${isActive('admin')}" href="admin.html">Admin Panel</a>
                               </li>`
                            : ''
                        }
                        ${user && user.role === 'customer'
                            ? `<li class="nav-item">
                                <a class="nav-link ${isActive('dashboard')}" href="customer-dashboard.html">Dashboard</a>
                               </li>`
                            : ''
                        }
                        ${!user 
                            ? `<li class="nav-item">
                                <a class="nav-link ${isActive('login')}" href="login.html">Login</a>
                               </li>
                               <li class="nav-item">
                                <a class="nav-link ${isActive('register')}" href="register.html">Register</a>
                               </li>`
                            : `<li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                    <i class="bi bi-person-circle me-1"></i>${user.name || 'User'}
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                                    ${user.role === 'customer' 
                                        ? `<li><a class="dropdown-item" href="customer-dashboard.html">Dashboard</a></li>`
                                        : ''
                                    }
                                    ${user.role === 'admin' 
                                        ? `<li><a class="dropdown-item" href="admin.html">Admin Panel</a></li>`
                                        : ''
                                    }
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                                </ul>
                               </li>`
                        }
                    </ul>
                </div>
            </div>
        </nav>
    `;
};

// Update navigation visibility (show all links, but handle auth state)
const updateNavigationVisibility = () => {
    const user = window.app ? window.app.getCurrentUser() : null;
    
    // Show all navigation items, but handle login/logout state
    const navLogin = document.getElementById('navLogin');
    const navRegister = document.getElementById('navRegister');
    const navUser = document.getElementById('navUser');
    const navBookings = document.getElementById('navBookings');
    const navProfile = document.getElementById('navProfile');
    const navAdmin = document.getElementById('navAdmin');
    const navDashboard = document.getElementById('navDashboard');
    const userNameNav = document.getElementById('userNameNav');
    
    // Show all links - they're always visible
    if (navBookings) navBookings.style.display = 'block';
    if (navProfile) navProfile.style.display = 'block';
    
    if (user) {
        // User is logged in
        if (navLogin) navLogin.style.display = 'none';
        if (navRegister) navRegister.style.display = 'none';
        if (navUser) {
            navUser.style.display = 'block';
            if (userNameNav) userNameNav.textContent = user.name;
        }
        if (navAdmin && user.role === 'admin') {
            navAdmin.style.display = 'block';
        }
        if (navDashboard && user.role === 'customer') {
            navDashboard.style.display = 'block';
        }
    } else {
        // User is not logged in
        if (navLogin) navLogin.style.display = 'block';
        if (navRegister) navRegister.style.display = 'block';
        if (navUser) navUser.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navDashboard) navDashboard.style.display = 'none';
    }
};





