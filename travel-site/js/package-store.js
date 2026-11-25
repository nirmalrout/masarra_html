// Package state + pricing (no DOM). The customised package lives in sessionStorage so it survives navigation.
import { isoDay } from './utils.js';
import { PACKAGES } from '../data/package-results-data.js';

export const QKEY = 'travel.query.packages', PKEY = 'travel.package';
const p2 = n => String(n).padStart(2, '0');
export const addDays = (iso, n) => { const d = new Date(`${iso}T00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
export const dmy = iso => (iso ? iso.split('-').reverse().join('/') : '—');
export const long = iso => { const d = new Date(`${iso}T00:00`); return isNaN(d) ? '—' : `${p2(d.getDate())} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`; };
export const cancelFmt = iso => { const d = new Date(`${iso}T00:00`); return `${p2(d.getDate())}-${d.toLocaleString('en-GB', { month: 'short' })}-${d.getFullYear()}`; };
export const parseGuests = g => ({ rooms: +((g || '').match(/(\d+)\s*Room/i) || [, 1])[1], adults: +((g || '').match(/(\d+)\s*Adult/i) || [, 2])[1] });
export const guestsLabel = (r, a) => `${r} Room${r > 1 ? 's' : ''}, ${a} Adult${a > 1 ? 's' : ''}`;
export const fmt = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function readQuery() {
  const def = { destination: 'Abu Dhabi, United Arab Emirates', date: isoDay(5), guests: '1 Room, 2 Adults', market: 'Indian' };
  let q = {}; try { q = JSON.parse(sessionStorage.getItem(QKEY)) || {}; } catch { /* defaults */ }
  return Object.fromEntries(Object.entries({ ...def, ...q }).map(([k, v]) => [k, v === '' || v == null ? def[k] : v]));
}
export const saveQuery = q => sessionStorage.setItem(QKEY, JSON.stringify(q));

export const dayDate = (q, day) => addDays(q.date, day - 1);
export const isAvailable = (a, q) => !a.blocked?.includes(new Date(`${dayDate(q, a.day)}T00:00`).getDay());
export function priceOf(p, q) {
  const { rooms } = parseGuests(q.guests), hotel = p.hotel.nightly * p.nights * rooms, transfers = p.transfers.reduce((s, t) => s + t.price, 0);
  const activities = p.activities.filter(a => isAvailable(a, q)).reduce((s, a) => s + a.price, 0);
  return { hotel, transfers, activities, total: hotel + transfers + activities };
}
/** "Price starting from" ignores availability. */
export const startingPrice = (p, q) => priceOf({ ...p, activities: p.activities.map(a => ({ ...a, blocked: [] })) }, q).total;

export const baseById = id => PACKAGES.find(p => p.id === id) || null;
export function loadWorking(id) {
  try { const s = JSON.parse(sessionStorage.getItem(PKEY)); if (s && s.id === id) return s; } catch { /* fall through */ }
  const b = baseById(id); if (!b) return null;
  const p = structuredClone(b);
  p.transfers.forEach(t => { t.pickup ||= p.hotel.name; t.route = `Pickup From ${t.pickup} To ${t.dropoff || 'Dubai Hotel'}`; }); // pickup defaults to the package hotel
  return p;
}
export const saveWorking = p => sessionStorage.setItem(PKEY, JSON.stringify(p));
export function resetWorking(id) { sessionStorage.removeItem(PKEY); return loadWorking(id); }
/** Cart signature: changes whenever the selection, dates or guests change, so identical bookings aren't added twice. */
export const signature = (p, q) => [p.id, q.date, q.guests, p.transfers.map(t => `${t.id}:${t.day}:${t.dropoff}`).join(','), p.activities.filter(a => isAvailable(a, q)).map(a => `${a.id}:${a.day}`).join(',')].join('|');
