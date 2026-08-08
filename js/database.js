// ============================================================
//  DATABASE (localStorage)
// ============================================================

const DB = {
    get(key, def) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : def;
        } catch {
            return def;
        }
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }
};

// ============================================================
//  PRODUCTS CRUD
// ============================================================

function getProducts() {
    return DB.get('products', []);
}

function saveProducts(products) {
    DB.set('products', products);
}

function getProductById(id) {
    const products = getProducts();
    return products.find(p => p.id === id);
}

function addProduct(product) {
    const products = getProducts();
    product.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    product.views = 0;
    product.rating = { total: 0, count: 0, average: 0 };
    product.createdAt = new Date().toISOString();
    products.push(product);
    saveProducts(products);
    return product;
}

function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        saveProducts(products);
        return products[index];
    }
    return null;
}

function deleteProduct(id) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    saveProducts(filtered);
    return filtered;
}

function incrementView(id) {
    const product = getProductById(id);
    if (product) {
        product.views = (product.views || 0) + 1;
        updateProduct(id, { views: product.views });
        return product.views;
    }
    return 0;
}

function rateProduct(id, rating) {
    const product = getProductById(id);
    if (product) {
        if (!product.rating) {
            product.rating = { total: 0, count: 0, average: 0 };
        }
        product.rating.total += rating;
        product.rating.count += 1;
        product.rating.average = Math.round((product.rating.total / product.rating.count) * 10) / 10;
        updateProduct(id, { rating: product.rating });
        return product.rating;
    }
    return null;
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
    const existing = cart.find(item => item.productId === productId);
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
    cart = cart.filter(item => item.productId !== productId);
    saveCart(cart);
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
}

function getCartTotal() {
    const cart = getCart();
    const products = getProducts();
    let total = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const price = getDiscountedPrice(product);
            total += price * item.quantity;
        }
    });
    return total;
}

// ============================================================
//  DISCOUNT HELPER
// ============================================================

function isInDiscount(product) {
    if (!product.discount) return false;
    const { type, value, start, end } = product.discount;
    if (!type || !value) return false;

    // If no dates, discount is always active
    if (!start && !end) return true;

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
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return [...cats];
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