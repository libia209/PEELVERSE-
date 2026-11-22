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
    [sideBadge, headBadge].forEach((el) => {
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

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = '0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3000);
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
    const xpEl = document.getElementById('headerXp');
    if (xpEl) xpEl.textContent = `${getOverallProgress()}%`;
    const notifList = document.getElementById('notifList');
    if (notifList) {
      notifList.innerHTML = state.notifications
        .map((n) => `<div class="notif-entry">${n}</div>`)
        .join('');
    }
  }

  function navigate(route, param = null) {
    GAMES.cleanup();
    currentRoute = route;
    activeIngredientId = route === 'ingredient-detail' ? param : null;
    activeScienceId = route === 'science-detail' ? param : null;
    activeGameStageId = route === 'game-play' ? param : null;

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

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');

    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function triggerViewTransition(view) {
    view.classList.remove('view-enter');
    void view.offsetWidth; // restart CSS keyframe smoothly
    view.classList.add('view-enter');
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
            <div class="stat-icon sage">🌿</div>
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
            <div class="stat-icon peach">📖</div>
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
            <div class="stat-icon apricot">🎮</div>
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
            <div class="stat-icon olive">⭐</div>
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
        <h2>Khám phá ngay ✨</h2>
        <button class="section-pill-link" data-nav="process">Xem quy trình 6 bước →</button>
      </div>

      <section class="explore-grid">
        <article class="explore-card" data-nav="ingredients">
          <div class="explore-card-media peach-bg">
            <span class="explore-media-badge">6 nguyên liệu</span>
            <img src="assets/images/ing-citrus.jpg" alt="Khám phá nguyên liệu vỏ cam chanh quýt" />
          </div>
          <div class="explore-card-body">
            <div class="explore-card-top">
              <span class="explore-card-title">🌿 Nguyên liệu</span>
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
              <span class="explore-card-title">📖 Kiến thức khoa học</span>
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
              <span class="explore-card-title">🎯 Mini Game</span>
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
              <span class="explore-card-title">✨ Thành tích</span>
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

    bindNavTriggers(view);
  }

  // ===== 02. ABOUT PROJECT VIEW =====
  function renderAbout(view) {
    view.innerHTML = `
      <button class="btn-back" data-nav="home">← Quay lại Trang chủ</button>
      <div class="page-hero-header">
        <h1 class="page-title">🌿 About Project <span style="font-size:0.95rem;font-weight:600;color:var(--text-muted);">• Ý tưởng • Sứ mệnh • Tầm nhìn</span></h1>
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
          <div class="mv-icon">🎯</div>
          <div>
            <h3>Sứ mệnh</h3>
            <p>
              Tận dụng nguồn rác hữu cơ sẵn có, ứng dụng kiến thức khoa học vào đời sống và khuyến khích tư duy sáng tạo từ những vấn đề thực tế.
            </p>
          </div>
        </article>
        <article class="mv-card">
          <div class="mv-icon">🔭</div>
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
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">🍊 Khám phá nguyên liệu</h1>
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
      <button class="btn-back" data-nav="ingredients">← Quay lại danh sách nguyên liệu</button>

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
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">🔬 Quy trình thực hiện</h1>
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
            <article class="process-card ${checked ? 'completed' : ''}">
              <div class="process-card-top">
                <span class="step-badge">Bước ${s.step}</span>
                <span class="step-emoji">${s.emoji}</span>
              </div>
              <h3>${s.title}</h3>
              <p><strong>${s.summary}</strong></p>
              <p>${s.details}</p>
              <div class="process-detail-list">
                <strong>💡 Mẹo nghiên cứu:</strong> ${s.tip}
              </div>
              <button class="step-check-btn ${checked ? 'checked' : ''}" data-step="${s.step}">
                ${checked ? '✓ Đã nắm rõ bước này' : '○ Đánh dấu đã tìm hiểu'}
              </button>
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
      <div class="page-hero-header">
        <div>
          <h1 class="page-title">📖 Kiến thức khoa học</h1>
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
      <button class="btn-back" data-nav="science">← Quay lại Thư viện kiến thức</button>

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
      <section class="game-hub-banner">
        <div>
          <span class="hero-badge" style="background:rgba(242,140,40,0.16);color:var(--orange-deep);">KHU VỰC MINI GAME TƯƠNG TÁC</span>
          <h1 style="font-size:2rem;margin-bottom:6px;">🎮 Trò chơi mô phỏng PEELSERVE</h1>
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
      <section class="shop-hero">
        <div>
          <span class="hero-badge">CHẬU CÂY TÁI SINH XANH LÀM SẴN</span>
          <h1 style="font-size:2rem;margin-bottom:6px;">🛒 Giỏ hàng PEELVERSE</h1>
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
            <article class="product-card">
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
      <div class="page-hero-header">
        <h1 class="page-title">📊 Tiến trình khám phá & Huy hiệu</h1>
      </div>

      <section class="progress-overview">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2>Hành trình PEELVERSE của bạn</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Hoàn thành khám phá nguyên liệu, quy trình, bài học khoa học và 6 màn chơi để đạt 100%!</p>
          </div>
          <div style="font-size:2rem;font-weight:800;color:var(--green-dark);">${pct}%</div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%;"></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;font-size:0.86rem;color:var(--text-muted);">
          <span>🍊 Nguyên liệu: <strong>${state.exploredIngredients.length}/${DATA.ingredients.length}</strong></span>
          <span>🔬 Quy trình: <strong>${state.completedSteps.length}/${DATA.processSteps.length}</strong></span>
          <span>📖 Khoa học: <strong>${state.completedScience.length}/${DATA.scienceTopics.length}</strong></span>
          <span>🎮 Mini Game: <strong>${Object.keys(state.clearedGames).length}/${GAMES.stages.length}</strong></span>
        </div>
      </section>

      <div class="section-head">
        <h2>Bộ sưu tập Huy hiệu (${unlocked.size}/${DATA.badges.length}) 🏆</h2>
      </div>

      <section class="badges-grid">
        ${DATA.badges
          .map((b) => {
            const isUnlocked = unlocked.has(b.id);
            return `
            <article class="badge-card ${isUnlocked ? 'unlocked' : ''}">
              <div class="badge-emoji">${b.emoji}</div>
              <h4 style="margin-bottom:6px;">${b.title}</h4>
              <p style="font-size:0.82rem;color:var(--text-muted);">${b.desc}</p>
              <div style="margin-top:10px;font-size:0.75rem;font-weight:700;color:${isUnlocked ? 'var(--green-mid)' : 'var(--text-light)'};">
                ${isUnlocked ? '✓ Đã mở khóa' : '🔒 Chưa mở khóa'}
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

  // ===== GLOBAL SEARCH =====
  function setupSearch() {
    const input = document.getElementById('globalSearch');
    const dropdown = document.getElementById('searchDropdown');

    const index = [
      ...DATA.ingredients.map((i) => ({
        title: `${i.emoji} ${i.name}`,
        text: `${i.name} ${i.shortRole} ${i.description}`.toLowerCase(),
        type: 'Nguyên liệu',
        action: () => navigate('ingredient-detail', i.id)
      })),
      ...DATA.scienceTopics.map((s) => ({
        title: `${s.emoji} ${s.title}`,
        text: `${s.title} ${s.subtitle} ${s.summary}`.toLowerCase(),
        type: 'Khoa học',
        action: () => navigate('science-detail', s.id)
      })),
      ...DATA.processSteps.map((p) => ({
        title: `${p.emoji} Bước ${p.step}: ${p.title}`,
        text: `${p.title} ${p.summary}`.toLowerCase(),
        type: 'Quy trình',
        action: () => navigate('process')
      })),
      ...GAMES.stages.map((g) => ({
        title: `${g.emoji} Màn ${g.id}: ${g.title}`,
        text: `${g.title} ${g.desc}`.toLowerCase(),
        type: 'Mini Game',
        action: () => navigate('game-play', g.id)
      })),
      ...SHOP_PRODUCTS.map((sp) => ({
        title: `🪴 ${sp.name}`,
        text: `${sp.name} ${sp.category} ${sp.desc}`.toLowerCase(),
        type: 'Giỏ hàng',
        action: () => navigate('shop')
      }))
    ];

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.add('hidden');
        return;
      }
      const matches = index.filter((item) => item.text.includes(q)).slice(0, 7);
      if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding:12px;font-size:0.86rem;color:var(--text-muted);">Không tìm thấy kết quả cho "${input.value}"</div>`;
      } else {
        dropdown.innerHTML = matches
          .map(
            (m, idx) => `
          <button class="search-item" data-midx="${idx}">
            <span style="font-weight:600;font-size:0.88rem;">${m.title}</span>
            <span class="search-item-type">${m.type}</span>
          </button>
        `
          )
          .join('');
        dropdown.querySelectorAll('.search-item').forEach((btn) => {
          btn.addEventListener('click', () => {
            matches[Number(btn.dataset.midx)].action();
            input.value = '';
            dropdown.classList.add('hidden');
          });
        });
      }
      dropdown.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
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

  function applySidebarLayout() {
    const isMobile = window.innerWidth <= 768;
    const btn = document.getElementById('sidebarCollapseBtn');
    if (isMobile) {
      document.body.classList.remove('sidebar-collapsed');
      document.documentElement.style.setProperty('--current-sidebar-width', `${SIDEBAR_DEFAULT_WIDTH}px`);
      return;
    }

    if (sidebarPrefs.collapsed) {
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
    if (window.innerWidth <= 768) return;
    sidebarPrefs.collapsed = !sidebarPrefs.collapsed;
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

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    setupSidebarEnhancements();

    document.addEventListener('click', (e) => {
      const routeEl = e.target.closest('[data-route]');
      if (routeEl) {
        e.preventDefault();
        navigate(routeEl.dataset.route);
      }
    });

    // Mobile drawer
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('menuToggleBtn').addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });

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
