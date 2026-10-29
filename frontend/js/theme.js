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
    const isGlass = theme === 'dark' || theme === 'glass';
    const effectiveTheme = isGlass ? 'dark' : 'light';

    if (isGlass) {
      document.documentElement.classList.add('dark-theme');
      document.body && document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'glass-mono');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body && document.body.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-theme', 'executive-class');
    }

    if (isExplicitUserAction) {
      localStorage.setItem('theme', effectiveTheme);
    }

    // Update all theme switch pills and buttons across DOM
    const toggles = document.querySelectorAll('.theme-switch-pill, .theme-switch-btn, .theme-toggle-btn, #themeToggleBtn');
    toggles.forEach(btn => {
      btn.setAttribute('aria-label', isGlass ? 'Switch to Executive Class theme' : 'Switch to Obsidian Glass theme');
      btn.title = isGlass ? 'Current: Pure Black & White Glassmorphism · Click for Executive Class' : 'Current: Purely Professional & Class · Click for Obsidian Glass';

      const labelEl = btn.querySelector('.theme-pill-text') || btn.querySelector('.pill-label');
      if (labelEl) {
        labelEl.textContent = isGlass ? 'Obsidian Glass' : 'Executive Class';
      } else {
        btn.innerHTML = isGlass
          ? '<span class="theme-pill-dot" style="margin-right:4px;"></span><span class="theme-pill-text">Obsidian Glass</span>'
          : '<span class="theme-pill-dot" style="margin-right:4px;"></span><span class="theme-pill-text">Executive Class</span>';
      }
    });

    // Notify any map or vector listener
    if (typeof window.onThemeChanged === 'function') {
      window.onThemeChanged(effectiveTheme);
    }
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const next = (current === 'dark' || current === 'glass') ? 'light' : 'dark';
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
