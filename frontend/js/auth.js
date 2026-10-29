/**
 * Locus Copilot - Authentication & Nav State Manager
 */

(function (window) {
  'use strict';

  function getToken() {
    return localStorage.getItem('token');
  }

  function getUser() {
    const token = getToken();
    if (!token) return null;
    return {
      email: localStorage.getItem('email') || '',
      isAdmin: localStorage.getItem('is_admin') === 'true'
    };
  }

  function isAdmin() {
    return localStorage.getItem('is_admin') === 'true';
  }

  function setAuth(token, user) {
    if (!token) return;
    localStorage.setItem('token', token);
    if (user) {
      if (user.email) localStorage.setItem('email', user.email);
      if (user.is_admin !== undefined) localStorage.setItem('is_admin', String(user.is_admin));
    }
    renderNavAuth();
  }

  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('is_admin');
    renderNavAuth();
    window.location.href = 'index.html';
  }

  function renderNavAuth() {
    const user = getUser();
    const token = getToken();

    // Toggle Admin link in main navigation if admin
    const navAdminItems = document.querySelectorAll('#navAdminItem, .nav-admin-link');
    navAdminItems.forEach(el => {
      el.style.display = (user && user.isAdmin) ? '' : 'none';
    });

    const container = document.getElementById('navAuthContainer');
    if (!container) return;

    if (token && user) {
      const email = DOM.escapeHtml(user.email);
      const shortName = email.split('@')[0];
      const initial = email.charAt(0).toUpperCase();

      container.innerHTML = `
        <div class="apple-account-menu" id="appleAccountMenu">
          <button type="button" class="account-pill-btn" onclick="Auth.toggleAccountMenu(event)" aria-label="Account menu for ${email}" aria-expanded="false">
            <span class="account-avatar-circle">${initial}</span>
            <span class="account-pill-label" style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${shortName}</span>
            <svg class="account-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="account-dropdown-panel" id="accountDropdownPanel" role="menu">
            <div class="dropdown-header">
              <div class="dropdown-user-name">${shortName}</div>
              <div class="dropdown-user-email">${email}</div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="dashboard.html" class="dropdown-item" role="menuitem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Saved Locations &amp; Preferences
            </a>
            ${user.isAdmin ? `
              <a href="admin.html" class="dropdown-item" role="menuitem" style="color:var(--color-primary);font-weight:600;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                Admin Console
              </a>
            ` : ''}
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item dropdown-signout" role="menuitem" onclick="Auth.clearAuth()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="login.html" class="nav-auth-link">Sign In</a>
      `;
    }
  }

  function toggleAccountMenu(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById('appleAccountMenu');
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    const btn = menu.querySelector('.account-pill-btn');
    if (btn) btn.setAttribute('aria-expanded', String(!isOpen));
  }

  // Close account dropdown on outside click
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('appleAccountMenu');
    if (menu && menu.classList.contains('open')) {
      if (!menu.contains(e.target)) {
        menu.classList.remove('open');
        const btn = menu.querySelector('.account-pill-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('DOMContentLoaded', renderNavAuth);

  window.Auth = {
    getToken: getToken,
    getUser: getUser,
    isAdmin: isAdmin,
    setAuth: setAuth,
    clearAuth: clearAuth,
    renderNavAuth: renderNavAuth,
    toggleAccountMenu: toggleAccountMenu
  };

})(window);
