// Round-trip selection logic (no DOM). Outbound and return are stored independently and persisted per search.
export function createSelection(signature) {
  const KEY = 'travel.transfer.selection';
  let st = { out: null, ret: null }; const subs = new Set();
  try { const s = JSON.parse(sessionStorage.getItem(KEY)); if (s && s.sig === signature) st = { out: s.out, ret: s.ret }; } catch { /* start empty */ }
  const emit = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ sig: signature, ...st })); } catch { /* ignore */ } subs.forEach(f => f(api)); };
  const api = {
    get: () => ({ ...st }),
    /** Selecting the already-selected vehicle again clears that journey only. */
    select(leg, v) { st = { ...st, [leg]: st[leg]?.id === v.id ? null : { id: v.id, name: v.name, price: v.price, image: v.image, from: v.from, till: v.till, route: v.route } }; emit(); },
    clear(leg) { st = { ...st, [leg]: null }; emit(); },
    reset() { st = { out: null, ret: null }; emit(); },
    isComplete: () => Boolean(st.out) && Boolean(st.ret),
    total: () => (st.out?.price || 0) + (st.ret?.price || 0),
    subscribe: f => (subs.add(f), () => subs.delete(f))
  };
  return api;
}
/** Cart lines for a booking: one line per journey, with ids that identify journey + vehicle + date so duplicates can be detected. */
export const cartLines = (out, ret, q) => [
  out && { id: `tr-out-${out.id}-${q.date}`, name: `Transfer (Outbound) – ${out.name}`, image: out.image || [0, 0], price: out.price, date: q.date },
  ret && { id: `tr-ret-${ret.id}-${q.returnDate}`, name: `Transfer (Return) – ${ret.name}`, image: ret.image || [0, 0], price: ret.price, date: q.returnDate }
].filter(Boolean);
