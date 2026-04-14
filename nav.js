
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.hamburger');
  const nav = document.querySelector('.nav-menu');
  if (!nav) return;

  if (btn) {
    e.preventDefault();
    nav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
  }

  if (nav.classList.contains('open') && !e.target.closest('.nav-menu') && !btn) {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
  }

  if (e.target.closest('.nav-menu a')) {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
});
