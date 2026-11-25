// Hotel Detail page. Data: sessionStorage 'travel.hotel' (set by the results page) -> falls back to ?id= lookup.
import { $, $$, esc, tileStyle, isoDay } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { observeReveals } from './animations.js';
import { hotels, mealNames, TILES } from '../data/hotel-results-data.js';
import { detailsFor, captions } from '../data/hotel-details-data.js';
import { openModal, openAvailability, openMap, toast, money, stars, minPrice } from './hotel-popups.js';

const FAV_KEY = 'travel.favorites', TABS = [['about', 'About'], ['rooms', 'Rooms'], ['amenities', 'Amenities'], ['whereabouts', 'Whereabouts'], ['policies', 'Policies'], ['map', 'Map']];
const I = {
  in: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  spa: '<path d="M12 22c4-2 7-6 7-11-4 0-7 3-7 6 0-3-3-6-7-6 0 5 3 9 7 11Z"/><path d="M12 2v9"/>', food: '<path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M20 2c-2 2-3 5-3 8h3v12"/>'
};
const ico = (n, c = 'ico') => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const S = { h: null, D: null, q: null, tab: 'about', meal: 'All', cur: 0, imgs: [], favs: new Set(load(FAV_KEY, ['h1'])) };

/* ---------- data ---------- */
function pickHotel() {
  const id = new URLSearchParams(location.search).get('id');
  try { const s = JSON.parse(sessionStorage.getItem('travel.hotel')); if (s && s.rooms && (!id || s.id === id)) return s; } catch { /* fall back */ }
  return hotels.find(h => h.id === id) || null;
}
function pickQuery() {
  const def = { destination: '', checkin: isoDay(7), checkout: isoDay(8), nights: 1, guests: '1 Room, 2 Adults', market: 'Indian' };
  let q = {}; try { q = JSON.parse(sessionStorage.getItem('travel.query.hotels')) || {}; } catch { /* defaults */ }
  return Object.fromEntries(Object.entries({ ...def, ...q }).map(([k, v]) => [k, v === '' || v == null ? def[k] : v]));
}
const nights = () => Math.max(1, Math.round((new Date(S.q.checkout) - new Date(S.q.checkin)) / 864e5) || 1);
const buildImages = h => { const b = Math.max(0, TILES.findIndex(t => t[0] === h.image[0] && t[1] === h.image[1])); return Array.from({ length: 15 }, (_, i) => ({ tile: TILES[(b + i) % 6], cap: captions[i % captions.length] })); };

/* ---------- gallery + lightbox ---------- */
/* ---------- gallery + lightbox ---------- */
function buildGallery() {
  const g = $('#hdGal'), n = S.imgs.length;
  g.innerHTML = `<div class="hd-gal__main" data-open data-k="0" role="button" tabindex="0" aria-label="View large photo and slider"></div>
    ${[1, 2, 3, 4].map(k => `<button class="hd-gal__t" data-open data-k="${k}" aria-label="View photo ${k + 1} in large view">${k === 4 ? `<span class="hd-more" data-view-all>${ico('img')}${n} images · View all</span>` : ''}</button>`).join('')}`;

  $('.hd-gal__main', g).style.cssText = tileStyle(S.imgs[0].tile, 0.5);
  $$('.hd-gal__t', g).forEach(t => (t.style.cssText = tileStyle(S.imgs[+t.dataset.k % n].tile, 0.47)));

  g.addEventListener('click', e => {
    if (e.target.closest('[data-view-all]')) return lightbox(0);
    const t = e.target.closest('[data-open]');
    if (t) lightbox(Number(t.dataset.k || 0) % n);
  });
  g.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('[data-open]')) {
      lightbox(Number(e.target.dataset.k || 0) % n);
    }
  });
}

function lightbox(start = 0) {
  const n = S.imgs.length;
  let i = ((start % n) + n) % n;
  let zoomed = false;

  const m = openModal({
    head: `<div class="hd-lb__head"><div><h2>${esc(S.h.name)}</h2><p class="hd-lb__cap"></p></div>
      <div class="hd-lb__tools"><button type="button" class="hr-btn hr-btn--o hr-btn--sm" data-zoom aria-pressed="false">Zoom (1x)</button></div></div>`,
    width: '82rem',
    cls: 'hd-lb',
    footer: false,
    body: `<div class="hd-lb__stage">
        <div class="hd-lb__img"></div>
        <button type="button" class="hd-lb__nav hd-lb__nav--l" data-l="-1" aria-label="Previous image">${icon('left')}</button>
        <button type="button" class="hd-lb__nav hd-lb__nav--r" data-l="1" aria-label="Next image">${icon('right')}</button>
      </div>
      <div class="hd-lb__thumbs">${S.imgs.map((g, k) => `<button type="button" data-k="${k}" style="${tileStyle(g.tile, 0.6)}" aria-label="Image ${k + 1}: ${esc(g.cap)}"></button>`).join('')}</div>`
  });

  const img = $('.hd-lb__img', m.el);
  const cap = $('.hd-lb__cap', m.el);
  const zoomBtn = $('[data-zoom]', m.el);
  const thumbs = $$('.hd-lb__thumbs button', m.el);

  const setZoom = on => {
    zoomed = on;
    img.classList.toggle('is-zoomed', zoomed);
    img.style.transformOrigin = '50% 50%';
    zoomBtn.setAttribute('aria-pressed', String(zoomed));
    zoomBtn.textContent = zoomed ? 'Reset Zoom (2x)' : 'Zoom (1x)';
  };

 const paint = () => {
  setZoom(false);
  const current = S.imgs[i];
  console.log(current)
  img.style.cssText = tileStyle(current.tile, 0.5625);
  if (current.url) {
    img.style.backgroundImage = `url("${current.url}")`;
  }
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.paddingTop = '0';
  img.classList.remove('is-in');
  void img.offsetWidth;
  img.classList.add('is-in');
  cap.textContent = `${i + 1} / ${n} · ${current.cap}`;
  thumbs.forEach((t, k) => t.classList.toggle('is-on', k === i));
  thumbs[i]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
};

  const go = d => { i = (i + d + n) % n; paint(); };

  m.el.addEventListener('click', e => {
    const l = e.target.closest('[data-l]');
    const t = e.target.closest('[data-k]');
    const z = e.target.closest('[data-zoom]');
    if (l) go(Number(l.dataset.l));
    if (t) { i = Number(t.dataset.k); paint(); }
    if (z) setZoom(!zoomed);
  });

  // Click image to toggle zoom; move pointer while zoomed to pan
  img.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    setZoom(!zoomed);
  });
  img.addEventListener('pointermove', e => {
    if (!zoomed) return;
    const r = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    img.style.transformOrigin = `${x}% ${y}%`;
  });

  const key = e => {
    if (!m.el.isConnected) return document.removeEventListener('keydown', key);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', key);

  let x0 = null;
  const st = $('.hd-lb__stage', m.el);
  st.addEventListener('pointerdown', e => { if (!zoomed) x0 = e.clientX; });
  st.addEventListener('pointerup', e => {
    if (!zoomed && x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1);
    x0 = null;
  });

  paint();
}

/* ---------- tab panels ---------- */
const room = { meta: i => [`${S.D.roomInfo.sizes[i % 5]} m²`, S.D.roomInfo.beds[i % 5], S.D.roomInfo.views[i % 5]] };
const panels = {
  about: () => `<div class="hd-about">${S.D.about.map(s => `<section class="hd-block reveal"><h3>${ico(s.icon === 'pin' ? 'pin' : s.icon === 'bed' ? 'bed' : s.icon, 'ico')}${esc(s.title)}</h3><p>${esc(s.text || S.h.desc)}</p></section>`).join('')}</div>`
    .replace(/<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><\/svg>/g, ''),
  rooms: () => {
    const meals = ['All', ...new Set(S.h.rooms.map(r => r.meal))], list = S.h.rooms.map((r, i) => ({ r, i })).filter(({ r }) => S.meal === 'All' || r.meal === S.meal), n = nights();
    return `<div class="hd-chips" role="group" aria-label="Filter by meal plan">${meals.map(m => `<button class="${m === S.meal ? 'is-on' : ''}" data-meal="${m}">${m === 'All' ? 'All rooms' : `${m} · ${mealNames[m]}`}</button>`).join('')}</div>
      <p class="hd-muted">${list.length} room option${list.length === 1 ? '' : 's'} · ${n} night${n > 1 ? 's' : ''} (${S.q.checkin} → ${S.q.checkout})</p>
      <div class="hd-rooms">${list.map(({ r, i }, k) => `<article class="hd-room reveal" style="--i:${k}" data-i="${i}">
        <div class="hd-room__img" style="${tileStyle(S.imgs[(i + 1) % 15].tile, 0.8)}"></div>
        <div class="hd-room__body"><h4>${esc(r.name)}</h4><ul>${room.meta(i).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <div class="hd-room__tags"><span class="hr-tag">${r.meal}</span><span>${mealNames[r.meal]}</span>${r.discount ? `<span class="hr-pill">${r.discount}</span>` : ''}${r.bonus ? '<span class="hr-pill">Bonus Benefits</span>' : ''}</div>
          <p class="hd-pol hd-pol--${r.policy === 'Free Cancellation' ? 'ok' : r.policy === 'Non-Refundable' ? 'no' : 'mid'}">${r.policy}${r.onRequest ? ' · On request' : ''}</p></div>
        <div class="hd-room__buy"><div><b>${money(r.price)}</b>${r.was ? `<s>${money(r.was)}</s>` : ''}<small>per night</small></div><span class="hd-total">${n} night${n > 1 ? 's' : ''}: <b>${money(r.price * n)}</b></span>
          <div class="hd-room__btns"><button class="hr-btn hr-btn--p" data-act="${r.onRequest ? 'request' : 'book'}">${r.onRequest ? 'Send Request' : 'Book Now'}</button>
            <button class="hd-icon" data-act="cart" aria-label="Add to cart" title="Add to cart">${icon('cart')}</button><button class="hd-icon" data-act="cal" aria-label="Availability calendar" title="Availability calendar">${icon('calendar')}</button><button class="hd-icon" data-act="info" aria-label="Room details" title="Room details">${icon('info')}</button></div></div></article>`).join('') || '<p class="hd-muted">No rooms match this meal plan.</p>'}</div>`;
  },
  amenities: () => `<div class="hd-amen">${S.D.amenities.map((g, k) => `<section class="hd-block reveal" style="--i:${k}"><h3>${esc(g.group)}</h3><ul>${g.items.map(x => `<li>${ico('check')}${esc(x)}</li>`).join('')}</ul></section>`).join('')}</div>`,
  whereabouts: () => `<section class="hd-block"><h3>What's nearby</h3><p class="hd-muted">${esc(S.h.address)}</p><ul class="hd-near">${S.D.nearby.map(([n, d], k) => `<li class="reveal" style="--i:${k}">${icon('pin')}<span>${esc(n)}</span><b>${esc(d)}</b></li>`).join('')}</ul></section>`,
  policies: () => {
    const cancel = [...new Set(S.h.rooms.map(r => r.policy))].map(p => `<b>${p}:</b> ${esc(S.D.cancelText[p])}`);
    return `<div class="hd-acc">${S.D.policies.map((p, k) => `<div class="hd-acc__i${k === 0 ? ' is-open' : ''}"><button class="hd-acc__h" aria-expanded="${k === 0}" data-acc>${esc(p.t)}${icon('plus')}</button>
      <div class="hd-acc__b"><ul>${(p.t === 'Cancellation' ? cancel : p.p.map(esc)).map(x => `<li>${x}</li>`).join('')}</ul></div></div>`).join('')}</div>`;
  },
  map: () => `<section class="hd-block"><h3>Location</h3><p class="hd-muted">${esc(S.h.address)}</p>
    <button class="hd-map" data-act="map" aria-label="Open map"><span class="hd-map__pin">${icon('pin')}</span><span class="hd-map__btn">${icon('map')}Open Map</span></button>
    <div class="hd-map__acts"><button class="hr-btn hr-btn--p" data-act="map">${icon('map')} View on map</button><a class="hr-btn hr-btn--o" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${S.h.lat},${S.h.lng}">Get directions</a></div></section>`
};
function showTab(t, push = true) {
  S.tab = t; $$('.hd-tabs button').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); on && b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); });
  const p = $('#hdPanel'); p.classList.remove('is-in'); void p.offsetWidth; p.innerHTML = panels[t](); p.classList.add('is-in'); observeReveals(p);
  if (push) history.replaceState(null, '', `${location.pathname}${location.search}#${t}`);
}

/* ---------- sidebar ---------- */
function sidebar() {
  const h = S.h, from = minPrice(h), n = nights();
  return `<div class="hd-book"><div class="hd-price"><small>From</small><b>${money(from)}</b><span>/ night</span></div>
    <div class="hd-fields"><label>Check-in<input type="date" id="bkIn" value="${S.q.checkin}" min="${isoDay(0)}"></label><label>Check-out<input type="date" id="bkOut" value="${S.q.checkout}" min="${isoDay(1)}"></label>
      <label class="hd-fields__full">Guests<input type="text" id="bkGuests" value="${esc(S.q.guests)}"></label></div>
    <div class="hd-sum"><span id="bkNights">${n} night${n > 1 ? 's' : ''}</span><b id="bkTotal">${money(from * n)}</b></div>
    <button class="hr-btn hr-btn--p hd-cta" data-act="select">Select Rooms</button><button class="hr-btn hr-btn--o hd-cta" data-act="cal0">${icon('calendar')} Check availability</button>
    <div class="hd-quick"><button data-act="fav" class="${S.favs.has(h.id) ? 'is-on' : ''}" aria-pressed="${S.favs.has(h.id)}">${icon('heart')}<span>${S.favs.has(h.id) ? 'Saved' : 'Save'}</span></button><button data-act="share">${icon('share')}<span>Share</span></button></div>
    <ul class="hd-perks"><li>${ico('check')}Best price guarantee</li><li>${ico('check')}Instant confirmation on available rooms</li><li>${ico('check')}Free cancellation on selected rates</li></ul></div>`;
}
function syncBooking() {
  const from = minPrice(S.h), n = nights(); sessionStorage.setItem('travel.query.hotels', JSON.stringify(S.q));
  $('#bkNights').textContent = `${n} night${n > 1 ? 's' : ''}`; $('#bkTotal').textContent = money(from * n); $('#mbPrice').textContent = money(from);
  if (S.tab === 'rooms') showTab('rooms', false);
}

/* ---------- actions ---------- */
function onAct(e) {
  const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act, h = S.h, ri = Number(b.closest('.hd-room')?.dataset.i ?? 0), r = h.rooms[ri];
  if (act === 'select') { showTab('rooms'); $('.hd-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'cal0') openAvailability(h, 0); else if (act === 'cal') openAvailability(h, ri); else if (act === 'map') openMap([h], h.id);
  else if (act === 'book' || act === 'cart') { addToCart({ id: `${h.id}-${ri}`, name: `${h.name} – ${r.name}`, image: h.image, price: r.price, date: S.q.checkin }, { open: act === 'book' }); if (act === 'cart') toast(`${r.name} added to cart`); }
  else if (act === 'request') toast(`Request sent for ${r.name} at ${h.name}`);
  else if (act === 'info') {
    const i = ri, m = openModal({ title: esc(r.name), sub: `${h.name} · ${r.meal} – ${mealNames[r.meal]}`, width: '40rem', body: `<div class="hd-room__pop" style="${tileStyle(S.imgs[(i + 1) % 15].tile, 0.5)}"></div>
      <ul class="hd-pop">${room.meta(i).map(x => `<li>${ico('check')}${esc(x)}</li>`).join('')}<li>${ico('check')}${esc(r.policy)}</li>${S.D.amenities[1].items.slice(0, 6).map(x => `<li>${ico('check')}${esc(x)}</li>`).join('')}</ul>` });
  } else if (act === 'fav') { S.favs.has(h.id) ? S.favs.delete(h.id) : S.favs.add(h.id); localStorage.setItem(FAV_KEY, JSON.stringify([...S.favs])); const on = S.favs.has(h.id); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); $('span', b).textContent = on ? 'Saved' : 'Save'; toast(on ? 'Saved to favorites' : 'Removed from favorites'); }
  else if (act === 'share') { const url = location.href; (navigator.share ? navigator.share({ title: h.name, url }).catch(() => {}) : navigator.clipboard?.writeText(url).then(() => toast('Link copied to clipboard'), () => toast(url))) || toast(url); }
}
function bind() {
  const root = $('#hdRoot');
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), ml = e.target.closest('[data-meal]'), acc = e.target.closest('[data-acc]');
    if (t) showTab(t.dataset.tab); if (ml) { S.meal = ml.dataset.meal; showTab('rooms', false); }
    if (acc) { const it = acc.closest('.hd-acc__i'), on = it.classList.toggle('is-open'); acc.setAttribute('aria-expanded', on); }
    onAct(e);
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'bkIn') { S.q.checkin = e.target.value; if (S.q.checkout <= S.q.checkin) { const d = new Date(S.q.checkin + 'T00:00'); d.setDate(d.getDate() + 1); S.q.checkout = d.toISOString().slice(0, 10); $('#bkOut').value = S.q.checkout; } }
    if (e.target.id === 'bkOut') { S.q.checkout = e.target.value > S.q.checkin ? e.target.value : S.q.checkout; e.target.value = S.q.checkout; }
    if (e.target.id === 'bkGuests') S.q.guests = e.target.value || S.q.guests;
    S.q.nights = nights(); syncBooking();
  });
  $('#mbCta').addEventListener('click', () => onAct({ target: { closest: () => ({ dataset: { act: 'select' } }) } }));
}

/* ---------- render ---------- */
export function init() {
  const root = $('#hdRoot');
  try {
    S.h = pickHotel();
    if (!S.h) { root.innerHTML = `<div class="hd-wrap"><div class="hr-empty">${icon('info')}<h3>Hotel not found</h3><p>We couldn't find that hotel. Please pick one from the results.</p><a class="hr-btn hr-btn--p" href="hotel-results.html">Back to results</a></div></div>`; return; }
    S.D = detailsFor(S.h); S.q = pickQuery(); S.imgs = buildImages(S.h); document.title = `${S.h.name} | Masarra`;
    root.innerHTML = `<div class="hd-wrap"><a class="hd-back" href="hotel-results.html">${icon('left')}Back to results</a>
      <header class="hd-head"><div><h1>${esc(S.h.name)}</h1><p class="hd-addr">${esc(S.h.address)} ${stars(S.h.stars)}</p></div>
        <dl class="hd-times"><div>${ico('in')}<dt>Check-In Time</dt><dd>${S.D.checkIn}</dd></div><div>${ico('out')}<dt>Check-Out Time</dt><dd>${S.D.checkOut}</dd></div></dl></header>
      <section class="hd-gal" id="hdGal" aria-label="Photo gallery"></section>
      <div class="hd-layout"><div class="hd-main"><nav class="hd-tabs" role="tablist" aria-label="Hotel information">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="false">${l}</button>`).join('')}</nav><div class="hd-panel" id="hdPanel"></div></div>
        <aside class="hd-side" aria-label="Booking">${sidebar()}</aside></div></div>
      <div class="hd-mbar"><div><small>From</small><b id="mbPrice">${money(minPrice(S.h))}</b><span> / night</span></div><button class="hr-btn hr-btn--p" id="mbCta" type="button">Select Rooms</button></div>`;
    buildGallery(); bind(); const first = location.hash.slice(1); showTab(TABS.some(t => t[0] === first) ? first : 'about', false);
  } catch (err) {
    console.error('[hotel-details]', err);
    root.innerHTML = `<div class="hd-wrap"><div class="hr-empty">${icon('info')}<h3>Unable to load hotel details</h3><p>${esc(err.message)}</p><a class="hr-btn hr-btn--p" href="hotel-results.html">Back to results</a></div></div>`;
  }
}
