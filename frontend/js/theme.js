/**
 * Locus Copilot - Theme Controller
 * Respects OS Preferences | Zero Unwanted Storage Overwrites | Accessible Toggle
 */

(function (window) {
  'use strict';

  function getSystemPreference() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function getCurrentTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return getSystemPreference();
  }

  function applyTheme(theme, isExplicitUserAction = false) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.body && document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body && document.body.classList.remove('dark-theme');
    }

    if (isExplicitUserAction) {
      localStorage.setItem('theme', theme);
    }

    // Update all theme toggle buttons across DOM
    const toggles = document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn');
    toggles.forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.innerHTML = theme === 'dark'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });

    // Notify any map or vector listener
    if (typeof window.onThemeChanged === 'function') {
      window.onThemeChanged(theme);
    }
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  function initTheme() {
    // Initial load: apply without overriding localStorage
    const theme = getCurrentTheme();
    applyTheme(theme, false);

    // Watch for OS theme changes if user has not set explicit preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  // Auto-run on script execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  window.Theme = {
    getCurrentTheme: getCurrentTheme,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    initTheme: initTheme
  };

  window.toggleTheme = toggleTheme;

})(window);
