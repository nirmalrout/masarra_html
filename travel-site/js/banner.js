import { esc, tileStyle } from './utils.js';

/** Fading banner slider. slides: [{ title?, desc?, image: [col,row] | 'url' }]. searchEl is placed in the overlay slot. */
export function renderBanner(host, slides, searchEl) {
  const bg = img => Array.isArray(img) ? tileStyle(img, 0.3) : `background:url('${esc(img)}') center/cover`;
  const many = slides.length > 1;
  host.innerHTML = `<div class="banner-stage">${slides.map((s, i) => `
      <div class="banner-slide${i ? '' : ' is-active'}" aria-hidden="${i !== 0}">
        <div class="banner-bg" style="${bg(s.image)}"></div><div class="banner-shade"></div>
        ${s.title ? `<div class="container-app"><div class="banner-copy"><h1>${esc(s.title)}</h1>${s.desc ? `<p class="banner-pill">${esc(s.desc)}</p>` : ''}</div></div>` : ''}
      </div>`).join('')}
    ${many ? `<button class="banner-arrow banner-arrow--prev" type="button" data-b="-1" aria-label="Previous slide">‹</button>
      <button class="banner-arrow banner-arrow--next" type="button" data-b="1" aria-label="Next slide">›</button>
      <div class="banner-dots">${slides.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Slide ${i + 1}" class="${i ? '' : 'is-on'}"></button>`).join('')}</div>` : ''}
    </div><div class="search-wrap"><div class="container-app" data-search-slot></div></div>`;
  host.querySelector('[data-search-slot]').append(searchEl);
  if (!many) return;
  const els = [...host.querySelectorAll('.banner-slide')], dots = [...host.querySelectorAll('[data-dot]')]; let cur = 0, timer;
  const go = n => { cur = (n + els.length) % els.length;
    els.forEach((el, i) => { el.classList.toggle('is-active', i === cur); el.setAttribute('aria-hidden', i !== cur); });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === cur)); };
  const play = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(cur + 1), 6000); };
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-b]'), d = e.target.closest('[data-dot]');
    if (b) go(cur + Number(b.dataset.b)); else if (d) go(Number(d.dataset.dot)); else return; play();
  });
  host.addEventListener('mouseenter', () => clearInterval(timer)); host.addEventListener('mouseleave', play); play();
}
