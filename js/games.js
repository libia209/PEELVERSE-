window.PEELVERSE_GAMES = {
  stages: [
    {
      id: 1,
      title: 'Thu thập nguyên liệu',
      emoji: '🧺',
      desc: 'Chọn và thu thập các loại vỏ trái cây phù hợp vào giỏ, phân biệt nguyên liệu nên sử dụng và không nên sử dụng.'
    },
    {
      id: 2,
      title: 'Làm sạch nguyên liệu',
      emoji: '🫧',
      desc: 'Thao tác rửa vỏ trái cây, loại bỏ bụi bẩn bằng cách tương tác trực tiếp trên màn hình.'
    },
    {
      id: 3,
      title: 'Sơ chế',
      emoji: '✂️',
      desc: 'Hoàn thành thử thách sơ chế thông qua các thao tác chạm cắt vỏ thành kích thước đồng đều.'
    },
    {
      id: 4,
      title: 'Ghép nguyên liệu',
      emoji: '🧪',
      desc: 'Ghép các nguyên liệu vào đúng vị trí vai trò khoa học để tạo hỗn hợp chiết xuất chuẩn.'
    },
    {
      id: 5,
      title: 'Lọc dung dịch',
      emoji: '🫖',
      desc: 'Thực hiện minigame lọc, tách phần bã nguyên liệu rắn để thu lấy dung dịch trong.'
    },
    {
      id: 6,
      title: 'Thử thách lau bàn',
      emoji: '✨',
      desc: 'Thử thách tương tác mô phỏng việc làm sạch bàn ăn: xịt dung dịch PEELVERSE và lau sạch vết bẩn tính điểm!'
    }
  ],

  activeTimer: null,

  cleanup() {
    if (this.activeTimer) {
      clearInterval(this.activeTimer);
      this.activeTimer = null;
    }
  },

  mountStage(stageId, container, onComplete, onBack) {
    this.cleanup();
    const stage = this.stages.find((s) => s.id === stageId);
    if (!stage) return;

    container.innerHTML = `
      <button class="btn-back" id="gameBackBtn">← Quay lại danh sách màn chơi</button>
      <div class="game-arena">
        <div class="game-hud">
          <div>
            <span class="stage-num">Màn ${stage.id} / 6</span>
            <h2 style="margin-top:6px;">${stage.emoji} ${stage.title}</h2>
          </div>
          <div class="hud-pills" id="gameHudPills"></div>
        </div>
        <div id="gameBoard" class="game-board"></div>
        <div id="gameFeedback" style="margin-top:14px;font-weight:600;color:var(--green-dark);min-height:24px;"></div>
      </div>
    `;

    container.querySelector('#gameBackBtn').addEventListener('click', () => {
      this.cleanup();
      onBack();
    });

    const board = container.querySelector('#gameBoard');
    const hud = container.querySelector('#gameHudPills');
    const feedback = container.querySelector('#gameFeedback');

    const finishStage = (score, message) => {
      this.cleanup();
      onComplete(stageId, score);
      board.innerHTML = `
        <div style="text-align:center;padding:36px 16px;">
          <div style="font-size:4rem;margin-bottom:10px;">🎉</div>
          <h2 style="margin-bottom:8px;">Hoàn thành Màn ${stageId}: ${stage.title}!</h2>
          <p style="color:var(--text-muted);max-width:460px;margin:0 auto 18px;">${message}</p>
          <div style="display:inline-block;background:var(--bg-sage);color:var(--green-dark);font-weight:800;padding:8px 20px;border-radius:999px;margin-bottom:22px;">
            ⭐ Điểm số: ${score} điểm
          </div>
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-secondary" id="replayStageBtn">Chơi lại màn này</button>
            ${stageId < 6
              ? `<button class="btn btn-primary" id="nextStageBtn">Tiếp tục Màn ${stageId + 1} →</button>`
              : `<button class="btn btn-orange" id="allDoneBtn">Xem bảng thành tích 🏆</button>`}
          </div>
        </div>
      `;
      board.querySelector('#replayStageBtn').addEventListener('click', () => {
        this.mountStage(stageId, container, onComplete, onBack);
      });
      const nextBtn = board.querySelector('#nextStageBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.mountStage(stageId + 1, container, onComplete, onBack);
        });
      }
      const allDoneBtn = board.querySelector('#allDoneBtn');
      if (allDoneBtn) {
        allDoneBtn.addEventListener('click', onBack);
      }
    };

    if (stageId === 1) this.runStage1(board, hud, feedback, finishStage);
    if (stageId === 2) this.runStage2(board, hud, feedback, finishStage);
    if (stageId === 3) this.runStage3(board, hud, feedback, finishStage);
    if (stageId === 4) this.runStage4(board, hud, feedback, finishStage);
    if (stageId === 5) this.runStage5(board, hud, feedback, finishStage);
    if (stageId === 6) this.runStage6(board, hud, feedback, finishStage);
  },

  // STAGE 1: Collect good fruit peels, avoid bad/unsuitable items
  runStage1(board, hud, feedback, finishStage) {
    const items = [
      { id: 1, emoji: '🍊', name: 'Vỏ cam tươi', good: true, note: 'Giàu tinh dầu D-Limonene!' },
      { id: 2, emoji: '🍋', name: 'Vỏ chanh vàng', good: true, note: 'Hương thơm tươi mát, sạch dầu mỡ!' },
      { id: 3, emoji: '🧫', name: 'Vỏ cam bị mốc', good: false, note: 'Không dùng vỏ bị nấm mốc vì làm hỏng mẫu thử.' },
      { id: 4, emoji: '🍊', name: 'Vỏ quýt tươi', good: true, note: 'Rất giàu tinh dầu họ cam quýt!' },
      { id: 5, emoji: '🥤', name: 'Ống hút nhựa', good: false, note: 'Rác thải nhựa không thể dùng để chiết xuất!' },
      { id: 6, emoji: '🌿', name: 'Thanh quế khô', good: true, note: 'Tạo hương thơm ấm áp tự nhiên.' },
      { id: 7, emoji: '🍋', name: 'Vỏ chanh xanh', good: true, note: 'Nguyên liệu tuyệt vời cho PEELVERSE!' },
      { id: 8, emoji: '🗑️', name: 'Giấy ăn bẩn', good: false, note: 'Tạp chất không phù hợp với quy trình nghiên cứu.' }
    ].sort(() => Math.random() - 0.5);

    let collected = 0;
    const totalGood = items.filter((i) => i.good).length;
    let score = 100;

    const updateHud = () => {
      hud.innerHTML = `
        <span class="hud-pill">🧺 Đã thu thập: ${collected}/${totalGood}</span>
        <span class="hud-pill">⭐ Điểm: ${score}</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <p style="font-weight:700;color:var(--green-dark);margin-bottom:6px;">
        Nhiệm vụ: Chạm để thu thập <strong>${totalGood} nguyên liệu sạch phù hợp</strong> vào giỏ nghiên cứu (tránh rác nhựa và vỏ bị mốc!).
      </p>
      <div class="collect-grid">
        ${items.map((item) => `
          <button class="collect-item" data-id="${item.id}">
            <span class="item-emoji">${item.emoji}</span>
            <span class="item-name">${item.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    board.querySelectorAll('.collect-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((i) => i.id === Number(btn.dataset.id));
        if (item.good) {
          btn.classList.add('good-picked');
          collected += 1;
          score += 20;
          feedback.textContent = `✅ Chính xác! ${item.name}: ${item.note}`;
          updateHud();
          if (collected === totalGood) {
            setTimeout(() => {
              finishStage(score, 'Bạn đã phân loại và thu thập đủ nguyên liệu đạt chuẩn để bước sang khâu làm sạch!');
            }, 500);
          }
        } else {
          btn.classList.add('bad-picked');
          score = Math.max(0, score - 15);
          feedback.textContent = `❌ Chưa đúng! ${item.name}: ${item.note}`;
          updateHud();
          setTimeout(() => btn.classList.remove('bad-picked'), 450);
        }
      });
    });
  },

  // STAGE 2: Wash dirt spots off orange peels
  runStage2(board, hud, feedback, finishStage) {
    const spots = [
      { id: 1, x: 26, y: 28, icon: '💨' },
      { id: 2, x: 46, y: 22, icon: '🟤' },
      { id: 3, x: 64, y: 34, icon: '💨' },
      { id: 4, x: 34, y: 56, icon: '🟤' },
      { id: 5, x: 54, y: 60, icon: '💨' },
      { id: 6, x: 44, y: 42, icon: '🟤' },
      { id: 7, x: 62, y: 54, icon: '💨' }
    ];
    let cleaned = 0;

    const updateHud = () => {
      const pct = Math.round((cleaned / spots.length) * 100);
      hud.innerHTML = `
        <span class="hud-pill">🫧 Độ sạch: ${pct}%</span>
        <span class="hud-pill">💧 Vết bụi còn lại: ${spots.length - cleaned}</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <div class="wash-stage">
        <p style="font-weight:700;color:var(--green-dark);text-align:center;">
          Nhiệm vụ: Chạm hoặc di chuột giữ qua các vết bụi bẩn trên vỏ cam để rửa sạch hoàn toàn!
        </p>
        <div class="peel-wash-basin" id="washBasin">
          <div class="wash-peel-shape">🍊</div>
          ${spots.map((s) => `
            <div class="dirt-spot" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%;">${s.icon}</div>
          `).join('')}
        </div>
      </div>
    `;

    let pointerDown = false;
    const basin = board.querySelector('#washBasin');
    basin.style.touchAction = 'none';
    basin.addEventListener('pointerdown', (e) => {
      pointerDown = true;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains('dirt-spot')) cleanSpot(target);
    });
    basin.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains('dirt-spot')) cleanSpot(target);
    });
    window.addEventListener('pointerup', () => { pointerDown = false; });
    window.addEventListener('pointercancel', () => { pointerDown = false; });

    const cleanSpot = (el) => {
      if (el.classList.contains('cleaned')) return;
      el.classList.add('cleaned');
      cleaned += 1;
      feedback.textContent = `💧 Đã rửa trôi ${cleaned}/${spots.length} vết bụi bám trên bề mặt vỏ!`;
      updateHud();
      if (cleaned === spots.length) {
        setTimeout(() => {
          finishStage(180, 'Vỏ cam đã sạch bóng bụi bẩn và sẵn sàng cho bước sơ chế cắt nhỏ!');
        }, 450);
      }
    };

    board.querySelectorAll('.dirt-spot').forEach((el) => {
      el.addEventListener('click', () => cleanSpot(el));
      el.addEventListener('pointerenter', () => {
        if (pointerDown) cleanSpot(el);
      });
    });
  },

  // STAGE 3: Prep / Slice peel strips into uniform pieces
  runStage3(board, hud, feedback, finishStage) {
    const totalStrips = 4;
    let slicedCount = 0;

    const updateHud = () => {
      hud.innerHTML = `
        <span class="hud-pill">✂️ Đã sơ chế: ${slicedCount}/${totalStrips} dải vỏ</span>
        <span class="hud-pill">📐 Kích thước: Đồng đều</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <div class="slice-area">
        <p style="font-weight:700;color:var(--green-dark);text-align:center;">
          Nhiệm vụ: Chạm vào từng dải vỏ cam để cắt nhỏ thành các miếng đồng đều giúp tăng diện tích tiếp xúc khi chiết xuất!
        </p>
        <div class="peel-strip-container">
          ${Array.from({ length: totalStrips }).map((_, idx) => `
            <div class="peel-strip" data-idx="${idx}" title="Chạm để cắt nhỏ">
              <div class="cut-line"></div>
              <div class="cut-line"></div>
              <div class="cut-line"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    board.querySelectorAll('.peel-strip').forEach((strip) => {
      strip.addEventListener('click', () => {
        if (strip.classList.contains('sliced')) return;
        strip.classList.add('sliced');
        strip.innerHTML = `
          <div class="peel-cube">🍊</div>
          <div class="peel-cube">🍊</div>
          <div class="peel-cube">🍊</div>
          <div class="peel-cube">🍊</div>
        `;
        slicedCount += 1;
        feedback.textContent = `✂️ Tuyệt vời! Đã cắt đều ${slicedCount}/${totalStrips} dải vỏ — diện tích tiếp xúc tăng lên đáng kể!`;
        updateHud();
        if (slicedCount === totalStrips) {
          setTimeout(() => {
            finishStage(200, 'Các miếng vỏ đã có kích thước đồng đều, giúp tinh dầu khuếch tán nhanh và đều hơn!');
          }, 550);
        }
      });
    });
  },

  // STAGE 4: Match ingredients to their scientific roles
  runStage4(board, hud, feedback, finishStage) {
    const pairs = [
      { id: 'citrus', left: '🍊 Vỏ cam, chanh, quýt', right: 'Cung cấp tinh dầu tự nhiên & Limonene' },
      { id: 'vinegar', left: '🧪 Giấm trắng', right: 'Tạo môi trường axit nhẹ, hỗ trợ làm sạch cặn khoáng' },
      { id: 'water', left: '💧 Nước sạch', right: 'Pha loãng dung dịch và hỗ trợ tiếp xúc' },
      { id: 'cinnamon', left: '🌿 Quế', right: 'Tạo hương thơm ấm áp có nguồn gốc thực vật' }
    ];
    const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

    let selectedLeft = null;
    let matched = 0;
    let score = 120;

    const updateHud = () => {
      hud.innerHTML = `
        <span class="hud-pill">🔗 Đã ghép đúng: ${matched}/${pairs.length}</span>
        <span class="hud-pill">⭐ Điểm: ${score}</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <p style="font-weight:700;color:var(--green-dark);margin-bottom:14px;">
        Nhiệm vụ: Chọn 1 nguyên liệu ở cột trái, sau đó chọn vai trò tương ứng ở cột phải để nạp vào bình chiết xuất!
      </p>
      <div class="match-layout">
        <div class="match-col" id="leftCol">
          ${pairs.map((p) => `<button class="match-card" data-side="left" data-id="${p.id}">${p.left}</button>`).join('')}
        </div>
        <div class="match-col" id="rightCol">
          ${shuffledRight.map((p) => `<button class="match-card" data-side="right" data-id="${p.id}">${p.right}</button>`).join('')}
        </div>
      </div>
    `;

    board.querySelectorAll('[data-side="left"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        board.querySelectorAll('[data-side="left"]').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedLeft = btn.dataset.id;
        feedback.textContent = '👉 Bây giờ hãy chọn vai trò tương ứng ở cột bên phải!';
      });
    });

    board.querySelectorAll('[data-side="right"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!selectedLeft) {
          feedback.textContent = '⚠️ Hãy chọn một nguyên liệu ở cột bên trái trước nhé!';
          return;
        }
        if (btn.dataset.id === selectedLeft) {
          const leftBtn = board.querySelector(`[data-side="left"][data-id="${selectedLeft}"]`);
          leftBtn.classList.remove('selected');
          leftBtn.classList.add('matched');
          btn.classList.add('matched');
          matched += 1;
          score += 25;
          selectedLeft = null;
          feedback.textContent = `✅ Ghép chính xác! Đã nạp ${matched}/${pairs.length} thành phần vào bình chiết xuất.`;
          updateHud();
          if (matched === pairs.length) {
            setTimeout(() => {
              finishStage(score, 'Bạn đã nắm vững vai trò khoa học của từng thành phần trong công thức PEELVERSE!');
            }, 500);
          }
        } else {
          score = Math.max(0, score - 10);
          feedback.textContent = '❌ Chưa khớp vai trò rồi! Hãy đọc kỹ lại công dụng của nguyên liệu nhé.';
          updateHud();
        }
      });
    });
  },

  // STAGE 5: Filtration minigame (remove solid pulp caught on mesh, keep golden liquid)
  runStage5(board, hud, feedback, finishStage) {
    const solids = [
      { id: 1, icon: '🍊', x: 16, y: 38 },
      { id: 2, icon: '🌿', x: 34, y: 40 },
      { id: 3, icon: '🍊', x: 52, y: 37 },
      { id: 4, icon: '🍂', x: 68, y: 41 },
      { id: 5, icon: '🍊', x: 80, y: 38 },
      { id: 6, icon: '🌿', x: 25, y: 24 },
      { id: 7, icon: '🍊', x: 60, y: 22 }
    ];
    let removed = 0;

    const updateHud = () => {
      const clarity = Math.round((removed / solids.length) * 100);
      hud.innerHTML = `
        <span class="hud-pill">🫖 Độ trong dung dịch: ${clarity}%</span>
        <span class="hud-pill">🍊 Bã rắn còn lại: ${solids.length - removed}</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <div class="filter-stage">
        <p style="font-weight:700;color:var(--green-dark);text-align:center;">
          Nhiệm vụ: Chạm để tách toàn bộ <strong>bã vỏ cam & vụn quế</strong> mắc trên màng lọc, giúp dung dịch vàng trong chảy xuống bình!
        </p>
        <div class="filter-pipe">
          <div style="position:absolute;top:10px;left:14px;font-size:0.78rem;font-weight:700;color:#8D5A1C;">Hỗn hợp sau ngâm chiết</div>
          <div class="filter-mesh-line" title="Màng lọc mịn"></div>
          <div style="position:absolute;bottom:14px;left:14px;font-size:0.82rem;font-weight:700;color:#1D638A;" id="filteredLiquidLabel">
            💧 Dung dịch lọc thu được: 0%
          </div>
          ${solids.map((s) => `
            <button class="filter-particle" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%;background:#FFF;border:1.5px solid #D96E13;">
              ${s.icon}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    board.querySelectorAll('.filter-particle').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.style.transform = 'translateY(-40px) scale(0)';
        btn.style.opacity = '0';
        btn.disabled = true;
        removed += 1;
        const pct = Math.round((removed / solids.length) * 100);
        board.querySelector('#filteredLiquidLabel').textContent = `✨ Dung dịch vàng trong thu được: ${pct}%`;
        feedback.textContent = `🫖 Đã tách ${removed}/${solids.length} phần bã rắn khỏi màng lọc!`;
        updateHud();
        if (removed === solids.length) {
          setTimeout(() => {
            finishStage(220, 'Dung dịch đã được lọc trong suốt, không còn cặn lơ lửng và sẵn sàng nạp vào bình xịt!');
          }, 500);
        }
      });
    });
  },

  // STAGE 6: Table cleaning challenge (spray PEELVERSE -> wipe with cloth)
  runStage6(board, hud, feedback, finishStage) {
    const stains = [
      { id: 1, icon: '☕', label: 'Vết cà phê', x: 14, y: 20 },
      { id: 2, icon: '🍜', label: 'Vết dầu mỡ', x: 42, y: 18 },
      { id: 3, icon: '🧃', label: 'Vết nước ép', x: 72, y: 24 },
      { id: 4, icon: '🥫', label: 'Vết nước sốt', x: 24, y: 58 },
      { id: 5, icon: '🧈', label: 'Vết bơ', x: 56, y: 56 },
      { id: 6, icon: '🍵', label: 'Vết trà', x: 78, y: 60 }
    ];

    let tool = 'spray'; // 'spray' | 'wipe'
    let cleaned = 0;
    let score = 0;
    let timeLeft = 35;

    const updateHud = () => {
      hud.innerHTML = `
        <span class="hud-pill">✨ Đã làm sạch: ${cleaned}/${stains.length}</span>
        <span class="hud-pill">⏱️ Thời gian: ${timeLeft}s</span>
        <span class="hud-pill">⭐ Điểm: ${score}</span>
      `;
    };
    updateHud();

    board.innerHTML = `
      <p style="font-weight:700;color:var(--green-dark);text-align:center;margin-bottom:10px;">
        Nhiệm vụ: Chọn <strong>🧴 Xịt PEELVERSE</strong> để xịt vào các vết bẩn trên bàn ăn, sau đó chuyển sang <strong>🧽 Khăn lau</strong> để lau sạch bóng!
      </p>
      <div class="table-tools">
        <button class="tool-btn active" data-tool="spray">🧴 1. Xịt dung dịch PEELVERSE</button>
        <button class="tool-btn" data-tool="wipe">🧽 2. Khăn lau sạch</button>
      </div>
      <div class="dining-table" id="diningTable">
        ${stains.map((st) => `
          <button class="table-stain unsprayed" data-id="${st.id}" data-state="unsprayed" style="left:${st.x}%;top:${st.y}%;" title="${st.label}">
            <span>${st.icon}</span>
          </button>
        `).join('')}
      </div>
    `;

    board.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        board.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        tool = btn.dataset.tool;
      });
    });

    this.activeTimer = setInterval(() => {
      timeLeft -= 1;
      updateHud();
      if (timeLeft <= 0) {
        this.cleanup();
        feedback.textContent = '⏰ Hết giờ rồi! Nhấn "Chơi lại" hoặc tiếp tục lau nhanh tay hơn nhé!';
        finishStage(score, `Bạn đã làm sạch được ${cleaned}/${stains.length} vết bẩn trên bàn ăn nội trú!`);
      }
    }, 1000);

    board.querySelectorAll('.table-stain').forEach((el) => {
      el.addEventListener('click', () => {
        const state = el.dataset.state;
        if (tool === 'spray') {
          if (state === 'unsprayed') {
            el.dataset.state = 'sprayed';
            el.classList.remove('unsprayed');
            el.classList.add('sprayed');
            score += 20;
            feedback.textContent = '💦 Đã xịt dung dịch PEELVERSE! Giờ hãy dùng Khăn lau để lau sạch nhé.';
            updateHud();
          } else {
            feedback.textContent = '💧 Vết này đã được xịt rồi — chuyển sang Khăn lau để lau sạch!';
          }
        } else if (tool === 'wipe') {
          if (state === 'sprayed') {
            el.dataset.state = 'sparkling';
            el.classList.remove('sprayed');
            el.classList.add('sparkling');
            cleaned += 1;
            score += 40;
            feedback.textContent = `✨ Sạch bóng! (${cleaned}/${stains.length} vết bẩn đã biến mất kèm hương cam quế thơm mát!)`;
            updateHud();
            if (cleaned === stains.length) {
              const timeBonus = timeLeft * 5;
              setTimeout(() => {
                finishStage(score + timeBonus, `Xuất sắc! Mặt bàn ăn sạch bóng thơm hương cam quế (Thưởng tốc độ: +${timeBonus} điểm)!`);
              }, 450);
            }
          } else if (state === 'unsprayed') {
            feedback.textContent = '🧴 Hãy xịt dung dịch PEELVERSE vào vết bẩn trước khi lau nhé!';
          }
        }
      });
    });
  }
};
