// ============================================================
//  PRODUCT PAGES LOGIC
// ============================================================

// ===== PRODUCTS PAGE =====
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const search = params.get('search');
    const condition = params.get('condition');
    const brand = params.get('brand');
    const sub = params.get('sub');
    const part = params.get('part');

    // Set page title
    const titleEl = document.getElementById('pageTitle');
    if (category && category !== 'all') {
        const catNames = { mobile: 'موبایل', laptop: 'لپ‌تاپ', computer: 'کامپیوتر', accessory: 'لوازم جانبی', sim: 'سیم‌کارت' };
        titleEl.textContent = catNames[category] || 'محصولات';
    } else if (search) {
        titleEl.textContent = `نتایج جستجو: ${search}`;
    } else {
        titleEl.textContent = 'همه محصولات';
    }

    // Set filter selects
    const catSelect = document.getElementById('filterCategory');
    if (catSelect && category) catSelect.value = category;

    // Render products
    renderProductsPage(category, search, condition, brand, sub, part);

    // Filter events
    document.getElementById('filterCategory')?.addEventListener('change', function() {
        const val = this.value;
        window.location.href = val === 'all' ? 'products.html' : `products.html?category=${val}`;
    });

    document.getElementById('filterStatus')?.addEventListener('change', function() {
        const url = new URL(window.location.href);
        url.searchParams.set('status', this.value);
        window.location.href = url.toString();
    });

    document.getElementById('filterSort')?.addEventListener('change', function() {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', this.value);
        window.location.href = url.toString();
    });

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        const t = document.getElementById('themeToggle');
        if (t) t.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // Footer date
    setFooterDate();

    // Product modal
    document.getElementById('productModalClose')?.addEventListener('click', function() {
        document.getElementById('productModal').classList.add('hidden');
    });
    document.getElementById('productModal')?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });

    // Buy modal
    document.getElementById('buyModalClose')?.addEventListener('click', function() {
        document.getElementById('buyModal').classList.add('hidden');
    });
    document.getElementById('buyModal')?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });
});

function renderProductsPage(category, search, condition, brand, sub, part) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    let products = getProducts();

    // Filters
    if (category && category !== 'all') {
        products = products.filter(p => p.category === category);
    }
    if (search) {
        const q = search.toLowerCase();
        products = products.filter(p => 
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
    }
    if (condition) {
        products = products.filter(p => p.condition === condition);
    }
    if (brand) {
        products = products.filter(p => p.brand === brand);
    }
    if (sub) {
        products = products.filter(p => p.subCategory === sub);
    }
    if (part) {
        products = products.filter(p => p.part === part);
    }

    // Status filter from URL
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status && status !== 'all') {
        products = products.filter(p => p.status === status);
    }

    // Sort
    const sort = params.get('sort') || 'newest';
    switch(sort) {
        case 'price-asc': products.sort((a,b) => a.price - b.price); break;
        case 'price-desc': products.sort((a,b) => b.price - a.price); break;
        case 'popular': products.sort((a,b) => (b.views || 0) - (a.views || 0)); break;
        case 'rating': products.sort((a,b) => (b.rating?.average || 0) - (a.rating?.average || 0)); break;
        default: products.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (products.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted); text-align:center; padding:60px 0;">هیچ کالایی یافت نشد</p>`;
        return;
    }

    grid.innerHTML = products.map(p => createProductCardFull(p)).join('');
}

function createProductCardFull(product) {
    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;
    const original = product.price;
    const discountPercent = discounted ? getDiscountPercent(product) : 0;
    const rating = product.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));

    let statusBadge = '';
    if (product.status === 'sold') statusBadge = '<span class="badge sold">فروخته شده</span>';
    else if (product.status === 'unavailable') statusBadge = '<span class="badge" style="background:var(--danger);color:white;">ناموجود</span>';
    else statusBadge = '<span class="badge available">موجود</span>';

    return `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="image">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : `<i class="fas fa-box"></i>`}
                ${discounted ? `<span class="badge discount">${discountPercent}%</span>` : ''}
                ${statusBadge}
            </div>
            <div class="title">${product.title}</div>
            <div class="desc">${product.description || ''}</div>
            <div class="stats">
                <span><i class="fas fa-eye"></i> ${product.views || 0}</span>
                <span><i class="fas fa-star" style="color:var(--warning);"></i> ${rating.average || 0}</span>
                <span class="stars-display" style="font-size:0.6rem;">${stars}</span>
            </div>
            <div class="price-row">
                <div class="price">
                    ${discounted ? `<span class="old">${original.toLocaleString()}</span>` : ''}
                    ${price.toLocaleString()} تومان
                </div>
                ${product.status === 'available' ? `
                    <button class="add-btn" onclick="event.stopPropagation(); handleAddToCartProduct('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function handleAddToCartProduct(id) {
    const product = getProductById(id);
    if (product.status !== 'available') {
        alert('❌ این کالا قابل خرید نیست');
        return;
    }
    addToCart(id);
    showToast('✅ به سبد خرید اضافه شد');
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
        position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
        background:var(--glass-strong); color:var(--text); padding:12px 24px;
        border-radius:var(--radius-sm); border:1px solid var(--glass-border);
        backdrop-filter:blur(16px); box-shadow:var(--shadow-strong); z-index:9999;
        font-family:inherit;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); }, 2500);
}

function setFooterDate() {
    const el = document.getElementById('footerDate');
    if (el) {
        const now = PersianDate.now();
        const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        el.textContent = `${now.day} ${monthNames[now.month-1]} ${now.year}`;
    }
}

// ============================================================
//  PRODUCT DETAIL PAGE
// ============================================================
if (window.location.pathname.includes('product-detail.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) {
            document.getElementById('productDetail').innerHTML = '<p style="text-align:center;padding:60px 0;">کالا یافت نشد</p>';
            return;
        }

        const product = getProductById(id);
        if (!product) {
            document.getElementById('productDetail').innerHTML = '<p style="text-align:center;padding:60px 0;">کالا یافت نشد</p>';
            return;
        }

        incrementView(id);
        renderProductDetail(product);

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
        const saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
            const t = document.getElementById('themeToggle');
            if (t) t.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    });
}

function renderProductDetail(product) {
    const container = document.getElementById('productDetail');
    if (!container) return;

    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;
    const rating = product.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));

    let statusText = '';
    if (product.status === 'sold') statusText = '<span style="color:var(--danger);">فروخته شده</span>';
    else if (product.status === 'unavailable') statusText = '<span style="color:var(--danger);">ناموجود</span>';
    else statusText = '<span style="color:var(--success);">موجود</span>';

    let colorsHtml = '';
    if (product.colors && product.colors.length) {
        colorsHtml = `
            <div class="colors">
                <strong>رنگ‌های موجود:</strong>
                ${product.colors.map(c => `<span class="color-tag">${c}</span>`).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : `<i class="fas fa-box" style="font-size:80px;color:var(--muted);"></i>`}
            </div>
            <div class="product-detail-info">
                <h1>${product.title}</h1>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${product.category || 'متفرقه'}</span>
                    <span><i class="fas fa-eye"></i> ${product.views || 0} بازدید</span>
                    <span><i class="fas fa-star" style="color:var(--warning);"></i> ${rating.average || 0} (${rating.count || 0} نظر)</span>
                    <span>${statusText}</span>
                </div>
                <div class="price">
                    ${discounted ? `<span class="old">${product.price.toLocaleString()}</span> ` : ''}
                    ${price.toLocaleString()} تومان
                    ${discounted ? `<span class="discount-tag">${getDiscountPercent(product)}% تخفیف</span>` : ''}
                </div>
                <div class="description">${product.description || 'توضیحی برای این کالا وارد نشده است.'}</div>
                ${colorsHtml}
                <div class="stats" style="margin:12px 0;">
                    <span>⭐ امتیاز: ${stars}</span>
                </div>
                <div class="actions">
                    ${product.status === 'available' ? `
                        <button class="btn btn-primary" onclick="handleBuy('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> خرید
                        </button>
                    ` : `<button class="btn btn-secondary" disabled>ناموجود</button>`}
                    <button class="btn btn-secondary" onclick="window.location.href='products.html'">
                        <i class="fas fa-arrow-right"></i> بازگشت
                    </button>
                </div>
            </div>
        </div>
    `;
}

function handleBuy(id) {
    const product = getProductById(id);
    if (product.status !== 'available') {
        alert('❌ این کالا قابل خرید نیست');
        return;
    }
    addToCart(id);
    document.getElementById('buyModal')?.classList.remove('hidden');
}