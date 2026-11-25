import { esc, fmtDay, isoDay } from './utils.js';
import { icon } from './icons.js';
import { createCarousel } from './carousel.js';
import { observeReveals } from './animations.js';
import { flattenFields } from './search-panel.js';

/** Recent searches carousel; persisted per page in localStorage. */
export function createRecentSearches(host, cfg, { onRevisit }) {
  const KEY = `travel.recent.${cfg.key}`;
  let list = cfg.recent;
  try { list = JSON.parse(localStorage.getItem(KEY)) || cfg.recent; } catch { /* use defaults */ }
  const card = (r, i) => `<article class="rcard reveal" style="--i:${i}">
      <div class="rcard-title">${icon(cfg.icon)}<span>${esc(r.title)}</span></div>
      ${r.chip ? `<span class="rcard-chip">${esc(r.chip)}</span>` : ''}
      <div class="rcard-foot"><span>${fmtDay(r.date)}</span><button class="rcard-btn" type="button" data-revisit="${i}">Revisit</button></div></article>`;
  function render() {
    host.hidden = !list.length;
    host.innerHTML = '<div class="section-head"><h2>Recent Searches</h2></div><div data-car></div>';
    createCarousel(host.querySelector('[data-car]'), list, card, { className: 'carousel--grid carousel--recent' });
    observeReveals(host);
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-revisit]'); if (!b) return;
    onRevisit(list[b.dataset.revisit].values); scrollTo({ top: 0, behavior: 'smooth' });
  });
  render();
  return { add(values) {
    const dateField = flattenFields(cfg.search.fields).find(f => f.type === 'date');
    list = [{ title: cfg.recentTitle(values), chip: cfg.recentChip?.(values) || '', date: values[dateField?.name] || isoDay(), values }, ...list].slice(0, 6);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
    render();
  } };
}
