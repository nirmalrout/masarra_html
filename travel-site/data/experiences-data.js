import { makeItems } from './_helpers.js';
const fields = [
  { name: 'destination', label: 'Destination', icon: 'pin' },
  [{ name: 'date', label: 'Date', type: 'date', icon: 'calendar', value: '+7' }, { name: 'guests', label: 'Guests', icon: 'bed', value: '2 Adults' }],
  { name: 'category', label: 'Category', type: 'select', icon: 'walk', options: ['Select', 'Tours', 'Adventure', 'Culture', 'Theme Parks'] },
  { name: 'experience', label: 'Experiences', icon: 'walk' },
  { name: 'market', label: 'Source Market', type: 'select', icon: 'map', options: ['Indian', 'Arab', 'European', 'Russian'] }
];
export const config = {
  key: 'experiences', icon: 'walk',
  banner: [
    { title: 'Experiences that stay with you', desc: 'Tours, culture and adventure across the UAE', image: [3, 2] },
    { title: 'Golden hour in the dunes', desc: 'Desert safaris and private camps', image: [2, 0] }
  ],
  search: { fields },
  recentTitle: v => v.destination || 'Abu Dhabi, United Arab Emirates', recentChip: v => v.guests,
  recent: [0, 1, 2].map(i => ({ title: 'Abu Dhabi, United Arab Emirates', chip: '2 Adults', date: '2027-01-09', values: { destination: 'Abu Dhabi, United Arab Emirates', guests: '2 Adults' } })),
  sections: [
    { title: 'Masarra Signature Products / Masarra Exclusives', book: false, ratio: 1.12, items: makeItems('x', [['Premium Emirati House Experience'], ['Emirati-Guided City Tour'], ['Private Catamaran Island Hopping'], ['Saadiyat Walking Tour'], ['Heritage Village Evening'], ['Falcon Experience']], { price: 350 }) },
    { title: 'Top Abu Dhabi Tours', pin: true, items: makeItems('t', [['Qasr Al Watan', 'Abu Dhabi'], ['Evening Desert Safari', 'Abu Dhabi'], ['teamLab Phenomena', 'Abu Dhabi'], ['Louvre Abu Dhabi', 'Abu Dhabi'], ['Sheikh Zayed Grand Mosque Tour', 'Abu Dhabi']], { price: 220, off: 1 }) },
    { title: 'Top Dubai & Northern Emirates Tours', pin: true, items: makeItems('d', [['Private Dubai City Tour', 'Dubai'], ['Burj Khalifa + Sky Views', 'Dubai'], ['Museum of The Future', 'Dubai'], ['Snorkeling in Fujairah', 'Fujairah'], ['Desert Safari Dubai', 'Dubai']], { price: 260, off: 3 }) }
  ]
};
