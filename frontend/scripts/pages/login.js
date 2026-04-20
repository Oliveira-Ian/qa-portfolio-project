/**
 * Login Form Handler
 * Connects the login page with backend authentication.
 */

// Password visibility toggle
function togglePasswordVisibility() {
  const passwordInput = document.querySelector('[data-testid="auth-login-input-password"]');
  const toggleButton = document.querySelector('[data-testid="auth-login-button-toggle-password"]');

  if (!passwordInput || !toggleButton) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleButton.textContent = 'Show';
  }
}

// Forgot password message
function showForgotMessage() {
  authHelper.showToast('Not implemented', 'warning');
}

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.querySelector('[data-testid="auth-login-form"]');
  const emailInput = document.querySelector('[data-testid="auth-login-input-email"]');
  const passwordInput = document.querySelector('[data-testid="auth-login-input-password"]');
  const rememberCheckbox = document.querySelector('[data-testid="auth-login-checkbox-remember"]');

  // Auto-fill from localStorage if Remember Me was checked
  const savedEmail = localStorage.getItem('rememberedEmail');
  const savedUser = localStorage.getItem('rememberedUser');

  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberCheckbox) {
      rememberCheckbox.checked = true;
    }
  }

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    authHelper.clearFieldErrors(loginForm);

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

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
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedUser', result.user?.name || result.user?.email || email);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedUser');
        }

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

