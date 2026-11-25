// Experience & Service results page. One module serves both types (?type=experience|service).
import { $, $$, esc, tileStyle, isoDay } from './utils.js';
import { icon } from './icons.js';
import { addToCart } from './cart.js';
import { renderSearch } from './search-panel.js';
import { config as searchConfig } from '../data/experiences-data.js';
import { TILES } from '../data/hotel-results-data.js';
import { TYPES, POLICY_TEXT } from '../data/experience-results-data.js';
import { openModal, toast } from './hotel-popups.js';

const PAGE = 6, QKEY = 'travel.query.experiences';
const S = { type: 'experience', q: null, f: null, sort: null, page: 1, shown: 0 };
const T = () => TYPES[S.type];
const bounds = () => { const p = T().items.map(i => i.price); return [Math.min(...p), Math.max(...p)]; };
const resetFilters = () => { const [min, max] = bounds(); S.f = { name: '', types: new Set(), cats: new Set(), cancel: new Set(), min, max }; };
const money = n => n.toLocaleString('en-US');
const PH = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M5 78 40 30l18 22 14-16 43 42z" fill="#e4cfd3"/><circle cx="92" cy="20" r="8" fill="#e4cfd3"/><path d="M30 78v-18M42 78v-14" stroke="#b8a0a6" stroke-width="3"/><circle cx="30" cy="56" r="4" fill="#b8a0a6"/><circle cx="42" cy="60" r="4" fill="#b8a0a6"/></svg>';

/* ---------- query + summary ---------- */
function readQuery() {
  const def = { destination: 'Abu Dhabi, United Arab Emirates', date: isoDay(7), guests: '2 Adults', market: 'Indian' };
  let q = {}; try { q = JSON.parse(sessionStorage.getItem(QKEY)) || {}; } catch { /* defaults */ }
  S.q = Object.fromEntries(Object.entries({ ...def, ...q }).map(([k, v]) => [k, v === '' || v == null ? def[k] ?? '' : v]));
  const t = new URLSearchParams(location.search).get('type'); S.type = TYPES[t] ? t : 'experience';
}
const fmt = s => { const d = new Date(s + 'T00:00'); return isNaN(d) ? '—' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d); };
function renderSummary() {
  const cell = (l, ic, v) => `<div class="hr-sum"><span class="hr-sum__l">${l}</span><span class="hr-sum__v">${icon(ic)}<b title="${esc(v)}">${esc(v)}</b></span></div>`;
  $('#hrSummary').innerHTML = cell('Destination', 'pin', S.q.destination) + cell('Tour Date', 'calendar', fmt(S.q.date)) + cell('Guests', 'bed', S.q.guests) + cell('Source Market', 'map', S.q.market);
  $('#hrModify').innerHTML = `${icon('search')}Modify Search`;
}

/* ---------- filters ---------- */
const chk = (g, v, label, n) => `<label class="hr-chk"><input type="checkbox" data-f="${g}" value="${esc(v)}"><span class="box"></span><span class="lbl">${esc(label)}</span><em>(${n})</em></label>`;
function renderFilters() {
  const t = T(), items = t.items, [min, max] = bounds(), n = fn => items.filter(fn).length;
  $('#hrFilters').innerHTML = `<div class="hr-fhead"><button class="hr-clear" data-clear type="button">Clear all</button><button class="hr-fclose" data-close-f type="button" aria-label="Close filters">${icon('close')}</button></div>
    <div class="hr-fsec"><h4>Price</h4><div class="hr-row"><span class="hr-chip" id="pMin"></span><span class="hr-chip" id="pMax"></span></div>
      <div class="hr-dual"><div class="hr-dual__track"><i id="pFill"></i></div><input type="range" data-p="min" min="${min}" max="${max}" step="1" value="${min}" aria-label="Minimum price"><input type="range" data-p="max" min="${min}" max="${max}" step="1" value="${max}" aria-label="Maximum price"></div></div>
    <div class="hr-fsec"><h4>${t.label}</h4><input class="hr-input" id="fName" type="search" placeholder="Search ${t.label}" aria-label="Search ${t.label}" value="${esc(S.f.name)}"></div>
    <div class="hr-fsec"><h4>${t.label} Type</h4>${chk('types', 'New', 'New', n(i => i.isNew))}</div>
    <div class="hr-fsec"><h4>${t.label} Category</h4>${t.categories.map(c => chk('cats', c, c, n(i => i.category === c))).join('')}</div>
    <div class="hr-fsec"><h4>Cancellation</h4>${Object.keys(POLICY_TEXT).map(p => chk('cancel', p, p, n(i => i.policy === p))).join('')}</div>`;
  syncPrice();
}
function syncPrice() {
  const [min, max] = bounds(), span = max - min || 1, { f } = S;
  $('#pMin').textContent = `AED ${money(f.min)}`; $('#pMax').textContent = `AED ${money(f.max)}`;
  Object.assign($('#pFill').style, { left: `${(f.min - min) / span * 100}%`, right: `${100 - (f.max - min) / span * 100}%` });
}
function visible() {
  const f = S.f;
  let list = T().items.filter(i => (!f.name || i.name.toLowerCase().includes(f.name.toLowerCase())) && (!f.types.size || i.isNew) && (!f.cats.size || f.cats.has(i.category)) && (!f.cancel.size || f.cancel.has(i.policy)) && i.price >= f.min && i.price <= f.max);
  if (S.sort) { const { key, dir } = S.sort; list = [...list].sort((a, b) => dir * (key === 'name' ? a.name.localeCompare(b.name) : a.price - b.price)); }
  return list;
}

/* ---------- cards ---------- */
const tick = '<svg class="ex-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
function card(it, i) {
  const extra = Math.max(0, it.features.length - 3);
  return `<article class="ex-card" data-id="${it.id}" style="--i:${i % PAGE}">
    <button class="ex-img" data-act="details" aria-label="View ${esc(it.name)} details">${it.image ? `<span class="ex-img__in" style="${tileStyle(it.image, 1.1)}"></span>` : `<span class="ex-ph">${PH}</span>`}</button>
    <div class="ex-body"><h3><button data-act="details">${esc(it.name)}</button></h3>
      ${it.desc ? `<p class="ex-desc">${esc(it.desc)}</p><button class="ex-link" data-act="details">View More</button>` : ''}
      <ul class="ex-checks">${it.features.slice(0, 3).map(f => `<li>${tick}${esc(f)}</li>`).join('')}<li>${tick}${esc(it.policy)}</li></ul>
      ${extra ? `<button class="ex-link ex-link--u" data-act="features">View More (+${extra})</button>` : ''}</div>
    <div class="ex-buy"><span class="ex-pref">Preferred</span><span class="ex-price">AED <b>${money(it.price)}</b></span><small>For ${esc(S.q.guests)}</small><button class="hr-btn hr-btn--p ex-select" data-act="select">Select</button></div></article>`;
}
const skeleton = n => Array.from({ length: n }, () => '<div class="hr-skel"><i></i><div><b></b><b></b><b></b></div></div>').join('');
let current = [];
function draw(reset = true) {
  const list = $('#hrList'), prev = S.shown; current = visible();
  if (reset) { list.innerHTML = ''; S.shown = 0; S.page = 1; }
  const end = Math.min(S.page * PAGE, current.length);
  list.insertAdjacentHTML('beforeend', current.slice(reset ? 0 : prev, end).map((it, i) => card(it, i)).join('')); S.shown = end;
  $('#hrCount').textContent = `${current.length} of ${T().items.length} ${T().plural}`;
  if (!current.length) list.innerHTML = `<div class="hr-empty">${icon('search')}<h3>No ${T().plural} match your filters</h3><p>Try widening the price range or clearing filters.</p><button class="hr-btn hr-btn--p" data-clear>Clear filters</button></div>`;
  $('#hrLoad').innerHTML = end < current.length ? `<button class="hr-btn hr-btn--o hr-loadmore" data-more type="button">Load More <small>(${current.length - end} remaining)</small></button>` : (current.length ? '<p class="hr-muted">You\'ve reached the end of the results.</p>' : '');
  const f = S.f, [min, max] = bounds(); $('[data-clear]')?.classList.toggle('is-on', !!(f.name || f.types.size || f.cats.size || f.cancel.size || f.min > min || f.max < max));
}

/* ---------- popups (follow the screenshots) ---------- */
function openDetails(it) {
  const base = Math.max(0, TILES.findIndex(t => it.image && t[0] === it.image[0] && t[1] === it.image[1])), gal = it.image ? [0, 1, 2, 3].map(k => TILES[(base + k) % 6]) : []; let tab = 'image', idx = 0;
  const panels = {
    image: () => gal.length ? `<div class="hr-gal"><div class="hr-gal__main" style="${tileStyle(gal[idx], 0.5)}" role="img" aria-label="${esc(it.name)} photo ${idx + 1}"></div>
      <button class="hr-gal__nav hr-gal__nav--l" data-g="-1" aria-label="Previous photo">${icon('left')}</button><button class="hr-gal__nav hr-gal__nav--r" data-g="1" aria-label="Next photo">${icon('right')}</button>
      <div class="hr-gal__thumbs">${gal.map((g, i) => `<button data-t="${i}" class="${i === idx ? 'is-on' : ''}" style="${tileStyle(g, 0.6)}" aria-label="Photo ${i + 1}"></button>`).join('')}</div></div>` : `<div class="ex-ph ex-ph--big">${PH}</div>`,
    description: () => `<p class="hr-p">${esc(it.desc || 'No description available for this item.')}</p>`,
    cancel: () => `<p class="hr-p"><b>${esc(it.policy)}:</b> ${esc(POLICY_TEXT[it.policy])}</p>`
  };
  const m = openModal({ title: esc(it.name), width: '50rem', cls: 'hr-details', body: '<div class="hr-tabs" role="tablist"></div><div class="hr-panel"></div>' });
  const bar = $('.hr-tabs', m.el), panel = $('.hr-panel', m.el);
  const show = t => { tab = t; bar.innerHTML = [['image', 'Image'], ['description', 'Description'], ['cancel', 'Cancellation Policy']].map(([k, l]) => `<button role="tab" aria-selected="${k === t}" data-tab="${k}" class="${k === t ? 'is-on' : ''}">${l}</button>`).join(''); panel.innerHTML = `<div class="hr-panel__in">${panels[t]()}</div>`; };
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), g = e.target.closest('[data-g]'), th = e.target.closest('[data-t]');
    if (t) show(t.dataset.tab); if (g) { idx = (idx + Number(g.dataset.g) + gal.length) % gal.length; show('image'); } if (th) { idx = Number(th.dataset.t); show('image'); }
  });
  show(tab);
}
const openFeatures = it => openModal({ title: esc(it.name), width: '32rem', footer: false, body: `<ul class="ex-flist">${[...it.features, it.policy].map(f => `<li>${tick}${esc(f)}</li>`).join('')}</ul>` });

/* ---------- events ---------- */
function bind() {
  $('#hrList').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const it = T().items.find(x => x.id === b.closest('.ex-card').dataset.id);
    if (b.dataset.act === 'details') openDetails(it); else if (b.dataset.act === 'features') openFeatures(it);
    else { addToCart({ id: it.id, name: it.name, image: it.image || [0, 0], price: it.price, date: S.q.date }); }
  });
  const side = $('#hrFilters'); let timer;
  side.addEventListener('change', e => { const t = e.target; if (t.dataset.f) { S.f[t.dataset.f][t.checked ? 'add' : 'delete'](t.value); draw(); } });
  side.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'fName') { clearTimeout(timer); timer = setTimeout(() => { S.f.name = t.value.trim(); draw(); }, 200); return; }
    if (!t.dataset.p) return; const lo = $('[data-p="min"]', side), hi = $('[data-p="max"]', side); if (+lo.value > +hi.value) (t === lo ? hi : lo).value = t.value;
    S.f.min = +lo.value; S.f.max = +hi.value; syncPrice(); draw();
  });
  side.addEventListener('click', e => { if (e.target.closest('[data-close-f]')) toggleFilters(false); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { resetFilters(); renderFilters(); draw(); }
    if (e.target.closest('[data-more]')) { $('#hrLoad').innerHTML = skeleton(1); setTimeout(() => { S.page++; draw(false); }, 650); }
    const ty = e.target.closest('[data-type]'); if (ty && ty.dataset.type !== S.type) switchType(ty.dataset.type);
  });
  $('#sortName').addEventListener('change', e => { $('#sortPrice').value = ''; S.sort = e.target.value ? { key: 'name', dir: e.target.value === 'asc' ? 1 : -1 } : null; draw(); });
  $('#sortPrice').addEventListener('change', e => { $('#sortName').value = ''; S.sort = e.target.value ? { key: 'price', dir: e.target.value === 'asc' ? 1 : -1 } : null; draw(); });
  $('#hrOpenFilters').addEventListener('click', () => toggleFilters(true)); $('#hrOverlay').addEventListener('click', () => toggleFilters(false));
  $('#hrModify').addEventListener('click', () => {
    const m = openModal({ title: 'Modify Search', width: '34rem', cls: 'hr-modify-modal', footer: false, body: '' });
    const s = renderSearch(searchConfig, { onSearch: v => { S.q = { ...S.q, ...v }; sessionStorage.setItem(QKEY, JSON.stringify(S.q)); m.close(); renderSummary(); S.f.name = v.experience || ''; renderFilters(); $('#hrList').innerHTML = skeleton(3); setTimeout(() => { draw(); toast('Search updated'); }, 700); } });
    s.setValues(S.q); m.body.append(s.el);
  });
}
function switchType(t) {
  S.type = t; S.sort = null; $('#sortName').value = $('#sortPrice').value = ''; resetFilters(); renderFilters(); markSeg();
  history.replaceState(null, '', `${location.pathname}?type=${t}`); $('#hrList').innerHTML = skeleton(2); setTimeout(() => draw(), 350);
}
const markSeg = () => $$('#exSeg button').forEach(b => { const on = b.dataset.type === S.type; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
const toggleFilters = on => { $('#hrFilters').classList.toggle('is-open', on); $('#hrOverlay').classList.toggle('is-open', on); document.body.classList.toggle('modal-open', on); };

export function init() {
  try {
    readQuery(); resetFilters(); renderSummary(); renderFilters(); markSeg();
    $('#hrOpenFilters').innerHTML = `${icon('filter')}Filters`; $('#hrList').innerHTML = skeleton(3); bind(); setTimeout(() => draw(true), 500);
  } catch (err) {
    console.error('[experience-results]', err);
    $('#hrList').innerHTML = `<div class="hr-empty">${icon('info')}<h3>Unable to load results</h3><p>${esc(err.message)}</p><button class="hr-btn hr-btn--p" type="button" onclick="sessionStorage.removeItem('${QKEY}');location.reload()">Reset search &amp; retry</button></div>`;
  }
}
