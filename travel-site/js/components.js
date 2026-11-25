// Fetches shared HTML components into the page.
export async function loadComponent(name, host) {
  const target = typeof host === 'string' ? document.querySelector(host) : host;
  if (!target) { console.error(`[components] mount point missing for "${name}"`); return false; }
  try {
    const res = await fetch(`components/${name}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    target.insertAdjacentHTML('beforeend', await res.text());
    return true;
  } catch (err) {
    console.error(`[components] failed to load "${name}"`, err);
    target.insertAdjacentHTML('beforeend', `<div class="component-error">Could not load ${name}. Run the site through a local server.</div>`);
    return false;
  }
}
export function loadSharedComponents() {
  return Promise.all([
    loadComponent('header', '#app-header'),
    loadComponent('footer', '#app-footer'),
    ...['user-popover', 'language-popover', 'currency-popover', 'notification-popover', 'admin-popover', 'cart-drawer'].map(n => loadComponent(n, '#app-overlays'))
  ]);
}
