// ============================================================
// CONFIG — FORMSPREE ENDPOINT
// ============================================================
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/moeepbez';

// ============================================================
// MENU DATA
// ============================================================
const MENU = [
    { id: 'k1', category: 'coffee', name: 'Kapeng Barako', price: 120, desc: 'Strong, bold, and distinctively Batangas.', img: 'https://i.imgur.com/vjhaus4.jpeg' },
    { id: 'k2', category: 'coffee', name: 'Ube Latte', price: 180, desc: 'Espresso, steamed milk, and sweet local ube halaya.', img: 'https://i.imgur.com/xgskEXv.jpeg' },
    { id: 'k3', category: 'coffee', name: 'Sagada Pour Over', price: 150, desc: 'Single-origin Arabica, smooth with bittersweet hints.', img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'k4', category: 'coffee', name: 'Iced Spanish Latte', price: 170, desc: 'Sweetened with condensed milk, a local crowd favorite.', img: 'https://i.imgur.com/UOmPmNP.jpeg' },
    { id: 'p1', category: 'pastry', name: 'Bibingka', price: 130, desc: 'Classic rice cake topped with salted egg and cheese.', img: 'https://images.unsplash.com/photo-1659504706718-39e049784635?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'p2', category: 'pastry', name: 'Calamansi Muffin', price: 95, desc: 'Tangy, sweet, and baked fresh every morning.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'p3', category: 'pastry', name: 'Ensaymada', price: 110, desc: 'Soft bread smothered in butter, sugar, and queso de bola.', img: 'https://images.unsplash.com/photo-1688084436286-8f0ca14e9390?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'p4', category: 'pastry', name: 'Pandesal at Kesong Puti', price: 85, desc: 'Warm pandesal served with creamy local white cheese.', img: 'https://images.unsplash.com/photo-1790995504729-921c40267b38?auto=format&fit=crop&q=80&w=200&h=200' }
];

// ============================================================
// STATE
// ============================================================
const CART_KEY = 'letskape_cart';
const ORDERS_KEY = 'letskape_orders';
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
    const startTime = new Date(Date.now() + 3 * 60 * 1000);
    const minutes = startTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    startTime.setMinutes(roundedMinutes, 0, 0);

    for (let i = 0; i < 12; i++) {
        const slotTime = new Date(startTime.getTime() + i * 30 * 60 * 1000);
        const displayTime = slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const valueTime = String(slotTime.getHours()).padStart(2, '0') + ':' + String(slotTime.getMinutes()).padStart(2, '0');
        const option = document.createElement('option');
        option.value = valueTime;
        option.textContent = displayTime;
        select.appendChild(option);
    }
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
                <img src="${item.img}" alt="${item.name}" onerror="${fallbackImg}" class="menu-card-img w-full h-full object-cover">
            </div>
            <div class="p-4 flex-1 flex flex-col">
                <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="font-display text-base leading-tight text-coffee-900">${item.name}</h4>
                    <span class="font-mono text-xs font-bold text-coffee-900 whitespace-nowrap">${peso(item.price)}</span>
                </div>
                <p class="text-[11px] text-coffee-600 leading-snug mb-4 flex-1">${item.desc}</p>
                <button type="button" data-add="${item.id}" class="w-full bg-coffee-900 hover:bg-accent text-coffee-50 hover:text-coffee-900 font-mono text-[10px] uppercase tracking-widest font-bold py-2.5 border-2 border-coffee-900 flex items-center justify-center gap-1.5 transition-colors" aria-label="Add ${item.name} to cart">
                    Add
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                </button>
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
                    <img src="${item.img}" onerror="${fallbackImg}" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-display text-sm text-coffee-900 truncate leading-tight">${item.name}</h4>
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
    document.getElementById('checkout-btn').disabled = entries.length === 0;
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
    if (cartCount() === 0) return;
    renderCheckoutSummary();
    populatePickupTimes();
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
        li.innerHTML = `<span>${qty}× ${item.name}</span><span class="font-semibold text-coffee-900">${peso(item.price * qty)}</span>`;
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
        const account = '0912 345 6789';
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
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const time = document.getElementById('order-time').value;
    const payment = document.getElementById('order-payment').value;
    const reference = document.getElementById('order-reference').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    document.querySelectorAll('#order-form .error-msg').forEach(el => el.classList.add('hidden'));
    let ok = true;
    if (!name) ok = false;
    if (!phone) ok = false;
    if (!time) ok = false;
    if (payment !== 'Cash on Pickup') {
        if (!reference || !/^[\d\s-]+$/.test(reference)) {
            document.querySelector('.error-msg[data-for="order-reference"]').classList.remove('hidden');
            ok = false;
        }
    }
    if (!ok) return;

    const orderNumber = 'LK-' + new Date().getFullYear() + '-' +
        String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    const total = cartSubtotal();
    const items = Object.entries(cart).map(([id, qty]) => {
        const it = findItem(id);
        return { name: it.name, price: it.price, qty, subtotal: it.price * qty };
    });
    const paymentStatus = payment === 'Cash on Pickup' ? 'pending_pickup' : 'pending_verification';

    const order = {
        orderNumber, name, phone, time, payment, reference, notes, total, items,
        status: paymentStatus,
        createdAt: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    const summaryText = items.map(i => `${i.qty}× ${i.name} = ₱${i.subtotal}`).join('\n');

    const payload = {
        subject: `New Order ${orderNumber} — ${paymentStatus === 'pending_verification' ? 'VERIFY PAYMENT' : 'Cash on Pickup'} from Let's KAPE`,
        order_number: orderNumber,
        customer_name: name,
        customer_phone: phone,
        pickup_time: time,
        payment_method: payment,
        payment_status: paymentStatus,
        reference_number: reference || '(cash on pickup)',
        notes: notes || '(none)',
        items: summaryText,
        total: `₱${total}`,
        received_at: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    };

    fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(() => {});

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
        li.innerHTML = `<span>${it.qty}× ${it.name}</span><span class="font-semibold">${peso(it.subtotal)}</span>`;
        ul.appendChild(li);
    });

    confirmationModal.classList.remove('hidden-modal');
    document.body.classList.add('no-scroll');
}

// ============================================================
// STATUS CHECKER
// ============================================================
function renderStatus(order) {
    currentStatusOrder = order;
    const statusMap = {
        pending_verification: { label: 'Pending Payment Verification', color: 'bg-yellow-100 text-yellow-800 border-yellow-800' },
        pending_pickup:       { label: 'Pending Pickup (Cash)',         color: 'bg-yellow-100 text-yellow-800 border-yellow-800' },
        confirmed:            { label: 'Payment Confirmed',             color: 'bg-green-100 text-green-800 border-green-800' },
        preparing:            { label: 'Preparing',                      color: 'bg-blue-100 text-blue-800 border-blue-800' },
        ready:                { label: 'Ready for Pickup',              color: 'bg-purple-100 text-purple-800 border-purple-800' },
        completed:            { label: 'Completed',                      color: 'bg-coffee-100 text-coffee-800 border-coffee-800' },
        rejected:             { label: 'Payment Not Found',              color: 'bg-red-100 text-red-800 border-red-800' }
    };
    const s = statusMap[order.status] || statusMap.pending_verification;

    const [h, m] = order.time.split(':');
    const dateObj = new Date();
    dateObj.setHours(h, m);
    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('status-result').innerHTML = `
        <div class="bg-coffee-100 brut-border p-5 mb-4">
            <span class="inline-block ${s.color} border-2 text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-widest mb-3">${s.label}</span>
            <p class="font-mono text-[10px] uppercase tracking-widest font-bold text-coffee-500 mb-1">Order</p>
            <p class="font-mono text-lg font-bold text-coffee-900 mb-4">${order.orderNumber}</p>
            <div class="text-sm text-coffee-700 space-y-1">
                <p><strong>Name:</strong> ${order.name}</p>
                <p><strong>Pickup:</strong> ${formattedTime}</p>
                <p><strong>Payment:</strong> ${order.payment}${order.reference ? ' · ' + order.reference : ''}</p>
                <p class="pt-2 mt-2 border-t-2 border-coffee-900"><strong>Total:</strong> ${peso(order.total)}</p>
            </div>
        </div>
    `;

    const isPending = order.status === 'pending_verification' || order.status === 'pending_pickup';
    document.getElementById('demo-confirm-btn').disabled = !isPending;
    document.getElementById('demo-reject-btn').disabled = !isPending;
}

document.getElementById('status-check').addEventListener('click', () => {
    const q = document.getElementById('status-input').value.trim().toUpperCase();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const found = orders.find(o => o.orderNumber.toUpperCase() === q);
    if (found) {
        renderStatus(found);
    } else {
        currentStatusOrder = null;
        document.getElementById('status-result').innerHTML = `
            <div class="bg-red-50 border-2 border-red-800 p-4 text-sm text-red-800 text-center font-mono">
                No order found with that number.
            </div>
        `;
        document.getElementById('demo-confirm-btn').disabled = true;
        document.getElementById('demo-reject-btn').disabled = true;
    }
});

document.getElementById('demo-confirm-btn').addEventListener('click', () => {
    if (!currentStatusOrder) return;
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const idx = orders.findIndex(o => o.orderNumber === currentStatusOrder.orderNumber);
    if (idx < 0) return;
    orders[idx].status = 'confirmed';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    renderStatus(orders[idx]);
    showToast('Payment confirmed — SMS & Email sent');
});

document.getElementById('demo-reject-btn').addEventListener('click', () => {
    if (!currentStatusOrder) return;
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const idx = orders.findIndex(o => o.orderNumber === currentStatusOrder.orderNumber);
    if (idx < 0) return;
    orders[idx].status = 'rejected';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    renderStatus(orders[idx]);
    showToast('Payment not found — SMS & Email sent', true);
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
document.getElementById('status-link').addEventListener('click', openStatus);
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
