/** Reusable carousel: createCarousel(root, items, (item, i) => html, { className }). Arrows, snap, mouse-drag, edge-aware controls. */
export function createCarousel(root, items, renderCard, { className = '' } = {}) {
  root.className = `carousel ${className}`.trim();
  root.innerHTML = `<div class="carousel__track" tabindex="0">${items.map(renderCard).join('')}</div>
    <button class="carousel__btn carousel__btn--prev" type="button" data-dir="-1" aria-label="Previous">‹</button>
    <button class="carousel__btn carousel__btn--next" type="button" data-dir="1" aria-label="Next">›</button>`;
  const track = root.querySelector('.carousel__track'), prev = root.querySelector('[data-dir="-1"]'), next = root.querySelector('[data-dir="1"]');
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.classList.toggle('is-off', track.scrollLeft <= 2); next.classList.toggle('is-off', track.scrollLeft >= max);
  };
  track.addEventListener('scroll', update, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(track); update();
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-dir]');
    if (b) track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.85, behavior: 'smooth' });
  });
  // mouse drag (touch uses native scrolling)
  let down = false, moved = false, sx = 0, sl = 0;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button,a,input')) return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
  track.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); track.setPointerCapture(e.pointerId); }
    if (moved) track.scrollLeft = sl - dx;
  });
  const end = () => { down = false; track.classList.remove('is-dragging'); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  return { track, update };
}
