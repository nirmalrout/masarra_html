// Sample hotel search results. Replace with an API response of the same shape.
// image/gallery use [col,row] tiles of assets/images/banner.jpg until real photos exist.
export const TILES = [[0, 0], [2, 0], [3, 0], [0, 2], [2, 2], [3, 2]];
export const mealNames = { BB: 'Bed & Breakfast', HB: 'Half Board', FB: 'Full Board', AI: 'All Inclusive', UAI: 'Ultra All Inclusive', HBP: 'Half Board Plus Dinner' };
const r = (name, price, o = {}) => ({ name, price, meal: 'BB', policy: 'Non-Refundable', ...o });
const PL = 'Property Location With a stay at';
const near = n => `${PL} ${n}, you'll be centrally located in Abu Dhabi, within a 5-minute drive of Abu Dhabi Corniche and Abu Dhabi Mall. This luxury hotel is 1.9 mi (3.1 km) from Corniche Beach and 2.4 mi (3.8 km) from Etihad Towers. Guests enjoy a spa, multiple restaurants, a rooftop pool and a fully equipped fitness centre.`;
const H = (id, name, address, stars, lat, lng, desc, rooms, o = {}) => ({ id, name, address, stars, lat, lng, desc, rooms, image: TILES[(+id.slice(1) - 1) % 6], gallery: [0, 1, 2, 3].map(k => TILES[(+id.slice(1) - 1 + k) % 6]), ...o });
export const hotels = [
  H('h1', 'Royal Rose Abu Dhabi test', '1025 Sheikh Zayed The 1st, Electra - Abu Dhabi Hotel', 5, 24.4856, 54.3562, near('Royal Rose Abu Dhabi'), [
    r('Deluxe Room', 285, { was: 475, discount: '40% off' }), r('Deluxe Room', 465, { was: 655, discount: '40% off' }), r('Deluxe Room', 525, { was: 715, discount: '40% off', meal: 'HBP' }), r('Executive Suite', 690, { meal: 'HB', policy: 'Free Cancellation' })], { fav: true }),
  H('h2', 'Royal Rose Abu Dhabi', 'Delphine 64 Crown Road Great Yarmouth NR30 2JQ, UAE - Abu Dhabi Hotel', 4, 24.4721, 54.3697, near('Royal Rose Abu Dhabi'), [
    r('Deluxe Room', 309, { was: 325, discount: '5% off' }), r('Junior Suite', 380, { was: 400, discount: '5% off' }), r('Guest Room', 475, { was: 500, discount: '5% off' })], { stats: [1, 355] }),
  H('h3', 'InterContinental Abu Dhabi, an IHG Hotel', 'King Abdullah Bin Abdul Aziz Street - Abu Dhabi Hotel', 5, 24.4688, 54.3322, 'Property Location Centrally located in Abu Dhabi, InterContinental Abu Dhabi, an IHG Hotel is within a 15-minute walk of Etihad Towers and Corniche Beach. This beach hotel is 6.7 mi (10.7 km) from Port Zayed and 8.5 mi (13.6 km) from Louvre Abu Dhabi.', [
    r('Classic Room Garden View', 775, { onRequest: true, meal: 'BB' }), r('Classic Room Garden View', 975, { onRequest: true, meal: 'HB' }), r('Classic Room Garden View', 1125, { onRequest: true, meal: 'FB' })], { stats: [1, 19, 390] }),
  H('h4', 'Otolo Homes One Bedroom Apartment with Yas Theme Park Ticket (672473)', 'Yas Island - YS1', 5, 24.4881, 54.6075, 'Enjoy complimentary Yas Island theme park tickets for each guest per night, with access to 1 park per day, as part of your stay! This beautifully designed 1-bedroom apartment features a king-size bed in the master bedroom and a sofa bed in the living room.', [
    r('Otolo Homes 1BHK Apartment', 800, { startingFrom: true })]),
  H('h5', 'Test Hotel Abu Dhabi', 'Delphine 64 Crown Road Great Yarmouth NR30 2JQ, Dubai - Abu Dhabi Hotel', 3, 24.4390, 54.4260, 'This is for test purpose', [
    r('Guest Room (35 sq. meters)', 800), r('Standard Room', 900), r('Guest Room (35 sq. meters)', 1000, { meal: 'HB' })]),
  H('h6', 'test test test', 'Jacques Chirac St., Cultural District@#$%', 2, 24.5330, 54.3960, 'Simple test listing with a single room type.', [r('Standard Room Sea View', 1000)]),
  H('h7', 'Rixos Marina Abu Dhabi', 'Marina City Ring Road - Abu Dhabi Hotel', 5, 24.4760, 54.3225, near('Rixos Marina Abu Dhabi'), [
    r('Superior Room', 1700), r('Superior Room Sea View', 1838, { policy: 'Partial Cancellation Fees' }), r('Deluxe Room Sea View', 1850, { meal: 'HB' }), r('Marina Suite', 2400, { meal: 'FB', policy: 'Free Cancellation' })], { stats: [2, 39, 563] }),
  H('h8', 'Qasr Al Sarab Desert Resort by Anantara', '1 Qasr Al Sarab Road - Abu Dhabi Western Region', 5, 22.9035, 53.5810, near('Qasr Al Sarab'), [
    r('Deluxe Room with Balcony', 1880, { was: 2350, discount: '20% off', policy: 'Partial Cancellation Fees' }), r('Deluxe Garden View', 2040, { was: 2550, discount: '20% off', policy: 'Partial Cancellation Fees' }), r('Deluxe Room with Balcony', 2480, { was: 2850, discount: '20% off', policy: 'Partial Cancellation Fees', meal: 'AI' })], { stats: [15, 2, 205] }),
  H('h9', 'Anantara Al Sahel Villa Resort', 'Sir Bani Yas Island - Abu Dhabi Western Region', 5, 24.3170, 52.6080, 'Property Location When you stay at Anantara Al Sahel Villa Resort in Sir Bani Yas Island, you\'ll be in a national park and 8 minutes by car from Sir Bani Yas Island Beach. This luxury lodge is 6.7 mi (10.8 km) from Sir Bani Yas Island Pier.', [
    r('Savannah Pool Villa', 2700), r('Savannah Pool Villa', 3400, { meal: 'HB' }), r('Wilderness Pool Villa', 4000, { onRequest: true, meal: 'FB' })], { stats: [30] }),
  H('h10', 'Anantara Sir Bani Yas Island Al Yamm Villa Resort', 'Al Yamm - Abu Dhabi Western Region', 4, 24.3250, 52.6200, 'Property Location With a stay at Anantara Sir Bani Yas Island Al Yamm Villa Resort, you\'ll be on the beach, and 5 mi (8.1 km) from Sir Bani Yas Island Pier. Rooms make yourself at home with a private pool.', [
    r('One Bedroom Pool Villa', 2700, { bonus: true }), r('One Bedroom Deluxe Pool Villa', 3350, { bonus: true, onRequest: true, meal: 'HB' }), r('One Bedroom Pool Villa', 3400, { bonus: true, meal: 'AI' })], { stats: [30] })
];
