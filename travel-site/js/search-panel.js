import { esc, isoDay } from './utils.js';
import { icon } from './icons.js';

/** Builds the search card from cfg.search.fields. Field: {name,label,type,icon,placeholder,value,options,required}. Arrays = two-column row. */
export function renderSearch(cfg, { onSearch }) {
  const s = cfg.search, el = document.createElement('form');
  el.className = 'search-card'; el.noValidate = true; el.setAttribute('aria-label', 'Search');
  const val = v => (typeof v === 'string' && /^\+\d+$/.test(v)) ? isoDay(Number(v)) : (v ?? '');
  const field = f => {
    if (f.type === 'tabs') return `<div class="seg" role="tablist" data-seg="${f.name}">${f.options.map((o, i) => `<button type="button" role="tab" class="${i ? '' : 'is-on'}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}<input type="hidden" name="${f.name}" value="${esc(f.options[0])}"></div>`;
    if (f.type === 'radio') return `<div class="radios">${f.options.map((o, i) => `<label class="radio"><input type="radio" name="${f.name}" value="${esc(o)}"${i ? '' : ' checked'}><span>${esc(o)}</span></label>`).join('')}</div>`;
    const id = `f-${cfg.key}-${f.name}`;
    const ctl = f.type === 'select'
      ? `<select id="${id}" name="${f.name}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" placeholder="${esc(f.placeholder || f.label)}" value="${esc(val(f.value))}"${f.min ? ` min="${f.min}"` : ''}>`;
    return `<div class="fld${f.required ? ' is-req' : ''}"><label for="${id}">${esc(f.label)}</label><div class="fld-box"><span class="fld-ico">${icon(f.icon || 'pin')}</span>${ctl}</div></div>`;
  };
  el.innerHTML = s.fields.map(f => Array.isArray(f) ? `<div class="fld-row">${f.map(field).join('')}</div>` : field(f)).join('')
    + `<button class="search-btn" type="submit">${esc(s.button || 'Search')}</button>`;

  const flat = s.fields.flat(), get = n => el.elements[n];
  const values = () => Object.fromEntries(new FormData(el));
  const syncSeg = () => el.querySelectorAll('[data-seg]').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.dataset.v === get(g.dataset.seg).value)));
  el.addEventListener('click', e => { const b = e.target.closest('[data-seg] button'); if (b) { get(b.parentElement.dataset.seg).value = b.dataset.v; syncSeg(); } });

  // Hotels: keep check-in / check-out / nights consistent
  const ci = get('checkin'), co = get('checkout'), n = get('nights');
  if (ci && co && n) {
    const nights = () => Math.max(1, Math.round((new Date(co.value) - new Date(ci.value)) / 864e5) || 1);
    ci.addEventListener('change', () => { if (co.value <= ci.value) { const d = new Date(ci.value); d.setDate(d.getDate() + 1); co.value = d.toISOString().slice(0, 10); } n.value = nights(); });
    co.addEventListener('change', () => { n.value = nights(); });
    n.addEventListener('input', () => { const d = new Date(ci.value); d.setDate(d.getDate() + Math.max(1, Number(n.value) || 1)); co.value = d.toISOString().slice(0, 10); });
  }
  el.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    flat.filter(f => f.required).forEach(f => { const box = get(f.name).closest('.fld-box'), bad = !get(f.name).value.trim();
      box.classList.remove('is-invalid'); if (bad) { void box.offsetWidth; box.classList.add('is-invalid'); ok = false; } });
    if (!ok) return;
    const btn = el.querySelector('.search-btn'); btn.textContent = 'Searching…'; btn.disabled = true;
    setTimeout(() => { btn.textContent = s.button || 'Search'; btn.disabled = false; }, 700);
    onSearch(values());
  });
  el.addEventListener('input', e => e.target.closest('.fld-box')?.classList.remove('is-invalid'));
  return { el, setValues(v = {}) { Object.entries(v).forEach(([k, x]) => { if (get(k)) get(k).value = x; }); syncSeg(); } };
}
