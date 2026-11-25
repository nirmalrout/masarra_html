// Entry point: load components -> init header, popovers, cart, navigation -> page module.
import { loadSharedComponents } from './components.js';
import { initHeader } from './header.js';
import { initPopovers } from './popovers.js';
import { initCart } from './cart.js';
import { initNavigation } from './navigation.js';

async function bootstrap() {
  if (location.protocol === 'file:') {
    document.body.insertAdjacentHTML('afterbegin', '<div class="component-error">Open this site through a local server (see README), not file://.</div>');
    return;
  }
  await loadSharedComponents();
  initNavigation(); initHeader(); initPopovers(); initCart();
  const page = document.body.dataset.module;            // e.g. data-module="home" -> js/home.js
  if (page) {
    try { (await import(`./${page}.js`)).init?.(); }
    catch (e) {
      console.error(`[app] page module "${page}" failed`, e);
      // A failed module import hides *which* file is missing, so walk the import graph and name it.
      const missing = await findMissing(new URL(`js/${page}.js`, location.href).href).catch(() => []);
      const detail = missing.length ? `Missing or unreachable file(s): ${missing.map(u => u.replace(location.origin, '')).join(', ')}` : e.message;
      (document.querySelector('#listing-root') || document.querySelector('main'))?.insertAdjacentHTML('beforeend', `<div class="component-error" style="margin:2rem"><b>Could not load the "${page}" page.</b><br>${detail}<br><small>Copy the missing file(s) into the project (same paths), then hard-refresh with Ctrl+Shift+R.</small></div>`);
    }
  }
}

/** Recursively fetches a module and its static relative imports; returns the URLs that fail to load. */
async function findMissing(url, seen = new Set()) {
  if (seen.has(url)) return []; seen.add(url);
  const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (!res || !res.ok) return [url];
  const src = await res.text(), out = [];
  for (const m of src.matchAll(/(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g)) {
    const spec = m[1] || m[2];
    if (spec.startsWith('.')) out.push(...await findMissing(new URL(spec, res.url).href, seen));
  }
  return out;
}
bootstrap();