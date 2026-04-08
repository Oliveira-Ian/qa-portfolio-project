/**
 * Login Form Handler
 * Minimal behavior for login page
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('[data-testid="auth-login-form"]');
    const emailInput = document.querySelector('[data-testid="auth-login-input-email"]');
    const passwordInput = document.querySelector('[data-testid="auth-login-input-password"]');
    const submitButton = document.querySelector('[data-testid="auth-login-button-submit"]');

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            // Prevent default form submission
            event.preventDefault();

            // Get form values
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            // Log credentials object (as requested)
            const credentials = {
                email: email,
                password: password
            };

            console.log(credentials);
        });
    }

    // Optional: Add visual feedback on button click
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            // Visual feedback handled by CSS :active state
            // This listener is for any additional JS behavior
            console.log('Sign in button clicked');
        });
    }
});
