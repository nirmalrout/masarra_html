import { $, esc, money, tileStyle } from './utils.js';
import { getState, setState, subscribe } from './state.js';

let openedAt = 0; // ignore the click that triggered an add (it would otherwise count as an 'outside click')
export function addToCart(item, { open = true } = {}) {
  openedAt = performance.now();
  const cart = getState().cart.map(i => ({ ...i })), found = cart.find(i => i.id === item.id);
  found ? found.qty++ : cart.push({ qty: 1, date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), ...item });
  setState({ cart, cartOpen: open ? true : getState().cartOpen, activePopover: null });
}
const update = (id, fn) => setState({ cart: getState().cart.map(i => i.id === id ? fn(i) : i).filter(i => i.qty > 0) });

function render() {
  const { cart, cartOpen } = getState(), drawer = $('[data-cart-drawer]');
  drawer.classList.toggle('is-open', cartOpen); $('[data-cart-overlay]').classList.toggle('is-open', cartOpen);
  drawer.setAttribute('aria-hidden', !cartOpen); document.body.classList.toggle('no-scroll', cartOpen);
  $('[data-cart-total-items]').textContent = cart.reduce((s, i) => s + i.qty, 0);
  // $('[data-cart-empty]').hidden = cart.length > 0; $('[data-cart-foot]').hidden = cart.length === 0;
  // $('[data-cart-subtotal]').textContent = money(cart.reduce((s, i) => s + i.price * i.qty, 0));
  // $('[data-cart-items]').innerHTML = cart.map(i => `
  //   <div class="cart-item"><div class="thumb" style="${tileStyle(i.image)}"></div>
  //     <div><strong style="font-size:var(--fs-sm)">${esc(i.name)}</strong><div class="card-meta">Date: ${esc(i.date)}</div>
  //       <div class="qty"><button type="button" data-cart-qty="-1" data-id="${i.id}" aria-label="Decrease">−</button><span>${i.qty}</span><button type="button" data-cart-qty="1" data-id="${i.id}" aria-label="Increase">+</button></div></div>
  //     <div style="text-align:end"><strong style="font-size:var(--fs-sm)">${money(i.price * i.qty)}</strong><br>
  //       <button class="link-btn" type="button" data-cart-remove="${i.id}" style="color:var(--color-danger);margin-top:.5rem">Remove</button></div></div>`).join('');
}

export function initCart() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cart-toggle]')) return setState({ cartOpen: !getState().cartOpen, activePopover: null });
    const qty = e.target.closest('[data-cart-qty]'); if (qty) return update(qty.dataset.id, i => ({ ...i, qty: i.qty + Number(qty.dataset.cartQty) }));
    const rm = e.target.closest('[data-cart-remove]'); if (rm) return update(rm.dataset.cartRemove, i => ({ ...i, qty: 0 }));
    if (e.target.closest('[data-add]') || performance.now() - openedAt < 150) return; // add-to-cart actions open the drawer themselves
    if (getState().cartOpen && (e.target.closest('[data-cart-close]') || !e.target.closest('[data-cart-drawer]'))) setState({ cartOpen: false });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && getState().cartOpen) setState({ cartOpen: false }); });
  subscribe(render); render();
}
