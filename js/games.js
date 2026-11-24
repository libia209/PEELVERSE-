(() => {
  const LAB_STORAGE_KEY = 'peelverse_peel_lab_v1';

  const INGREDIENTS = [
    {
      id: 'citrus',
      name: 'Vỏ cam',
      type: 'solid',
      imgSrc: 'assets/images/ing-citrus.jpg',
      color: '#D98A2B',
      phDelta: -0.25,
      mlPerUnit: 12,
      role: 'Tinh dầu D-Limonene'
    },
    {
      id: 'vinegar',
      name: 'Giấm trắng',
      type: 'liquid',
      imgSrc: 'assets/images/ing-vinegar.jpg',
      color: '#E6DFC8',
      phTarget: 2.6,
      role: 'Axit axetic nhẹ'
    },
    {
      id: 'water',
      name: 'Nước',
      type: 'liquid',
      imgSrc: 'assets/images/ing-water.jpg',
      color: '#BFD8D2',
      phTarget: 7.0,
      role: 'Dung môi pha loãng'
    },
    {
      id: 'cinnamon',
      name: 'Quế',
      type: 'solid',
      imgSrc: 'assets/images/ing-cinnamon.jpg',
      color: '#A85432',
      phDelta: 0.05,
      mlPerUnit: 10,
      role: 'Hương ấm khử mùi'
    },
    {
      id: 'mint',
      name: 'Lá bạc hà',
      type: 'solid',
      imgSrc: 'assets/images/la-bac-ha.png',
      color: '#4A7C59',
      phDelta: 0.1,
      mlPerUnit: 10,
      role: 'Menthol the mát'
    }
  ];

  const ORDERS = [
    {
      id: 'degreaser',
      recipeName: 'Tẩy dầu mỡ Vỏ Cam',
      title: 'Bàn bếp dính dầu mỡ chiên rán',
      brief: 'Cần pH 3.5–4.5, giàu tinh dầu D-Limonene từ Vỏ cam + Giấm trắng (pha chút Nước).',
      targetPh: [3.4, 4.6],
      reqSolids: { citrus: 2 },
      reqVinegarMin: 45,
      reqWaterMin: 25,
      stainTheme: 'grease',
      stainLabel: 'Dầu mỡ chiên rán',
      scienceNote: 'D-Limonene không phân cực hòa tan vết dầu mỡ, kết hợp axit axetic nhẹ làm sạch mảng bám.'
    },
    {
      id: 'mint-fresh',
      recipeName: 'Xịt thơm Bạc Hà The Mát',
      title: 'Bàn ăn ám mùi tanh thực phẩm',
      brief: 'Cần Vỏ cam + Lá bạc hà + Giấm trắng & Nước cân bằng (pH 3.8–5.0).',
      targetPh: [3.7, 5.1],
      reqSolids: { citrus: 1, mint: 2 },
      reqVinegarMin: 35,
      reqWaterMin: 40,
      stainTheme: 'fishy',
      stainLabel: 'Vết bám & mùi thực phẩm',
      scienceNote: 'Menthol từ Lá bạc hà cùng Terpene vỏ cam giúp trung hòa mùi hôi và giữ hương thanh mát.'
    },
    {
      id: 'cinnamon-warm',
      recipeName: 'Dung dịch Quế Ấm Khử Mùi',
      title: 'Tủ gỗ & bàn trà ẩm mốc nhẹ',
      brief: 'Cần Vỏ cam + Quế + Giấm trắng & Nước (pH 3.6–4.8) để làm sạch dịu nhẹ.',
      targetPh: [3.6, 4.9],
      reqSolids: { citrus: 1, cinnamon: 2 },
      reqVinegarMin: 40,
      reqWaterMin: 35,
      stainTheme: 'mold',
      stainLabel: 'Vết ẩm & cặn trà',
      scienceNote: 'Cinnamaldehyde từ Quế tạo hương ấm bền mùi và hỗ trợ giảm mùi ẩm mốc trên bề mặt gỗ.'
    },
    {
      id: 'glass-balance',
      recipeName: 'Lau kính pH Cân Bằng',
      title: 'Mặt kính mờ bụi & dấu vân tay',
      brief: 'Cần tỷ lệ Nước nhiều + ít Giấm trắng dịu nhẹ (pH 4.5–5.8) và 1 phần Vỏ cam.',
      targetPh: [4.4, 5.9],
      reqSolids: { citrus: 1 },
      reqVinegarMin: 18,
      reqWaterMin: 70,
      stainTheme: 'dust',
      stainLabel: 'Vết mờ bụi & vân tay',
      scienceNote: 'Tỷ lệ nước cao đưa pH về mức dịu nhẹ, giúp mặt kính khô nhanh mà không để lại vệt.'
    },
    {
      id: 'herbal-multi',
      recipeName: 'Hợp chất Thảo Mộc Đa Năng',
      title: 'Bàn học & bếp tổng hợp nhiều vết bẩn',
      brief: 'Cần đủ Vỏ cam + Quế + Lá bạc hà cùng Giấm trắng & Nước (pH 3.8–4.8).',
      targetPh: [3.7, 4.9],
      reqSolids: { citrus: 1, cinnamon: 1, mint: 1 },
      reqVinegarMin: 40,
      reqWaterMin: 45,
      stainTheme: 'mixed',
      stainLabel: 'Vết bẩn tổng hợp',
      scienceNote: 'Sự kết hợp hài hòa giữa D-Limonene, Menthol và Quế giúp làm sạch nhẹ và khử mùi tự nhiên.'
    }
  ];

  // ===== WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL FILES) =====
  class LabAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.pourOsc = null;
      this.pourGain = null;
      this.lastTick = 0;
    }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    playPlop(pitch = 320) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.45, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    }

    startPour() {
      const ctx = this.ensure();
      if (!ctx || this.pourOsc) return;
      const bufferSize = ctx.sampleRate * 1.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 650;
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      this.pourOsc = noise;
      this.pourGain = gain;
    }

    stopPour() {
      if (this.pourOsc && this.ctx && this.pourGain) {
        const now = this.ctx.currentTime;
        this.pourGain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
        try {
          this.pourOsc.stop(now + 0.07);
        } catch {
          // ignore
        }
      }
      this.pourOsc = null;
      this.pourGain = null;
    }

    playSwirlTick() {
      const nowMs = performance.now();
      if (nowMs - this.lastTick < 110) return;
      this.lastTick = nowMs;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420 + Math.random() * 140, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    playSpray() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    }

    playComboChime(combo = 1) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const base = 440 * Math.pow(1.06, Math.min(combo, 10));
      [base, base * 1.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    }

    playSpoilBuzz() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.22);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playShiftComplete() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.075);
        gain.gain.setValueAtTime(0.001, now + i * 0.075);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.075 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.075);
        osc.stop(now + i * 0.075 + 0.48);
      });
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(LAB_STORAGE_KEY);
      if (!raw) return { bestScore: 0, totalShifts: 0, unlockedRecipes: [], soundEnabled: true };
      const parsed = JSON.parse(raw);
      return {
        bestScore: Number(parsed.bestScore || 0),
        totalShifts: Number(parsed.totalShifts || 0),
        unlockedRecipes: Array.isArray(parsed.unlockedRecipes) ? parsed.unlockedRecipes : [],
        soundEnabled: parsed.soundEnabled !== false
      };
    } catch {
      return { bestScore: 0, totalShifts: 0, unlockedRecipes: [], soundEnabled: true };
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  function getRankTitle(bestScore, unlockedCount) {
    if (unlockedCount >= 4 || bestScore >= 1200) return 'Nghệ nhân Tinh dầu';
    if (unlockedCount >= 2 || bestScore >= 500) return 'Pha chế viên';
    return 'Tập sự';
  }

  let activeCleanup = null;

  window.PEELVERSE_GAMES = {
    stages: ORDERS.map((o, idx) => ({ id: idx + 1, num: `0${idx + 1}`, title: o.recipeName, desc: o.brief })),

    cleanup() {
      if (typeof activeCleanup === 'function') {
        activeCleanup();
        activeCleanup = null;
      }
    },

    mountLab(container, onScoreSaved) {
      this.cleanup();
      const progress = loadProgress();
      const audio = new LabAudio();
      audio.enabled = progress.soundEnabled;

      // Preload ingredient images + game sprite/background assets
      const imgMap = new Map();
      INGREDIENTS.forEach((ing) => {
        const img = new Image();
        img.src = ing.imgSrc;
        imgMap.set(ing.id, img);
      });

      const gameAssets = {
        bgShop: new Image(),
        tableTop: new Image(),
        propsSheet: new Image(),
        customersSheet: new Image()
      };
      gameAssets.bgShop.src = 'assets/game/bg-shop.png';
      gameAssets.tableTop.src = 'assets/game/table-top.png';
      gameAssets.propsSheet.src = 'assets/game/props-sheet.png';
      gameAssets.customersSheet.src = 'assets/game/customers-sheet.png';

      let shiftNumber = 1;
      let score = 0;
      let combo = 1;
      let timeLeft = 75;
      let phase = 1; // 1 = Brew, 2 = Swirl, 3 = Spray & Wipe, 4 = Shift Summary
      let currentOrder = ORDERS[0];

      // Brew state
      let liquidMl = 0; // max 220
      let vinegarMl = 0;
      let waterMl = 0;
      let solids = { citrus: 0, cinnamon: 0, mint: 0 };
      let currentPh = 7.0;
      let targetDisplayPh = 7.0;
      let spoiledCount = 0;
      let shakeFrames = 0;
      let swirlProgress = 0; // 0..100
      let swirlAnglePrev = null;
      let formulaQuality = { scorePct: 0, rank: 'A', reason: '' };

      // 1D wave physics for liquid surface
      const WAVE_N = 28;
      const waveY = new Float32Array(WAVE_N);
      const waveV = new Float32Array(WAVE_N);

      // Particles & pouring & drag
      const droplets = [];
      const oilParticles = [];
      const mistParticles = [];
      const sparkles = [];
      let pouringId = null;
      let dragging = null; // { id, x, y, spoiled }
      let spoiledItem = null; // { x, y, vx, vy, r }
      let nextSpoilTimer = 7.5;

      // Phase 3 Tabletop & dirt mask
      let dirtCanvas = null;
      let dirtCtx = null;
      let sprayedStains = []; // { x, y, r, sprayed }
      let cleanPct = 0;
      let wipeTool = 'spray'; // 'spray' | 'cloth'
      let lastPointer = null;
      let pointerDown = false;
      let shiftCompletedFlag = false;

      container.innerHTML = `
        <div class="peel-lab-shell">
          <!-- Top Dark Status Bar -->
          <div class="peel-lab-topbar">
            <div class="peel-lab-status-left">
              <span class="peel-lab-rank-pill" id="labRankPill">${getRankTitle(progress.bestScore, progress.unlockedRecipes.length)}</span>
              <span class="peel-lab-meta-chip" id="labShiftChip">Ca #01</span>
              <span class="peel-lab-meta-chip" id="labScoreChip">0 điểm</span>
              <span class="peel-lab-combo-chip" id="labComboChip">x1</span>
            </div>
            <div class="peel-lab-status-right">
              <div class="peel-lab-timer-wrap" aria-label="Thời gian ca">
                <div class="peel-lab-timer-fill" id="labTimerFill" style="width:100%;"></div>
              </div>
              <span class="peel-lab-timer-num" id="labTimerNum">75s</span>
              <button type="button" class="peel-lab-top-btn" id="labRecipeBookBtn">Sổ công thức (${progress.unlockedRecipes.length}/${ORDERS.length})</button>
              <button type="button" class="peel-lab-top-btn" id="labSoundBtn">${audio.enabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</button>
            </div>
          </div>

          <!-- Pinned Ivory Order Ticket -->
          <div class="peel-lab-ticket" id="labOrderTicket">
            <div class="peel-lab-ticket-pin" aria-hidden="true"></div>
            <div class="peel-lab-ticket-body">
              <div class="peel-lab-ticket-head">
                <span class="eyebrow-tag" id="labPhaseTag">PHA 1 / 3 • PHA CHẾ VẬT LÝ</span>
                <strong id="labOrderTitle">${currentOrder.title}</strong>
              </div>
              <p id="labOrderBrief">${currentOrder.brief}</p>
            </div>
            <div class="peel-lab-ticket-actions">
              <button type="button" class="btn btn-primary btn-sm hidden" id="labNextPhaseBtn">Chuyển sang Khuấy →</button>
              <button type="button" class="btn btn-secondary btn-sm hidden" id="labClothModeBtn">Chuyển sang Khăn lau</button>
            </div>
          </div>

          <!-- Interactive 60fps HTML5 Canvas -->
          <div class="peel-lab-stage-wrap">
            <canvas id="peelLabCanvas" class="peel-lab-canvas"></canvas>
            <div id="labOverlayCard" class="peel-lab-overlay hidden"></div>
          </div>
        </div>

        <!-- Recipe Book Modal -->
        <div id="labRecipeModal" class="contact-modal-overlay" aria-hidden="true">
          <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="labRecipeTitle">
            <div class="contact-modal-header">
              <div>
                <span class="eyebrow-tag">LƯU TRỮ PHÒNG LAB</span>
                <h3 id="labRecipeTitle" class="serif-heading" style="font-size:1.6rem;">Sổ Công Thức Chiết Xuất</h3>
              </div>
              <button type="button" id="closeLabRecipeBtn" class="icon-btn" aria-label="Đóng">×</button>
            </div>
            <div id="labRecipeList" class="peel-lab-recipe-list"></div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#peelLabCanvas');
      const ctx = canvas.getContext('2d');
      const stageWrap = container.querySelector('.peel-lab-stage-wrap');
      const nextPhaseBtn = container.querySelector('#labNextPhaseBtn');
      const clothModeBtn = container.querySelector('#labClothModeBtn');
      const overlayCard = container.querySelector('#labOverlayCard');

      let W = 800;
      let H = 480;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resizeCanvas() {
        const rect = stageWrap.getBoundingClientRect();
        W = Math.max(320, Math.floor(rect.width));
        H = Math.max(340, Math.floor(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (phase === 3 && !dirtCanvas) initTabletopDirt();
      }

      function triggerWaveImpulse(normX, strength) {
        const idx = Math.max(1, Math.min(WAVE_N - 2, Math.floor(normX * (WAVE_N - 1))));
        waveV[idx] += strength;
        waveV[idx - 1] += strength * 0.5;
        waveV[idx + 1] += strength * 0.5;
      }

      function computeLivePh() {
        const totalLiq = vinegarMl + waterMl;
        let basePh = 7.0;
        if (totalLiq > 0) {
          basePh = (vinegarMl * 2.6 + waterMl * 7.0) / totalLiq;
        }
        basePh += solids.citrus * -0.22 + solids.mint * 0.08 + solids.cinnamon * 0.04;
        return Math.max(2.0, Math.min(9.0, basePh));
      }

      function computeLiquidColor() {
        if (spoiledCount > 0) return 'rgba(116, 108, 72, 0.78)';
        let r = 212;
        let g = 224;
        let b = 216;
        const total = Math.max(1, liquidMl);
        const cRatio = Math.min(1, (solids.citrus * 22) / total);
        const mRatio = Math.min(1, (solids.mint * 20) / total);
        const cinRatio = Math.min(1, (solids.cinnamon * 20) / total);
        r = Math.round(r + cRatio * 30 + cinRatio * -35 - mRatio * 70);
        g = Math.round(g + cRatio * -40 + mRatio * -25 - cinRatio * 65);
        b = Math.round(b - cRatio * 135 - cinRatio * 120 - mRatio * 65);
        return `rgba(${Math.max(40, Math.min(255, r))}, ${Math.max(40, Math.min(255, g))}, ${Math.max(40, Math.min(255, b))}, 0.82)`;
      }

      function evaluateFormula() {
        const ord = currentOrder;
        let pts = 100;
        const reasons = [];

        if (spoiledCount > 0) {
          pts -= 35;
          reasons.push('Có nguyên liệu mốc làm đục dung dịch');
        }
        const [phMin, phMax] = ord.targetPh;
        if (currentPh < phMin || currentPh > phMax) {
          pts -= 28;
          reasons.push(`pH ${currentPh.toFixed(1)} lệch vùng chuẩn (${phMin}–${phMax})`);
        }
        Object.entries(ord.reqSolids).forEach(([k, need]) => {
          if ((solids[k] || 0) < need) {
            pts -= 18;
            const ingName = INGREDIENTS.find((x) => x.id === k)?.name || k;
            reasons.push(`Thiếu ${ingName}`);
          }
        });
        if (vinegarMl < ord.reqVinegarMin) {
          pts -= 15;
          reasons.push('Thiếu Giấm trắng');
        }
        if (waterMl < ord.reqWaterMin) {
          pts -= 12;
          reasons.push('Thiếu Nước pha loãng');
        }

        const pct = Math.max(20, Math.min(100, pts));
        const rank = pct >= 88 ? 'S' : pct >= 68 ? 'A' : 'B';
        const reason =
          reasons.length === 0
            ? `Chuẩn công thức! ${ord.scienceNote}`
            : `${reasons[0]}. ${ord.scienceNote}`;
        return { scorePct: pct, rank, reason };
      }

      function initTabletopDirt() {
        const tb = getTableRect();
        dirtCanvas = document.createElement('canvas');
        dirtCanvas.width = Math.max(200, Math.floor(tb.w));
        dirtCanvas.height = Math.max(140, Math.floor(tb.h));
        dirtCtx = dirtCanvas.getContext('2d');

        sprayedStains = [];
        const count = 6;
        for (let i = 0; i < count; i++) {
          const sx = tb.w * (0.18 + (i % 3) * 0.31 + (Math.random() - 0.5) * 0.06);
          const sy = tb.h * (0.28 + Math.floor(i / 3) * 0.42 + (Math.random() - 0.5) * 0.06);
          const sr = Math.min(tb.w, tb.h) * (0.11 + Math.random() * 0.035);
          sprayedStains.push({ x: tb.x + sx, y: tb.y + sy, r: sr, sprayed: false });

          // Draw realistic organic grease/stain patch onto offscreen mask
          const grad = dirtCtx.createRadialGradient(sx, sy, sr * 0.15, sx, sy, sr);
          if (currentOrder.stainTheme === 'grease' || currentOrder.stainTheme === 'mixed') {
            grad.addColorStop(0, 'rgba(186, 122, 42, 0.86)');
            grad.addColorStop(0.65, 'rgba(168, 98, 34, 0.68)');
            grad.addColorStop(1, 'rgba(168, 98, 34, 0)');
          } else if (currentOrder.stainTheme === 'mold') {
            grad.addColorStop(0, 'rgba(92, 108, 78, 0.85)');
            grad.addColorStop(0.7, 'rgba(72, 86, 62, 0.65)');
            grad.addColorStop(1, 'rgba(72, 86, 62, 0)');
          } else if (currentOrder.stainTheme === 'dust') {
            grad.addColorStop(0, 'rgba(148, 152, 146, 0.78)');
            grad.addColorStop(0.7, 'rgba(148, 152, 146, 0.48)');
            grad.addColorStop(1, 'rgba(148, 152, 146, 0)');
          } else {
            grad.addColorStop(0, 'rgba(168, 84, 50, 0.82)');
            grad.addColorStop(0.7, 'rgba(168, 84, 50, 0.55)');
            grad.addColorStop(1, 'rgba(168, 84, 50, 0)');
          }
          dirtCtx.fillStyle = grad;
          dirtCtx.beginPath();
          dirtCtx.arc(sx, sy, sr, 0, Math.PI * 2);
          dirtCtx.fill();

          // Extra smaller splatters
          for (let k = 0; k < 4; k++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = sr * (0.45 + Math.random() * 0.45);
            dirtCtx.beginPath();
            dirtCtx.arc(sx + Math.cos(ang) * dist, sy + Math.sin(ang) * dist, sr * 0.24, 0, Math.PI * 2);
            dirtCtx.fill();
          }
        }
        cleanPct = 0;
        wipeTool = 'spray';
        updateTopbarAndTicket();
      }

      function measureDirtRemainingPct() {
        if (!dirtCtx || !dirtCanvas) return 100;
        const data = dirtCtx.getImageData(0, 0, dirtCanvas.width, dirtCanvas.height).data;
        let nonZero = 0;
        let sampled = 0;
        for (let i = 3; i < data.length; i += 64) {
          sampled += 1;
          if (data[i] > 28) nonZero += 1;
        }
        if (sampled === 0) return 0;
        return Math.round((nonZero / sampled) * 100);
      }

      function getFlaskRect() {
        const isMobile = W < 560;
        const fw = isMobile ? Math.min(165, W * 0.42) : Math.min(200, W * 0.28);
        const fh = isMobile ? Math.min(205, H * 0.44) : Math.min(240, H * 0.5);
        const fx = (W - fw) * 0.5 - (isMobile ? 16 : 24);
        const fy = isMobile ? H * 0.14 : H * 0.12;
        return { x: fx, y: fy, w: fw, h: fh };
      }

      function getShelfCards() {
        const padX = W < 560 ? 10 : 28;
        const cardGap = W < 560 ? 6 : 12;
        const totalW = W - padX * 2;
        const cw = (totalW - cardGap * 4) / 5;
        const ch = W < 560 ? 74 : 84;
        const cy = H - ch - 12;
        return INGREDIENTS.map((ing, i) => ({
          ing,
          x: padX + i * (cw + cardGap),
          y: cy,
          w: cw,
          h: ch
        }));
      }

      function getTableRect() {
        const pad = W < 560 ? 16 : 36;
        return { x: pad, y: 24, w: W - pad * 2, h: H - 56 };
      }

      function updateTopbarAndTicket() {
        const rankEl = container.querySelector('#labRankPill');
        const shiftEl = container.querySelector('#labShiftChip');
        const scoreEl = container.querySelector('#labScoreChip');
        const comboEl = container.querySelector('#labComboChip');
        const phaseTag = container.querySelector('#labPhaseTag');
        const orderTitle = container.querySelector('#labOrderTitle');
        const orderBrief = container.querySelector('#labOrderBrief');
        const recipeBtn = container.querySelector('#labRecipeBookBtn');

        if (rankEl) rankEl.textContent = getRankTitle(Math.max(progress.bestScore, score), progress.unlockedRecipes.length);
        if (shiftEl) shiftEl.textContent = `Ca #0${shiftNumber}`;
        if (scoreEl) scoreEl.textContent = `${score} điểm`;
        if (comboEl) comboEl.textContent = `x${combo}`;
        if (recipeBtn) recipeBtn.textContent = `Sổ công thức (${progress.unlockedRecipes.length}/${ORDERS.length})`;
        if (orderTitle) orderTitle.textContent = currentOrder.title;

        if (phase === 1) {
          if (phaseTag) phaseTag.textContent = 'PHA 1 / 3 • KÉO NGUYÊN LIỆU & GIỮ ĐỂ RÓT';
          if (orderBrief) orderBrief.textContent = currentOrder.brief;
          nextPhaseBtn.classList.toggle('hidden', liquidMl < 95);
          clothModeBtn.classList.add('hidden');
        } else if (phase === 2) {
          if (phaseTag) phaseTag.textContent = 'PHA 2 / 3 • XOAY VÒNG TRÒN TRÊN BÌNH ĐỂ KHUẤY';
          if (orderBrief) orderBrief.textContent = 'Di chuyển chuột hoặc ngón tay xoay tròn quanh bình thủy tinh để chiết xuất tinh dầu D-Limonene.';
          nextPhaseBtn.classList.add('hidden');
          clothModeBtn.classList.add('hidden');
        } else if (phase === 3) {
          if (phaseTag) {
            phaseTag.textContent =
              wipeTool === 'spray'
                ? 'PHA 3 / 3 • CHẠM VÀO CÁC VẾT BẨN ĐỂ XỊT TINH DẦU'
                : 'PHA 3 / 3 • QUẸT KHĂN LAU SẠCH BỀ MẶT BÀN';
          }
          if (orderBrief) {
            orderBrief.textContent =
              wipeTool === 'spray'
                ? `Đã xịt ${sprayedStains.filter((s) => s.sprayed).length}/${sprayedStains.length} vùng bẩn. Chạm từng vết bẩn để phun sương tinh dầu.`
                : `Độ sạch mặt bàn: ${cleanPct}% — Quẹt đều tay để lau sạch hoàn toàn!`;
          }
          nextPhaseBtn.classList.add('hidden');
          clothModeBtn.classList.toggle('hidden', wipeTool !== 'spray');
        }
      }

      function resetShift(nextIdx) {
        shiftNumber = nextIdx;
        currentOrder = ORDERS[(shiftNumber - 1) % ORDERS.length];
        phase = 1;
        liquidMl = 0;
        vinegarMl = 0;
        waterMl = 0;
        solids = { citrus: 0, cinnamon: 0, mint: 0 };
        currentPh = 7.0;
        targetDisplayPh = 7.0;
        spoiledCount = 0;
        swirlProgress = 0;
        swirlAnglePrev = null;
        oilParticles.length = 0;
        droplets.length = 0;
        mistParticles.length = 0;
        sparkles.length = 0;
        dirtCanvas = null;
        dirtCtx = null;
        sprayedStains = [];
        cleanPct = 0;
        timeLeft = 75;
        shiftCompletedFlag = false;
        spoiledItem = null;
        nextSpoilTimer = 6.5;
        overlayCard.classList.add('hidden');
        updateTopbarAndTicket();
      }

      function completeShift() {
        if (shiftCompletedFlag) return;
        shiftCompletedFlag = true;
        phase = 4;
        audio.stopPour();
        audio.playShiftComplete();

        const bonus = Math.round(timeLeft * 2) + (formulaQuality.rank === 'S' ? 180 : formulaQuality.rank === 'A' ? 110 : 60);
        const gained = bonus * combo;
        score += gained;
        if (formulaQuality.rank === 'S') combo = Math.min(5, combo + 1);
        else if (formulaQuality.rank === 'B') combo = 1;

        progress.totalShifts += 1;
        if (score > progress.bestScore) progress.bestScore = score;
        if (formulaQuality.scorePct >= 68 && !progress.unlockedRecipes.includes(currentOrder.id)) {
          progress.unlockedRecipes.push(currentOrder.id);
        }
        saveProgress(progress);
        if (typeof onScoreSaved === 'function') onScoreSaved(score, progress.bestScore);
        updateTopbarAndTicket();

        const rankLabel =
          formulaQuality.rank === 'S'
            ? 'HOÀN HẢO (S-RANK)'
            : formulaQuality.rank === 'A'
            ? 'ĐẠT CHUẨN (A-RANK)'
            : 'CẦN ĐIỀU CHỈNH (B-RANK)';

        overlayCard.innerHTML = `
          <div class="peel-lab-result-box">
            <span class="eyebrow-tag">KẾT QUẢ CA #0${shiftNumber}</span>
            <div class="peel-lab-rank-badge rank-${formulaQuality.rank}">${rankLabel}</div>
            <h3 class="serif-heading" style="font-size:1.55rem;margin:6px 0;">${currentOrder.recipeName}</h3>
            <p class="peel-lab-result-note">${formulaQuality.reason}</p>
            <div class="peel-lab-result-stats">
              <div><span>Điểm ca</span><strong>+${gained}</strong></div>
              <div><span>Tổng điểm</span><strong>${score}</strong></div>
              <div><span>Độ pH pha</span><strong>${currentPh.toFixed(1)}</strong></div>
            </div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
              <button type="button" class="btn btn-secondary btn-sm" id="labReplayShiftBtn">Làm lại ca này</button>
              <button type="button" class="btn btn-primary btn-sm" id="labNextShiftBtn">Ca tiếp theo →</button>
            </div>
          </div>
        `;
        overlayCard.classList.remove('hidden');

        overlayCard.querySelector('#labReplayShiftBtn').addEventListener('click', () => {
          resetShift(shiftNumber);
        });
        overlayCard.querySelector('#labNextShiftBtn').addEventListener('click', () => {
          resetShift(shiftNumber + 1);
        });
      }

      // ===== POINTER INTERACTIONS (MOUSE + TOUCH) =====
      function getCanvasPoint(e) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

      function addSolidToFlask(ingId, dropX) {
        const ing = INGREDIENTS.find((x) => x.id === ingId);
        if (!ing) return;
        solids[ingId] = (solids[ingId] || 0) + 1;
        liquidMl = Math.min(220, liquidMl + ing.mlPerUnit);
        targetDisplayPh = computeLivePh();
        const flask = getFlaskRect();
        const normX = Math.max(0.15, Math.min(0.85, (dropX - flask.x) / flask.w));
        triggerWaveImpulse(normX, -11);
        audio.playPlop(ingId === 'citrus' ? 340 : ingId === 'mint' ? 420 : 280);
        audio.playComboChime(combo);

        for (let i = 0; i < 12; i++) {
          oilParticles.push({
            x: flask.x + flask.w * (0.2 + Math.random() * 0.6),
            y: flask.y + flask.h * 0.65,
            vx: (Math.random() - 0.5) * 26,
            vy: -14 - Math.random() * 24,
            r: 2.5 + Math.random() * 3.5,
            color: ing.color,
            alpha: 0.9
          });
        }
        updateTopbarAndTicket();
      }

      function handlePointerDown(e) {
        if (phase === 4) return;
        e.preventDefault();
        const pt = getCanvasPoint(e);
        pointerDown = true;
        lastPointer = pt;
        audio.ensure();

        if (phase === 1) {
          // Check spoiled floating item
          if (spoiledItem && Math.hypot(pt.x - spoiledItem.x, pt.y - spoiledItem.y) <= spoiledItem.r + 12) {
            dragging = { id: 'spoiled', x: pt.x, y: pt.y, spoiled: true };
            return;
          }
          const cards = getShelfCards();
          for (const c of cards) {
            if (pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h) {
              if (c.ing.type === 'liquid') {
                pouringId = c.ing.id;
                audio.startPour();
              } else {
                dragging = { id: c.ing.id, x: pt.x, y: pt.y, spoiled: false };
              }
              return;
            }
          }
        } else if (phase === 2) {
          const flask = getFlaskRect();
          swirlAnglePrev = Math.atan2(pt.y - (flask.y + flask.h * 0.55), pt.x - (flask.x + flask.w * 0.5));
        } else if (phase === 3) {
          if (wipeTool === 'spray') {
            audio.playSpray();
            for (let i = 0; i < 16; i++) {
              mistParticles.push({
                x: pt.x + (Math.random() - 0.5) * 14,
                y: pt.y + (Math.random() - 0.5) * 14,
                vx: (Math.random() - 0.5) * 90,
                vy: (Math.random() - 0.5) * 90,
                r: 2 + Math.random() * 3.5,
                life: 0.75
              });
            }
            sprayedStains.forEach((st) => {
              if (!st.sprayed && Math.hypot(pt.x - st.x, pt.y - st.y) <= st.r + 36) {
                st.sprayed = true;
                audio.playComboChime(2);
              }
            });
            if (sprayedStains.every((s) => s.sprayed)) {
              wipeTool = 'cloth';
            }
            updateTopbarAndTicket();
          } else {
            eraseDirtAt(pt.x, pt.y);
          }
        }
      }

      function eraseDirtAt(x, y) {
        if (!dirtCtx) return;
        const tb = getTableRect();
        const lx = x - tb.x;
        const ly = y - tb.y;
        const radius = formulaQuality.rank === 'S' ? 42 : formulaQuality.rank === 'A' ? 32 : 22;

        dirtCtx.save();
        dirtCtx.globalCompositeOperation = 'destination-out';
        const grad = dirtCtx.createRadialGradient(lx, ly, radius * 0.25, lx, ly, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        dirtCtx.fillStyle = grad;
        dirtCtx.beginPath();
        dirtCtx.arc(lx, ly, radius, 0, Math.PI * 2);
        dirtCtx.fill();
        dirtCtx.restore();

        if (Math.random() < 0.35) {
          sparkles.push({
            x: x + (Math.random() - 0.5) * 24,
            y: y + (Math.random() - 0.5) * 24,
            r: 3 + Math.random() * 4,
            life: 0.55
          });
        }
      }

      function handlePointerMove(e) {
        if (!pointerDown) return;
        e.preventDefault();
        const pt = getCanvasPoint(e);

        if (phase === 1 && dragging) {
          dragging.x = pt.x;
          dragging.y = pt.y;
        } else if (phase === 2) {
          const flask = getFlaskRect();
          const cx = flask.x + flask.w * 0.5;
          const cy = flask.y + flask.h * 0.55;
          const angle = Math.atan2(pt.y - cy, pt.x - cx);
          if (swirlAnglePrev !== null) {
            let delta = angle - swirlAnglePrev;
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            const mag = Math.abs(delta);
            if (mag > 0.03 && mag < 1.2) {
              swirlProgress = Math.min(100, swirlProgress + mag * 14);
              triggerWaveImpulse(0.25 + Math.random() * 0.5, (Math.random() - 0.5) * 4);
              audio.playSwirlTick();
              if (swirlProgress >= 100) {
                formulaQuality = evaluateFormula();
                phase = 3;
                initTabletopDirt();
                audio.playComboChime(4);
              }
            }
          }
          swirlAnglePrev = angle;
        } else if (phase === 3 && wipeTool === 'cloth') {
          if (lastPointer) {
            const dist = Math.hypot(pt.x - lastPointer.x, pt.y - lastPointer.y);
            const steps = Math.max(1, Math.ceil(dist / 10));
            for (let i = 1; i <= steps; i++) {
              const ix = lastPointer.x + ((pt.x - lastPointer.x) * i) / steps;
              const iy = lastPointer.y + ((pt.y - lastPointer.y) * i) / steps;
              eraseDirtAt(ix, iy);
            }
          } else {
            eraseDirtAt(pt.x, pt.y);
          }
          const rem = measureDirtRemainingPct();
          cleanPct = Math.max(cleanPct, 100 - rem);
          updateTopbarAndTicket();
          if (cleanPct >= 94) {
            completeShift();
          }
        }
        lastPointer = pt;
      }

      function handlePointerUp() {
        pointerDown = false;
        pouringId = null;
        audio.stopPour();
        swirlAnglePrev = null;

        if (phase === 1 && dragging) {
          const flask = getFlaskRect();
          const droppedInFlask =
            dragging.x >= flask.x - 18 &&
            dragging.x <= flask.x + flask.w + 18 &&
            dragging.y >= flask.y - 40 &&
            dragging.y <= flask.y + flask.h;
          if (droppedInFlask) {
            if (dragging.spoiled) {
              spoiledCount += 1;
              spoiledItem = null;
              combo = 1;
              shakeFrames = 18;
              triggerWaveImpulse(0.5, -15);
              audio.playSpoilBuzz();
              updateTopbarAndTicket();
            } else {
              addSolidToFlask(dragging.id, dragging.x);
            }
          }
          dragging = null;
        }
      }

      canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      nextPhaseBtn.addEventListener('click', () => {
        if (phase === 1 && liquidMl >= 95) {
          phase = 2;
          swirlProgress = 0;
          audio.playComboChime(2);
          updateTopbarAndTicket();
        }
      });

      clothModeBtn.addEventListener('click', () => {
        if (phase === 3) {
          wipeTool = 'cloth';
          updateTopbarAndTicket();
        }
      });

      container.querySelector('#labSoundBtn').addEventListener('click', (e) => {
        audio.enabled = !audio.enabled;
        progress.soundEnabled = audio.enabled;
        saveProgress(progress);
        if (!audio.enabled) audio.stopPour();
        e.target.textContent = audio.enabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt';
      });

      const recipeModal = container.querySelector('#labRecipeModal');
      const recipeList = container.querySelector('#labRecipeList');
      container.querySelector('#labRecipeBookBtn').addEventListener('click', () => {
        recipeList.innerHTML = ORDERS.map((ord) => {
          const unlocked = progress.unlockedRecipes.includes(ord.id);
          return `
            <div class="peel-lab-recipe-row ${unlocked ? 'unlocked' : ''}">
              <div>
                <strong>${ord.recipeName}</strong>
                <p>${unlocked ? ord.brief : 'Hoàn thành ca với độ chuẩn >= 68% để mở khóa.'}</p>
              </div>
              <span class="peel-lab-recipe-badge">${unlocked ? 'Đã mở' : 'Chưa mở'}</span>
            </div>
          `;
        }).join('');
        recipeModal.classList.add('open');
        recipeModal.setAttribute('aria-hidden', 'false');
      });
      container.querySelector('#closeLabRecipeBtn').addEventListener('click', () => {
        recipeModal.classList.remove('open');
        recipeModal.setAttribute('aria-hidden', 'true');
      });
      recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
          recipeModal.classList.remove('open');
          recipeModal.setAttribute('aria-hidden', 'true');
        }
      });

      // ===== 60FPS RENDER LOOP =====
      let rafId = null;
      let prevTime = performance.now();

      function updatePhysics(dt) {
        if (phase === 1 || phase === 2) {
          // Pouring liquid
          if (phase === 1 && pouringId && liquidMl < 220) {
            const add = 38 * dt;
            liquidMl = Math.min(220, liquidMl + add);
            if (pouringId === 'vinegar') vinegarMl += add;
            else if (pouringId === 'water') waterMl += add;
            targetDisplayPh = computeLivePh();
            triggerWaveImpulse(0.5, 1.4);
            if (Math.random() < 0.45) {
              const flask = getFlaskRect();
              droplets.push({
                x: flask.x + flask.w * 0.5 + (Math.random() - 0.5) * 8,
                y: flask.y - 6,
                vy: 140 + Math.random() * 40,
                color: pouringId === 'vinegar' ? '#E6DFC8' : '#BFD8D2'
              });
            }
            updateTopbarAndTicket();
          }

          // Smooth pH needle
          currentPh += (targetDisplayPh - currentPh) * Math.min(1, dt * 8);

          // 1D wave spring physics
          const k = 120;
          const damp = 4.2;
          for (let i = 1; i < WAVE_N - 1; i++) {
            const accel = k * ((waveY[i - 1] + waveY[i + 1]) * 0.5 - waveY[i]) - damp * waveV[i];
            waveV[i] += accel * dt;
          }
          for (let i = 1; i < WAVE_N - 1; i++) {
            waveY[i] += waveV[i] * dt;
          }

          // Spoiled peel hazard drift
          if (phase === 1) {
            nextSpoilTimer -= dt;
            if (nextSpoilTimer <= 0 && !spoiledItem) {
              spoiledItem = { x: -30, y: H * 0.34, vx: 58, r: 22 };
              nextSpoilTimer = 11 + Math.random() * 6;
            }
            if (spoiledItem && !(dragging && dragging.spoiled)) {
              spoiledItem.x += spoiledItem.vx * dt;
              if (spoiledItem.x > W + 40) spoiledItem = null;
            }
          }
        }

        // Particles
        for (let i = droplets.length - 1; i >= 0; i--) {
          droplets[i].y += droplets[i].vy * dt;
          if (droplets[i].y > H) droplets.splice(i, 1);
        }
        for (let i = oilParticles.length - 1; i >= 0; i--) {
          const p = oilParticles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy *= 0.96;
          p.vx *= 0.96;
          if (phase === 2) {
            const flask = getFlaskRect();
            const cx = flask.x + flask.w * 0.5;
            const cy = flask.y + flask.h * 0.62;
            const ang = Math.atan2(p.y - cy, p.x - cx) + 0.08;
            const rad = Math.max(12, Math.hypot(p.x - cx, p.y - cy) * 0.99);
            p.x = cx + Math.cos(ang) * rad;
            p.y = cy + Math.sin(ang) * rad;
          }
        }
        for (let i = mistParticles.length - 1; i >= 0; i--) {
          const m = mistParticles[i];
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt;
          if (m.life <= 0) mistParticles.splice(i, 1);
        }
        for (let i = sparkles.length - 1; i >= 0; i--) {
          sparkles[i].life -= dt;
          if (sparkles[i].life <= 0) sparkles.splice(i, 1);
        }

        if (shakeFrames > 0) shakeFrames -= 1;

        // Timer countdown
        if (phase < 4) {
          timeLeft = Math.max(0, timeLeft - dt);
          const fill = container.querySelector('#labTimerFill');
          const num = container.querySelector('#labTimerNum');
          if (fill) fill.style.width = `${Math.round((timeLeft / 75) * 100)}%`;
          if (num) num.textContent = `${Math.ceil(timeLeft)}s`;
          if (timeLeft <= 0) {
            formulaQuality = evaluateFormula();
            completeShift();
          }
        }
      }

      function drawBrewScene() {
        const flask = getFlaskRect();
        const shakeX = shakeFrames > 0 ? (Math.random() - 0.5) * 8 : 0;
        const fx = flask.x + shakeX;
        const fy = flask.y;
        const fw = flask.w;
        const fh = flask.h;

        // Background shop scene (assets/game/bg-shop.png)
        if (gameAssets.bgShop.complete && gameAssets.bgShop.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = 0.88;
          ctx.drawImage(gameAssets.bgShop, 0, 0, W, H);
          ctx.restore();
        } else {
          ctx.fillStyle = '#EAE5D9';
          ctx.fillRect(0, fy + fh - 10, W, H - (fy + fh - 10));
        }

        // Customer avatar at counter corner (assets/game/customers-sheet.png)
        if (gameAssets.customersSheet.complete && gameAssets.customersSheet.naturalWidth > 0) {
          const custIdx = (shiftNumber - 1) % 4;
          const custSize = W < 560 ? 64 : 88;
          ctx.save();
          ctx.beginPath();
          ctx.arc(20 + custSize * 0.5, 20 + custSize * 0.5, custSize * 0.48, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(246, 244, 238, 0.92)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(22, 42, 34, 0.25)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.clip();
          ctx.drawImage(gameAssets.customersSheet, custIdx * 256, 0, 256, 256, 20, 20, custSize, custSize);
          ctx.restore();
        }

        // Flask liquid fill clipped inside glass silhouette
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(fx + 6, fy + 18, fw - 12, fh - 24, [10, 10, 28, 28]);
        ctx.clip();

        if (liquidMl > 0) {
          const fillRatio = Math.min(0.88, liquidMl / 220);
          const surfaceY = fy + fh - 10 - (fh - 34) * fillRatio;

          ctx.fillStyle = computeLiquidColor();
          ctx.beginPath();
          ctx.moveTo(fx, fy + fh);
          for (let i = 0; i < WAVE_N; i++) {
            const wx = fx + (i / (WAVE_N - 1)) * fw;
            ctx.lineTo(wx, surfaceY + waveY[i]);
          }
          ctx.lineTo(fx + fw, fy + fh);
          ctx.closePath();
          ctx.fill();

          // Suspended essential oil droplets
          oilParticles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();

        // Pouring stream
        if (pouringId) {
          ctx.strokeStyle = pouringId === 'vinegar' ? '#DFD6BA' : '#9DC2BC';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(fx + fw * 0.5, fy - 24);
          ctx.lineTo(fx + fw * 0.5, fy + fh * 0.55);
          ctx.stroke();
        }

        // Glass flask outline + specular highlight + ml ticks
        ctx.strokeStyle = '#162A22';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(fx, fy + 16, fw, fh - 16, [8, 8, 30, 30]);
        ctx.stroke();

        // Rim
        ctx.fillStyle = '#F6F4EE';
        ctx.strokeStyle = '#162A22';
        ctx.beginPath();
        ctx.roundRect(fx - 8, fy + 6, fw + 16, 12, 6);
        ctx.fill();
        ctx.stroke();

        // Glass reflection
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx + 14, fy + 34);
        ctx.lineTo(fx + 14, fy + fh - 32);
        ctx.stroke();

        // ml ticks
        ctx.fillStyle = 'rgba(22, 42, 34, 0.55)';
        ctx.font = '600 10px "Be Vietnam Pro", sans-serif';
        [50, 100, 150, 200].forEach((ml) => {
          const ty = fy + fh - 10 - (fh - 34) * (ml / 220);
          ctx.fillRect(fx + fw - 16, ty, 10, 1.5);
          ctx.fillText(`${ml}`, fx + fw - 38, ty + 3);
        });

        // Live pH Meter Column on the right of flask
        const phX = fx + fw + (W < 560 ? 18 : 34);
        const phY = fy + 22;
        const phH = fh - 36;
        const phW = 14;
        const phGrad = ctx.createLinearGradient(0, phY, 0, phY + phH);
        phGrad.addColorStop(0, '#A85432'); // pH 2
        phGrad.addColorStop(0.35, '#D98A2B'); // pH 4
        phGrad.addColorStop(0.7, '#4A7C59'); // pH 7
        phGrad.addColorStop(1, '#2B4C7E'); // pH 9
        ctx.fillStyle = phGrad;
        ctx.beginPath();
        ctx.roundRect(phX, phY, phW, phH, 7);
        ctx.fill();

        // Target pH bracket
        const [tMin, tMax] = currentOrder.targetPh;
        const yMin = phY + ((tMin - 2) / 7) * phH;
        const yMax = phY + ((tMax - 2) / 7) * phH;
        ctx.strokeStyle = '#162A22';
        ctx.lineWidth = 2;
        ctx.strokeRect(phX - 3, yMin, phW + 6, yMax - yMin);

        // Current pH pointer
        const ptrY = phY + ((currentPh - 2) / 7) * phH;
        ctx.fillStyle = '#162A22';
        ctx.beginPath();
        ctx.moveTo(phX + phW + 4, ptrY);
        ctx.lineTo(phX + phW + 13, ptrY - 5);
        ctx.lineTo(phX + phW + 13, ptrY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.font = '700 11px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`pH ${currentPh.toFixed(1)}`, phX - 6, phY - 8);

        // Phase 2 swirl ring
        if (phase === 2) {
          const cx = fx + fw * 0.5;
          const cy = fy + fh * 0.55;
          ctx.strokeStyle = 'rgba(217, 138, 43, 0.45)';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, 46, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = '#D98A2B';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * swirlProgress) / 100);
          ctx.stroke();

          ctx.fillStyle = '#162A22';
          ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Khuấy ${Math.round(swirlProgress)}%`, cx, cy + 5);
          ctx.textAlign = 'left';
        }

        // Shelf 5 ingredients
        if (phase === 1) {
          getShelfCards().forEach(({ ing, x, y, w, h }) => {
            const active = pouringId === ing.id;
            ctx.fillStyle = active ? '#E8E3D8' : '#FFFFFF';
            ctx.strokeStyle = active ? '#162A22' : 'rgba(22, 42, 34, 0.16)';
            ctx.lineWidth = active ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 8);
            ctx.fill();
            ctx.stroke();

            const im = imgMap.get(ing.id);
            const imgSize = W < 560 ? 34 : 40;
            if (im && im.complete && im.naturalWidth > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(x + (w - imgSize) * 0.5, y + 7, imgSize, imgSize, 6);
              ctx.clip();
              ctx.drawImage(im, x + (w - imgSize) * 0.5, y + 7, imgSize, imgSize);
              ctx.restore();
            } else {
              ctx.fillStyle = ing.color;
              ctx.beginPath();
              ctx.arc(x + w * 0.5, y + 26, 15, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.fillStyle = '#162A22';
            ctx.font = `600 ${W < 560 ? 10 : 11.5}px "Be Vietnam Pro", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(ing.name, x + w * 0.5, y + h - 14);
            ctx.fillStyle = '#525B54';
            ctx.font = `500 ${W < 560 ? 8.5 : 9.5}px "Be Vietnam Pro", sans-serif`;
            ctx.fillText(ing.type === 'liquid' ? 'Giữ để rót' : 'Kéo thả', x + w * 0.5, y + h - 4);
            ctx.textAlign = 'left';
          });

          // Spoiled hazard floating
          if (spoiledItem && !(dragging && dragging.spoiled)) {
            ctx.fillStyle = '#6D6547';
            ctx.beginPath();
            ctx.arc(spoiledItem.x, spoiledItem.y, spoiledItem.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3F3A26';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#F6F4EE';
            ctx.font = '700 9.5px "Be Vietnam Pro", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Vỏ mốc', spoiledItem.x, spoiledItem.y + 3);
            ctx.textAlign = 'left';
          }

          // Dragged item
          if (dragging) {
            ctx.fillStyle = dragging.spoiled ? '#6D6547' : INGREDIENTS.find((x) => x.id === dragging.id)?.color || '#D98A2B';
            ctx.beginPath();
            ctx.arc(dragging.x, dragging.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#162A22';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      function drawTabletopScene() {
        const tb = getTableRect();
        // Bright stone tabletop (assets/game/table-top.png)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(tb.x, tb.y, tb.w, tb.h, 14);
        ctx.clip();
        if (gameAssets.tableTop.complete && gameAssets.tableTop.naturalWidth > 0) {
          ctx.drawImage(gameAssets.tableTop, tb.x, tb.y, tb.w, tb.h);
        } else {
          ctx.fillStyle = '#EAE6DC';
          ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(22, 42, 34, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tb.x, tb.y, tb.w, tb.h, 14);
        ctx.stroke();

        // Offscreen dirt mask
        if (dirtCanvas) {
          ctx.drawImage(dirtCanvas, tb.x, tb.y);
        }

        // Spray targets indicators in spray mode
        if (wipeTool === 'spray') {
          sprayedStains.forEach((st) => {
            ctx.strokeStyle = st.sprayed ? '#4A7C59' : '#A85432';
            ctx.lineWidth = 2;
            ctx.setLineDash(st.sprayed ? [] : [5, 4]);
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.r * 0.72, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        }

        // Golden mist particles
        mistParticles.forEach((m) => {
          ctx.fillStyle = `rgba(217, 138, 43, ${Math.max(0, m.life)})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Clean sparkles
        sparkles.forEach((sp) => {
          ctx.strokeStyle = `rgba(22, 42, 34, ${Math.max(0, sp.life)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sp.x - sp.r, sp.y);
          ctx.lineTo(sp.x + sp.r, sp.y);
          ctx.moveTo(sp.x, sp.y - sp.r);
          ctx.lineTo(sp.x, sp.y + sp.r);
          ctx.stroke();
        });
      }

      function loop(now) {
        const dt = Math.min(0.05, (now - prevTime) / 1000);
        prevTime = now;

        updatePhysics(dt);

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#F6F4EE';
        ctx.fillRect(0, 0, W, H);

        if (phase === 1 || phase === 2) {
          drawBrewScene();
        } else {
          drawTabletopScene();
        }

        rafId = requestAnimationFrame(loop);
      }

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      resetShift(1);
      rafId = requestAnimationFrame(loop);

      activeCleanup = () => {
        if (rafId) cancelAnimationFrame(rafId);
        audio.stopPour();
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  };
})();
