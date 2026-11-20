import { makeItems } from './_helpers.js';
export const config = {
  key: 'transfers', icon: 'car',
  banner: [{ title: 'Chauffeur-driven, every step of the way', desc: 'Airport, city and private transfers', image: [0, 0] }],
  search: { fields: [
    { name: 'mode', type: 'tabs', options: ['Point-to-Point', 'Chauffeur'] },
    { name: 'trip', type: 'radio', options: ['One-Way', 'Round-Trip'] },
    [{ name: 'pickup', label: 'Pickup', icon: 'pin', placeholder: 'Destination', required: true }, { name: 'dropoff', label: 'Drop-off', icon: 'pin', placeholder: 'Destination', required: true }],
    [{ name: 'date', label: 'Date', type: 'date', icon: 'calendar', value: '+7', required: true }, { name: 'time', label: 'Start Time', type: 'time', icon: 'clock', value: '12:15', required: true }],
    { name: 'guests', label: 'Guest(s)', icon: 'user', value: '2 Adults', required: true }
  ] },
  recentTitle: v => `${v.pickup} - ${v.dropoff}`, recentChip: v => v.guests,
  recent: [
    { title: 'Khalifa City, Abu Dhabi - Novel Hotel City Center, Abu Dhabi', chip: '1 Adult', date: '2026-11-29', values: { pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Novel Hotel City Center, Abu Dhabi', guests: '1 Adult' } },
    { title: 'Khalifa City, Abu Dhabi - Novel Hotel City Center, Abu Dhabi', chip: '9 Adults, 3 Children', date: '2026-11-29', values: { pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Novel Hotel City Center, Abu Dhabi', guests: '9 Adults, 3 Children' } },
    { title: 'Khalifa City, Abu Dhabi - Intercontinental Dubai Festival City', chip: '9 Adults, 3 Children', date: '2026-11-29', values: { pickup: 'Khalifa City, Abu Dhabi', dropoff: 'Intercontinental Dubai Festival City', guests: '9 Adults, 3 Children' } }
  ],
  sections: [
    { title: 'Airport Services', book: false, ratio: 1.25, items: makeItems('a', [['Private Chauffeur'], ['Yas Lounge Access'], ['Salam Airport Services'], ['Diamond Lounge Access']], { price: 180 }) },
    { title: 'Transportation Services', book: false, ratio: 1.25, items: makeItems('tr', [['Sedan Cars'], ['Yachts & Boats'], ['Helicopters'], ['Luxury Cars']], { price: 400, off: 2 }) }
  ]
};
