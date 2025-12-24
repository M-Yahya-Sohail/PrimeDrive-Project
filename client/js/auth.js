// Toggle password visibility
function setupPasswordToggle(inputId, toggleId, iconId) {
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = document.getElementById(toggleId);
  const toggleIcon = document.getElementById(iconId);

  if (passwordInput && toggleBtn && toggleIcon) {
    toggleBtn.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      if (type === "password") {
        toggleIcon.classList.remove("bi-eye-slash");
        toggleIcon.classList.add("bi-eye");
      } else {
        toggleIcon.classList.remove("bi-eye");
        toggleIcon.classList.add("bi-eye-slash");
      }
    });
  }
}

// Toggle admin key section based on role selection
const regRole = document.getElementById("regRole");
if (regRole) {
  regRole.addEventListener("change", function () {
    const adminKeySection = document.getElementById("adminKeySection");
    if (adminKeySection) {
      if (this.value === "admin") {
        adminKeySection.style.display = "block";
      } else {
        adminKeySection.style.display = "none";
      }
    }
  });
}

// Login functionality
document.addEventListener("DOMContentLoaded", () => {
  // Setup password toggles
  setupPasswordToggle("password", "togglePassword", "togglePasswordIcon");
  setupPasswordToggle(
    "regPassword",
    "toggleRegPassword",
    "toggleRegPasswordIcon"
  );
  setupPasswordToggle(
    "regConfirmPassword",
    "toggleRegConfirmPassword",
    "toggleRegConfirmPasswordIcon"
  );

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selectedRole = document.getElementById("loginRole").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const submitBtn = document.getElementById("loginSubmit");
      const originalText = submitBtn.innerHTML;

      if (!selectedRole) {
        window.app.showAlert("Please select a role", "warning");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

      try {
        console.log("Attempting login...", { email, role: selectedRole });

        const response = await window.app.apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        console.log("Login response:", response);

        // Validate that the selected role matches the user's actual role
        if (response.user.role !== selectedRole) {
          window.app.showAlert(
            `This account is registered as a ${response.user.role}, not as ${selectedRole}. Please select the correct role.`,
            "danger"
          );
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          return;
        }

        window.app.setAuthToken(response.token);
        window.app.setCurrentUser(response.user);
        window.app.updateNavigation();
        window.app.showAlert("Login successful!", "success");

        setTimeout(() => {
          if (response.user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "customer-dashboard.html";
          }
        }, 1000);
      } catch (error) {
        console.error("Login error details:", error);
        const errorMessage =
          error.message ||
          "Login failed. Please check your credentials and make sure the server is running.";
        window.app.showAlert(errorMessage, "danger");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Register functionality
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selectedRole = document.getElementById("regRole").value;
      const name = document.getElementById("regName").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const confirmPassword =
        document.getElementById("regConfirmPassword").value;
      const phone = document.getElementById("regPhone").value;
      const address = document.getElementById("regAddress").value;
      const adminKey = document.getElementById("adminSecretKey").value; // Added: Get admin key
      const submitBtn = document.getElementById("registerSubmit");
      const originalText = submitBtn.innerHTML;

      if (!selectedRole) {
        window.app.showAlert("Please select a role", "warning");
        return;
      }

      // Added: Validate admin key if role is admin
      if (selectedRole === "admin" && !adminKey) {
        window.app.showAlert(
          "Admin secret key is required for admin registration.",
          "warning"
        );
        return;
      }

      if (password !== confirmPassword) {
        window.app.showAlert("Passwords do not match!", "danger");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';

      try {
        const requestBody = {
          name,
          email,
          password,
          phone,
          address,
          role: selectedRole,
        };
        if (selectedRole === "admin") {
          requestBody.adminKey = adminKey; // Added: Include admin key in request
        }

        const response = await window.app.apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        window.app.setAuthToken(response.token);
        window.app.setCurrentUser(response.user);
        window.app.updateNavigation();
        window.app.showAlert("Registration successful!", "success");

        setTimeout(() => {
          if (response.user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "customer-dashboard.html";
          }
        }, 1000);
      } catch (error) {
        window.app.showAlert(
          error.message || "Registration failed. Please try again.",
          "danger"
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});
