(() => {
  const DATA = window.PEELVERSE_DATA;
  const GAMES = window.PEELVERSE_GAMES;
  const STORAGE_KEY = 'peelverse_progress_v1';
  const CART_STORAGE_KEY = 'peelverse_cart_v1';

  const defaultState = {
    exploredIngredients: [],
    completedSteps: [],
    completedScience: [],
    clearedGames: {}, // { stageId: bestScore }
    notifications: [
      '🍊 Chào mừng bạn đến với PEELVERSE — From Peel to Purpose!',
      '🛒 Mới: Ghé mục Giỏ hàng để khám phá các chậu cây tái sinh làm sẵn!'
    ]
  };

  const SHOP_PRODUCTS = (DATA && Array.isArray(DATA.shopProducts)) ? DATA.shopProducts : [];

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneObj(defaultState);
      return { ...cloneObj(defaultState), ...JSON.parse(raw) };
    } catch {
      return cloneObj(defaultState);
    }
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  let state = loadState();
  let cart = loadCart(); // [{ id, qty }]
  let lastOrderSummary = null;

  let currentRoute = 'home';
  let activeIngredientId = null;
  let activeScienceId = null;
  let activeGameStageId = null;
  let ingredientFilter = 'Tất cả';
  let ingredientSort = 'default';
  let shopCategory = 'Tất cả';
  let shopPriceRange = 'all';
  let shopSort = 'default';

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
    return cart.reduce((sum, entry) => {
      const prod = SHOP_PRODUCTS.find((p) => p.id === entry.id);
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
    const prod = SHOP_PRODUCTS.find((p) => p.id === productId);
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
    showToast(`🪴 Đã thêm "${prod.name}" vào giỏ!`);
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
    const sideBadge = document.getElementById('sidebarCartBadge');
    const headBadge = document.getElementById('headerCartCount');
    const bottomBadge = document.getElementById('bottomCartBadge');
    [sideBadge, headBadge, bottomBadge].forEach((el) => {
      if (!el) return;
      el.textContent = String(total);
      el.classList.toggle('hidden', total === 0);
    });
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

  function renderCartSupportBoxHtml() {
    return `
      <div class="cart-support-box">
        <div class="cart-support-title inline-icon-heading">${PVIcon('sprout', 16)} <span>Cần tư vấn chọn chậu cây hoặc hỗ trợ đơn hàng?</span></div>
        <div class="cart-support-links">
          <div class="contact-chip-group">
            <a href="https://zalo.me/0355415501" target="_blank" rel="noopener noreferrer" class="contact-link-pill">
              ${PVIcon('message-circle', 15)}<span>Zalo: <strong>0355415501</strong></span>
            </a>
            <button type="button" class="copy-btn" data-copy="0355415501" data-copy-label="số Zalo" aria-label="Sao chép số Zalo">${PVIcon('copy', 15)}</button>
          </div>
          <div class="contact-chip-group">
            <a href="mailto:anhfsd01109@fpt.edu.vn" class="contact-link-pill">
              ${PVIcon('mail', 15)}<span><strong>anhfsd01109@fpt.edu.vn</strong></span>
            </a>
            <button type="button" class="copy-btn" data-copy="anhfsd01109@fpt.edu.vn" data-copy-label="Email" aria-label="Sao chép Email">${PVIcon('copy', 15)}</button>
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
        <div class="cart-summary-box" style="background:linear-gradient(145deg,#F3F8E9,#FFFFFF);border-color:#C7DC9F;text-align:center;padding:24px 18px;">
          <div style="font-size:3rem;margin-bottom:6px;">🌿</div>
          <h3 style="margin-bottom:6px;">Đã ghi nhận yêu cầu đặt chậu xanh!</h3>
          <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:12px;">
            Cảm ơn <strong>${lastOrderSummary.name}</strong> đã ủng hộ dự án tái sinh xanh PEELVERSE. Nhóm sẽ liên hệ qua <strong>${lastOrderSummary.contact}</strong> trong thời gian sớm nhất.
          </p>
          <div style="background:#FFFFFF;border:1px solid var(--border-soft);border-radius:12px;padding:12px;text-align:left;font-size:0.83rem;margin-bottom:14px;">
            <div><strong>Mã đơn:</strong> #${lastOrderSummary.code}</div>
            <div><strong>Số lượng:</strong> ${lastOrderSummary.qty} sản phẩm</div>
            <div><strong>Tổng dự kiến:</strong> ${formatVND(lastOrderSummary.total)}</div>
            <div><strong>Địa chỉ:</strong> ${lastOrderSummary.address}</div>
          </div>
          <button class="btn btn-primary" id="continueShoppingBtn" style="width:100%;">Tiếp tục khám phá chậu xanh</button>
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
        <div style="text-align:center;padding:42px 16px;color:var(--text-muted);">
          <div style="font-size:3.2rem;margin-bottom:10px;">🪴</div>
          <h4 style="margin-bottom:6px;">Giỏ hàng đang trống</h4>
          <p style="font-size:0.86rem;margin-bottom:18px;">Hãy chọn cho góc học tập một chậu cây tái sinh từ vỏ cam, xơ dừa hoặc bã cà phê nhé!</p>
          <button class="btn btn-primary" id="goShopFromEmpty">Xem các mẫu chậu xanh →</button>
        </div>
        ${renderCartSupportBoxHtml()}
      `;
      body.querySelector('#goShopFromEmpty').addEventListener('click', () => {
        closeCartDrawer();
        navigate('shop');
      });
      return;
    }

    const totalAmount = getCartTotalAmount();

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${cart
          .map((entry) => {
            const p = SHOP_PRODUCTS.find((item) => item.id === entry.id);
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

      <form id="ecoOrderForm" class="order-form">
        <h4>📦 Gửi yêu cầu đặt chậu xanh</h4>
        <div class="form-field">
          <label for="orderName">Họ và tên *</label>
          <input id="orderName" type="text" required placeholder="VD: Nguyễn Minh Anh" />
        </div>
        <div class="form-field">
          <label for="orderContact">Số điện thoại hoặc Email *</label>
          <input id="orderContact" type="text" required placeholder="VD: 0912 345 678 hoặc email@..." />
        </div>
        <div class="form-field">
          <label for="orderAddress">Địa chỉ giao / Khu nội trú *</label>
          <input id="orderAddress" type="text" required placeholder="VD: Phòng 302, Ký túc xá..." />
        </div>
        <div class="form-field">
          <label for="orderNote">Ghi chú thêm</label>
          <textarea id="orderNote" rows="2" placeholder="VD: Giao buổi chiều, kèm thiệp chúc mừng..."></textarea>
        </div>
        <button type="submit" class="btn btn-orange" style="width:100%;margin-top:4px;">
          Xác nhận gửi yêu cầu (${formatVND(totalAmount)})
        </button>
      </form>
      ${renderCartSupportBoxHtml()}
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#orderName').value.trim();
      const contact = form.querySelector('#orderContact').value.trim();
      const address = form.querySelector('#orderAddress').value.trim();
      if (!name || !contact || !address) return;

      lastOrderSummary = {
        code: `PV${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        contact,
        address,
        qty: getCartTotalQty(),
        total: getCartTotalAmount()
      };
      cart = [];
      saveCart();
      addNotification(`🪴 Đã gửi yêu cầu đặt đơn #${lastOrderSummary.code} (${formatVND(lastOrderSummary.total)})!`);
      showToast(`🎉 Đã gửi yêu cầu đặt chậu xanh #${lastOrderSummary.code}!`);
      renderCartDrawer();
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

  function getUnlockedBadges() {
    const coreIds = DATA.ingredients.filter((i) => i.isCore).map((i) => i.id);
    const allCoreDone = coreIds.every((id) => state.exploredIngredients.includes(id));
    const gameCount = Object.keys(state.clearedGames).length;
    const overallPct = getOverallProgress();

    const unlocked = new Set();
    if (state.exploredIngredients.length >= 3) unlocked.add('first-peel');
    if (allCoreDone) unlocked.add('all-ingredients');
    if (state.completedScience.length >= 3) unlocked.add('science-spark');
    if (state.completedSteps.length >= DATA.processSteps.length) unlocked.add('master-chemist');
    if (gameCount >= 2) unlocked.add('game-starter');
    if (gameCount >= 6) unlocked.add('peelserve-champion');
    if (state.completedScience.length >= DATA.scienceTopics.length) unlocked.add('eco-scholar');
    if (overallPct >= 100) unlocked.add('peelverse-legend');
    return unlocked;
  }

  function getOverallProgress() {
    const total =
      DATA.ingredients.length +
      DATA.processSteps.length +
      DATA.scienceTopics.length +
      GAMES.stages.length;
    const done =
      state.exploredIngredients.length +
      state.completedSteps.length +
      state.completedScience.length +
      Object.keys(state.clearedGames).length;
    return Math.min(100, Math.round((done / total) * 100));
  }

  function updateHeaderStats() {
    const pct = getOverallProgress();
    const xpEl = document.getElementById('headerXp');
    if (xpEl) xpEl.textContent = `${pct}%`;
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
      emoji: '🏆',
      kicker: 'Xuất sắc • Đã hoàn thành 100%',
      title: 'Bạn đã chinh phục trọn bộ hành trình PEELVERSE! Ghé xem huy hiệu hoặc chậu tái sinh nhé.',
      cta: 'Xem huy hiệu →',
      action: () => navigate('progress')
    };
  }

  function navigate(route, param = null) {
    GAMES.cleanup();
    currentRoute = route;
    activeIngredientId = route === 'ingredient-detail' ? param : null;
    activeScienceId = route === 'science-detail' ? param : null;
    activeGameStageId = route === 'game-play' ? param : null;
    document.body.classList.toggle('in-game-play', route === 'game-play');

    const navKey =
      route === 'ingredient-detail'
        ? 'ingredients'
        : route === 'science-detail'
        ? 'science'
        : route === 'game-play'
        ? 'game'
        : route;

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === navKey);
    });

    document.querySelectorAll('.bottom-nav-item[data-route]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === navKey);
    });

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    const topbarEl = document.getElementById('topbar');
    if (topbarEl) topbarEl.classList.remove('mobile-search-open');

    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function triggerViewTransition(view) {
    triggerRouteProgressBar();
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    applyStaggerAndCountUp(view);
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
    else if (currentRoute === 'progress') renderProgress(view);
    bindNavTriggers(view);
    triggerViewTransition(view);
  }

  // ===== 01. HOME VIEW =====
  function renderHome(view) {
    const badgesCount = getUnlockedBadges().size;
    const gamesCount = Object.keys(state.clearedGames).length;

    const ingPct = Math.round((state.exploredIngredients.length / DATA.ingredients.length) * 100);
    const sciPct = Math.round((state.completedScience.length / DATA.scienceTopics.length) * 100);
    const gamePct = Math.round((gamesCount / GAMES.stages.length) * 100);
    const badgePct = Math.round((badgesCount / DATA.badges.length) * 100);

    view.innerHTML = `
      <section class="hero-banner">
        <div>
          <span class="hero-badge">YOUR EXPLORATION SPACE • FROM PEEL TO PURPOSE</span>
          <h1 class="hero-title">Welcome to PEELVERSE!</h1>
          <p class="hero-slogan">Từ vỏ trái cây, tạo nên giá trị mới.</p>
          <p class="hero-desc">
            Điều gì sẽ xảy ra nếu những thứ chúng ta thường bỏ đi lại trở thành khởi đầu cho một khám phá thú vị?
            PEELVERSE đưa bạn đến hành trình khám phá vỏ trái cây dưới góc nhìn khoa học, sáng tạo và phát triển bền vững — nơi những nguyên liệu quen thuộc trở thành nguồn cảm hứng cho những ý tưởng mới.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-nav="about">Khám phá dự án →</button>
            <button class="btn btn-secondary" data-nav="ingredients">Tìm hiểu nguyên liệu</button>
            <button class="btn btn-orange" data-nav="process">Bắt đầu hành trình</button>
          </div>
        </div>
        <div class="hero-visual">
          <img src="assets/images/hero-peel.jpg" alt="Vỏ cam xoắn ốc tượng trưng cho dự án PEELVERSE" />
        </div>
      </section>

      <section class="stats-grid">
        <div class="stat-card" data-nav="ingredients">
          <div class="stat-card-main">
            <div class="stat-icon sage">${PVIcon('citrus', 21)}</div>
            <div>
              <div class="stat-value">${state.exploredIngredients.length}/${DATA.ingredients.length}</div>
              <div class="stat-label">Nguyên liệu đã khám phá</div>
            </div>
          </div>
          <div class="stat-progress-track">
            <div class="stat-progress-fill sage" style="width:${Math.max(ingPct, 6)}%;"></div>
          </div>
          <span class="stat-arrow">↗</span>
        </div>

        <div class="stat-card" data-nav="science">
          <div class="stat-card-main">
            <div class="stat-icon peach">${PVIcon('book-open', 21)}</div>
            <div>
              <div class="stat-value">${state.completedScience.length}/${DATA.scienceTopics.length}</div>
              <div class="stat-label">Bài học đã hoàn thành</div>
            </div>
          </div>
          <div class="stat-progress-track">
            <div class="stat-progress-fill peach" style="width:${Math.max(sciPct, 6)}%;"></div>
          </div>
          <span class="stat-arrow">↗</span>
        </div>

        <div class="stat-card" data-nav="game">
          <div class="stat-card-main">
            <div class="stat-icon apricot">${PVIcon('gamepad', 21)}</div>
            <div>
              <div class="stat-value">${gamesCount}/${GAMES.stages.length}</div>
              <div class="stat-label">Thử thách đã vượt qua</div>
            </div>
          </div>
          <div class="stat-progress-track">
            <div class="stat-progress-fill apricot" style="width:${Math.max(gamePct, 6)}%;"></div>
          </div>
          <span class="stat-arrow">↗</span>
        </div>

        <div class="stat-card" data-nav="progress">
          <div class="stat-card-main">
            <div class="stat-icon olive">${PVIcon('award', 21)}</div>
            <div>
              <div class="stat-value">${badgesCount}/${DATA.badges.length}</div>
              <div class="stat-label">Huy hiệu đã đạt được</div>
            </div>
          </div>
          <div class="stat-progress-track">
            <div class="stat-progress-fill olive" style="width:${Math.max(badgePct, 6)}%;"></div>
          </div>
          <span class="stat-arrow">↗</span>
        </div>
      </section>

      <div class="section-head">
        <h2 class="inline-icon-heading"><span>Khám phá ngay</span> ${PVIcon('sparkles', 20)}</h2>
        <button class="section-pill-link" data-nav="process">Xem quy trình 6 bước →</button>
      </div>

      ${(() => {
        const next = getSmartNextStep();
        return `
        <section class="next-step-card">
          <div class="next-step-left">
            <div class="next-step-badge">${next.emoji}</div>
            <div>
              <div class="next-step-kicker">${next.kicker}</div>
              <div class="next-step-title">${next.title}</div>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="smartNextStepBtn">${next.cta}</button>
        </section>`;
      })()}

      <section class="explore-grid">
        <article class="explore-card" data-nav="ingredients">
          <div class="explore-card-media peach-bg">
            <span class="explore-media-badge">6 nguyên liệu</span>
            <img src="assets/images/ing-citrus.jpg" alt="Khám phá nguyên liệu vỏ cam chanh quýt" />
          </div>
          <div class="explore-card-body">
            <div class="explore-card-top">
              <span class="explore-card-title inline-icon-heading">${PVIcon('citrus', 16)} <span>Nguyên liệu</span></span>
              <span class="circle-arrow">→</span>
            </div>
            <p class="explore-card-desc">Khám phá các loại vỏ trái cây, giấm trắng, nước, quế và tiềm năng của chúng!</p>
          </div>
        </article>

        <article class="explore-card" data-nav="science">
          <div class="explore-card-media sage-bg">
            <span class="explore-media-badge">7 chủ đề & pH</span>
            <img src="assets/images/explore-science.jpg" alt="Chiết xuất tinh dầu limonene và kiến thức khoa học" />
          </div>
          <div class="explore-card-body">
            <div class="explore-card-top">
              <span class="explore-card-title inline-icon-heading">${PVIcon('book-open', 16)} <span>Kiến thức khoa học</span></span>
              <span class="circle-arrow">→</span>
            </div>
            <p class="explore-card-desc">Học hỏi tinh dầu, limonene, độ pH, chiết xuất và kinh tế tuần hoàn!</p>
          </div>
        </article>

        <article class="explore-card" data-nav="game">
          <div class="explore-card-media apricot-bg">
            <span class="explore-media-badge orange">6 màn mô phỏng</span>
            <img src="assets/images/explore-game.jpg" alt="Mini game mô phỏng quy trình tạo sản phẩm PEELVERSE" />
          </div>
          <div class="explore-card-body">
            <div class="explore-card-top">
              <span class="explore-card-title inline-icon-heading">${PVIcon('gamepad', 16)} <span>Mini Game</span></span>
              <span class="circle-arrow">→</span>
            </div>
            <p class="explore-card-desc">Thử thách bản thân với 6 màn mô phỏng tạo dung dịch lau bàn!</p>
          </div>
        </article>

        <article class="explore-card" data-nav="progress">
          <div class="explore-card-media olive-bg">
            <span class="explore-media-badge">8 huy hiệu xanh</span>
            <img src="assets/images/explore-achievements.jpg" alt="Bảng thành tích và huy hiệu xanh PEELVERSE" />
          </div>
          <div class="explore-card-body">
            <div class="explore-card-top">
              <span class="explore-card-title inline-icon-heading">${PVIcon('trophy', 16)} <span>Thành tích</span></span>
              <span class="circle-arrow">→</span>
            </div>
            <p class="explore-card-desc">Thu thập huy hiệu và theo dõi hành trình khám phá xanh của bạn!</p>
          </div>
        </article>
      </section>

      <section class="story-strip">
        <div>
          <span class="hero-badge" style="margin-bottom:8px;">GIỚI THIỆU NGẮN</span>
          <h3>Một thế giới nhỏ từ những điều bị lãng quên</h3>
          <p>
            Mỗi ngày, vỏ trái cây được bỏ đi sau khi sử dụng. Nhưng bên trong những phần tưởng chừng vô giá trị ấy vẫn tồn tại các hợp chất tự nhiên, đặc tính thú vị và tiềm năng để khám phá.
          </p>
          <p style="margin-bottom:14px;">
            Chúng tôi bắt đầu từ mong muốn nhìn nhận rác thải theo một cách khác — không chỉ là thứ cần loại bỏ, mà còn là nguồn nguyên liệu cho nghiên cứu, thử nghiệm và sáng tạo.
          </p>
          <button class="btn btn-secondary btn-sm" data-nav="shop">🪴 Ghé góc Chậu tái sinh xanh →</button>
        </div>
        <div class="story-highlights">
          <div class="story-chip">🍊 <span>Hợp chất tự nhiên & tinh dầu Limonene</span></div>
          <div class="story-chip">🔬 <span>Quy trình 6 bước khoa học, dễ theo dõi</span></div>
          <div class="story-chip">♻️ <span>Tư duy tái sử dụng & chậu cây tái sinh bền vững</span></div>
        </div>
      </section>
    `;

    const smartBtn = view.querySelector('#smartNextStepBtn');
    if (smartBtn) {
      const next = getSmartNextStep();
      smartBtn.addEventListener('click', next.action);
    }

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
          <p class="lead">PEELSERVE bắt đầu từ những điều rất quen thuộc trong cuộc sống nội trú.</p>
          <p>
            Sau mỗi bữa ăn, chúng tôi tự dọn dẹp bàn ăn, và nhận ra rằng những loại rác hữu cơ như vỏ cam, chanh, quýt hay trái cây thường bị bỏ đi khá nhiều. Trong khi đó, bàn ăn sau khi sử dụng lại thường có những vết bẩn nhưng chưa có sẵn dung dịch lau bàn phù hợp để xử lý.
          </p>
          <p class="highlight-quote">
            Từ những điều tưởng chừng nhỏ bé ấy, chúng tôi bắt đầu đặt câu hỏi: Liệu những vỏ trái cây thường bị bỏ đi có thể được tận dụng để tạo ra một dung dịch lau bàn?
          </p>
          <p style="margin-bottom:0;">
            <strong>Đó chính là khởi nguồn của PEELSERVE</strong> — dự án nghiên cứu và thử nghiệm tận dụng vỏ trái cây, kết hợp kiến thức khoa học và tư duy sáng tạo để tạo ra một giải pháp làm sạch từ những nguyên liệu quen thuộc.
          </p>
        </div>
        <div class="about-story-visual">
          <img src="assets/images/about-lab.jpg" alt="Vỏ cam và bình thí nghiệm PEELSERVE" />
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
        <h2>Vấn đề rác thải vỏ trái cây & góc nhìn mới ♻️</h2>
      </div>
      <section class="waste-impact-grid">
        <div class="impact-card">
          <div class="impact-num">20–30%</div>
          <h4 style="margin-bottom:6px;">Trọng lượng bị bỏ đi</h4>
          <p style="font-size:0.86rem;color:var(--text-muted);">Phần lớn vỏ cam, chanh, quýt sau bữa ăn bị vứt chung với rác sinh hoạt hằng ngày.</p>
        </div>
        <div class="impact-card">
          <div class="impact-num">70–95%</div>
          <h4 style="margin-bottom:6px;">Hàm lượng D-Limonene</h4>
          <p style="font-size:0.86rem;color:var(--text-muted);">Tinh dầu tự nhiên trong vỏ họ cam quýt chứa Limonene — hợp chất hỗ trợ làm sạch dầu mỡ nhẹ.</p>
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
      { key: 'Trái cây', icon: '🍊' },
      { key: 'Chất lỏng', icon: '💧' },
      { key: 'Gia vị', icon: '🌿' },
      { key: 'Thực vật', icon: '🌱' }
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
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Khám phá nguyên liệu' }])}
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">${PVIcon('citrus', 26)} <span>Khám phá nguyên liệu</span></h1>
          <p style="color:var(--text-muted);font-size:0.93rem;margin-top:4px;">
            Tìm hiểu từng nguyên liệu, đặc tính khoa học, vai trò trong nghiên cứu PEELSERVE và những điều cần lưu ý.
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
          <option value="core" ${ingredientSort === 'core' ? 'selected' : ''}>Ưu tiên nguyên liệu cốt lõi</option>
          <option value="explored" ${ingredientSort === 'explored' ? 'selected' : ''}>Đã khám phá trước</option>
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
                ${item.isCore ? `<span class="core-badge">Cốt lõi</span>` : ''}
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
      addNotification(`🌿 Bạn vừa khám phá nguyên liệu: ${item.name}!`);
      showToast(`✅ Đã khám phá: ${item.name} (+100%)`);
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
          <h3>🧬 Thành phần chính</h3>
          <ul>${item.composition.map((c) => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-box">
          <h3>🔬 Đặc tính khoa học</h3>
          <ul>${item.properties.map((p) => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="info-box warning-box" style="grid-column: 1 / -1;">
          <h3>⚠️ Lưu ý khi nghiên cứu & sử dụng</h3>
          <ul>${item.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
        </div>
      </section>
    `;

    bindNavTriggers(view);
  }

  // ===== 04. PROCESS VIEW =====
  function renderProcess(view) {
    const doneCount = state.completedSteps.length;
    const pct = Math.round((doneCount / DATA.processSteps.length) * 100);

    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Quy trình thực hiện' }])}
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">${PVIcon('flask', 26)} <span>Quy trình thực hiện</span></h1>
          <p style="color:var(--text-muted);font-size:0.93rem;margin-top:4px;">
            Theo dõi 6 bước nghiên cứu và tạo mẫu thử PEELSERVE từ thu gom nguyên liệu đến đánh giá hoàn thiện.
          </p>
        </div>
        <button class="btn btn-orange" data-nav="game">🎮 Thử thực hành qua Mini Game</button>
      </div>

      <div class="progress-overview" style="padding:18px 24px;margin-bottom:22px;">
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.9rem;">
          <span>Tiến độ theo dõi quy trình</span>
          <span>${doneCount}/${DATA.processSteps.length} bước (${pct}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%;"></div>
        </div>
      </div>

      <section class="process-timeline">
        ${DATA.processSteps
          .map((s) => {
            const checked = state.completedSteps.includes(s.step);
            return `
            <article class="process-card ${checked ? 'completed' : ''}" data-step-card="${s.step}">
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
                  <strong>💡 Mẹo nghiên cứu:</strong> ${s.tip}
                </div>
                <button class="step-check-btn ${checked ? 'checked' : ''}" data-step="${s.step}">
                  ${checked ? '✓ Đã nắm rõ bước này' : '○ Đánh dấu đã tìm hiểu'}
                </button>
              </div>
            </article>
          `;
          })
          .join('')}
      </section>
    `;

    bindNavTriggers(view);

    view.querySelectorAll('.step-check-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.step);
        if (state.completedSteps.includes(step)) {
          state.completedSteps = state.completedSteps.filter((x) => x !== step);
        } else {
          state.completedSteps.push(step);
          showToast(`🔬 Đã hoàn thành Bước ${step}!`);
          if (state.completedSteps.length === DATA.processSteps.length) {
            addNotification('🔬 Bạn đã hoàn thành toàn bộ 6 bước quy trình PEELSERVE!');
          }
        }
        saveState();
        renderProcess(view);
      });
    });
  }

  // ===== 05. SCIENCE KNOWLEDGE VIEW =====
  function renderScience(view) {
    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Kiến thức khoa học' }])}
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">${PVIcon('book-open', 26)} <span>Kiến thức khoa học</span></h1>
          <p style="color:var(--text-muted);font-size:0.93rem;margin-top:4px;">
            Giải thích các hiện tượng hóa học, vật lý và nguyên lý kinh tế tuần hoàn được ứng dụng trong dự án PEELSERVE.
          </p>
        </div>
      </div>

      <section class="science-grid">
        ${DATA.scienceTopics
          .map((topic) => {
            const done = state.completedScience.includes(topic.id);
            return `
            <article class="science-card" data-topic="${topic.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="science-card-icon" style="background:${topic.color};">${topic.emoji}</div>
                <span class="progress-badge ${done ? 'done' : ''}" style="position:static;">
                  ${done ? 'Đã hoàn thành ✓' : 'Chưa học'}
                </span>
              </div>
              <h3>${topic.title}</h3>
              <p style="font-weight:600;color:var(--green-mid);font-size:0.84rem;flex:0;">${topic.subtitle}</p>
              <p>${topic.summary}</p>
              <div class="science-card-foot">
                <span>Khám phá & làm quiz</span>
                <span>→</span>
              </div>
            </article>
          `;
          })
          .join('')}
      </section>
    `;

    view.querySelectorAll('.science-card').forEach((card) => {
      card.addEventListener('click', () => {
        navigate('science-detail', card.dataset.topic);
      });
    });
  }

  function renderScienceDetail(view, id) {
    const topic = DATA.scienceTopics.find((t) => t.id === id);
    if (!topic) return navigate('science');

    const alreadyDone = state.completedScience.includes(topic.id);

    view.innerHTML = `
      ${renderBreadcrumb([
        { label: 'Trang chủ', route: 'home' },
        { label: 'Kiến thức khoa học', route: 'science' },
        { label: topic.title }
      ])}

      <article class="info-box" style="padding:30px;border-radius:var(--radius-lg);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
          <div class="science-card-icon" style="background:${topic.color};width:56px;height:56px;font-size:1.8rem;">${topic.emoji}</div>
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
          <strong>📌 Ghi nhớ cốt lõi:</strong> ${topic.keyTakeaway}
        </div>
      </article>

      <section class="quiz-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <h3>🧠 Kiểm tra nhanh kiến thức</h3>
          ${alreadyDone ? '<span class="detail-tag" style="background:var(--green-dark);color:#FFF;">✓ Đã hoàn thành bài học</span>' : ''}
        </div>
        <p style="margin-top:8px;font-weight:700;color:var(--green-dark);">${topic.quiz.question}</p>
        <div class="quiz-options">
          ${topic.quiz.options
            .map(
              (opt, idx) => `
            <button class="quiz-option" data-idx="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>
          `
            )
            .join('')}
        </div>
        <div id="quizFeedback" style="font-weight:600;font-size:0.92rem;min-height:24px;"></div>
      </section>
    `;

    bindNavTriggers(view);

    if (topic.hasPhWidget) {
      bindPhWidget(view);
    }

    view.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const fb = view.querySelector('#quizFeedback');
        view.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('correct', 'wrong'));

        if (idx === topic.quiz.correctIndex) {
          btn.classList.add('correct');
          fb.style.color = '#1E4D20';
          fb.textContent = `🎉 ${topic.quiz.explanation}`;
          if (!state.completedScience.includes(topic.id)) {
            state.completedScience.push(topic.id);
            addNotification(`📖 Hoàn thành bài học khoa học: ${topic.title}!`);
            showToast(`🎉 Đã hoàn thành bài học: ${topic.title}`);
            triggerEcoConfetti();
            saveState();
          }
        } else {
          btn.classList.add('wrong');
          fb.style.color = '#8E1B18';
          fb.textContent = '❌ Chưa chính xác, bạn hãy thử chọn lại đáp án khác nhé!';
        }
      });
    });
  }

  function renderPhWidgetHtml() {
    return `
      <div class="ph-widget">
        <h4>🧪 Tương tác: Kéo thanh thang đo pH (0 – 14)</h4>
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
      if (val <= 2) return { type: 'Axit mạnh', sample: 'Nước cốt chanh đậm đặc / Axit pin' };
      if (val <= 3.5) return { type: 'Axit nhẹ', sample: 'Giấm trắng (~2.5–3.0) — nguyên liệu PEELSERVE' };
      if (val <= 5.5) return { type: 'Axit dịu nhẹ', sample: 'Dung dịch PEELSERVE sau pha loãng (~3.5–4.5)' };
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

  // ===== 06. GAME HUB & PLAY =====
  function renderGameHub(view) {
    const clearedCount = Object.keys(state.clearedGames).length;
    const totalScore = Object.values(state.clearedGames).reduce((a, b) => a + b, 0);

    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Trò chơi' }])}
      <section class="game-hub-banner">
        <div>
          <span class="hero-badge" style="background:rgba(242,140,40,0.16);color:var(--orange-deep);">KHU VỰC MINI GAME TƯƠNG TÁC</span>
          <h1 class="inline-icon-heading" style="font-size:2rem;margin-bottom:6px;">${PVIcon('gamepad', 28)} <span>Trò chơi mô phỏng PEELVERSE</span></h1>
          <p style="color:var(--text-muted);max-width:600px;font-size:0.94rem;">
            Trải nghiệm trực tiếp 6 công đoạn biến vỏ trái cây thành dung dịch lau bàn sạch bóng. Chọn bất kỳ màn nào bên dưới hoặc bắt đầu từ Màn 1 để chinh phục trọn bộ!
          </p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div class="hud-pill">🏆 Đã vượt qua: ${clearedCount}/6 màn • ⭐ ${totalScore} điểm</div>
          <button class="btn btn-primary" id="startFirstStageBtn">Bắt đầu chơi ngay →</button>
        </div>
      </section>

      <section class="game-stages-grid">
        ${GAMES.stages
          .map((st) => {
            const best = state.clearedGames[st.id];
            return `
            <article class="stage-card ${best ? 'cleared' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="stage-num">Màn ${st.id}</span>
                ${best ? `<span style="font-size:0.8rem;font-weight:700;color:var(--green-mid);">✓ ${best} điểm</span>` : ''}
              </div>
              <div style="font-size:2.4rem;">${st.emoji}</div>
              <h3>${st.title}</h3>
              <p style="font-size:0.86rem;color:var(--text-muted);flex:1;">${st.desc}</p>
              <button class="btn ${best ? 'btn-secondary' : 'btn-orange'}" data-stage="${st.id}" style="margin-top:8px;width:100%;">
                ${best ? 'Chơi lại' : 'Mở màn chơi →'}
              </button>
            </article>
          `;
          })
          .join('')}
      </section>
    `;

    view.querySelector('#startFirstStageBtn').addEventListener('click', () => {
      const nextStage = GAMES.stages.find((s) => !state.clearedGames[s.id])?.id || 1;
      navigate('game-play', nextStage);
    });

    view.querySelectorAll('[data-stage]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate('game-play', Number(btn.dataset.stage));
      });
    });
  }

  function renderGamePlay(view, stageId) {
    GAMES.mountStage(
      stageId,
      view,
      (completedId, score) => {
        const prev = state.clearedGames[completedId] || 0;
        if (score > prev) {
          state.clearedGames[completedId] = score;
        }
        addNotification(`🎮 Hoàn thành Màn ${completedId} với ${score} điểm!`);
        showToast(`🏆 Màn ${completedId} hoàn tất (+${score} điểm)`);
        triggerEcoConfetti();
        saveState();
      },
      () => navigate('game')
    );
  }

  // ===== 07. ECO PLANTER SHOP VIEW =====
  function renderShop(view) {
    const categories = [
      { key: 'Tất cả', icon: '⊞' },
      { key: 'Chậu vỏ quả', icon: '🍊' },
      { key: 'Chậu tái chế', icon: '♻️' },
      { key: 'Combo xanh', icon: '🎁' }
    ];

    let list = SHOP_PRODUCTS.filter((p) => {
      const matchCat = shopCategory === 'Tất cả' ? true : p.category === shopCategory;
      let matchPrice = true;
      if (shopPriceRange === 'under90') matchPrice = p.price < 90000;
      else if (shopPriceRange === '90to150') matchPrice = p.price >= 90000 && p.price <= 150000;
      else if (shopPriceRange === 'over150') matchPrice = p.price > 150000;
      return matchCat && matchPrice;
    });

    if (shopSort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (shopSort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    const totalQty = getCartTotalQty();
    const totalAmount = getCartTotalAmount();

    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Giỏ hàng' }])}
      <section class="shop-hero">
        <div>
          <span class="hero-badge">CHẬU CÂY TÁI SINH XANH LÀM SẴN</span>
          <h1 class="inline-icon-heading" style="font-size:2rem;margin-bottom:6px;">${PVIcon('shopping-cart', 28)} <span>Giỏ hàng PEELVERSE</span></h1>
          <p style="color:var(--text-muted);max-width:600px;font-size:0.94rem;">
            Những chậu cây nhỏ xinh được chế tác thủ công từ vỏ cam bưởi sấy, bã cà phê, xơ dừa và vật liệu tái chế — mang mảng xanh tuần hoàn đến bàn học của bạn.
          </p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div class="hud-pill">🛒 Giỏ hiện tại: ${totalQty} món • ${formatVND(totalAmount)}</div>
          <button class="btn btn-primary" id="openCartFromShop">Mở giỏ hàng & đặt mua →</button>
        </div>
      </section>

      <div class="filter-bar">
        <div class="filter-pills">
          ${categories
            .map(
              (cat) => `
            <button class="filter-pill ${shopCategory === cat.key ? 'active' : ''}" data-shop-cat="${cat.key}">
              <span>${cat.icon}</span> ${cat.key}
            </button>
          `
            )
            .join('')}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="shopPriceFilter" class="sort-select" aria-label="Lọc theo mức giá">
            <option value="all" ${shopPriceRange === 'all' ? 'selected' : ''}>Giá: Tất cả</option>
            <option value="under90" ${shopPriceRange === 'under90' ? 'selected' : ''}>Dưới 90.000đ</option>
            <option value="90to150" ${shopPriceRange === '90to150' ? 'selected' : ''}>90.000đ – 150.000đ</option>
            <option value="over150" ${shopPriceRange === 'over150' ? 'selected' : ''}>Trên 150.000đ</option>
          </select>

          <select id="shopSortSelect" class="sort-select" aria-label="Sắp xếp sản phẩm">
            <option value="default" ${shopSort === 'default' ? 'selected' : ''}>Sắp xếp: Gợi ý</option>
            <option value="price-asc" ${shopSort === 'price-asc' ? 'selected' : ''}>Giá thấp → cao</option>
            <option value="price-desc" ${shopSort === 'price-desc' ? 'selected' : ''}>Giá cao → thấp</option>
          </select>
        </div>
      </div>

      ${
        list.length === 0
          ? `<div class="info-box" style="text-align:center;padding:36px;">Không có chậu cây nào khớp bộ lọc hiện tại. Hãy thử chọn mức giá hoặc danh mục khác nhé!</div>`
          : `
      <section class="shop-grid">
        ${list
          .map((p) => {
            const inCart = cart.find((c) => c.id === p.id);
            return `
            <article class="product-card" data-product-id="${p.id}">
              <div class="product-media">
                <img src="${p.image}" alt="${p.name}" />
                <span class="core-badge">${p.badge}</span>
                <span class="progress-badge">${p.category}</span>
              </div>
              <div class="product-body">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="care-pills">
                  <span class="care-pill">${p.care.light}</span>
                  <span class="care-pill">${p.care.water}</span>
                  <span class="care-pill">${p.care.drainage}</span>
                </div>
                <div class="product-foot">
                  <span class="product-price">${formatVND(p.price)}</span>
                  <button class="btn ${inCart ? 'btn-primary' : 'btn-orange'} btn-sm" data-add-cart="${p.id}">
                    ${inCart ? `+ Thêm (${inCart.qty})` : '+ Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            </article>
          `;
          })
          .join('')}
      </section>`
      }

      <div style="margin-top:24px;">
        ${renderCartSupportBoxHtml()}
      </div>
    `;

    view.querySelector('#openCartFromShop').addEventListener('click', openCartDrawer);

    view.querySelectorAll('[data-shop-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shopCategory = btn.dataset.shopCat;
        renderShop(view);
      });
    });

    view.querySelector('#shopPriceFilter').addEventListener('change', (e) => {
      shopPriceRange = e.target.value;
      renderShop(view);
    });

    view.querySelector('#shopSortSelect').addEventListener('change', (e) => {
      shopSort = e.target.value;
      renderShop(view);
    });

    view.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        addToCart(btn.dataset.addCart);
        renderShop(view);
      });
    });
  }

  // ===== 08. PROGRESS & ACHIEVEMENTS VIEW =====
  function renderProgress(view) {
    const pct = getOverallProgress();
    const unlocked = getUnlockedBadges();

    view.innerHTML = `
      ${renderBreadcrumb([{ label: 'Trang chủ', route: 'home' }, { label: 'Tiến trình khám phá' }])}
      <div class="page-hero-header">
        <h1 class="page-title">${PVIcon('trending-up', 26)} <span>Tiến trình khám phá & Huy hiệu</span></h1>
      </div>

      <section class="progress-overview">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2>Hành trình PEELVERSE của bạn</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Hoàn thành khám phá nguyên liệu, quy trình, bài học khoa học và 6 màn chơi để đạt 100%!</p>
          </div>
          <div data-countup="true" style="font-size:2rem;font-weight:800;color:var(--green-dark);">${pct}%</div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%;"></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;font-size:0.86rem;color:var(--text-muted);">
          <span class="inline-icon-heading">${PVIcon('citrus', 15)} Nguyên liệu: <strong>${state.exploredIngredients.length}/${DATA.ingredients.length}</strong></span>
          <span class="inline-icon-heading">${PVIcon('flask', 15)} Quy trình: <strong>${state.completedSteps.length}/${DATA.processSteps.length}</strong></span>
          <span class="inline-icon-heading">${PVIcon('book-open', 15)} Khoa học: <strong>${state.completedScience.length}/${DATA.scienceTopics.length}</strong></span>
          <span class="inline-icon-heading">${PVIcon('gamepad', 15)} Mini Game: <strong>${Object.keys(state.clearedGames).length}/${GAMES.stages.length}</strong></span>
        </div>
      </section>

      <div class="section-head">
        <h2 class="inline-icon-heading">${PVIcon('trophy', 22)} <span>Bộ sưu tập Huy hiệu (${unlocked.size}/${DATA.badges.length})</span></h2>
      </div>

      <section class="badges-grid">
        ${DATA.badges
          .map((b) => {
            const isUnlocked = unlocked.has(b.id);
            const themeClass = b.theme === 'amber' ? 'theme-amber' : 'theme-emerald';
            return `
            <article class="badge-card ${isUnlocked ? 'unlocked' : ''}">
              <div class="badge-emblem ${themeClass}">
                ${PVIcon(b.icon || 'award', 30)}
                ${isUnlocked ? '' : `<span class="badge-lock-pin" aria-hidden="true">${PVIcon('lock', 12)}</span>`}
              </div>
              <h4 style="margin-bottom:6px;">${b.title}</h4>
              <p style="font-size:0.82rem;color:var(--text-muted);">${b.desc}</p>
              <div class="badge-status-pill ${isUnlocked ? 'unlocked' : 'locked'}">
                ${isUnlocked ? `${PVIcon('check-circle', 15)} <span>Đã mở khóa</span>` : `${PVIcon('lock', 14)} <span>Chưa mở khóa</span>`}
              </div>
            </article>
          `;
          })
          .join('')}
      </section>
    `;
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
      { title: '🏠 Trang chủ', desc: 'Tổng quan dự án PEELVERSE, tiến độ và lối tắt nhanh', group: 'Điều hướng', action: () => navigate('home') },
      { title: '🌱 Về dự án', desc: 'Câu chuyện PEELSERVE từ cuộc sống nội trú, Sứ mệnh & Tầm nhìn', group: 'Điều hướng', action: () => navigate('about') },
      { title: '🍊 Khám phá nguyên liệu', desc: 'Danh sách 6 nguyên liệu nghiên cứu và đặc tính', group: 'Điều hướng', action: () => navigate('ingredients') },
      { title: '🔬 Quy trình thực hiện', desc: '6 bước thu gom, làm sạch, sơ chế, chiết xuất, lọc & đánh giá', group: 'Điều hướng', action: () => navigate('process') },
      { title: '📖 Kiến thức khoa học', desc: '7 bài học về tinh dầu, limonene, độ pH, chiết xuất, kinh tế tuần hoàn', group: 'Điều hướng', action: () => navigate('science') },
      { title: '🎮 Trò chơi (Mini Game)', desc: '6 màn chơi mô phỏng tạo dung dịch lau bàn', group: 'Điều hướng', action: () => navigate('game') },
      { title: '🛒 Giỏ hàng & Chậu tái sinh', desc: 'Chậu cây tái sinh xanh làm sẵn từ vỏ cam, xơ dừa, bã cà phê', group: 'Điều hướng', action: () => navigate('shop') },
      { title: '📊 Tiến trình khám phá', desc: 'Xem phần trăm hoàn thành và 8 huy hiệu xanh', group: 'Điều hướng', action: () => navigate('progress') }
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
        title: `${g.emoji} Màn ${g.id}: ${g.title}`,
        desc: g.desc,
        group: 'Mini Game',
        searchBlob: normalizeVi(`man ${g.id} mini game tro choi ${g.title} ${g.desc}`),
        action: () => navigate('game-play', g.id)
      })),
      ...SHOP_PRODUCTS.map((sp) => ({
        title: `🪴 ${sp.name}`,
        desc: `${formatVND(sp.price)} • ${sp.category}`,
        group: 'Chậu tái sinh',
        searchBlob: normalizeVi(`chau cay chau tai sinh gio hang ${sp.name} ${sp.category} ${sp.desc}`),
        action: () => {
          shopCategory = 'Tất cả';
          shopPriceRange = 'all';
          navigate('shop');
          focusElementWithPulse(`[data-product-id="${sp.id}"]`);
        }
      })),
      {
        title: '💬 Liên hệ Zalo: 0355415501',
        desc: 'Mở hộp thoại liên hệ nhanh hoặc nhắn Zalo hỗ trợ PEELVERSE',
        group: 'Liên hệ',
        searchBlob: normalizeVi('lien he contact zalo 0355415501 ho tro tu van'),
        action: () => openContactModal()
      },
      {
        title: '✉️ Email: anhfsd01109@fpt.edu.vn',
        desc: 'Gửi email hoặc sao chép địa chỉ liên hệ dự án PEELVERSE',
        group: 'Liên hệ',
        searchBlob: normalizeVi('lien he contact email anhfsd01109@fpt.edu.vn fpt'),
        action: () => openContactModal()
      }
    ];

    const quickChips = ['Vỏ cam', 'Limonene', 'Độ pH', 'Mini Game', 'Chậu tái sinh', 'Liên hệ'];
    let flatMatches = [];
    let activeIdx = -1;

    function openItem(item, queryUsed) {
      if (queryUsed) saveRecentSearch(queryUsed);
      item.action();
      input.value = '';
      dropdown.classList.add('hidden');
      input.blur();
    }

    function updateActiveHighlight() {
      const buttons = dropdown.querySelectorAll('.search-item');
      buttons.forEach((b, i) => {
        b.classList.toggle('active-result', i === activeIdx);
        if (i === activeIdx) b.scrollIntoView({ block: 'nearest' });
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
          <div class="search-section-label"><span>Truy cập nhanh</span></div>
          <div class="search-chips-wrap">
            ${quickChips.map((c) => `<button type="button" class="search-quick-chip" data-chip="${c}">${c}</button>`).join('')}
          </div>
          ${
            recents.length > 0
              ? `
            <div class="search-section-label">
              <span>Tìm kiếm gần đây</span>
              <button type="button" class="text-btn" id="clearRecentSearchBtn">Xóa</button>
            </div>
            <div class="search-chips-wrap">
              ${recents.map((r) => `<button type="button" class="search-quick-chip" data-chip="${r}">🕘 ${r}</button>`).join('')}
            </div>`
              : ''
          }
          <div class="search-kbd-hint">
            <span>Gõ có dấu hoặc không dấu (VD: "vo cam", "chau cay")</span>
            <span>Esc để đóng</span>
          </div>
        `;

        dropdown.querySelectorAll('[data-chip]').forEach((chip) => {
          chip.addEventListener('click', () => {
            input.value = chip.dataset.chip;
            renderDropdown();
            input.focus();
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

      flatMatches = index.filter((item) => item.searchBlob.includes(normQ)).slice(0, 12);

      if (flatMatches.length === 0) {
        dropdown.innerHTML = `
          <div style="padding:14px 12px;font-size:0.86rem;color:var(--text-muted);text-align:center;">
            Không tìm thấy kết quả cho "<strong>${rawQ}</strong>". Hãy thử từ khóa khác như <em>vỏ cam, limonene, độ pH, chậu cây</em>.
          </div>
        `;
      } else {
        // Group matches by category
        const grouped = new Map();
        flatMatches.forEach((m, idx) => {
          if (!grouped.has(m.group)) grouped.set(m.group, []);
          grouped.get(m.group).push({ item: m, flatIdx: idx });
        });

        let html = '';
        grouped.forEach((entries, groupName) => {
          html += `<div class="search-section-label"><span>${groupName}</span><span>${entries.length}</span></div>`;
          entries.forEach(({ item, flatIdx }) => {
            html += `
              <button type="button" class="search-item" role="option" data-midx="${flatIdx}">
                <div class="search-item-row">
                  <span style="font-weight:700;font-size:0.88rem;color:var(--green-dark);">${highlightMatch(item.title, rawQ)}</span>
                </div>
                <div class="search-item-desc">${highlightMatch(item.desc, rawQ)}</div>
              </button>
            `;
          });
        });
        html += `
          <div class="search-kbd-hint">
            <span>↑↓ Di chuyển • Enter để mở</span>
            <span>Esc để đóng</span>
          </div>
        `;
        dropdown.innerHTML = html;

        dropdown.querySelectorAll('.search-item').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.midx);
            openItem(flatMatches[idx], rawQ);
          });
        });
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

    // Global shortcut: Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const topbarEl = document.getElementById('topbar');
        if (topbarEl && window.innerWidth <= 767) {
          topbarEl.classList.add('mobile-search-open');
        }
        input.focus();
        renderDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box') && !e.target.closest('#mobileSearchToggle')) {
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
        showToast('↔️ Đã đặt lại độ rộng thanh điều hướng mặc định (260px)');
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
      btn.innerHTML = isTextMode ? `${PVIcon('check', 15)} <span>Đã sao chép!</span>` : PVIcon('check', 15);
      showToast(`✅ Đã sao chép ${label}: ${text}`);
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
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    hideSidebarTooltip();
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
    const sidebarContactBtn = document.getElementById('sidebarContactBtn');
    const closeContactBtn = document.getElementById('closeContactBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    if (sidebarContactBtn) {
      sidebarContactBtn.addEventListener('click', (e) => {
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeContactModal();
        closeCartDrawer();
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

    // Mobile drawer & Bottom Nav menu button
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleMobileMenu = () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    };
    document.getElementById('menuToggleBtn').addEventListener('click', toggleMobileMenu);
    const bottomMenuBtn = document.getElementById('bottomMenuBtn');
    if (bottomMenuBtn) {
      bottomMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });

    // Mobile expandable search bar
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const topbarEl = document.getElementById('topbar');
    if (mobileSearchToggle && topbarEl) {
      mobileSearchToggle.addEventListener('click', () => {
        const opened = topbarEl.classList.toggle('mobile-search-open');
        if (opened) {
          const searchInput = document.getElementById('globalSearch');
          if (searchInput) setTimeout(() => searchInput.focus(), 60);
        }
      });
    }

    // Cart Drawer
    document.getElementById('cartToggleBtn').addEventListener('click', openCartDrawer);
    document.getElementById('closeCartBtn').addEventListener('click', closeCartDrawer);
    document.getElementById('cartOverlay').addEventListener('click', closeCartDrawer);

    // Notification popover
    const notifBtn = document.getElementById('notifBtn');
    const notifPopover = document.getElementById('notifPopover');
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPopover.classList.toggle('hidden');
      document.getElementById('notifDot').style.display = 'none';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notifPopover') && !e.target.closest('#notifBtn')) {
        notifPopover.classList.add('hidden');
      }
    });

    // Reset progress
    document.getElementById('resetProgressBtn').addEventListener('click', () => {
      state = cloneObj(defaultState);
      saveState();
      render();
      showToast('🔄 Đã đặt lại toàn bộ tiến trình khám phá!');
    });

    setupSearch();
    updateHeaderStats();
    updateCartBadges();
    render();
  });
})();
