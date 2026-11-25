// Package results page: summary, dynamic filters, sorting, pagination. Clicking a package opens package-detail.html?id=
import { $, $$, esc, tileStyle } from './utils.js';
import { icon } from './icons.js';
import { renderSearch } from './search-panel.js';
import { config as searchConfig } from '../data/packages-data.js';
import { PACKAGES } from '../data/package-results-data.js';
import { openModal, toast } from './hotel-popups.js';
import { readQuery, saveQuery, startingPrice, long, fmt, resetWorking } from './package-store.js';
import { openDatePax } from './package-popups.js';

const PAGE = 5, DUR = [['1 - 3 Days', 1, 3], ['4 - 6 Days', 4, 6], ['7 - 9 Days', 7, 9], ['10+ Days', 10, 99]];
const S = { q: null, f: null, sort: 'price-asc', page: 1 };
const days = p => p.nights + 1;
const prices = () => PACKAGES.map(p => startingPrice(p, S.q));
const bounds = () => [Math.min(...prices()), Math.max(...prices())];
const resetFilters = () => { const [min, max] = bounds(); S.f = { name: '', stars: new Set(), city: new Set(), theme: new Set(), act: new Set(), dur: new Set(), min, max }; };

function renderSummary() {
  const q = S.q, cell = (l, ic, v) => `<div class="hr-sum"><span class="hr-sum__l">${l}</span><span class="hr-sum__v">${icon(ic)}<b title="${esc(v)}">${esc(v)}</b></span></div>`;
  $('#hrSummary').innerHTML = cell('Destination', 'pin', q.destination) + cell('Tour Date', 'calendar', long(q.date)) + cell('Guests', 'bed', q.guests) + cell('Source Market', 'map', q.market);
  $('#hrModify').innerHTML = `${icon('search')}Modify Search`;
}
const uniq = fn => { const m = new Map(); PACKAGES.forEach(p => new Set(fn(p)).forEach(k => m.set(k, (m.get(k) || 0) + 1))); return [...m]; };
const chk = (g, v, label, n) => `<label class="hr-chk"><input type="checkbox" data-f="${g}" value="${esc(v)}"><span class="box"></span><span class="lbl">${label}</span><em>(${n})</em></label>`;
function renderFilters() {
  const [min, max] = bounds();
  $('#hrFilters').innerHTML = `<div class="hr-fhead"><button class="hr-clear" data-clear type="button">Clear all</button><button class="hr-fclose" data-close-f type="button" aria-label="Close filters">${icon('close')}</button></div>
    <div class="hr-fsec"><h4 id="pkFound"></h4></div>
    <div class="hr-fsec"><h4>Price</h4><div class="hr-row"><span class="hr-chip" id="pMin"></span><span class="hr-chip" id="pMax"></span></div><div class="hr-dual"><div class="hr-dual__track"><i id="pFill"></i></div><input type="range" data-p="min" min="${min}" max="${max}" value="${min}" aria-label="Minimum price"><input type="range" data-p="max" min="${min}" max="${max}" value="${max}" aria-label="Maximum price"></div></div>
    <div class="hr-fsec"><h4>Package</h4><input class="hr-input" id="fName" type="search" placeholder="Search Package" aria-label="Search package"></div>
    <div class="hr-fsec"><h4>Hotel Star Rating</h4>${uniq(p => [p.hotel.stars]).sort((a, b) => b[0] - a[0]).map(([k, n]) => chk('stars', k, `<span class="hr-stars">${'★'.repeat(k)}</span>`, n)).join('')}</div>
    <div class="hr-fsec"><h4>City Covered</h4>${uniq(p => [p.city]).map(([k, n]) => chk('city', k, esc(k), n)).join('')}</div>
    <div class="hr-fsec"><h4>Package Theme</h4>${uniq(p => [p.theme]).map(([k, n]) => chk('theme', k, esc(k), n)).join('')}</div>
    <div class="hr-fsec"><h4>Activity</h4>${uniq(p => [...p.activities, ...p.transfers].map(a => a.category)).map(([k, n]) => chk('act', k, esc(k), n)).join('')}</div>
    <div class="hr-fsec"><h4>Duration ( in Days )</h4>${DUR.map(([l, a, b]) => chk('dur', l, l, PACKAGES.filter(p => days(p) >= a && days(p) <= b).length)).join('')}</div>`;
  syncPrice();
}
function syncPrice() {
  const [min, max] = bounds(), span = max - min || 1;
  $('#pMin').textContent = `AED ${fmt(S.f.min)}`; $('#pMax').textContent = `AED ${fmt(S.f.max)}`;
  Object.assign($('#pFill').style, { left: `${(S.f.min - min) / span * 100}%`, right: `${100 - (S.f.max - min) / span * 100}%` });
}
function visible() {
  const f = S.f, ok = (set, test) => !set.size || [...set].some(test);
  const list = PACKAGES.filter(p => { const sp = startingPrice(p, S.q);
    return (!f.name || p.title.toLowerCase().includes(f.name.toLowerCase())) && ok(f.stars, v => p.hotel.stars === +v) && ok(f.city, v => p.city === v) && ok(f.theme, v => p.theme === v)
      && ok(f.act, v => [...p.activities, ...p.transfers].some(a => a.category === v)) && ok(f.dur, l => { const [, a, b] = DUR.find(d => d[0] === l); return days(p) >= a && days(p) <= b; }) && sp >= f.min && sp <= f.max; });
  const [k, dir] = S.sort.split('-'), d = dir === 'asc' ? 1 : -1;
  return list.sort((a, b) => d * (k === 'price' ? startingPrice(a, S.q) - startingPrice(b, S.q) : k === 'days' ? days(a) - days(b) : a.title.localeCompare(b.title)));
}

function card(p, i) {
  const href = `package-detail.html?id=${p.id}`, price = startingPrice(p, S.q);
  const more = p.desc && p.desc.length > 95 ? `${esc(p.desc.slice(0, 95))}…<a class="pk-more" href="${href}">More</a>` : esc(p.desc || p.theme);
  return `<article class="pk-card" data-id="${p.id}" style="--i:${i}">
    <a class="pk-img" href="${href}" aria-label="View ${esc(p.title)}"><span style="${tileStyle(p.image, 0.82)}"></span></a>
    <div class="pk-body"><h3><a href="${href}">${esc(p.title)}</a></h3><p class="pk-days">(${p.nights} Night${p.nights > 1 ? 's' : ''} &amp; ${days(p)} Days)</p><span class="pk-city">${esc(p.city)} (${p.nights}N)</span>
      <div class="pk-icons" aria-label="Includes">${icon('bed')}${p.activities.length ? icon('walk') : ''}${p.transfers.length ? icon('car') : ''}</div><p class="pk-theme">${more}</p></div>
    <div class="pk-buy"><div class="pk-price">Price Starting From AED <b>${fmt(price)}</b><sup>*</sup></div><p class="pk-hotel">${icon('bed')}<span>${esc(p.hotel.name)}</span></p>
      <div class="pk-btns">${p.rdt ? '<span class="pk-rdt" title="Rate type">RDT</span>' : ''}<a class="pk-cb" href="${href}" data-act="customize">Customize &amp; Book</a></div>
      <button class="pk-mod" data-act="datepax" type="button">Modify Date &amp; Pax</button><small>*This is dynamic package, so price may vary.</small></div></article>`;
}
const skeleton = n => Array.from({ length: n }, () => '<div class="hr-skel"><i></i><div><b></b><b></b><b></b></div></div>').join('');
function draw(scroll = false) {
  const list = visible(), pages = Math.max(1, Math.ceil(list.length / PAGE)); S.page = Math.min(S.page, pages);
  const slice = list.slice((S.page - 1) * PAGE, S.page * PAGE), root = $('#hrList');
  root.innerHTML = slice.length ? slice.map(card).join('') : `<div class="hr-empty">${icon('search')}<h3>No packages match your filters</h3><p>Try widening the price range or clearing filters.</p><button class="hr-btn hr-btn--p" data-clear type="button">Clear all</button></div>`;
  $('#pkFound').textContent = `${list.length} Result${list.length === 1 ? '' : 's'} Found`; $('#hrCount').textContent = `${list.length} of ${PACKAGES.length} packages`;
  $('#pkPager').innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === S.page ? 'is-on' : ''}" data-page="${i + 1}" aria-label="Page ${i + 1}" ${i + 1 === S.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('') : (list.length ? '<button class="is-on" aria-current="page">1</button>' : '');
  const f = S.f, [min, max] = bounds(); $('[data-clear]')?.classList.toggle('is-on', !!(f.name || f.stars.size || f.city.size || f.theme.size || f.act.size || f.dur.size || f.min > min || f.max < max));
  if (scroll) scrollTo({ top: 0, behavior: 'smooth' });
}
function bind() {
  $('#hrList').addEventListener('click', e => {
    const a = e.target.closest('[data-act]'), id = e.target.closest('.pk-card')?.dataset.id; if (!a) return;
    if (a.dataset.act === 'datepax') openDatePax(S.q, q => { S.q = q; saveQuery(q); renderSummary(); renderFilters(); draw(); toast('Date & guests updated'); });
    if (a.dataset.act === 'customize') resetWorking(id); // always start the customisation from this package's defaults
  });
  const side = $('#hrFilters'); let timer;
  side.addEventListener('change', e => { const t = e.target; if (t.dataset.f) { S.f[t.dataset.f][t.checked ? 'add' : 'delete'](t.value); S.page = 1; draw(); } });
  side.addEventListener('input', e => {
    const t = e.target; if (t.id === 'fName') { clearTimeout(timer); timer = setTimeout(() => { S.f.name = t.value.trim(); S.page = 1; draw(); }, 200); return; }
    if (!t.dataset.p) return; const lo = $('[data-p="min"]', side), hi = $('[data-p="max"]', side); if (+lo.value > +hi.value) (t === lo ? hi : lo).value = t.value; S.f.min = +lo.value; S.f.max = +hi.value; syncPrice(); S.page = 1; draw();
  });
  side.addEventListener('click', e => { if (e.target.closest('[data-close-f]')) toggleFilters(false); });
  document.addEventListener('click', e => { if (e.target.closest('[data-clear]')) { resetFilters(); renderFilters(); S.page = 1; draw(); } const pg = e.target.closest('[data-page]'); if (pg) { S.page = +pg.dataset.page; draw(true); } });
  $('#pkSort').addEventListener('change', e => { S.sort = e.target.value; draw(); });
  $('#hrOpenFilters').addEventListener('click', () => toggleFilters(true)); $('#hrOverlay').addEventListener('click', () => toggleFilters(false));
  $('#hrModify').addEventListener('click', () => {
    const m = openModal({ title: 'Modify Search', width: '34rem', cls: 'hr-modify-modal', footer: false, body: '' });
    const s = renderSearch(searchConfig, { onSearch: v => { S.q = { ...S.q, ...v }; saveQuery(S.q); m.close(); renderSummary(); renderFilters(); $('#hrList').innerHTML = skeleton(2); setTimeout(() => { draw(); toast('Search updated'); }, 600); } });
    s.setValues(S.q); m.body.append(s.el);
  });
}
const toggleFilters = on => { $('#hrFilters').classList.toggle('is-open', on); $('#hrOverlay').classList.toggle('is-open', on); document.body.classList.toggle('modal-open', on); };

export function init() {
  try {
    S.q = readQuery(); resetFilters(); renderSummary(); renderFilters(); $('#hrOpenFilters').innerHTML = `${icon('filter')}Filters`; $('#hrList').innerHTML = skeleton(3); bind(); setTimeout(() => draw(), 450);
  } catch (err) {
    console.error('[package-results]', err);
    $('#hrList').innerHTML = `<div class="hr-empty">${icon('info')}<h3>Unable to load packages</h3><p>${esc(err.message)}</p><button class="hr-btn hr-btn--p" onclick="sessionStorage.removeItem('travel.query.packages');location.reload()">Reset search &amp; retry</button></div>`;
  }
}
