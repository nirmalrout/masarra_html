import { $, $$, esc } from './utils.js';
import { getState, setState, subscribe, unreadCount } from './state.js';
import { notifications } from '../data/notifications.js';

let anchor = null;
const fmtDate = mins => new Intl.DateTimeFormat(getState().language === 'ar' ? 'ar' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(Date.now() - mins * 6e4);

function position() {
  const { activePopover } = getState(); if (!activePopover || !anchor) return;
  const pop = $(`[data-popover="${activePopover}"]`), r = anchor.getBoundingClientRect(), w = pop.offsetWidth;
  pop.style.left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8) + 'px';
  pop.style.top = ($('[data-site-header]').offsetHeight + 6) + 'px';
}
function renderNotifications() {
  const { readIds } = getState();
  $('[data-notification-list]').innerHTML = notifications.map(n => `
    <div class="notif${readIds.includes(n.id) ? '' : ' is-unread'}"><strong>${esc(n.title)}</strong><div>${esc(n.text)}</div>
    <small>${fmtDate(n.minutesAgo)}${readIds.includes(n.id) ? '' : ` · <button class="link-btn" type="button" data-action="mark-read" data-id="${n.id}">Mark as Read</button>`}</small></div>`).join('');
  $('[data-unread-count]').textContent = unreadCount();
}
function sync() {
  const { activePopover, language, currency } = getState();
  $$('[data-popover]').forEach(p => p.classList.toggle('is-open', p.dataset.popover === activePopover));
  $$('[data-popover-target]').forEach(b => b.setAttribute('aria-expanded', b.dataset.popoverTarget === activePopover));
  $$('[data-lang]').forEach(b => { const on = b.dataset.lang === language; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
  $$('[data-currency]').forEach(b => { const on = b.dataset.currency === currency; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
  $$('[data-currency-label]').forEach(l => (l.textContent = currency));
  $$('[data-lang-label]').forEach(l => (l.textContent = language.toUpperCase()));
  document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  renderNotifications(); position();
}

export function initPopovers() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-popover-target]');
    if (btn) { const name = btn.dataset.popoverTarget; anchor = btn;
      setState({ activePopover: getState().activePopover === name ? null : name, cartOpen: false }); return; }
    const lang = e.target.closest('[data-lang]'); if (lang) return setState({ language: lang.dataset.lang });
    const cur = e.target.closest('[data-currency]'); if (cur) return setState({ currency: cur.dataset.currency });
    const act = e.target.closest('[data-action]');
    if (act?.dataset.action === 'mark-read') return setState({ readIds: [...new Set([...getState().readIds, act.dataset.id])] });
    if (act?.dataset.action === 'mark-all-read') return setState({ readIds: notifications.map(n => n.id) });
    if (!e.target.closest('.popover') && getState().activePopover) setState({ activePopover: null });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && getState().activePopover) setState({ activePopover: null }); });
  addEventListener('resize', position);
  subscribe(sync); sync();
}
