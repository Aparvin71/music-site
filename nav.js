// v43.1.81 unified hamburger page menu
(function () {
  function getNav() { return document.getElementById('siteNavLinks') || document.querySelector('.nav-menu'); }
  function getToggle() { return document.getElementById('mobileNavToggle') || document.querySelector('.hamburger'); }
  function closeMenu(nav, toggle) {
    if (!nav) return;
    nav.classList.remove('nav-open', 'open');
    document.body.classList.remove('nav-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }
  }
  function openMenu(nav, toggle) {
    if (!nav) return;
    nav.classList.add('nav-open', 'open');
    document.body.classList.add('nav-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = '✕';
    }
  }
  function toggleMenu() {
    const nav = getNav();
    const toggle = getToggle();
    if (!nav) return;
    if (nav.classList.contains('nav-open') || nav.classList.contains('open')) closeMenu(nav, toggle);
    else openMenu(nav, toggle);
  }
  document.addEventListener('click', function (e) {
    const nav = getNav();
    const navToggle = getToggle();
    const moreButton = e.target.closest('[data-open-nav]');
    if (moreButton) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
      return;
    }
    const nativeToggle = e.target.closest('#mobileNavToggle, .hamburger');
    if (nativeToggle) {
      // app.js owns the header hamburger on music-runtime pages; avoid double-toggling.
      if (window.__AINEO_APP_JS_NAV__) return;
      e.preventDefault();
      toggleMenu();
      return;
    }
    if (!nav) return;
    if ((nav.classList.contains('nav-open') || nav.classList.contains('open')) && !e.target.closest('#siteNavLinks, .nav-menu')) {
      closeMenu(nav, navToggle);
    }
    if (e.target.closest('#siteNavLinks a, .nav-menu a')) {
      closeMenu(nav, navToggle);
    }
  });
  window.AineoNav = { open: function() { openMenu(getNav(), getToggle()); }, close: function() { closeMenu(getNav(), getToggle()); }, toggle: toggleMenu };
})();
