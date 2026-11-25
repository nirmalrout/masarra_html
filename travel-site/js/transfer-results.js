// Transfer results page. One Way / Chauffeur: browse + Book Now / Add To Cart. Round Trip: select an outbound AND a return vehicle,
// shown in a fixed bottom bar. Selection logic lives in transfer-selection.js; mock data/API in data/transfer-results-data.js.
import { $, $$, esc, tileStyle, isoDay } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { getState, setState } from './state.js';
import { renderSearch } from './search-panel.js';
import { config as searchConfig } from '../data/transfers-data.js';
import { openModal, toast, money } from './hotel-popups.js';
import { searchTransfers } from '../data/transfer-results-data.js';
import { createSelection, cartLines } from './transfer-selection.js';

const QKEY = 'travel.query.transfers', LUG = [['1 - 3', 1, 3], ['4 - 6', 4, 6], ['7 - 10', 7, 10], ['10+', 11, 1e9]], PAX = [['1 - 4', 1, 4], ['5 - 8', 5, 8], ['9 - 14', 9, 14], ['15+', 15, 1e9]];
const S = { q: null, mode: 'oneway', data: { out: [], ret: [] }, leg: 'out', sel: null, f: null, sort: 'asc', bounds: [0, 0] };
const fmtD = s => (s ? s.split('-').reverse().join('/') : '—');
const PH = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M5 78 40 30l18 22 14-16 43 42z" fill="#e4cfd3"/><circle cx="92" cy="20" r="8" fill="#e4cfd3"/><path d="M30 78v-18M42 78v-14" stroke="#b8a0a6" stroke-width="3"/><circle cx="30" cy="56" r="4" fill="#b8a0a6"/><circle cx="42" cy="60" r="4" fill="#b8a0a6"/></svg>';
const tick = '<svg class="tr-pol__i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

/* ---------- query ---------- */
function readQuery() {
  const def = { mode: 'Point-to-Point', trip: 'One-Way', pickup: 'Abu Dhabi International Airport', dropoff: 'Emirates Palace Mandarin Oriental, Abu Dhabi', returnPickup: '', returnDrop: '', date: isoDay(7), time: '16:30', returnDate: isoDay(8), returnTime: '16:30', guests: '2 Adults', duration: '', luggage: '' };
  let q = {}; try { q = JSON.parse(sessionStorage.getItem(QKEY)) || {}; } catch { /* defaults */ }
  q = Object.fromEntries(Object.entries({ ...def, ...q }).map(([k, v]) => [k, v == null ? def[k] : v]));
  const t = new URLSearchParams(location.search).get('trip'); if (t === 'round' || t === 'oneway') { q.mode = 'Point-to-Point'; q.trip = t === 'round' ? 'Round-Trip' : 'One-Way'; } // ?trip= is a demo/testing override
  q.returnPickup ||= q.dropoff; q.returnDrop ||= q.pickup; S.q = q;
  S.mode = q.mode === 'Chauffeur' ? 'chauffeur' : q.trip === 'Round-Trip' ? 'round' : 'oneway';
}
const leg = l => (l === 'out' ? { from: S.q.pickup, to: S.q.dropoff, date: S.q.date, time: S.q.time } : { from: S.q.returnPickup, to: S.q.returnDrop, date: S.q.returnDate, time: S.q.returnTime });

/* ---------- summary ---------- */
const cell = (l, ic, v) => `<div class="tr-cell"><span>${l}</span><b title="${esc(v)}">${icon(ic)}<i>${esc(v)}</i></b></div>`;
const kind = s => (/airport/i.test(s) ? 'Airport' : /hotel|resort|palace|suites/i.test(s) ? 'Hotel' : 'Location');
function renderSummary() {
  const q = S.q, root = $('#trSummary');
  if (S.mode === 'round') root.innerHTML = `<div class="tr-boxes">${cell('Pickup', 'pin', q.pickup)}${cell('Drop-off', 'pin', q.dropoff)}${cell('Return Pickup', 'pin', q.returnPickup)}${cell('Return Drop-off', 'pin', q.returnDrop)}
    <div class="tr-cell tr-cell--2">${cell('Date', 'calendar', fmtD(q.date))}${cell('Pickup Time', 'clock', q.time)}</div>${cell('Guest(s)', 'user', q.guests)}${cell('Return Date', 'calendar', fmtD(q.returnDate))}${cell('Pickup Time', 'clock', q.returnTime)}</div>`;
  else root.innerHTML = `<div class="tr-flat">${cell('Trip Type', 'car', S.mode === 'chauffeur' ? 'Chauffeur' : 'One-Way')}${cell('Pickup and Drop-off', 'pin', `${kind(q.pickup)} to ${kind(q.dropoff)}`)}${cell('Pickup', 'pin', q.pickup)}${cell('Drop-off', 'pin', q.dropoff)}
    ${cell('Date & Time', 'calendar', `${fmtD(q.date)}, ${q.time}`)}${cell('Guest(s)', 'user', q.guests)}${S.mode === 'chauffeur' && q.duration ? cell('Duration', 'hourglass', q.duration) : ''}</div>`;
  $('#hrModify').innerHTML = `${icon('search')}Modify Search`;
}

/* ---------- filters ---------- */
const all = () => [...S.data.out, ...S.data.ret];
function resetFilters() { const p = all().map(v => v.price); S.bounds = p.length ? [Math.min(...p), Math.max(...p)] : [0, 0]; S.f = { name: '', types: new Set(), lug: new Set(), pax: new Set(), min: S.bounds[0], max: S.bounds[1] }; }
const chk = (g, v, label, n) => `<label class="hr-chk"><input type="checkbox" data-f="${g}" value="${esc(v)}"><span class="box"></span><span class="lbl">${esc(label)}</span>${n == null ? '' : `<em>(${n})</em>`}</label>`;
function renderFilters() {
  const [min, max] = S.bounds, types = [...new Set(all().map(v => v.name))];
  $('#hrFilters').innerHTML = `<div class="tr-fhead"><h4>Filter</h4><button class="tr-clear" data-clear type="button">Clear All</button><button class="hr-fclose" data-close-f type="button" aria-label="Close filters">${icon('close')}</button></div>
    <div class="hr-fsec"><h4>Filter By Name</h4><input class="hr-input" id="fName" type="search" placeholder="Search" aria-label="Filter by name"></div>
    <div class="hr-fsec"><h4>Price Range</h4><div class="hr-row"><span class="hr-chip" id="pMin"></span><span class="hr-chip" id="pMax"></span></div>
      <div class="hr-dual"><div class="hr-dual__track"><i id="pFill"></i></div><input type="range" data-p="min" min="${min}" max="${max}" step="1" value="${min}" aria-label="Minimum price"><input type="range" data-p="max" min="${min}" max="${max}" step="1" value="${max}" aria-label="Maximum price"></div></div>
    <div class="hr-fsec"><h4>Luggage Bags Capacity</h4>${LUG.map(([l]) => chk('lug', l, l)).join('')}</div>
    <div class="hr-fsec"><h4>Vehicle Type</h4>${types.map(t => chk('types', t, t)).join('')}</div>
    <div class="hr-fsec"><h4>Maximum Passengers</h4>${PAX.map(([l]) => chk('pax', l, l)).join('')}</div>`;
  syncPrice();
}
function syncPrice() {
  const [min, max] = S.bounds, span = max - min || 1;
  $('#pMin').textContent = `AED ${S.f.min.toLocaleString('en-US')}`; $('#pMax').textContent = `AED ${S.f.max.toLocaleString('en-US')}`;
  Object.assign($('#pFill').style, { left: `${(S.f.min - min) / span * 100}%`, right: `${100 - (S.f.max - min) / span * 100}%` });
}
const inBucket = (set, defs, n) => !set.size || (n != null && defs.some(([l, a, b]) => set.has(l) && n >= a && n <= b));
function visible(l) {
  const f = S.f;
  return S.data[l].filter(v => (!f.name || v.name.toLowerCase().includes(f.name.toLowerCase())) && (!f.types.size || f.types.has(v.name)) && inBucket(f.lug, LUG, v.luggage) && inBucket(f.pax, PAX, v.pax) && v.price >= f.min && v.price <= f.max)
    .sort((a, b) => (S.sort === 'asc' ? 1 : -1) * (a.price - b.price));
}

/* ---------- cards ---------- */
const feat = (ic, cls, t) => `<li>${icon(ic, `ico tr-ic ${cls}`)}<span>${esc(t)}</span></li>`;
function card(v, l, i) {
  const info = leg(l), selected = S.mode === 'round' && S.sel.get()[l]?.id === v.id, till = fmtD(info.date), route = `${info.from} to ${info.to}`;
  const pol = v.free ? `<span class="tr-pol is-free">${tick}Free cancellation</span>` : `<button class="tr-pol" data-act="more" type="button">${icon('calendar')}Cancellation Policy</button><small class="tr-valid">AED ${v.price} From ${v.from} till ${till}</small>`;
  const buy = S.mode === 'round'
    ? `<button class="hr-btn ${selected ? 'tr-selected' : 'hr-btn--p'} tr-btn" data-act="select" aria-pressed="${selected}">${selected ? 'Selected' : 'Select'}</button>`
    : `<button class="hr-btn hr-btn--p tr-btn" data-act="book">Book Now</button><button class="hr-btn hr-btn--o tr-btn" data-act="cart">Add To Cart</button>`;
  return `<article class="tr-card${selected ? ' is-selected' : ''}" data-id="${v.id}" style="--i:${i % 8}">
    <div class="tr-img">${v.image ? `<span class="tr-img__in" style="${tileStyle(v.image, 1.1)}"></span>` : `<span class="tr-ph">${PH}</span>`}</div>
    <div class="tr-body"><h3>${esc(v.name)}</h3>${pol}<p class="tr-desc">${esc(v.desc)}<br>From ${esc(info.from)} To ${esc(info.to)}</p><button class="tr-link" data-act="more" type="button">View More</button></div>
    <ul class="tr-feat">${v.hours ? feat('hourglass', 'tr-ic--red', `${v.hours} hours`) : ''}${v.luggage ? feat('bag', 'tr-ic--gold', `${v.luggage} Luggage Bags`) : ''}${feat('user', 'tr-ic--blue', `${v.pax} Passenger${v.pax > 1 ? 's' : ''}`)}${feat('pin', 'tr-ic--route', route)}</ul>
    <div class="tr-buy"><span class="tr-pref">Preferred</span><span class="tr-price">AED <b>${v.price.toLocaleString('en-US')}</b></span>${buy}</div></article>`;
}
const skeleton = n => Array.from({ length: n }, () => '<div class="hr-skel"><i></i><div><b></b><b></b><b></b></div></div>').join('');
function renderList() {
  const l = S.mode === 'round' ? S.leg : 'out', list = visible(l), root = $('#hrList');
  if (!S.data[l].length) root.innerHTML = `<div class="hr-empty">${icon('car')}<h3>No vehicles available${S.mode === 'round' ? ` for the ${l === 'out' ? 'outbound' : 'return'} journey` : ''}</h3><p>There are no transfers for this route and date. Try changing the date or locations.</p><button class="hr-btn hr-btn--p" type="button" data-modify>Modify Search</button></div>`;
  else if (!list.length) root.innerHTML = `<div class="hr-empty">${icon('search')}<h3>No vehicles match your filters</h3><p>Try widening the price range or clearing filters.</p><button class="hr-btn hr-btn--p" data-clear type="button">Clear All</button></div>`;
  else root.innerHTML = list.map((v, i) => card(v, l, i)).join('');
  const f = S.f, [min, max] = S.bounds; $('[data-clear]')?.classList.toggle('is-on', !!(f.name || f.types.size || f.lug.size || f.pax.size || f.min > min || f.max < max));
}

/* ---------- round trip: tabs + fixed bottom bar ---------- */
function renderTabs() {
  const t = $('#trTabs'); t.hidden = S.mode !== 'round'; if (t.hidden) return;
  const s = S.sel.get(), tab = (l, label, d) => `<button role="tab" data-leg="${l}" aria-selected="${S.leg === l}" class="${S.leg === l ? 'is-on' : ''}">${s[l] ? tick : ''}<b>${label}</b><span>${fmtD(d)}</span></button>`;
  t.innerHTML = tab('out', 'Outbound', S.q.date) + tab('ret', 'Return', S.q.returnDate);
}
function panel(l, v) {
  const label = l === 'out' ? 'Outbound' : 'Return';
  if (!v) return `<button class="tr-bar__p is-empty" data-leg="${l}" type="button"><span class="tr-bar__ph">${icon('car')}</span><span><small>${label.toUpperCase()}</small><b>Select a ${l === 'out' ? 'outbound' : 'return'} vehicle</b><em>${S.data[l].length ? 'Pending' : 'No vehicles available'}</em></span></button>`;
  return `<div class="tr-bar__p"><span class="tr-bar__img" style="${v.image ? tileStyle(v.image, 1) : ''}">${v.image ? '' : PH}</span><div><small>${label.toUpperCase()}</small><b>${esc(v.name)}</b><em>AED ${v.price.toLocaleString('en-US')} From ${v.from} till ${fmtD(leg(l).date)}</em><button class="tr-link" data-more-sel="${l}" type="button">View More</button></div>
    <button class="tr-x" data-remove="${l}" aria-label="Remove ${label.toLowerCase()} vehicle" type="button">${icon('close')}</button></div>`;
}
function renderBar() {
  const bar = $('#trBar'), on = S.mode === 'round'; bar.hidden = !on; document.body.classList.toggle('has-trbar', on); if (!on) return;
  const s = S.sel.get(), done = S.sel.isComplete();
  bar.innerHTML = `<div class="hr-wrap tr-bar__in">${panel('out', s.out)}${panel('ret', s.ret)}
    <div class="tr-bar__buy"><div class="tr-bar__total">${done ? `AED <b>${S.sel.total().toLocaleString('en-US')}</b>` : `<small>${s.out || s.ret ? 'Select both journeys' : 'No vehicles selected'}</small>`}</div>
      <button class="hr-btn hr-btn--p tr-btn" data-book type="button" ${done ? '' : 'disabled'}>Book Now</button><button class="hr-btn hr-btn--o tr-btn" data-addcart type="button" ${done ? '' : 'disabled'}>Add To Cart</button></div></div>`;
}
const refreshSelection = () => { renderTabs(); renderBar(); $$('.tr-card').forEach(c => { const on = S.sel.get()[S.leg]?.id === c.dataset.id, b = $('[data-act="select"]', c); c.classList.toggle('is-selected', on); if (b) { b.textContent = on ? 'Selected' : 'Select'; b.classList.toggle('tr-selected', on); b.classList.toggle('hr-btn--p', !on); b.setAttribute('aria-pressed', on); } }); };

/* ---------- cart actions (respect selection rules, no duplicates) ---------- */
const inCart = id => getState().cart.some(i => i.id === id);
function addLines(lines, open) {
  const fresh = lines.filter(l => !inCart(l.id));
  fresh.forEach((l, i) => addToCart(l, { open: open && i === fresh.length - 1 }));
  if (!fresh.length) { toast('Already in your cart'); if (open) setTimeout(() => setState({ cartOpen: true, activePopover: null }), 0); return; } // after the click that triggered this, so the outside-click handler doesn't close it
  if (!open) toast(lines.length > 1 ? 'Round trip added to cart' : 'Transfer added to cart');
}
function bookRound(open) {
  if (!S.sel.isComplete()) return toast('Please select a vehicle for both journeys');
  const { out, ret } = S.sel.get(); addLines(cartLines(out, ret, S.q), open);
}

/* ---------- popups ---------- */
function showMore(v, l) {
  const info = leg(l), POL = v.free ? 'Free cancellation up to 24 hours before pickup.' : 'Cancellation charges apply as per the supplier policy; no-shows are non-refundable.';
  openModal({ title: esc(v.name), sub: `${info.from} → ${info.to}`, width: '40rem', body: `<ul class="tr-pop"><li><b>Price</b>${money(v.price)}</li><li><b>Pickup</b>${fmtD(info.date)}, ${info.time}</li><li><b>Passengers</b>${v.pax}</li>${v.luggage ? `<li><b>Luggage bags</b>${v.luggage}</li>` : ''}${v.hours ? `<li><b>Duration</b>${v.hours} hours</li>` : ''}<li><b>Valid</b>${v.from} till ${fmtD(info.date)}</li></ul>
    <h4 class="tr-pop__h">Description</h4><p class="hr-p">${esc(v.desc)}</p><h4 class="tr-pop__h">Cancellation policy</h4><p class="hr-p">${POL}</p>` });
}
const findVehicle = (id, l) => S.data[l].find(v => v.id === id);

/* ---------- events ---------- */
function bind() {
  const curLeg = () => (S.mode === 'round' ? S.leg : 'out');
  $('#hrList').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'), mod = e.target.closest('[data-modify]'); if (mod) return $('#hrModify').click(); if (!b) return;
    const l = curLeg(), v = findVehicle(b.closest('.tr-card').dataset.id, l), act = b.dataset.act;
    if (act === 'more') showMore(v, l);
    else if (act === 'book') addLines(cartLines(v && { ...v }, null, S.q), true);
    else if (act === 'cart') addLines(cartLines({ ...v }, null, S.q), false);
    else if (act === 'select') {
      S.sel.select(l, { ...v, till: leg(l).date, route: `${leg(l).from} to ${leg(l).to}` });
      const other = l === 'out' ? 'ret' : 'out';
      if (S.sel.get()[l] && !S.sel.get()[other] && S.data[other].length) { toast(`Now select your ${other === 'out' ? 'outbound' : 'return'} vehicle`); setLeg(other); }
    }
  });
  const bar = $('#trBar');
  bar.addEventListener('click', e => {
    const rm = e.target.closest('[data-remove]'), lg = e.target.closest('[data-leg]'), ms = e.target.closest('[data-more-sel]');
    if (rm) S.sel.clear(rm.dataset.remove); else if (lg) setLeg(lg.dataset.leg);
    else if (ms) { const l = ms.dataset.moreSel, sv = S.sel.get()[l], v = findVehicle(sv.id, l); showMore(v || sv, l); }
    else if (e.target.closest('[data-book]')) bookRound(true); else if (e.target.closest('[data-addcart]')) bookRound(false);
  });
  $('#trTabs').addEventListener('click', e => { const t = e.target.closest('[data-leg]'); if (t) setLeg(t.dataset.leg); });
  const side = $('#hrFilters'); let timer;
  side.addEventListener('change', e => { const t = e.target; if (t.dataset.f) { S.f[t.dataset.f][t.checked ? 'add' : 'delete'](t.value); renderList(); } });
  side.addEventListener('input', e => {
    const t = e.target; if (t.id === 'fName') { clearTimeout(timer); timer = setTimeout(() => { S.f.name = t.value.trim(); renderList(); }, 200); return; }
    if (!t.dataset.p) return; const lo = $('[data-p="min"]', side), hi = $('[data-p="max"]', side); if (+lo.value > +hi.value) (t === lo ? hi : lo).value = t.value;
    S.f.min = +lo.value; S.f.max = +hi.value; syncPrice(); renderList();
  });
  side.addEventListener('click', e => { if (e.target.closest('[data-close-f]')) toggleFilters(false); if (e.target.closest('[data-clear]')) { resetFilters(); renderFilters(); renderList(); } });
  $('#sortPrice').addEventListener('change', e => { S.sort = e.target.value; renderList(); });
  $('#hrOpenFilters').addEventListener('click', () => toggleFilters(true)); $('#hrOverlay').addEventListener('click', () => toggleFilters(false));
  $('#hrModify').addEventListener('click', () => {
    const m = openModal({ title: 'Modify Search', width: '34rem', cls: 'hr-modify-modal', footer: false, body: '' });
    const s = renderSearch(searchConfig, { onSearch: v => { sessionStorage.setItem(QKEY, JSON.stringify(v)); m.close(); location.reload(); } });
    s.setValues(S.q); m.body.append(s.el);
  });
}
function setLeg(l) { S.leg = l; renderTabs(); $('#hrList').innerHTML = skeleton(1); setTimeout(renderList, 180); }
const toggleFilters = on => { $('#hrFilters').classList.toggle('is-open', on); $('#hrOverlay').classList.toggle('is-open', on); document.body.classList.toggle('modal-open', on); };

/* ---------- load ---------- */
async function load() {
  $('#hrList').innerHTML = skeleton(3);
  try {
    const p = new URLSearchParams(location.search);
    S.data = await searchTransfers(S.q, { empty: p.get('empty'), fail: p.get('fail') === '1' });
    resetFilters(); renderFilters(); renderTabs(); renderList(); renderBar();
  } catch (err) {
    console.error('[transfer-results]', err);
    $('#hrList').innerHTML = `<div class="hr-empty">${icon('info')}<h3>Unable to load transfers</h3><p>${esc(err.message)}</p><button class="hr-btn hr-btn--p" type="button" data-retry>Retry</button></div>`;
    $('[data-retry]').addEventListener('click', load);
  }
}
export function init() {
  try {
    readQuery();
    S.sel = createSelection(JSON.stringify([S.mode, S.q.pickup, S.q.dropoff, S.q.returnPickup, S.q.returnDrop, S.q.date, S.q.time, S.q.returnDate, S.q.returnTime, S.q.guests]));
    S.sel.subscribe(refreshSelection); renderSummary(); $('#hrOpenFilters').innerHTML = `${icon('filter')}Filters`; bind(); load();
  } catch (err) {
    console.error('[transfer-results]', err);
    $('#hrList').innerHTML = `<div class="hr-empty">${icon('info')}<h3>Unable to load results</h3><p>${esc(err.message)}</p><button class="hr-btn hr-btn--p" onclick="sessionStorage.removeItem('${QKEY}');location.reload()">Reset search &amp; retry</button></div>`;
  }
}
