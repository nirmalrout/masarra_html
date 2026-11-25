// Detail-page content. Hotels inherit `defaults`; add per-hotel overrides under `overrides[hotelId]`.
export const captions = ['Exterior view', 'Deluxe room', 'Suite bedroom', 'Meeting room', 'Banquet hall', 'Lobby', 'Swimming pool', 'Restaurant', 'Spa', 'Fitness centre', 'Lounge', 'Bathroom', 'Terrace', 'Reception', 'Night view'];
export const defaults = {
  checkIn: '14:00', checkOut: '12:00',
  about: [
    { icon: 'pin', title: 'Property Location', text: null /* falls back to hotel.desc */ },
    { icon: 'bed', title: 'Rooms', text: 'Make yourself at home in one of the 355 air-conditioned rooms featuring minibars and LCD televisions. Complimentary wireless internet access keeps you connected, and satellite programming is available for your entertainment. Private bathrooms with separate bathtubs and showers feature complimentary toiletries and bidets. Conveniences include safes and desks, and housekeeping is provided daily.' },
    { icon: 'spa', title: 'Amenities', text: 'Pamper yourself with a visit to the spa, which offers massages, body treatments, and facials. You\'re sure to appreciate the recreational amenities, including a health club, an outdoor pool, and a spa tub. This Baroque hotel also features complimentary wireless internet access, concierge services, and babysitting (surcharge).' },
    { icon: 'food', title: 'Dining', text: 'Enjoy Middle Eastern cuisine at Printania Restaurant, one of the hotel\'s 2 restaurants, or stay in and take advantage of the 24-hour room service. Snacks are also available at the coffee shop/cafe. Unwind at the end of the day with a drink at the bar/lounge or the poolside bar. Buffet breakfasts are available daily for a fee.' }
  ],
  amenities: [
    { group: 'Property', items: ['Outdoor swimming pool', 'Health club', 'Spa tub', 'Concierge services', '24-hour room service', 'Babysitting (surcharge)', 'Free Wi-Fi', 'Airport transfers on request'] },
    { group: 'In the room', items: ['Air conditioning', 'Minibar', 'LCD television', 'Satellite channels', 'In-room safe', 'Desk', 'Bathtub & separate shower', 'Bidet', 'Complimentary toiletries', 'Daily housekeeping'] },
    { group: 'Dining', items: ['Printania Restaurant (Middle Eastern)', 'Coffee shop / cafe', 'Bar / lounge', 'Poolside bar', 'Buffet breakfast (fee)'] },
    { group: 'Wellness', items: ['Massages', 'Body treatments', 'Facials', 'Fitness centre'] }
  ],
  nearby: [['Corniche Beach', '1.9 mi (3.1 km)'], ['Al Wahda Mall', '2.4 mi (3.8 km)'], ['Abu Dhabi Mall', '2.6 mi (4.2 km)'], ['Etihad Towers', '3.0 mi (4.8 km)'], ['Sheikh Zayed Grand Mosque', '9.1 mi (14.6 km)'], ['Abu Dhabi International Airport', '19.5 mi (31.4 km)']],
  roomInfo: { sizes: [32, 35, 42, 55, 70], beds: ['King bed', 'Twin beds', 'King bed', '1 King + sofa bed', '2 King beds'], views: ['City view', 'Garden view', 'Sea view', 'Pool view', 'Skyline view'] },
  policies: [
    { t: 'Check-in & check-out', p: ['Check-in from 14:00; check-out until 12:00.', 'A valid photo ID and credit card are required at check-in.', 'Early check-in and late check-out are subject to availability.'] },
    { t: 'Children & extra beds', p: ['Children aged 0–5 stay free using existing bedding.', 'Children aged 6–11 are charged the child rate when sharing with two adults.', 'Guests aged 12 and over are considered adults.', 'Extra beds are subject to availability and additional charges.'] },
    { t: 'Cancellation', p: [] /* generated from room policies */ },
    { t: 'Payments & taxes', p: ['Rates are per room per night and include applicable taxes unless stated.', 'Tourism fee / city tax is payable at the property where applicable.'] },
    { t: 'Pets & other', p: ['Pets are not allowed.', 'Smoking is permitted in designated areas only.'] }
  ],
  cancelText: {
    'Non-Refundable': 'Non-refundable: the full amount is charged on cancellation, amendment or no-show.',
    'Partial Cancellation Fees': 'Free cancellation up to 7 days before arrival; after that the first night is charged.',
    'Free Cancellation': 'Free cancellation up to 48 hours before arrival; later cancellations are charged one night.'
  }
};
export const overrides = {};
export const detailsFor = h => ({ ...defaults, ...(overrides[h.id] || {}) });
