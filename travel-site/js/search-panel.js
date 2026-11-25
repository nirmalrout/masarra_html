import { esc, isoDay } from './utils.js';
import { icon } from './icons.js';

/**
 * Config-driven search form.
 * cfg.search.fields entries:
 *   field                { name, label, type: text|date|time|number|select|tabs|radio|stepper, icon, placeholder, value, options, required,
 *                          min ('today'|value), minFrom (other field name), check {name,title}, labelWhen [{when,text}], showWhen }
 *   [f1, f2]             two-column row
 *   { row:[f1,f2], swap:[a,b], swapWhen, showWhen }   row with optional swap-values button
 * showWhen / swapWhen / labelWhen.when are objects such as { mode: 'Chauffeur' }; every key must equal that control's current value.
 * cfg.search.link { check, pairs:[[from,to]] } mirrors values while a checkbox is ticked.   cfg.search.validate(values) -> [{field,message}]
 * Hidden fields are disabled, so they are skipped by validation and omitted from the submitted values, but they keep their state.
 */
const SWAP_SVG = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13"/></svg>';
export const flattenFields = fs => fs.flatMap(f => Array.isArray(f) ? f : f.row ? f.row : [f]);

export function renderSearch(cfg, { onSearch }) {
  const s = cfg.search, el = document.createElement('form');
  el.className = 'search-card'; el.noValidate = true; el.setAttribute('aria-label', 'Search');
  const val = v => (typeof v === 'string' && /^\+\d+$/.test(v)) ? isoDay(Number(v)) : (v ?? '');
  const when = w => w ? ` data-when="${esc(JSON.stringify(w))}"` : '';

  /* ---------- markup ---------- */
  const field = f => {
    const w = when(f.showWhen);
    if (f.type === 'tabs') return `<div class="seg" role="tablist" data-fld="${f.name}" data-seg="${f.name}"${w}>${f.options.map((o, i) => `<button type="button" role="tab" class="${i ? '' : 'is-on'}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}<input type="hidden" name="${f.name}" value="${esc(f.options[0])}"></div>`;
    if (f.type === 'radio') return `<div class="radios" data-fld="${f.name}"${w}>${f.options.map((o, i) => `<label class="radio"><input type="radio" name="${f.name}" value="${esc(o)}"${i ? '' : ' checked'}><span>${esc(o)}</span></label>`).join('')}</div>`;
    const id = `f-${cfg.key}-${f.name}`;
    let ctl;
    if (f.type === 'select') ctl = `<select id="${id}" name="${f.name}">${f.placeholder ? `<option value="" disabled selected hidden>${esc(f.placeholder)}</option>` : ''}${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
    else if (f.type === 'stepper') ctl = `<input id="${id}" name="${f.name}" type="text" readonly placeholder="${esc(f.placeholder || f.label)}" data-stepper="${esc(f.unit || '')}" data-max="${f.max || 10}"><span class="fld-step"><button type="button" data-step="-1" aria-label="Decrease ${esc(f.label)}">−</button><button type="button" data-step="1" aria-label="Increase ${esc(f.label)}">+</button></span>`;
    else ctl = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" placeholder="${esc(f.placeholder || f.label)}" value="${esc(val(f.value))}"${f.min === 'today' ? ` min="${isoDay(0)}"` : f.min ? ` min="${f.min}"` : ''}>`;
    const lab = f.check ? `<div class="fld-lab"><label for="${id}">${esc(f.label)}</label><input type="checkbox" name="${f.check.name}" title="${esc(f.check.title)}" aria-label="${esc(f.check.title)}"></div>` : `<label for="${id}">${esc(f.label)}</label>`;
    return `<div class="fld${f.required ? ' is-req' : ''}" data-fld="${f.name}"${w}>${lab}<div class="fld-box"><span class="fld-ico">${icon(f.icon || 'pin')}</span>${ctl}</div><small class="fld-msg" data-msg="${f.name}" role="alert"></small></div>`;
  };
  const block = b => {
    if (Array.isArray(b) || b.row) {
      const r = Array.isArray(b) ? { row: b } : b;
      return `<div class="blk" data-blk${when(r.showWhen)}><div class="fld-row">${r.row.map(field).join('')}</div>${r.swap ? `<button class="fld-swap" type="button" data-swap="${r.swap.join(',')}"${when(r.swapWhen)} aria-label="Swap locations">${SWAP_SVG}</button>` : ''}</div>`;
    }
    return `<div class="blk" data-blk>${field(b)}</div>`;
  };
  el.innerHTML = s.fields.map(block).join('') + `<button class="search-btn" type="submit">${esc(s.button || 'Search')}</button>`;

  /* ---------- helpers ---------- */
  const flat = flattenFields(s.fields), get = n => el.elements[n];
  const values = () => Object.fromEntries(new FormData(el));
  const st = n => { const c = el.querySelector(`[name="${n}"]`); return !c ? undefined : c.type === 'radio' ? el.querySelector(`[name="${n}"]:checked`)?.value : c.value; };
  const match = w => !w || Object.entries(w).every(([k, v]) => st(k) === v);
  const parse = n => (n.dataset.when ? JSON.parse(n.dataset.when) : null);
  const setOn = (node, on) => { node.hidden = !on; node.querySelectorAll('input,select,button').forEach(c => (c.disabled = !on)); };

  /** Show/hide fields for the current tab / trip type without re-rendering (values are preserved). */
  function applyVisibility() {
    el.querySelectorAll('[data-blk]').forEach(b => {
      const bOn = match(parse(b)); let any = false;
      b.querySelectorAll('[data-fld]').forEach(fe => { const on = bOn && match(parse(fe)); setOn(fe, on); any ||= on; });
      b.querySelectorAll('.fld-swap').forEach(sw => { const on = bOn && match(parse(sw)); sw.hidden = !on; sw.disabled = !on; });
      b.hidden = !any;
    });
    flat.filter(f => f.labelWhen).forEach(f => { const hit = f.labelWhen.find(x => match(x.when)); el.querySelector(`label[for="f-${cfg.key}-${f.name}"]`).textContent = hit ? hit.text : f.label; });
  }
  const syncSeg = () => el.querySelectorAll('[data-seg]').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.dataset.v === get(g.dataset.seg).value)));
  const syncSelects = () => el.querySelectorAll('select').forEach(x => x.classList.toggle('is-empty', !x.value));
  const fmtStep = (inp, n) => { inp.dataset.n = n; inp.value = n ? `${n} ${inp.dataset.stepper}${n > 1 && inp.dataset.stepper ? 's' : ''}`.trim() : ''; };
  const clearErr = fe => { fe?.querySelector('.fld-box')?.classList.remove('is-invalid'); const m = fe?.querySelector('.fld-msg'); if (m) m.textContent = ''; };

  /* ---------- interactions ---------- */
  el.addEventListener('click', e => {
    const tab = e.target.closest('[data-seg] button'), step = e.target.closest('[data-step]'), sw = e.target.closest('[data-swap]');
    if (tab) { get(tab.parentElement.dataset.seg).value = tab.dataset.v; syncSeg(); applyVisibility(); }
    if (step) { const inp = step.closest('.fld-box').querySelector('input'), n = Math.min(Number(inp.dataset.max), Math.max(0, (Number(inp.dataset.n) || 0) + Number(step.dataset.step))); fmtStep(inp, n); clearErr(inp.closest('.fld')); }
    if (sw) { const [a, b] = sw.dataset.swap.split(',').map(get), t = a.value; a.value = b.value; b.value = t; [a, b].forEach(x => { x.dispatchEvent(new Event('input', { bubbles: true })); clearErr(x.closest('.fld')); }); }
  });
  el.addEventListener('change', e => { if (e.target.type === 'radio') applyVisibility(); if (e.target.tagName === 'SELECT') syncSelects(); });
  el.addEventListener('input', e => clearErr(e.target.closest('.fld')));

  // keep a date field's minimum in step with another field (e.g. return date >= pickup date)
  flat.filter(f => f.minFrom).forEach(f => {
    const src = get(f.minFrom), dst = get(f.name), sync = () => { if (!src.value) return; dst.min = src.value; if (dst.value && dst.value < src.value) dst.value = src.value; clearErr(dst.closest('.fld')); };
    src.addEventListener('change', sync); sync();
  });
  // checkbox that mirrors one field into another (e.g. return trip = reverse of the outbound trip)
  const link = s.link && { chk: get(s.link.check), pairs: s.link.pairs.map(([a, b]) => [get(a), get(b)]) };
  const syncLink = () => { if (!link) return; link.pairs.forEach(([a, b]) => { b.readOnly = link.chk.checked; if (link.chk.checked) b.value = a.value; }); };
  if (link) { link.chk.addEventListener('change', syncLink); link.pairs.forEach(([a]) => a.addEventListener('input', syncLink)); }

  // Hotels: keep check-in / check-out / nights consistent
  const ci = get('checkin'), co = get('checkout'), n = get('nights');
  if (ci && co && n) {
    const nights = () => Math.max(1, Math.round((new Date(co.value) - new Date(ci.value)) / 864e5) || 1);
    ci.addEventListener('change', () => { if (co.value <= ci.value) { const d = new Date(ci.value); d.setDate(d.getDate() + 1); co.value = isoOf(d); } n.value = nights(); });
    co.addEventListener('change', () => { n.value = nights(); });
    n.addEventListener('input', () => { const d = new Date(ci.value); d.setDate(d.getDate() + Math.max(1, Number(n.value) || 1)); co.value = isoOf(d); });
  }

  /* ---------- submit ---------- */
  el.addEventListener('submit', e => {
    e.preventDefault();
    el.querySelectorAll('.fld-box').forEach(b => b.classList.remove('is-invalid')); el.querySelectorAll('.fld-msg').forEach(m => (m.textContent = ''));
    const errs = flat.filter(f => f.required && get(f.name) && !get(f.name).disabled && !String(get(f.name).value).trim()).map(f => ({ field: f.name, message: 'This field is required' }));
    if (!errs.length && s.validate) errs.push(...s.validate(values()));
    if (errs.length) {
      errs.forEach(({ field: name, message }) => { const box = get(name)?.closest('.fld-box'); if (!box) return; void box.offsetWidth; box.classList.add('is-invalid'); el.querySelector(`[data-msg="${name}"]`).textContent = message; });
      get(errs[0].field)?.focus(); return;
    }
    const btn = el.querySelector('.search-btn'); btn.textContent = 'Searching…'; btn.disabled = true;
    setTimeout(() => { btn.textContent = s.button || 'Search'; btn.disabled = false; }, 700);
    onSearch(values());
  });

  applyVisibility(); syncSelects();
  return {
    el,
    setValues(v = {}) {
      Object.entries(v).forEach(([k, x]) => {
        const c = get(k); if (!c) return;
        if (c.dataset?.stepper !== undefined) fmtStep(c, parseInt(x) || 0); else if (c.type === 'checkbox') c.checked = !!x; else c.value = x;
      });
      syncSeg(); syncSelects(); syncLink(); applyVisibility();
    }
  };
}
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
