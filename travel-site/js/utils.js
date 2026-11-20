export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const money = n => `AED ${Number(n).toLocaleString('en-US')}`;
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Crops one tile of banner.jpg (2149x1006, 335px tiles) to fill an element of height/width ratio h (centered). */
export const tileStyle = ([c, r], h = 1) => {
  const k = Math.max(1, h), Wi = 6.415 * k, Hi = 3.003 * k;
  const px = (c * k + (k - 1) / 2) / (Wi - 1) * 100, py = (r * k + (k - h) / 2) / (Hi - h) * 100;
  return `background-image:url(assets/images/banner.jpg);background-size:${(Wi * 100).toFixed(1)}% auto;background-position:${px.toFixed(2)}% ${py.toFixed(2)}%`;
};
export const isoDay = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
export const fmtDay = iso => { const d = new Date(iso + 'T00:00'); const p = o => new Intl.DateTimeFormat('en-GB', o).format(d);
  return `${p({ weekday: 'long' })}, ${d.getDate()} ${p({ month: 'short' })} ${p({ year: '2-digit' })}`; };
