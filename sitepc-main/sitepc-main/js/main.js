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
    const products = getProducts().filter(p => isInDiscount(p) && p.status !== 'sold');
    track.innerHTML = products.map(p => createProductCard(p)).join('');
    initSlider(track);
}

function renderCategoryProducts(category, trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;
    const products = getProducts().filter(p => p.category === category && p.status !== 'sold');
    track.innerHTML = products.map(p => createProductCard(p)).join('');
    initSlider(track);
}

function createProductCard(product) {
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
        <div class="product-card" data-id="${product.id}" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="image">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : `<i class="fas fa-box"></i>`}
                ${discounted ? `<span class="badge discount">${discountPercent}%</span>` : ''}
                ${statusBadge}
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
                ${product.status === 'available' ? `
                    <button class="add-btn" onclick="event.stopPropagation(); handleAddToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function initSlider(track) {
    if (track.children.length < 2) return;
    let scrollAmount = 0;
    const step = 1;
    const maxScroll = track.scrollWidth - track.parentElement.clientWidth;
    let interval;

    function scroll() {
        if (maxScroll <= 0) return;
        scrollAmount += step;
        if (scrollAmount >= maxScroll) {
            scrollAmount = 0;
            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
            }, 50);
        } else {
            track.style.transform = `translateX(${-scrollAmount}px)`;
        }
    }

    interval = setInterval(scroll, 40);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(interval));
    track.parentElement.addEventListener('mouseleave', () => {
        interval = setInterval(scroll, 40);
    });
}

// ============================================================
//  CART
// ============================================================
function handleAddToCart(id) {
    const product = getProductById(id);
    if (product.status !== 'available') {
        showToast('❌ این کالا قابل خرید نیست');
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
                DB.set('currentUser', { email, name: email.split('@')[0] });
            } else {
                return alert('❌ رمز عبور اشتباه است');
            }
        } else {
            users[email] = pass;
            DB.set('users', users);
            DB.set('currentUser', { email, name: email.split('@')[0] });
            alert('✅ ثبت‌نام موفق');
        }
        document.getElementById('authModal').classList.add('hidden');
        const btn = document.getElementById('authToggle');
        const user = DB.get('currentUser');
        if (user) btn.innerHTML = `<i class="fas fa-user-check"></i> ${user.name}`;
    });

    // Cart toggle
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('mobileCart')?.addEventListener('click', function(e) {
        e.preventDefault();
        toggleCart();
    });

    // Mobile search
    document.getElementById('searchToggleMobile')?.addEventListener('click', function() {
        document.getElementById('mobileSearchCard').classList.toggle('hidden');
        document.getElementById('mobileSearchInput')?.focus();
    });
    document.getElementById('mobileSearchToggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('mobileSearchCard').classList.toggle('hidden');
        document.getElementById('mobileSearchInput')?.focus();
    });
    document.getElementById('mobileSearchClose')?.addEventListener('click', function() {
        document.getElementById('mobileSearchCard').classList.add('hidden');
    });
    document.getElementById('mobileSearchBtn')?.addEventListener('click', function() {
        const query = document.getElementById('mobileSearchInput').value.trim();
        if (query) window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    });
    document.getElementById('mobileSearchInput')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
    });

    // Mobile category sidebar
    document.getElementById('mobileCategoryToggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('mobileCategorySidebar').classList.toggle('open');
        document.getElementById('mobileCategoryOverlay').classList.toggle('show');
    });
    document.getElementById('mobileCategoryClose')?.addEventListener('click', function() {
        document.getElementById('mobileCategorySidebar').classList.remove('open');
        document.getElementById('mobileCategoryOverlay').classList.remove('show');
    });
    document.getElementById('mobileCategoryOverlay')?.addEventListener('click', function() {
        document.getElementById('mobileCategorySidebar').classList.remove('open');
        this.classList.remove('show');
    });

    // Checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', function() {
        const total = getCartTotal();
        if (total === 0) return alert('سبد خرید خالی است');
        document.getElementById('buyModal')?.classList.remove('hidden');
        toggleCart();
    });

    // Buy modal
    document.getElementById('buyModalClose')?.addEventListener('click', function() {
        document.getElementById('buyModal').classList.add('hidden');
    });
    document.getElementById('buyModal')?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('cartSidebar')?.classList.remove('open');
            document.getElementById('cartOverlay')?.classList.remove('show');
            document.getElementById('mobileSearchCard')?.classList.add('hidden');
            document.getElementById('mobileCategorySidebar')?.classList.remove('open');
            document.getElementById('mobileCategoryOverlay')?.classList.remove('show');
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