(() => {
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const ORDER_STATUS_META = {
    pending: { label: 'Chờ xác nhận', cls: 'status-pending' },
    confirmed: { label: 'Đã xác nhận', cls: 'status-confirmed' },
    shipping: { label: 'Đang giao', cls: 'status-shipping' },
    completed: { label: 'Hoàn thành', cls: 'status-completed' },
    cancelled: { label: 'Đã hủy', cls: 'status-cancelled' }
  };

  const CREATOR_CATEGORIES = [
    'Lau bề mặt & Bếp',
    'Rửa chén & Lau sàn',
    'Xịt thơm & Khử mùi',
    'Combo tiết kiệm',
    'Thủ công từ vỏ quả'
  ];

  const MODERATION_META = {
    approved: {
      label: 'Đã duyệt & Mở bán',
      shortLabel: 'Đã duyệt AI',
      cls: 'ai-approved',
      icon: 'ph-seal-check'
    },
    rejected: {
      label: 'Chưa đạt — Cần chỉnh sửa',
      shortLabel: 'Bị từ chối',
      cls: 'ai-rejected',
      icon: 'ph-x-circle'
    },
    needs_review: {
      label: 'Chờ xem xét thêm',
      shortLabel: 'Chờ xem xét',
      cls: 'ai-review',
      icon: 'ph-warning-circle'
    },
    pending: {
      label: 'Đang chờ duyệt',
      shortLabel: 'Đang chờ duyệt',
      cls: 'ai-pending',
      icon: 'ph-clock'
    }
  };

  function getModerationMeta(status) {
    return MODERATION_META[status] || MODERATION_META.pending;
  }

  function formatAiSuggestions(val) {
    if (!val) return '';
    if (Array.isArray(val)) return val.filter(Boolean).join(' • ');
    return String(val).trim();
  }

  function renderAiScanningHtml(productName) {
    return `
      <div class="ai-mod-card ai-scanning">
        <div class="ai-mod-head">
          <span class="ai-scan-orb"><i class="ph-duotone ph-sparkle pv-duotone" style="font-size:22px;"></i></span>
          <div>
            <strong>Đang gửi sản phẩm lên hệ thống...</strong>
            <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(productName || 'Sản phẩm mới')}</div>
          </div>
        </div>
        <div class="ai-scan-track"><div class="ai-scan-beam"></div></div>
      </div>
    `;
  }

  function renderAiResultCardHtml(res) {
    const status = res.moderation_status || res.status || 'pending';
    const meta = getModerationMeta(status);
    const score = Number.isFinite(Number(res.ai_score)) ? Math.max(0, Math.min(100, Math.round(Number(res.ai_score)))) : null;
    const note = res.ai_review_note || res.review_note || '';
    const suggestions = formatAiSuggestions(res.ai_suggestions || res.suggestions);

    return `
      <div class="ai-mod-card ${meta.cls}">
        <div class="ai-mod-head" style="justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ai-status-icon ${meta.cls}">
              <i class="ph-duotone ${meta.icon} pv-duotone" style="font-size:22px;"></i>
            </span>
            <div>
              <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;opacity:0.8;">Kết quả kiểm duyệt sản phẩm</div>
              <strong style="font-size:1rem;">${meta.label}</strong>
            </div>
          </div>
          ${
            score !== null
              ? `<div class="ai-score-badge">Điểm phù hợp: <strong>${score}/100</strong></div>`
              : ''
          }
        </div>
        ${
          score !== null
            ? `<div class="ai-score-track"><div class="ai-score-fill ${meta.cls}" style="width:${score}%;"></div></div>`
            : ''
        }
        ${note ? `<div class="ai-mod-note"><strong>Nhận xét:</strong> ${escapeHtml(note)}</div>`: ''}
        ${suggestions ? `<div class="ai-mod-suggest"><strong>Gợi ý chỉnh sửa:</strong> ${escapeHtml(suggestions)}</div>`: ''}
      </div>
    `;
  }

  async function runAiModeration(productId) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase chưa sẵn sàng.');
    const { data, error } = await sb.functions.invoke('super-responder', {
      body: { product_id: productId }
    });
    if (error) throw error;

    const payload = (data && (data.product || data.data || data)) || {};
    // Also fetch latest persisted row to guarantee accurate status/notes
    try {
      const { data: fresh } = await sb.from('products').select('*').eq('id', productId).maybeSingle();
      if (fresh) {
        return {
          ...payload,
          ...fresh,
          moderation_status: fresh.moderation_status || payload.moderation_status || payload.status || 'pending'
        };
      }
    } catch {
      // Fallback to edge function payload
    }
    return payload;
  }

  function getClient() {
    return window.PEELVERSE_AUTH && window.PEELVERSE_AUTH.supabase;
  }

  function formatVND(amount) {
    return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
  }

  function toast(msg, type = 'success') {
    if (window.PEELVERSE_TOAST) {
      window.PEELVERSE_TOAST(msg, type);
      return;
    }
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function translateDbError(err) {
    const raw = String((err && (err.message || err.details || err.hint)) || '').toLowerCase();
    if (raw.includes('permission denied') || raw.includes('row-level security') || raw.includes('policy')) {
      return 'Bạn không có quyền thực hiện thao tác này (kiểm tra phân quyền Supabase RLS).';
    }
    if (raw.includes('failed to fetch') || raw.includes('network')) {
      return 'Lỗi kết nối mạng đến Supabase. Vui lòng thử lại sau giây lát.';
    }
    if (raw.includes('bucket not found')) {
      return 'Không tìm thấy Storage bucket "product-images" trên Supabase.';
    }
    return (err && err.message) || 'Đã xảy ra lỗi khi đồng bộ dữ liệu.';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ===== SUPABASE DATA ACCESS =====
  async function fetchProfile(userId) {
    const sb = getClient();
    if (!sb || !userId) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function upsertProfile(profile) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase chưa sẵn sàng.');
    const payload = {
      id: profile.id,
      full_name: profile.full_name || '',
      role: profile.role === 'creator' ? 'creator' : 'user',
      shop_name: profile.role === 'creator' ? (profile.shop_name || '').trim() : null,
      phone: (profile.phone || '').trim() || null
    };
    const { data, error } = await sb
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  function normalizeCommunityProduct(row) {
    const shopName =
      (row.profiles && row.profiles.shop_name) ||
      row.shop_name ||
      'Nhà sáng tạo PEELVERSE';
    return {
      id: `sb_${row.id}`,
      dbId: row.id,
      creatorId: row.creator_id || null,
      source: 'creator',
      shopName,
      aiVerified: row.moderation_status === 'approved',
      aiScore: row.ai_score ?? null,
      name: row.name || 'Sản phẩm xanh',
      category: row.category || 'Thủ công từ vỏ quả',
      price: Number(row.price || 0),
      stock: Number(row.stock ?? 0),
      isActive: row.is_active !== false,
      badge: `${shopName}`,
      image: row.image_url || 'assets/images/prod-table-spray.jpg',
      desc: row.description || 'Sản phẩm sinh học thủ công từ cộng đồng Nhà sáng tạo PEELVERSE.',
      specs: {
        volume: `${row.volume || 'Tiêu chuẩn'}`,
        peel: `${row.peel_ingredients || 'Chiết xuất vỏ trái cây'}`,
        benefit: Number(row.stock ?? 0) > 0 ? `Còn ${row.stock} sản phẩm`: 'Tạm hết hàng'
      }
    };
  }

  async function fetchActiveCommunityProducts() {
    const sb = getClient();
    if (!sb) return [];
    // Public storefront ONLY shows products where is_active = true AND moderation_status = 'approved'
    let { data, error } = await sb
      .from('products')
      .select('*, profiles(shop_name, full_name)')
      .eq('is_active', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      const plain = await sb
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });
      if (plain.error) throw plain.error;
      data = plain.data;
    }
    return (data || []).map(normalizeCommunityProduct);
  }

  async function fetchMyProducts(creatorId) {
    const sb = getClient();
    if (!sb || !creatorId) return [];
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function uploadProductImage(file, creatorId) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase chưa sẵn sàng.');
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.');
    }
    if (file.size >MAX_IMAGE_BYTES) {
      throw new Error('Ảnh vượt quá giới hạn 2MB. Vui lòng chọn ảnh nhẹ hơn.');
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const filePath = `${creatorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadErr } = await sb.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) throw uploadErr;

    const { data } = sb.storage.from('product-images').getPublicUrl(filePath);
    return data && data.publicUrl ? data.publicUrl : '';
  }

  async function createProduct(payload) {
    const sb = getClient();
    const { data, error } = await sb.from('products').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function updateProduct(productId, patch) {
    const sb = getClient();
    const { data, error } = await sb
      .from('products')
      .update(patch)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteProduct(productId) {
    const sb = getClient();
    const { error } = await sb.from('products').delete().eq('id', productId);
    if (error) throw error;
  }

  async function createOrdersForCart({ user, cartItems, allProducts, customer }) {
    const sb = getClient();
    if (!sb || !user) throw new Error('Vui lòng đăng nhập để đặt hàng.');

    const rows = cartItems
      .map((entry) => {
        const prod = allProducts.find((p) => p.id === entry.id);
        if (!prod) return null;
        return {
          buyer_id: user.id,
          creator_id: prod.creatorId || null,
          product_id: prod.dbId || null,
          product_name: prod.name,
          quantity: Number(entry.qty || 1),
          total_price: Number(prod.price) * Number(entry.qty || 1),
          buyer_name: customer.name,
          buyer_phone: customer.phone,
          shipping_address: customer.address,
          note: customer.note || '',
          status: 'pending'
        };
      })
      .filter(Boolean);

    if (rows.length === 0) throw new Error('Giỏ hàng không có sản phẩm hợp lệ.');
    const { data, error } = await sb.from('orders').insert(rows).select();
    if (error) throw error;
    return data || [];
  }

  async function fetchCreatorOrders(creatorId) {
    const sb = getClient();
    if (!sb || !creatorId) return [];
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function fetchBuyerOrders(buyerId) {
    const sb = getClient();
    if (!sb || !buyerId) return [];
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function updateOrderStatus(orderId, status) {
    const sb = getClient();
    const { data, error } = await sb
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  function renderSkeletonCards(count = 3) {
    return `
      <div class="skeleton-grid">
        ${Array.from({ length: count })
          .map(
            () => `
          <div class="skeleton-card">
            <div class="skeleton-line tall"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // ===== CREATOR STUDIO VIEW (3 TABS) =====
  let activeCreatorTab = 'publish'; // 'publish' | 'products' | 'orders'

  function renderCreatorStudio(view, { user, profile, onProductsChanged }) {
    if (!user || !profile || profile.role !== 'creator') {
      view.innerHTML = `
        <div class="info-box" style="text-align:center;padding:38px 22px;border-radius:24px;">
          <div style="margin-bottom:10px;color:#EA580C;"><i class="ph-duotone ph-storefront pv-duotone" style="font-size:44px;"></i></div>
          <h2 style="margin-bottom:8px;">Kênh Nhà sáng tạo dành riêng cho Creator</h2>
          <p style="color:var(--text-muted);max-width:460px;margin:0 auto 18px;">
            Nâng cấp tài khoản của bạn lên vai trò <strong>Nhà sáng tạo</strong>để đăng bán sản phẩm sinh học từ vỏ trái cây và quản lý đơn hàng trực tiếp trên PEELVERSE!
          </p>
          <button type="button" class="btn btn-orange" id="promptUpgradeCreatorBtn">Đăng ký làm Nhà sáng tạo ngay →</button>
        </div>
      `;
      const btn = view.querySelector('#promptUpgradeCreatorBtn');
      if (btn && window.PEELVERSE_AUTH && window.PEELVERSE_AUTH.openUpgradeModal) {
        btn.addEventListener('click', window.PEELVERSE_AUTH.openUpgradeModal);
      }
      return;
    }

    view.innerHTML = `
      <section class="creator-hero">
        <div>
          <span class="hero-badge" style="background:rgba(234,88,12,0.14);color:#C2410C;">CREATOR STUDIO • PEELVERSE</span>
          <h1 class="inline-icon-heading" style="font-size:clamp(1.55rem,2.8vw,2.05rem);margin-bottom:4px;">
            <i class="ph-duotone ph-storefront pv-duotone" style="font-size:28px;color:#EA580C;"></i>
            <span>Kênh Nhà sáng tạo</span>
          </h1>
          <p style="color:var(--text-muted);font-size:0.9rem;">
            Gian hàng: <strong>${escapeHtml(profile.shop_name || profile.full_name || 'Gian hàng xanh')}</strong>
            ${profile.phone ? `• SĐT: <strong>${escapeHtml(profile.phone)}</strong>`: ''}
          </p>
        </div>
        <div class="creator-tabs" role="tablist">
          <button type="button" class="creator-tab-btn ${activeCreatorTab === 'publish' ? 'active' : ''}" data-ctab="publish">
            <i class="ph-duotone ph-plus-circle pv-duotone"></i> <span>Đăng sản phẩm mới</span>
          </button>
          <button type="button" class="creator-tab-btn ${activeCreatorTab === 'products' ? 'active' : ''}" data-ctab="products">
            <i class="ph-duotone ph-package pv-duotone"></i> <span>Sản phẩm của tôi</span>
          </button>
          <button type="button" class="creator-tab-btn ${activeCreatorTab === 'orders' ? 'active' : ''}" data-ctab="orders">
            <i class="ph-duotone ph-receipt pv-duotone"></i> <span>Đơn đặt hàng</span>
          </button>
        </div>
      </section>

      <div id="creatorTabBody"></div>
    `;

    view.querySelectorAll('[data-ctab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCreatorTab = btn.dataset.ctab;
        renderCreatorStudio(view, { user, profile, onProductsChanged });
      });
    });

    const tabBody = view.querySelector('#creatorTabBody');
    if (activeCreatorTab === 'publish') {
      renderPublishTab(tabBody, { user, profile, onProductsChanged });
    } else if (activeCreatorTab === 'products') {
      renderMyProductsTab(tabBody, { user, onProductsChanged });
    } else {
      renderCreatorOrdersTab(tabBody, { user });
    }
  }

  function renderPublishTab(container, { user, profile, onProductsChanged }) {
    container.innerHTML = `
      <form id="creatorPublishForm" class="creator-form-card">
        <div class="creator-form-grid">
          <div class="form-field">
            <label for="cpName">Tên sản phẩm *</label>
            <input id="cpName" type="text" required placeholder="VD: Xịt Lau Bếp Tinh Dầu Vỏ Bưởi 300ml" />
          </div>
          <div class="form-field">
            <label for="cpCategory">Danh mục *</label>
            <select id="cpCategory" class="creator-select">
              ${CREATOR_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="cpPrice">Giá bán (VNĐ) *</label>
            <input id="cpPrice" type="number" min="1000" step="1000" required placeholder="VD: 65000" />
          </div>
          <div class="form-field">
            <label for="cpStock">Số lượng tồn kho *</label>
            <input id="cpStock" type="number" min="0" required value="20" />
          </div>
          <div class="form-field">
            <label for="cpVolume">Dung tích / Quy cách *</label>
            <input id="cpVolume" type="text" required placeholder="VD: Chai 300ml / Bộ 2 chai" />
          </div>
          <div class="form-field">
            <label for="cpPeel">Thành phần vỏ quả *</label>
            <input id="cpPeel" type="text" required placeholder="VD: Vỏ bưởi, vỏ cam ngọt & sả" />
          </div>
          <div class="form-field" style="grid-column:1/-1;">
            <label for="cpDesc">Mô tả chi tiết *</label>
            <textarea id="cpDesc" rows="3" required placeholder="Mô tả công dụng, mùi hương, cách dùng an toàn..."></textarea>
          </div>

          <div class="form-field">
            <label for="cpImageFile">Tải ảnh sản phẩm lên Supabase Storage (JPG/PNG/WebP, ≤ 2MB)</label>
            <input id="cpImageFile" type="file" accept="image/jpeg,image/png,image/webp" />
            <div id="cpImagePreviewWrap" class="cp-preview-wrap hidden">
              <img id="cpImagePreview" alt="Xem trước ảnh sản phẩm" />
            </div>
          </div>

          <div class="form-field">
            <label for="cpImageUrl">Hoặc dán URL ảnh dự phòng</label>
            <input id="cpImageUrl" type="url" placeholder="https://..." />
            <small style="color:var(--text-muted);font-size:0.75rem;">Nếu có chọn file ảnh bên trái, hệ thống sẽ ưu tiên tải file lên bucket <code>product-images</code>.</small>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-top:16px;">
          <button type="submit" id="cpSubmitBtn" class="btn btn-orange" style="min-width:132px;">
            <span>Đăng</span>
          </button>
          <span style="font-size:12px;color:var(--text-muted);">Lưu ý: Kiểm duyệt mất 1–2 ngày.</span>
        </div>
      </form>
      <div id="publishAiModerationArea" style="margin-top:16px;"></div>
    `;

    const fileInput = container.querySelector('#cpImageFile');
    const previewWrap = container.querySelector('#cpImagePreviewWrap');
    const previewImg = container.querySelector('#cpImagePreview');
    const aiArea = container.querySelector('#publishAiModerationArea');

    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) {
        previewWrap.classList.add('hidden');
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP!', 'warning');
        fileInput.value = '';
        previewWrap.classList.add('hidden');
        return;
      }
      if (f.size >MAX_IMAGE_BYTES) {
        toast('Ảnh vượt quá 2MB. Vui lòng chọn ảnh nhẹ hơn!', 'warning');
        fileInput.value = '';
        previewWrap.classList.add('hidden');
        return;
      }
      previewImg.src = URL.createObjectURL(f);
      previewWrap.classList.remove('hidden');
    });

    const form = container.querySelector('#creatorPublishForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#cpSubmitBtn');
      const prodName = container.querySelector('#cpName').value.trim();
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span>Đang đăng...';

      try {
        let imageUrl = container.querySelector('#cpImageUrl').value.trim();
        const file = fileInput.files && fileInput.files[0];
        if (file) {
          imageUrl = await uploadProductImage(file, user.id);
        }

        // Step A: Save product as pending & inactive before moderation
        const payload = {
          creator_id: user.id,
          shop_name: profile.shop_name || profile.full_name || 'Nhà sáng tạo PEELVERSE',
          name: prodName,
          category: container.querySelector('#cpCategory').value,
          price: Number(container.querySelector('#cpPrice').value),
          stock: Number(container.querySelector('#cpStock').value || 0),
          volume: container.querySelector('#cpVolume').value.trim(),
          peel_ingredients: container.querySelector('#cpPeel').value.trim(),
          description: container.querySelector('#cpDesc').value.trim(),
          image_url: imageUrl || 'assets/images/prod-table-spray.jpg',
          moderation_status: 'pending',
          is_active: false
        };

        const savedProduct = await createProduct(payload);

        // Step B: Show smooth submitting state
        aiArea.innerHTML = renderAiScanningHtml(prodName);
        aiArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Step C: Call Supabase Edge Function `super-responder`
        try {
          const modResult = await runAiModeration(savedProduct.id);
          // Step D: Render clear moderation result card
          aiArea.innerHTML = renderAiResultCardHtml(modResult);
          const status = modResult.moderation_status || modResult.status || 'pending';
          if (status === 'approved') {
            toast('Sản phẩm đã được duyệt và mở bán thành công!');
            form.reset();
            previewWrap.classList.add('hidden');
          } else if (status === 'rejected') {
            toast('Sản phẩm chưa đạt kiểm duyệt. Xem gợi ý chỉnh sửa bên dưới!', 'warning');
          } else {
            toast('⏳ Sản phẩm đã được gửi và đang chờ kiểm duyệt.');
          }
        } catch (aiErr) {
          aiArea.innerHTML = renderAiResultCardHtml({
            moderation_status: 'pending',
            ai_review_note: 'Sản phẩm đã được gửi lên hệ thống và đang chờ kiểm duyệt (dự kiến 1–2 ngày).'
          });
          toast('Đã gửi sản phẩm lên hệ thống chờ kiểm duyệt.');
        }

        if (onProductsChanged) onProductsChanged();
      } catch (err) {
        toast(`${translateDbError(err)}`, 'warning');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Đăng</span>';
      }
    });
  }

  async function renderMyProductsTab(container, { user, onProductsChanged }) {
    container.innerHTML = renderSkeletonCards(3);
    try {
      const items = await fetchMyProducts(user.id);
      if (items.length === 0) {
        container.innerHTML = `
          <div class="info-box" style="text-align:center;padding:36px;">
            <p style="color:var(--text-muted);margin-bottom:12px;">Bạn chưa đăng sản phẩm nào lên PEELVERSE.</p>
            <button type="button" class="btn btn-orange btn-sm" id="jumpPublishBtn">+ Đăng sản phẩm đầu tiên</button>
          </div>
        `;
        const jBtn = container.querySelector('#jumpPublishBtn');
        if (jBtn) {
          jBtn.addEventListener('click', () => {
            const tabBtn = document.querySelector('[data-ctab="publish"]');
            if (tabBtn) tabBtn.click();
          });
        }
        return;
      }

      container.innerHTML = `
        <div id="myProductsAiArea" style="margin-bottom:14px;"></div>
        <div class="creator-products-list">
          ${items
            .map((p) => {
              const modStatus = p.moderation_status || 'pending';
              const modMeta = getModerationMeta(modStatus);
              const isApproved = modStatus === 'approved';
              const hasScore = p.ai_score !== null && p.ai_score !== undefined;
              const suggestions = formatAiSuggestions(p.ai_suggestions);
              return `
            <article class="creator-prod-row" data-pid="${p.id}">
              <img src="${escapeHtml(p.image_url || 'assets/images/prod-table-spray.jpg')}" alt="${escapeHtml(p.name)}" class="creator-prod-thumb" />
              <div class="creator-prod-info">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong>${escapeHtml(p.name)}</strong>
                  <span class="ai-pill-badge ${modMeta.cls}">
                    <i class="ph-duotone ${modMeta.icon} pv-duotone" style="font-size:14px;"></i>
                    <span>${modMeta.shortLabel}</span>
                  </span>
                  ${hasScore ? `<span class="ai-score-mini">AI: ${Math.round(Number(p.ai_score))}/100</span>`: ''}
                  <span class="order-status-badge ${p.is_active && isApproved ? 'status-completed' : 'status-cancelled'}">
                    ${p.is_active && isApproved ? 'Đang bán' : 'Đang ẩn'}
                  </span>
                </div>
                <div style="font-size:0.84rem;color:var(--text-muted);margin-top:4px;">
                  ${escapeHtml(p.category || '')} • Giá: <strong style="color:var(--orange-deep);">${formatVND(p.price)}</strong> • Tồn kho: <strong>${p.stock ?? 0}</strong>
                </div>
                ${
                  p.ai_review_note || suggestions
                    ? `<div class="ai-inline-reason ${modMeta.cls}">
                        ${p.ai_review_note ? `<div><strong>AI nhận xét:</strong> ${escapeHtml(p.ai_review_note)}</div>`: ''}
                        ${suggestions ? `<div><strong>Gợi ý:</strong> ${escapeHtml(suggestions)}</div>`: ''}
                      </div>`
                    : ''
                }
                <div class="creator-quick-edit hidden" id="editBox-${p.id}">
                  <input type="text" class="qe-name" value="${escapeHtml(p.name || '')}" placeholder="Tên sản phẩm" />
                  <input type="number" class="qe-price" value="${p.price}" min="1000" step="1000" placeholder="Giá VNĐ" />
                  <input type="number" class="qe-stock" value="${p.stock ?? 0}" min="0" placeholder="Tồn kho" />
                  <input type="text" class="qe-desc" value="${escapeHtml(p.description || '')}" placeholder="Mô tả chi tiết" style="flex:1;min-width:180px;max-width:none;" />
                  <button type="button" class="btn btn-primary btn-sm" data-save-edit="${p.id}">Lưu &amp; AI duyệt lại</button>
                </div>
              </div>
              <div class="creator-prod-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-toggle-active="${p.id}" data-cur="${p.is_active ? '1' : '0'}" ${!isApproved ? 'disabled title="Cần đạt trạng thái Đã duyệt AI trước khi mở bán"' : ''}>
                  ${!isApproved ? 'Chưa duyệt' : p.is_active ? 'Tạm ẩn' : 'Mở bán'}
                </button>
                <button type="button" class="btn ${modStatus === 'rejected' || modStatus === 'pending' ? 'btn-orange' : 'btn-secondary'} btn-sm" data-open-edit="${p.id}">
                  ${modStatus === 'rejected' || modStatus === 'pending' ? 'Chỉnh sửa & Gửi AI duyệt lại' : 'Sửa nhanh'}
                </button>
                <button type="button" class="btn btn-secondary btn-sm danger-outline" data-delete-prod="${p.id}">Xóa</button>
              </div>
            </article>
          `;
            })
            .join('')}
        </div>
      `;

      const aiArea = container.querySelector('#myProductsAiArea');

      container.querySelectorAll('[data-toggle-active]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (btn.disabled) return;
          const next = btn.dataset.cur !== '1';
          btn.disabled = true;
          try {
            await updateProduct(btn.dataset.toggleActive, { is_active: next });
            toast(next ? 'Đã bật hiển thị sản phẩm!' : '⏸ Đã tạm ẩn sản phẩm.');
            if (onProductsChanged) onProductsChanged();
            renderMyProductsTab(container, { user, onProductsChanged });
          } catch (err) {
            toast(`${translateDbError(err)}`, 'warning');
            btn.disabled = false;
          }
        });
      });

      container.querySelectorAll('[data-open-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const box = container.querySelector(`#editBox-${btn.dataset.openEdit}`);
          if (box) box.classList.toggle('hidden');
        });
      });

      container.querySelectorAll('[data-save-edit]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.saveEdit;
          const box = container.querySelector(`#editBox-${id}`);
          const name = box.querySelector('.qe-name').value.trim();
          const price = Number(box.querySelector('.qe-price').value);
          const stock = Number(box.querySelector('.qe-stock').value);
          const description = box.querySelector('.qe-desc').value.trim();
          btn.disabled = true;
          btn.innerHTML = '<span class="auth-spinner"></span>Đang duyệt...';
          try {
            // Step A: Update product & set pending/inactive for AI re-moderation
            await updateProduct(id, {
              name,
              price,
              stock,
              description,
              moderation_status: 'pending',
              is_active: false
            });
            // Step B & C: Show scanning bar and invoke super-responder
            if (aiArea) {
              aiArea.innerHTML = renderAiScanningHtml(name);
              aiArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            const modResult = await runAiModeration(id);
            const status = modResult.moderation_status || modResult.status || 'pending';
            toast(
              status === 'approved'
                ? 'Sản phẩm đã được duyệt lại & mở bán!'
                : 'Đã cập nhật trạng thái kiểm duyệt sản phẩm.'
            );
            if (onProductsChanged) onProductsChanged();
            await renderMyProductsTab(container, { user, onProductsChanged });
            const refreshedArea = container.querySelector('#myProductsAiArea');
            if (refreshedArea) {
              refreshedArea.innerHTML = renderAiResultCardHtml(modResult);
            }
          } catch (err) {
            toast(`${translateDbError(err)}`, 'warning');
            btn.disabled = false;
            btn.textContent = 'Lưu & AI duyệt lại';
          }
        });
      });

      container.querySelectorAll('[data-delete-prod]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi PEELVERSE?')) return;
          btn.disabled = true;
          try {
            await deleteProduct(btn.dataset.deleteProd);
            toast('Đã xóa sản phẩm.');
            if (onProductsChanged) onProductsChanged();
            renderMyProductsTab(container, { user, onProductsChanged });
          } catch (err) {
            toast(`${translateDbError(err)}`, 'warning');
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="info-box warning-box"> ${escapeHtml(translateDbError(err))}</div>`;
    }
  }

  async function renderCreatorOrdersTab(container, { user }) {
    container.innerHTML = renderSkeletonCards(3);
    try {
      const orders = await fetchCreatorOrders(user.id);
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="info-box" style="text-align:center;padding:36px;">
            <p style="color:var(--text-muted);">Chưa có đơn đặt hàng nào cho gian hàng của bạn.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="orders-list">
          ${orders
            .map((o) => {
              const meta = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.pending;
              const shortId = String(o.id).slice(0, 8).toUpperCase();
              return `
              <article class="order-card">
                <div class="order-card-head">
                  <div>
                    <strong>Đơn #${shortId}</strong>
                    <span class="order-date">${o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}</span>
                  </div>
                  <span class="order-status-badge ${meta.cls}">${meta.label}</span>
                </div>
                <div class="order-card-body">
                  <div><strong>Sản phẩm:</strong> ${escapeHtml(o.product_name || 'Sản phẩm')} × ${o.quantity || 1}</div>
                  <div><strong>Tổng tiền:</strong> <span style="color:var(--orange-deep);font-weight:800;">${formatVND(o.total_price)}</span></div>
                  <div><strong>Người mua:</strong> ${escapeHtml(o.buyer_name || '')} • ${escapeHtml(o.buyer_phone || '')}</div>
                  <div><strong>Địa chỉ:</strong> ${escapeHtml(o.shipping_address || '')}</div>
                  ${o.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(o.note)}</div>`: ''}
                </div>
                <div class="order-card-foot">
                  <label style="font-size:0.8rem;font-weight:700;color:var(--green-dark);">Cập nhật trạng thái:</label>
                  <select class="sort-select" data-order-status="${o.id}">
                    ${Object.entries(ORDER_STATUS_META)
                      .map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`)
                      .join('')}
                  </select>
                </div>
              </article>
            `;
            })
            .join('')}
        </div>
      `;

      container.querySelectorAll('[data-order-status]').forEach((sel) => {
        sel.addEventListener('change', async () => {
          const orderId = sel.dataset.orderStatus;
          const nextStatus = sel.value;
          sel.disabled = true;
          try {
            await updateOrderStatus(orderId, nextStatus);
            toast(`Đã cập nhật đơn sang "${ORDER_STATUS_META[nextStatus].label}"!`);
            renderCreatorOrdersTab(container, { user });
          } catch (err) {
            toast(`${translateDbError(err)}`, 'warning');
            sel.disabled = false;
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="info-box warning-box"> ${escapeHtml(translateDbError(err))}</div>`;
    }
  }

  function resolveOrderThumb(order) {
    if (order && order.product_image) return order.product_image;
    const official = (window.PEELVERSE_DATA && window.PEELVERSE_DATA.shopProducts) || [];
    const byId = official.find((p) => p.id === order.product_id);
    if (byId && byId.image) return byId.image;
    const nameLower = String(order.product_name || '').toLowerCase();
    const byName = official.find((p) => String(p.name || '').toLowerCase() === nameLower);
    if (byName && byName.image) return byName.image;
    return 'assets/images/prod-table-spray.jpg';
  }

  // ===== BUYER "ĐƠN HÀNG CỦA TÔI" VIEW =====
  async function renderBuyerOrdersPanel(container, user) {
    if (!user) {
      container.innerHTML = `<div class="info-box" style="text-align:center;padding:32px;">Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.</div>`;
      return;
    }
    container.innerHTML = renderSkeletonCards(3);
    try {
      const orders = await fetchBuyerOrders(user.id);
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="info-box" style="text-align:center;padding:36px;">
            <p style="color:var(--text-muted);">Bạn chưa có đơn đặt hàng nào. Hãy thêm sản phẩm làm sạch sinh học vào giỏ để đặt thử nhé!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="orders-list">
          ${orders
            .map((o) => {
              const meta = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.pending;
              const shortId = String(o.id).slice(0, 8).toUpperCase();
              const thumb = resolveOrderThumb(o);
              const dateStr = o.created_at
                ? new Date(o.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '';
              return `
              <article class="order-card buyer-order-card">
                <img src="${thumb}" alt="${escapeHtml(o.product_name || 'Sản phẩm')}" class="buyer-order-thumb" loading="lazy" onerror="this.onerror=null;this.src='assets/images/prod-table-spray.jpg';" />
                <div class="buyer-order-main">
                  <div class="buyer-order-top">
                    <div class="buyer-order-name">${escapeHtml(o.product_name || 'Sản phẩm')}</div>
                    <span class="order-status-badge ${meta.cls}">${meta.label}</span>
                  </div>
                  <div class="buyer-order-meta">
                    <span>SL: <strong>×${o.quantity || 1}</strong></span>
                    <span class="buyer-order-total">${formatVND(o.total_price)}</span>
                    <span>#${shortId}${dateStr ? ` • ${dateStr}` : ''}</span>
                  </div>
                  ${
                    o.shipping_address
                      ? `<div class="buyer-order-address">${escapeHtml(o.shipping_address)}${o.buyer_phone ? ` • ${escapeHtml(o.buyer_phone)}` : ''}</div>`
                      : ''
                  }
                  ${
                    o.status === 'pending'
                      ? `<div class="buyer-order-actions">
                          <span></span>
                          <button type="button" class="btn btn-secondary btn-sm danger-outline" data-cancel-order="${o.id}">Hủy đơn</button>
                        </div>`
                      : ''
                  }
                </div>
              </article>
            `;
            })
            .join('')}
        </div>
      `;

      container.querySelectorAll('[data-cancel-order]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
          btn.disabled = true;
          try {
            await updateOrderStatus(btn.dataset.cancelOrder, 'cancelled');
            toast('Đã hủy đơn hàng thành công.');
            renderBuyerOrdersPanel(container, user);
          } catch (err) {
            toast(`${translateDbError(err)}`, 'warning');
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="info-box warning-box"> ${escapeHtml(translateDbError(err))}</div>`;
    }
  }

  window.PEELVERSE_CREATOR = {
    fetchProfile,
    upsertProfile,
    fetchActiveCommunityProducts,
    createOrdersForCart,
    renderCreatorStudio,
    renderBuyerOrdersPanel,
    renderSkeletonCards,
    translateDbError
  };
})();
