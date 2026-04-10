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

    // Define colors and icons based on toast type
    const toastVariants = {
      success: {
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        text: '#065f46',
        icon: '✓'
      },
      error: {
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        text: '#7f1d1d',
        icon: '✕'
      },
      warning: {
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        text: '#78350f',
        icon: '⚠'
      }
    };

    const variant = toastVariants[type] || toastVariants.error;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.minWidth = '280px';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '500';
    toast.style.lineHeight = '1.5';
    toast.style.color = variant.text;
    toast.style.backgroundColor = variant.bg;
    toast.style.background = variant.bg;
    toast.style.boxShadow = '0 10px 35px rgba(0, 0, 0, 0.12)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.transform = 'translateX(400px)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.backdropFilter = 'blur(10px)';

    // Add icon and message
    const icon = document.createElement('span');
    icon.textContent = variant.icon;
    icon.style.fontSize = '1.2rem';
    icon.style.fontWeight = 'bold';
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(400px)';
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
