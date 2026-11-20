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
  if (page) { try { (await import(`./${page}.js`)).init?.(); } catch (e) { console.error(`[app] page module "${page}" failed`, e);
      (document.querySelector('#listing-root') || document.querySelector('main'))?.insertAdjacentHTML('beforeend', `<div class="component-error" style="margin:2rem">Could not load the "${page}" page: ${e.message}. Open the browser console (F12) for details.</div>`); } }
}
bootstrap();
