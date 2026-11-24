(() => {
  const DATA = window.PEELVERSE_DATA;
  const GAMES = window.PEELVERSE_GAMES;
  const STORAGE_KEY = 'peelverse_progress_v1';
  const SESSION_ROUTE_KEY = 'peelverse_session_route_v1';
  const CART_STORAGE_KEY = 'peelverse_cart_v1';

  const defaultState = {
    exploredIngredients: [],
    completedSteps: [],
    completedScience: [],
    clearedGames: {}, // { stageId: bestScore }
    notifications: [
      ' Chào mừng bạn đến với PEELVERSE — From Peel to Purpose!',
      ' Mới: Khám phá bộ sản phẩm làm sạch sinh học từ vỏ trái cây trong mục Giỏ hàng!'
    ]
  };

  const OFFICIAL_PRODUCTS = ((DATA && Array.isArray(DATA.shopProducts)) ? DATA.shopProducts : []).map((p) => ({
    ...p,
    source: 'official',
    shopName: 'Chính hãng PEELVERSE',
    creatorId: null,
    dbId: null
  }));
  let communityProducts = [];
  let communityLoaded = false;
  let communityLoading = false;

  function getAllShopProducts() {
    return [...OFFICIAL_PRODUCTS, ...communityProducts];
  }

  let shopSourceFilter = 'Tất cả'; // 'Tất cả' | 'Chính hãng PEELVERSE' | 'Cộng đồng Nhà sáng tạo'
  let shopViewTab = 'catalog'; // 'catalog' | 'orders'

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneObj(defaultState);
      const merged = { ...cloneObj(defaultState), ...JSON.parse(raw) };
      const validIngIds = new Set((DATA && Array.isArray(DATA.ingredients) ? DATA.ingredients : []).map((i) => i.id));
      const origLen = Array.isArray(merged.exploredIngredients) ? merged.exploredIngredients.length : 0;
      merged.exploredIngredients = Array.isArray(merged.exploredIngredients)
        ? merged.exploredIngredients.filter((id) => validIngIds.has(id))
        : [];
      if (merged.exploredIngredients.length !== origLen) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    } catch {
      return cloneObj(defaultState);
    }
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const officialIds = new Set(OFFICIAL_PRODUCTS.map((p) => p.id));
      const cleaned = parsed.filter(
        (entry) =>
          entry &&
          Number(entry.qty) > 0 &&
          (officialIds.has(entry.id) || String(entry.id).startsWith('sb_'))
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  let state = loadState();
  let cart = loadCart(); // [{ id, qty }]
  let lastOrderSummary = null;

  const urlParams = new URLSearchParams(window.location.search);
  const initialRouteParam = urlParams.get('route');
  const initialHash = (window.location.hash || '').toLowerCase();
  const savedRoute = (() => {
    try {
      return localStorage.getItem(SESSION_ROUTE_KEY) || '';
    } catch {
      return '';
    }
  })();
  const allowedInitialRoutes = new Set(['home', 'about', 'shop', 'my-orders', 'lab', 'ingredients', 'process', 'science', 'game', 'creator']);
  let currentRoute =
    initialHash === '#mo-phong'
      ? 'game'
      : allowedInitialRoutes.has(initialRouteParam)
      ? initialRouteParam
      : allowedInitialRoutes.has(savedRoute)
      ? savedRoute
      : 'home';
  let activeLabTab = 'ingredients'; // 'ingredients' | 'process' | 'science'
  let activeIngredientId = null;
  let activeScienceId = null;
  let activeGameStageId = null;
  let ingredientFilter = 'Tất cả';
  let ingredientSort = 'default';
  let scienceFilter = 'Tất cả';
  let shopCategory = 'Tất cả';
  let shopPriceRange = 'all';
  let shopSort = 'rating-desc';

  function formatVND(amount) {
    return `${amount.toLocaleString('vi-VN')}đ`;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHeaderStats();
  }

  function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadges();
  }

  function getCartTotalQty() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function getCartTotalAmount() {
    const all = getAllShopProducts();
    return cart.reduce((sum, entry) => {
      const prod = all.find((p) => p.id === entry.id);
      return sum + (prod ? prod.price * entry.qty : 0);
    }, 0);
  }

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function triggerRouteProgressBar() {
    if (prefersReducedMotion()) return;
    const bar = document.getElementById('routeProgressBar');
    if (!bar) return;
    bar.classList.remove('running');
    void bar.offsetWidth;
    bar.classList.add('running');
  }

  function triggerCartBounce() {
    if (prefersReducedMotion()) return;
    ['cartToggleBtn', 'sidebarCartBadge', 'bottomCartBadge'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('cart-bounce');
      void el.offsetWidth;
      el.classList.add('cart-bounce');
    });
  }

  function triggerEcoConfetti() {
    if (prefersReducedMotion()) return;
    const layer = document.getElementById('confettiLayer');
    if (!layer) return;
    const colors = ['#F28C28', '#70984B', '#FFB74D', '#4B6A3A', '#DCE7C4'];
    const cx = window.innerWidth * 0.5;
    const cy = Math.min(window.innerHeight * 0.35, 280);
    for (let i = 0; i < 24; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'confetti-dot';
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4;
      const dist = 70 + Math.random() * 140;
      dot.style.left = `${cx}px`;
      dot.style.top = `${cy}px`;
      dot.style.background = colors[i % colors.length];
      dot.style.setProperty('--tx', `${Math.round(Math.cos(angle) * dist)}px`);
      dot.style.setProperty('--ty', `${Math.round(Math.sin(angle) * dist + 40)}px`);
      dot.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 540)}deg`);
      layer.appendChild(dot);
      setTimeout(() => dot.remove(), 1000);
    }
  }

  function applyStaggerAndCountUp(view) {
    if (prefersReducedMotion()) return;
    const staggerSelectors =
      '.stats-grid > *, .explore-grid > *, .ingredients-grid > *, .process-timeline > *, .science-grid > *, .game-stages-grid > *, .shop-grid > *, .badges-grid > *';
    view.querySelectorAll(staggerSelectors).forEach((el, idx) => {
      el.classList.add('stagger-item');
      el.style.setProperty('--stagger-i', String(Math.min(idx, 8)));
    });

    // Smooth count-up for numeric stat values like "3/6" or "42%"
    view.querySelectorAll('.stat-value, [data-countup]').forEach((el) => {
      const raw = el.textContent.trim();
      const match = raw.match(/^(\d+)(.*)$/);
      if (!match) return;
      const target = Number(match[1]);
      const suffix = match[2];
      if (target <= 0) return;
      const duration = 420;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function addToCart(productId) {
    const prod = getAllShopProducts().find((p) => p.id === productId);
    if (!prod) return;
    lastOrderSummary = null;
    const existing = cart.find((c) => c.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: productId, qty: 1 });
    }
    saveCart();
    renderCartDrawer();
    triggerCartBounce();
    showToast(`Đã thêm "${prod.name}" vào giỏ!`);
  }

  function updateCartQty(productId, delta) {
    const idx = cart.findIndex((c) => c.id === productId);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    saveCart();
    renderCartDrawer();
  }

  function removeCartItem(productId) {
    cart = cart.filter((c) => c.id !== productId);
    saveCart();
    renderCartDrawer();
  }

  function updateCartBadges() {
    const total = getCartTotalQty();
    const totalAmount = getCartTotalAmount();
    const sideBadge = document.getElementById('sidebarCartBadge');
    const headBadge = document.getElementById('headerCartCount');
    const bottomBadge = document.getElementById('bottomCartBadge');
    [sideBadge, headBadge, bottomBadge].forEach((el) => {
      if (!el) return;
      el.textContent = String(total);
      el.classList.toggle('hidden', total === 0);
    });

    const floatBar = document.getElementById('floatingCartBar');
    const floatSummary = document.getElementById('floatingCartSummary');
    if (floatBar && floatSummary) {
      floatSummary.textContent = `${total} món • ${formatVND(totalAmount)}`;
      floatBar.classList.toggle('hidden', total === 0);
    }
  }

  function openCartDrawer() {
    renderCartDrawer();
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
  }

  function closeCartDrawer() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
  }

  const CONTACT = (DATA && DATA.contact) || {
    zalo: '0355415501',
    zaloUrl: 'https://zalo.me/0355415501',
    email: 'peelverse.official@gmail.com',
    mailto: 'mailto:peelverse.official@gmail.com'
  };

  function renderCartSupportBoxHtml() {
    return `
      <div class="cart-support-box">
        <div class="cart-support-title inline-icon-heading">${PVIcon('sprout', 16)} <span>Cần tư vấn chọn sản phẩm làm sạch sinh học hoặc hỗ trợ đơn hàng?</span></div>
        <div class="cart-support-links">
          <div class="contact-chip-group">
            <a href="${CONTACT.zaloUrl}" target="_blank" rel="noopener noreferrer" class="contact-link-pill">
              ${PVIcon('message-circle', 15)}<span>Zalo: <strong>${CONTACT.zalo}</strong></span>
            </a>
            <button type="button" class="copy-btn" data-copy="${CONTACT.zalo}" data-copy-label="số Zalo" aria-label="Sao chép số Zalo">${PVIcon('copy', 15)}</button>
          </div>
          <div class="contact-chip-group">
            <a href="${CONTACT.mailto}" class="contact-link-pill">
              ${PVIcon('mail', 15)}<span><strong>${CONTACT.email}</strong></span>
            </a>
            <button type="button" class="copy-btn" data-copy="${CONTACT.email}" data-copy-label="Email" aria-label="Sao chép Email">${PVIcon('copy', 15)}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const sub = document.getElementById('cartDrawerSub');
    if (!body || !sub) return;

    const totalQty = getCartTotalQty();
    sub.textContent = `${totalQty} sản phẩm đã chọn`;

    if (lastOrderSummary) {
      body.innerHTML = `
        <div class="cart-scroll-region">
          <div class="cart-summary-box" style="background:linear-gradient(145deg,#F3F8E9,#FFFFFF);border-color:#C7DC9F;text-align:center;padding:24px 18px;">
            <h3 style="margin-bottom:6px;">Đã ghi nhận yêu cầu đặt hàng PEELVERSE</h3>
            <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:12px;">
              Cảm ơn <strong>${lastOrderSummary.name}</strong> đã lựa chọn sản phẩm làm sạch sinh học từ vỏ trái cây PEELVERSE. Nhóm sẽ liên hệ qua <strong>${lastOrderSummary.contact}</strong> trong thời gian sớm nhất.
            </p>
            <div style="background:#FFFFFF;border:1px solid var(--border-soft);border-radius:12px;padding:12px;text-align:left;font-size:0.83rem;margin-bottom:14px;">
              <div><strong>Mã đơn:</strong> #${lastOrderSummary.code}</div>
              <div><strong>Số lượng:</strong> ${lastOrderSummary.qty} sản phẩm</div>
              <div><strong>Tổng dự kiến:</strong> ${formatVND(lastOrderSummary.total)}</div>
              <div><strong>Địa chỉ:</strong> ${lastOrderSummary.address}</div>
            </div>
            <button class="btn btn-primary" id="continueShoppingBtn" style="width:100%;">Tiếp tục xem sản phẩm sinh học</button>
          </div>
        </div>
      `;
      body.querySelector('#continueShoppingBtn').addEventListener('click', () => {
        lastOrderSummary = null;
        closeCartDrawer();
        navigate('shop');
      });
      return;
    }

    if (cart.length === 0) {
      body.innerHTML = `
        <div class="cart-scroll-region">
          <div style="text-align:center;padding:42px 16px;color:var(--text-muted);">
            <div style="margin-bottom:12px;color:#162A22;">${PVIcon('shopping-bag', 42)}</div>
            <h4 style="margin-bottom:6px;">Giỏ hàng đang trống</h4>
            <p style="font-size:0.86rem;margin-bottom:18px;">Khám phá các dòng nước lau rửa, nước rửa chén enzyme và xịt khử mùi lành tính chiết xuất từ vỏ trái cây của PEELVERSE.</p>
            <button class="btn btn-primary" id="goShopFromEmpty">Xem sản phẩm làm sạch sinh học →</button>
          </div>
          ${renderCartSupportBoxHtml()}
        </div>
      `;
      body.querySelector('#goShopFromEmpty').addEventListener('click', () => {
        closeCartDrawer();
        navigate('shop');
      });
      return;
    }

    const totalAmount = getCartTotalAmount();

    body.innerHTML = `
      <div class="cart-scroll-region">
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${cart
            .map((entry) => {
              const p = getAllShopProducts().find((item) => item.id === entry.id);
              if (!p) return '';
              return `
              <div class="cart-item-row">
                <img src="${p.image}" alt="${p.name}" class="cart-item-thumb" />
                <div class="cart-item-info">
                  <div class="cart-item-name">${p.name}</div>
                  <div class="cart-item-price">${formatVND(p.price)}</div>
                  <div class="qty-controls">
                    <button class="qty-btn" data-qty-dec="${p.id}" aria-label="Giảm số lượng">−</button>
                    <span style="font-size:0.84rem;font-weight:700;min-width:18px;text-align:center;">${entry.qty}</span>
                    <button class="qty-btn" data-qty-inc="${p.id}" aria-label="Tăng số lượng">+</button>
                  </div>
                </div>
                <button class="remove-item-btn" data-remove="${p.id}" title="Xóa sản phẩm" aria-label="Xóa">✕</button>
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="cart-summary-box">
          <div class="cart-summary-line">
            <span>Tạm tính (${totalQty} món)</span>
            <strong>${formatVND(totalAmount)}</strong>
          </div>
          <div class="cart-summary-line">
            <span>Đóng gói giấy tái chế thân thiện</span>
            <strong style="color:var(--green-mid);">Miễn phí</strong>
          </div>
          <div class="cart-summary-total">
            <span>Tổng cộng</span>
            <span style="color:var(--orange-deep);">${formatVND(totalAmount)}</span>
          </div>
        </div>

        <form id="ecoOrderForm" class="order-form hidden">
          <h4>Xác nhận đặt hàng (Thanh toán khi nhận hàng - COD)</h4>
          <div class="form-field">
            <label for="orderName">Họ và tên *</label>
            <input id="orderName" type="text" required placeholder="VD: Nguyễn Minh Anh" />
          </div>
          <div class="form-field">
            <label for="orderContact">Số điện thoại nhận hàng *</label>
            <input id="orderContact" type="tel" required placeholder="VD: 0912 345 678" />
          </div>
          <div class="form-field">
            <label for="orderAddress">Địa chỉ giao hàng *</label>
            <input id="orderAddress" type="text" required placeholder="VD: Phòng 302, Ký túc xá..." />
          </div>
          <div class="form-field">
            <label for="orderNote">Ghi chú thêm</label>
            <textarea id="orderNote" rows="2" placeholder="VD: Giao buổi chiều, gọi trước khi đến..."></textarea>
          </div>
          <button type="submit" id="ecoOrderSubmitBtn" class="btn btn-primary" style="width:100%;margin-top:4px;">
            Xác nhận đặt hàng COD (${formatVND(totalAmount)})
          </button>
        </form>
        ${renderCartSupportBoxHtml()}
      </div>

      <div class="cart-sticky-footer" id="cartStickyFooter">
        <div class="cart-sticky-totals">
          <span>Tổng cộng (${totalQty} món)</span>
          <strong>${formatVND(totalAmount)}</strong>
        </div>
        <button type="button" id="proceedCheckoutBtn" class="btn btn-primary" style="width:100%;">
          Tiến hành đặt hàng →
        </button>
      </div>
    `;

    body.querySelectorAll('[data-qty-dec]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyDec, -1));
    });
    body.querySelectorAll('[data-qty-inc]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyInc, 1));
    });
    body.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeCartItem(btn.dataset.remove));
    });

    const form = body.querySelector('#ecoOrderForm');
    const proceedBtn = body.querySelector('#proceedCheckoutBtn');
    const stickyFooter = body.querySelector('#cartStickyFooter');
    if (proceedBtn && form) {
      proceedBtn.addEventListener('click', () => {
        form.classList.remove('hidden');
        if (stickyFooter) stickyFooter.classList.add('hidden');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameInput = form.querySelector('#orderName');
        if (nameInput) setTimeout(() => nameInput.focus(), 220);
      });
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.querySelector('#orderName').value.trim();
      const contact = form.querySelector('#orderContact').value.trim();
      const address = form.querySelector('#orderAddress').value.trim();
      const note = form.querySelector('#orderNote').value.trim();
      if (!name || !contact || !address) return;

      const submitBtn = form.querySelector('#ecoOrderSubmitBtn');
      const auth = window.PEELVERSE_AUTH;
      const creatorApi = window.PEELVERSE_CREATOR;
      const user = auth && auth.getUser ? auth.getUser() : null;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="auth-spinner"></span> Đang gửi đơn hàng...';
      }

      try {
        let createdOrders = [];
        if (user && creatorApi) {
          createdOrders = await creatorApi.createOrdersForCart({
            user,
            cartItems: cart,
            allProducts: getAllShopProducts(),
            customer: { name, phone: contact, address, note }
          });
        }
        const firstId = createdOrders[0] && createdOrders[0].id
          ? String(createdOrders[0].id).slice(0, 8).toUpperCase()
          : `PV${Math.floor(1000 + Math.random() * 9000)}`;

        lastOrderSummary = {
          code: firstId,
          name,
          contact,
          address,
          qty: getCartTotalQty(),
          total: getCartTotalAmount()
        };
        cart = [];
        saveCart();
        addNotification(`Đã đặt đơn hàng #${lastOrderSummary.code} (${formatVND(lastOrderSummary.total)})!`);
        showToast(`Đặt hàng thành công! Mã đơn #${lastOrderSummary.code}`);
        renderCartDrawer();
        if (currentRoute === 'shop' || currentRoute === 'my-orders') render();
      } catch (err) {
        showToast(`${creatorApi ? creatorApi.translateDbError(err) : 'Không thể lưu đơn hàng.'}`, 'warning');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = `Xác nhận đặt hàng COD (${formatVND(totalAmount)})`;
        }
      }
    });
  }

  function addNotification(msg) {
    state.notifications.unshift(msg);
    state.notifications = state.notifications.slice(0, 12);
    saveState();
  }

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    // Keep max 3 stacked toasts
    while (container.children.length > 3) {
      container.firstElementChild.remove();
    }
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = '0.22s ease';
      setTimeout(() => toast.remove(), 230);
    }, 2500);
  }

  window.PEELVERSE_TOAST = showToast;

  async function refreshCommunityProducts(force = false) {
    if (!window.PEELVERSE_CREATOR) return;
    if (communityLoading && !force) return;
    communityLoading = true;
    try {
      communityProducts = await window.PEELVERSE_CREATOR.fetchActiveCommunityProducts();
      communityLoaded = true;
    } catch (err) {
      console.warn('[PEELVERSE Shop] Community products load skipped:', err);
      communityLoaded = true;
    } finally {
      communityLoading = false;
    }
  }

  function getOverallProgress() {
    const total =
      DATA.ingredients.length +
      DATA.processSteps.length +
      DATA.scienceTopics.length;
    const done =
      state.exploredIngredients.length +
      state.completedSteps.length +
      state.completedScience.length;
    return Math.min(100, Math.round((done / total) * 100));
  }

  function updateHeaderStats() {
    const pct = getOverallProgress();
    const xpEl = document.getElementById('headerXp');
    if (xpEl) xpEl.textContent = `${pct}%`;
    const sidePctEl = document.getElementById('sidebarProgressPct');
    if (sidePctEl) sidePctEl.textContent = `${pct}%`;
    const ringEl = document.getElementById('headerProgressRing');
    if (ringEl) {
      const circumference = 94.25; // 2 * PI * 15
      ringEl.style.strokeDashoffset = String(circumference * (1 - pct / 100));
    }
    const notifList = document.getElementById('notifList');
    if (notifList) {
      notifList.innerHTML = state.notifications
        .map((n) => `<div class="notif-entry">${n}</div>`)
        .join('');
    }
  }

  function focusElementWithPulse(selector) {
    setTimeout(() => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      el.classList.remove('search-highlight-pulse');
      void el.offsetWidth;
      el.classList.add('search-highlight-pulse');
      setTimeout(() => el.classList.remove('search-highlight-pulse'), 1350);
    }, 120);
  }

  function renderBreadcrumb(items) {
    // items: [{ label, route }] — last item is current
    const prev = items.length > 1 ? items[items.length - 2] : { label: 'Trang chủ', route: 'home' };
    return `
      <div class="breadcrumb-bar">
        <nav class="breadcrumb-nav" aria-label="Đường dẫn trang">
          ${items
            .map((it, idx) => {
              const isLast = idx === items.length - 1;
              if (isLast) return `<span class="breadcrumb-current">${it.label}</span>`;
              return `<button type="button" class="breadcrumb-link" data-nav="${it.route}">${it.label}</button><span class="breadcrumb-sep">/</span>`;
            })
            .join('')}
        </nav>
        <button type="button" class="btn-back" style="margin-bottom:0;" data-nav="${prev.route}">← Quay lại</button>
      </div>
    `;
  }

  function getSmartNextStep() {
    const nextIng = DATA.ingredients.find((i) => !state.exploredIngredients.includes(i.id));
    if (nextIng) {
      return {
        emoji: nextIng.emoji,
        kicker: 'Tiếp tục hành trình • Nguyên liệu',
        title: `Khám phá "${nextIng.name}" (${state.exploredIngredients.length}/${DATA.ingredients.length})`,
        cta: 'Khám phá ngay →',
        action: () => navigate('ingredient-detail', nextIng.id)
      };
    }
    const nextStep = DATA.processSteps.find((s) => !state.completedSteps.includes(s.step));
    if (nextStep) {
      return {
        emoji: nextStep.emoji,
        kicker: 'Tiếp tục hành trình • Quy trình 6 bước',
        title: `Theo dõi Bước ${nextStep.step}: ${nextStep.title}`,
        cta: 'Xem quy trình →',
        action: () => {
          navigate('process');
          focusElementWithPulse(`[data-step-card="${nextStep.step}"]`);
        }
      };
    }
    const nextSci = DATA.scienceTopics.find((t) => !state.completedScience.includes(t.id));
    if (nextSci) {
      return {
        emoji: nextSci.emoji,
        kicker: 'Tiếp tục hành trình • Kiến thức khoa học',
        title: `Học bài "${nextSci.title}" & làm quiz nhanh`,
        cta: 'Học ngay →',
        action: () => navigate('science-detail', nextSci.id)
      };
    }
    const nextStage = GAMES.stages.find((g) => !state.clearedGames[g.id]);
    if (nextStage) {
      return {
        emoji: nextStage.emoji,
        kicker: 'Tiếp tục hành trình • Mini Game',
        title: `Chinh phục Màn ${nextStage.id}: ${nextStage.title}`,
        cta: 'Chơi ngay →',
        action: () => navigate('game-play', nextStage.id)
      };
    }
    return {
      emoji: '',
      kicker: 'Xuất sắc • Đã hoàn thành 100%',
      title: 'Bạn đã chinh phục trọn bộ hành trình PEELVERSE! Ghé xem huy hiệu hoặc bộ sản phẩm làm sạch sinh học nhé.',
      cta: 'Xem huy hiệu →',
      action: () => navigate('progress')
    };
  }

  function renderLabTabs(activeTab) {
    const tabs = [
      { id: 'ingredients', label: 'Nguyên liệu' },
      { id: 'process', label: 'Quy trình 6 bước' },
      { id: 'science', label: 'Khoa học & pH' }
    ];
    return `
      <div class="pv-ltabs pv-ltabs--lab" data-ltabs-id="lab">
        <div class="pv-ltabs__strip" aria-hidden="true"></div>
        <div class="pv-ltabs__surface" aria-hidden="true">
          <div class="pv-ltabs__gooLayer">
            <div class="pv-ltabs__blob"></div>
            <div class="pv-ltabs__body"></div>
          </div>
          <div class="pv-ltabs__indicator"></div>
        </div>
        <div class="pv-ltabs__nav" role="tablist" aria-label="Phòng Lab PEELVERSE">
          ${tabs
            .map(
              (t) => `
            <button type="button" class="pv-ltabs__btn ${activeTab === t.id ? 'active' : ''}" data-nav="${t.id}" role="tab" aria-selected="${activeTab === t.id}">
              <span>${t.label}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function navigate(route, param = null) {
    if (GAMES && GAMES.cleanup) GAMES.cleanup();
    const resolvedRoute = route === 'lab' ? activeLabTab : route;
    if (resolvedRoute === 'ingredients' || resolvedRoute === 'process' || resolvedRoute === 'science') {
      activeLabTab = resolvedRoute;
    }
    currentRoute = resolvedRoute;
    activeIngredientId = resolvedRoute === 'ingredient-detail' ? param : null;
    activeScienceId = resolvedRoute === 'science-detail' ? param : null;
    activeGameStageId = resolvedRoute === 'game-play' ? param : null;
    document.body.classList.toggle('in-game-play', resolvedRoute === 'game-play');

    try {
      localStorage.setItem(SESSION_ROUTE_KEY, resolvedRoute === 'game-play' ? 'game' : resolvedRoute);
    } catch {
      // ignore
    }
    if (window.history && window.history.replaceState) {
      const nextHash = resolvedRoute === 'game' || resolvedRoute === 'game-play' ? '#mo-phong' : '';
      if (window.location.hash !== nextHash) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search + nextHash);
      }
    }

    const topNavKey =
      resolvedRoute === 'home' || resolvedRoute === 'about'
        ? 'home'
        : resolvedRoute === 'shop' || resolvedRoute === 'my-orders'
        ? 'shop'
        : resolvedRoute === 'ingredients' ||
          resolvedRoute === 'ingredient-detail' ||
          resolvedRoute === 'process' ||
          resolvedRoute === 'science' ||
          resolvedRoute === 'science-detail'
        ? 'lab'
        : resolvedRoute === 'game' || resolvedRoute === 'game-play'
        ? 'game'
        : '';

    document.querySelectorAll('.primary-nav-link, .bottom-nav-item[data-route]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === topNavKey);
    });

    const userMenu = document.getElementById('userAccountMenu');
    if (userMenu) userMenu.classList.add('hidden');
    const searchPanel = document.getElementById('searchBarPanel');
    if (searchPanel) searchPanel.classList.add('hidden');

    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function triggerViewTransition(view) {
    triggerRouteProgressBar();
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    applyStaggerAndCountUp(view);
    if (window.PEELVERSE_MOTION) {
      window.PEELVERSE_MOTION.splitHeroWords(view.querySelector('.editorial-hero-title'));
      window.PEELVERSE_MOTION.initScrollReveal(view);
      window.PEELVERSE_MOTION.initLiquidTabs(view);
    }
  }

  function render() {
    const view = document.getElementById('appView');
    if (currentRoute === 'home') renderHome(view);
    else if (currentRoute === 'about') renderAbout(view);
    else if (currentRoute === 'ingredients') renderIngredients(view);
    else if (currentRoute === 'ingredient-detail') renderIngredientDetail(view, activeIngredientId);
    else if (currentRoute === 'process') renderProcess(view);
    else if (currentRoute === 'science') renderScience(view);
    else if (currentRoute === 'science-detail') renderScienceDetail(view, activeScienceId);
    else if (currentRoute === 'game') renderGameHub(view);
    else if (currentRoute === 'game-play') renderGamePlay(view, activeGameStageId);
    else if (currentRoute === 'shop') renderShop(view);
    else if (currentRoute === 'my-orders') {
      shopViewTab = 'orders';
      renderShop(view);
    } else if (currentRoute === 'creator') renderCreatorRoute(view);
    else renderHome(view);
    bindNavTriggers(view);
    triggerViewTransition(view);
  }

  // ===== 01. HOME VIEW (STREAMLINED BOTANICAL EDITORIAL) =====
  function renderHome(view) {
    view.innerHTML = `
      <!-- Asymmetric Editorial Magazine Hero -->
      <section class="editorial-hero">
        <div class="editorial-hero-copy">
          <span class="eyebrow-tag">PEELVERSE • FROM PEEL TO PURPOSE</span>
          <h1 class="editorial-hero-title">Tận dụng vỏ trái cây cho giải pháp làm sạch hằng ngày.</h1>
          <p class="editorial-hero-desc">
            PEELVERSE nghiên cứu và thử nghiệm chiết xuất tinh dầu từ vỏ cam sẵn có trong đời sống — hướng tới dung dịch hỗ trợ làm sạch dầu mỡ nhẹ trên bề mặt và giảm mùi hóa chất nồng.
          </p>
          <div class="editorial-hero-actions">
            <button type="button" class="btn btn-primary" data-nav="shop">Khám phá Cửa hàng</button>
            <button type="button" class="btn btn-secondary" data-nav="lab">Vào Phòng Lab</button>
          </div>
        </div>
        <figure class="editorial-hero-figure">
          <div class="editorial-figure-frame">
            <span class="pv-hero-aura" aria-hidden="true"></span>
            <img src="assets/images/hero-peel.jpg" alt="Vỏ cam tươi giàu tinh dầu tự nhiên PEELVERSE" />
            <span class="pv-oil-sparkle s1" aria-hidden="true"></span>
            <span class="pv-oil-sparkle s2" aria-hidden="true"></span>
            <span class="pv-oil-sparkle s3" aria-hidden="true"></span>
            <span class="pv-oil-sparkle s4" aria-hidden="true"></span>
          </div>
          <figcaption class="editorial-caption">FIG. 01 — CITRUS PEEL ESSENTIAL OIL &amp; D-LIMONENE</figcaption>
        </figure>
      </section>

      <!-- Integrated Brand Story (Khởi nguồn • Sứ mệnh • Tầm nhìn) -->
      <section class="editorial-story-section">
        <div class="editorial-story-grid">
          <div class="editorial-story-copy">
            <span class="eyebrow-tag">KHỞI NGUỒN • SỨ MỆNH • TẦM NHÌN</span>
            <h2 class="serif-heading" style="font-size:clamp(1.7rem,3vw,2.3rem);margin:6px 0 14px;">Giải pháp làm sạch từ những điều quen thuộc.</h2>
            <p>
              PEELVERSE bắt đầu từ những điều rất quen thuộc trong cuộc sống nội trú. Sau mỗi bữa ăn, vỏ cam thường bị bỏ đi khá nhiều, trong khi mặt bàn ăn lại cần một dung dịch hỗ trợ làm sạch dịu nhẹ, giảm mùi hóa chất nồng.
            </p>
            <p class="editorial-quote">
              “Dự án đang được nghiên cứu và thử nghiệm trong đời sống để tận dụng nguồn vỏ trái cây sẵn có một cách thiết thực và tiết kiệm.”
            </p>
            <div class="editorial-mv-row">
              <div>
                <span class="eyebrow-tag">SỨ MỆNH</span>
                <p style="margin-top:6px;">Tận dụng nguồn vỏ trái cây sẵn có, ứng dụng kiến thức khoa học tự nhiên vào việc làm sạch bề mặt hằng ngày.</p>
              </div>
              <div>
                <span class="eyebrow-tag">TẦM NHÌN</span>
                <p style="margin-top:6px;">Kết nối người nghiên cứu và cộng đồng sáng tạo sản phẩm xanh minh bạch, an toàn và thân thiện môi trường.</p>
              </div>
            </div>
          </div>
          <figure class="editorial-story-figure">
            <div class="editorial-figure-frame">
              <img src="assets/images/about-lab.jpg" alt="Phòng thí nghiệm chiết xuất vỏ cam PEELVERSE" />
            </div>
            <figcaption class="editorial-caption">FIG. 02 — BOTANICAL EXTRACTION LAB, PEELVERSE</figcaption>
          </figure>
        </div>
      </section>

      <!-- Sleek Seller Invitation Strip -->
      <section class="next-step-card seller-invite-strip">
        <div class="next-step-left">
          <span class="next-step-monogram">${PVIcon('store', 18)}</span>
          <div>
            <div class="eyebrow-tag">CỘNG ĐỒNG BÁN HÀNG XANH</div>
            <div class="next-step-title">Bạn làm sản phẩm từ vỏ trái cây và muốn mở gian hàng trên PEELVERSE?</div>
          </div>
        </div>
        <a href="./seller-register.html" class="btn btn-secondary btn-sm">Đăng ký bán hàng →</a>
      </section>
    `;

    bindNavTriggers(view);
  }

  // ===== 02. ABOUT PROJECT VIEW =====
  function renderAbout(view) {
    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Về dự án' }])}
      <div class="page-hero-header">
        <h1 class="page-title">${PVIcon('sprout', 26)} <span>About Project</span> <span style="font-size:0.95rem;font-weight:600;color:var(--text-muted);">• Ý tưởng • Sứ mệnh • Tầm nhìn</span></h1>
      </div>

      <section class="about-story-card">
        <div class="about-story-text">
          <p class="lead">PEELVERSE bắt đầu từ những điều rất quen thuộc trong cuộc sống nội trú.</p>
          <p>
            Sau mỗi bữa ăn, chúng tôi tự dọn dẹp bàn ăn, và nhận ra rằng những loại rác hữu cơ như vỏ cam hay vỏ trái cây thường bị bỏ đi khá nhiều. Trong khi đó, bàn ăn sau khi sử dụng lại thường có những vết bẩn nhưng chưa có sẵn dung dịch lau bàn phù hợp để xử lý.
          </p>
          <p class="highlight-quote">
            Từ những điều tưởng chừng nhỏ bé ấy, chúng tôi bắt đầu đặt câu hỏi: Liệu những vỏ trái cây thường bị bỏ đi có thể được tận dụng để tạo ra một dung dịch lau bàn?
          </p>
          <p style="margin-bottom:0;">
            <strong>Đó chính là khởi nguồn của PEELVERSE</strong> — dự án nghiên cứu và thử nghiệm tận dụng vỏ trái cây, kết hợp kiến thức khoa học và tư duy sáng tạo để tạo ra một giải pháp làm sạch từ những nguyên liệu quen thuộc.
          </p>
        </div>
        <div class="about-story-visual">
          <img src="assets/images/about-lab.jpg" alt="Vỏ cam và bình thí nghiệm PEELVERSE" />
        </div>
      </section>

      <section class="mission-vision-grid">
        <article class="mv-card">
          <div class="mv-icon" style="color:var(--orange-deep);">${PVIcon('target', 28)}</div>
          <div>
            <h3>Sứ mệnh</h3>
            <p>
              Tận dụng nguồn rác hữu cơ sẵn có, ứng dụng kiến thức khoa học vào đời sống và khuyến khích tư duy sáng tạo từ những vấn đề thực tế.
            </p>
          </div>
        </article>
        <article class="mv-card">
          <div class="mv-icon" style="color:var(--green-mid);">${PVIcon('compass', 28)}</div>
          <div>
            <h3>Tầm nhìn</h3>
            <p>
              Biến những thứ tưởng chừng bị bỏ đi thành nguồn cảm hứng cho các giải pháp hữu ích, hướng đến lối sống bền vững hơn.
            </p>
          </div>
        </article>
      </section>

      <div class="section-head">
        <h2>Vấn đề rác thải vỏ trái cây & góc nhìn mới </h2>
      </div>
      <section class="waste-impact-grid">
        <div class="impact-card">
          <div class="impact-num">20–30%</div>
          <h4 style="margin-bottom:6px;">Trọng lượng bị bỏ đi</h4>
          <p style="font-size:0.86rem;color:var(--text-muted);">Phần lớn vỏ cam sau bữa ăn bị vứt chung với rác sinh hoạt hằng ngày.</p>
        </div>
        <div class="impact-card">
          <div class="impact-num">70–95%</div>
          <h4 style="margin-bottom:6px;">Hàm lượng D-Limonene</h4>
          <p style="font-size:0.86rem;color:var(--text-muted);">Tinh dầu tự nhiên trong vỏ cam chứa Limonene — hợp chất hỗ trợ làm sạch dầu mỡ nhẹ.</p>
        </div>
        <div class="impact-card">
          <div class="impact-num">100%</div>
          <h4 style="margin-bottom:6px;">Vòng đời tuần hoàn</h4>
          <p style="font-size:0.86rem;color:var(--text-muted);">Dịch chiết dùng làm sạch, phần bã vỏ sau lọc có thể tiếp tục ủ làm phân hữu cơ cho cây xanh.</p>
        </div>
      </section>

      <div style="margin-top:26px;display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" data-nav="ingredients">Khám phá các nguyên liệu →</button>
        <button class="btn btn-secondary" data-nav="process">Xem quy trình thực hiện</button>
      </div>
    `;

    bindNavTriggers(view);
  }

  // ===== 03. INGREDIENTS VIEW =====
  function renderIngredients(view) {
    const categories = [
      { key: 'Tất cả', icon: '⊞' },
      { key: 'Trái cây', icon: '' },
      { key: 'Chất lỏng', icon: '' },
      { key: 'Gia vị', icon: '' },
      { key: 'Thực vật', icon: '' }
    ];

    let list = DATA.ingredients.filter((item) =>
      ingredientFilter === 'Tất cả' ? true : item.category === ingredientFilter
    );

    if (ingredientSort === 'core') {
      list = [...list].sort((a, b) => Number(b.isCore) - Number(a.isCore));
    } else if (ingredientSort === 'explored') {
      list = [...list].sort(
        (a, b) =>
          Number(state.exploredIngredients.includes(b.id)) -
          Number(state.exploredIngredients.includes(a.id))
      );
    }

    view.innerHTML = `
      ${renderLabTabs('ingredients')}
      <div class="page-hero-header">
        <div>
          <span class="eyebrow-tag">PHÒNG LAB • THƯ VIỆN THÀNH PHẦN</span>
          <h1 class="page-title">Nguyên liệu nghiên cứu</h1>
          <p style="color:var(--text-muted);font-size:0.93rem;margin-top:4px;">
            Tìm hiểu từng nguyên liệu, đặc tính khoa học, vai trò trong nghiên cứu PEELVERSE và những điều cần lưu ý.
          </p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-pills">
          ${categories
            .map(
              (cat) => `
            <button class="filter-pill ${ingredientFilter === cat.key ? 'active' : ''}" data-filter="${cat.key}">
              <span>${cat.icon}</span> ${cat.key}
            </button>
          `
            )
            .join('')}
        </div>

        <select id="ingredientSortSelect" class="sort-select" aria-label="Sắp xếp nguyên liệu">
          <option value="default" ${ingredientSort === 'default' ? 'selected' : ''}>Sắp xếp: Mặc định</option>
          <option value="core" ${ingredientSort === 'core' ? 'selected' : ''}>Nguyên liệu cốt lõi trước</option>
          <option value="explored" ${ingredientSort === 'explored' ? 'selected' : ''}>Đã xem trước</option>
        </select>
      </div>

      <section class="ingredients-grid">
        ${list
          .map((item) => {
            const done = state.exploredIngredients.includes(item.id);
            return `
            <article class="ingredient-card" data-ingredient="${item.id}">
              <div class="ingredient-media">
                <img src="${item.image}" alt="${item.name}" />
                ${item.isCore ? `<span class="core-badge">Cốt lõi</span>`: ''}
                <span class="progress-badge ${done ? 'done' : ''}">${done ? '100% ✓' : '0%'}</span>
              </div>
              <div class="ingredient-footer">
                <span class="ingredient-name">${item.emoji} ${item.name}</span>
                <span class="circle-arrow">→</span>
              </div>
              <p class="ingredient-short-role">${item.shortRole}</p>
            </article>
          `;
          })
          .join('')}
      </section>
    `;

    view.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        ingredientFilter = btn.dataset.filter;
        renderIngredients(view);
      });
    });

    view.querySelector('#ingredientSortSelect').addEventListener('change', (e) => {
      ingredientSort = e.target.value;
      renderIngredients(view);
    });

    view.querySelectorAll('.ingredient-card').forEach((card) => {
      card.addEventListener('click', () => {
        navigate('ingredient-detail', card.dataset.ingredient);
      });
    });
  }

  function renderIngredientDetail(view, id) {
    const item = DATA.ingredients.find((i) => i.id === id);
    if (!item) return navigate('ingredients');

    if (!state.exploredIngredients.includes(item.id)) {
      state.exploredIngredients.push(item.id);
      addNotification(`Bạn vừa khám phá nguyên liệu: ${item.name}!`);
      showToast(`Đã khám phá: ${item.name} (+100%)`);
      saveState();
    }

    view.innerHTML = `
      ${renderBreadcrumb([
        { label: 'Trang chủ', route: 'home' },
        { label: 'Nguyên liệu', route: 'ingredients' },
        { label: item.name }
      ])}

      <section class="detail-hero">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="detail-tags">
            <span class="detail-tag">${item.category}</span>
            <span class="detail-tag" style="background:var(--bg-peach);color:var(--orange-deep);">
              ${item.isCore ? 'Nguyên liệu nghiên cứu chính' : 'Nguyên liệu mở rộng'}
            </span>
            <span class="detail-tag" style="background:var(--green-dark);color:#FFF;">✓ Đã khám phá</span>
          </div>
          <h1 style="font-size:2rem;margin-bottom:10px;">${item.emoji} ${item.name}</h1>
          <p style="color:var(--text-main);font-size:0.96rem;margin-bottom:14px;">${item.description}</p>
          <div style="background:var(--bg-sage-soft);padding:12px 16px;border-radius:14px;font-size:0.9rem;">
            <strong>Vai trò trong nghiên cứu:</strong> ${item.researchRole}
          </div>
        </div>
      </section>

      <section class="detail-grid">
        <div class="info-box">
          <h3> Thành phần chính</h3>
          <ul>${item.composition.map((c) => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-box">
          <h3> Đặc tính khoa học</h3>
          <ul>${item.properties.map((p) => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="info-box warning-box" style="grid-column: 1 / -1;">
          <h3> Lưu ý khi nghiên cứu & sử dụng</h3>
          <ul>${item.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
        </div>
      </section>
    `;

    bindNavTriggers(view);
  }

  // ===== 04. PROCESS VIEW =====
  function renderProcess(view) {
    view.innerHTML = `
      ${renderLabTabs('process')}
      <div class="page-hero-header">
        <div>
          <span class="eyebrow-tag">PHÒNG LAB • QUY TRÌNH CHIẾT XUẤT</span>
          <h1 class="page-title">Quy trình thực hiện 6 bước</h1>
          <p style="color:var(--text-muted);font-size:0.93rem;margin-top:4px;">
            Tìm hiểu 6 bước nghiên cứu và tạo mẫu thử PEELVERSE từ thu gom nguyên liệu đến đánh giá hoàn thiện.
          </p>
        </div>
      </div>

      <section class="process-timeline">
        ${DATA.processSteps
          .map(
            (s) => `
            <article class="process-card" data-step-card="${s.step}">
              ${
                s.image
                  ? `<div class="process-media">
                      <img src="${s.image}" alt="Bước ${s.step}: ${s.title}" loading="lazy" />
                      <span class="step-badge process-media-badge">Bước ${s.step}</span>
                      <span class="process-media-emoji">${s.emoji}</span>
                    </div>`
                  : `<div class="process-card-top">
                      <span class="step-badge">Bước ${s.step}</span>
                      <span class="step-emoji">${s.emoji}</span>
                    </div>`
              }
              <div class="process-card-body">
                <h3>${s.title}</h3>
                <p><strong>${s.summary}</strong></p>
                <p>${s.details}</p>
                <div class="process-detail-list">
                  <strong>Mẹo nghiên cứu:</strong> ${s.tip}
                </div>
              </div>
            </article>
          `
          )
          .join('')}
      </section>
    `;

    bindNavTriggers(view);
  }

  // ===== 05. SCIENCE KNOWLEDGE VIEW (INTERACTIVE SCIENCE LAB) =====
  function renderScience(view) {
    const filterCategories = [
      { key: 'Tất cả', icon: 'sparkles' },
      { key: 'Hoạt chất & Tinh dầu', icon: 'citrus' },
      { key: 'Cơ chế làm sạch', icon: 'flask' },
      { key: 'So sánh & An toàn', icon: 'check-circle' }
    ];

    const glossaryTerms = [
      {
        term: 'D-Limonene',
        formula: 'C₁₀H₁₆',
        desc: 'Hợp chất hydrocarbon không phân cực chiếm 70–95% trong tinh dầu vỏ cam và vỏ bưởi. Nhờ tính không phân cực, D-Limonene phá vỡ liên kết và hòa tan nhanh các vết dầu mỡ tự nhiên.'
      },
      {
        term: 'Enzyme sinh học',
        formula: 'Bio-Catalyst',
        desc: 'Các protein xúc tác sinh học tạo ra khi lên men vỏ dứa, vỏ cam. Chúng cắt nhỏ các phân tử chất bẩn hữu cơ (dầu mỡ, tinh bột, đạm) thành mảnh dễ rửa trôi bằng nước.'
      },
      {
        term: 'Terpene',
        formula: 'Hợp chất thơm',
        desc: 'Nhóm hợp chất hữu cơ dễ bay hơi tạo nên mùi hương tươi mát đặc trưng của vỏ quả có múi và thảo mộc như quế, sả, giúp khử mùi hôi tự nhiên.'
      },
      {
        term: 'Chất hoạt động bề mặt',
        formula: 'Surfactant',
        desc: 'Phân tử có 1 đầu ưa nước và 1 đầu ưa dầu, đóng vai trò cầu nối giúp nước cuốn trôi chất bẩn dầu mỡ khỏi mặt bàn và chén bát.'
      }
    ];

    const flashcards = [
      {
        frontTag: 'Vỏ cam ngọt',
        icon: 'ph-orange-slice',
        accent: '#EA580C',
        question: 'Vì sao bóp nhẹ vỏ cam tươi lại có tia sương thơm bắn ra?',
        answer: 'Lớp vỏ ngoài (flavedo) chứa hàng nghìn túi tinh dầu căng đầy D-Limonene. Khi bóp, áp suất làm vỡ túi dầu và giải phóng tinh dầu siêu mịn!'
      },
      {
        frontTag: 'Vỏ bưởi xanh',
        icon: 'ph-drop',
        accent: '#059669',
        question: 'Tinh dầu vỏ bưởi giúp khử mùi phòng và giày bằng cách nào?',
        answer: 'Các phân tử Terpene bay hơi nhanh giúp trung hòa phân tử mùi ẩm mốc, đồng thời để lại hương thanh mát mà không cần hương liệu tổng hợp.'
      },
      {
        frontTag: 'Vỏ dứa lên men',
        icon: 'ph-flask',
        accent: '#D97706',
        question: 'Enzyme Bromelain từ vỏ dứa có tác dụng gì trong nước rửa chén?',
        answer: 'Enzyme tự nhiên giúp phân giải mảng bám thức ăn và dầu mỡ nhẹ nhàng, giúp chén bát sạch nhanh, ít tốn nước tráng và dịu nhẹ cho da tay.'
      },
      {
        frontTag: 'Vỏ cam & Giấm',
        icon: 'ph-sparkle',
        accent: '#0284C7',
        question: 'Độ pH lý tưởng của dung dịch lau bàn từ vỏ quả là bao nhiêu?',
        answer: 'Khoảng pH 3.5 – 4.5 (axit dịu nhẹ): đủ để làm sạch cặn khoáng & vết ố nhẹ trên bàn ăn nhưng vẫn êm dịu hơn nhiều so với hóa chất tẩy mạnh.'
      }
    ];

    const filteredTopics = DATA.scienceTopics.filter((t) =>
      scienceFilter === 'Tất cả' ? true : t.category === scienceFilter
    );

    view.innerHTML = `
      ${renderLabTabs('science')}

      <!-- Magazine-Style Science Hero Banner -->
      <section class="science-lab-hero">
        <div class="science-hero-content">
          <span class="hero-badge" style="background:rgba(45,106,79,0.12);color:#1E4D2B;">INTERACTIVE SCIENCE LAB • PEELVERSE</span>
          <h1 class="page-title" style="margin-bottom:8px;">${PVIcon('book-open', 28)} <span>Khoa học đằng sau vỏ trái cây</span></h1>
          <p style="color:var(--text-muted);max-width:640px;font-size:0.94rem;">
            Khám phá cơ chế hóa học tự nhiên biến vỏ cam, bưởi, dứa thành giải pháp làm sạch sinh học qua sơ đồ trực quan và thư viện kiến thức.
          </p>
        </div>

        <div class="science-highlights-grid">
          <div class="science-hl-card">
            <span class="science-hl-icon" style="background:#FFF0E3;color:#EA580C;"><i class="ph-duotone ph-orange-slice pv-duotone" style="font-size:22px;"></i></span>
            <div>
              <strong>70–95% D-Limonene</strong>
              <span>Hoạt chất tách dầu mỡ tự nhiên</span>
            </div>
          </div>
          <div class="science-hl-card">
            <span class="science-hl-icon" style="background:#E3F6EE;color:#059669;"><i class="ph-duotone ph-flask pv-duotone" style="font-size:22px;"></i></span>
            <div>
              <strong>Enzyme sinh học</strong>
              <span>Phân giải chất bẩn hữu cơ êm dịu</span>
            </div>
          </div>
          <div class="science-hl-card">
            <span class="science-hl-icon" style="background:#E4F3FC;color:#0284C7;"><i class="ph-duotone ph-drop pv-duotone" style="font-size:22px;"></i></span>
            <div>
              <strong>pH 3.5 – 4.5</strong>
              <span>Dịu nhẹ bề mặt &amp; da tay</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Topic Filter Pills -->
      <div class="filter-bar" style="margin-bottom:20px;">
        <div class="filter-pills">
          ${filterCategories
            .map(
              (c) => `
            <button type="button" class="filter-pill ${scienceFilter === c.key ? 'active' : ''}" data-sci-filter="${c.key}">
              ${PVIcon(c.icon, 16)} <span>${c.key}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Interactive Bento Grid with Inline SVG Visual Diagrams -->
      <section class="science-bento-grid">
        ${
          scienceFilter === 'Tất cả' || scienceFilter === 'Hoạt chất & Tinh dầu' || scienceFilter === 'Cơ chế làm sạch'
            ? `
        <!-- Bento Visual 1: D-Limonene Oil Breakdown Diagram Image + Lightbox -->
        <article class="bento-card bento-span-2 bento-mechanism">
          <div class="bento-card-head">
            <span class="bento-tag" style="background:#FFF0E3;color:#C25B0A;">SƠ ĐỒ CƠ CHẾ</span>
            <h3>Cơ chế D-Limonene phá vỡ &amp; cuốn trôi phân tử dầu mỡ</h3>
            <p>Theo nguyên lý <strong>"tương đồng hòa tan nhau"</strong>, phân tử D-Limonene không phân cực len vào mảng dầu mỡ, tách chúng khỏi mặt bàn để khăn lau dễ dàng cuốn sạch.</p>
          </div>
          <div class="bento-diagram-frame" id="dLimoneneDiagramTrigger" role="button" tabindex="0" aria-label="Phóng to sơ đồ 3 bước cơ chế D-Limonene">
            <img src="assets/images/co-che-d-limonene.jpg" alt="Sơ đồ 3 bước cơ chế D-Limonene phá vỡ và làm sạch dầu mỡ" loading="lazy" />
          </div>
          <p class="bento-diagram-mobile-hint">Chạm vào ảnh để phóng to</p>
        </article>`
            : ''
        }

        ${
          scienceFilter === 'Tất cả' || scienceFilter === 'Cơ chế làm sạch' || scienceFilter === 'So sánh & An toàn'
            ? `
        <!-- Bento Visual 2: Interactive Colorful pH Scale 1 -> 14 -->
        <article class="bento-card bento-span-2 bento-ph">
          <div class="bento-card-head">
            <span class="bento-tag" style="background:#E4F3FC;color:#0284C7;">THANG ĐO pH TRỰC QUAN (1 – 14)</span>
            <h3>Vùng pH an toàn của PEELVERSE so với hóa chất tẩy mạnh</h3>
            <p>Dung dịch vỏ quả pha loãng nằm ở vùng axit dịu nhẹ (pH 3.5–4.5), tránh xa ngưỡng kiềm ăn mòn (pH 12–14) của nhiều chất tẩy rửa công nghiệp.</p>
          </div>
          <div class="bento-svg-box">
            <svg viewBox="0 0 640 132" fill="none" xmlns="http://www.w3.org/2000/svg" class="science-diagram-svg">
              <defs>
                <linearGradient id="phGradSvg" x1="16" y1="0" x2="624" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#EF4444"/>
                  <stop offset="22%" stop-color="#F97316"/>
                  <stop offset="42%" stop-color="#FACC15"/>
                  <stop offset="52%" stop-color="#22C55E"/>
                  <stop offset="72%" stop-color="#0EA5E9"/>
                  <stop offset="100%" stop-color="#7C3AED"/>
                </linearGradient>
              </defs>
              <!-- Spectrum bar -->
              <rect x="16" y="58" width="608" height="22" rx="11" fill="url(#phGradSvg)"/>
              <!-- Scale ticks -->
              <text x="20" y="98" fill="#566250" font-size="11" font-weight="700">1 (Axit mạnh)</text>
              <text x="152" y="98" fill="#C25B0A" font-size="11" font-weight="800">3.5 – 4.5</text>
              <text x="302" y="98" fill="#15803D" font-size="11" font-weight="700">7 (Nước)</text>
              <text x="518" y="98" fill="#6D28D9" font-size="11" font-weight="700">12–14 (Tẩy mạnh)</text>

              <!-- Marker: PEELVERSE Safe Zone -->
              <rect x="118" y="10" width="144" height="32" rx="10" fill="#2C4026"/>
              <text x="190" y="30" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="800">PEELVERSE (pH ~4.0)</text>
              <path d="M190 42V56" stroke="#2C4026" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="190" cy="69" r="7" fill="#FFFFFF" stroke="#2C4026" stroke-width="3"/>

              <!-- Marker: Neutral Water -->
              <circle cx="320" cy="69" r="5.5" fill="#FFFFFF" stroke="#15803D" stroke-width="2.5"/>

              <!-- Marker: Industrial Chemical -->
              <rect x="478" y="10" width="146" height="32" rx="10" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.5"/>
              <text x="551" y="30" text-anchor="middle" fill="#B91C1C" font-size="11" font-weight="700">Tẩy kiềm mạnh (~13)</text>
              <path d="M551 42V56" stroke="#DC2626" stroke-width="2" stroke-dasharray="3 2"/>
              <circle cx="551" cy="69" r="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="2.5"/>
            </svg>
          </div>
        </article>`
            : ''
        }

        ${
          scienceFilter === 'Tất cả' || scienceFilter === 'So sánh & An toàn'
            ? `
        <!-- Bento Visual 3: Bio Cleaner vs Chemical Comparison -->
        <article class="bento-card bento-span-full bento-compare">
          <div class="bento-card-head">
            <span class="bento-tag" style="background:#E3F6EE;color:#059669;">SO SÁNH &amp; AN TOÀN</span>
            <h3>Nước lau rửa sinh học PEELVERSE vs Chất tẩy rửa hóa học công nghiệp</h3>
          </div>
          <div class="compare-grid">
            ${[
              { label: 'An toàn & dịu nhẹ cho da tay', bio: 95, chem: 35, bioNote: 'pH dịu nhẹ, không chất ăn mòn', chemNote: 'Dễ gây khô rát da tay' },
              { label: 'Phân hủy sinh học thân thiện nguồn nước', bio: 98, chem: 25, bioNote: '100% gốc thực vật dễ phân hủy', chemNote: 'Tồn dư hóa chất tổng hợp' },
              { label: 'Mùi hương dễ chịu trong phòng kín', bio: 94, chem: 30, bioNote: 'Hương tinh dầu cam, bưởi, quế', chemNote: 'Mùi clo / hương liệu nồng' },
              { label: 'Tận dụng rác hữu cơ (Kinh tế tuần hoàn)', bio: 100, chem: 10, bioNote: 'Tái sinh từ vỏ quả bỏ đi', chemNote: 'Phát thải từ hóa dầu' }
            ]
              .map(
                (row) => `
              <div class="compare-row-card">
                <div class="compare-row-title">${row.label}</div>
                <div class="compare-bar-item">
                  <div class="compare-bar-label">
                    <span class="compare-ok"><i class="ph-duotone ph-check-circle pv-duotone"></i> PEELVERSE</span>
                    <small>${row.bioNote}</small>
                  </div>
                  <div class="compare-track"><div class="compare-fill bio" style="width:${row.bio}%;"></div></div>
                </div>
                <div class="compare-bar-item">
                  <div class="compare-bar-label">
                    <span class="compare-no"><i class="ph-duotone ph-x-circle pv-duotone"></i> Hóa chất mạnh</span>
                    <small>${row.chemNote}</small>
                  </div>
                  <div class="compare-track"><div class="compare-fill chem" style="width:${row.chem}%;"></div></div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </article>`
            : ''
        }
      </section>

      <!-- Interactive Scientific Keyword Glossary Badges -->
      <section class="glossary-section">
        <div class="section-head" style="margin-bottom:12px;">
          <h2 class="inline-icon-heading">${PVIcon('lightbulb', 20)} <span>Từ khóa khoa học tương tác</span></h2>
          <span style="font-size:0.8rem;color:var(--text-muted);">Chạm hoặc hover vào từng từ khóa để xem giải thích</span>
        </div>
        <div class="glossary-badges">
          ${glossaryTerms
            .map(
              (g, idx) => `
            <button type="button" class="glossary-badge ${idx === 0 ? 'active' : ''}" data-glossary="${idx}">
              <strong>${g.term}</strong>
              <span>${g.formula}</span>
            </button>
          `
            )
            .join('')}
        </div>
        <div id="glossaryPopover" class="glossary-popover">
          <div class="glossary-pop-title">${glossaryTerms[0].term} <span class="glossary-pop-formula">${glossaryTerms[0].formula}</span></div>
          <p>${glossaryTerms[0].desc}</p>
        </div>
      </section>

      <!-- 7 Detailed Science Lessons Grid -->
      <div class="section-head" style="margin-top:26px;">
        <h2 class="inline-icon-heading">${PVIcon('book-open', 20)} <span>Thư viện bài học chi tiết (${filteredTopics.length})</span></h2>
      </div>
      <section class="science-grid">
        ${filteredTopics
          .map(
            (topic) => `
            <article class="science-card" data-topic="${topic.id}">
              <span class="bento-mini-cat">${topic.category || 'Khoa học'}</span>
              <h3>${topic.title}</h3>
              <p style="font-weight:600;color:var(--green-mid);font-size:0.84rem;flex:0;">${topic.subtitle}</p>
              <p>${topic.summary}</p>
              <div class="science-card-foot">
                <span>Đọc chi tiết</span>
                <span>→</span>
              </div>
            </article>
          `
          )
          .join('')}
      </section>

      <!-- Flashcards: "Bạn có biết?" -->
      <section class="flashcards-section">
        <div class="section-head" style="margin-bottom:14px;">
          <h2 class="inline-icon-heading">${PVIcon('sparkles', 20)} <span>Bạn có biết?</span></h2>
        </div>
        <div class="flashcards-grid">
          ${flashcards
            .map(
              (fc, i) => `
            <div class="flip-card" role="button" tabindex="0" aria-pressed="false" data-flip="${i}">
              <div class="flip-card-inner">
                <div class="flip-card-front" style="--fc-accent:${fc.accent};">
                  <span class="flip-tag" style="color:${fc.accent};">${fc.frontTag}</span>
                  <div class="flip-icon" style="color:${fc.accent};">
                    <i class="ph-duotone ${fc.icon} pv-duotone" style="font-size:32px;"></i>
                  </div>
                  <h4>${fc.question}</h4>
                  <span class="flip-hint">Chạm để xem đáp án ↻</span>
                </div>
                <div class="flip-card-back" style="--fc-accent:${fc.accent};">
                  <span class="flip-tag" style="background:rgba(255,255,255,0.22);color:#FFFFFF;">Sự thật khoa học</span>
                  <p>${fc.answer}</p>
                  <span class="flip-hint" style="color:rgba(255,255,255,0.85);">Chạm để lật lại ↺</span>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `;

    // Lightbox for D-Limonene mechanism diagram
    const diagramTrigger = view.querySelector('#dLimoneneDiagramTrigger');
    if (diagramTrigger) {
      const openLightbox = () => {
        let lb = document.getElementById('pvDiagramLightbox');
        if (!lb) {
          lb = document.createElement('div');
          lb.id = 'pvDiagramLightbox';
          lb.className = 'pv-lightbox-overlay';
          lb.innerHTML = `
            <button type="button" class="pv-lightbox-close" aria-label="Đóng ảnh phóng to">×</button>
            <div class="pv-lightbox-content">
              <img src="assets/images/co-che-d-limonene.jpg" alt="Sơ đồ 3 bước cơ chế D-Limonene phá vỡ và làm sạch dầu mỡ" />
            </div>
          `;
          document.body.appendChild(lb);
          lb.addEventListener('click', (e) => {
            if (e.target === lb || e.target.closest('.pv-lightbox-close')) {
              lb.classList.remove('open');
            }
          });
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lb.classList.contains('open')) lb.classList.remove('open');
          });
        }
        lb.classList.add('open');
      };
      diagramTrigger.addEventListener('click', openLightbox);
      diagramTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox();
        }
      });
    }

    // Topic filters
    view.querySelectorAll('[data-sci-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        scienceFilter = btn.dataset.sciFilter;
        renderScience(view);
      });
    });

    // Glossary hover & click
    const glossaryPopover = view.querySelector('#glossaryPopover');
    const showGlossary = (idx) => {
      const g = glossaryTerms[idx];
      if (!g || !glossaryPopover) return;
      view.querySelectorAll('.glossary-badge').forEach((b, i) => b.classList.toggle('active', i === idx));
      glossaryPopover.innerHTML = `
        <div class="glossary-pop-title">${g.term} <span class="glossary-pop-formula">${g.formula}</span></div>
        <p>${g.desc}</p>
      `;
    };
    view.querySelectorAll('.glossary-badge').forEach((btn) => {
      const idx = Number(btn.dataset.glossary);
      btn.addEventListener('click', () => showGlossary(idx));
      btn.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) showGlossary(idx);
      });
    });

    // 7 detailed science cards
    view.querySelectorAll('.science-card').forEach((card) => {
      card.addEventListener('click', () => {
        navigate('science-detail', card.dataset.topic);
      });
    });

    // 3D Flip flashcards
    view.querySelectorAll('.flip-card').forEach((card) => {
      const toggleFlip = () => {
        const flipped = card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', String(flipped));
      };
      card.addEventListener('click', toggleFlip);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFlip();
        }
      });
    });
  }

  function renderScienceDetail(view, id) {
    const topic = DATA.scienceTopics.find((t) => t.id === id);
    if (!topic) return navigate('science');

    view.innerHTML = `
      ${renderBreadcrumb([
        { label: 'Trang chủ', route: 'home' },
        { label: 'Kiến thức khoa học', route: 'science' },
        { label: topic.title }
      ])}

      <article class="info-box" style="padding:30px;border-radius:var(--radius-lg);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
          <div>
            <h1 style="font-size:1.8rem;">${topic.title}</h1>
            <p style="color:var(--green-mid);font-weight:600;">${topic.subtitle}</p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;font-size:0.97rem;color:var(--text-main);">
          ${topic.content.map((p) => `<p>${p}</p>`).join('')}
        </div>

        ${topic.hasPhWidget ? renderPhWidgetHtml() : ''}

        <div style="margin-top:20px;background:var(--bg-sage-soft);padding:16px 20px;border-radius:14px;border-left:4px solid var(--green-accent);">
          <strong>Ghi nhớ cốt lõi:</strong> ${topic.keyTakeaway}
        </div>
      </article>
    `;

    bindNavTriggers(view);

    if (topic.hasPhWidget) {
      bindPhWidget(view);
    }
  }

  function renderPhWidgetHtml() {
    return `
      <div class="ph-widget">
        <h4> Tương tác: Kéo thanh thang đo pH (0 – 14)</h4>
        <div class="ph-bar"></div>
        <input type="range" id="phSlider" class="ph-slider" min="0" max="14" step="0.5" value="3.5" />
        <div class="ph-readout" id="phReadout"></div>
      </div>
    `;
  }

  function bindPhWidget(view) {
    const slider = view.querySelector('#phSlider');
    const readout = view.querySelector('#phReadout');
    const describePh = (val) => {
      if (val <= 2) return { type: 'Axit mạnh', sample: 'Axit đậm đặc / Axit pin' };
      if (val <= 3.5) return { type: 'Axit nhẹ', sample: 'Giấm trắng (~2.5–3.0) — nguyên liệu PEELVERSE' };
      if (val <= 5.5) return { type: 'Axit dịu nhẹ', sample: 'Dung dịch PEELVERSE sau pha loãng (~3.5–4.5)' };
      if (val < 7) return { type: 'Axit rất nhẹ', sample: 'Nước mưa, sữa tươi' };
      if (val === 7) return { type: 'Trung tính', sample: 'Nước tinh khiết (H₂O)' };
      if (val <= 9.5) return { type: 'Bazơ (kiềm) nhẹ', sample: 'Dung dịch baking soda' };
      return { type: 'Bazơ mạnh', sample: 'Xà phòng đặc, nước tẩy công nghiệp' };
    };
    const update = () => {
      const v = Number(slider.value);
      const info = describePh(v);
      readout.innerHTML = `
        <div><strong>pH = ${v.toFixed(1)}</strong> — <span style="color:var(--green-mid);font-weight:700;">${info.type}</span></div>
        <div style="font-size:0.86rem;color:var(--text-muted);">Ví dụ: ${info.sample}</div>
      `;
    };
    slider.addEventListener('input', update);
    update();
  }

  // ===== 06. PEEL LAB — CANVAS 2D EXTRACTION GAME =====
  function renderGameHub(view) {
    view.innerHTML = `<div id="peelLabMount"></div>`;
    const mount = view.querySelector('#peelLabMount');
    if (mount && GAMES && GAMES.mountLab) {
      GAMES.mountLab(mount, (shiftScore, bestScore) => {
        state.clearedGames[1] = Math.max(state.clearedGames[1] || 0, bestScore);
        addNotification(`PEEL LAB: Đạt ${shiftScore} điểm (Kỷ lục: ${bestScore} điểm)!`);
        saveState();
      });
    }
  }

  function renderGamePlay(view) {
    renderGameHub(view);
  }

  // ===== 07. CREATOR STUDIO ROUTE =====
  function renderCreatorRoute(view) {
    const auth = window.PEELVERSE_AUTH;
    const user = auth && auth.getUser ? auth.getUser() : null;
    const profile = auth && auth.getProfile ? auth.getProfile() : null;
    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Kênh Nhà sáng tạo' }])}
      <div id="creatorStudioMount"></div>
    `;
    const mount = view.querySelector('#creatorStudioMount');
    if (window.PEELVERSE_CREATOR) {
      window.PEELVERSE_CREATOR.renderCreatorStudio(mount, {
        user,
        profile,
        onProductsChanged: () => {
          communityLoaded = false;
          refreshCommunityProducts(true);
        }
      });
    }
  }

  function openProductQuickView(productId) {
    const p = getAllShopProducts().find((item) => item.id === productId);
    const overlay = document.getElementById('productQuickViewOverlay');
    const body = document.getElementById('productQuickViewBody');
    if (!p || !overlay || !body) return;

    const isCreatorProd = p.source === 'creator';
    const outOfStock = isCreatorProd && Number(p.stock) <= 0;
    const shortVol = String((p.specs && p.specs.volume) || '').replace(/^Dung tích:\s*/i, '').trim();
    const shortPeel = String((p.specs && p.specs.peel) || '').trim();
    const benefit = String((p.specs && p.specs.benefit) || '').trim();

    body.innerHTML = `
      <div class="qv-media">
        <img src="${p.image}" alt="${p.name}" onerror="this.onerror=null;this.src='assets/images/prod-table-spray.jpg';" />
      </div>
      <div class="qv-details">
        <span class="eyebrow-tag">${p.category}${shortVol ? `• ${shortVol}`: ''}</span>
        <h2 id="qvTitle" class="serif-heading" style="font-size:1.85rem;margin:8px 0 10px;line-height:1.18;">${p.name}</h2>
        <div class="qv-price">${formatVND(p.price)}</div>
        ${
          isCreatorProd
            ? `<div class="qv-creator-row">Gian hàng: <strong>${p.shopName}</strong> • Đã kiểm duyệt AI ✓</div>`
            : `<div class="qv-creator-row">Chính hãng PEELVERSE • Công thức thực vật</div>`
        }
        <p class="qv-desc">${p.desc}</p>
        <div class="qv-meta-list">
          ${shortPeel ? `<div><span>Thành phần vỏ quả</span><strong>${shortPeel}</strong></div>`: ''}
          ${benefit ? `<div><span>Đặc tính an toàn</span><strong>${benefit}</strong></div>`: ''}
        </div>
        <button type="button" id="qvAddToCartBtn" class="btn btn-primary" style="width:100%;margin-top:18px;" ${outOfStock ? 'disabled' : ''}>
          ${outOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    `;

    const addBtn = body.querySelector('#qvAddToCartBtn');
    if (addBtn && !outOfStock) {
      addBtn.addEventListener('click', () => {
        addToCart(p.id);
        closeProductQuickView();
        if (currentRoute === 'shop') render();
      });
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeProductQuickView() {
    const overlay = document.getElementById('productQuickViewOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderShop(view) {
    const categories = [
      { key: 'Tất cả', label: 'Tất cả' },
      { key: 'Lau bề mặt & Bếp', label: 'Lau bề mặt' },
      { key: 'Rửa chén & Lau sàn', label: 'Rửa chén & Sàn' },
      { key: 'Xịt thơm & Khử mùi', label: 'Xịt thơm' },
      { key: 'Combo tiết kiệm', label: 'Combo' },
      { key: 'Thủ công từ vỏ quả', label: 'Thủ công' }
    ];

    const allProducts = getAllShopProducts();
    let list = allProducts.filter((p) => {
      const matchSource =
        shopSourceFilter === 'Tất cả'
          ? true
          : shopSourceFilter === 'Chính hãng PEELVERSE'
          ? p.source === 'official'
          : p.source === 'creator';
      const matchCat = shopCategory === 'Tất cả' ? true : p.category === shopCategory;
      let matchPrice = true;
      if (shopPriceRange === 'under60') matchPrice = p.price < 60000;
      else if (shopPriceRange === '60to120') matchPrice = p.price >= 60000 && p.price <= 120000;
      else if (shopPriceRange === 'over120') matchPrice = p.price > 120000;
      return matchSource && matchCat && matchPrice;
    });

    if (shopSort === 'rating-desc') {
      list = [...list].sort(
        (a, b) => Number(b.rating ?? 4.8) - Number(a.rating ?? 4.8) || Number(b.review_count ?? 0) - Number(a.review_count ?? 0)
      );
    } else if (shopSort === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (shopSort === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (shopSort === 'newest') {
      list = [...list].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }

    view.innerHTML = `
      <!-- Compact Anti-Box Editorial Header + Liquid Gooey Tabs -->
      <section class="editorial-page-header">
        <div class="editorial-page-header-left">
          <h1 class="editorial-h1">Cửa hàng</h1>
          <p class="editorial-sub">Dung dịch lau rửa, nước rửa chén enzyme và xịt khử mùi từ vỏ trái cây.</p>
        </div>
        <div class="pv-ltabs pv-ltabs--shop" data-ltabs-id="shop">
          <div class="pv-ltabs__strip" aria-hidden="true"></div>
          <div class="pv-ltabs__surface" aria-hidden="true">
            <div class="pv-ltabs__gooLayer">
              <div class="pv-ltabs__blob"></div>
              <div class="pv-ltabs__body"></div>
            </div>
            <div class="pv-ltabs__indicator"></div>
          </div>
          <div class="pv-ltabs__nav" role="tablist" aria-label="Chế độ xem Cửa hàng">
            <button type="button" class="pv-ltabs__btn ${shopViewTab === 'catalog' ? 'active' : ''}" data-shop-tab="catalog" role="tab" aria-selected="${shopViewTab === 'catalog'}">
              <span>Cửa hàng sinh học</span>
            </button>
            <button type="button" class="pv-ltabs__btn ${shopViewTab === 'orders' ? 'active' : ''}" data-shop-tab="orders" role="tab" aria-selected="${shopViewTab === 'orders'}">
              <span>Đơn hàng của tôi</span>
            </button>
          </div>
        </div>
      </section>

      <div class="pv-tab-panel">
      ${
        shopViewTab === 'orders'
          ? `<div id="buyerOrdersMount" style="margin-top:20px;"></div>`
          : `
      <!-- Single Unified Hairline Filter Bar -->
      <div class="unified-filter-bar">
        <div class="filter-text-links" role="tablist" aria-label="Danh mục sản phẩm">
          ${categories
            .map(
              (cat) => `
            <button type="button" class="filter-text-link ${shopCategory === cat.key ? 'active' : ''}" data-shop-cat="${cat.key}">
              ${cat.label}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="unified-selects">
          <select id="shopSourceSelect" class="inline-ghost-select" aria-label="Nguồn sản phẩm">
            <option value="Tất cả" ${shopSourceFilter === 'Tất cả' ? 'selected' : ''}>Nguồn: Tất cả</option>
            <option value="Chính hãng PEELVERSE" ${shopSourceFilter === 'Chính hãng PEELVERSE' ? 'selected' : ''}>PEELVERSE</option>
            <option value="Cộng đồng Nhà sáng tạo" ${shopSourceFilter === 'Cộng đồng Nhà sáng tạo' ? 'selected' : ''}>Nhà sáng tạo</option>
          </select>

          <select id="shopPriceFilter" class="inline-ghost-select" aria-label="Lọc theo mức giá">
            <option value="all" ${shopPriceRange === 'all' ? 'selected' : ''}>Giá: Tất cả</option>
            <option value="under60" ${shopPriceRange === 'under60' ? 'selected' : ''}>Dưới 60.000đ</option>
            <option value="60to120" ${shopPriceRange === '60to120' ? 'selected' : ''}>60.000đ – 120.000đ</option>
            <option value="over120" ${shopPriceRange === 'over120' ? 'selected' : ''}>Trên 120.000đ</option>
          </select>

          <select id="shopSortSelect" class="inline-ghost-select" aria-label="Sắp xếp sản phẩm">
            <option value="rating-desc" ${shopSort === 'rating-desc' ? 'selected' : ''}>Đánh giá: Cao đến thấp</option>
            <option value="price-asc" ${shopSort === 'price-asc' ? 'selected' : ''}>Giá: Thấp đến cao</option>
            <option value="price-desc" ${shopSort === 'price-desc' ? 'selected' : ''}>Giá: Cao đến thấp</option>
            <option value="newest" ${shopSort === 'newest' ? 'selected' : ''}>Mới nhất</option>
          </select>
        </div>
      </div>

      ${
        !communityLoaded && communityLoading && window.PEELVERSE_CREATOR
          ? window.PEELVERSE_CREATOR.renderSkeletonCards(3)
          : list.length === 0
          ? `<div class="editorial-empty">Không có sản phẩm nào khớp bộ lọc hiện tại.</div>`
          : `
      <section class="lookbook-grid">
        ${list
          .map((p) => {
            const inCart = cart.find((c) => c.id === p.id);
            const isCreatorProd = p.source === 'creator';
            const outOfStock = isCreatorProd && Number(p.stock) <= 0;
            const shortCat =
              p.category === 'Lau bề mặt & Bếp'
                ? 'LAU BỀ MẶT'
                : p.category === 'Rửa chén & Lau sàn'
                ? 'RỬA CHÉN & SÀN'
                : p.category === 'Xịt thơm & Khử mùi'
                ? 'XỊT THƠM'
                : p.category === 'Combo tiết kiệm'
                ? 'COMBO'
                : p.category.toUpperCase();
            const rawVol = String((p.specs && p.specs.volume) || '').replace(/^(Dung tích|Tổng dung tích):\s*/i, '').trim();
            const shortPeel = String((p.specs && p.specs.peel) || '').trim();
            const ratingNum = Number(p.rating ?? 4.8).toFixed(1);
            const cornerTag = isCreatorProd
              ? `${p.shopName} • AI ✓`
              : p.badge === 'Bán chạy' || p.badge === 'Tiết kiệm nhất'
              ? p.badge
              : '';

            return `
            <article class="lookbook-item" data-product-id="${p.id}">
              <div class="lookbook-media" data-quickview="${p.id}" role="button" tabindex="0" aria-label="Xem nhanh ${p.name}">
                <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/prod-table-spray.jpg';" />
                ${cornerTag ? `<span class="lookbook-tag">${cornerTag}</span>`: ''}
                <span class="lookbook-rating-pill" aria-label="Đánh giá ${ratingNum} sao">★ ${ratingNum}</span>
              </div>
              <div class="lookbook-info">
                <div class="lookbook-meta">${shortCat}${rawVol ? ` • ${rawVol}` : ''} • ★ ${ratingNum}</div>
                <h3 class="lookbook-title" data-quickview="${p.id}">${p.name}</h3>
                <p class="lookbook-ing">${shortPeel || 'Chiết xuất tinh dầu vỏ trái cây tự nhiên'}</p>
                <div class="lookbook-foot">
                  <span class="lookbook-price">${formatVND(p.price)}</span>
                  <button type="button" class="lookbook-add-btn ${inCart ? 'in-cart' : ''}" data-add-cart="${p.id}" ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Hết hàng' : inCart ? `Đã thêm (${inCart.qty})` : '<span class="btn-lbl-desktop">Thêm vào giỏ</span><span class="btn-lbl-mobile">+ Thêm</span>'}
                  </button>
                </div>
              </div>
            </article>
          `;
          })
          .join('')}
      </section>`
      }`
      }

      </div>
    `;

    if (window.PEELVERSE_MOTION) {
      window.PEELVERSE_MOTION.initLiquidTabs(view);
    }

    view.querySelectorAll('[data-shop-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shopViewTab = btn.dataset.shopTab;
        renderShop(view);
      });
    });

    if (shopViewTab === 'orders') {
      const mount = view.querySelector('#buyerOrdersMount');
      const user = window.PEELVERSE_AUTH && window.PEELVERSE_AUTH.getUser ? window.PEELVERSE_AUTH.getUser() : null;
      if (mount && window.PEELVERSE_CREATOR) {
        window.PEELVERSE_CREATOR.renderBuyerOrdersPanel(mount, user);
      }
      return;
    }

    if (!communityLoaded && !communityLoading) {
      refreshCommunityProducts().then(() => {
        if (currentRoute === 'shop' && shopViewTab === 'catalog') {
          renderShop(view);
        }
      });
    }

    view.querySelectorAll('[data-shop-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shopCategory = btn.dataset.shopCat;
        renderShop(view);
      });
    });

    const sourceSelectEl = view.querySelector('#shopSourceSelect');
    if (sourceSelectEl) {
      sourceSelectEl.addEventListener('change', (e) => {
        shopSourceFilter = e.target.value;
        renderShop(view);
      });
    }

    const priceFilterEl = view.querySelector('#shopPriceFilter');
    if (priceFilterEl) {
      priceFilterEl.addEventListener('change', (e) => {
        shopPriceRange = e.target.value;
        renderShop(view);
      });
    }

    const sortEl = view.querySelector('#shopSortSelect');
    if (sortEl) {
      sortEl.addEventListener('change', (e) => {
        shopSort = e.target.value;
        renderShop(view);
      });
    }

    view.querySelectorAll('[data-quickview]').forEach((el) => {
      el.addEventListener('click', () => openProductQuickView(el.dataset.quickview));
    });

    view.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        addToCart(btn.dataset.addCart);
        renderShop(view);
      });
    });
  }

  function bindNavTriggers(root) {
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => navigate(el.dataset.nav));
    });
  }

  // ===== SMART LIVE SEARCH / COMMAND PALETTE =====
  const RECENT_SEARCH_KEY = 'peelverse_recent_search_v1';

  function normalizeVi(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const normText = normalizeVi(text);
    const normQuery = normalizeVi(query).trim();
    if (!normQuery) return text;
    const idx = normText.indexOf(normQuery);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const hit = text.slice(idx, idx + normQuery.length);
    const after = text.slice(idx + normQuery.length);
    return `${before}<mark class="search-mark">${hit}</mark>${after}`;
  }

  function loadRecentSearches() {
    try {
      const raw = localStorage.getItem(RECENT_SEARCH_KEY);
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr.slice(0, 4) : [];
    } catch {
      return [];
    }
  }

  function saveRecentSearch(q) {
    const clean = q.trim();
    if (!clean || clean.length < 2) return;
    const prev = loadRecentSearches().filter((x) => normalizeVi(x) !== normalizeVi(clean));
    prev.unshift(clean);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(prev.slice(0, 4)));
  }

  function setupSearch() {
    const input = document.getElementById('globalSearch');
    const dropdown = document.getElementById('searchDropdown');
    const kbdEl = document.getElementById('searchShortcutKbd');

    if (kbdEl) {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
      kbdEl.textContent = isMac ? '⌘K' : 'Ctrl K';
    }

    const navEntries = [
      { title: ' Khám phá (Trang chủ)', desc: 'Tổng quan dự án PEELVERSE, khởi nguồn, sứ mệnh & tầm nhìn', group: 'Điều hướng', action: () => navigate('home') },
      { title: ' Khám phá nguyên liệu', desc: `Danh sách ${DATA.ingredients.length} nguyên liệu nghiên cứu và đặc tính`, group: 'Điều hướng', action: () => navigate('ingredients') },
      { title: ' Quy trình thực hiện', desc: '6 bước thu gom, làm sạch, sơ chế, chiết xuất, lọc & đánh giá', group: 'Điều hướng', action: () => navigate('process') },
      { title: ' Kiến thức khoa học', desc: '7 bài học về tinh dầu, limonene, độ pH, chiết xuất, kinh tế tuần hoàn', group: 'Điều hướng', action: () => navigate('science') },
      { title: ' Mô phỏng chiết xuất', desc: '6 màn chơi tương tác tạo dung dịch lau bàn từ vỏ cam', group: 'Điều hướng', action: () => navigate('game') },
      { title: ' Cửa hàng sinh học', desc: 'Nước lau rửa, nước rửa chén enzyme & xịt khử mùi từ vỏ trái cây', group: 'Điều hướng', action: () => navigate('shop') },
      { title: ' Đăng ký bán hàng', desc: 'Xác minh độ tuổi (18+) & CCCD để mở gian hàng trên PEELVERSE', group: 'Điều hướng', action: () => { window.location.href = './seller-register.html'; } }
    ];

    const index = [
      ...navEntries.map((n) => ({
        ...n,
        searchBlob: normalizeVi(`${n.title} ${n.desc} ${n.group}`)
      })),
      ...DATA.ingredients.map((i) => ({
        title: `${i.emoji} ${i.name}`,
        desc: i.shortRole,
        group: 'Nguyên liệu',
        searchBlob: normalizeVi(`${i.name} ${i.category} ${i.shortRole} ${i.description}`),
        action: () => {
          navigate('ingredient-detail', i.id);
          focusElementWithPulse('.detail-hero');
        }
      })),
      ...DATA.scienceTopics.map((s) => ({
        title: `${s.emoji} ${s.title}`,
        desc: s.subtitle,
        group: 'Kiến thức khoa học',
        searchBlob: normalizeVi(`${s.title} ${s.subtitle} ${s.summary}`),
        action: () => {
          navigate('science-detail', s.id);
          focusElementWithPulse('.info-box');
        }
      })),
      ...DATA.processSteps.map((p) => ({
        title: `${p.emoji} Bước ${p.step}: ${p.title}`,
        desc: p.summary,
        group: 'Quy trình thực hiện',
        searchBlob: normalizeVi(`buoc ${p.step} ${p.title} ${p.summary} ${p.details}`),
        action: () => {
          navigate('process');
          focusElementWithPulse(`[data-step-card="${p.step}"]`);
        }
      })),
      ...GAMES.stages.map((g) => ({
        title: `PEEL LAB • ${g.title}`,
        desc: g.desc,
        group: 'Mô phỏng',
        searchBlob: normalizeVi(`peel lab mo phong chiet xuat ${g.title} ${g.desc}`),
        action: () => navigate('game')
      })),
      ...getAllShopProducts().map((sp) => ({
        title: `${sp.name}`,
        desc: `${formatVND(sp.price)} • ${sp.category}`,
        group: 'Sản phẩm sinh học',
        searchBlob: normalizeVi(`nuoc lau rua tay rua chen lau san xit khu mui sinh hoc gio hang ${sp.name} ${sp.category} ${sp.desc}`),
        action: () => {
          shopViewTab = 'catalog';
          shopSourceFilter = 'Tất cả';
          shopCategory = 'Tất cả';
          shopPriceRange = 'all';
          navigate('shop');
          focusElementWithPulse(`[data-product-id="${sp.id}"]`);
        }
      })),
      {
        title: `Liên hệ Zalo: ${CONTACT.zalo}`,
        desc: 'Mở hộp thoại liên hệ nhanh hoặc nhắn Zalo hỗ trợ PEELVERSE',
        group: 'Liên hệ',
        searchBlob: normalizeVi(`lien he contact zalo ${CONTACT.zalo} ho tro tu van`),
        action: () => openContactModal()
      },
      {
        title: `Email: ${CONTACT.email}`,
        desc: 'Gửi email hoặc sao chép địa chỉ liên hệ dự án PEELVERSE',
        group: 'Liên hệ',
        searchBlob: normalizeVi(`lien he contact email ${CONTACT.email} gmail`),
        action: () => openContactModal()
      }
    ];

    const quickChips = ['Vỏ cam', 'Lá bạc hà', 'Limonene', 'Độ pH', 'Mô phỏng', 'Nước lau rửa', 'Đăng ký bán hàng'];
    let flatMatches = [];
    let activeIdx = -1;

    function openItem(item, queryUsed) {
      if (queryUsed) saveRecentSearch(queryUsed);
      item.action();
      input.value = '';
      dropdown.classList.add('hidden');
      const sp = document.getElementById('searchBarPanel');
      if (sp) sp.classList.add('hidden');
      input.blur();
    }

    function movePsearchSheet(listEl, rowEl) {
      if (!listEl) return;
      const sheet = listEl.querySelector('.psearch__sheet');
      if (!sheet) return;
      if (!rowEl) {
        sheet.style.opacity = '0';
        return;
      }
      sheet.style.opacity = '1';
      sheet.style.transform = `translate3d(0, ${rowEl.offsetTop}px, 0)`;
      sheet.style.height = `${rowEl.offsetHeight}px`;
    }

    function updateActiveHighlight() {
      const listEl = dropdown.querySelector('.psearch__list');
      const rows = dropdown.querySelectorAll('.psearch__row[data-midx]');
      let activeRow = null;
      rows.forEach((row, i) => {
        const isHit = i === activeIdx;
        row.classList.toggle('is-active', isHit);
        if (isHit) {
          activeRow = row;
          row.scrollIntoView({ block: 'nearest' });
        }
      });
      movePsearchSheet(listEl, activeRow);
    }

    function renderChipsHtml(count) {
      const chipColors = ['#EDE5D6', '#E4ECE5', '#F3E5DA', '#E6E9E4', '#EFE6DC', '#E2E9E5'];
      return `
        <div class="psearch__chips" aria-label="Từ khóa gợi ý">
          <button type="button" class="psearch__chip psearch__chip--lead" data-reset-search>
            <span class="psearch__count">${count}</span>
            <span>Từ khóa phổ biến</span>
          </button>
          ${quickChips
            .map(
              (c, idx) => `
            <button type="button" class="psearch__chip" style="background:${chipColors[idx % chipColors.length]};" data-chip="${c}">
              <span class="psearch__chip-x" aria-hidden="true">→</span>
              <span>${c}</span>
            </button>
          `
            )
            .join('')}
        </div>
      `;
    }

    function bindPsearchListInteractions(listEl) {
      if (!listEl) return;
      listEl.addEventListener('pointerover', (e) => {
        const row = e.target.closest('.psearch__row');
        if (row && listEl.contains(row)) movePsearchSheet(listEl, row);
      });
      listEl.addEventListener('pointerleave', () => {
        const activeRow = listEl.querySelector('.psearch__row.is-active');
        movePsearchSheet(listEl, activeRow);
      });
    }

    function renderDropdown() {
      const rawQ = input.value.trim();
      const normQ = normalizeVi(rawQ);
      activeIdx = -1;

      if (!normQ) {
        flatMatches = [];
        const recents = loadRecentSearches();
        dropdown.innerHTML = `
          <div class="psearch__panel">
            <div class="psearch__head">
              <span class="psearch__head-label">${recents.length > 0 ? 'Tìm kiếm gần đây' : 'Khám phá nhanh PEELVERSE'}</span>
              ${
                recents.length > 0
                  ? `<button type="button" class="psearch__action" id="clearRecentSearchBtn">Xóa tất cả</button>`
                  : `<span class="psearch__head-label">${index.length} mục</span>`
              }
            </div>
            <ul class="psearch__list">
              <div class="psearch__sheet" aria-hidden="true"></div>
              ${
                recents.length > 0
                  ? recents
                      .map(
                        (r, idx) => `
                <li class="psearch__row" data-recent-row="${idx}">
                  <span class="psearch__divider" aria-hidden="true"></span>
                  <div class="psearch__row-body" data-chip="${r}">
                    <div class="psearch__tile" aria-hidden="true">
                      <div class="psearch__tile-art" style="background:#EAE6DC;display:grid;place-items:center;color:#162A22;font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;">
                        ${String(r).trim().charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div class="psearch__row-text">
                      <div class="psearch__row-title">${r}</div>
                      <div class="psearch__row-sub">Tìm kiếm gần đây</div>
                    </div>
                    <div class="psearch__remove-slot">
                      <button type="button" class="psearch__remove" data-remove-recent="${r}" aria-label="Xóa ${r}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      <span class="psearch__tip" aria-hidden="true">Xóa<span class="psearch__tip-arrow"></span></span>
                    </div>
                  </div>
                </li>
              `
                      )
                      .join('')
                  : `
                <li class="psearch__empty">
                  <div>Gõ có dấu hoặc không dấu (VD: <strong>vo cam</strong>, <strong>la bac ha</strong>, <strong>rua chen</strong>) hoặc chọn từ khóa bên dưới.</div>
                </li>
              `
              }
            </ul>
            ${renderChipsHtml(quickChips.length)}
          </div>
          <div class="psearch__foot"></div>
        `;

        bindPsearchListInteractions(dropdown.querySelector('.psearch__list'));

        dropdown.querySelectorAll('[data-chip]').forEach((el) => {
          el.addEventListener('click', (e) => {
            if (e.target.closest('[data-remove-recent]')) return;
            input.value = el.dataset.chip;
            renderDropdown();
            input.focus();
          });
        });

        dropdown.querySelectorAll('[data-remove-recent]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const term = btn.dataset.removeRecent;
            const row = btn.closest('.psearch__row');
            const nextRecents = loadRecentSearches().filter((x) => x !== term);
            localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextRecents));
            if (row) {
              row.classList.add('psearch__row--leaving');
              setTimeout(() => renderDropdown(), 180);
            } else {
              renderDropdown();
            }
          });
        });

        const clearBtn = dropdown.querySelector('#clearRecentSearchBtn');
        if (clearBtn) {
          clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.removeItem(RECENT_SEARCH_KEY);
            renderDropdown();
          });
        }
        dropdown.classList.remove('hidden');
        return;
      }

      flatMatches = index.filter((item) => item.searchBlob.includes(normQ)).slice(0, 10);

      dropdown.innerHTML = `
        <div class="psearch__panel">
          <div class="psearch__head">
            <span class="psearch__head-label">Kết quả tìm kiếm</span>
            <button type="button" class="psearch__action" id="clearQueryBtn">Xóa từ khóa</button>
          </div>
          <ul class="psearch__list">
            <div class="psearch__sheet" aria-hidden="true"></div>
            ${
              flatMatches.length === 0
                ? `<li class="psearch__empty"><div>Không tìm thấy kết quả cho "<strong>${rawQ}</strong>". Thử từ khóa như <em>vỏ cam, lá bạc hà, limonene, độ pH</em>.</div></li>`
                : flatMatches
                    .map((item, idx) => {
                      const badgeChar = (item.group || 'P').trim().charAt(0).toUpperCase();
                      return `
                <li class="psearch__row" role="option" data-midx="${idx}">
                  <span class="psearch__divider" aria-hidden="true"></span>
                  <div class="psearch__row-body">
                    <div class="psearch__tile" aria-hidden="true">
                      <div class="psearch__tile-art" style="background:#162A22;display:grid;place-items:center;color:#F6F4EE;font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;">
                        ${badgeChar}
                      </div>
                    </div>
                    <div class="psearch__row-text">
                      <div class="psearch__row-title">${highlightMatch(item.title, rawQ)}</div>
                      <div class="psearch__row-sub">${item.group} • ${highlightMatch(item.desc, rawQ)}</div>
                    </div>
                  </div>
                </li>
              `;
                    })
                    .join('')
            }
          </ul>
          ${renderChipsHtml(flatMatches.length)}
        </div>
        <div class="psearch__foot"></div>
      `;

      const listEl = dropdown.querySelector('.psearch__list');
      bindPsearchListInteractions(listEl);

      const clearQueryBtn = dropdown.querySelector('#clearQueryBtn');
      if (clearQueryBtn) {
        clearQueryBtn.addEventListener('click', () => {
          input.value = '';
          renderDropdown();
          input.focus();
        });
      }

      dropdown.querySelectorAll('[data-chip]').forEach((chip) => {
        chip.addEventListener('click', () => {
          input.value = chip.dataset.chip;
          renderDropdown();
          input.focus();
        });
      });

      dropdown.querySelectorAll('.psearch__row[data-midx]').forEach((row) => {
        row.addEventListener('click', () => {
          const idx = Number(row.dataset.midx);
          openItem(flatMatches[idx], rawQ);
        });
      });

      if (flatMatches.length > 0) {
        activeIdx = 0;
        updateActiveHighlight();
      }
      dropdown.classList.remove('hidden');
    }

    input.addEventListener('focus', renderDropdown);
    input.addEventListener('input', renderDropdown);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
        input.blur();
        return;
      }
      if (flatMatches.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = (activeIdx + 1) % flatMatches.length;
        updateActiveHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = (activeIdx - 1 + flatMatches.length) % flatMatches.length;
        updateActiveHighlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const chosen = flatMatches[activeIdx >= 0 ? activeIdx : 0];
        if (chosen) openItem(chosen, input.value.trim());
      }
    });

    // Global shortcut: Ctrl+K / Cmd+K + Header Search Trigger
    const searchPanel = document.getElementById('searchBarPanel');
    const searchTriggerBtn = document.getElementById('searchTriggerBtn');
    const closeSearchPanelBtn = document.getElementById('closeSearchPanelBtn');

    const openSearchPanel = () => {
      if (searchPanel) searchPanel.classList.remove('hidden');
      input.focus();
      renderDropdown();
    };
    const closeSearchPanel = () => {
      if (searchPanel) searchPanel.classList.add('hidden');
      dropdown.classList.add('hidden');
      input.blur();
    };

    if (searchTriggerBtn) {
      searchTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (searchPanel && !searchPanel.classList.contains('hidden')) {
          closeSearchPanel();
        } else {
          openSearchPanel();
        }
      });
    }
    if (closeSearchPanelBtn) {
      closeSearchPanelBtn.addEventListener('click', closeSearchPanel);
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchPanel();
      } else if (e.key === 'Escape' && searchPanel && !searchPanel.classList.contains('hidden')) {
        closeSearchPanel();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#searchBarPanel') && !e.target.closest('#searchTriggerBtn')) {
        if (searchPanel) searchPanel.classList.add('hidden');
        dropdown.classList.add('hidden');
      }
    });
  }

  // ===== SIDEBAR COLLAPSE, RESIZE & TOOLTIP =====
  const SIDEBAR_STORAGE_KEY = 'peelverse_sidebar_v1';
  const SIDEBAR_DEFAULT_WIDTH = 260;
  const SIDEBAR_COLLAPSED_WIDTH = 76;
  const SIDEBAR_MIN_WIDTH = 220;
  const SIDEBAR_MAX_WIDTH = 340;
  const SIDEBAR_SNAP_COLLAPSE = 160;

  function loadSidebarPrefs() {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (!raw) return { collapsed: false, width: SIDEBAR_DEFAULT_WIDTH };
      const p = JSON.parse(raw);
      const w = Number(p.width);
      return {
        collapsed: Boolean(p.collapsed),
        width: Number.isFinite(w) ? Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w)) : SIDEBAR_DEFAULT_WIDTH
      };
    } catch {
      return { collapsed: false, width: SIDEBAR_DEFAULT_WIDTH };
    }
  }

  let sidebarPrefs = loadSidebarPrefs();

  function saveSidebarPrefs() {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarPrefs));
  }

  let sidebarManualOverride = false;

  function applySidebarLayout() {
    const w = window.innerWidth;
    const isMobile = w <= 767;
    const isTabletPortrait = w >= 768 && w <= 1023 && window.innerHeight > w;
    const btn = document.getElementById('sidebarCollapseBtn');

    if (isMobile) {
      document.body.classList.remove('sidebar-collapsed');
      document.documentElement.style.setProperty('--current-sidebar-width', `${SIDEBAR_DEFAULT_WIDTH}px`);
      return;
    }

    const shouldCollapse = sidebarManualOverride ? sidebarPrefs.collapsed : (sidebarPrefs.collapsed || isTabletPortrait);

    if (shouldCollapse) {
      document.body.classList.add('sidebar-collapsed');
      document.documentElement.style.setProperty('--current-sidebar-width', `${SIDEBAR_COLLAPSED_WIDTH}px`);
      if (btn) btn.title = 'Mở rộng thanh bên (⌘B / Ctrl+B)';
    } else {
      document.body.classList.remove('sidebar-collapsed');
      document.documentElement.style.setProperty('--current-sidebar-width', `${sidebarPrefs.width}px`);
      if (btn) btn.title = 'Thu gọn thanh bên (⌘B / Ctrl+B)';
    }
  }

  function toggleSidebarCollapse() {
    if (window.innerWidth <= 767) return;
    sidebarManualOverride = true;
    sidebarPrefs.collapsed = !document.body.classList.contains('sidebar-collapsed');
    saveSidebarPrefs();
    applySidebarLayout();
    hideSidebarTooltip();
  }

  function hideSidebarTooltip() {
    const tip = document.getElementById('sidebarTooltip');
    if (tip) {
      tip.classList.remove('visible');
      tip.setAttribute('aria-hidden', 'true');
    }
  }

  function setupSidebarEnhancements() {
    applySidebarLayout();

    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const resizeHandle = document.getElementById('sidebarResizeHandle');
    const tooltip = document.getElementById('sidebarTooltip');

    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebarCollapse();
      });
    }

    // Keyboard shortcut: Ctrl + B or Cmd + B
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
        e.preventDefault();
        toggleSidebarCollapse();
      }
    });

    // Hover tooltips when collapsed
    if (tooltip) {
      document.querySelectorAll('#sidebar .nav-item[data-tooltip]').forEach((item) => {
        item.addEventListener('mouseenter', () => {
          if (!document.body.classList.contains('sidebar-collapsed') || window.innerWidth <= 768) return;
          const rect = item.getBoundingClientRect();
          tooltip.textContent = item.dataset.tooltip;
          tooltip.style.left = `${rect.right + 12}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
          tooltip.classList.add('visible');
          tooltip.setAttribute('aria-hidden', 'false');
        });
        item.addEventListener('mouseleave', hideSidebarTooltip);
        item.addEventListener('click', hideSidebarTooltip);
      });
    }

    // Drag to resize on desktop
    if (resizeHandle) {
      let isDragging = false;

      resizeHandle.addEventListener('pointerdown', (e) => {
        if (window.innerWidth <= 768) return;
        isDragging = true;
        document.body.classList.add('sidebar-resizing');
        hideSidebarTooltip();
        e.preventDefault();
      });

      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const x = e.clientX;
        if (x < SIDEBAR_SNAP_COLLAPSE) {
          sidebarPrefs.collapsed = true;
          document.body.classList.add('sidebar-collapsed');
          document.documentElement.style.setProperty('--current-sidebar-width', `${SIDEBAR_COLLAPSED_WIDTH}px`);
        } else {
          const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, x));
          sidebarPrefs.collapsed = false;
          sidebarPrefs.width = Math.round(clamped);
          document.body.classList.remove('sidebar-collapsed');
          document.documentElement.style.setProperty('--current-sidebar-width', `${sidebarPrefs.width}px`);
        }
      });

      window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.classList.remove('sidebar-resizing');
        saveSidebarPrefs();
        applySidebarLayout();
      });

      // Double-click handle to reset default width
      resizeHandle.addEventListener('dblclick', () => {
        if (window.innerWidth <= 768) return;
        sidebarPrefs.collapsed = false;
        sidebarPrefs.width = SIDEBAR_DEFAULT_WIDTH;
        saveSidebarPrefs();
        applySidebarLayout();
        showToast('↔ Đã đặt lại độ rộng thanh điều hướng mặc định (260px)');
      });
    }

    window.addEventListener('resize', applySidebarLayout);
  }

  // ===== CONTACT MODAL & CLIPBOARD COPY =====
  function copyTextWithFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function handleCopyButtonClick(btn) {
    const text = btn.dataset.copy;
    const label = btn.dataset.copyLabel || 'nội dung';
    const isTextMode = btn.dataset.copyMode === 'text';
    if (!text) return;

    copyTextWithFallback(text).then(() => {
      if (!btn.dataset.origHtml) {
        btn.dataset.origHtml = btn.innerHTML;
      }
      btn.classList.add('copied');
      btn.innerHTML = isTextMode ? `${PVIcon('check', 15)} <span>Đã sao chép!</span>`: PVIcon('check', 15);
      showToast(`Đã sao chép ${label}: ${text}`);
      clearTimeout(Number(btn.dataset.copyTimer || 0));
      const t = setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = btn.dataset.origHtml;
      }, 1800);
      btn.dataset.copyTimer = String(t);
    });
  }

  function openContactModal() {
    const overlay = document.getElementById('contactOverlay');
    if (!overlay) return;
    const userMenu = document.getElementById('userAccountMenu');
    if (userMenu) userMenu.classList.add('hidden');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeContactModal() {
    const overlay = document.getElementById('contactOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    setupSidebarEnhancements();

    // Sticky Glassmorphism Topbar & Back to Top scroll listener
    const topbarHeader = document.getElementById('topbar');
    const backToTopBtn = document.getElementById('backToTopBtn');
    const onScroll = () => {
      const y = window.scrollY;
      if (topbarHeader) topbarHeader.classList.toggle('scrolled', y > 8);
      if (backToTopBtn) backToTopBtn.classList.toggle('visible', y > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }

    // Contact Modal triggers
    const menuContactBtn = document.getElementById('menuContactBtn');
    const closeContactBtn = document.getElementById('closeContactBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    if (menuContactBtn) {
      menuContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openContactModal();
      });
    }
    if (closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);
    if (contactOverlay) {
      contactOverlay.addEventListener('click', (e) => {
        if (e.target === contactOverlay) closeContactModal();
      });
    }
    // Quick-View Modal close triggers
    const closeQvBtn = document.getElementById('closeQuickViewBtn');
    const qvOverlay = document.getElementById('productQuickViewOverlay');
    if (closeQvBtn) closeQvBtn.addEventListener('click', closeProductQuickView);
    if (qvOverlay) {
      qvOverlay.addEventListener('click', (e) => {
        if (e.target === qvOverlay) closeProductQuickView();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeContactModal();
        closeCartDrawer();
        closeProductQuickView();
      }
    });

    // Global delegated click for copy buttons & route triggers
    document.addEventListener('click', (e) => {
      const copyEl = e.target.closest('[data-copy]');
      if (copyEl) {
        e.preventDefault();
        handleCopyButtonClick(copyEl);
        return;
      }
      const routeEl = e.target.closest('[data-route]');
      if (routeEl) {
        e.preventDefault();
        navigate(routeEl.dataset.route);
      }
    });

    // Cart Drawer & Floating Mini-Cart Bar
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const floatingCartBar = document.getElementById('floatingCartBar');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
    if (floatingCartBar) floatingCartBar.addEventListener('click', openCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    window.addEventListener('peelverse:auth-ready', () => {
      if (currentRoute === 'creator' || currentRoute === 'shop' || currentRoute === 'my-orders') {
        render();
      }
      if (!communityLoaded && !communityLoading) {
        refreshCommunityProducts();
      }
    });

    setupSearch();
    updateHeaderStats();
    updateCartBadges();
    render();
  });
})();
