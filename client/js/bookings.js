let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    window.app.updateNavigation();
    
    currentUser = window.app.getCurrentUser();

    // Check if user is logged in - if not, show message but don't redirect
    if (!currentUser) {
        const container = document.getElementById('bookingsContainer');
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle me-2"></i>
                <h5>Please Login to View Your Bookings</h5>
                <p>You need to be logged in to view your booking history.</p>
                <a href="login.html" class="btn btn-primary mt-2">
                    <i class="bi bi-box-arrow-in-right me-2"></i>Login Now
                </a>
            </div>
        `;
        return;
    }
    
    // Update heading for admins
    if (currentUser.role === 'admin') {
        const titleEl = document.getElementById('bookingsTitle');
        const subtitleEl = document.getElementById('bookingsSubtitle');
        if (titleEl) titleEl.textContent = 'Manage Bookings';
        if (subtitleEl) subtitleEl.textContent = 'View and manage all customer bookings';
    }

    await loadBookings();
});

async function loadBookings() {
    const container = document.getElementById('bookingsContainer');
    
    try {
        const endpoint = currentUser && currentUser.role === 'admin'
            ? '/bookings'
            : '/bookings/my-bookings';
        const bookings = await window.app.apiRequest(endpoint);
        displayBookings(bookings);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading bookings: ${error.message}
            </div>
        `;
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookingsContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3">You have no bookings yet.</p>
                <a href="cars.html" class="btn btn-primary mt-3">
                    <i class="bi bi-car-front me-2"></i>Browse Cars
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bookings.map(booking => {
        const statusClass = `status-${booking.status}`;
        const paymentClass = booking.payment_status === 'paid' ? 'payment-paid' : 'payment-unpaid';
        
        return `
            <div class="booking-card fade-in">
                <div class="row">
                    <div class="col-md-2">
                        ${booking.image_url 
                            ? `<img src="${booking.image_url}" alt="${booking.car_make || booking.brand || ''} ${booking.car_model || booking.model || ''}" class="img-fluid rounded" style="max-height: 150px; object-fit: cover;">`
                            : `<div class="bg-primary text-white rounded d-flex align-items-center justify-content-center" style="height: 150px;">
                                <i class="bi bi-car-front" style="font-size: 3rem;"></i>
                               </div>`
                        }
                    </div>
                    <div class="col-md-8">
                        <h5 class="fw-bold">${booking.car_make || booking.brand || ''} ${booking.car_model || booking.model || ''}</h5>
                        <p class="text-muted mb-2">
                            <i class="bi bi-tag me-1"></i>${booking.type}
                        </p>
                        <div class="row mb-2">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-calendar-event me-1"></i>
                                    <strong>Start:</strong> ${window.app.formatDate(booking.start_date)}
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-calendar-check me-1"></i>
                                    <strong>End:</strong> ${window.app.formatDate(booking.end_date)}
                                </small>
                            </div>
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge ${statusClass}">${booking.status.toUpperCase()}</span>
                            <span class="badge ${paymentClass}">${booking.payment_status.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <h5 class="text-primary">${window.app.formatCurrency(booking.total_price)}</h5>
                        ${booking.status === 'pending' 
                            ? `<button class="btn btn-sm btn-success mt-2 mb-1" onclick="confirmBooking(${booking.id})">
                                <i class="bi bi-check-circle me-1"></i>Confirm & Pay
                               </button><br>`
                            : ''
                        }
                        ${booking.status !== 'cancelled' && booking.status !== 'completed' 
                            ? `<button class="btn btn-sm btn-outline-danger mt-2" onclick="cancelBooking(${booking.id})">
                                <i class="bi bi-x-circle me-1"></i>Cancel
                               </button>`
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function confirmBooking(bookingId) {
    const input = document.getElementById('confirmBookingId');
    if (input) {
        input.value = bookingId;
    }
    const modalEl = document.getElementById('confirmPaymentModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function confirmBookingPayment() {
    const bookingId = document.getElementById('confirmBookingId').value;
    if (!bookingId) return;

    try {
        await window.app.apiRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'confirmed' })
        });

        window.app.showAlert('Booking confirmed and marked as paid successfully!', 'success');
        const modalEl = document.getElementById('confirmPaymentModal');
        if (modalEl) {
            bootstrap.Modal.getInstance(modalEl)?.hide();
        }
        await loadBookings();
    } catch (error) {
        window.app.showAlert(error.message || 'Error confirming booking', 'danger');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        await window.app.apiRequest(`/bookings/${bookingId}/cancel`, {
            method: 'POST'
        });
        
        window.app.showAlert('Booking cancelled successfully', 'success');
        await loadBookings();
    } catch (error) {
        window.app.showAlert(error.message || 'Error cancelling booking', 'danger');
    }
}

