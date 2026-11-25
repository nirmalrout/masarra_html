import { $, $$, esc } from './utils.js';
import { icon } from './icons.js';
import { navItems } from '../data/navigation.js';
import { getState, setState, subscribe } from './state.js';

export function initNavigation() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const html = navItems.map(i => { const active = i.href === current || i.aliases?.includes(current);
    return `<a class="nav-link${active ? ' is-active' : ''}" href="${i.href}"${active ? ' aria-current="page"' : ''}>${icon(i.icon)}<span>${esc(i.label)}</span></a>`; }).join('');
  $$('[data-nav-list]').forEach(n => (n.innerHTML = html));

  // Mobile menu gets copies of the action buttons (handled by delegated listeners elsewhere)
  const actions = $('[data-actions]'), mobile = $('[data-mobile-actions]');
  if (actions && mobile) mobile.append(...[...actions.children].map(c => c.cloneNode(true)));

  const menu = $('[data-mobile-menu]');
  document.addEventListener('click', e => {
    if (e.target.closest('[data-menu-toggle]')) setState({ mobileNavOpen: !getState().mobileNavOpen });
    else if (getState().mobileNavOpen && (e.target.closest('.nav-link') || !e.target.closest('[data-site-header]'))) setState({ mobileNavOpen: false });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && getState().mobileNavOpen) setState({ mobileNavOpen: false }); });
  matchMedia('(min-width:1024px)').addEventListener('change', e => e.matches && setState({ mobileNavOpen: false }));
  subscribe(({ mobileNavOpen }) => {
    menu.classList.toggle('is-open', mobileNavOpen);
    $$('[data-menu-toggle]').forEach(b => b.setAttribute('aria-expanded', mobileNavOpen));
  });
}
