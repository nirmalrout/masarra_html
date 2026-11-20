// Modal manager + the four hotel popups: Details, Map, Compare, Availability.
import { esc, tileStyle, fmtDay } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { mealNames } from '../data/hotel-results-data.js';

export const money = n => `AED ${Number(n).toLocaleString('en-US')}`;
export const stars = n => `<span class="hr-stars" role="img" aria-label="${n} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
export const minPrice = h => Math.min(...h.rooms.map(r => r.price));

export function toast(msg) {
  let t = document.querySelector('.hr-toast');
  if (!t) { t = document.createElement('div'); t.className = 'hr-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('is-on'), 2600);
}

/** Generic modal: Esc / backdrop / X / Close button, body-scroll lock, fade+scale animation. */
export function openModal({ title = '', sub = '', head = '', width = '62rem', cls = '', footer = true, body = '' }) {
  const el = document.createElement('div'); el.className = 'hr-modal';
  el.innerHTML = `<div class="hr-modal__box ${cls}" style="--w:${width}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]*>/g, ''))}">
    <header class="hr-modal__head">${head || `<div><h2>${title}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`}<button class="hr-x" data-x type="button" aria-label="Close">${icon('close')}</button></header>
    <div class="hr-modal__body"></div>${footer ? '<footer class="hr-modal__foot"><button class="hr-btn hr-btn--close" data-x type="button">Close</button></footer>' : ''}</div>`;
  const bodyEl = el.querySelector('.hr-modal__body'); typeof body === 'string' ? (bodyEl.innerHTML = body) : bodyEl.append(body);
  document.body.append(el); document.body.classList.add('modal-open'); requestAnimationFrame(() => el.classList.add('is-open'));
  const onKey = e => { if (e.key === 'Escape' && el === [...document.querySelectorAll('.hr-modal')].pop()) close(); };
  function close() {
    el.classList.remove('is-open'); document.removeEventListener('keydown', onKey);
    setTimeout(() => { el.remove(); if (!document.querySelector('.hr-modal')) document.body.classList.remove('modal-open'); }, 250);
  }
  el.addEventListener('mousedown', e => { if (e.target === el) close(); });
  el.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
  document.addEventListener('keydown', onKey);
  return { el, body: bodyEl, close };
}

/* ---------------- 1. Hotel details ---------------- */
const POLICY = {
  'Non-Refundable': 'Non-refundable: the full amount is charged on cancellation, amendment or no-show.',
  'Partial Cancellation Fees': 'Free cancellation up to 7 days before arrival; after that the first night is charged.',
  'Free Cancellation': 'Free cancellation up to 48 hours before arrival; later cancellations are charged one night.'
};
export function openDetails(h, tab = 'image') {
  const tabs = [['image', 'Image'], ['description', 'Description'], ['rate', 'Rate'], ['terms', 'Terms & Conditions'], ['age', 'Age Policy'], ['cancel', 'Cancellation Policy']];
  let idx = 0;
  const list = items => `<ul class="hr-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  const panels = {
    image: () => `<div class="hr-gal"><div class="hr-gal__main" style="${tileStyle(h.gallery[idx], 0.5)}" role="img" aria-label="${esc(h.name)} photo ${idx + 1}"></div>
      <button class="hr-gal__nav hr-gal__nav--l" data-g="-1" aria-label="Previous photo">${icon('left')}</button><button class="hr-gal__nav hr-gal__nav--r" data-g="1" aria-label="Next photo">${icon('right')}</button>
      <div class="hr-gal__thumbs">${h.gallery.map((g, i) => `<button data-t="${i}" class="${i === idx ? 'is-on' : ''}" style="${tileStyle(g, 0.6)}" aria-label="Photo ${i + 1}"></button>`).join('')}</div></div>`,
    description: () => `<p class="hr-p">${esc(h.desc)}</p><p class="hr-p"><strong>Address:</strong> ${esc(h.address)}</p>${list(['Outdoor pool & fitness centre', 'Spa and wellness facilities', 'Multiple restaurants and bars', 'Free Wi-Fi in public areas', 'Airport transfers on request'])}`,
    rate: () => `<div class="hr-tablewrap"><table class="hr-table"><thead><tr><th>Room</th><th>Meal plan</th><th>Cancellation</th><th>Price / night</th></tr></thead><tbody>${h.rooms.map(r => `<tr><td>${esc(r.name)}</td><td>${r.meal} · ${mealNames[r.meal]}</td><td>${r.policy}</td><td><b>${money(r.price)}</b>${r.was ? ` <s>${money(r.was)}</s>` : ''}${r.onRequest ? ' <em>On request</em>' : ''}</td></tr>`).join('')}</tbody></table></div>`,
    terms: () => list(['Check-in from 14:00; check-out until 12:00.', 'A valid photo ID and credit card are required at check-in.', 'Rates are per room per night and include applicable taxes unless stated.', 'Tourism fee / city tax is payable at the property where applicable.', 'Early check-in and late check-out are subject to availability.']),
    age: () => list(['Children aged 0–5 stay free using existing bedding.', 'Children aged 6–11 are charged the child rate when sharing with two adults.', 'Guests aged 12 and over are considered adults.', 'Extra beds are subject to availability and additional charges.']),
    cancel: () => list([...new Set(h.rooms.map(r => r.policy))].map(p => `<b>${p}:</b> ${POLICY[p]}`))
  };
  const m = openModal({ title: `${esc(h.name)} ${stars(h.stars)}`, width: '75rem', cls: 'hr-details', body: '<div class="hr-tabs" role="tablist"></div><div class="hr-panel"></div>' });
  const bar = m.el.querySelector('.hr-tabs'), panel = m.el.querySelector('.hr-panel');
  const show = t => { tab = t; bar.innerHTML = tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === t}" data-tab="${k}" class="${k === t ? 'is-on' : ''}">${l}</button>`).join(''); panel.innerHTML = `<div class="hr-panel__in">${panels[t]()}</div>`; };
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), g = e.target.closest('[data-g]'), th = e.target.closest('[data-t]');
    if (t) show(t.dataset.tab);
    if (g) { idx = (idx + Number(g.dataset.g) + h.gallery.length) % h.gallery.length; show('image'); }
    if (th) { idx = Number(th.dataset.t); show('image'); }
  });
  show(tab);
}

/* ---------------- 2. Map ---------------- */
// Stylised SVG map. To use Google Maps, replace mapSvg() with a map mounted in the same container.
function mapSvg(list, activeId, mode, zoom) {
  const W = 800, H = 480, la = list.map(h => h.lat), ln = list.map(h => h.lng);
  const spanLa = Math.max(Math.max(...la) - Math.min(...la), 0.012), spanLn = Math.max(Math.max(...ln) - Math.min(...ln), 0.02);
  const cLa = (Math.max(...la) + Math.min(...la)) / 2, cLn = (Math.max(...ln) + Math.min(...ln)) / 2;
  const px = h => [W / 2 + (h.lng - cLn) / spanLn * W * 0.7, H / 2 - (h.lat - cLa) / spanLa * H * 0.6];
  const act = list.find(h => h.id === activeId);
  return `<svg viewBox="0 0 ${W} ${H}" class="hr-map__svg" style="transform:scale(${zoom})" role="img" aria-label="Map of hotel locations">
    <rect class="m-land" width="${W}" height="${H}"/><path class="m-water" d="M0 380 C150 340 260 430 420 400 S700 350 800 390 V480 H0Z"/>
    <path class="m-park" d="M470 40 L690 70 L720 210 L520 190Z"/><path class="m-park" d="M40 60 L200 40 L230 140 L70 150Z"/>
    <path class="m-road" d="M-10 250 C200 170 420 300 810 200" stroke-width="22"/><path class="m-road" d="M300 -10 C330 150 280 300 360 490" stroke-width="14"/><path class="m-road" d="M-10 120 L810 330" stroke-width="8"/><path class="m-road" d="M560 -10 L610 490" stroke-width="8"/>
    ${list.map(h => { const [x, y] = px(h); return `<g class="m-pin${h.id === activeId ? ' is-on' : ''}" data-pin="${h.id}" transform="translate(${x.toFixed(0)},${y.toFixed(0)})" tabindex="0" role="button" aria-label="${esc(h.name)}"><path d="M0 0c-9-11-13-17-13-23a13 13 0 0 1 26 0c0 6-4 12-13 23z"/><circle cy="-23" r="5"/></g>`; }).join('')}
    ${act ? (() => { const [x, y] = px(act), w = Math.min(act.name.length * 6.4 + 24, 280); return `<g transform="translate(${x.toFixed(0)},${(y - 62).toFixed(0)})" class="m-label"><rect x="${-w / 2}" y="-18" width="${w}" height="30" rx="4"/><text text-anchor="middle" y="2">${esc(act.name.length > 40 ? act.name.slice(0, 38) + '…' : act.name)}</text></g>`; })() : ''}</svg>`;
}
export function openMap(list, activeId = list[0]?.id) {
  const single = list.length === 1 ? list[0] : null; let mode = 'map', zoom = 1, active = activeId;
  const m = openModal({ title: single ? esc(single.name) : 'Hotels on map', sub: single ? single.address : `${list.length} hotels`, width: '50rem', cls: 'hr-mapmodal', footer: false,
    body: `<div class="hr-map" data-mode="map"><div class="hr-map__tabs"><button data-mode="map" class="is-on">Map</button><button data-mode="satellite">Satellite</button></div>
      <div class="hr-map__view"></div><button class="hr-map__fs" data-fs type="button" aria-label="Toggle fullscreen">${icon('max')}</button>
      <div class="hr-map__zoom"><button data-z="1" aria-label="Zoom in">${icon('plus')}</button><button data-z="-1" aria-label="Zoom out">${icon('minus')}</button></div><span class="hr-map__credit">Map preview</span></div>` });
  const box = m.el.querySelector('.hr-map'), view = box.querySelector('.hr-map__view');
  const draw = () => { box.dataset.mode = mode; view.innerHTML = mapSvg(list, active, mode, zoom); box.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('is-on', b.dataset.mode === mode)); };
  box.addEventListener('click', e => {
    const md = e.target.closest('[data-mode]'), z = e.target.closest('[data-z]'), pin = e.target.closest('[data-pin]');
    if (md) mode = md.dataset.mode; if (z) zoom = Math.min(2.5, Math.max(1, zoom + Number(z.dataset.z) * 0.3));
    if (pin) active = pin.dataset.pin; if (e.target.closest('[data-fs]')) box.classList.toggle('is-fs');
    draw();
  });
  draw();
}

/* ---------------- 3. Compare ---------------- */
export function openCompare(list, { onRemove, onBook } = {}) {
  const best = Math.min(...list.map(minPrice));
  const rows = [
    ['Star category', h => stars(h.stars)], ['Location', h => esc(h.address)],
    ['Starting from', h => `<b class="${minPrice(h) === best ? 'hr-best' : ''}">${money(minPrice(h))}</b>${minPrice(h) === best ? ' <span class="hr-pill">Best price</span>' : ''}`],
    ['Meal plans', h => [...new Set(h.rooms.map(r => r.meal))].map(x => `<span class="hr-tag">${x}</span>`).join(' ')],
    ['Cancellation', h => [...new Set(h.rooms.map(r => r.policy))].join(', ')],
    ['Room types', h => h.rooms.length], ['Availability', h => h.rooms.some(r => !r.onRequest) ? 'Instant booking' : 'On request'],
    ['Highlights', h => esc(h.desc.length > 120 ? h.desc.slice(0, 118) + '…' : h.desc)]];
  const m = openModal({ title: `Compare Hotels <small>(${list.length})</small>`, width: '75rem', cls: 'hr-compare', body: '' });
  const draw = () => { m.body.innerHTML = `<div class="hr-tablewrap"><table class="hr-cmp"><thead><tr><th></th>${list.map(h => `<th><button class="hr-cmp__x" data-rm="${h.id}" aria-label="Remove ${esc(h.name)}">${icon('close')}</button><div class="hr-cmp__img" style="${tileStyle(h.image, 0.7)}"></div><b>${esc(h.name)}</b></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([l, f]) => `<tr><th scope="row">${l}</th>${list.map(h => `<td>${f(h)}</td>`).join('')}</tr>`).join('')}
    <tr><th></th>${list.map(h => `<td><button class="hr-btn hr-btn--p" data-book="${h.id}">View Rooms</button></td>`).join('')}</tr></tbody></table></div>`; };
  m.el.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]'), bk = e.target.closest('[data-book]');
    if (rm) { list = list.filter(h => h.id !== rm.dataset.rm); onRemove?.(rm.dataset.rm); list.length < 2 ? m.close() : draw(); }
    if (bk) { m.close(); onBook?.(bk.dataset.book); }
  });
  draw();
}

/* ---------------- 4. Room availability ---------------- */
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const pad = n => String(n).padStart(2, '0'), iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const LEG = { NA: 'Not Available', FS: 'Free Sale', RQ: 'On Request', BO: 'Block Out', OK: 'Available' };
function dayInfo(h, room, meal, d) {
  const k = hash(`${h.id}${room.name}${iso(d)}`), wk = [5, 6].includes(d.getDay());
  const status = room.onRequest ? (k % 9 === 0 ? 'NA' : 'RQ') : ({ 0: 'NA', 1: 'BO', 2: 'OK' }[k % 12] || 'FS');
  return { status, price: Math.round(room.price * (wk ? 1.08 : 1) * (meal === room.meal ? 1 : 1.12) / 1) };
}
export function openAvailability(h, ri = 0) {
  let room = h.rooms[ri], meal = room.meal, sel = null;
  const meals = [...new Set(h.rooms.map(r => r.meal))], months = [new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1)];
  const head = `<h2>${esc(h.name)}</h2><select data-sel="room" aria-label="Room">${h.rooms.map((r, i) => `<option value="${i}"${i === ri ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select>
    <select data-sel="meal" aria-label="Meal plan">${meals.map(x => `<option${x === meal ? ' selected' : ''}>${x}</option>`).join('')}</select><span class="hr-cur">AED</span>`;
  const m = openModal({ head, width: '75rem', cls: 'hr-avail', footer: false,
    body: `<div class="hr-legend">${Object.entries(LEG).map(([k, v]) => `<span><i class="lg lg--${k}"></i>${k} (${v})</span>`).join('')}</div><div class="hr-cals"><div data-cal="0"></div><div data-cal="1"></div></div><div class="hr-pick" data-pick></div>` });
  const cal = i => {
    const first = months[i], start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const cells = Array.from({ length: 42 }, (_, k) => { const d = new Date(start); d.setDate(start.getDate() + k);
      if (d.getMonth() !== first.getMonth()) return `<div class="c c--out">${pad(d.getDate())}</div>`;
      if (d < TODAY) return `<div class="c c--past">${pad(d.getDate())}</div>`;
      const { status, price } = dayInfo(h, room, meal, d), on = sel?.iso === iso(d), ok = status !== 'NA' && status !== 'BO';
      return `<button class="c c--${status}${on ? ' is-sel' : ''}" ${ok ? `data-d="${iso(d)}" data-p="${price}" data-s="${status}"` : 'disabled'} aria-label="${fmtDay(iso(d))} ${LEG[status]} ${price}"><b>${pad(d.getDate())}</b><span>${price}</span></button>`; }).join('');
    m.el.querySelector(`[data-cal="${i}"]`).innerHTML = `<div class="hr-calnav"><button data-n="${i},-1" aria-label="Previous month">${icon('left')}</button><span>${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(first)}</span><button data-n="${i},1" aria-label="Next month">${icon('right')}</button></div>
      <div class="hr-calgrid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="c c--h">${d}</div>`).join('')}${cells}</div>`;
  };
  const pick = () => { m.el.querySelector('[data-pick]').innerHTML = sel ? `<span>Selected: <b>${fmtDay(sel.iso)}</b> · ${money(sel.price)}</span><button class="hr-btn hr-btn--p" data-go>${sel.status === 'RQ' ? 'Send Request' : 'Book Now'}</button>` : '<span class="hr-muted">Select an available date to continue.</span>'; };
  const all = () => { cal(0); cal(1); pick(); }; all();
  m.el.addEventListener('change', e => {
    const s = e.target.dataset.sel; if (s === 'room') { room = h.rooms[e.target.value]; meal = room.meal; m.el.querySelector('[data-sel="meal"]').value = meal; } if (s === 'meal') meal = e.target.value; sel = null; all();
  });
  m.el.addEventListener('click', e => {
    const n = e.target.closest('[data-n]'), d = e.target.closest('[data-d]');
    if (n) { const [i, dir] = n.dataset.n.split(',').map(Number); months[i] = new Date(months[i].getFullYear(), months[i].getMonth() + dir, 1); cal(i); }
    if (d) { sel = { iso: d.dataset.d, price: Number(d.dataset.p), status: d.dataset.s }; all(); }
    if (e.target.closest('[data-go]')) {
      if (sel.status === 'RQ') toast(`Request sent for ${h.name} on ${fmtDay(sel.iso)}`);
      else addToCart({ id: `${h.id}-${room.name}-${sel.iso}`, name: `${h.name} – ${room.name}`, image: h.image, price: sel.price, date: sel.iso });
      m.close();
    }
  });
}
