// ============================================================
//  MAIN APPLICATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    renderProducts();
    renderSpecialOffers();
    updateCartCount();
    setupEventListeners();
    setupTimer();

    // Handle URL hash for product view
    if (window.location.hash && window.location.hash.startsWith('#product-')) {
        const id = window.location.hash.replace('#product-', '');
        showProductDetail(id);
    }
});

// ============================================================
//  RENDER FUNCTIONS
// ============================================================

function renderProducts(filter = 'all') {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    let products = getProducts();

    // Apply filters
    if (filter === 'special') {
        products = products.filter(p => isInDiscount(p));
    } else if (filter === 'popular') {
        products = products.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (filter === 'rated') {
        products = products.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    }

    if (products.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1; text-align:center; padding:40px 0;">هیچ کالایی یافت نشد</p>`;
        return;
    }

    grid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function renderSpecialOffers() {
    const grid = document.getElementById('specialGrid');
    if (!grid) return;

    const products = getProducts().filter(p => isInDiscount(p)).slice(0, 4);

    if (products.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1; text-align:center; padding:20px 0;">هیچ پیشنهاد شگفت‌انگیزی در حال حاضر موجود نیست</p>`;
        return;
    }

    grid.innerHTML = products.map(product => createProductCard(product, true)).join('');
}

function createProductCard(product, isSpecial = false) {
    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;
    const originalPrice = product.price;
    const discountPercent = discounted ? getDiscountPercent(product) : 0;

    const rating = product.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));

    return `
        <div class="product-card" data-id="${product.id}" onclick="showProductDetail('${product.id}')">
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : `<span style="font-size:48px;">📱</span>`}
                ${discounted ? `<span class="badge discount-badge">${discountPercent}% تخفیف</span>` : ''}
                ${isSpecial ? `<span class="badge" style="background:var(--warning);color:#000;">🎁 ویژه</span>` : ''}
            </div>
            <div class="product-body">
                <h3 class="product-title">${product.title || 'بدون عنوان'}</h3>
                <div class="product-desc">${product.description || ''}</div>
                <div class="product-stats">
                    <span><i class="fas fa-eye"></i> ${product.views || 0}</span>
                    <span><i class="fas fa-star" style="color:var(--warning);"></i> ${rating.average || 0} (${rating.count || 0})</span>
                    <span class="stars-display">${stars}</span>
                </div>
                <div class="product-footer">
                    <div class="price">
                        ${discounted ? `<span class="old">${originalPrice.toLocaleString()}</span>` : ''}
                        ${price.toLocaleString()} تومان
                        ${discounted ? `<span class="discount-tag">${discountPercent}%</span>` : ''}
                    </div>
                    <button class="add-to-cart" onclick="event.stopPropagation(); handleAddToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
//  PRODUCT DETAIL (Single Page View)
// ============================================================

function showProductDetail(id) {
    const product = getProductById(id);
    if (!product) {
        alert('کالا یافت نشد');
        return;
    }

    // Increment view
    incrementView(id);

    // Create modal or navigate
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'productDetailModal';
    modal.style.display = 'grid';

    const rating = product.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));
    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;

    modal.innerHTML = `
        <div class="modal-box" style="max-width:600px; width:95%; max-height:80vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h2>${product.title}</h2>
                <button onclick="document.getElementById('productDetailModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text);">✕</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0;">
                <div style="background:var(--glass); border-radius:18px; padding:20px; display:grid; place-items:center; min-height:200px;">
                    ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width:100%;max-height:200px;object-fit:contain;" />` : '📱'}
                </div>
                <div>
                    <p><strong>دسته‌بندی:</strong> ${product.category || 'متفرقه'}</p>
                    <p><strong>تگ‌ها:</strong> ${product.tags ? product.tags.join('، ') : 'ندارد'}</p>
                    <p><strong>بازدید:</strong> ${product.views || 0}</p>
                    <p><strong>امتیاز:</strong> ${stars} (${rating.average || 0} از ${rating.count || 0} نفر)</p>
                    <p style="font-size:1.4rem; font-weight:bold; margin-top:8px;">
                        ${discounted ? `<span style="text-decoration:line-through;color:var(--muted);font-size:1rem;">${product.price.toLocaleString()}</span> ` : ''}
                        ${price.toLocaleString()} تومان
                        ${discounted ? `<span class="discount-tag">${getDiscountPercent(product)}%</span>` : ''}
                    </p>
                </div>
            </div>
            <div style="margin:12px 0;">
                <h4>توضیحات:</h4>
                <p style="color:var(--muted); line-height:1.8;">${product.description || 'توضیحی وارد نشده است.'}</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
                <button class="btn btn-primary" onclick="handleAddToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> افزودن به سبد
                </button>
                <button class="btn btn-secondary" onclick="showRatingModal('${product.id}')">
                    <i class="fas fa-star"></i> امتیاز دهید
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('productDetailModal').remove()">بستن</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// ============================================================
//  RATING
// ============================================================

function showRatingModal(productId) {
    const modal = document.getElementById('ratingModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('ratingProductId').value = productId;

    // Reset stars
    document.querySelectorAll('#starRating i').forEach(star => {
        star.classList.remove('active');
    });

    // Star hover/click
    document.querySelectorAll('#starRating i').forEach(star => {
        star.onmouseenter = function() {
            const val = parseInt(this.dataset.value);
            document.querySelectorAll('#starRating i').forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= val);
            });
        };
        star.onmouseleave = function() {
            const selected = document.querySelector('#starRating i.active:last-child');
            if (!selected) {
                document.querySelectorAll('#starRating i').forEach(s => s.classList.remove('active'));
            } else {
                const val = parseInt(selected.dataset.value);
                document.querySelectorAll('#starRating i').forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.value) <= val);
                });
            }
        };
        star.onclick = function() {
            const val = parseInt(this.dataset.value);
            document.querySelectorAll('#starRating i').forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= val);
            });
        };
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('ratingSubmit')?.addEventListener('click', function() {
        const productId = document.getElementById('ratingProductId').value;
        const activeStars = document.querySelectorAll('#starRating i.active');
        const rating = activeStars.length;

        if (rating === 0) {
            alert('لطفاً یک امتیاز انتخاب کنید');
            return;
        }

        const result = rateProduct(productId, rating);
        if (result) {
            alert(`امتیاز ${rating} با موفقیت ثبت شد!`);
            document.getElementById('ratingModal').classList.add('hidden');
            renderProducts();
            renderSpecialOffers();
        } else {
            alert('خطا در ثبت امتیاز');
        }
    });

    document.getElementById('ratingClose')?.addEventListener('click', function() {
        document.getElementById('ratingModal').classList.add('hidden');
    });
});

// ============================================================
//  CART
// ============================================================

function handleAddToCart(productId) {
    addToCart(productId);
    renderProducts();
    renderSpecialOffers();
    showToast('کالا به سبد خرید اضافه شد');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-2);
        color: var(--text);
        padding: 12px 24px;
        border-radius: 14px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        z-index: 10000;
        font-family: inherit;
        animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ============================================================
//  EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    // Auth toggle
    document.getElementById('authToggle')?.addEventListener('click', function() {
        document.getElementById('authModal').classList.remove('hidden');
    });

    document.getElementById('authClose')?.addEventListener('click', function() {
        document.getElementById('authModal').classList.add('hidden');
    });

    document.getElementById('authSubmit')?.addEventListener('click', function() {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        if (!email || !pass || pass.length < 4) {
            alert('لطفاً ایمیل/موبایل و رمز عبور (حداقل ۴ کاراکتر) را وارد کنید');
            return;
        }
        // Simple auth with localStorage
        const users = DB.get('users', {});
        if (users[email]) {
            if (users[email] === pass) {
                alert('✅ ورود موفق');
            } else {
                alert('❌ رمز عبور اشتباه است');
                return;
            }
        } else {
            users[email] = pass;
            DB.set('users', users);
            alert('✅ ثبت‌نام موفق');
        }
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('authToggle').innerHTML = `<i class="fas fa-user-check"></i> ${email.split('@')[0]}`;
    });

    // Search
    document.getElementById('searchBtn')?.addEventListener('click', performSearch);
    document.getElementById('searchInput')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderProducts(this.dataset.filter);
        });
    });

    // Mega menu category clicks
    document.querySelectorAll('.mega-dropdown a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            if (category) {
                document.getElementById('searchInput').value = category;
                performSearch();
            }
            const min = this.dataset.min;
            const max = this.dataset.max;
            if (min && max) {
                filterByPrice(parseInt(min), parseInt(max));
            }
        });
    });

    // Cart sidebar
    document.getElementById('cartToggle')?.addEventListener('click', function() {
        document.getElementById('cartSidebar').classList.toggle('open');
        document.getElementById('cartOverlay').classList.toggle('show');
        renderCartItems();
    });

    document.getElementById('closeCart')?.addEventListener('click', function() {
        document.getElementById('cartSidebar').classList.remove('open');
        document.getElementById('cartOverlay').classList.remove('show');
    });

    document.getElementById('cartOverlay')?.addEventListener('click', function() {
        document.getElementById('cartSidebar').classList.remove('open');
        this.classList.remove('show');
    });

    // Checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', function() {
        const total = getCartTotal();
        if (total === 0) {
            alert('سبد خرید خالی است');
            return;
        }
        alert(`🛒 مبلغ قابل پرداخت: ${total.toLocaleString()} تومان\n\nدرگاه پرداخت در حال راه‌اندازی...`);
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        renderProducts('all');
        return;
    }

    const products = getProducts();
    const filtered = products.filter(p => {
        const titleMatch = p.title && p.title.toLowerCase().includes(query);
        const descMatch = p.description && p.description.toLowerCase().includes(query);
        const catMatch = p.category && p.category.toLowerCase().includes(query);
        const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(query));
        return titleMatch || descMatch || catMatch || tagMatch;
    });

    const grid = document.getElementById('productGrid');
    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1; text-align:center; padding:40px 0;">نتیجه‌ای برای "${query}" یافت نشد</p>`;
    } else {
        grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
    }
}

function filterByPrice(min, max) {
    const products = getProducts();
    const filtered = products.filter(p => p.price >= min && p.price <= max);
    const grid = document.getElementById('productGrid');
    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1; text-align:center; padding:40px 0;">کالایی در این بازه قیمتی یافت نشد</p>`;
    } else {
        grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const cart = getCart();
    const products = getProducts();

    if (cart.length === 0) {
        container.innerHTML = `<p style="color:var(--muted); text-align:center;">سبد خرید خالی است</p>`;
        totalEl.textContent = '۰';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const price = getDiscountedPrice(product);
            const itemTotal = price * item.quantity;
            total += itemTotal;
            html += `
                <div class="cart-item">
                    <div class="item-info">
                        <div>${product.title}</div>
                        <div style="font-size:0.8rem; color:var(--muted);">${item.quantity} × ${price.toLocaleString()} تومان</div>
                    </div>
                    <div class="item-price">${itemTotal.toLocaleString()} تومان</div>
                    <button class="item-remove" onclick="removeFromCart('${product.id}'); renderCartItems(); updateCartCount();">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    totalEl.textContent = total.toLocaleString();
}

// ============================================================
//  TIMER FOR SPECIAL OFFERS
// ============================================================

function setupTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;

    // Set end time to 24 hours from now
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24);

    function updateTimer() {
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 0) {
            timerDisplay.textContent = '۰۰:۰۰:۰۰';
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.