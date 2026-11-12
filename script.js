// ============================================================
// CONFIG — FORMSPREE ENDPOINT
// ============================================================
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/moeepbez';

// ============================================================
// MENU DATA
// ============================================================
let MENU = LK.getMenu();

// ============================================================
// STATE
// ============================================================
const CART_KEY = 'letskape_cart';
let cart = loadCart();
let currentStatusOrder = null;

function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch { return {}; }
}
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function cartCount() { return Object.values(cart).reduce((s, q) => s + q, 0); }
function cartSubtotal() {
    return Object.entries(cart).reduce((s, [id, q]) => {
        const item = MENU.find(m => m.id === id);
        return s + (item ? item.price * q : 0);
    }, 0);
}
function findItem(id) { return MENU.find(m => m.id === id); }
function peso(n) { return '₱' + n.toLocaleString(); }

// ============================================================
// TIME HELPERS
// ============================================================
function populatePickupTimes() {
    const select = document.getElementById('order-time');
    select.innerHTML = '';
    const [open, close] = LK.hoursFor().map(hm => { const [h, m] = hm.split(':'); const d = new Date(); d.setHours(+h, +m, 0, 0); return d; });
    const start = new Date(Date.now() + 3 * 60 * 1000);          // earliest: 3 minutes from now
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0); // 30-minute slots
    let count = 0;
    for (let t = new Date(Math.max(start, open)); t <= close; t = new Date(t.getTime() + 30 * 60 * 1000)) {
        const option = document.createElement('option');
        option.value = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
        option.textContent = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        select.appendChild(option);
        count++;
    }
    return count;
}

// ============================================================
// RENDER MENU — brutalist cards, mobile horizontal / desktop grid
// ============================================================
function renderMenu() {
    const fallbackImg = "this.onerror=null; this.src='https://placehold.co/400x400/e7ded6/5D4037?text=Item';";

    const buildCard = (item, mobile) => {
        const card = document.createElement('div');
        card.className = 'menu-card brut-border bg-coffee-50 flex flex-col overflow-hidden' + (mobile ? ' w-[260px]' : '');
        card.innerHTML = `
            <div class="relative overflow-hidden bg-coffee-100 border-b-2 border-coffee-900 aspect-[4/3]">
                <img src="${LK.esc(item.img)}" alt="${LK.esc(item.name)}" onerror="${fallbackImg}" class="menu-card-img w-full h-full object-cover">
            </div>
            <div class="p-4 flex-1 flex flex-col">
                <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="font-display text-base leading-tight text-coffee-900">${LK.esc(item.name)}</h4>
                    <span class="font-mono text-xs font-bold text-coffee-900 whitespace-nowrap">${peso(item.price)}</span>
                </div>
                <p class="text-[11px] text-coffee-600 leading-snug mb-4 flex-1">${LK.esc(item.desc)}</p>
                ${item.soldOut
                    ? '<button type="button" disabled class="w-full bg-coffee-200 text-coffee-500 font-mono text-[10px] uppercase tracking-widest font-bold py-2.5 border-2 border-coffee-300 cursor-not-allowed">Sold out</button>'
                    : `<button type="button" data-add="${item.id}" class="w-full bg-coffee-900 hover:bg-accent text-coffee-50 hover:text-coffee-900 font-mono text-[10px] uppercase tracking-widest font-bold py-2.5 border-2 border-coffee-900 flex items-center justify-center gap-1.5 transition-colors" aria-label="Add ${LK.esc(item.name)} to cart">Add <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></button>`}
            </div>
        `;
        return card;
    };

    const coffeeDesktop = document.getElementById('coffee-grid-desktop');
    const coffeeMobile = document.getElementById('coffee-grid-mobile');
    const pastryDesktop = document.getElementById('pastry-grid-desktop');
    const pastryMobile = document.getElementById('pastry-grid-mobile');

    coffeeDesktop.innerHTML = '';
    coffeeMobile.innerHTML = '';
    pastryDesktop.innerHTML = '';
    pastryMobile.innerHTML = '';

    MENU.forEach(item => {
        const isCoffee = item.category === 'coffee';
        if (isCoffee) {
            coffeeDesktop.appendChild(buildCard(item, false));
            coffeeMobile.appendChild(buildCard(item, true));
        } else {
            pastryDesktop.appendChild(buildCard(item, false));
            pastryMobile.appendChild(buildCard(item, true));
        }
    });

    document.querySelectorAll('[data-add]').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.dataset.add));
    });
}

// ============================================================
// CART OPERATIONS
// ============================================================
function addToCart(id) {
    const it = findItem(id);
    if (!it || it.soldOut) { showToast('Sorry, that item is sold out', true); return; }
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    updateCartUI();
    showToast(`${findItem(id).name} added`);
    const badge = document.getElementById('cart-badge');
    badge.classList.remove('cart-pulse');
    void badge.offsetWidth;
    badge.classList.add('cart-pulse');
}
function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const count = cartCount();
    const badge = document.getElementById('cart-badge');
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);

    const itemsEl = document.getElementById('cart-items');
    itemsEl.innerHTML = '';

    const fallbackImg = "this.onerror=null; this.src='https://placehold.co/100x100/e7ded6/5D4037?text=Item';";

    const entries = Object.entries(cart);
    if (entries.length === 0) {
        itemsEl.innerHTML = `
            <div class="text-center text-coffee-500 py-16 h-full flex flex-col justify-center items-center">
                <div class="w-16 h-16 bg-coffee-100 border-2 border-coffee-900 flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-coffee-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9"/></svg>
                </div>
                <p class="font-display text-xl text-coffee-900 mb-1">Empty.</p>
                <p class="font-mono text-[10px] uppercase tracking-widest text-coffee-500">Add some kape or kakanin</p>
            </div>
        `;
    } else {
        entries.forEach(([id, qty]) => {
            const item = findItem(id);
            if (!item) return;
            const row = document.createElement('div');
            row.className = 'flex items-center gap-3 bg-coffee-50 brut-border p-2.5';
            row.innerHTML = `
                <div class="w-14 h-14 brut-border overflow-hidden flex-shrink-0 bg-coffee-100">
                    <img src="${LK.esc(item.img)}" onerror="${fallbackImg}" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-display text-sm text-coffee-900 truncate leading-tight">${LK.esc(item.name)}</h4>
                    <p class="font-mono text-xs font-bold text-accent mt-0.5">${peso(item.price * qty)}</p>
                </div>
                <div class="flex items-center border-2 border-coffee-900 flex-shrink-0">
                    <button type="button" data-qty="${id}" data-delta="-1" class="w-7 h-7 flex items-center justify-center text-coffee-900 hover:bg-coffee-900 hover:text-coffee-50 transition-colors font-mono font-bold" aria-label="Decrease">−</button>
                    <span class="w-7 text-center font-mono text-xs font-bold border-x-2 border-coffee-900">${qty}</span>
                    <button type="button" data-qty="${id}" data-delta="1" class="w-7 h-7 flex items-center justify-center text-coffee-900 hover:bg-coffee-900 hover:text-coffee-50 transition-colors font-mono font-bold" aria-label="Increase">+</button>
                </div>
            `;
            itemsEl.appendChild(row);
        });
    }
    document.querySelectorAll('[data-qty]').forEach(btn => {
        btn.addEventListener('click', () => changeQty(btn.dataset.qty, parseInt(btn.dataset.delta)));
    });
    document.getElementById('cart-subtotal').textContent = peso(cartSubtotal());
    document.getElementById('checkout-btn').disabled = entries.length === 0 || !LK.getSettings().accepting;
}

// ============================================================
// DRAWER + MODALS
// ============================================================
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const checkoutModal = document.getElementById('checkout-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const statusModal = document.getElementById('status-modal');

function openCart() {
    cartDrawer.classList.remove('drawer-hidden');
    cartBackdrop.classList.remove('opacity-0', 'pointer-events-none');
    cartBackdrop.classList.add('opacity-100');
    document.body.classList.add('no-scroll');
}
function closeCart() {
    cartDrawer.classList.add('drawer-hidden');
    cartBackdrop.classList.add('opacity-0', 'pointer-events-none');
    cartBackdrop.classList.remove('opacity-100');
    document.body.classList.remove('no-scroll');
}
function openCheckout() {
    if (!LK.getSettings().accepting) { showToast('Orders are paused right now', true); return; }
    MENU = LK.getMenu();
    const gone = Object.keys(cart).filter(id => !findItem(id) || findItem(id).soldOut);
    if (gone.length) { gone.forEach(id => delete cart[id]); saveCart(); updateCartUI(); showToast('Some items just sold out and were removed', true); }
    if (cartCount() === 0) return;
    renderCheckoutSummary();
    if (!populatePickupTimes()) { showToast('No pickup slots left today. See you tomorrow!', true); return; }
    document.getElementById('order-payment').value = 'GCash';
    document.getElementById('order-reference').value = '';
    document.querySelectorAll('#order-form .error-msg').forEach(el => el.classList.add('hidden'));
    updatePaymentUI();
    checkoutModal.classList.remove('hidden-modal');
    document.body.classList.add('no-scroll');
}
function closeCheckout() {
    checkoutModal.classList.add('hidden-modal');
    document.body.classList.remove('no-scroll');
}
function closeConfirmation() {
    confirmationModal.classList.add('hidden-modal');
    document.body.classList.remove('no-scroll');
}
function openStatus() {
    statusModal.classList.remove('hidden-modal');
    document.body.classList.add('no-scroll');
}
function closeStatus() {
    statusModal.classList.add('hidden-modal');
    document.body.classList.remove('no-scroll');
}

// ============================================================
// CHECKOUT SUMMARY + PAYMENT UI
// ============================================================
function renderCheckoutSummary() {
    const ul = document.getElementById('checkout-summary');
    ul.innerHTML = '';
    Object.entries(cart).forEach(([id, qty]) => {
        const item = findItem(id);
        if (!item) return;
        const li = document.createElement('li');
        li.className = 'flex justify-between';
        li.innerHTML = `<span>${qty}× ${LK.esc(item.name)}</span><span class="font-semibold text-coffee-900">${peso(item.price * qty)}</span>`;
        ul.appendChild(li);
    });
    const total = cartSubtotal();
    document.getElementById('checkout-total').textContent = peso(total);
    document.getElementById('payment-amount').textContent = peso(total);
    updatePaymentUI();
}

function updatePaymentUI() {
    const method = document.getElementById('order-payment').value;
    const isCash = method === 'Cash on Pickup';
    const instructions = document.getElementById('payment-instructions');
    const refField = document.getElementById('reference-field');
    const refInput = document.getElementById('order-reference');

    if (isCash) {
        instructions.classList.add('hidden');
        refField.classList.add('hidden');
        refInput.required = false;
        refInput.value = '';
    } else {
        instructions.classList.remove('hidden');
        refField.classList.remove('hidden');
        refInput.required = true;
        const label = method === 'GCash' ? 'GCash:' : 'Maya:';
        const account = LK.getSettings()[method === 'GCash' ? 'gcash' : 'maya'];
        document.getElementById('payment-method-label').textContent = method;
        document.getElementById('payment-account-label').textContent = label;
        document.getElementById('payment-account').textContent = account;
    }
}

// ============================================================
// PLACE ORDER
// ============================================================
document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!LK.getSettings().accepting) { showToast('Orders are paused right now', true); return; }
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const time = document.getElementById('order-time').value;
    const payment = document.getElementById('order-payment').value;
    const reference = document.getElementById('order-reference').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    const email = document.getElementById('order-email').value.trim();

    document.querySelectorAll('#order-form .error-msg').forEach(el => el.classList.add('hidden'));
    let ok = true;
    if (!name) ok = false;
    if (!phone) ok = false;
    if (!time) ok = false;
    if (payment !== 'Cash on Pickup') {
        if (!reference || !/^[A-Za-z0-9\s-]{6,30}$/.test(reference)) {
            document.querySelector('.error-msg[data-for="order-reference"]').classList.remove('hidden');
            ok = false;
        }
    }
    if (!ok) return;

    const orderNumber = LK.newOrderNumber();
    const total = cartSubtotal();
    const items = Object.entries(cart).map(([id, qty]) => {
        const it = findItem(id);
        return { name: it.name, price: it.price, qty, subtotal: it.price * qty };
    });
    const paymentStatus = payment === 'Cash on Pickup' ? 'pending_pickup' : 'pending_verification';

    const order = {
        orderNumber, name, phone, email, time, payment, reference, notes, total, items,
        status: paymentStatus,
        createdAt: new Date().toISOString()
    };

    const summaryText = items.map(i => `${i.qty}× ${i.name} = ₱${i.subtotal}`).join('\n');

    const payload = {
        subject: `New Order ${orderNumber} — ${paymentStatus === 'pending_verification' ? 'VERIFY PAYMENT' : 'Cash on Pickup'} from Let's KAPE`,
        order_number: orderNumber,
        customer_name: name,
        customer_phone: phone,
        ...(email && { email, customer_email: email }),
        dashboard_link: new URL('admin.html', location.href).href + '#import=' + LK.encodeOrder(order),
        pickup_time: time,
        payment_method: payment,
        payment_status: paymentStatus,
        reference_number: reference || '(cash on pickup)',
        notes: notes || '(none)',
        items: summaryText,
        total: `₱${total}`,
        received_at: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    };

    // The email is how the café receives the order, so only confirm once it has really been sent.
    const sendBtn = document.querySelector('#order-form button[type="submit"]');
    if (sendBtn) sendBtn.disabled = true;
    try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('send failed');
    } catch {
        showToast('Order not sent. Check your connection and try again.', true);
        return;
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
    LK.saveOrders([...LK.getOrders(), order]);
    try { localStorage.setItem('letskape_last_order', orderNumber); } catch {}

    closeCheckout();
    showConfirmation(order);
    cart = {};
    saveCart();
    updateCartUI();
});

function showConfirmation(order) {
    document.getElementById('confirm-order-number').textContent = order.orderNumber;

    const [h, m] = order.time.split(':');
    const dateObj = new Date();
    dateObj.setHours(h, m);
    document.getElementById('confirm-time').textContent = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('confirm-payment').textContent = order.payment;
    document.getElementById('confirm-total').textContent = peso(order.total);

    const refRow = document.getElementById('confirm-reference-row');
    if (order.payment === 'Cash on Pickup') {
        refRow.classList.add('hidden');
    } else {
        refRow.classList.remove('hidden');
        document.getElementById('confirm-reference').textContent = order.reference || '—';
    }

    const ul = document.getElementById('confirm-items');
    ul.innerHTML = '';
    order.items.forEach(it => {
        const li = document.createElement('li');
        li.className = 'flex justify-between';
        li.innerHTML = `<span>${it.qty}× ${LK.esc(it.name)}</span><span class="font-semibold">${peso(it.subtotal)}</span>`;
        ul.appendChild(li);
    });

    confirmationModal.classList.remove('hidden-modal');
    document.body.classList.add('no-scroll');
}

// ============================================================
// STATUS CHECKER (read-only; staff change statuses in admin.html)
// ============================================================
const STEPS = ['confirmed', 'preparing', 'ready', 'completed'];
function renderStatus(order) {
    currentStatusOrder = order;
    const s = LK.STATUS[order.status] || LK.STATUS.pending_verification;
    const [h, m] = order.time.split(':');
    const d = new Date(); d.setHours(h, m);
    const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const idx = STEPS.indexOf(order.status);
    const steps = order.status === 'rejected'
        ? '<p class="text-sm text-red-800 mb-4">We could not match your payment. Please message or call us with your receipt.</p>'
        : `<div class="grid grid-cols-4 gap-1 mb-4">${['Confirmed', 'Preparing', 'Ready', 'Picked up'].map((l, i) =>
            `<div class="border-2 border-coffee-900 text-center py-1.5 font-mono text-[9px] uppercase font-bold ${i <= idx ? 'bg-accent' : 'bg-coffee-50 text-coffee-400'}">${l}</div>`).join('')}</div>`;
    document.getElementById('status-result').innerHTML = `
        <div class="bg-coffee-100 brut-border p-5 mb-4">
            <span class="inline-block ${s.color} border-2 text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-widest mb-3">${s.label}</span>
            ${steps}
            <p class="font-mono text-[10px] uppercase tracking-widest font-bold text-coffee-500 mb-1">Order</p>
            <p class="font-mono text-lg font-bold text-coffee-900 mb-4">${LK.esc(order.orderNumber)}</p>
            <p class="text-xs text-coffee-600 mb-3">This is your order as it was sent. We will text or email you once it is confirmed and when it is ready.</p>
            <div class="text-sm text-coffee-700 space-y-1">
                <p><strong>Name:</strong> ${LK.esc(order.name)}</p>
                <p><strong>Pickup:</strong> ${t}</p>
                <p><strong>Payment:</strong> ${LK.esc(order.payment)}${order.reference ? ' · ' + LK.esc(order.reference) : ''}</p>
                <p class="pt-2 mt-2 border-t-2 border-coffee-900"><strong>Total:</strong> ${peso(order.total)}</p>
            </div>
        </div>`;
}
function checkStatus() {
    const q = document.getElementById('status-input').value.trim().toUpperCase();
    const found = LK.getOrders().find(o => o.orderNumber.toUpperCase() === q);
    if (found) { renderStatus(found); return; }
    currentStatusOrder = null;
    document.getElementById('status-result').innerHTML = `<div class="bg-red-50 border-2 border-red-800 p-4 text-sm text-red-800 text-center font-mono">No order found on this device. Check the number, or ask us at the stall.</div>`;
}
document.getElementById('status-check').addEventListener('click', checkStatus);
document.getElementById('status-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkStatus(); });

// ============================================================
// SETTINGS FROM THE CAFÉ + LIVE SYNC
// ============================================================
function applySettings() {
    const s = LK.getSettings(), fmt = h => LK.t12(h[0]) + ' – ' + LK.t12(h[1]);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('hero-hours', LK.t12(LK.hoursFor()[0]) + '–' + LK.t12(LK.hoursFor()[1]));
    set('hours-weekday', fmt(s.weekday));
    set('hours-weekend', fmt(s.weekend));
    document.getElementById('cart-notice').classList.toggle('hidden', s.accepting);
    document.getElementById('checkout-btn').disabled = cartCount() === 0 || !s.accepting;
}
LK.onChange(key => {
    if (key === LK.K.menu) { MENU = LK.getMenu(); renderMenu(); updateCartUI(); }
    if (key === LK.K.settings) { applySettings(); updatePaymentUI(); }
    if (key === LK.K.orders && currentStatusOrder) {
        const fresh = LK.getOrders().find(o => o.orderNumber === currentStatusOrder.orderNumber);
        if (fresh) renderStatus(fresh);
    }
});

// ============================================================
// TOAST
// ============================================================
const messageBox = document.getElementById('message-box');
const messageTxt = document.getElementById('message-box-text');
let toastTimer;
function showToast(text, isError = false) {
    messageTxt.textContent = text;
    const icon = messageBox.querySelector('svg');
    icon.classList.toggle('text-red-700', isError);
    icon.classList.toggle('text-green-700', !isError);
    messageBox.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
    messageBox.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        messageBox.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
        messageBox.classList.remove('opacity-100', 'translate-y-0');
    }, 3500);
}

// ============================================================
// MOBILE MENU + HEADER
// ============================================================
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');
const iconOpen = document.getElementById('icon-open');
const iconClose = document.getElementById('icon-close');

function setMenuOpen(open) {
    menu.classList.toggle('hidden', !open);
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
}
btn.addEventListener('click', () => setMenuOpen(menu.classList.contains('hidden')));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)));

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!statusModal.classList.contains('hidden-modal')) { closeStatus(); return; }
        if (!confirmationModal.classList.contains('hidden-modal')) { closeConfirmation(); return; }
        if (!checkoutModal.classList.contains('hidden-modal')) { closeCheckout(); return; }
        if (!cartDrawer.classList.contains('drawer-hidden')) { closeCart(); return; }
        if (!menu.classList.contains('hidden')) { setMenuOpen(false); btn.focus(); }
    }
});

const header = document.getElementById('site-header');
const headerInner = document.getElementById('header-inner');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 20;
    headerInner.classList.toggle('h-16', scrolled);
    headerInner.classList.toggle('h-20', !scrolled);
}, { passive: true });

// ============================================================
// EVENT WIRING
// ============================================================
document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

document.getElementById('checkout-btn').addEventListener('click', () => {
    closeCart();
    openCheckout();
});

document.getElementById('checkout-close').addEventListener('click', closeCheckout);
document.getElementById('confirmation-close').addEventListener('click', () => {
    closeConfirmation();
    window.location.hash = '#menu';
});
checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) closeCheckout(); });
document.getElementById('status-link').addEventListener('click', () => {
    openStatus();
    let last = ''; try { last = localStorage.getItem('letskape_last_order') || ''; } catch {}
    if (last && !document.getElementById('status-input').value) { document.getElementById('status-input').value = last; checkStatus(); }
});
document.getElementById('status-close').addEventListener('click', closeStatus);
statusModal.addEventListener('click', (e) => { if (e.target === statusModal) closeStatus(); });
document.getElementById('order-payment').addEventListener('change', updatePaymentUI);

// ============================================================
// CONTACT FORM (Formspree)
// ============================================================
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const inquiry = document.getElementById('inquiry').value;
    const message = document.getElementById('message').value.trim();

    document.querySelectorAll('#contact-form .error-msg').forEach(el => el.classList.add('hidden'));
    let valid = true;
    if (!name) { document.querySelector('.error-msg[data-for="name"]').classList.remove('hidden'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.querySelector('.error-msg[data-for="email"]').classList.remove('hidden'); valid = false; }
    if (!message) { document.querySelector('.error-msg[data-for="message"]').classList.remove('hidden'); valid = false; }
    if (!valid) return;

    const btn2 = document.getElementById('submit-btn');
    btn2.disabled = true;
    document.getElementById('submit-label').textContent = 'Ipinapadala…';
    document.getElementById('submit-spinner').classList.remove('hidden');
    document.getElementById('submit-arrow').classList.add('hidden');
    try {
        const formData = new FormData();
        formData.append('subject', `New Message [${inquiry}] from Let's KAPE`);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone || 'Not provided');
        formData.append('inquiry_type', inquiry);
        formData.append('message', message);

        const res = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
            contactForm.reset();
            showToast('Salamat! Message sent');
        } else {
            const data = await res.json().catch(() => ({}));
            showToast('Something went wrong. Try again.', true);
            console.error(data);
        }
    } catch (err) {
        showToast('Network error. Try again.', true);
    } finally {
        btn2.disabled = false;
        document.getElementById('submit-label').textContent = 'Ipadala →';
        document.getElementById('submit-spinner').classList.add('hidden');
        document.getElementById('submit-arrow').classList.remove('hidden');
    }
});

// ============================================================
// INIT
// ============================================================
renderMenu();
updateCartUI();
applySettings();
