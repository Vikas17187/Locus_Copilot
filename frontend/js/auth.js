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
    const container = document.getElementById('navAuthContainer');
    if (!container) return;

    const token = getToken();
    const user = getUser();

    if (token && user) {
      const email = DOM.escapeHtml(user.email);
      const adminBadge = user.isAdmin
        ? '<a href="admin.html" class="btn btn-ghost btn-sm" style="color:var(--color-primary);font-weight:600;">Admin</a>'
        : '';

      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;">
          ${adminBadge}
          <a href="dashboard.html" class="btn btn-ghost btn-sm" title="Open user dashboard" style="display:flex;align-items:center;gap:0.4rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${email || 'Dashboard'}</span>
          </a>
          <button type="button" class="btn btn-secondary btn-sm" onclick="Auth.clearAuth()">Sign out</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="login.html" class="btn btn-secondary btn-sm">Sign in</a>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', renderNavAuth);

  window.Auth = {
    getToken: getToken,
    getUser: getUser,
    isAdmin: isAdmin,
    setAuth: setAuth,
    clearAuth: clearAuth,
    renderNavAuth: renderNavAuth
  };

})(window);
