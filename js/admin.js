// ============================================================
//  ADMIN PANEL
// ============================================================

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

document.addEventListener('DOMContentLoaded', function() {
    // Check login status
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        document.getElementById('adminLoginOverlay').classList.add('hidden');
        document.getElementById('adminContent').style.display = 'block';
        initAdmin();
    }

    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            document.getElementById('adminLoginOverlay').classList.add('hidden');
            document.getElementById('adminContent').style.display = 'block';
            initAdmin();
        } else {
            alert('❌ نام کاربری یا رمز عبور اشتباه است');
        }
    });

    // Logout
    document.getElementById('adminLogout').addEventListener('click', function() {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
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
});

function initAdmin() {
    renderAdminProducts();
    renderAdminCategories();
    renderAdminTags();
    updateStats();
    setupAdminTabs();
    setupAdminForm();
    setupCategoryTagAdd();
}

// ===== TABS =====
function setupAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');
            if (this.dataset.tab === 'products') renderAdminProducts();
            if (this.dataset.tab === 'categories') renderAdminCategories();
            if (this.dataset.tab === 'tags') renderAdminTags();
        });
    });
}

// ===== STATS =====
function updateStats() {
    const products = getProducts();
    document.getElementById('statProducts').textContent = products.length;
    document.getElementById('statCategories').textContent = getCategories().length;
    document.getElementById('statTags').textContent = getTags().length;
}

// ===== PRODUCTS LIST =====
function renderAdminProducts() {
    const container = document.getElementById('adminProductList');
    const products = getProducts();
    if (products.length === 0) {
        container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px 0;">هیچ کالایی ثبت نشده است</p>';
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="admin-item">
            <div>
                <strong>${p.title || 'بدون عنوان'}</strong>
                <span style="color:var(--muted); margin-right:12px;">${p.category || 'متفرقه'}</span>
                <span style="color:var(--muted); font-size:0.8rem;">${p.price.toLocaleString()} تومان</span>
                ${isInDiscount(p) ? `<span class="discount-tag">تخفیف ${getDiscountPercent(p)}%</span>` : ''}
            </div>
            <div class="actions">
                <button class="edit-btn" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteProductHandler('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ===== CATEGORIES =====
function renderAdminCategories() {
    const container = document.getElementById('adminCategoryList');
    const categories = getCategories();
    if (categories.length === 0) {
        container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px 0;">هیچ دسته‌بندی وجود ندارد</p>';
        return;
    }
    container.innerHTML = categories.map(c => `
        <div class="admin-item">
            <span><i class="fas fa-folder"></i> ${c}</span>
            <div class="actions">
                <button class="delete-btn" onclick="deleteCategory('${c}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ===== TAGS =====
function renderAdminTags() {
    const container = document.getElementById('adminTagList');
    const tags = getTags();
    if (tags.length === 0) {
        container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px 0;">هیچ تگی وجود ندارد</p>';
        return;
    }
    container.innerHTML = tags.map(t => `
        <div class="admin-item">
            <span><i class="fas fa-hashtag"></i> ${t}</span>
            <div class="actions">
                <button class="delete-btn" onclick="deleteTag('${t}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ===== FORM =====
function setupAdminForm() {
    const form = document.getElementById('adminForm');
    if (!form) return;

    // Populate category select
    updateCategorySelect();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const title = document.getElementById('productTitle').value.trim();
        const category = document.getElementById('productCategory').value;
        const tags = document.getElementById('productTags').value.split(',').map(t => t.trim()).filter(Boolean);
        const price = parseInt(document.getElementById('productPrice').value);
        const image = document.getElementById('productImage').value.trim();
        const description = document.getElementById('productDesc').value.trim();

        if (!title || !category || !price) {
            return alert('عنوان، دسته‌بندی و قیمت الزامی هستند');
        }

        const discount = {
            type: document.getElementById('discountType').value,
            value: document.getElementById('discountValue').value.trim(),
            start: document.getElementById('discountStart').value.trim(),
            end: document.getElementById('discountEnd').value.trim()
        };
        const finalDiscount = discount.type && discount.value ? discount : null;

        const data = { title, category, tags, price, image, description, discount: finalDiscount };

        if (id) {
            updateProduct(id, data);
            alert('✅ کالا ویرایش شد');
        } else {
            addProduct(data);
            alert('✅ کالا اضافه شد');
        }

        form.reset();
        document.getElementById('editId').value = '';
        renderAdminProducts();
        updateStats();
        updateCategorySelect();
        // Refresh other sections
        renderAdminCategories();
        renderAdminTags();
    });
}

function updateCategorySelect() {
    const select = document.getElementById('productCategory');
    const categories = getCategories();
    const current = select.value;
    select.innerHTML = '<option value="">دسته‌بندی *</option>' +
        categories.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

function editProduct(id) {
    const p = getProductById(id);
    if (!p) return alert('کالا یافت نشد');
    document.getElementById('editId').value = p.id;
    document.getElementById('productTitle').value = p.title || '';
    document.getElementById('productCategory').value = p.category || '';
    document.getElementById('productTags').value = p.tags ? p.tags.join('، ') : '';
    document.getElementById('productPrice').value = p.price || '';
    document.getElementById('productImage').value = p.image || '';
    document.getElementById('productDesc').value = p.description || '';
    if (p.discount) {
        document.getElementById('discountType').value = p.discount.type || '';
        document.getElementById('discountValue').value = p.discount.value || '';
        document.getElementById('discountStart').value = p.discount.start || '';
        document.getElementById('discountEnd').value = p.discount.end || '';
    } else {
        document.getElementById('discountType').value = '';
        document.getElementById('discountValue').value = '';
        document.getElementById('discountStart').value = '';
        document.getElementById('discountEnd').value = '';
    }
    // Switch to add tab
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="add"]').classList.add('active');
    document.getElementById('tab-add').classList.add('active');
    document.getElementById('adminForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProductHandler(id) {
    if (confirm('آیا از حذف این کالا مطمئن هستید؟')) {
        deleteProduct(id);
        renderAdminProducts();
        updateStats();
        updateCategorySelect();
        renderAdminCategories();
        renderAdminTags();
        alert('✅ کالا حذف شد');
    }
}

// ===== CATEGORY & TAG MANAGEMENT =====
function setupCategoryTagAdd() {
    document.getElementById('addCategoryBtn').addEventListener('click', function() {
        const name = document.getElementById('newCategory').value.trim();
        if (!name) return alert('نام دسته‌بندی را وارد کنید');
        // Add a dummy product with this category to create it
        const products = getProducts();
        if (products.some(p => p.category === name)) {
            return alert('این دسته‌بندی قبلاً وجود دارد');
        }
        addProduct({ title: 'نمونه', category: name, tags: [], price: 0, description: '', image: '', discount: null });
        document.getElementById('newCategory').value = '';
        renderAdminCategories();
        updateStats();
        updateCategorySelect();
        alert('✅ دسته‌بندی اضافه شد');
    });

    document.getElementById('addTagBtn').addEventListener('click', function() {
        const name = document.getElementById('newTag').value.trim();
        if (!name) return alert('نام تگ را وارد کنید');
        const products = getProducts();
        // Add tag to first product
        if (products.length === 0) {
            addProduct({ title: 'نمونه', category: 'متفرقه', tags: [name], price: 0, description: '', image: '', discount: null });
        } else {
            const p = products[0];
            const tags = p.tags || [];
            if (tags.includes(name)) return alert('این تگ قبلاً وجود دارد');
            tags.push(name);
            updateProduct(p.id, { tags });
        }
        document.getElementById('newTag').value = '';
        renderAdminTags();
        updateStats();
        alert('✅ تگ اضافه شد');
    });
}

function deleteCategory(name) {
    if (confirm(`آیا از حذف دسته‌بندی "${name}" مطمئن هستید؟`)) {
        const products = getProducts();
        products.forEach(p => {
            if (p.category === name) {
                deleteProduct(p.id);
            }
        });
        renderAdminCategories();
        updateStats();
        updateCategorySelect();
        alert('✅ دسته‌بندی حذف شد');
    }
}

function deleteTag(name) {
    if (confirm(`آیا از حذف تگ "${name}" مطمئن هستید؟`)) {
        const products = getProducts();
        products.forEach(p => {
            if (p.tags && p.tags.includes(name)) {
                const tags = p.tags.filter(t => t !== name);
                updateProduct(p.id, { tags });
            }
        });
        renderAdminTags();
        updateStats();
        alert('✅ تگ حذف شد');
    }
}

// ===== EXPOSE TO GLOBAL =====
window.editProduct = editProduct;
window.deleteProductHandler = deleteProductHandler;
window.deleteCategory = deleteCategory;
window.deleteTag = deleteTag;
