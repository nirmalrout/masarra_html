// Shared page composer for Hotels / Experiences / Transfers / Packages: Banner + Recent Searches + Best-selling carousels.
import { $, esc, tileStyle } from './utils.js';
import { icon } from './icons.js';
import { createCarousel } from './carousel.js';
import { addToCart } from './cart.js';
import { renderBanner } from './banner.js';
import { renderSearch } from './search-panel.js';
import { createRecentSearches } from './recent-searches.js';
import { observeReveals } from './animations.js';

const stars = r => `<span class="tcard-stars" role="img" aria-label="${r} out of 5">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span>`;

function card(it, s, i) {
  const loc = s.pin ? `<div class="tcard-loc">${icon('pin')}${it.location ? `<span>${esc(it.location)}</span>` : ''}</div>` : '';
  return `<article class="tcard reveal" style="--ratio:${s.ratio || 1.12};--i:${i}">
    <div class="tcard-img" style="${tileStyle(it.image, s.ratio || 1.12)}" role="img" aria-label="${esc(it.name)}"></div><div class="tcard-shade"></div>${loc}
    <div class="tcard-foot"><div><h3>${esc(it.name)}</h3>${it.rating ? stars(it.rating) : ''}</div>
    ${s.book === false ? '' : `<button class="tcard-book" type="button" data-add="${it.id}">Book</button>`}</div></article>`;
}

export function initListingPage(cfg) {
  const root = $('#listing-root');
  root.innerHTML = `<section class="banner" data-banner aria-label="Search"></section>
    <div class="container-app"><section class="section" data-recent></section><div data-sections></div></div>`;
  const recent = createRecentSearches($('[data-recent]', root), cfg, { onRevisit: v => search.setValues(v) });
  const search = renderSearch(cfg, { onSearch: v => { recent.add(v); if (cfg.resultsUrl) { sessionStorage.setItem(`travel.query.${cfg.key}`, JSON.stringify(v)); location.href = cfg.resultsUrl; } } });
  renderBanner($('[data-banner]', root), cfg.banner, search.el);

  const all = new Map(), host = $('[data-sections]', root);
  cfg.sections.forEach(s => {
    const sec = document.createElement('section');
    sec.className = `section${s.title ? '' : ' section--cont'}`;
    sec.innerHTML = `${s.title ? `<div class="section-head reveal"><h2>${esc(s.title)}</h2></div>` : ''}<div data-car></div>`;
    host.append(sec);
    s.items.forEach(it => all.set(it.id, it));
    const cls = `carousel--grid carousel--tc${s.narrow ? ' carousel--narrow' : ''}`;
    createCarousel($('[data-car]', sec), s.items, (it, i) => card(it, s, i), { className: cls });
    $('[data-car]', sec).style.setProperty('--per-lg', s.per || 4);
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const it = all.get(b.dataset.add); addToCart({ id: it.id, name: it.name, image: it.image, price: it.price });
  });
  observeReveals(root);
}
