/**
 * Register Form Handler
 * Connects the register page with backend authentication.
 */

// Password visibility toggle
function togglePasswordVisibility() {
  const passwordInput = document.querySelector('[data-testid="auth-register-input-password"]');
  const toggleButton = document.querySelector('[data-testid="auth-register-button-toggle-password"]');

  if (!passwordInput || !toggleButton) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleButton.textContent = 'Show';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.querySelector('[data-testid="auth-register-form"]');
  const fullnameInput = document.querySelector('[data-testid="auth-register-input-fullname"]');
  const emailInput = document.querySelector('[data-testid="auth-register-input-email"]');
  const passwordInput = document.querySelector('[data-testid="auth-register-input-password"]');
  const birthdateInput = document.querySelector('[data-testid="auth-register-input-birthdate"]');

  if (!registerForm) {
    return;
  }

  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    authHelper.clearFieldErrors(registerForm);

    const fullName = fullnameInput ? fullnameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const birthDate = birthdateInput ? birthdateInput.value : '';

    let hasError = false;

    if (!fullName) {
      authHelper.setFieldError('auth-register-error-fullname', 'Full name is required');
      hasError = true;
    }

    if (!email) {
      authHelper.setFieldError('auth-register-error-email', 'Invalid email');
      hasError = true;
    } else if (!authHelper.isValidEmail(email)) {
      authHelper.setFieldError('auth-register-error-email', 'Invalid email');
      hasError = true;
    }

    if (!password) {
      authHelper.setFieldError('auth-register-error-password', 'Password is required');
      hasError = true;
    }

    if (!birthDate) {
      authHelper.setFieldError('auth-register-error-birthdate', 'Birth date is required');
      hasError = true;
    }

    if (hasError) {
      if (!fullName || !email || !password || !birthDate) {
        authHelper.showToast('Please fill in all required fields');
      }
      return;
    }

    try {
      const response = await authHelper.postJson('/register', {
        fullName,
        email,
        password,
        birthDate,
      });

      const result = await response.json();

      if (response.ok) {
        authHelper.showToast('Registration successful', 'success');
        setTimeout(() => authHelper.redirect('/login'), 5000);
        return;
      }

      authHelper.showToast(result.message || 'Failed to register');
    } catch (error) {
      authHelper.showToast('Failed to register');
      console.error(error);
    }
  });
});
