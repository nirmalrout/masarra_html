import { makeItems } from './_helpers.js';
import { isoDay } from '../js/utils.js';

const place = (name, label, extra = {}) => ({ name, label, icon: 'pin', placeholder: 'Destination', required: true, ...extra });
const P2P = { mode: 'Point-to-Point' }, ROUND = { mode: 'Point-to-Point', trip: 'Round-Trip' };
const at = (d, t) => new Date(`${d}T${t || '00:00'}`);

export const config = {
  key: 'transfers', icon: 'car', resultsUrl: 'transfer-results.html',
  banner: [{ title: 'Chauffeur-driven, every step of the way', desc: 'Airport, city and private transfers', image: [0, 0] }],
  search: {
    button: 'Search',
    fields: [
      { name: 'mode', type: 'tabs', options: ['Point-to-Point', 'Chauffeur'] },
      { name: 'trip', type: 'radio', options: ['One-Way', 'Round-Trip'], showWhen: P2P },
      { row: [place('pickup', 'Pickup'), place('dropoff', 'Drop-off')], swap: ['pickup', 'dropoff'], swapWhen: ROUND },
      { row: [place('returnPickup', 'Return Pickup'), place('returnDrop', 'Return Drop-off', { check: { name: 'reverse', title: 'Return on the reverse of the outbound route' } })], swap: ['returnPickup', 'returnDrop'], showWhen: ROUND },
      { row: [
        { name: 'date', label: 'Date', type: 'date', icon: 'calendar', value: '+7', min: 'today', required: true },
        { name: 'time', label: 'Start Time', type: 'time', icon: 'clock', value: '12:15', required: true, labelWhen: [{ when: ROUND, text: 'Pickup Time' }] }] },
      { row: [
        { name: 'returnDate', label: 'Return Date', type: 'date', icon: 'calendar', value: '+8', minFrom: 'date', required: true },
        { name: 'returnTime', label: 'Return Pickup Time', type: 'time', icon: 'clock', value: '12:15', required: true }], showWhen: ROUND },
      { row: [
        { name: 'guests', label: 'Guest(s)', icon: 'user', value: '2 Adults', required: true },
        { name: 'duration', label: 'Duration', type: 'select', icon: 'hourglass', placeholder: 'Select', options: ['4 Hours', '6 Hours', '8 Hours', '10 Hours', '12 Hours', 'Full Day'], required: true, showWhen: { mode: 'Chauffeur' } }] },
      { name: 'luggage', label: 'Luggage Bags', type: 'stepper', unit: 'Bag', icon: 'bag', placeholder: 'Select Luggage Bags', showWhen: { mode: 'Chauffeur' } }
    ],
    link: { check: 'reverse', pairs: [['dropoff', 'returnPickup'], ['pickup', 'returnDrop']] },
    /** Cross-field rules. Hidden fields are never in `v`, so Round-Trip / Chauffeur rules only run for their own form. */
    validate(v) {
      const out = [], now = new Date();
      if (v.pickup && v.dropoff && v.pickup.trim().toLowerCase() === v.dropoff.trim().toLowerCase()) out.push({ field: 'dropoff', message: 'Drop-off must be different from pickup' });
      if (v.date < isoDay(0)) out.push({ field: 'date', message: 'Date cannot be in the past' });
      else if (v.date === isoDay(0) && at(v.date, v.time) < now) out.push({ field: 'time', message: 'This time has already passed' });
      if (v.returnDate) {
        if (v.returnDate < v.date) out.push({ field: 'returnDate', message: 'Return date cannot be earlier than the pickup date' });
        else if (at(v.returnDate, v.returnTime) <= at(v.date, v.time)) out.push({ field: 'returnTime', message: 'Return time must be after the pickup time' });
      }
      return out;
    }
  },
  recentTitle: v => `${v.pickup} - ${v.dropoff}`, recentChip: v => v.guests,
  recent: [
    { title: 'Khalifa City, Abu Dhabi - Novel Hotel City Center, Abu Dhabi', chip: '1 Adult', date: '2026-11-29', values: { mode: 'Point-to-Point', trip: 'One-Way', pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Novel Hotel City Center, Abu Dhabi', guests: '1 Adult' } },
    { title: 'Khalifa City, Abu Dhabi - Novel Hotel City Center, Abu Dhabi', chip: '9 Adults, 3 Children', date: '2026-11-29', values: { mode: 'Point-to-Point', trip: 'One-Way', pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Novel Hotel City Center, Abu Dhabi', guests: '9 Adults, 3 Children' } },
    { title: 'Khalifa City, Abu Dhabi - Intercontinental Dubai Festival City', chip: '9 Adults, 3 Children', date: '2026-11-29', values: { mode: 'Point-to-Point', trip: 'One-Way', pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Intercontinental Dubai Festival City', guests: '9 Adults, 3 Children' } }
  ],
  sections: [
    { title: 'Airport Services', book: false, ratio: 1.25, items: makeItems('a', [['Private Chauffeur'], ['Yas Lounge Access'], ['Salam Airport Services'], ['Diamond Lounge Access']], { price: 180 }) },
    { title: 'Transportation Services', book: false, ratio: 1.25, items: makeItems('tr', [['Sedan Cars'], ['Yachts & Boats'], ['Helicopters'], ['Luxury Cars']], { price: 400, off: 2 }) }
  ]
};
