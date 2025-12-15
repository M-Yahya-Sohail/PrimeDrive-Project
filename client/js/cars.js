let allCars = [];
let filters = {};

document.addEventListener('DOMContentLoaded', async () => {
    window.app.updateNavigation();
    await loadFilters();
    await loadCars();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);
    document.getElementById('endDate').setAttribute('min', today);
    
    // Update end date min when start date changes
    document.getElementById('startDate').addEventListener('change', (e) => {
        const startDate = e.target.value;
        document.getElementById('endDate').setAttribute('min', startDate);
        calculatePrice();
    });
    
    document.getElementById('endDate').addEventListener('change', () => {
        calculatePrice();
    });
});

async function loadFilters() {
    try {
        const data = await window.app.apiRequest('/cars/meta/filters');
        
        const brandSelect = document.getElementById('brandFilter');
        const typeSelect = document.getElementById('typeFilter');
        const locationSelect = document.getElementById('locationFilter');
        
        (data.car_makes || data.brands || []).forEach(car_make => {
            const option = document.createElement('option');
            option.value = car_make;
            option.textContent = car_make;
            brandSelect.appendChild(option);
        });
        
        data.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
        
        data.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

async function loadCars() {
    const container = document.getElementById('carsContainer');
    
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.brand) params.append('car_make', filters.brand);
        if (filters.type) params.append('type', filters.type);
        if (filters.location) params.append('location', filters.location);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        
        allCars = await window.app.apiRequest(`/cars?${params.toString()}`);
        displayCars(allCars);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Error loading cars: ${error.message}
            </div>
        `;
    }
}

function displayCars(cars) {
    const container = document.getElementById('carsContainer');
    
    if (cars.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-car-front" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3">No cars found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    const user = window.app.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    container.innerHTML = cars.map(car => `
        <div class="car-card fade-in">
            <div class="car-image ${car.image_url ? 'has-photo' : 'no-photo'}">
                ${car.image_url 
                    ? `<img src="${car.image_url}" alt="${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}" onerror="this.parentElement.innerHTML='<i class=\\"bi bi-car-front\\"></i>'">`
                    : `<i class="bi bi-car-front"></i>`
                }
            </div>
            <div class="car-card-body">
                <h5 class="fw-bold">${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}</h5>
                <p class="text-muted mb-2">
                    <i class="bi bi-tag me-1"></i>${car.type} | 
                    <i class="bi bi-calendar me-1"></i>${car.year} |
                    <i class="bi bi-geo-alt me-1"></i>${car.location}
                </p>
                ${car.description ? `<p class="small text-muted">${car.description}</p>` : ''}
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <span class="car-price">${window.app.formatCurrency(car.price_per_day)}</span>
                        <small class="text-muted">/day</small>
                    </div>
                    ${
                        isAdmin
                            ? `<div class="d-flex gap-2">
                                    <button class="btn btn-outline-primary btn-sm" onclick="editCarFromList(${car.id})">
                                        <i class="bi bi-pencil-square me-1"></i>Edit
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="deleteCarFromList(${car.id})">
                                        <i class="bi bi-trash me-1"></i>Delete
                                    </button>
                               </div>`
                            : `<button class="btn btn-primary btn-sm" onclick="openBookingModal(${car.id})">
                                    <i class="bi bi-calendar-check me-1"></i>Book Now
                               </button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function editCarFromList(carId) {
    // Redirect admin to admin panel where full edit tools exist
    window.location.href = `admin.html?carId=${carId}`;
}

async function deleteCarFromList(carId) {
    if (!confirm('Are you sure you want to delete this car?')) {
        return;
    }
    try {
        await window.app.apiRequest(`/cars/${carId}`, {
            method: 'DELETE'
        });
        window.app.showAlert('Car deleted successfully', 'success');
        await loadCars();
    } catch (error) {
        window.app.showAlert(error.message || 'Error deleting car', 'danger');
    }
}

function applyFilters() {
    filters = {
        search: document.getElementById('searchInput').value,
        brand: document.getElementById('brandFilter').value,
        type: document.getElementById('typeFilter').value,
        location: document.getElementById('locationFilter').value,
        minPrice: document.getElementById('minPrice').value,
        maxPrice: document.getElementById('maxPrice').value
    };
    loadCars();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    filters = {};
    loadCars();
}

async function openBookingModal(carId) {
    // Check if user is logged in before opening booking modal
    const user = window.app.getCurrentUser();
    if (!user) {
        window.app.showAlert('Please login to book a car', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    const car = allCars.find(c => c.id === carId);
    if (!car) return;
    
    document.getElementById('bookingCarId').value = carId;
    document.getElementById('bookingCarName').value = `${car.car_make || car.brand || ''} ${car.car_model || car.model || ''}`;
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('totalPrice').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

async function calculatePrice() {
    const carId = document.getElementById('bookingCarId').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!carId || !startDate || !endDate) {
        document.getElementById('totalPrice').value = '';
        return;
    }
    
    const car = allCars.find(c => c.id == carId);
    if (!car) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const total = car.price_per_day * days;
    
    document.getElementById('totalPrice').value = window.app.formatCurrency(total);
}

async function submitBooking() {
    const carId = document.getElementById('bookingCarId').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        window.app.showAlert('Please select both start and end dates', 'warning');
        return;
    }
    
    try {
        const booking = await window.app.apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                car_id: parseInt(carId),
                start_date: startDate,
                end_date: endDate
            })
        });
        
        window.app.showAlert('Booking created successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        
        setTimeout(() => {
            window.location.href = 'bookings.html';
        }, 1500);
    } catch (error) {
        window.app.showAlert(error.message || 'Error creating booking', 'danger');
    }
}

// Search on Enter key
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyFilters();
    }
});

