/**
 * Locus Copilot - DOM Utilities & Security
 * HTML Escaping | Accessible Modal Dialogs | Tab Management
 */

(function (window) {
  'use strict';

  /**
   * Escape unsafe HTML strings to permanently prevent XSS vulnerabilities.
   * @param {*} str - Raw string or value
   * @returns {string} - Escaped string safe for innerHTML interpolation
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Accessible Modal Management with Focus Trap & Escape Key Listener
   */
  let lastActiveElement = null;

  function openModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    lastActiveElement = document.activeElement;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');

    const dialog = backdrop.querySelector('.modal-dialog') || backdrop;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // Focus first focusable element inside modal
    const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    // Add keydown listener for Escape and Tab trap
    document.addEventListener('keydown', handleModalKeyDown);
  }

  function closeModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleModalKeyDown);

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function handleModalKeyDown(e) {
    const openBackdrop = document.querySelector('.modal-backdrop.open');
    if (!openBackdrop) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(openBackdrop.id);
      return;
    }

    if (e.key === 'Tab') {
      const dialog = openBackdrop.querySelector('.modal-dialog') || openBackdrop;
      const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Export to global scope
  window.DOM = {
    escapeHtml: escapeHtml,
    openModal: openModal,
    closeModal: closeModal
  };

  // Global shortcut for rapid templating
  window.escapeHtml = escapeHtml;

})(window);
