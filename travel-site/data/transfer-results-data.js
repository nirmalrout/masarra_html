// Mock transfer inventory + a promise-based search that mirrors a future API call.
// Replace searchTransfers() with fetch('/api/transfers/search', { method:'POST', body: JSON.stringify(query) }) returning the same shape.
// image: [col,row] tile of assets/images/banner.jpg or null (placeholder). hours => chauffeur service. legs: journeys the vehicle is offered for.
const T = [[0, 0], [2, 0], [3, 0], [0, 2], [2, 2], [3, 2]];
const V = (id, name, price, o = {}) => ({ id, name, price, free: false, from: '22/08/2026', legs: ['out', 'ret'], desc: '', image: null, ...o });
export const VEHICLES = [
  V('v1', 'Minibus (Coaster Or Similar)', 100, { luggage: 6, pax: 12, image: T[0], desc: 'Departure Airport Transfer with Vehicle: Minibus (Coaster or Similar)' }),
  V('v2', '50 Seater', 100, { free: true, pax: 50, desc: 'Airport transfer with Vehicle: 50 Seater' }),
  V('v3', 'Toyota Previa', 200, { luggage: 5, pax: 6, image: T[1], from: '28/11/2026', desc: 'Intercity Transfer with Vehicle: Toyota Previa' }),
  V('v4', 'Minibus (Coaster Or Similar)', 284, { pax: 12, image: T[2], from: '14/05/2026', desc: 'Airport Transfer with Vehicle: Minibus (Coaster or Similar)' }),
  V('v5', 'CITROEN', 315, { free: true, luggage: 4, pax: 6, desc: 'Transfer Service citroen with AUH Airport to Auh Hotel & Vise versa Vehicle: CITROEN' }),
  V('v6', 'LAND CRUISER', 320, { luggage: 4, pax: 6, image: T[3], from: '29/11/2026', desc: 'Transfer Service Land Cruiser with dubai airport to AUH Hotel & Vise versa Vehicle: LAND CRUISER' }),
  V('v7', '12-Seater Toyota Hiace', 360, { pax: 12, image: T[4], from: '14/05/2026', desc: 'Airport Transfer with Vehicle: 12-Seater Toyota Hiace' }),
  V('v8', 'CITROEN', 400, { free: true, luggage: 4, pax: 6, image: T[5], desc: 'Transfer Service citroen with dubai Airport to Auh Hotel & Vise versa Vehicle: CITROEN' }),
  V('v9', 'LAND CRUISER', 400, { luggage: 4, pax: 6, image: T[3], from: '29/11/2026', desc: 'Transfer Service Land Cruiser with AUH Airport to Auh Hotel & Vise versa Vehicle: LAND CRUISER', legs: ['out'] }),
  V('v10', '7-Seater Toyota-KIA-Honda', 400, { pax: 1, image: T[0], desc: 'Departure Airport Transfer with Vehicle: 7-seater Toyota-KIA-Honda', legs: ['ret'] }),
  V('v11', 'Luxury Sedan (Lexus Or Similar)', 400, { hours: 5, luggage: 2, pax: 3, image: T[1], from: '28/11/2026', desc: 'Test Half Day Chauffeur Service with Vehicle: Luxury Sedan (Lexus or similar) Time: 00: 00 Duration: 05: 00 hrs' }),
  V('v12', 'Minibus (Coaster Or Similar)', 500, { hours: 6, luggage: 9, pax: 14, from: '28/11/2026', desc: 'Test Half Day Chauffeur Service with Vehicle: Minibus (Coaster or Similar) Time: 00: 00 Duration: 06: 00 hrs' }),
  V('v13', 'Toyota Previa', 600, { hours: 5, luggage: 5, pax: 6, from: '28/11/2026', desc: 'Test Half Day Chauffeur Service with Vehicle: Toyota Previa Time: 00: 00 Duration: 05: 00 hrs' }),
  V('v14', 'LAND CRUISER', 678, { free: true, hours: 8, luggage: 7, pax: 2, image: T[3], desc: 'Intercity Transfers with Land cruiser chauffeur Language: English Vehicle: LAND CRUISER Time: 00: 30 Duration: 08: 00 hrs' }),
  V('v15', '50 Seater', 700, { hours: 5, luggage: 25, pax: 45, image: T[4], from: '28/11/2026', desc: 'Test Half Day Chauffeur Service with Vehicle: 50 Seater Time: 00: 00 Duration: 05: 00 hrs' }),
  V('v16', 'Luxury Sedan (Lexus Or Similar)', 800, { hours: 10, luggage: 2, pax: 3, image: T[1], from: '28/11/2026', desc: 'Test Full Day Chauffeur Service with Vehicle: Luxury Sedan (Lexus or similar) Time: 00: 00 Duration: 10: 00 hrs' }),
  V('v17', 'Toyota Previa', 1000, { hours: 10, luggage: 5, pax: 6, from: '28/11/2026', desc: 'Test Full Day Chauffeur Service with Vehicle: Toyota Previa Time: 00: 00 Duration: 10: 00 hrs' }),
  V('v18', 'Minibus (Coaster Or Similar)', 1300, { hours: 10, luggage: 9, pax: 14, from: '28/11/2026', desc: 'Test Full Day Chauffeur Service with Vehicle: Minibus (Coaster or Similar) Time: 00: 00 Duration: 10: 00 hrs' }),
  V('v19', '50 Seater', 1800, { hours: 10, luggage: 25, pax: 45, image: T[4], from: '28/11/2026', desc: 'Test Full Day Chauffeur Service with Vehicle: 50 Seater Time: 00: 00 Duration: 10: 00 hrs' })
];
const wait = ms => new Promise(r => setTimeout(r, ms));
/** @returns {Promise<{out: object[], ret: object[]}>}  options.empty = 'out' | 'ret' simulates no availability; options.fail simulates an API error. */
export async function searchTransfers(q, { empty = null, fail = false } = {}) {
  await wait(500);
  if (fail) throw new Error('The transfer service is temporarily unavailable.');
  const chauffeur = q.mode === 'Chauffeur', round = !chauffeur && q.trip === 'Round-Trip';
  let list = VEHICLES;
  if (chauffeur) {
    list = list.filter(v => v.hours);
    const h = parseInt(q.duration) || (q.duration === 'Full Day' ? 10 : 0), fit = list.filter(v => v.hours <= h);   // services up to the requested duration
    if (fit.length) list = fit;
  }
  const pick = leg => (empty === leg ? [] : list.filter(v => v.legs.includes(leg)).map(v => ({ ...v })));
  return { out: pick('out'), ret: round ? pick('ret') : [] };
}
