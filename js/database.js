// ============================================================
//  DATABASE
// ============================================================
const DB = {
    get(key, def = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : def;
        } catch { return def; }
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }
};

// ============================================================
//  PRODUCTS
// ============================================================
function getProducts() {
    return DB.get('products', []);
}

function saveProducts(products) {
    DB.set('products', products);
}

function getProductById(id) {
    return getProducts().find(p => p.id === id);
}

function addProduct(product) {
    const products = getProducts();
    product.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    product.views = 0;
    product.rating = { total: 0, count: 0, average: 0 };
    product.createdAt = new Date().toISOString();
    products.push(product);
    saveProducts(products);
    return product;
}

function updateProduct(id, updates) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates };
    saveProducts(products);
    return products[idx];
}

function deleteProduct(id) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    saveProducts(filtered);
    return filtered;
}

function incrementView(id) {
    const p = getProductById(id);
    if (p) {
        p.views = (p.views || 0) + 1;
        updateProduct(id, { views: p.views });
        return p.views;
    }
    return 0;
}

function rateProduct(id, rating) {
    const p = getProductById(id);
    if (!p) return null;
    if (!p.rating) p.rating = { total: 0, count: 0, average: 0 };
    p.rating.total += rating;
    p.rating.count += 1;
    p.rating.average = Math.round((p.rating.total / p.rating.count) * 10) / 10;
    updateProduct(id, { rating: p.rating });
    return p.rating;
}

// ============================================================
//  CART
// ============================================================
function getCart() {
    return DB.get('cart', []);
}
function saveCart(cart) {
    DB.set('cart', cart);
}

function addToCart(productId) {
    const cart = getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }
    saveCart(cart);
    updateCartCount();
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.productId !== productId);
    saveCart(cart);
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

function getCartTotal() {
    const cart = getCart();
    const products = getProducts();
    let total = 0;
    cart.forEach(item => {
        const p = products.find(pr => pr.id === item.productId);
        if (p) {
            const price = getDiscountedPrice(p);
            total += price * item.quantity;
        }
    });
    return total;
}

// ============================================================
//  DISCOUNT
// ============================================================
function isInDiscount(product) {
    if (!product?.discount) return false;
    const { type, value, start, end } = product.discount;
    if (!type || !value) return false;
    const now = PersianDate.now();
    const nowStr = PersianDate.format(now);
    if (start && start > nowStr) return false;
    if (end && end < nowStr) return false;
    return true;
}

function getDiscountedPrice(product) {
    if (!isInDiscount(product)) return product.price;
    const { type, value } = product.discount;
    if (type === 'percent') {
        return Math.round(product.price * (1 - Number(value) / 100));
    } else if (type === 'fixed') {
        return Math.max(0, product.price - Number(value));
    }
    return product.price;
}

function getDiscountPercent(product) {
    if (!isInDiscount(product)) return 0;
    const { type, value } = product.discount;
    if (type === 'percent') return Number(value);
    if (type === 'fixed') {
        return Math.round((Number(value) / product.price) * 100);
    }
    return 0;
}

// ============================================================
//  CATEGORIES & TAGS
// ============================================================
function getCategories() {
    const products = getProducts();
    return [...new Set(products.map(p => p.category).filter(Boolean))];
}

function getTags() {
    const products = getProducts();
    const tags = new Set();
    products.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
            p.tags.forEach(t => tags.add(t));
        }
    });
    return [...tags];
}

// ============================================================
//  SEED DATA
// ============================================================
function seedData() {
    const products = getProducts();
    if (products.length === 0) {
        const sample = [
            { title: 'سامسونگ گلکسی S24', category: 'mobile', tags: ['سامسونگ', 'پرچمدار'], price: 35000000, description: 'گوشی پرچمدار سامسونگ با دوربین ۲۰۰ مگاپیکسل', image: '', discount: { type: 'percent', value: 10, start: '', end: '' } },
            { title: 'اپل آیفون ۱۵ پرو', category: 'mobile', tags: ['اپل', 'آیفون'], price: 45000000, description: 'آیفون ۱۵ پرو با تراشه A17 Pro', image: '', discount: { type: 'fixed', value: 5000000, start: '', end: '' } },
            { title: 'شیائومی ۱۴', category: 'mobile', tags: ['شیائومی', 'پرچمدار'], price: 22000000, description: 'شیائومی ۱۴ با دوربین لایکا', image: '', discount: null },
            { title: 'لپ‌تاپ ایسوس ROG', category: 'laptop', tags: ['ایسوس', 'گیمینگ'], price: 45000000, description: 'لپ‌تاپ گیمینگ با RTX 4080', image: '', discount: { type: 'percent', value: 15, start: '', end: '' } },
            { title: 'لپ‌تاپ دل XPS 13', category: 'laptop', tags: ['دل', 'اولترابوک'], price: 32000000, description: 'لپ‌تاپ باریک و قدرتمند دل', image: '', discount: null },
            { title: 'کیس کامپیوتر حرفه‌ای', category: 'computer', tags: ['کیس', 'گیمینگ'], price: 12000000, description: 'کیس کامل با مشخصات بالا', image: '', discount: null },
            { title: 'موس گیمینگ ریزر', category: 'accessory', tags: ['موس', 'ریزر'], price: 3500000, description: 'موس بی‌سیم با ۱۶۰۰۰ DPI', image: '', discount: { type: 'percent', value: 20, start: '', end: '' } },
            { title: 'کیبورد مکانیکی', category: 'accessory', tags: ['کیبورد', 'مکانیکی'], price: 4800000, description: 'کیبورد مکانیکی با سوئیچ آبی', image: '', discount: null },
            { title: 'سیم‌کارت ایرانسل', category: 'sim', tags: ['ایرانسل'], price: 250000, description: 'سیم‌کارت دائمی ایرانسل', image: '', discount: null },
        ];
        sample.forEach(p => addProduct(p));
    }
}
