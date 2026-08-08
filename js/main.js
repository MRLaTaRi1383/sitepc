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
    const discounted =
