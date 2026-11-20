// Placeholder images are tiles of assets/images/banner.jpg ([col,row]). Replace `image` with a URL string per item when real photos exist
// (cards use tile crops via tileStyle; swap js/listing-page.js card() to use background:url() for string images).
const TILES = [[0, 0], [2, 0], [3, 0], [0, 2], [2, 2], [3, 2]];
export const makeItems = (prefix, rows, { price = 300, off = 0 } = {}) =>
  rows.map(([name, location, rating], i) => ({ id: `${prefix}${i + 1}`, name, location, rating, price: price + i * 40, image: TILES[(i + off) % 6] }));
const D = '2026-11-27';
export { D };
