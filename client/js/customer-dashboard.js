document.addEventListener('DOMContentLoaded', async () => {
    // TEMPORARY: Allow viewing without login (add ?preview=true to URL)
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    
    if (!isPreview) {
        // Customer dashboard requires login - redirect if not authenticated
        if (!window.app.requireAuth()) return;
        
        const user = window.app.getCurrentUser();
        if (user && user.role === 'admin') {
            window.location.href = 'admin.html';
            return;
        }
    } else {
        // Preview mode - show demo data
        console.log('Preview mode: Showing dashboard without authentication');
        // Create a mock user for preview
        if (!window.app.getCurrentUser()) {
            window.app.setCurrentUser({
                id: 1,
                name: 'Demo Customer',
                email: 'demo@example.com',
                role: 'customer'
            });
        }
    }
    
    window.app.updateNavigation();
    
    if (isPreview) {
        // Load demo data for preview
        await loadDemoDashboardData();
    } else {
        await loadDashboardData();
    }
});

async function loadDashboardData() {
    try {
        // Load user profile for welcome message
        const profile = await window.app.apiRequest('/users/profile');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${profile.name}!`;
        
        // Load bookings
        const bookings = await window.app.apiRequest('/bookings/my-bookings');
        
        // Calculate stats
        const totalBookings = bookings.length;
        const activeBookings = bookings.filter(b => 
            b.status === 'confirmed' || b.status === 'pending'
        ).length;
        const totalSpent = bookings
            .filter(b => b.payment_status === 'paid')
            .reduce((sum, b) => sum + b.total_price, 0);
        
        // Update stats
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('activeBookings').textContent = activeBookings;
        document.getElementById('totalSpent').textContent = window.app.formatCurrency(totalSpent);
        
        // Display recent bookings (last 5)
        const recentBookings = bookings.slice(0, 5);
        displayRecentBookings(recentBookings);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        window.app.showAlert('Error loading dashboard data', 'danger');
    }
}

// Load demo data for preview mode
async function loadDemoDashboardData() {
    try {
        document.getElementById('welcomeMessage').textContent = 'Welcome, Demo Customer!';
        
        // Demo stats
        document.getElementById('totalBookings').textContent = '5';
        document.getElementById('activeBookings').textContent = '2';
        document.getElementById('totalSpent').textContent = window.app.formatCurrency(1250);
        
        // Demo bookings
        const demoBookings = [
            {
                brand: 'Toyota',
                model: 'Camry',
                type: 'Sedan',
                start_date: '2024-01-15',
                end_date: '2024-01-20',
                total_price: 350,
                status: 'confirmed',
                payment_status: 'paid'
            },
            {
                brand: 'Honda',
                model: 'Civic',
                type: 'Sedan',
                start_date: '2024-02-01',
                end_date: '2024-02-05',
                total_price: 280,
                status: 'pending',
                payment_status: 'unpaid'
            }
        ];
        
        displayRecentBookings(demoBookings);
        
        // Show preview notice
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Preview Mode:</strong> You are viewing this page without authentication. 
            <a href="customer-dashboard.html">Click here</a> to view with login required.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
        
    } catch (error) {
        console.error('Error loading demo dashboard:', error);
    }
}

function displayRecentBookings(bookings) {
    const container = document.getElementById('recentBookingsContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-calendar-x" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-3">You have no bookings yet.</p>
                <a href="cars.html" class="btn btn-primary mt-2">
                    <i class="bi bi-car-front me-2"></i>Book Your First Car
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Car</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => {
                        const statusClass = `status-${booking.status}`;
                        const paymentClass = booking.payment_status === 'paid' ? 'payment-paid' : 'payment-unpaid';
                        
                        return `
                            <tr>
                                <td>
                                    <strong>${booking.car_make || booking.brand || ''} ${booking.car_model || booking.model || ''}</strong><br>
                                    <small class="text-muted">${booking.type}</small>
                                </td>
                                <td>${window.app.formatDate(booking.start_date)}</td>
                                <td>${window.app.formatDate(booking.end_date)}</td>
                                <td><strong>${window.app.formatCurrency(booking.total_price)}</strong></td>
                                <td><span class="badge ${statusClass}">${booking.status.toUpperCase()}</span></td>
                                <td><span class="badge ${paymentClass}">${booking.payment_status.toUpperCase()}</span></td>
                                <td>
                                    <a href="bookings.html" class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-eye"></i> View
                                    </a>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

