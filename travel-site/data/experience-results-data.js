// Sample Experience & Service results. Replace with an API response of the same shape.
// image: [col,row] tile of assets/images/banner.jpg, or null (shows the placeholder illustration).
const gen = (p, n) => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);
export const POLICY_TEXT = {
  'Non Refundable': 'Non-refundable: the full amount is charged on cancellation, amendment or no-show.',
  'Free Cancellation': 'Free cancellation up to 24 hours before the activity start time.',
  'Partial Refundable': 'Free cancellation up to 72 hours before the start time; after that 50% of the price is charged.'
};
const I = (id, name, price, category, o = {}) => ({ id, name, price, category, desc: '', features: [], policy: 'Non Refundable', image: null, isNew: false, ...o });
export const TYPES = {
  experience: {
    label: 'Experience', plural: 'experiences',
    categories: ['Generic', 'Attractions & Theme Parks', 'Art & Culture', 'City Tours', 'Emirati Heritage', 'Transfers & Airport Services'],
    items: [
      I('x1', 'Transfer Bundle', 2, 'Transfers & Airport Services', { isNew: true }),
      I('x2', 'Louvre Abu Dhabi', 160, 'Art & Culture', { image: [2, 2], desc: 'The Louvre Abu Dhabi showcases artworks from various periods and cultures. Highlights Before planning your visit, please check www.louvreabudhabi.ae for the latest opening hours, exhibitions and entry guidelines. Guests are advised to arrive 15 minutes before their slot.' }),
      I('x3', 'Teamlab Phenomena Abu Dhabi General Admission', 195, 'Attractions & Theme Parks', { image: [3, 0], desc: 'GENERAL ADMISSION   Mon- Sun 10:00 - 22:00 Last Entry 20:00 Last Order 21:15   Weekdays: Tickets are valid for any time slot during opening hours. Weekends and public holidays: please select your preferred time slot at checkout.', features: ['Instant Confirmation', 'Free Cancellation'], policy: 'Partial Refundable' }),
      I('x4', 'Qasr Al Hosn & Cultural Foundation Ticket', 400, 'Emirati Heritage', { image: [0, 0], isNew: true, desc: 'Transfer Not Included   All Golf courses in the UAE require that all players hold an official handicap of 28 or less for men and 36 or less for women. Please carry valid ID on the day.' }),
      I('x5', "Glimpse Of The City's Highlights Private", 415, 'City Tours', { image: [3, 2], desc: 'Half Day Abu Dhabi City Tour   Duration: 6 hours  Program: Half Day (Morning) 4 Pax Private   Language: English-German-French-Arabic. Visit the Grand Mosque, Corniche and Heritage Village with a licensed guide.' }),
      I('x6', 'Masarra Signature - Ultimate Abu Dhabi City Tour', 600, 'City Tours', { image: [0, 0], desc: "Experience Abu Dhabi's cultural grandeur on this full-day journey. Visit Qasr Al Watan, the majestic Sheikh Zayed Grand Mosque and the Louvre, with lunch included and private air-conditioned transport.", features: ['booking today', 'sunday booking', 'Test1', 'fgfhf', 'Instant Confirmation', 'red', 'black', 'new', 'old', 'green flag', 'car', 'driver', 'Instant', 'test5', 'rat race', 'gold', 'golf', 'blue', 'white', 'gray'] }),
      I('x7', 'Chauffer Full Day', 800, 'Transfers & Airport Services', { image: [2, 0], features: gen('Test', 20) }),
      I('x8', 'Chauffeur Night Services', 800, 'Transfers & Airport Services'),
      I('x9', 'Emirati Food Experience', 1200, 'Emirati Heritage', { desc: 'Enjoy a cozy and delicious food experience at a traditional café. In this 2-hour, you\'ll taste local dishes like machbous, harees, or luqaimat while a host explains Emirati hospitality and customs.' })
    ]
  },
  service: {
    label: 'Service', plural: 'services',
    categories: ['Airport Services', 'Chauffeur', 'Lounge Access', 'Yachts & Boats'],
    items: [
      I('s1', 'Airport Meet & Greet', 150, 'Airport Services', { image: [3, 2], desc: 'Fast-track meet and greet on arrival with luggage assistance and a private transfer to your hotel.', features: ['Instant Confirmation'], policy: 'Free Cancellation' }),
      I('s2', 'Private Chauffeur - Half Day', 450, 'Chauffeur', { image: [0, 0], desc: 'Four hours with a professional chauffeur in a luxury sedan, ideal for meetings or short city trips.', policy: 'Partial Refundable' }),
      I('s3', 'Yas Lounge Access', 220, 'Lounge Access', { image: [2, 0], isNew: true, desc: 'Relax before your flight with buffet food, drinks, Wi-Fi and comfortable seating in the lounge.', features: ['Instant Confirmation', 'Free Wi-Fi'] }),
      I('s4', 'Sunset Yacht Charter', 2400, 'Yachts & Boats', { image: [2, 2], desc: 'Two-hour private yacht charter along the Abu Dhabi coastline with soft drinks and light snacks.', policy: 'Partial Refundable' }),
      I('s5', 'Airport Transfer - Sedan', 120, 'Airport Services', { features: ['Instant Confirmation', 'Free Cancellation'], policy: 'Free Cancellation' })
    ]
  }
};
