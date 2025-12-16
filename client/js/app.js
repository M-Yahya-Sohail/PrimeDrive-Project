// API Configuration with trailing slash
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api/" // Localhost backend
    : "https://primedrive-backend.onrender.com/api"; // Live Render backend

// Utility Functions
const getAuthToken = () => {
  return localStorage.getItem("token");
};

const setAuthToken = (token) => {
  localStorage.setItem("token", token);
};

const removeAuthToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

const setCurrentUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Server error: ${text || "Invalid response format"}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);

    // Provide more helpful error messages
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      throw new Error(
        `Cannot connect to server. Please make sure the server is running on ${API_BASE_URL}`
      );
    }

    throw error;
  }
};

// Show Alert - centered in main content, not on navbar
const showAlert = (message, type = "info") => {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show pretty-alert`;
  alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
        </div>
    `;

  const container =
    document.getElementById("globalAlertContainer") ||
    document.querySelector("main .container") ||
    document.querySelector(".container") ||
    document.body;

  container.insertBefore(alertDiv, container.firstChild);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
};

// Update Navigation - Show all links, but handle login/logout state
const updateNavigation = () => {
  const user = getCurrentUser();
  const navLogin = document.getElementById("navLogin");
  const navRegister = document.getElementById("navRegister");
  const navUser = document.getElementById("navUser");
  const navAdmin = document.getElementById("navAdmin");
  const navDashboard = document.getElementById("navDashboard");
  const navNotifications = document.getElementById("navNotifications");
  const userNameNav = document.getElementById("userNameNav");

  // All navigation links are visible by default
  // We only hide/show based on login state

  if (user) {
    // User is logged in - hide login/register, show user menu
    if (navLogin) navLogin.style.display = "none";
    if (navRegister) navRegister.style.display = "none";
    if (navUser) {
      navUser.style.display = "block";
      if (userNameNav) userNameNav.textContent = user.name;
    }
    // Show admin link only for admins
    if (navAdmin) {
      navAdmin.style.display = user.role === "admin" ? "block" : "none";
    }
    // Show dashboard link only for customers
    if (navDashboard) {
      navDashboard.style.display = user.role === "customer" ? "block" : "none";
    }

    // Booking link text: My Bookings for customer, Manage Bookings for admin
    const bookingLinks = document.querySelectorAll('a[href="bookings.html"]');
    bookingLinks.forEach((link) => {
      if (user.role === "admin") {
        link.textContent = "Manage Bookings";
      } else {
        link.textContent = "My Bookings";
      }
    });

    // Notifications only for customers
    if (navNotifications) {
      navNotifications.style.display =
        user.role === "customer" ? "block" : "none";
    }
  } else {
    // User is not logged in - show login/register, hide user menu
    if (navLogin) navLogin.style.display = "block";
    if (navRegister) navRegister.style.display = "block";
    if (navUser) navUser.style.display = "none";
    // Hide admin and dashboard links when not logged in
    if (navAdmin) navAdmin.style.display = "none";
    if (navDashboard) navDashboard.style.display = "none";
    if (navNotifications) navNotifications.style.display = "none";
  }
};

// Format Date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format Currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Check Authentication (only redirects if called, doesn't auto-redirect)
const requireAuth = () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

const requireAdmin = () => {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return false;
  }
  return true;
};

// Check if current page requires authentication
const isProtectedPage = () => {
  const currentPage =
    window.location.pathname.split("/").pop() ||
    window.location.href.split("/").pop();
  const protectedPages = [
    "customer-dashboard.html",
    "admin.html",
    "bookings.html",
    "profile.html",
  ];
  return protectedPages.includes(currentPage);
};

// Check if current page is a public page
const isPublicPage = () => {
  const currentPage =
    window.location.pathname.split("/").pop() ||
    window.location.href.split("/").pop();
  const publicPages = [
    "index.html",
    "login.html",
    "register.html",
    "cars.html",
  ];
  return (
    publicPages.includes(currentPage) || !currentPage || currentPage === ""
  );
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Only check authentication for protected pages
  // Public pages (index, login, register, cars) should be accessible without login
  if (isProtectedPage()) {
    // Protected pages will handle their own auth checks in their respective JS files
    // Don't auto-redirect here to avoid issues
  }

  updateNavigation();

  // Logout handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      removeAuthToken();
      updateNavigation();
      window.location.href = "index.html";
    });
  }
});

// Export functions for use in other scripts
window.app = {
  API_BASE_URL,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getCurrentUser,
  setCurrentUser,
  apiRequest,
  showAlert,
  updateNavigation,
  formatDate,
  formatCurrency,
  requireAuth,
  requireAdmin,
  isProtectedPage,
  isPublicPage,
};
