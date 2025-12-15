document.addEventListener('DOMContentLoaded', async () => {
    window.app.updateNavigation();
    
    // Check if user is logged in - if not, show message but don't redirect
    const user = window.app.getCurrentUser();
    if (!user) {
        const profileForm = document.getElementById('profileForm');
        const passwordForm = document.getElementById('passwordForm');
        if (profileForm) profileForm.style.display = 'none';
        if (passwordForm) passwordForm.style.display = 'none';
        
        const tabContent = document.querySelector('.tab-content');
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle me-2"></i>
                    <h5>Please Login to View Your Profile</h5>
                    <p>You need to be logged in to view and edit your profile.</p>
                    <a href="login.html" class="btn btn-primary mt-2">
                        <i class="bi bi-box-arrow-in-right me-2"></i>Login Now
                    </a>
                </div>
            `;
        }
        return;
    }
    
    await loadProfile();
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });
    
    // Password form
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await changePassword();
    });
});

async function loadProfile() {
    try {
        const profile = await window.app.apiRequest('/users/profile');
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileAddress').value = profile.address || '';
    } catch (error) {
        window.app.showAlert('Error loading profile', 'danger');
    }
}

async function updateProfile() {
    const submitBtn = document.getElementById('profileSubmit');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
    
    try {
        await window.app.apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            })
        });
        
        window.app.showAlert('Profile updated successfully', 'success');
        
        // Update user in localStorage
        const user = window.app.getCurrentUser();
        user.name = document.getElementById('profileName').value;
        window.app.setCurrentUser(user);
        window.app.updateNavigation();
    } catch (error) {
        window.app.showAlert(error.message || 'Error updating profile', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        window.app.showAlert('New passwords do not match', 'danger');
        return;
    }
    
    const submitBtn = document.getElementById('passwordSubmit');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Changing...';
    
    try {
        await window.app.apiRequest('/users/change-password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        window.app.showAlert('Password changed successfully', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        window.app.showAlert(error.message || 'Error changing password', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

