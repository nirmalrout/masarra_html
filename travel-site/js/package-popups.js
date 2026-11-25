// Package popups: Modify Date & Pax, Add Activity (search + picker), Add / Replace Transfer (search + picker).
import { $, $$, esc, tileStyle, isoDay } from './utils.js';
import { icon } from './icons.js';
import { openModal, toast } from './hotel-popups.js';
import { TYPES } from '../data/experience-results-data.js';
import { VEHICLES } from '../data/transfer-results-data.js';
import { CITIES_TO } from '../data/package-results-data.js';
import { addDays, dayDate, dmy, parseGuests, guestsLabel, fmt } from './package-store.js';

const PH = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M5 78 40 30l18 22 14-16 43 42z" fill="#e4cfd3"/><circle cx="92" cy="20" r="8" fill="#e4cfd3"/></svg>';
const tick = '<svg class="ex-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const sel = (name, label, ic, options, value = '', placeholder = '') => `<div class="fld"><label for="pp-${name}">${label}</label><div class="fld-box"><span class="fld-ico">${icon(ic)}</span><select id="pp-${name}" name="${name}" class="${value ? '' : 'is-empty'}">${placeholder ? `<option value="" ${value ? '' : 'selected'}>${placeholder}</option>` : ''}${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select></div><small class="fld-msg" data-msg="${name}"></small></div>`;
const wireEmpty = el => el.addEventListener('change', e => e.target.tagName === 'SELECT' && e.target.classList.toggle('is-empty', !e.target.value));

/* ---------- Modify Date & Pax ---------- */
export function openDatePax(q, onApply) {
  const { rooms, adults } = parseGuests(q.guests), n = (max, v) => Array.from({ length: max }, (_, i) => [String(i + 1), String(i + 1)]);
  const m = openModal({ title: 'Modify Date & Pax', width: '34rem', footer: false, body: `<form class="pk-form" novalidate>
    <div class="fld"><label for="pp-date">Tour Date</label><div class="fld-box"><span class="fld-ico">${icon('calendar')}</span><input id="pp-date" name="date" type="date" min="${isoDay(0)}" value="${q.date}"></div><small class="fld-msg" data-msg="date"></small></div>
    <div class="fld-row">${sel('rooms', 'Rooms', 'bed', n(4), String(rooms))}${sel('adults', 'Adults', 'user', n(8), String(adults))}</div>
    <button class="search-btn" type="submit">Apply</button></form>` });
  const f = $('form', m.el); wireEmpty(f);
  f.addEventListener('submit', e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f));
    if (!v.date || v.date < isoDay(0)) { $('[data-msg="date"]', f).textContent = 'Please choose a date from today onwards'; return; }
    onApply({ ...q, date: v.date, guests: guestsLabel(+v.rooms, +v.adults) }); m.close();
  });
}

/* ---------- generic picker: filters (left) + result cards (right) ---------- */
function picker(cfg) {
  const items = cfg.items, ps = items.map(i => i.price), min = Math.floor(Math.min(...ps)), max = Math.ceil(Math.max(...ps));
  const f = { min, max, text: '', g: Object.fromEntries(cfg.groups.map(g => [g.key, new Set()])) }, st = { sel: null, opt: null };
  const m = openModal({ title: cfg.title, width: '82rem', cls: 'pk-pickmodal', footer: false, body: `<div class="pk-pick"><aside class="pk-pick__f">
    <div class="pk-fh"><button class="tr-clear" data-clear type="button">Clear all</button></div>
    <div class="pk-fs"><h4>Price</h4><div class="hr-row"><span class="hr-chip" id="ppMin"></span><span class="hr-chip" id="ppMax"></span></div><div class="hr-dual"><div class="hr-dual__track"><i id="ppFill"></i></div><input type="range" data-pr="min" min="${min}" max="${max}" value="${min}" aria-label="Minimum price"><input type="range" data-pr="max" min="${min}" max="${max}" value="${max}" aria-label="Maximum price"></div></div>
    <div class="pk-fs"><h4>${cfg.textLabel}</h4><input class="hr-input" data-text type="search" placeholder="${cfg.textLabel}" aria-label="${cfg.textLabel}"></div>
    ${cfg.groups.map(g => `<div class="pk-fs"><h4>${g.label}</h4>${g.options.map(o => `<label class="hr-chk"><input type="checkbox" data-g="${g.key}" value="${esc(o)}"><span class="box"></span><span class="lbl">${esc(o)}</span></label>`).join('')}</div>`).join('')}</aside><div class="pk-pick__l"></div></div>` });
  const list = $('.pk-pick__l', m.el), span = max - min || 1;
  const price = () => { $('#ppMin', m.el).textContent = `AED ${fmt(f.min)}`; $('#ppMax', m.el).textContent = `AED ${fmt(f.max)}`; Object.assign($('#ppFill', m.el).style, { left: `${(f.min - min) / span * 100}%`, right: `${100 - (f.max - min) / span * 100}%` }); };
  const draw = () => {
    const shown = items.filter(it => it.price >= f.min && it.price <= f.max && (!f.text || it.name.toLowerCase().includes(f.text.toLowerCase())) && cfg.groups.every(g => !f.g[g.key].size || [...f.g[g.key]].some(v => g.test(it, v))));
    list.innerHTML = shown.length ? shown.map((it, i) => cfg.card(it, i, st)).join('') : `<div class="hr-empty">${icon('search')}<h3>No results match your filters</h3><button class="hr-btn hr-btn--p" data-clear type="button">Clear all</button></div>`;
  };
  m.el.addEventListener('input', e => {
    const t = e.target; if (t.matches('[data-text]')) { f.text = t.value.trim(); draw(); }
    if (t.dataset.pr) { const lo = $('[data-pr="min"]', m.el), hi = $('[data-pr="max"]', m.el); if (+lo.value > +hi.value) (t === lo ? hi : lo).value = t.value; f.min = +lo.value; f.max = +hi.value; price(); draw(); }
  });
  m.el.addEventListener('change', e => { const t = e.target; if (t.dataset.g) { f.g[t.dataset.g][t.checked ? 'add' : 'delete'](t.value); draw(); } if (t.matches('[data-opt]')) { st.opt = t.value; draw(); } });
  m.el.addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { Object.values(f.g).forEach(s => s.clear()); f.text = ''; f.min = min; f.max = max; $$('[data-pr]', m.el).forEach(r => (r.value = r.dataset.pr === 'min' ? min : max)); $$('[data-g]', m.el).forEach(c => (c.checked = false)); $('[data-text]', m.el).value = ''; price(); draw(); return; }
    const it = items.find(x => x.id === e.target.closest('[data-id]')?.dataset.id); if (it) cfg.onClick(e, it, { m, st, draw });
  });
  price(); draw(); return m;
}

/* ---------- Add / Replace Activity ---------- */
const DISC = { x3: '33% off' }, OPTS = [['Standard Ticket', 1], ['Premium Ticket', 2]];
export function openActivity(ctx) { // ctx: { pkg, q, replaceId?, day?, onPick(activity) }
  const { pkg, q } = ctx, days = pkg.nights + 1;
  if (ctx.replaceId) return results(ctx.day);
  const m = openModal({ title: 'Add Activity', width: '34rem', footer: false, body: `<form class="pk-form" novalidate><div class="fld-row pk-row2">${sel('dest', 'Destination', 'pin', CITIES_TO, '', 'Select')}${sel('day', 'Day', 'calendar', Array.from({ length: days }, (_, i) => [String(i + 1), `Day ${i + 1} (${dmy(dayDate(q, i + 1))})`]), '', 'Select')}</div><button class="search-btn pk-right" type="submit">Search</button></form>` });
  const f = $('form', m.el); wireEmpty(f);
  f.addEventListener('submit', e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f)); let bad = false;
    ['dest', 'day'].forEach(k => { const msg = $(`[data-msg="${k}"]`, f); msg.textContent = v[k] ? '' : 'Please select'; bad ||= !v[k]; }); if (bad) return;
    m.close(); setTimeout(() => results(+v.day), 260);
  });
  function results(day) {
    const items = TYPES.experience.items.filter(i => i.price > 2).map(i => ({ ...i, discount: DISC[i.id] }));
    picker({ title: ctx.replaceId ? 'Replace Activity' : 'Add Activity', items, textLabel: 'Keyword Search',
      groups: [{ key: 'type', label: 'Sightseeing Types', options: ['New'], test: it => it.isNew }, { key: 'cat', label: 'Excursion Category', options: TYPES.experience.categories, test: (it, v) => it.category === v }],
      card: (it, i, st) => {
        const on = st.sel === it.id, opt = st.opt || OPTS[0][0], mult = OPTS.find(o => o[0] === opt)[1], price = it.price * (on ? mult : 1);
        return `<article class="pk-act${on ? ' is-sel' : ''}" data-id="${it.id}" style="--i:${i % 6}"><div class="pk-act__main"><div class="pk-act__img">${it.image ? `<span style="${tileStyle(it.image, 0.8)}"></span>` : `<span class="tr-ph">${PH}</span>`}</div>
          <div class="pk-act__body">${it.discount ? `<span class="pk-disc">${it.discount}</span>` : ''}<h3>${esc(it.name)}</h3>${it.desc ? `<p>${esc(it.desc.slice(0, 170))}…</p>` : ''}<ul class="ex-checks">${it.features.slice(0, 3).map(x => `<li>${tick}${esc(x)}</li>`).join('')}<li>${tick}${esc(it.policy)}</li></ul></div>
          <div class="pk-act__buy"><span class="pk-dash">Preferred</span><b>AED ${price.toFixed(2)}</b><small>For ${esc(q.guests.split(',').pop().trim())}</small><button class="pk-white" data-act="sel" type="button">${on ? 'Selected' : 'Select'}</button></div></div>
          ${on ? `<div class="pk-act__opt"><div><b>${esc(it.name)}</b> ${icon('info', 'ico pk-i')}<small>${price.toFixed(0)} AED From 23/11/2026 till 25/11/2026</small></div><select data-opt aria-label="Ticket option">${OPTS.map(o => `<option${o[0] === opt ? ' selected' : ''}>${o[0]}</option>`).join('')}</select><span class="pk-act__p">AED <b>${fmt(price)}</b></span><button class="hr-btn hr-btn--p hr-btn--sm" data-act="confirm" type="button">Select</button><button class="hr-btn hr-btn--o hr-btn--sm" data-act="detail" type="button">Detail</button></div>` : ''}</article>`;
      },
      onClick: (e, it, { m, st, draw }) => {
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (a === 'sel') { st.sel = st.sel === it.id ? null : it.id; st.opt = null; draw(); }
        else if (a === 'detail') openModal({ title: esc(it.name), width: '36rem', body: `<p class="hr-p">${esc(it.desc || 'No description available.')}</p><p class="hr-p"><b>${esc(it.policy)}</b></p>` });
        else if (a === 'confirm') { const mult = OPTS.find(o => o[0] === (st.opt || OPTS[0][0]))[1]; ctx.onPick({ id: `${it.id}-${Date.now()}`, title: it.name, day, price: it.price * mult, desc: it.desc, image: it.image, category: it.category, blocked: [] }); m.close(); }
      } });
  }
}

/* ---------- Add / Replace Transfer ---------- */
export function openTransfer(ctx) { // ctx: { pkg, q, replace?: transfer, onPick(transfer) }
  const { pkg, q } = ctx, days = pkg.nights + 1, places = [pkg.hotel.name, 'Abu Dhabi International Airport', 'Dubai Hotel', 'Emirates Palace Mandarin Oriental, Abu Dhabi'];
  if (ctx.replace) return results({ day: ctx.replace.day, pickup: ctx.replace.pickup, dropoff: ctx.replace.dropoff, type: 'Airport Pickup' });
  const m = openModal({ title: 'Add Transfer', width: '34rem', footer: false, body: `<form class="pk-form" novalidate><div class="fld-row pk-row2">${sel('type', 'Transfer Type', 'pin', ['Airport Pickup', 'Airport Drop-off', 'Hotel to Hotel'], 'Airport Pickup')}${sel('day', 'Day', 'calendar', Array.from({ length: days }, (_, i) => [String(i + 1), `Day ${i + 1} (${dmy(dayDate(q, i + 1))})`]), '', 'Select')}</div>
    <div class="fld-row pk-row2">${sel('pickup', 'Pickup', 'pin', places, '', 'Destination')}${sel('dropoff', 'Dropoff', 'pin', places, '', 'Destination')}</div><button class="search-btn pk-right" type="submit">Search</button></form>` });
  const f = $('form', m.el); wireEmpty(f);
  f.addEventListener('submit', e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f)); let bad = false;
    ['day', 'pickup', 'dropoff'].forEach(k => { const msg = $(`[data-msg="${k}"]`, f); msg.textContent = v[k] ? '' : 'Please select'; bad ||= !v[k]; });
    if (!bad && v.pickup === v.dropoff) { $('[data-msg="dropoff"]', f).textContent = 'Drop-off must differ from pickup'; bad = true; } if (bad) return;
    m.close(); setTimeout(() => results({ day: +v.day, pickup: v.pickup, dropoff: v.dropoff, type: v.type }), 260);
  });
  function results(sel) {
    const items = VEHICLES.filter(v => !v.hours);
    picker({ title: ctx.replace ? 'Replace Transfer' : 'Add Transfer', items, textLabel: 'Name',
      groups: [{ key: 'veh', label: 'Vehicle Type', options: [...new Set(items.map(v => v.name))], test: (it, v) => it.name === v }],
      card: (it, i) => `<article class="pk-tr" data-id="${it.id}" style="--i:${i % 6}"><div class="pk-act__img">${it.image ? `<span style="${tileStyle(it.image, 1)}"></span>` : `<span class="tr-ph">${PH}</span>`}</div>
        <div class="pk-tr__body"><h3>${esc(it.name)}</h3><span class="tr-pol">${icon('calendar')}Cancellation Policy</span><small class="tr-valid">AED ${it.price} From ${it.from} till ${dmy(dayDate(q, sel.day))}</small><p>${esc(it.desc)}<br>From ${esc(sel.pickup || pkg.hotel.name)} To ${esc(sel.dropoff || 'Dubai Hotel')}</p></div>
        <ul class="tr-feat pk-tr__feat"><li>${icon('user', 'ico tr-ic tr-ic--blue')}<span>${it.pax}</span></li><li>${icon('bag', 'ico tr-ic tr-ic--gold')}<span>${it.luggage ?? 0}</span></li><li>${icon('pin', 'ico tr-ic tr-ic--route')}<span>${esc(sel.pickup || pkg.hotel.name)}</span></li></ul>
        <div class="pk-tr__buy"><span class="tr-pref">Preferred</span><span class="tr-price">AED <b>${fmt(it.price)}</b></span><button class="hr-btn hr-btn--p tr-btn" data-act="pick" type="button">Select</button></div></article>`,
      onClick: (e, it, { m }) => { if (!e.target.closest('[data-act="pick"]')) return;
        ctx.onPick({ id: `${it.id}-${Date.now()}`, title: it.desc || it.name, route: `Pickup From ${sel.pickup || pkg.hotel.name} To ${sel.dropoff || 'Dubai Hotel'}`, day: sel.day, price: it.price, image: it.image, pickup: sel.pickup || pkg.hotel.name, dropoff: sel.dropoff || '', category: 'Transfers & Airport Services' }); m.close(); } });
  }
}
