/**
 * Login Form Handler
 * Connects the login page with backend authentication.
 */

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.querySelector('[data-testid="auth-login-form"]');
  const emailInput = document.querySelector('[data-testid="auth-login-input-email"]');
  const passwordInput = document.querySelector('[data-testid="auth-login-input-password"]');

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    authHelper.clearFieldErrors(loginForm);

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    let hasError = false;

    if (!email) {
      authHelper.setFieldError('auth-login-error-email', 'Valid email is required');
      hasError = true;
    } else if (!authHelper.isValidEmail(email)) {
      authHelper.setFieldError('auth-login-error-email', 'Valid email is required');
      hasError = true;
    }

    if (!password) {
      authHelper.setFieldError('auth-login-error-password', 'Password is required');
      hasError = true;
    }

    if (hasError) {
      if (!email || !password) {
        authHelper.showToast('Please fill in email and password');
      }
      return;
    }

    try {
      const response = await authHelper.postJson('/login', {
        email,
        password,
      });

      const result = await response.json();

      if (response.ok) {
        authHelper.redirect('/home');
        return;
      }

      authHelper.showToast(result.message || 'Invalid email or password');
    } catch (error) {
      authHelper.showToast('Invalid email or password');
      console.error(error);
    }
  });
});

