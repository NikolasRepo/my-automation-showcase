// Loads shared header/footer partials into any element with a [data-include] attribute,
// then highlights the current page's nav link and stamps the footer year.
async function loadIncludes() {
  const targets = document.querySelectorAll('[data-include]');
  await Promise.all(
    Array.from(targets).map(async (el) => {
      const file = el.getAttribute('data-include');
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
        el.innerHTML = await res.text();
      } catch (err) {
        console.error(err);
        el.innerHTML = '';
      }
    })
  );
  highlightActiveNav();
  setFooterYear();
  document.dispatchEvent(new CustomEvent('includesLoaded'));
}

function highlightActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.site-nav a[data-nav]').forEach((link) => {
    if (link.dataset.nav === current) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

function setFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', loadIncludes);
