import { makeItems } from './_helpers.js';
const AD = 'Abu Dhabi, United Arab Emirates';
export const config = {
  key: 'packages', icon: 'tent',
  banner: [{ image: [2, 2] }],
  search: { fields: [
    { name: 'destination', label: 'Destination', icon: 'pin' },
    [{ name: 'date', label: 'Tour Date', type: 'date', icon: 'calendar', value: '+7' }, { name: 'guests', label: 'Guests', icon: 'bed', value: '1 Room, 2 Adults' }],
    { name: 'category', label: 'Category', type: 'select', icon: 'walk', options: ['Select', 'Sports & Events', 'Family', 'Culture', 'Golf'] },
    { name: 'package', label: 'Packages', icon: 'tent' },
    { name: 'market', label: 'Source Market', type: 'select', icon: 'map', options: ['Indian', 'Arab', 'European', 'Russian'] }
  ] },
  recentTitle: v => v.destination || AD, recentChip: v => v.guests,
  recent: [['1 Room, 1 Adult 1 Child'], ['1 Room, 1 Adult 2 Children'], ['1 Room, 2 Adults 2 Children']].map(([g]) => ({ title: AD, chip: g, date: '2026-11-27', values: { destination: AD, guests: g } })),
  sections: [
    { title: 'Latest Packages', pin: true, items: makeItems('p', [['Formula 1 Grand Prix 2025 - Abu Dhabi', AD], ['Abu Dhabi & Dubai - City Highlights', AD], ['Otolo - Summer Special with Yas Theme Parks', AD], ['Abu Dhabi & Al Dhafra - City and Desert Escape', AD]], { price: 1200 }) },
    { title: 'Sports & Events Packages', pin: true, items: makeItems('s', [['Formula 1 Grand Prix 2025 - Abu Dhabi'], ['Golf Stay & Play'], ['NBA Abu Dhabi Games 2025'], ['UFC Fight Night 2025 - Abu Dhabi']], { price: 1800, off: 2 }) },
    { title: 'Signature Packages', book: false, narrow: true, per: 3, ratio: 1.29, items: makeItems('g', [['Abu Dhabi & Al Ain - Emirati Culture and Heritage'], ['Family Fun and Emirati Culture'], ['Otolo - Summer Special with Yas Theme Parks']], { price: 1500, off: 1 }) }
  ]
};
