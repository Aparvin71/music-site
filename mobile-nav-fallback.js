(function () {
  function closeNav(toggle, nav) {
    if (!toggle || !nav) return;
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
  }

  function bindMobileNav() {
    const toggle = document.getElementById('mobileNavToggle');
    const nav = document.getElementById('siteNavLinks');
    if (!toggle || !nav || toggle.dataset.fallbackNavBound === 'true') return;

    toggle.dataset.fallbackNavBound = 'true';

    const handleToggle = function (event) {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.textContent = isOpen ? '✕' : '☰';
      document.body.classList.toggle('nav-open', isOpen);
    };

    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('touchend', handleToggle, { passive: false });

    nav.querySelectorAll('a').forEach(function (link) {
      if (link.dataset.fallbackNavCloseBound === 'true') return;
      link.dataset.fallbackNavCloseBound = 'true';
      link.addEventListener('click', function () {
        closeNav(toggle, nav);
        document.body.classList.remove('nav-open');
      });
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('nav-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeNav(toggle, nav);
      document.body.classList.remove('nav-open');
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 640) {
        closeNav(toggle, nav);
        document.body.classList.remove('nav-open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindMobileNav);
  } else {
    bindMobileNav();
  }
})();
