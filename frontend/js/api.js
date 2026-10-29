/**
 * Locus Copilot - API Client
 * Dynamic Port Handling | Unified Request Dispatcher | Bearer Auth
 */

(function (window) {
  'use strict';

  function getApiBase() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal && window.location.port !== '8000') {
      return 'http://localhost:8000/api';
    }
    return '/api';
  }

  async function apiFetch(endpoint, options = {}) {
    const base = getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = localStorage.getItem('token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: headers
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // If unauthorized, clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('is_admin');
        if (typeof window.Auth !== 'undefined' && typeof window.Auth.renderNavAuth === 'function') {
          window.Auth.renderNavAuth();
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (!err.status && err.name === 'TypeError') {
        throw new Error('Connection error. Is the Locus Copilot server running?');
      }
      throw err;
    }
  }

  window.API = {
    getBase: getApiBase,
    fetch: apiFetch
  };

  window.apiFetch = apiFetch;

})(window);
