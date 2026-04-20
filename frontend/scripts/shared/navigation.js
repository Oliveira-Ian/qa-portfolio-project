/**
 * Navigation — Sidebar toggle and active state management
 */

// User dropdown toggle
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
  const userMenu = document.querySelector('[data-testid="header-user-menu"]');
  const dropdown = document.getElementById('userDropdown');

  if (userMenu && dropdown && !userMenu.contains(event.target)) {
    dropdown.classList.remove('open');
  }
});

// Show About (no action)
function showAbout() {
  // No action needed
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}

// Initialize avatar with user name
function initUserAvatar() {
  const avatar = document.querySelector('[data-testid="header-user-avatar"]');
  if (avatar) {
    const userName = localStorage.getItem('rememberedUser') || 'User';
    avatar.textContent = userName.charAt(0).toUpperCase();
  }
}

(function () {
  function initNavigation() {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('[data-sidebar]');
    const main = document.querySelector('[data-main]');

    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        if (main) {
          main.classList.toggle('expanded');
        }
      });
    }

    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    const navItems = document.querySelectorAll('[data-nav-item]');

    navItems.forEach(function (item) {
      const href = item.getAttribute('data-href');
      if (href === currentPage) {
        item.classList.add('active');
      }
    });

    // Initialize user avatar
    initUserAvatar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();
