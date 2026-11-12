/* Let's KAPE — shared data layer (customer site + café dashboard).
   Everything is kept in the browser's localStorage, as in the proposal (no database). */
const LK = (() => {
    const K = { orders: 'letskape_orders', menu: 'letskape_menu', settings: 'letskape_settings', lock: 'letskape_admin_lock' };

    const MENU = [
        { id: 'k1', category: 'coffee', name: 'Strawberry Matcha', price: 160, desc: 'Earthy matcha paired with sweet, fruity strawberry puree.', img: 'https://i.imgur.com/P2Au1Av.jpeg' },
        { id: 'k2', category: 'coffee', name: 'Ube Latte', price: 180, desc: 'Espresso, steamed milk, and sweet local ube halaya.', img: 'https://i.imgur.com/xgskEXv.jpeg' },
        { id: 'k3', category: 'coffee', name: 'Oreo Matcha', price: 150, desc: 'Creamy matcha with a sweet Oreo crunch.', img: 'https://i.imgur.com/FbBPJD0.jpeg' },
        { id: 'k4', category: 'coffee', name: 'Iced Spanish Latte', price: 170, desc: 'Sweetened with condensed milk, a local crowd favorite.', img: 'https://i.imgur.com/Sk3PEGF.jpeg' },
        { id: 'p1', category: 'pastry', name: 'Bibingka', price: 130, desc: 'Classic rice cake topped with salted egg and cheese.', img: 'https://images.unsplash.com/photo-1659504706718-39e049784635?auto=format&fit=crop&q=80&w=200&h=200' },
        { id: 'p2', category: 'pastry', name: 'Calamansi Muffin', price: 95, desc: 'Tangy, sweet, and baked fresh every morning.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=200&h=200' },
        { id: 'p3', category: 'pastry', name: 'Ensaymada', price: 110, desc: 'Soft bread smothered in butter, sugar, and queso de bola.', img: 'https://images.unsplash.com/photo-1688084436286-8f0ca14e9390?auto=format&fit=crop&q=80&w=200&h=200' },
        { id: 'p4', category: 'pastry', name: 'Pandesal at Kesong Puti', price: 85, desc: 'Warm pandesal served with creamy local white cheese.', img: 'https://images.unsplash.com/photo-1790995504729-921c40267b38?auto=format&fit=crop&q=80&w=200&h=200' }
    ];
    // hours: [open, close] in 24h "HH:MM"
    const SET = { accepting: true, gcash: '0912 345 6789', maya: '0912 345 6789', weekday: ['07:00', '22:00'], weekend: ['08:00', '23:00'] };

    const STATUS = {
        pending_verification: ['Pending Payment Verification', 'bg-yellow-100 text-yellow-800 border-yellow-800'],
        pending_pickup: ['Pending Pickup (Cash)', 'bg-yellow-100 text-yellow-800 border-yellow-800'],
        confirmed: ['Payment Confirmed', 'bg-green-100 text-green-800 border-green-800'],
        preparing: ['Preparing', 'bg-blue-100 text-blue-800 border-blue-800'],
        ready: ['Ready for Pickup', 'bg-purple-100 text-purple-800 border-purple-800'],
        completed: ['Completed', 'bg-coffee-100 text-coffee-800 border-coffee-800'],
        rejected: ['Payment Not Found', 'bg-red-100 text-red-800 border-red-800']
    };
    Object.keys(STATUS).forEach(k => { STATUS[k] = { label: STATUS[k][0], color: STATUS[k][1] }; });

    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const peso = n => '₱' + Number(n).toLocaleString();

    // Published data (data.js) is what customers see; a draft saved by the admin on this device overrides it for preview.
    const PUB = (typeof window !== 'undefined' && window.LK_DATA) || {};
    const getMenu = () => {
        const m = rd(K.menu, null);
        if (Array.isArray(m) && m.length) return m;
        return (Array.isArray(PUB.menu) && PUB.menu.length ? PUB.menu : MENU).map(x => ({ ...x }));
    };
    const hasDraft = () => localStorage.getItem(K.menu) !== null || localStorage.getItem(K.settings) !== null;
    const discardDraft = () => { localStorage.removeItem(K.menu); localStorage.removeItem(K.settings); };
    const saveMenu = m => wr(K.menu, m);
    const resetMenu = () => localStorage.removeItem(K.menu);
    const getSettings = () => ({ ...SET, ...(PUB.settings || {}), ...rd(K.settings, {}) });
    const saveSettings = s => wr(K.settings, s);
    const getOrders = () => { const o = rd(K.orders, []); return Array.isArray(o) ? o : []; };
    const saveOrders = o => wr(K.orders, o);
    function updateOrder(num, patch) {
        const o = getOrders(), i = o.findIndex(x => x.orderNumber === num);
        if (i < 0) return null;
        Object.assign(o[i], patch, { updatedAt: new Date().toISOString() });
        saveOrders(o);
        return o[i];
    }
    function newOrderNumber() {
        const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', d = new Date(), used = getOrders().map(o => o.orderNumber);
        let n;
        do {
            n = 'LK-' + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' +
                Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('');
        } while (used.includes(n));
        return n;
    }

    const hoursFor = (d = new Date()) => getSettings()[[0, 6].includes(d.getDay()) ? 'weekend' : 'weekday'];
    const t12 = hm => {
        const [h, m] = hm.split(':').map(Number);
        return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? 'AM' : 'PM');
    };

    // Order code: lets an order that arrives by email be opened in the café dashboard on another device.
    const encodeOrder = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    function decodeOrder(code) {
        try {
            const raw = JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g, '+').replace(/_/g, '/')))));
            const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 50).map(i => ({
                name: String(i.name || '').slice(0, 80), price: Math.max(0, +i.price || 0), qty: Math.max(1, Math.min(99, +i.qty || 1)),
                subtotal: Math.max(0, (+i.price || 0) * Math.max(1, Math.min(99, +i.qty || 1)))
            }));
            const s = (v, n) => String(v ?? '').slice(0, n);
            if (!/^LK-[A-Z0-9-]{4,12}$/.test(s(raw.orderNumber, 20)) || !items.length) return null;
            return {
                orderNumber: raw.orderNumber, name: s(raw.name, 80), phone: s(raw.phone, 30), email: s(raw.email, 80),
                time: /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : '00:00', payment: s(raw.payment, 20), reference: s(raw.reference, 30),
                notes: s(raw.notes, 200), items, total: items.reduce((a, i) => a + i.subtotal, 0),
                status: raw.payment === 'Cash on Pickup' ? 'pending_pickup' : 'pending_verification',
                createdAt: s(raw.createdAt, 40) || new Date().toISOString(), imported: true
            };
        } catch { return null; }
    }

    // Staff lock (a convenience gate stored on the café's device — not server-side security).
    const hash = s => { let a = 0xdeadbeef, b = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); } a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909); return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36); };
    const hasPin = () => !!localStorage.getItem(K.lock);
    const setPin = p => localStorage.setItem(K.lock, hash('lk:' + p));
    const checkPin = p => localStorage.getItem(K.lock) === hash('lk:' + p);

    const onChange = cb => window.addEventListener('storage', e => { if (Object.values(K).includes(e.key)) cb(e.key, K); });

    return { K, STATUS, esc, peso, getMenu, saveMenu, resetMenu, getSettings, saveSettings, getOrders, saveOrders, updateOrder,
        newOrderNumber, hasDraft, discardDraft, hoursFor, t12, encodeOrder, decodeOrder, hasPin, setPin, checkPin, onChange };
})();
