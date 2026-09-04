// Page-specific behavior. Runs after the shared header/footer partials are injected
// (see js/include.js), so it can safely query elements that live inside the header.
document.addEventListener('includesLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});
