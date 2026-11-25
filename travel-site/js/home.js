import { $, esc, money, tileStyle } from './utils.js';
import { createCarousel } from './carousel.js';
import { addToCart } from './cart.js';
import { heroSlides, hotels, experiences, services } from '../data/home-data.js';

const card = (item, meta, price, href) => `
  <article class="card"><div class="card-media" style="${tileStyle(item.image, 0.75)}" role="img" aria-label="${esc(item.name)}"></div>
    <div class="card-body"><h3>${esc(item.name)}</h3>${meta}<div class="card-price">${price}</div>
      <div class="card-actions"><a class="btn btn-outline" href="${href}">View Details</a><button class="btn btn-primary" type="button" data-add="${item.id}">Add</button></div></div></article>`;

const sections = [
  { mount: '#hotels-carousel', items: hotels, render: h => card(h, `<div class="card-meta">${esc(h.location)} · ★ ${h.rating}</div>`, `${money(h.price)} <small class="card-meta">/ night</small>`, 'hotels.html') },
  { mount: '#experiences-carousel', items: experiences, render: e => card(e, `<div class="card-meta">${esc(e.location)}</div>`, `${money(e.price)} <small class="card-meta">/ person</small>`, 'experiences.html') },
  { mount: '#services-carousel', items: services, render: s => card(s, `<div class="card-meta">${esc(s.description)}</div>`, money(s.price), 'packages.html') }
];

function rotateHero() {
  const box = $('#hero-text'), h1 = $('#hero-title'), p = $('#hero-desc'); let i = 0;
  setInterval(() => { box.classList.add('is-swapping');
    setTimeout(() => { i = (i + 1) % heroSlides.length; h1.textContent = heroSlides[i].title; p.textContent = heroSlides[i].text; box.classList.remove('is-swapping'); }, 400);
  }, 5000);
}
export function init() {
  sections.forEach(s => createCarousel($(s.mount), s.items, s.render));
  const all = [...hotels, ...experiences, ...services];
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const it = all.find(x => x.id === b.dataset.add); addToCart({ id: it.id, name: it.name, image: it.image, price: it.price });
  });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) rotateHero();
}
