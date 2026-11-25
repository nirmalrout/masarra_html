// Package detail page: editable package (hotel / transfers / activities), live price, cancellation table, booking.
import { $, $$, esc, tileStyle } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { getState, setState } from './state.js';
import { openModal, toast, stars } from './hotel-popups.js';
import { openDatePax, openActivity, openTransfer } from './package-popups.js';
import { readQuery, saveQuery, loadWorking, saveWorking, resetWorking, priceOf, isAvailable, dayDate, addDays, dmy, long, cancelFmt, parseGuests, fmt, signature } from './package-store.js';
import { isoDay } from './utils.js';

const S = { p: null, q: null };
const PH = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M5 78 40 30l18 22 14-16 43 42z" fill="#d9d9d9"/><circle cx="92" cy="20" r="8" fill="#d9d9d9"/><path d="M30 78v-18M42 78v-14" stroke="#aaa" stroke-width="3"/></svg>';
const img = (it, h = 0.75) => (it.image ? `<span class="pd-img__in" style="${tileStyle(it.image, h)}"></span>` : `<span class="pd-ph">${PH}</span>`);
const places = () => [S.p.hotel.name, 'Abu Dhabi International Airport', 'Dubai Hotel', 'Emirates Palace Mandarin Oriental, Abu Dhabi'];
const save = () => saveWorking(S.p);
const days = () => S.p.nights + 1;

/* ---------- sections ---------- */
function top() {
  const p = S.p, q = S.q, incl = [...p.activities.filter(a => isAvailable(a, q)).map(a => a.title), ...p.transfers.map(t => `${t.title}\n${t.route}`)];
  $('#pdTop').innerHTML = `<div class="pd-card pd-banner"><div class="pd-banner__img" style="${tileStyle(p.image, 0.27)}" role="img" aria-label="${esc(p.title)}"></div></div>
    <div class="pd-card pd-when"><div><small>Tour Date</small><b>${icon('calendar')}${long(q.date)}</b></div><div><small>Traveller</small><b>${icon('user')}${esc(q.guests)}</b></div><button class="pd-modbtn" data-act="datepax" type="button">Modify Search ${icon('search')}</button></div>
    <div class="pd-card pd-title"><h1>${esc(p.hotel.name.toLowerCase())} - ${esc(p.title.split(' - ').slice(1).join(' - ').replace('Half Day Guided Private Chauffeur Drive', 'Half day Guided private chauffeur drive'))}</h1><p class="pd-nights">${p.nights} Nights &amp; ${days()} Days</p><p>${esc(p.theme)}</p>
      <div class="pd-incl">${incl.map(t => `<div>${esc(t).replace(/\n/g, '<br>')}</div>`).join('')}</div></div>`;
}
function itinerary() {
  const q = S.q, rows = [];
  for (let d = 1; d <= days(); d++) {
    const items = [];
    if (d === 1) items.push(`Check-in: ${esc(S.p.hotel.name)}`); if (d === days()) items.push(`Check-out: ${esc(S.p.hotel.name)}`);
    S.p.transfers.filter(t => t.day === d).forEach(t => items.push(`${icon('car')}${esc(t.title)}`));
    S.p.activities.filter(a => a.day === d).forEach(a => items.push(`${icon('walk')}${esc(a.title)}${isAvailable(a, q) ? '' : ' <em>(not available)</em>'}`));
    rows.push(`<li><b>Day ${d}</b><span>${dmy(dayDate(q, d))}</span><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></li>`);
  }
  $('#sec-itinerary .pd-sec__b').innerHTML = `<ol class="pd-itin">${rows.join('')}</ol>`;
}
function hotel() {
  const h = S.p.hotel, q = S.q, out = addDays(q.date, S.p.nights);
  $('#sec-hotel .pd-sec__b').innerHTML = `<div class="pd-item"><div class="pd-item__img">${img(h, 0.75)}</div><div class="pd-item__body"><h3>${esc(h.name)}</h3><p class="pd-addr">${esc(h.address)}</p>${stars(h.stars)}<p class="pd-meta">${S.p.nights} Night${S.p.nights > 1 ? 's' : ''} (From: ${dmy(q.date)} to ${dmy(out)})</p><div class="pd-chip">${esc(h.room)} <i></i> ${esc(h.meal)}</div></div></div>`;
}
function transfers() {
  const q = S.q, list = S.p.transfers;
  $('#sec-transfer .pd-sec__b').innerHTML = list.length ? list.map((t, i) => `<div class="pd-item" data-kind="transfer" data-i="${i}"><div class="pd-item__img">${img(t)}</div><div class="pd-item__body">
    <div class="pd-item__h"><h3>${esc(t.title)}<br>${esc(t.route)}</h3><span class="pd-links"><button class="pd-change" data-act="change" type="button">Change</button><button class="pd-remove" data-act="remove" type="button">Remove</button></span></div><p class="pd-day">On Day ${t.day} ( ${dmy(dayDate(q, t.day))} )</p>
    <div class="fld-row pd-sel"><label>Pickup<select data-field="pickup" aria-label="Pickup">${['', ...places()].map(o => `<option value="${esc(o)}"${o === t.pickup ? ' selected' : ''}>${o || '-- Select --'}</option>`).join('')}</select></label>
    <label>Dropoff<select data-field="dropoff" aria-label="Dropoff" class="${t.dropoff ? '' : 'is-missing'}">${['', ...places()].map(o => `<option value="${esc(o)}"${o === t.dropoff ? ' selected' : ''}>${o || '-- Select --'}</option>`).join('')}</select></label></div></div></div>`).join('') : '<p class="pd-empty">No transfers added. Use + to add a transfer.</p>';
}
function activities() {
  const q = S.q, list = S.p.activities;
  $('#sec-activity .pd-sec__b').innerHTML = list.length ? list.map((a, i) => { const ok = isAvailable(a, q), long = a.desc && a.desc.length > 150;
    return `<div class="pd-item${ok ? '' : ' is-na'}" data-kind="activity" data-i="${i}"><div class="pd-item__img">${img(a)}</div><div class="pd-item__body"><div class="pd-item__h"><h3>${esc(a.title)}</h3>${ok ? '<span class="pd-links"><button class="pd-change" data-act="change" type="button">Change</button><button class="pd-remove" data-act="remove" type="button">Remove</button></span>' : '<span class="pd-na">Not Available</span>'}</div>
      <p class="pd-day">On Day ${a.day} ( ${dmy(dayDate(q, a.day))} )</p><p class="pd-desc">${esc(long ? `${a.desc.slice(0, 150)}…` : a.desc || '')}${long ? '<button class="pd-moreb" data-act="more" type="button">More</button>' : ''}</p>${ok ? '' : '<div class="pd-links pd-links--na"><button class="pd-change" data-act="change" type="button">Change</button><button class="pd-remove" data-act="remove" type="button">Remove</button></div>'}</div></div>`; }).join('') : '<p class="pd-empty">No activities added. Use + to add an activity.</p>';
}
function cancellation() {
  const q = S.q, today = isoDay(0), pr = priceOf(S.p, q), row = (name, to, ch) => `<h4>${esc(name)}</h4><div class="pd-tablewrap"><table class="pd-table"><thead><tr><th>Date From</th><th>Date To</th><th class="r">Cancellation Charge (AED)</th></tr></thead><tbody><tr><td>${cancelFmt(today)}</td><td>${cancelFmt(to)}</td><td class="r">${fmt(ch)}</td></tr></tbody></table></div>`;
  $('#sec-cancel .pd-sec__b').innerHTML = row(S.p.hotel.name, q.date, pr.hotel) + S.p.transfers.map(t => row(`${t.title} ${t.route}`, dayDate(q, t.day), t.price)).join('') + S.p.activities.filter(a => isAvailable(a, q)).map(a => row(a.title, dayDate(q, a.day), a.price)).join('');
}
function summary() {
  const q = S.q, pr = priceOf(S.p, q), nAct = S.p.activities.filter(a => isAvailable(a, q)).length;
  $('#pdSummary').innerHTML = `<h3>City: ${esc(S.p.city)}</h3><p class="pd-g">${esc(q.guests)}</p><div class="pd-counts"><span>${icon('bed')}<b>Hotel 1</b></span><span>${icon('car')}<b>Transfer ${S.p.transfers.length}</b></span><span>${icon('walk')}<b>Activity ${nAct}</b></span></div>
    <div class="pd-total"><small>${dmy(q.date)}</small><div>Total AED <b id="pdTotal">${fmt(pr.total)}</b></div></div><div class="pd-sbtns"><button class="pd-book" data-act="book" type="button">Book Now</button><button class="pd-cart" data-act="cart" type="button">Add to Cart ${icon('cart')}</button></div>`;
  $('#pdMbPrice').textContent = `AED ${fmt(pr.total)}`;
}
function refresh() { save(); top(); itinerary(); hotel(); transfers(); activities(); cancellation(); summary(); }

/* ---------- actions ---------- */
function valid() {
  const missing = S.p.transfers.findIndex(t => !t.pickup || !t.dropoff);
  if (missing > -1) { toast('Please select pickup and drop-off for each transfer'); const sec = $('#sec-transfer'); sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); $$('#sec-transfer select').forEach(s => s.classList.toggle('is-missing', !s.value)); return false; }
  return true;
}
function book(open) {
  if (!valid()) return;
  const id = `pkg-${signature(S.p, S.q)}`, total = priceOf(S.p, S.q).total;
  if (getState().cart.some(i => i.id === id)) { toast('This package is already in your cart'); if (open) setTimeout(() => setState({ cartOpen: true, activePopover: null }), 0); return; }
  addToCart({ id, name: S.p.title, image: S.p.image, price: total, date: S.q.date }, { open }); if (!open) toast('Package added to cart');
}
function onClick(e) {
  const b = e.target.closest('[data-act]'), plus = e.target.closest('[data-add]'), tab = e.target.closest('[data-tab]');
  if (tab) { $(`#sec-${tab.dataset.tab}`).scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const ctx = { pkg: S.p, q: S.q };
  if (plus) { if (plus.dataset.add === 'transfer') openTransfer({ ...ctx, onPick: t => { S.p.transfers.push(t); refresh(); toast('Transfer added'); } }); else openActivity({ ...ctx, onPick: a => { S.p.activities.push(a); refresh(); toast('Activity added'); } }); return; }
  if (!b) return; const act = b.dataset.act, item = b.closest('[data-kind]'), i = +(item?.dataset.i ?? -1), kind = item?.dataset.kind;
  if (act === 'datepax') openDatePax(S.q, q => { S.q = q; saveQuery(q); refresh(); toast('Date & guests updated'); });
  else if (act === 'reset') { S.p = resetWorking(S.p.id); refresh(); toast('Package reset to its original selection'); }
  else if (act === 'book') book(true); else if (act === 'cart') book(false);
  else if (act === 'remove') { S[kind === 'transfer' ? 'p' : 'p'][kind === 'transfer' ? 'transfers' : 'activities'].splice(i, 1); refresh(); toast(`${kind === 'transfer' ? 'Transfer' : 'Activity'} removed`); }
  else if (act === 'change') {
    if (kind === 'transfer') { const old = S.p.transfers[i]; openTransfer({ ...ctx, replace: old, onPick: t => { S.p.transfers[i] = { ...t, day: old.day, pickup: old.pickup || t.pickup, dropoff: old.dropoff }; refresh(); toast('Transfer replaced'); } }); }
    else { const old = S.p.activities[i]; openActivity({ ...ctx, replaceId: old.id, day: old.day, onPick: a => { S.p.activities[i] = { ...a, day: old.day }; refresh(); toast('Activity replaced'); } }); }
  } else if (act === 'more') openModal({ title: esc(S.p.activities[i].title), width: '40rem', body: `<p class="hr-p">${esc(S.p.activities[i].desc)}</p>` });
}
function bind() {
  const root = $('#pdRoot'); root.addEventListener('click', onClick);
  root.addEventListener('change', e => { const s = e.target.closest('[data-field]'); if (!s) return; const i = +s.closest('[data-kind]').dataset.i, t = S.p.transfers[i]; t[s.dataset.field] = s.value;
    if (t.pickup && t.pickup === t.dropoff) { t[s.dataset.field] = ''; s.value = ''; toast('Pickup and drop-off must be different'); } t.route = `Pickup From ${t.pickup || '…'} To ${t.dropoff || '…'}`; refresh(); });
  // sticky tabs: highlight the section in view
  const secs = $$('.pd-sec'), io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) $$('.pd-tabs button').forEach(b => b.classList.toggle('is-on', `sec-${b.dataset.tab}` === x.target.id)); }), { rootMargin: '-30% 0px -60% 0px' });
  secs.forEach(s => io.observe(s));
}

export function init() {
  const root = $('#pdRoot');
  try {
    const id = new URLSearchParams(location.search).get('id'); S.q = readQuery(); S.p = loadWorking(id);
    if (!S.p) { root.innerHTML = `<div class="pd-wrap"><div class="hr-empty">${icon('info')}<h3>Package not found</h3><p>We couldn't find that package.</p><a class="hr-btn hr-btn--p" href="package-results.html">Back to packages</a></div></div>`; return; }
    document.title = `${S.p.title} | Masarra`;
    const sec = (key, title, add) => `<section class="pd-card pd-sec" id="sec-${key}"><div class="pd-sec__h"><h2>${title}</h2>${add ? `<button class="pd-plus" data-add="${key}" aria-label="Add ${key}" type="button">+</button>` : ''}</div><div class="pd-sec__b"></div></section>`;
    root.innerHTML = `<div class="pd-wrap"><div class="pd-toolbar"><a class="hd-back" href="package-results.html">${icon('left')}Back to packages</a><button class="pd-reset" data-act="reset" type="button">Reset Package</button></div>
      <div class="pd-layout"><div class="pd-main"><div id="pdTop"></div>
        <nav class="pd-tabs" aria-label="Package sections">${[['itinerary', 'Itinerary'], ['hotel', 'Hotel'], ['transfer', 'Transfer'], ['activity', 'Activity'], ['cancel', 'Cancellation Policy']].map(([k, l], i) => `<button data-tab="${k}" class="${i ? '' : 'is-on'}" type="button">${l}</button>`).join('')}</nav>
        ${sec('itinerary', 'Itinerary')}${sec('hotel', 'Hotel')}${sec('transfer', 'Transfer', true)}${sec('activity', 'Activity', true)}${sec('cancel', 'Cancellation Policy')}</div>
        <aside class="pd-side"><div class="pd-card pd-sum" id="pdSummary"></div></aside></div></div>
      <div class="pd-mbar"><div><small>Total</small><b id="pdMbPrice"></b></div><button class="hr-btn hr-btn--p" data-act="book" type="button">Book Now</button></div>`;
    bind(); refresh();
  } catch (err) {
    console.error('[package-detail]', err);
    root.innerHTML = `<div class="pd-wrap"><div class="hr-empty">${icon('info')}<h3>Unable to load the package</h3><p>${esc(err.message)}</p><a class="hr-btn hr-btn--p" href="package-results.html">Back to packages</a></div></div>`;
  }
}
