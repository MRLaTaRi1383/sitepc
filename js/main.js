// ============================================================
//  MAIN APPLICATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    seedData();
    renderAll();
    setupEventListeners();
    setupTimer();
    updateCartCount();
    setFooterDate();
});

// ============================================================
//  RENDER
// ============================================================
function renderAll() {
    renderSpecialOffers();
    renderCategoryProducts('laptop', 'laptopTrack');
    renderCategoryProducts('mobile', 'mobileTrack');
    renderCategoryProducts('computer', 'computerTrack');
    renderCategoryProducts('accessory', 'accessoryTrack');
}

function renderSpecialOffers() {
    const track = document.getElementById('specialTrack');
    if (!track) return;
    const products = getProducts().filter(p => isInDiscount(p));
    track.innerHTML = products.map(p => createProductCard(p)).join('');
}

function renderCategoryProducts(category, trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;
    const products = getProducts().filter(p => p.category === category);
    track.innerHTML = products.map(p => createProductCard(p)).join('');
}

function createProductCard(product) {
    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;
    const original = product.price;
    const discountPercent = discounted ? getDiscountPercent(product) : 0;
    const rating = product.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));

    return `
        <div class="product-card" data-id="${product.id}" onclick="showProduct('${product.id}')">
            <div class="image">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : `<i class="fas fa-box"></i>`}
                ${discounted ? `<span class="badge discount">${discountPercent}%</span>` : ''}
            </div>
            <div class="title">${product.title || 'بدون عنوان'}</div>
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
                <button class="add-btn" onclick="event.stopPropagation(); handleAddToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
}

// ============================================================
//  PRODUCT DETAIL
// ============================================================
function showProduct(id) {
    const product = getProductById(id);
    if (!product) return alert('کالا یافت نشد');
    incrementView(id);

    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const body = document.getElementById('productModalBody');

    title.textContent = product.title;
    const discounted = isInDiscount(product);
    const price = discounted ? getDiscountedPrice(product) : product.price;
    const rating = product.rating || { average: 0, count: 0 };

    body.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:var(--glass); border-radius:var(--radius-sm); padding:20px; display:grid; place-items:center; min-height:150px;">
                ${product.image ? `<img src="${product.image}" style="max-width:100%; max-height:150px;" />` : '<i class="fas fa-box" style="font-size:48px;"></i>'}
            </div>
            <div>
                <p><strong>دسته:</strong> ${product.category || 'متفرقه'}</p>
                <p><strong>تگ‌ها:</strong> ${product.tags ? product.tags.join('، ') : 'ندارد'}</p>
                <p><strong>بازدید:</strong> ${product.views || 0}</p>
                <p><strong>امتیاز:</strong> ${'★'.repeat(Math.round(rating.average))} (${rating.average || 0})</p>
                <p style="font-size:1.3rem; font-weight:bold;">
                    ${discounted ? `<span style="text-decoration:line-through;color:var(--muted);font-size:1rem;">${product.price.toLocaleString()}</span> ` : ''}
                    ${price.toLocaleString()} تومان
                </p>
            </div>
        </div>
        <div style="margin-top:12px;">
            <p style="color:var(--text-secondary);">${product.description || 'توضیحی وارد نشده است.'}</p>
        </div>
        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="handleAddToCart('${product.id}'); document.getElementById('productModal').classList.add('hidden');">
                <i class="fas fa-cart-plus"></i> افزودن به سبد
            </button>
            <button class="btn btn-secondary" onclick="showRating('${product.id}')">
                <i class="fas fa-star"></i> امتیاز دهید
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('productModal').classList.add('hidden')">بستن</button>
        </div>
    `;

    modal.classList.remove('hidden');
}

// ============================================================
//  RATING
// ============================================================
let ratingProductId = null;

function showRating(id) {
    ratingProductId = id;
    const modal = document.getElementById('ratingModal');
    if (!modal) {
        const div = document.createElement('div');
        div.id = 'ratingModal';
        div.className = 'modal-overlay hidden';
        div.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <h3>⭐ امتیاز دهید</h3>
                    <button class="modal-close" onclick="document.getElementById('ratingModal').classList.add('hidden')"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="stars" id="starContainer" style="display:flex; gap:12px; justify-content:center; font-size:2rem; margin:16px 0;">
                        ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-value="${i}" onclick="selectStar(${i})"></i>`).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="submitRating()" style="width:100%; justify-content:center;">ثبت امتیاز</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }
    document.getElementById('ratingModal').classList.remove('hidden');
    document.querySelectorAll('#starContainer i').forEach(s => s.classList.remove('active'));
}

let selectedStar = 0;
function selectStar(val) {
    selectedStar = val;
    document.querySelectorAll('#starContainer i').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.value) <= val);
    });
}

function submitRating() {
    if (!selectedStar) return alert('لطفاً یک امتیاز انتخاب کنید');
    if (!ratingProductId) return alert('خطا');
    const result = rateProduct(ratingProductId, selectedStar);
    if (result) {
        alert('✅ امتیاز با موفقیت ثبت شد');
        document.getElementById('ratingModal').classList.add('hidden');
        renderAll();
        selectedStar = 0;
    }
}

// ============================================================
//  CART
// ============================================================
function handleAddToCart(id) {
    addToCart(id);
    showToast('✅ به سبد خرید اضافه شد');
    renderAll();
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
        position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
        background:var(--bg-2); color:var(--text); padding:12px 24px;
        border-radius:var(--radius-sm); border:1px solid var(--border);
        box-shadow:var(--shadow); z-index:9999; font-family:inherit;
        animation: fadeInUp 0.3s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Theme
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

    // Auth
    document.getElementById('authToggle')?.addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('hidden');
    });
    document.getElementById('authClose')?.addEventListener('click', () => {
        document.getElementById('authModal').classList.add('hidden');
    });
    document.getElementById('authSubmit')?.addEventListener('click', function() {
        const email = document.getElementById('authEmail').value.trim();
        const pass = document.getElementById('authPass').value;
        if (!email || pass.length < 4) {
            return alert('ایمیل/موبایل و رمز عبور (حداقل ۴ کاراکتر) را وارد کنید');
        }
        const users = DB.get('users', {});
        if (users[email]) {
            if (users[email] === pass) {
                alert('✅ ورود موفق');
            } else {
                return alert('❌ رمز عبور اشتباه است');
            }
        } else {
            users[email] = pass;
            DB.set('users', users);
            alert('✅ ثبت‌نام موفق');
        }
        document.getElementById('authModal').classList.add('hidden');
        const btn = document.getElementById('authToggle');
        btn.innerHTML = `<i class="fas fa-user-check"></i> ${email.split('@')[0]}`;
    });

    // Cart toggle
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('mobileCart')?.addEventListener('click', function(e) {
        e.preventDefault();
        toggleCart();
    });

    // Search
    document.getElementById('searchBtn')?.addEventListener('click', doSearch);
    document.getElementById('searchInput')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') doSearch();
    });

    // Category slider
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            if (category === 'all') {
                renderAll();
            } else {
                const trackId = category === 'laptop' ? 'laptopTrack' :
                                category === 'mobile' ? 'mobileTrack' :
                                category === 'computer' ? 'computerTrack' :
                                category === 'accessory' ? 'accessoryTrack' : 'specialTrack';
                const track = document.getElementById(trackId);
                if (track) {
                    const products = getProducts().filter(p => p.category === category);
                    track.innerHTML = products.map(p => createProductCard(p)).join('');
                }
            }
        });
    });

    // Product modal close
    document.getElementById('productModalClose')?.addEventListener('click', () => {
        document.getElementById('productModal').classList.add('hidden');
    });
    document.getElementById('productModal')?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });

    // Checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', function() {
        const total = getCartTotal();
        if (total === 0) return alert('سبد خرید خالی است');
        alert(`🛒 مبلغ قابل پرداخت: ${total.toLocaleString()} تومان\n\nدرگاه پرداخت در حال راه‌اندازی...`);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }
        if (e.key === 'Escape') {
            document.getElementById('authModal')?.classList.add('hidden');
            document.getElementById('productModal')?.classList.add('hidden');
            document.getElementById('ratingModal')?.classList.add('hidden');
            document.getElementById('cartSidebar')?.classList.remove('open');
            document.getElementById('cartOverlay')?.classList.remove('show');
        }
    });
}

function toggleCart() {
    document.getElementById('cartSidebar')?.classList.toggle('open');
    document.getElementById('cartOverlay')?.classList.toggle('show');
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const cart = getCart();
    const products = getProducts();

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">سبد خرید خالی است</p>';
        totalEl.textContent = '۰';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        const p = products.find(pr => pr.id === item.productId);
        if (p) {
            const price = getDiscountedPrice(p);
            const itemTotal = price * item.quantity;
            total += itemTotal;
            html += `
                <div class="cart-item">
                    <div>
                        <div>${p.title}</div>
                        <div style="font-size:0.8rem;color:var(--muted);">${item.quantity} × ${price.toLocaleString()} تومان</div>
                    </div>
                    <div>
                        <span style="font-weight:bold;">${itemTotal.toLocaleString()} تومان</span>
                        <button class="item-remove" onclick="removeFromCart('${p.id}'); renderCartItems(); updateCartCount();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    totalEl.textContent = total.toLocaleString();
}

function doSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return renderAll();

    const products = getProducts().filter(p => {
        return (p.title && p.title.toLowerCase().includes(query)) ||
               (p.description && p.description.toLowerCase().includes(query)) ||
               (p.category && p.category.toLowerCase().includes(query)) ||
               (p.tags && p.tags.some(t => t.toLowerCase().includes(query)));
    });

    const track = document.getElementById('specialTrack');
    if (track) {
        track.innerHTML = products.length ? products.map(p => createProductCard(p)).join('') :
            '<p style="color:var(--muted);padding:40px;text-align:center;">نتیجه‌ای یافت نشد</p>';
    }
    document.querySelectorAll('.product-track').forEach(t => {
        if (t.id !== 'specialTrack') t.innerHTML = '';
    });
}

// ============================================================
//  TIMER
// ============================================================
function setupTimer() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;
    const end = new Date();
    end.setHours(end.getHours() + 24);
    function update() {
        const now = new Date();
        const diff = end - now;
        if (diff <= 0) { display.textContent = '۰۰:۰۰:۰۰'; return; }
        const h = String(Math.floor(diff / (1000*60*60))).padStart(2,'0');
        const m = String(Math.floor((diff % (1000*60*60)) / (1000*60))).padStart(2,'0');
        const s = String(Math.floor((diff % (1000*60)) / 1000)).padStart(2,'0');
        display.textContent = `${h}:${m}:${s}`;
    }
    update();
    setInterval(update, 1000);
}

// ============================================================
//  FOOTER DATE
// ============================================================
function setFooterDate() {
    const el = document.getElementById('footerDate');
    if (el) {
        const now = PersianDate.now();
        const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        el.textContent = `${now.day} ${monthNames[now.month-1]} ${now.year}`;
    }
}
