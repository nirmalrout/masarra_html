import { $, $$ } from './utils.js';
import { subscribe, unreadCount, cartCount } from './state.js';

function updateBadges() {
  const set = (sel, n) => $$(sel).forEach(b => { b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0; });
  set('[data-cart-count]', cartCount());
  set('[data-unread-badge]', unreadCount());
}
export function initHeader() {
  const header = $('[data-site-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 4);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  subscribe(updateBadges); updateBadges();
}
