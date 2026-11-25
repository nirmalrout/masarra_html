// Mock package catalogue. Replace with an API response of the same shape.
// Prices: hotel.nightly x nights x rooms + transfers + available activities. Activity `blocked` = weekdays (0=Sun) it cannot run.
const T = [[0, 0], [2, 0], [3, 0], [0, 2], [2, 2], [3, 2]];
const TITLE = 'Half Day Guided Private Chauffeur Drive - SICC', ACT_TITLE = 'Half day Guided private chauffeur drive - SICC';
const ACT_DESC = 'Explore Abu Dhabi with a half-day private guided tour in a spacious 14-seater vehicle. With both a professional guide and chauffeur, this 4-hour experience is perfect for larger groups looking to discover the city\'s key attractions in comfort. Available in EN, FR, AR, SP, RU, and GE (more languages on request).';
const act = (id, price, day = 1) => ({ id, title: ACT_TITLE, day, price, desc: ACT_DESC, image: null, category: 'City Tours', blocked: [1] });
const tr = id => ({ id, title: 'Departure Airport Transfer with Vehicle: Minibus (Coaster or Similar)', route: 'Pickup From Abu Dhabi Hotel To Dubai Hotel', day: 2, price: 100, image: T[5], pickup: '', dropoff: '', category: 'Transfers & Airport Services' });
const P = (id, hotelName, nights, hotel, o) => ({ id, title: `${hotelName} - ${TITLE}`, nights, city: 'Abu Dhabi', theme: 'Roundtrips', stars: 5, rdt: true, desc: '', transfers: [], activities: [], ...o, hotel: { name: hotelName, ...hotel } });
const TH = { address: 'Delphine 64 Crown Road Great Yarmouth NR30 2JQ dubai Abu Dhabi India', room: 'GUEST ROOM (35 sq. meters)', meal: 'Bed & Breakfast', stars: 5, nightly: 840, image: T[4] };
const EP = { address: 'West Corniche Road, Abu Dhabi', room: 'DELUXE ROOM (48 sq. meters)', meal: 'Bed & Breakfast', stars: 5, nightly: 2800, image: T[0] };
export const PACKAGES = [
  P('p1', 'Test Hotel Abu Dhabi', 1, TH, { image: T[4], transfers: [tr('t1')], activities: [act('a1', 420)] }),
  P('p2', 'Test Hotel Abu Dhabi', 2, TH, { image: T[4], activities: [act('a2', 420)] }),
  P('p3', 'Test Hotel Abu Dhabi', 3, TH, { image: T[4], desc: 'Romantic Package: Includes a room upgrade or hot tub access, a candlelit dinner, rose petals on the bed, and a late check-out for two guests.', theme: 'Romantic', activities: [act('a3', 420)] }),
  P('p4', 'Emirates Palace Mandarin Oriental, Abu Dhabi', 2, EP, { image: T[0], activities: [act('a4', 453)] }),
  P('p5', 'Emirates Palace Mandarin Oriental, Abu Dhabi', 3, EP, { image: T[0], activities: [act('a5', 1099)] }),
  P('p6', 'Yas Island Resort', 3, { address: 'Yas Island, Abu Dhabi', room: 'FAMILY ROOM (55 sq. meters)', meal: 'Half Board', stars: 4, nightly: 900, image: T[2] }, { image: T[2], theme: 'Family', transfers: [tr('t6')], activities: [{ ...act('a6', 260), title: 'Theme park day ticket', category: 'Attractions & Theme Parks', image: T[2], blocked: [] }] }),
  P('p7', 'Qasr Al Sarab Desert Resort', 2, { address: 'Liwa Desert, Abu Dhabi Western Region', room: 'DELUXE ROOM WITH BALCONY', meal: 'Bed & Breakfast', stars: 5, nightly: 1880, image: T[1] }, { image: T[1], city: 'Al Ain', theme: 'Desert & Adventure', activities: [{ ...act('a7', 190), title: 'Evening desert safari', category: 'Desert, Adventure & Adrenaline', image: T[1], blocked: [] }] })
];
export const CITIES_TO = ['Abu Dhabi', 'Dubai'];
