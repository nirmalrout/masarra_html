// Central app state. Cart + language + read notifications persist in localStorage.
import { sampleCart } from '../data/cart-data.js';
import { notifications } from '../data/notifications.js';

const KEYS = { cart: 'travel.cart', language: 'travel.language', currency: 'travel.currency', readIds: 'travel.readNotifications' };
const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

const state = {
  activePopover: null,           // 'user' | 'language' | 'notifications' | 'admin' | null
  cartOpen: false,
  mobileNavOpen: false,
  cart: load(KEYS.cart, sampleCart),   // sample data only on first visit
  language: load(KEYS.language, 'en'),
  currency: load(KEYS.currency, 'AED'),
  readIds: load(KEYS.readIds, [])
};
const subscribers = new Set();

export const getState = () => state;
export const subscribe = fn => { subscribers.add(fn); return () => subscribers.delete(fn); };
export function setState(patch) {
  Object.assign(state, patch);
  if ('cart' in patch) save(KEYS.cart, state.cart);
  if ('language' in patch) save(KEYS.language, state.language);
  if ('currency' in patch) save(KEYS.currency, state.currency);
  if ('readIds' in patch) save(KEYS.readIds, state.readIds);
  subscribers.forEach(fn => fn(state, patch));
}
export const unreadCount = () => notifications.filter(n => !state.readIds.includes(n.id)).length;
export const cartCount = () => state.cart.reduce((sum, i) => sum + i.qty, 0);
