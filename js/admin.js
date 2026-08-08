// ============================================================
//  ADMIN PANEL
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    renderAdminList();
    setupAdminForm();
});

function renderAdminList() {
    const container = document.getElementById('adminList');
    if (!container) return;

    const products = getProducts();
    if (products.length === 0) {
        container.innerHTML = `<p style="color:var(--muted); text-align:center; padding:20px 0;">هیچ کالایی ثبت نشده است</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="admin-item" data-id="${p.id}">
            <div>
                <strong>${p.title || 'بدون عنوان'}</strong>
                <span style="color:var(--muted); margin-right:12px;">${p.category || 'متفرقه'}</span>
                <span style="color:var(--muted); font-size:0.8rem;">${p.price.toLocaleString()} تومان</span>
                ${isInDiscount(p) ? `<span class="discount-tag">تخفیف ${getDiscountPercent(p)}%</span>` : ''}
            </div>
            <div class="actions">
                <button onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteProductHandler('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function setupAdminForm() {
    const form = document.getElementById('adminForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const id = document.getElementById('editId').value;
        const title = document.getElementById('productTitle').value.trim();
        const category = document.getElementById('productCategory').value.trim();
        const tags = document.getElementById('productTags').value.split(',').map(t => t.trim()).filter(Boolean);
        const price = parseInt(document.getElementById('productPrice').value);
        const image = document.getElementById('productImage').value.trim();
        const description = document.getElementById('productDesc').value.trim();

        if (!title || !category || !price) {
            alert('عنوان، دسته‌بندی و قیمت الزامی هستند');
            return;
        }

        const discount = {
            type: document.getElementById('discountType').value.trim(),
            value: document.getElementById('discountValue').value.trim(),
            start: document.getElementById('discountStart').value.trim(),
            end: document.getElementById('discountEnd').value.trim()
        };

        // Remove discount if empty
        const finalDiscount = discount.type && discount.value ? discount : null;

        const productData = {
            title,
            category,
            tags,
            price,
            image,
            description,
            discount: finalDiscount
        };

        if (id) {
            // Update
            updateProduct(id, productData);
            alert('✅ کالا با موفقیت ویرایش شد');
        } else {
            // Add
            addProduct(productData);
            alert('✅ کالا با موفقیت اضافه شد');
        }

        form.reset();
        document.getElementById('editId').value = '';
        renderAdminList();
        renderProducts();
        renderSpecialOffers();
    });
}

function editProduct(id) {
    const product = getProductById(id);
    if (!product) {
        alert('کالا یافت نشد');
        return;
    }

    document.getElementById('editId').value = product.id;
    document.getElementById('productTitle').value = product.title || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productTags').value = product.tags ? product.tags.join('، ') : '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDesc').value = product.description || '';

    if (product.discount) {
        document.getElementById('discountType').value = product.discount.type || '';
        document.getElementById('discountValue').value = product.discount.value || '';
        document.getElementById('discountStart').value = product.discount.start || '';
        document.getElementById('discountEnd').value = product.discount.end || '';
    } else {
        document.getElementById('discountType').value = '';
        document.getElementById('discountValue').value = '';
        document.getElementById('discountStart').value = '';
        document.getElementById('discountEnd').value = '';
    }

    // Scroll to form
    document.getElementById('adminForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProductHandler(id) {
    if (confirm('آیا از حذف این کالا مطمئن هستید؟')) {
        deleteProduct(id);
        renderAdminList();
        renderProducts();
        renderSpecialOffers();
        alert('✅ کالا حذف شد');
    }
}

// ============================================================
//  EXPOSE FUNCTIONS TO GLOBAL
// ============================================================

window.editProduct = editProduct;
window.deleteProductHandler = deleteProductHandler;