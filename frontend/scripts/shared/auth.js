(function () {
  const origin = window.location.origin;
  const apiBase = (window.location.protocol.startsWith('http') && origin !== 'null')
    ? `${origin}/api/auth`
    : 'http://localhost:3000/api/auth';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showToast(message, type = 'error') {
    let container = document.getElementById('toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '1rem';
      container.style.right = '1rem';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '0.75rem';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    toast.style.minWidth = '260px';
    toast.style.padding = '14px 18px';
    toast.style.borderRadius = '12px';
    toast.style.fontSize = '0.95rem';
    toast.style.boxShadow = '0 14px 44px rgba(15, 23, 42, 0.12)';
    toast.style.color = '#ffffff';
    toast.style.backgroundColor = type === 'success' ? '#0f766e' : '#dc2626';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    toast.style.transform = 'translateY(-8px)';

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      toast.addEventListener('transitionend', () => {
        toast.remove();
      }, { once: true });
    }, 4200);
  }

  function clearFieldErrors(form) {
    if (!form) return;
    form.querySelectorAll('[data-error]').forEach((node) => {
      node.textContent = '';
    });
  }

  function setFieldError(testId, message) {
    const errorNode = document.querySelector(`[data-testid="${testId}"]`);
    if (errorNode) {
      errorNode.textContent = message;
    }
  }

  function redirect(path) {
    if (window.location.protocol === 'file:') {
      if (path === '/login') {
        window.location.href = 'login.html';
        return;
      }
      if (path === '/home') {
        window.location.href = '../home.html';
        return;
      }
    }
    window.location.href = path;
  }

  async function postJson(path, payload) {
    const url = `${apiBase}${path}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  window.authHelper = {
    apiBase,
    isValidEmail,
    showToast,
    clearFieldErrors,
    setFieldError,
    redirect,
    postJson,
  };
})();
