import { makeItems } from './_helpers.js';
export const config = {
  key: 'hotels', icon: 'bed', resultsUrl: 'hotel-results.html',
  banner: [
    { title: 'Stay in the heart of Abu Dhabi', desc: 'Handpicked hotels and resorts at member rates', image: [0, 0] },
    { title: 'Resorts by the sea', desc: 'Beachfront stays on Yas and Saadiyat', image: [3, 2] },
    { title: 'Weekend city escapes', desc: 'Luxury for every budget', image: [0, 2] }
  ],
  search: { button: 'Search', fields: [
    { name: 'destination', label: 'City/Hotel', icon: 'building' },
    [{ name: 'checkin', label: 'Check-in', type: 'date', icon: 'calendar', value: '+7' }, { name: 'checkout', label: 'Check-out', type: 'date', icon: 'calendar', value: '+8' }],
    { name: 'nights', label: 'Nights', type: 'number', icon: 'calendar', value: 1, min: 1 },
    { name: 'guests', label: 'Guests', icon: 'bed', value: '1 Room, 2 Adults' },
    { name: 'market', label: 'Source Market', type: 'select', icon: 'map', options: ['Indian', 'Arab', 'European', 'Russian'] }
  ] },
  recentTitle: v => v.destination || 'Abu Dhabi, United Arab Emirates', recentChip: v => `${v.nights} Night${v.nights > 1 ? 's' : ''}`,
  recent: [
    { title: 'The First Collection Marina Hotel', chip: '2 Nights', date: '2027-01-04', values: { destination: 'The First Collection Marina Hotel', nights: 2 } },
    { title: 'Abu Dhabi, United Arab Emirates', chip: '10 Nights', date: '2026-11-21', values: { destination: 'Abu Dhabi, United Arab Emirates', nights: 10 } },
    { title: 'Al Raha Beach Resort & Spa', chip: '2 Nights', date: '2027-01-03', values: { destination: 'Al Raha Beach Resort & Spa', nights: 2 } }
  ],
  sections: [
    { title: 'Bestselling Hotels', pin: true, items: makeItems('h', [['Radisson Blu Yas Island', 'Abu Dhabi', 4], ['Aldhafra Resort, Vignette Collection', 'Abu Dhabi', 5], ['Radisson Blu Hotel & Resort Al Ain', 'Abu Dhabi', 4], ['The Ritz-Carlton Abu Dhabi Grand Canal', 'Abu Dhabi', 5], ['Emirates Palace Mandarin Oriental', 'Abu Dhabi', 5]], { price: 650 }) },
    { title: '', pin: true, items: makeItems('h2', [['InterContinental Abu Dhabi', 'Abu Dhabi', 5], ['Al Raha Beach Resort & Spa', 'Abu Dhabi', 5], ['Hilton Abu Dhabi Yas Island', 'Abu Dhabi', 5], ['TRYP by Wyndham Dubai', 'Dubai', 4], ['Yas Island Rotana', 'Abu Dhabi', 4]], { price: 520, off: 2 }) }
  ]
};
