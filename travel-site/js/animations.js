/** Fade/slide-in for elements with .reveal (adds .is-visible when scrolled into view). */
export function observeReveals(root = document) {
  const els = [...root.querySelectorAll('.reveal:not(.is-visible)')];
  if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('is-visible'));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(e => io.observe(e));
  // Safety net: never leave on-screen content hidden if the observer is slow or unsupported in a preview frame
  setTimeout(() => els.forEach(e => { const r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add('is-visible'); }), 2500);
}
