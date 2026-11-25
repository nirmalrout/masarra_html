import { $, $$, esc, tileStyle, fmtDay, isoDay } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { renderSearch } from './search-panel.js';
import { config as hotelsConfig } from '../data/hotels-data.js';
import { hotels, mealNames } from '../data/hotel-results-data.js';
import { openModal, openDetails, openMap, openCompare, openAvailability, toast, money, stars, minPrice } from './hotel-popups.js';

/** Opens the Hotel Detail page, passing the selected hotel through sessionStorage (?id= is the fallback). */
const goDetails = h => { sessionStorage.setItem('travel.hotel', JSON.stringify(h)); location.href = `hotel-details.html?id=${encodeURIComponent(h.id)}`; };
const PAGE = 5, MAX_CMP = 4, FAV_KEY = 'travel.favorites';
const prices = hotels.flatMap(h => h.rooms.map(r => r.price)), MIN = Math.min(...prices), MAX = Math.max(...prices);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const S = { q: null, favs: new Set(load(FAV_KEY, ['h1'])), cmp: [], open: new Set(), page: 1, shown: 0, sort: null, f: null };
const resetFilters = () => (S.f = { fav: false, name: '', stars: new Set(), meals: new Set(), cancel: new Set(), avail: new Set(), min: MIN, max: MAX });

/* ---------- query / summary ---------- */
function readQuery() {
  try { S.q = JSON.parse(sessionStorage.getItem('travel.query.hotels')); } catch { /* none */ }
  const def = { destination: 'Abu Dhabi, United Arab Emirates', checkin: isoDay(7), checkout: isoDay(8), nights: 1, guests: '1 Room, 2 Adults', market: 'Indian' };
  // Merge with defaults so empty/missing fields from the search form never break the page
  S.q = Object.fromEntries(Object.entries({ ...def, ...(S.q || {}) }).map(([k, v]) => [k, v === '' || v == null ? def[k] ?? '' : v]));
}
const d = s => { const x = new Date(s + 'T00:00'); return isNaN(x) ? '—' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(x); };
function renderSummary() {
  const q = S.q, n = Number(q.nights) || 1, cell = (l, ic, v, sub = '') => `<div class="hr-sum"><span class="hr-sum__l">${l}</span><span class="hr-sum__v">${icon(ic)}<b>${esc(v)}</b></span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  $('#hrSummary').innerHTML = cell('City/Hotel', 'building', q.destination || 'Any destination') + cell('Check-In & Check-Out', 'calendar', `${d(q.checkin)} to ${d(q.checkout)}`, `${n} Night${n > 1 ? 's' : ''}`) + cell('Guests', 'bed', q.guests) + cell('Source Market', 'map', q.market);
  $('#hrModify').innerHTML = `${icon('search')}Modify Search`;
}

/* ---------- filters (generated from data) ---------- */
function facets() {
  const count = fn => { const m = new Map(); hotels.forEach(h => new Set(fn(h)).forEach(k => m.set(k, (m.get(k) || 0) + 1))); return m; };
  return { stars: count(h => [h.stars]), meals: count(h => h.rooms.map(r => r.meal)), cancel: count(h => h.rooms.map(r => r.policy)), avail: count(h => h.rooms.map(r => r.onRequest ? 'req' : 'avail')) };
}
const chk = (g, v, label, n, extra = '') => `<label class="hr-chk"><input type="checkbox" data-f="${g}" value="${v}"><span class="box"></span><span class="lbl">${label}</span>${extra}<em>(${n})</em></label>`;
function renderFilters() {
  const F = facets(), adults = (S.q.guests.match(/(\d+)\s*Adult/i) || [, 2])[1], rooms = (S.q.guests.match(/(\d+)\s*Room/i) || [, 1])[1];
  $('#hrFilters').innerHTML = `<div class="hr-fhead"><button class="hr-clear" data-clear type="button">Clear all</button><button class="hr-fclose" data-close-f type="button" aria-label="Close filters">${icon('close')}</button></div>
    <div class="hr-fsec"><h4>Favorites</h4>${chk('fav', '1', 'Only Favorites', S.favs.size)}</div>
    <div class="hr-fsec hr-fsec--muted"><div class="hr-row"><span>Search for</span><span>Result</span></div><div class="hr-row"><span class="hr-gl">${icon('bed')}${rooms} ${icon('user')}${adults}</span><b id="hrRes"></b></div></div>
    <div class="hr-fsec"><h4>Price</h4><div class="hr-row"><span class="hr-chip" id="pMin"></span><span class="hr-chip" id="pMax"></span></div>
      <div class="hr-dual"><div class="hr-dual__track"><i id="pFill"></i></div><input type="range" data-p="min" min="${MIN}" max="${MAX}" step="5" value="${MIN}" aria-label="Minimum price"><input type="range" data-p="max" min="${MIN}" max="${MAX}" step="5" value="${MAX}" aria-label="Maximum price"></div></div>
    <div class="hr-fsec"><div class="hr-row"><h4>Filter By Hotel</h4><button class="hr-apply" data-apply type="button">Apply</button></div><input class="hr-input" id="fName" type="search" placeholder="Hotel name" aria-label="Filter by hotel name"></div>
    <div class="hr-fsec"><h4>Star Category</h4>${[...F.stars].sort((a, b) => a[0] - b[0]).map(([k, n]) => chk('stars', k, stars(k), n)).join('')}</div>
    <div class="hr-fsec"><h4>Meal plan</h4>${[...F.meals].map(([k, n]) => chk('meals', k, mealNames[k] || k, n, `<span class="hr-tag">${k}</span>`)).join('')}</div>
    <div class="hr-fsec"><h4>Cancellation policy</h4>${[...F.cancel].map(([k, n]) => chk('cancel', k, k, n)).join('')}</div>
    <div class="hr-fsec"><h4>Availability</h4>${[...F.avail].map(([k, n]) => chk('avail', k, k === 'req' ? 'On Request' : 'Instant booking', n)).join('')}</div>`;
  syncPrice();
}
function syncPrice() {
  const { min, max } = S.f, span = MAX - MIN || 1;
  $('#pMin').textContent = money(min); $('#pMax').textContent = max >= MAX ? `${money(max)}` : money(max);
  Object.assign($('#pFill').style, { left: `${(min - MIN) / span * 100}%`, right: `${100 - (max - MIN) / span * 100}%` });
}

/* ---------- filter + sort ---------- */
function visible() {
  const f = S.f;
  let list = hotels.filter(h => (!f.fav || S.favs.has(h.id)) && (!f.name || h.name.toLowerCase().includes(f.name.toLowerCase())) && (!f.stars.size || f.stars.has(h.stars))
    && (!f.meals.size || h.rooms.some(r => f.meals.has(r.meal))) && (!f.cancel.size || h.rooms.some(r => f.cancel.has(r.policy)))
    && (!f.avail.size || h.rooms.some(r => f.avail.has(r.onRequest ? 'req' : 'avail'))) && h.rooms.some(r => r.price >= f.min && r.price <= f.max));
  if (S.sort) { const { key, dir } = S.sort; list = [...list].sort((a, b) => dir * (key === 'name' ? a.name.localeCompare(b.name) : minPrice(a) - minPrice(b))); }
  return list;
}

/* ---------- cards ---------- */
function roomRow(h, r, i) {
  const pol = `${r.policy}${r.onRequest ? ' <b>ON REQUEST</b>' : ''}`;
  if (r.startingFrom) return `<div class="hr-room hr-room--from" data-r="${i}"><div class="hr-room__name"><strong>${esc(r.name)}</strong><i title="Room details">${icon('info')}</i><small>${pol}</small></div><div class="hr-from"><span>PRICE STARTING FROM</span><b>${money(r.price)}</b></div><button class="hr-btn hr-btn--o hr-btn--sm" data-act="avail">CHECK PRICE</button></div>`;
  return `<div class="hr-room${r.onRequest ? ' is-req' : ''}" data-r="${i}">
    <div class="hr-room__name"><strong>${esc(r.name)}</strong><i title="${esc(r.name)} – ${mealNames[r.meal]}">${icon('info')}</i><small>${pol}</small></div>
    <div class="hr-room__disc">${r.discount ? `<span class="hr-pill">${r.discount}</span>` : r.bonus ? '<span class="hr-pill">Bonus Benefits</span>' : ''}</div>
    <div class="hr-room__tags"><span class="hr-tag" title="Package">P</span><button class="hr-tag hr-tag--cal" data-act="avail" aria-label="Check availability calendar">${icon('calendar')}</button><span class="hr-tag hr-tag--m" title="${mealNames[r.meal]}">${r.meal}</span></div>
    <div class="hr-room__price"><b>${money(r.price)}</b>${r.was ? `<s>${money(r.was)}</s>` : ''}</div>
    <div class="hr-room__btns"><button class="hr-btn hr-btn--o hr-btn--sm" data-act="rate">Detail</button><button class="hr-btn hr-btn--p hr-btn--sm" data-act="${r.onRequest ? 'request' : 'book'}">${r.onRequest ? 'Send Request' : 'Book Now'}</button></div>
    <button class="hr-cart" data-act="cart" aria-label="Add to cart">${icon('cart')}</button></div>`;
}
function card(h, i) {
  const rooms = S.open.has(h.id) ? h.rooms : h.rooms.slice(0, 3), fav = S.favs.has(h.id);
  const stats = h.stats ? `<div class="hr-stats">${h.stats.map((n, k) => `<span>${icon(['building', 'walk', 'bed'][k])}${n}</span>`).join('')}</div>` : '';
  return `<article class="hr-card${fav ? ' is-fav' : ''}" data-id="${h.id}" style="--i:${i % PAGE}">
    <div class="hr-card__top" style="cursor:pointer"><button class="hr-img" data-act="details" style="${tileStyle(h.image, 1.05)}" aria-label="View ${esc(h.name)} photos"></button>
      <div class="hr-info"><div class="hr-head"><div><h3 class="hr-name"><button data-act="details">${esc(h.name)}</button></h3>
        <p class="hr-addr"><u>${esc(h.address)}</u><button data-act="map" aria-label="Show on map">${icon('pin')}</button></p>${stars(h.stars)}</div>
        <div class="hr-acts"><button class="hr-heart${fav ? ' is-on' : ''}" data-act="fav" aria-pressed="${fav}" aria-label="Favorite">${icon('heart')}</button>
          <button class="hr-cmpbtn${S.cmp.includes(h.id) ? ' is-on' : ''}" data-act="compare" aria-pressed="${S.cmp.includes(h.id)}">${icon('share')}<span>Compare</span></button></div></div>
        ${stats}<p class="hr-desc">${esc(h.desc)}</p><button class="hr-link" data-act="more">Read More</button></div></div>
    <div class="hr-rooms">${rooms.map((r, k) => roomRow(h, r, k)).join('')}</div>
    ${h.rooms.length > 3 ? `<div class="hr-more"><button data-act="rooms" aria-expanded="${S.open.has(h.id)}">${icon('expand')}${S.open.has(h.id) ? 'View Fewer Rooms' : 'View More Rooms'}</button></div>` : ''}</article>`;
}
const skeleton = n => Array.from({ length: n }, () => '<div class="hr-skel"><i></i><div><b></b><b></b><b></b></div></div>').join('');

/* ---------- list drawing ---------- */
let current = [];
function draw(reset = true) {
  const list = $('#hrList'), prev = S.shown; current = visible();
  if (reset) { list.innerHTML = ''; S.shown = 0; S.page = 1; S.open.clear(); }
  const end = Math.min(S.page * PAGE, current.length);
  list.insertAdjacentHTML('beforeend', current.slice(reset ? 0 : prev, end).map((h, i) => card(h, i)).join('')); S.shown = end;
  $('#hrCount').textContent = `${current.length} of ${hotels.length} hotels`; const res = $('#hrRes'); if (res) res.textContent = `${current.length} Hotels`;
  if (!current.length) list.innerHTML = `<div class="hr-empty">${icon('search')}<h3>No hotels match your filters</h3><p>Try widening the price range or clearing filters.</p><button class="hr-btn hr-btn--p" data-clear>Clear all filters</button></div>`;
  $('#hrLoad').innerHTML = end < current.length ? `<button class="hr-btn hr-btn--o hr-loadmore" data-more type="button">Load More <small>(${current.length - end} remaining)</small></button>` : (current.length ? '<p class="hr-muted">You\'ve reached the end of the results.</p>' : '');
  const anyF = S.f.fav || S.f.name || S.f.stars.size || S.f.meals.size || S.f.cancel.size || S.f.avail.size || S.f.min > MIN || S.f.max < MAX;
  $('[data-clear]')?.classList.toggle('is-on', !!anyF);
}
function refresh(reset = true) { draw(reset); }
function renderCmp() {
  const n = S.cmp.length, bar = $('#hrCmp');
  document.body.classList.toggle('has-cmp', n > 0); bar.classList.toggle('is-on', n > 0);
  bar.innerHTML = `<div class="hr-wrap hr-cmpbar__in"><span class="hr-cmpbar__t">${icon('share')}<b>Hotel comparison (${n} out of ${MAX_CMP})</b><span class="hr-muted">${n < 2 ? 'Select at least one more hotel' : 'Ready to compare'}</span></span>
    <span class="hr-cmpbar__b"><button class="hr-btn hr-btn--close" data-desel type="button">Deselect all</button><button class="hr-btn hr-btn--p" data-run type="button" ${n < 2 ? 'disabled' : ''}>Compare</button></span></div>`;
  $$('.hr-cmpbtn').forEach(b => { const on = S.cmp.includes(b.closest('.hr-card').dataset.id); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
}

/* ---------- events ---------- */
function onAct(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const el = b.closest('.hr-card'), h = hotels.find(x => x.id === el.dataset.id), ri = Number(b.closest('.hr-room')?.dataset.r ?? 0), room = h.rooms[ri], act = b.dataset.act;
  if (act === 'details') goDetails(h); else if (act === 'rate') openDetails(h, 'rate'); else if (act === 'map') openMap([h], h.id);
  else if (act === 'avail') openAvailability(h, ri);
  else if (act === 'more') { const p = el.querySelector('.hr-desc'); p.classList.toggle('is-open'); b.textContent = p.classList.contains('is-open') ? 'Read Less' : 'Read More'; }
  else if (act === 'rooms') { S.open.has(h.id) ? S.open.delete(h.id) : S.open.add(h.id); el.outerHTML = card(h, 0).replace('<article', '<article data-keep'); }
  else if (act === 'fav') { S.favs.has(h.id) ? S.favs.delete(h.id) : S.favs.add(h.id); localStorage.setItem(FAV_KEY, JSON.stringify([...S.favs])); el.classList.toggle('is-fav'); b.classList.toggle('is-on'); b.setAttribute('aria-pressed', S.favs.has(h.id)); $('[data-f="fav"]').closest('label').querySelector('em').textContent = `(${S.favs.size})`; if (S.f.fav) refresh(); }
  else if (act === 'compare') {
    if (S.cmp.includes(h.id)) S.cmp = S.cmp.filter(x => x !== h.id); else if (S.cmp.length >= MAX_CMP) return toast(`You can compare up to ${MAX_CMP} hotels`); else S.cmp.push(h.id);
    renderCmp();
  } else if (act === 'book' || act === 'cart') {
    addToCart({ id: `${h.id}-${ri}`, name: `${h.name} – ${room.name}`, image: h.image, price: room.price, date: S.q.checkin }, { open: act === 'book' });
    if (act === 'cart') toast(`${room.name} added to cart`);
  } else if (act === 'request') toast(`Request sent for ${room.name} at ${h.name}`);
}
function bind() {
  $('#hrList').addEventListener('click', onAct);
  // clicking empty card area (image / info, not a control) also opens the detail page
  $('#hrList').addEventListener('click', e => { const top = e.target.closest('.hr-card__top'); if (top && !e.target.closest('button,a,input,select')) goDetails(hotels.find(x => x.id === top.closest('.hr-card').dataset.id)); });
  const side = $('#hrFilters'), set = (g, v, on) => S.f[g][on ? 'add' : 'delete'](isNaN(v) ? v : Number(v));
  side.addEventListener('change', e => { const t = e.target; if (t.dataset.f === 'fav') S.f.fav = t.checked; else if (t.dataset.f) set(t.dataset.f, t.value, t.checked); refresh(); });
  side.addEventListener('input', e => {
    const t = e.target; if (!t.dataset.p) return;
    const lo = $('[data-p="min"]', side), hi = $('[data-p="max"]', side); if (+lo.value > +hi.value) (t === lo ? hi : lo).value = t.value;
    S.f.min = +lo.value; S.f.max = +hi.value; syncPrice(); refresh();
  });
  side.addEventListener('click', e => {
    if (e.target.closest('[data-apply]')) { S.f.name = $('#fName').value.trim(); refresh(); }
    if (e.target.closest('[data-close-f]')) toggleFilters(false);
  });
  side.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'fName') { S.f.name = e.target.value.trim(); refresh(); } });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { resetFilters(); renderFilters(); refresh(); }
    if (e.target.closest('[data-more]')) { const l = $('#hrLoad'); l.innerHTML = skeleton(1); setTimeout(() => { S.page++; draw(false); }, 650); }
    if (e.target.closest('[data-desel]')) { S.cmp = []; renderCmp(); }
    if (e.target.closest('[data-run]')) openCompare(S.cmp.map(id => hotels.find(h => h.id === id)), { onRemove: id => { S.cmp = S.cmp.filter(x => x !== id); renderCmp(); }, onBook: id => openAvailability(hotels.find(h => h.id === id)) });
  });
  $('#sortName').addEventListener('change', e => { $('#sortPrice').value = ''; S.sort = e.target.value ? { key: 'name', dir: e.target.value === 'asc' ? 1 : -1 } : null; refresh(); });
  $('#sortPrice').addEventListener('change', e => { $('#sortName').value = ''; S.sort = e.target.value ? { key: 'price', dir: e.target.value === 'asc' ? 1 : -1 } : null; refresh(); });
  $('#hrOpenMap').addEventListener('click', () => openMap(current.length ? current : hotels));
  $('#hrOpenFilters').addEventListener('click', () => toggleFilters(true)); $('#hrOverlay').addEventListener('click', () => toggleFilters(false));
  $('#hrModify').addEventListener('click', () => {
    const m = openModal({ title: 'Modify Search', width: '34rem', cls: 'hr-modify-modal', footer: false, body: '' });
    const s = renderSearch(hotelsConfig, { onSearch: v => { S.q = v; sessionStorage.setItem('travel.query.hotels', JSON.stringify(v)); m.close(); renderSummary(); $('#hrList').innerHTML = skeleton(3); setTimeout(() => { refresh(); toast('Search updated'); }, 700); } });
    s.setValues(S.q); m.body.append(s.el);
  });
}
const toggleFilters = on => { $('#hrFilters').classList.toggle('is-open', on); $('#hrOverlay').classList.toggle('is-open', on); document.body.classList.toggle('modal-open', on); };

export function init() {
  try { start(); } catch (err) {
    console.error('[hotel-results]', err);
    $('#hrList').innerHTML = `<div class="hr-empty">${icon('info')}<h3>Unable to load hotel data</h3><p>${esc(err.message)}</p><button class="hr-btn hr-btn--p" type="button" onclick="sessionStorage.removeItem('travel.query.hotels');location.reload()">Reset search &amp; retry</button></div>`;
  }
}
function start() {
  readQuery(); resetFilters(); renderSummary(); renderFilters(); renderCmp();
  $('#hrOpenFilters').innerHTML = `${icon('filter')}Filters`; $('#hrOpenMap').innerHTML = `<span>${icon('map')}Open Map</span>`;
  $('#hrList').innerHTML = skeleton(3); bind();
  setTimeout(() => draw(true), 600); // simulated search latency
}
