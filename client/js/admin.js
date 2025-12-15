document.addEventListener('DOMContentLoaded', async () => {
    // TEMPORARY: Allow viewing without login (add ?preview=true to URL)
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    
    if (!isPreview) {
        // Admin dashboard requires admin login - redirect if not authenticated
        if (!window.app.requireAdmin()) return;
    } else {
        // Preview mode - show demo data
        console.log('Preview mode: Showing admin dashboard without authentication');
        // Create a mock admin user for preview
        if (!window.app.getCurrentUser()) {
            window.app.setCurrentUser({
                id: 1,
                name: 'Demo Admin',
                email: 'admin@example.com',
                role: 'admin'
            });
        }
    }
    
    window.app.updateNavigation();
    
    // Check URL hash for tab navigation
    const hash = window.location.hash;
    if (hash) {
        const tabId = hash.substring(1);
        const tabButton = document.getElementById(`tab-${tabId}`);
        if (tabButton) {
            const tab = new bootstrap.Tab(tabButton);
            tab.show();
        }
    }
    
    // Load dashboard when admin panel loads
    await loadDashboard();
    
    // Tab change handlers
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', async (e) => {
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#dashboard') {
                await loadDashboard();
            } else if (target === '#cars') {
                await loadCarsAdmin();
            } else if (target === '#bookings') {
                await loadBookingsAdmin();
            } else if (target === '#users') {
                await loadUsersAdmin();
            }
        });
    });
});

// Load demo dashboard data for preview
function loadDemoDashboard() {
    const container = document.getElementById('dashboardContent');
    
    const demoStats = {
        totalCars: 25,
        totalUsers: 150,
        totalBookings: 89,
        activeRentals: 12,
        totalRevenue: 45000,
        pendingBookings: 5,
        recentBookings: 15
    };
    
    const demoAnalytics = {
        bookingsByStatus: [
            { status: 'pending', count: 5 },
            { status: 'confirmed', count: 12 },
            { status: 'completed', count: 65 },
            { status: 'cancelled', count: 7 }
        ],
        monthlyBookings: [
            { month: '2024-01', count: 20, revenue: 8500 },
            { month: '2024-02', count: 25, revenue: 10500 },
            { month: '2024-03', count: 30, revenue: 12000 }
        ],
        popularCars: [
            { brand: 'Toyota', model: 'Camry', booking_count: 15 },
            { brand: 'Honda', model: 'Civic', booking_count: 12 },
            { brand: 'Ford', model: 'Mustang', booking_count: 10 },
            { brand: 'BMW', model: '3 Series', booking_count: 8 },
            { brand: 'Mercedes', model: 'C-Class', booking_count: 7 }
        ]
    };
    
    container.innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show mb-4">
            <strong>Preview Mode:</strong> You are viewing this page without authentication. 
            <a href="admin.html">Click here</a> to view with login required.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="dashboard-card text-center">
                    <div class="card-icon text-primary">
                        <i class="bi bi-car-front"></i>
                    </div>
                    <div class="card-value">${demoStats.totalCars}</div>
                    <div class="card-label">Total Cars</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="dashboard-card text-center">
                    <div class="card-icon text-success">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="card-value">${demoStats.totalUsers}</div>
                    <div class="card-label">Total Users</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="dashboard-card text-center">
                    <div class="card-icon text-info">
                        <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="card-value">${demoStats.totalBookings}</div>
                    <div class="card-label">Total Bookings</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="dashboard-card text-center">
                    <div class="card-icon text-warning">
                        <i class="bi bi-car-front-fill"></i>
                    </div>
                    <div class="card-value">${demoStats.activeRentals}</div>
                    <div class="card-label">Active Rentals</div>
                </div>
            </div>
        </div>
        
        <div class="row g-4 mb-4">
            <div class="col-md-4">
                <div class="dashboard-card">
                    <h5 class="mb-3">Revenue</h5>
                    <div class="display-4 text-success">${window.app.formatCurrency(demoStats.totalRevenue)}</div>
                    <small class="text-muted">Total Revenue from Paid Bookings</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="dashboard-card">
                    <h5 class="mb-3">Pending Bookings</h5>
                    <div class="display-4 text-warning">${demoStats.pendingBookings}</div>
                    <small class="text-muted">Awaiting Confirmation</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="dashboard-card">
                    <h5 class="mb-3">Recent Bookings</h5>
                    <div class="display-4 text-info">${demoStats.recentBookings}</div>
                    <small class="text-muted">Last 7 Days</small>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Bookings by Status</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tbody>
                                ${demoAnalytics.bookingsByStatus.map(item => `
                                    <tr>
                                        <td><span class="badge status-${item.status}">${item.status.toUpperCase()}</span></td>
                                        <td class="text-end">${item.count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Popular Cars</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Car</th>
                                    <th class="text-end">Bookings</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${demoAnalytics.popularCars.map(car => `
                                    <tr>
                                        <td>${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}</td>
                                        <td class="text-end">${car.booking_count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadDashboard() {
    const container = document.getElementById('dashboardContent');
    
    // Check if preview mode
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    
    if (isPreview) {
        // Load demo data for preview
        loadDemoDashboard();
        return;
    }
    
    try {
        const stats = await window.app.apiRequest('/admin/dashboard');
        const analytics = await window.app.apiRequest('/admin/analytics');
        
        container.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-primary">
                            <i class="bi bi-car-front"></i>
                        </div>
                        <div class="card-value">${stats.totalCars}</div>
                        <div class="card-label">Total Cars</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-success">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="card-value">${stats.totalUsers}</div>
                        <div class="card-label">Total Users</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-info">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="card-value">${stats.totalBookings}</div>
                        <div class="card-label">Total Bookings</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-warning">
                            <i class="bi bi-car-front-fill"></i>
                        </div>
                        <div class="card-value">${stats.activeRentals}</div>
                        <div class="card-label">Active Rentals</div>
                    </div>
                </div>
            </div>
            
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <h5 class="mb-3">Revenue</h5>
                        <div class="display-4 text-success">${window.app.formatCurrency(stats.totalRevenue)}</div>
                        <small class="text-muted">Total Revenue from Paid Bookings</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <h5 class="mb-3">Pending Bookings</h5>
                        <div class="display-4 text-warning">${stats.pendingBookings}</div>
                        <small class="text-muted">Awaiting Confirmation</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <h5 class="mb-3">Recent Bookings</h5>
                        <div class="display-4 text-info">${stats.recentBookings}</div>
                        <small class="text-muted">Last 7 Days</small>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Bookings by Status</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tbody>
                                    ${analytics.bookingsByStatus.map(item => `
                                        <tr>
                                            <td><span class="badge status-${item.status}">${item.status.toUpperCase()}</span></td>
                                            <td class="text-end">${item.count}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Popular Cars</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Car</th>
                                        <th class="text-end">Bookings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analytics.popularCars.slice(0, 5).map(car => `
                                        <tr>
                                            <td>${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}</td>
                                            <td class="text-end">${car.booking_count}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading dashboard: ${error.message}
            </div>
        `;
    }
}

async function loadCarsAdmin() {
    const container = document.getElementById('carsAdminContainer');
    
    try {
        const cars = await window.app.apiRequest('/cars');
        displayCarsAdmin(cars);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading cars: ${error.message}
            </div>
        `;
    }
}

function displayCarsAdmin(cars) {
    const container = document.getElementById('carsAdminContainer');
    
    if (cars.length === 0) {
        container.innerHTML = '<p class="text-muted">No cars found. Add your first car!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Brand/Model</th>
                        <th>Type</th>
                        <th>Year</th>
                        <th>Location</th>
                        <th>Price/Day</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cars.map(car => `
                        <tr>
                            <td>
                                ${car.image_url 
                                    ? `<img src="${car.image_url}" alt="${car.car_make || car.brand || ''}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">`
                                    : `<div class="bg-secondary text-white d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; border-radius: 5px;">
                                        <i class="bi bi-car-front"></i>
                                       </div>`
                                }
                            </td>
                            <td><strong>${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}</strong></td>
                            <td>${car.type}</td>
                            <td>${car.year}</td>
                            <td>${car.location}</td>
                            <td>${window.app.formatCurrency(car.price_per_day)}</td>
                            <td>
                                <span class="badge ${car.available ? 'bg-success' : 'bg-danger'}">
                                    ${car.available ? 'Available' : 'Unavailable'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editCar(${car.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCar(${car.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadBookingsAdmin() {
    const container = document.getElementById('bookingsAdminContainer');
    
    try {
        const bookings = await window.app.apiRequest('/bookings');
        displayBookingsAdmin(bookings);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading bookings: ${error.message}
            </div>
        `;
    }
}

function displayBookingsAdmin(bookings) {
    const container = document.getElementById('bookingsAdminContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="text-muted">No bookings found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Car</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>${booking.user_name}<br><small class="text-muted">${booking.user_email}</small></td>
                            <td>${booking.car_make || booking.brand || ''} ${booking.car_model || booking.model || ''}</td>
                            <td>${window.app.formatDate(booking.start_date)}</td>
                            <td>${window.app.formatDate(booking.end_date)}</td>
                            <td>${window.app.formatCurrency(booking.total_price)}</td>
                            <td>
                                <select class="form-select form-select-sm" onchange="updateBookingStatus(${booking.id}, this.value)">
                                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td>
                                <select class="form-select form-select-sm" onchange="updatePaymentStatus(${booking.id}, this.value)">
                                    <option value="unpaid" ${booking.payment_status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                                    <option value="paid" ${booking.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                                </select>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="cancelBookingAdmin(${booking.id})">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadUsersAdmin() {
    const container = document.getElementById('usersAdminContainer');
    
    try {
        const users = await window.app.apiRequest('/users');
        displayUsersAdmin(users);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading users: ${error.message}
            </div>
        `;
    }
}

function displayUsersAdmin(users) {
    const container = document.getElementById('usersAdminContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-muted">No users found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Role</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td>${user.email}</td>
                            <td>${user.phone || '-'}</td>
                            <td>${user.address || '-'}</td>
                            <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role.toUpperCase()}</span></td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function openAddCarModal() {
    document.getElementById('carModalTitle').textContent = 'Add Car';
    document.getElementById('carForm').reset();
    document.getElementById('carId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('carModal'));
    modal.show();
}

async function editCar(carId) {
    try {
        const car = await window.app.apiRequest(`/cars/${carId}`);
        document.getElementById('carModalTitle').textContent = 'Edit Car';
        document.getElementById('carId').value = car.id;
        document.getElementById('carBrand').value = car.car_make || car.brand || '';
        document.getElementById('carModel').value = car.car_model || car.model || '';
        document.getElementById('carType').value = car.type;
        document.getElementById('carYear').value = car.year;
        document.getElementById('carColor').value = car.color || '';
        document.getElementById('carPrice').value = car.price_per_day;
        document.getElementById('carLocation').value = car.location;
        document.getElementById('carRegNo').value = car.reg_no || '';
        document.getElementById('carMileage').value = car.mileage || 0;
        document.getElementById('carDescription').value = car.description || '';
        document.getElementById('carImageUrl').value = car.image_url || '';
        document.getElementById('carAvailable').checked = car.available === 1;
        
        const modal = new bootstrap.Modal(document.getElementById('carModal'));
        modal.show();
    } catch (error) {
        window.app.showAlert('Error loading car details', 'danger');
    }
}

async function saveCar() {
    const carId = document.getElementById('carId').value;
    const isEdit = !!carId;
    
    // Validate required fields
    const car_make = document.getElementById('carBrand').value.trim();
    const car_model = document.getElementById('carModel').value.trim();
    const type = document.getElementById('carType').value.trim();
    const year = parseInt(document.getElementById('carYear').value);
    const price = parseFloat(document.getElementById('carPrice').value);
    const location = document.getElementById('carLocation').value.trim();
    
    if (!car_make || !car_model || !type || !year || !price || !location) {
        window.app.showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    const carData = {
        car_make: car_make,
        car_model: car_model,
        type: type,
        year: year,
        color: document.getElementById('carColor').value.trim(),
        price_per_day: price,
        location: location,
        reg_no: document.getElementById('carRegNo').value.trim() || undefined,
        mileage: parseInt(document.getElementById('carMileage').value) || 0,
        description: document.getElementById('carDescription').value.trim(),
        image_url: document.getElementById('carImageUrl').value.trim(),
        available: document.getElementById('carAvailable').checked ? 1 : 0
    };
    
    try {
        if (isEdit) {
            await window.app.apiRequest(`/cars/${carId}`, {
                method: 'PUT',
                body: JSON.stringify(carData)
            });
            window.app.showAlert('Car updated successfully', 'success');
        } else {
            await window.app.apiRequest('/cars', {
                method: 'POST',
                body: JSON.stringify(carData)
            });
            window.app.showAlert('Car added successfully', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('carModal')).hide();
        await loadCarsAdmin();
    } catch (error) {
        console.error('Save car error:', error);
        const errorMessage = error.message || 'Error saving car';
        window.app.showAlert(errorMessage, 'danger');
    }
}

async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car?')) {
        return;
    }
    
    try {
        await window.app.apiRequest(`/cars/${carId}`, {
            method: 'DELETE'
        });
        window.app.showAlert('Car deleted successfully', 'success');
        await loadCarsAdmin();
    } catch (error) {
        window.app.showAlert(error.message || 'Error deleting car', 'danger');
    }
}

async function updateBookingStatus(bookingId, status) {
    try {
        await window.app.apiRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        window.app.showAlert('Booking status updated', 'success');
        await loadBookingsAdmin();
    } catch (error) {
        window.app.showAlert(error.message || 'Error updating status', 'danger');
        await loadBookingsAdmin(); // Reload to reset dropdown
    }
}

async function updatePaymentStatus(bookingId, paymentStatus) {
    try {
        await window.app.apiRequest(`/payments/booking/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify({ payment_status: paymentStatus })
        });
        window.app.showAlert('Payment status updated', 'success');
        await loadBookingsAdmin();
    } catch (error) {
        window.app.showAlert(error.message || 'Error updating payment status', 'danger');
        await loadBookingsAdmin(); // Reload to reset dropdown
    }
}

async function cancelBookingAdmin(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        await window.app.apiRequest(`/bookings/${bookingId}/cancel`, {
            method: 'POST'
        });
        window.app.showAlert('Booking cancelled', 'success');
        await loadBookingsAdmin();
    } catch (error) {
        window.app.showAlert(error.message || 'Error cancelling booking', 'danger');
    }
}

