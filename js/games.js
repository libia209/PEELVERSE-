(() => {
  const SAVE_KEY = 'peelverse_peel_lab_v2';

  const DEFAULT_SAVE = {
    day: 1,
    coins: 0,
    bestScore: 0,
    combo: 1,
    unlockedRecipes: [],
    upgrades: {
      wideSpray: false,
      crystalFlask: false,
      labPhMeter: false,
      herbChime: false
    },
    musicEnabled: true,
    sfxEnabled: true
  };

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
      const p = JSON.parse(raw);
      return {
        day: Math.max(1, Number(p.day || 1)),
        coins: Math.max(0, Number(p.coins || 0)),
        bestScore: Math.max(0, Number(p.bestScore || 0)),
        combo: Math.max(1, Number(p.combo || 1)),
        unlockedRecipes: Array.isArray(p.unlockedRecipes) ? p.unlockedRecipes : [],
        upgrades: { ...DEFAULT_SAVE.upgrades, ...(p.upgrades || {}) },
        musicEnabled: p.musicEnabled !== false,
        sfxEnabled: p.sfxEnabled !== false
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }
  }

  function writeSave(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  const UPGRADES = [
    {
      id: 'wideSpray',
      name: 'Đầu xịt Phun Sương Rộng',
      desc: 'Tăng 40% bán kính xịt và lau ở Pha 3.',
      cost: 120
    },
    {
      id: 'crystalFlask',
      name: 'Bình Chiết Pha Lê',
      desc: 'Tăng +25% Xu Tinh Dầu thưởng mỗi ca.',
      cost: 160
    },
    {
      id: 'labPhMeter',
      name: 'Đồng Hồ pH Chuẩn Lab',
      desc: 'Hiện khung xanh chính xác vùng pH mục tiêu.',
      cost: 140
    },
    {
      id: 'herbChime',
      name: 'Chuông Gió Thảo Mộc',
      desc: 'Tăng thêm 35% thời gian kiên nhẫn của khách.',
      cost: 150
    }
  ];

  const ORDERS = [
    {
      id: 'degreaser',
      custIdx: 0,
      custName: 'Cô chủ tiệm bánh',
      recipeName: 'Tẩy dầu mỡ Vỏ Cam',
      dialogue: 'Bếp nhà chị vừa chiên cá xong, dầu mỡ bám dày đặc luôn, pha giúp chị chai nào tẩy nhẹ mà thơm mùi vỏ cam nha!',
      hint: 'pH 3.5–4.5 • Vỏ cam (2+) + Giấm + Nước',
      targetPh: [3.4, 4.6],
      reqSolids: { orange: 2 },
      reqVinegarMin: 45,
      reqWaterMin: 25,
      stainTheme: 'grease',
      scienceNote: 'D-Limonene không phân cực hòa tan vết dầu mỡ, kết hợp axit nhẹ làm sạch bề mặt.'
    },
    {
      id: 'mint-fresh',
      custIdx: 1,
      custName: 'Anh đầu bếp',
      recipeName: 'Xịt thơm Bạc Hà The Mát',
      dialogue: 'Quầy sơ chế bên anh đang ám mùi thức ăn, em pha giúp chai xịt Vỏ cam kết hợp Lá bạc hà cho mát dịu nhé!',
      hint: 'pH 3.8–5.0 • Vỏ cam + Lá bạc hà (2+) + Giấm + Nước',
      targetPh: [3.7, 5.1],
      reqSolids: { orange: 1, mint: 2 },
      reqVinegarMin: 35,
      reqWaterMin: 40,
      stainTheme: 'fishy',
      scienceNote: 'Menthol từ Lá bạc hà và Terpene vỏ cam giúp trung hòa mùi hôi rất tự nhiên.'
    },
    {
      id: 'glass-balance',
      custIdx: 2,
      custName: 'Bạn sinh viên',
      recipeName: 'Lau kính pH Cân Bằng',
      dialogue: 'Bàn học và cửa kính phòng mình bám bụi mờ quá, pha giúp mình chai nhiều Nước, ít Giấm dịu nhẹ kèm chút Vỏ cam nhé!',
      hint: 'pH 4.5–5.8 • Nhiều Nước + Giấm nhẹ + Vỏ cam',
      targetPh: [4.4, 5.9],
      reqSolids: { orange: 1 },
      reqVinegarMin: 18,
      reqWaterMin: 70,
      stainTheme: 'dust',
      scienceNote: 'Tỷ lệ nước cao đưa pH về mức dịu nhẹ, giúp bề mặt kính khô nhanh không vệt.'
    },
    {
      id: 'cinnamon-warm',
      custIdx: 3,
      custName: 'Bác làm vườn',
      recipeName: 'Dung dịch Quế Ấm Khử Mùi',
      dialogue: 'Tủ trà gỗ nhà bác hơi có mùi ẩm, cháu pha giúp bác chai có Vỏ cam và Quế hương ấm dịu nhẹ nhé!',
      hint: 'pH 3.6–4.8 • Vỏ cam + Quế (2+) + Giấm + Nước',
      targetPh: [3.6, 4.9],
      reqSolids: { orange: 1, cinnamon: 2 },
      reqVinegarMin: 40,
      reqWaterMin: 35,
      stainTheme: 'mold',
      scienceNote: 'Cinnamaldehyde từ Quế tạo hương ấm bền mùi và hỗ trợ giảm mùi ẩm trên gỗ.'
    },
    {
      id: 'herbal-multi',
      custIdx: 0,
      custName: 'Cô chủ tiệm bánh',
      recipeName: 'Hợp chất Thảo Mộc Đa Năng',
      dialogue: 'Hôm nay tiệm đông khách quá, pha giúp chị chai tổng hợp đủ Vỏ cam, Quế và Lá bạc hà để lau mọi mặt bàn nha!',
      hint: 'pH 3.8–4.8 • Vỏ cam + Quế + Bạc hà + Giấm + Nước',
      targetPh: [3.7, 4.9],
      reqSolids: { orange: 1, cinnamon: 1, mint: 1 },
      reqVinegarMin: 40,
      reqWaterMin: 45,
      stainTheme: 'mixed',
      scienceNote: 'Sự kết hợp hài hòa giữa D-Limonene, Menthol và Quế giúp làm sạch nhẹ và khử mùi.'
    }
  ];

  // ===== WEB AUDIO API: LO-FI BACKGROUND MUSIC + SFX =====
  class PeelSoundEngine {
    constructor(saveData) {
      this.save = saveData;
      this.ctx = null;
      this.pourSrc = null;
      this.pourGain = null;
      this.musicTimer = null;
      this.chordStep = 0;
      this.lastTick = 0;
    }

    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    startMusic() {
      if (!this.save.musicEnabled || this.musicTimer) return;
      this.ensure();
      // Warm Coffee-Talk style Lo-Fi progression: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
      const chords = [
        [174.61, 220.0, 261.63, 329.63],
        [164.81, 196.0, 246.94, 293.66],
        [146.83, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 246.94]
      ];
      const playChord = () => {
        if (!this.save.musicEnabled) return;
        const ctx = this.ensure();
        if (!ctx) return;
        const notes = chords[this.chordStep % chords.length];
        this.chordStep += 1;
        const now = ctx.currentTime;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          filter.type = 'lowpass';
          filter.frequency.value = 620;
          gain.gain.setValueAtTime(0.0001, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.022, now + i * 0.06 + 0.14);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.06 + 2.1);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 2.2);
        });
      };
      playChord();
      this.musicTimer = setInterval(playChord, 2400);
    }

    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }

    playClick() {
      if (!this.save.sfxEnabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    }

    playDoorbell() {
      if (!this.save.sfxEnabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    }

    playPlop(pitch = 340) {
      if (!this.save.sfxEnabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * 0.65, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    startPour() {
      if (!this.save.sfxEnabled || this.pourSrc) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 680;
      filter.Q.value = 1.6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.08);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      this.pourSrc = src;
      this.pourGain = gain;
    }

    stopPour() {
      if (this.pourSrc && this.ctx && this.pourGain) {
        const now = this.ctx.currentTime;
        this.pourGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        try {
          this.pourSrc.stop(now + 0.06);
        } catch {
          // ignore
        }
      }
      this.pourSrc = null;
      this.pourGain = null;
    }

    playSwirlTick() {
      if (!this.save.sfxEnabled) return;
      const nowMs = performance.now();
      if (nowMs - this.lastTick < 110) return;
      this.lastTick = nowMs;
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 140, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }

    playSpray() {
      if (!this.save.sfxEnabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const len = Math.floor(ctx.sampleRate * 0.16);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.11, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    }

    playWipe() {
      if (!this.save.sfxEnabled) return;
      const nowMs = performance.now();
      if (nowMs - this.lastTick < 130) return;
      this.lastTick = nowMs;
      const ctx = this.ensure();
      if (!ctx) return;
      const len = Math.floor(ctx.sampleRate * 0.09);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 950;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    }

    playComplete() {
      if (!this.save.sfxEnabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.075);
        gain.gain.setValueAtTime(0.001, now + i * 0.075);
        gain.gain.linearRampToValueAtTime(0.09, now + i * 0.075 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.075);
        osc.stop(now + i * 0.075 + 0.45);
      });
    }
  }

  // ===== SMART EDGE-CONNECTED BFS FLOOD-FILL BACKGROUND REMOVAL =====
  function sliceAndRemoveBg(scene, rawKey, keys2x4) {
    const tex = scene.textures.get(rawKey);
    const srcImg = tex.getSourceImage();
    const cellW = Math.floor(srcImg.width / 4);
    const cellH = Math.floor(srcImg.height / 2);

    keys2x4.forEach((outKey, idx) => {
      if (scene.textures.exists(outKey)) return;
      const col = idx % 4;
      const row = Math.floor(idx / 4);

      const c = document.createElement('canvas');
      c.width = cellW;
      c.height = cellH;
      const g = c.getContext('2d');
      g.drawImage(srcImg, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

      const imgData = g.getImageData(0, 0, cellW, cellH);
      const data = imgData.data;
      const visited = new Uint8Array(cellW * cellH);
      const queue = new Int32Array(cellW * cellH);
      let head = 0;
      let tail = 0;

      const pushIfWhite = (x, y) => {
        if (x < 0 || x >= cellW || y < 0 || y >= cellH) return;
        const p = y * cellW + x;
        if (visited[p]) return;
        const i = p * 4;
        if (data[i] > 236 && data[i + 1] > 236 && data[i + 2] > 236) {
          visited[p] = 1;
          queue[tail++] = p;
        }
      };

      for (let x = 0; x < cellW; x++) {
        pushIfWhite(x, 0);
        pushIfWhite(x, cellH - 1);
      }
      for (let y = 0; y < cellH; y++) {
        pushIfWhite(0, y);
        pushIfWhite(cellW - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        data[p * 4 + 3] = 0;
        const x = p % cellW;
        const y = (p - x) / cellW;
        pushIfWhite(x + 1, y);
        pushIfWhite(x - 1, y);
        pushIfWhite(x, y + 1);
        pushIfWhite(x, y - 1);
      }

      // Soft 1px feathering on border pixels touching transparent background
      for (let y = 1; y < cellH - 1; y++) {
        for (let x = 1; x < cellW - 1; x++) {
          const p = y * cellW + x;
          const i = p * 4;
          if (data[i + 3] === 0) continue;
          const hasTransparentNeighbor =
            data[(p - 1) * 4 + 3] === 0 ||
            data[(p + 1) * 4 + 3] === 0 ||
            data[(p - cellW) * 4 + 3] === 0 ||
            data[(p + cellW) * 4 + 3] === 0;
          if (hasTransparentNeighbor && data[i] > 215 && data[i + 1] > 215 && data[i + 2] > 215) {
            data[i + 3] = Math.round(data[i + 3] * 0.45);
          }
        }
      }

      g.putImageData(imgData, 0, 0);
      scene.textures.addCanvas(outKey, c);
    });
  }

  function makeCozyButton(scene, x, y, w, h, label, bgColor, textColor, onClick) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const drawBg = (fill) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.lineStyle(2, 0x162a22, 0.85);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    };
    drawBg(bgColor);

    const txt = scene.add
      .text(0, 0, label, {
        fontFamily: '"Be Vietnam Pro", sans-serif',
        fontSize: '15px',
        fontWeight: '600',
        color: textColor
      })
      .setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 110, ease: 'Sine.easeOut' });
    });
    container.on('pointerout', () => {
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110, ease: 'Sine.easeOut' });
    });
    container.on('pointerdown', () => {
      scene.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
      if (onClick) onClick();
    });
    container.setLabel = (newLbl) => txt.setText(newLbl);
    return container;
  }

  let activeGame = null;

  window.PEELVERSE_GAMES = {
    stages: ORDERS.map((o, idx) => ({ id: idx + 1, num: `0${idx + 1}`, title: o.recipeName, desc: o.hint })),

    cleanup() {
      if (activeGame) {
        if (activeGame._soundEngine) {
          activeGame._soundEngine.stopPour();
          activeGame._soundEngine.stopMusic();
        }
        activeGame.destroy(true);
        activeGame = null;
      }
    },

    mountLab(container, onScoreSaved) {
      this.cleanup();
      if (!window.Phaser) {
        container.innerHTML = `<div class="info-box" style="padding:28px;text-align:center;">Đang tải Phaser 3 Engine... Vui lòng kiểm tra kết nối mạng và thử lại.</div>`;
        return;
      }

      const saveData = loadSave();
      const soundEngine = new PeelSoundEngine(saveData);

      container.innerHTML = `
        <div class="peel-lab-frame" id="peelLabFrame">
          <div id="phaserMount" style="width:100%;height:100%;"></div>
          <button type="button" class="peel-lab-fs-btn" id="peelLabFsBtn" aria-label="Toàn màn hình">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            <span>Toàn màn hình</span>
          </button>
        </div>
      `;

      const frameEl = container.querySelector('#peelLabFrame');
      const fsBtn = container.querySelector('#peelLabFsBtn');
      if (fsBtn && frameEl) {
        fsBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            if (frameEl.requestFullscreen) frameEl.requestFullscreen().catch(() => {});
          } else if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        });
      }

      // ===== BOOT SCENE: PRELOAD & BFS FLOOD-FILL =====
      class BootScene extends Phaser.Scene {
        constructor() {
          super({ key: 'BootScene' });
        }
        preload() {
          const loadTxt = this.add
            .text(640, 360, 'Đang chuẩn bị Tiệm Pha Chế Tinh Dầu...', {
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '32px',
              color: '#F6F4EE'
            })
            .setOrigin(0.5);
          this.load.image('bg_shop', 'assets/game/bg-shop.png');
          this.load.image('table_top', 'assets/game/table-top.png');
          this.load.image('props_raw', 'assets/game/props-sheet.png');
          this.load.image('customers_raw', 'assets/game/customers-sheet.png');
          this.load.on('complete', () => loadTxt.destroy());
        }
        create() {
          sliceAndRemoveBg(this, 'props_raw', [
            'prop_flask',
            'prop_spray',
            'prop_vinegar',
            'prop_water',
            'prop_orange',
            'prop_cinnamon',
            'prop_mint',
            'prop_cloth'
          ]);
          sliceAndRemoveBg(this, 'customers_raw', [
            'cust_0_sad',
            'cust_1_sad',
            'cust_2_sad',
            'cust_3_sad',
            'cust_0_happy',
            'cust_1_happy',
            'cust_2_happy',
            'cust_3_happy'
          ]);

          // Procedural soft particle textures
          const g1 = this.make.graphics({ x: 0, y: 0, add: false });
          g1.fillStyle(0xf6f4ee, 1);
          g1.fillCircle(8, 8, 8);
          g1.generateTexture('dust_dot', 16, 16);

          const g2 = this.make.graphics({ x: 0, y: 0, add: false });
          g2.fillStyle(0xd98a2b, 1);
          g2.fillCircle(8, 8, 8);
          g2.generateTexture('oil_dot', 16, 16);

          const g3 = this.make.graphics({ x: 0, y: 0, add: false });
          g3.fillStyle(0xffffff, 1);
          g3.fillCircle(32, 32, 32);
          g3.generateTexture('wipe_brush', 64, 64);

          this.scene.start('ShopScene', { mode: 'title' });
        }
      }

      // ===== SHOP SCENE (TITLE, ORDER, BREW, SWIRL, DAY SUMMARY, UPGRADES) =====
      class ShopScene extends Phaser.Scene {
        constructor() {
          super({ key: 'ShopScene' });
        }

        init(data) {
          this.entryData = data || { mode: 'title' };
        }

        create() {
          this.cameras.main.fadeIn(260, 22, 42, 34);
          this.add.image(640, 360, 'bg_shop').setDisplaySize(1280, 720);

          // Floating sunlit dust motes
          this.add.particles(0, 0, 'dust_dot', {
            x: { min: 150, max: 1130 },
            y: { min: 80, max: 520 },
            lifespan: 4500,
            speedY: { min: -12, max: 8 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.16, end: 0.04 },
            alpha: { start: 0.35, end: 0 },
            frequency: 240
          });

          // State for current customer & flask
          this.customerNum = this.entryData.customerNum || 1;
          this.dayCoins = this.entryData.dayCoins || 0;
          this.currentOrder = this.entryData.order || ORDERS[(saveData.day + this.customerNum - 2) % ORDERS.length];
          this.phase = 'brew'; // 'title' | 'brew' | 'swirl' | 'result'
          this.liquidMl = 0;
          this.vinegarMl = 0;
          this.waterMl = 0;
          this.solids = { orange: 0, cinnamon: 0, mint: 0 };
          this.currentPh = 7.0;
          this.targetPh = 7.0;
          this.pouringId = null;
          this.swirlProgress = 0;
          this.swirlAnglePrev = null;
          this.wavePhase = 0;
          this.waveAmp = 0;
          this.patienceMax = saveData.upgrades.herbChime ? 105 : 78;
          this.patienceLeft = this.patienceMax;
          this.customerActive = false;

          // Customer sprite behind wooden counter (counter edge ~ y=515)
          const custKey = `cust_${this.currentOrder.custIdx}_sad`;
          this.customerSprite = this.add.image(640, 388, custKey).setDisplaySize(230, 256).setAlpha(0);
          const maskG = this.make.graphics({ add: false });
          maskG.fillStyle(0xffffff);
          maskG.fillRect(360, 80, 560, 442);
          this.customerSprite.setMask(maskG.createGeometryMask());

          // Wooden counter overlay strip at y=522 so customer stands cleanly behind counter
          const counterLip = this.add.graphics();
          counterLip.fillStyle(0x9b6b43, 0.25);
          counterLip.fillRect(0, 518, 1280, 8);

          this.createDiegeticHud();
          this.createWorkbenchProps();
          this.createSpeechBubble();
          this.createModalContainer();

          if (this.entryData.mode === 'title') {
            this.phase = 'title';
            this.showTitleOverlay();
          } else if (this.entryData.mode === 'cleaned') {
            this.phase = 'result';
            this.handleCustomerResult(this.entryData);
          } else {
            this.startCustomerVisit();
          }
        }

        createDiegeticHud() {
          const bar = this.add.container(0, 0).setDepth(30);
          const pill = (x, y, w, textStr) => {
            const g = this.add.graphics();
            g.fillStyle(0xf6f4ee, 0.94);
            g.lineStyle(1.5, 0x162a22, 0.85);
            g.fillRoundedRect(x, y, w, 36, 9);
            g.strokeRoundedRect(x, y, w, 36, 9);
            const t = this.add
              .text(x + w / 2, y + 18, textStr, {
                fontFamily: '"Be Vietnam Pro", sans-serif',
                fontSize: '14px',
                fontWeight: '700',
                color: '#162A22'
              })
              .setOrigin(0.5);
            bar.add([g, t]);
            return t;
          };

          this.hudDayTxt = pill(20, 16, 110, `Ngày ${saveData.day}`);
          this.hudCoinTxt = pill(140, 16, 165, `Xu: ${saveData.coins}`);
          this.hudComboTxt = pill(315, 16, 115, `Combo x${saveData.combo}`);
          this.hudCustTxt = pill(440, 16, 118, `Khách ${this.customerNum}/3`);

          this.recipeBtn = makeCozyButton(this, 855, 34, 130, 36, 'Sổ công thức', 0xf6f4ee, '#162A22', () => {
            soundEngine.playClick();
            this.openRecipeModal();
          });
          this.upgradeBtn = makeCozyButton(this, 995, 34, 130, 36, 'Nâng cấp', 0xf6f4ee, '#162A22', () => {
            soundEngine.playClick();
            this.openUpgradeModal();
          });
          this.musicBtn = makeCozyButton(
            this,
            1115,
            34,
            92,
            36,
            saveData.musicEnabled ? 'Nhạc: Bật' : 'Nhạc: Tắt',
            0x162a22,
            '#F6F4EE',
            () => {
              soundEngine.playClick();
              saveData.musicEnabled = !saveData.musicEnabled;
              writeSave(saveData);
              if (saveData.musicEnabled) soundEngine.startMusic();
              else soundEngine.stopMusic();
              this.musicBtn.setLabel(saveData.musicEnabled ? 'Nhạc: Bật' : 'Nhạc: Tắt');
            }
          );
          this.sfxBtn = makeCozyButton(
            this,
            1214,
            34,
            92,
            36,
            saveData.sfxEnabled ? 'SFX: Bật' : 'SFX: Tắt',
            0x162a22,
            '#F6F4EE',
            () => {
              saveData.sfxEnabled = !saveData.sfxEnabled;
              writeSave(saveData);
              this.sfxBtn.setLabel(saveData.sfxEnabled ? 'SFX: Bật' : 'SFX: Tắt');
            }
          );
          bar.add([this.recipeBtn, this.upgradeBtn, this.musicBtn, this.sfxBtn]);
        }

        createSpeechBubble() {
          this.bubble = this.add.container(865, 225).setDepth(20).setAlpha(0);
          const bg = this.add.graphics();
          bg.fillStyle(0xf6f4ee, 0.96);
          bg.lineStyle(2, 0x162a22, 0.9);
          bg.fillRoundedRect(-175, -108, 350, 210, 14);
          bg.strokeRoundedRect(-175, -108, 350, 210, 14);

          this.bubbleSpeaker = this.add.text(-155, -92, '', {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '21px',
            fontWeight: '700',
            color: '#A85432'
          });
          this.bubbleText = this.add.text(-155, -62, '', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '13.5px',
            color: '#181816',
            wordWrap: { width: 310 },
            lineSpacing: 5
          });
          this.bubbleHint = this.add.text(-155, 48, '', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            color: '#162A22'
          });

          // Patience bar
          const pTrack = this.add.graphics();
          pTrack.fillStyle(0xe0dad0, 1);
          pTrack.fillRoundedRect(-155, 76, 310, 10, 5);
          this.patienceBar = this.add.graphics();

          this.bubble.add([bg, this.bubbleSpeaker, this.bubbleText, this.bubbleHint, pTrack, this.patienceBar]);
        }

        createWorkbenchProps() {
          const addShadow = (x, y, rx, ry) => {
            const s = this.add.ellipse(x, y, rx, ry, 0x162a22, 0.24).setDepth(10);
            return s;
          };

          // Center Flask + Dynamic Liquid Graphics
          addShadow(640, 668, 150, 28);
          this.liquidGraphics = this.add.graphics().setDepth(11);
          this.flaskSprite = this.add.image(640, 590, 'prop_flask').setDisplaySize(165, 185).setDepth(12);

          // Brass pH Column beside flask
          this.phGraphics = this.add.graphics().setDepth(13);
          this.phLabelTxt = this.add
            .text(742, 495, 'pH 7.0', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '13px',
              fontWeight: '700',
              color: '#162A22',
              backgroundColor: '#F6F4EE',
              padding: { x: 6, y: 3 }
            })
            .setDepth(13);

          // Pour stream & Swirl ring graphics
          this.pourStreamG = this.add.graphics().setDepth(14);
          this.swirlRingG = this.add.graphics().setDepth(15);
          this.swirlTxt = this.add
            .text(640, 472, '', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              color: '#162A22',
              backgroundColor: '#F6F4EE',
              padding: { x: 8, y: 4 }
            })
            .setOrigin(0.5)
            .setDepth(16)
            .setAlpha(0);

          // Left Solids: Orange, Cinnamon, Mint (Draggable)
          const solidDefs = [
            { id: 'orange', key: 'prop_orange', label: 'Vỏ cam', x: 165, y: 618, homeX: 165, homeY: 618, pitch: 360 },
            { id: 'cinnamon', key: 'prop_cinnamon', label: 'Quế', x: 305, y: 618, homeX: 305, homeY: 618, pitch: 280 },
            { id: 'mint', key: 'prop_mint', label: 'Lá bạc hà', x: 445, y: 618, homeX: 445, homeY: 618, pitch: 430 }
          ];
          this.solidSprites = [];
          solidDefs.forEach((def) => {
            addShadow(def.x, def.y + 44, 108, 20);
            const sp = this.add.image(def.x, def.y, def.key).setDisplaySize(120, 120).setDepth(14);
            sp.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(sp);
            this.add
              .text(def.x, def.y + 68, def.label, {
                fontFamily: '"Be Vietnam Pro", sans-serif',
                fontSize: '13px',
                fontWeight: '700',
                color: '#F6F4EE',
                backgroundColor: '#162A22',
                padding: { x: 8, y: 3 }
              })
              .setOrigin(0.5)
              .setDepth(14);

            sp.on('pointerover', () => {
              if (this.phase !== 'brew') return;
              this.tweens.add({ targets: sp, scaleX: sp.scaleX * 1.07, scaleY: sp.scaleY * 1.07, duration: 100 });
            });
            sp.on('pointerout', () => {
              sp.setDisplaySize(120, 120);
            });
            sp.on('drag', (_p, dx, dy) => {
              if (this.phase !== 'brew') return;
              sp.x = dx;
              sp.y = dy;
              sp.setDepth(22);
            });
            sp.on('dragend', () => {
              if (this.phase === 'brew' && Phaser.Math.Distance.Between(sp.x, sp.y, 640, 540) < 115) {
                this.addSolid(def.id, def.pitch);
              }
              this.tweens.add({
                targets: sp,
                x: def.homeX,
                y: def.homeY,
                duration: 200,
                ease: 'Back.easeOut',
                onComplete: () => sp.setDepth(14)
              });
            });
            this.solidSprites.push(sp);
          });

          // Right Liquids: Vinegar, Water (Press & Hold to Pour)
          const liqDefs = [
            { id: 'vinegar', key: 'prop_vinegar', label: 'Giấm trắng (Giữ)', x: 895, y: 600, homeX: 895, homeY: 600 },
            { id: 'water', key: 'prop_water', label: 'Nước (Giữ)', x: 1065, y: 600, homeX: 1065, homeY: 600 }
          ];
          liqDefs.forEach((def) => {
            addShadow(def.x, def.y + 56, 98, 22);
            const sp = this.add.image(def.x, def.y, def.key).setDisplaySize(125, 145).setDepth(14);
            sp.setInteractive({ useHandCursor: true });
            this.add
              .text(def.x, def.y + 84, def.label, {
                fontFamily: '"Be Vietnam Pro", sans-serif',
                fontSize: '13px',
                fontWeight: '700',
                color: '#F6F4EE',
                backgroundColor: '#162A22',
                padding: { x: 8, y: 3 }
              })
              .setOrigin(0.5)
              .setDepth(14);

            sp.on('pointerdown', () => {
              if (this.phase !== 'brew') return;
              this.pouringId = def.id;
              this.pouringSprite = sp;
              soundEngine.startPour();
              this.tweens.add({
                targets: sp,
                x: 725,
                y: 458,
                angle: -46,
                duration: 180,
                ease: 'Sine.easeOut'
              });
            });
            const stopPourThis = () => {
              if (this.pouringId === def.id) {
                this.pouringId = null;
                soundEngine.stopPour();
                this.pourStreamG.clear();
                this.tweens.add({
                  targets: sp,
                  x: def.homeX,
                  y: def.homeY,
                  angle: 0,
                  duration: 200,
                  ease: 'Back.easeOut'
                });
              }
            };
            sp.on('pointerup', stopPourThis);
            sp.on('pointerout', stopPourThis);
            this.input.on('pointerup', stopPourThis);
          });

          // Action buttons: Khuấy chiết xuất & Đổ làm lại
          this.swirlActionBtn = makeCozyButton(this, 640, 692, 175, 36, 'Khuấy chiết xuất →', 0xa85432, '#F6F4EE', () => {
            if (this.phase === 'brew' && this.liquidMl >= 90) {
              soundEngine.playClick();
              this.enterSwirlPhase();
            }
          });
          this.swirlActionBtn.setDepth(18).setVisible(false);

          this.resetFlaskBtn = makeCozyButton(this, 495, 692, 100, 34, 'Đổ làm lại', 0xf6f4ee, '#162A22', () => {
            if (this.phase === 'brew') {
              soundEngine.playClick();
              this.resetFlask();
            }
          });
          this.resetFlaskBtn.setDepth(18).setVisible(false);
        }

        addSolid(id, pitch) {
          this.solids[id] = (this.solids[id] || 0) + 1;
          this.liquidMl = Math.min(220, this.liquidMl + 12);
          this.waveAmp = 9;
          soundEngine.playPlop(pitch);
          this.recomputePh();
          this.tweens.add({
            targets: this.flaskSprite,
            scaleX: this.flaskSprite.scaleX * 1.06,
            scaleY: this.flaskSprite.scaleY * 0.94,
            duration: 90,
            yoyo: true
          });
          this.add.particles(640, 520, 'oil_dot', {
            speed: { min: 40, max: 120 },
            angle: { min: 220, max: 320 },
            scale: { start: 0.45, end: 0 },
            lifespan: 450,
            quantity: 10,
            emitting: false
          }).explode(10, 640, 525);
        }

        resetFlask() {
          this.liquidMl = 0;
          this.vinegarMl = 0;
          this.waterMl = 0;
          this.solids = { orange: 0, cinnamon: 0, mint: 0 };
          this.targetPh = 7.0;
          this.swirlActionBtn.setVisible(false);
          this.resetFlaskBtn.setVisible(false);
        }

        recomputePh() {
          const totalLiq = this.vinegarMl + this.waterMl;
          let ph = 7.0;
          if (totalLiq > 0) ph = (this.vinegarMl * 2.6 + this.waterMl * 7.0) / totalLiq;
          ph += this.solids.orange * -0.22 + this.solids.mint * 0.08 + this.solids.cinnamon * 0.04;
          this.targetPh = Phaser.Math.Clamp(ph, 2.0, 9.0);
          if (this.liquidMl >= 90 && this.phase === 'brew') {
            this.swirlActionBtn.setVisible(true);
            this.resetFlaskBtn.setVisible(true);
          }
        }

        enterSwirlPhase() {
          this.phase = 'swirl';
          this.swirlProgress = 0;
          this.swirlActionBtn.setVisible(false);
          this.resetFlaskBtn.setVisible(false);
          this.swirlTxt.setText('Xoáy tròn quanh bình để chiết xuất (0%)').setAlpha(1);

          this.input.on('pointermove', (p) => {
            if (this.phase !== 'swirl' || !p.isDown) return;
            const ang = Phaser.Math.Angle.Between(640, 585, p.x, p.y);
            if (this.swirlAnglePrev !== null) {
              let delta = Phaser.Math.Angle.Wrap(ang - this.swirlAnglePrev);
              const mag = Math.abs(delta);
              if (mag > 0.03 && mag < 1.2) {
                this.swirlProgress = Math.min(100, this.swirlProgress + mag * 18);
                this.waveAmp = 8;
                soundEngine.playSwirlTick();
                this.swirlTxt.setText(`Đang chiết xuất tinh dầu (${Math.round(this.swirlProgress)}%)`);
                if (this.swirlProgress >= 100) {
                  this.finishBrewToTable();
                }
              }
            }
            this.swirlAnglePrev = ang;
          });
          this.input.on('pointerup', () => {
            this.swirlAnglePrev = null;
          });
        }

        evaluateFormula() {
          const ord = this.currentOrder;
          let pts = 100;
          const notes = [];
          const [pMin, pMax] = ord.targetPh;
          if (this.currentPh < pMin || this.currentPh > pMax) {
            pts -= 28;
            notes.push(`pH ${this.currentPh.toFixed(1)} lệch vùng (${pMin}–${pMax})`);
          }
          Object.entries(ord.reqSolids).forEach(([k, need]) => {
            if ((this.solids[k] || 0) < need) {
              pts -= 20;
              notes.push(k === 'orange' ? 'Thiếu Vỏ cam' : k === 'mint' ? 'Thiếu Lá bạc hà' : 'Thiếu Quế');
            }
          });
          if (this.vinegarMl < ord.reqVinegarMin) {
            pts -= 14;
            notes.push('Thiếu Giấm trắng');
          }
          if (this.waterMl < ord.reqWaterMin) {
            pts -= 12;
            notes.push('Thiếu Nước');
          }
          const scorePct = Math.max(25, Math.min(100, pts));
          const rank = scorePct >= 88 ? 'S' : scorePct >= 66 ? 'A' : 'B';
          const reason = notes.length === 0 ? `Chuẩn công thức! ${ord.scienceNote}` : `${notes[0]}. ${ord.scienceNote}`;
          return { scorePct, rank, reason };
        }

        finishBrewToTable() {
          this.phase = 'transition';
          const quality = this.evaluateFormula();
          this.swirlTxt.setText('Chiết xuất hoàn tất!');
          this.cameras.main.fadeOut(320, 22, 42, 34);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TableScene', {
              order: this.currentOrder,
              customerNum: this.customerNum,
              dayCoins: this.dayCoins,
              quality
            });
          });
        }

        startCustomerVisit() {
          this.phase = 'brew';
          this.customerActive = true;
          soundEngine.playDoorbell();
          this.customerSprite.setTexture(`cust_${this.currentOrder.custIdx}_sad`).setPosition(460, 396).setAlpha(0);
          this.tweens.add({
            targets: this.customerSprite,
            x: 640,
            alpha: 1,
            duration: 460,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: this.customerSprite,
                y: 391,
                duration: 1300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
              });
            }
          });

          this.bubbleSpeaker.setText(this.currentOrder.custName);
          this.bubbleHint.setText(`Yêu cầu: ${this.currentOrder.hint}`);
          this.bubbleText.setText('');
          this.tweens.add({ targets: this.bubble, alpha: 1, duration: 240 });

          // Typewriter dialogue
          const fullTxt = this.currentOrder.dialogue;
          let charIdx = 0;
          this.time.addEvent({
            delay: 18,
            repeat: fullTxt.length - 1,
            callback: () => {
              charIdx += 1;
              this.bubbleText.setText(fullTxt.slice(0, charIdx));
            }
          });
        }

        handleCustomerResult(res) {
          const ord = res.order;
          const q = res.quality;
          this.customerSprite.setTexture(`cust_${ord.custIdx}_happy`).setPosition(640, 388).setAlpha(1);
          this.tweens.add({
            targets: this.customerSprite,
            y: 372,
            duration: 240,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeOut'
          });

          soundEngine.playComplete();
          let earned = q.rank === 'S' ? 95 : q.rank === 'A' ? 65 : 35;
          if (saveData.upgrades.crystalFlask) earned = Math.round(earned * 1.25);
          if (q.rank === 'S') saveData.combo = Math.min(5, saveData.combo + 1);
          else if (q.rank === 'B') saveData.combo = 1;
          earned *= saveData.combo;

          saveData.coins += earned;
          saveData.bestScore = Math.max(saveData.bestScore, saveData.coins);
          if (q.rank !== 'B' && !saveData.unlockedRecipes.includes(ord.id)) {
            saveData.unlockedRecipes.push(ord.id);
          }
          writeSave(saveData);
          if (typeof onScoreSaved === 'function') onScoreSaved(earned, saveData.bestScore);

          this.hudCoinTxt.setText(`Xu: ${saveData.coins}`);
          this.hudComboTxt.setText(`Combo x${saveData.combo}`);

          // Burst stars
          this.add.particles(640, 320, 'oil_dot', {
            speed: { min: 70, max: 200 },
            scale: { start: 0.6, end: 0 },
            lifespan: 700,
            quantity: 22,
            emitting: false
          }).explode(22, 640, 320);

          const nextDayCoins = (res.dayCoins || 0) + earned;
          const card = this.add.container(640, 360).setDepth(45);
          const bg = this.add.graphics();
          bg.fillStyle(0xf6f4ee, 0.98);
          bg.lineStyle(2.5, 0x162a22, 1);
          bg.fillRoundedRect(-250, -140, 500, 280, 16);
          bg.strokeRoundedRect(-250, -140, 500, 280, 16);

          const rankTitle = q.rank === 'S' ? 'HOÀN HẢO (HẠNG S)' : q.rank === 'A' ? 'ĐẠT CHUẨN (HẠNG A)' : 'CẦN CHỈNH TỶ LỆ (HẠNG B)';
          const t1 = this.add.text(0, -104, rankTitle, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '14px',
            fontWeight: '800',
            color: q.rank === 'S' ? '#162A22' : '#A85432'
          }).setOrigin(0.5);
          const t2 = this.add.text(0, -68, `${ord.recipeName}  •  +${earned} Xu`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#162A22'
          }).setOrigin(0.5);
          const t3 = this.add.text(0, -5, q.reason, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '14px',
            color: '#525B54',
            align: 'center',
            wordWrap: { width: 440 }
          }).setOrigin(0.5);

          const isEndOfDay = (res.customerNum || 1) >= 3;
          const nextBtn = makeCozyButton(
            this,
            0,
            88,
            230,
            44,
            isEndOfDay ? 'Xem Tổng Kết Ngày →' : 'Khách tiếp theo →',
            0x162a22,
            '#F6F4EE',
            () => {
              soundEngine.playClick();
              card.destroy();
              if (isEndOfDay) {
                this.showDaySummary(nextDayCoins);
              } else {
                this.scene.restart({ mode: 'play', customerNum: (res.customerNum || 1) + 1, dayCoins: nextDayCoins });
              }
            }
          );

          card.add([bg, t1, t2, t3, nextBtn]);
        }

        showDaySummary(dayCoins) {
          const card = this.add.container(640, 360).setDepth(50);
          const bg = this.add.graphics();
          bg.fillStyle(0xf6f4ee, 0.99);
          bg.lineStyle(3, 0x162a22, 1);
          bg.fillRoundedRect(-260, -155, 520, 310, 16);
          bg.strokeRoundedRect(-260, -155, 520, 310, 16);

          const t1 = this.add.text(0, -110, `TỔNG KẾT NGÀY ${saveData.day}`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '34px',
            fontWeight: '700',
            color: '#162A22'
          }).setOrigin(0.5);
          const t2 = this.add.text(0, -50, `Doanh thu hôm nay: +${dayCoins} Xu Tinh Dầu\nTổng quỹ tiệm hiện có: ${saveData.coins} Xu`, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '16px',
            color: '#525B54',
            align: 'center',
            lineSpacing: 8
          }).setOrigin(0.5);

          const upgBtn = makeCozyButton(this, -120, 68, 200, 44, 'Nâng cấp Tiệm', 0xf6f4ee, '#162A22', () => {
            soundEngine.playClick();
            this.openUpgradeModal();
          });
          const nextDayBtn = makeCozyButton(this, 120, 68, 210, 44, `Mở Ngày ${saveData.day + 1} →`, 0x162a22, '#F6F4EE', () => {
            soundEngine.playClick();
            saveData.day += 1;
            writeSave(saveData);
            card.destroy();
            this.scene.restart({ mode: 'play', customerNum: 1, dayCoins: 0 });
          });

          card.add([bg, t1, t2, upgBtn, nextDayBtn]);
        }

        showTitleOverlay() {
          const ov = this.add.container(640, 360).setDepth(55);
          const dim = this.add.rectangle(0, 0, 1280, 720, 0x162a22, 0.45);
          const card = this.add.graphics();
          card.fillStyle(0xf6f4ee, 0.98);
          card.lineStyle(2.5, 0x162a22, 1);
          card.fillRoundedRect(-270, -170, 540, 340, 18);
          card.strokeRoundedRect(-270, -170, 540, 340, 18);

          const ey = this.add.text(0, -125, 'PEELVERSE • BOTANICAL LAB GAME', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            color: '#A85432'
          }).setOrigin(0.5);
          const title = this.add.text(0, -78, 'PEEL LAB', {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '52px',
            fontWeight: '700',
            color: '#162A22'
          }).setOrigin(0.5);
          const sub = this.add.text(0, -24, 'Tiệm Pha Chế Tinh Dầu Vỏ Cam\nKéo thả nguyên liệu • Khuấy chiết xuất • Xịt & lau sạch bề mặt', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '14.5px',
            color: '#525B54',
            align: 'center',
            lineSpacing: 6
          }).setOrigin(0.5);

          const openBtn = makeCozyButton(this, 0, 62, 260, 48, `Mở cửa Tiệm (Ngày ${saveData.day})`, 0x162a22, '#F6F4EE', () => {
            soundEngine.ensure();
            soundEngine.playClick();
            soundEngine.startMusic();
            ov.destroy();
            this.startCustomerVisit();
          });
          const upgBtn = makeCozyButton(this, 0, 124, 210, 40, `Nâng cấp Tiệm (${saveData.coins} Xu)`, 0xf6f4ee, '#162A22', () => {
            soundEngine.ensure();
            soundEngine.playClick();
            this.openUpgradeModal();
          });

          ov.add([dim, card, ey, title, sub, openBtn, upgBtn]);
        }

        createModalContainer() {
          this.modalGroup = this.add.container(640, 360).setDepth(70).setVisible(false);
        }

        openUpgradeModal() {
          this.modalGroup.removeAll(true);
          const dim = this.add.rectangle(0, 0, 1280, 720, 0x162a22, 0.55).setInteractive();
          const bg = this.add.graphics();
          bg.fillStyle(0xf6f4ee, 1);
          bg.lineStyle(2.5, 0x162a22, 1);
          bg.fillRoundedRect(-330, -230, 660, 460, 16);
          bg.strokeRoundedRect(-330, -230, 660, 460, 16);

          const title = this.add.text(-295, -200, `Cửa Hàng Nâng Cấp  •  Quỹ: ${saveData.coins} Xu`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#162A22'
          });
          const closeBtn = makeCozyButton(this, 275, -186, 70, 32, 'Đóng', 0x162a22, '#F6F4EE', () => {
            soundEngine.playClick();
            this.modalGroup.setVisible(false);
          });
          this.modalGroup.add([dim, bg, title, closeBtn]);

          UPGRADES.forEach((up, idx) => {
            const ry = -110 + idx * 82;
            const owned = Boolean(saveData.upgrades[up.id]);
            const rowBg = this.add.graphics();
            rowBg.fillStyle(0xffffff, 1);
            rowBg.lineStyle(1, 0x162a22, 0.18);
            rowBg.fillRoundedRect(-295, ry - 28, 590, 66, 10);
            rowBg.strokeRoundedRect(-295, ry - 28, 590, 66, 10);

            const nm = this.add.text(-275, ry - 18, up.name, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              color: '#162A22'
            });
            const ds = this.add.text(-275, ry + 5, up.desc, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12.5px',
              color: '#525B54'
            });
            const actBtn = makeCozyButton(
              this,
              215,
              ry + 4,
              130,
              36,
              owned ? 'Đã sở hữu' : `Mua (${up.cost} Xu)`,
              owned ? 0x4a7c59 : saveData.coins >= up.cost ? 0xa85432 : 0xd5d0c5,
              '#FFFFFF',
              () => {
                if (owned || saveData.coins < up.cost) return;
                soundEngine.playComplete();
                saveData.coins -= up.cost;
                saveData.upgrades[up.id] = true;
                writeSave(saveData);
                this.hudCoinTxt.setText(`Xu: ${saveData.coins}`);
                this.openUpgradeModal();
              }
            );
            this.modalGroup.add([rowBg, nm, ds, actBtn]);
          });
          this.modalGroup.setVisible(true);
        }

        openRecipeModal() {
          this.modalGroup.removeAll(true);
          const dim = this.add.rectangle(0, 0, 1280, 720, 0x162a22, 0.55).setInteractive();
          const bg = this.add.graphics();
          bg.fillStyle(0xf6f4ee, 1);
          bg.lineStyle(2.5, 0x162a22, 1);
          bg.fillRoundedRect(-330, -240, 660, 480, 16);
          bg.strokeRoundedRect(-330, -240, 660, 480, 16);

          const title = this.add.text(-295, -210, `Sổ Công Thức (${saveData.unlockedRecipes.length}/${ORDERS.length})`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#162A22'
          });
          const closeBtn = makeCozyButton(this, 275, -196, 70, 32, 'Đóng', 0x162a22, '#F6F4EE', () => {
            soundEngine.playClick();
            this.modalGroup.setVisible(false);
          });
          this.modalGroup.add([dim, bg, title, closeBtn]);

          ORDERS.forEach((ord, idx) => {
            const ry = -132 + idx * 72;
            const unlocked = saveData.unlockedRecipes.includes(ord.id);
            const rowBg = this.add.graphics();
            rowBg.fillStyle(unlocked ? 0xffffff : 0xedeae2, 1);
            rowBg.lineStyle(1, 0x162a22, 0.15);
            rowBg.fillRoundedRect(-295, ry - 22, 590, 58, 8);
            rowBg.strokeRoundedRect(-295, ry - 22, 590, 58, 8);
            const nm = this.add.text(-275, ry - 14, ord.recipeName, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#162A22'
            });
            const ds = this.add.text(-275, ry + 8, unlocked ? ord.hint : 'Hoàn thành ca với Hạng A/S để mở khóa công thức.', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12px',
              color: '#525B54'
            });
            const badge = this.add.text(275, ry + 6, unlocked ? 'ĐÃ MỞ' : 'KHÓA', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '11px',
              fontWeight: '700',
              color: unlocked ? '#162A22' : '#7A7D78'
            }).setOrigin(1, 0.5);
            this.modalGroup.add([rowBg, nm, ds, badge]);
          });
          this.modalGroup.setVisible(true);
        }

        update(_time, delta) {
          const dt = delta / 1000;
          this.wavePhase += dt * 5.2;
          this.waveAmp = Math.max(0.6, this.waveAmp * (1 - dt * 2.5));

          // Pouring liquid
          if (this.phase === 'brew' && this.pouringId && this.liquidMl < 220) {
            const add = 44 * dt;
            this.liquidMl = Math.min(220, this.liquidMl + add);
            if (this.pouringId === 'vinegar') this.vinegarMl += add;
            else this.waterMl += add;
            this.waveAmp = 5.5;
            this.recomputePh();

            this.pourStreamG.clear();
            this.pourStreamG.lineStyle(6, this.pouringId === 'vinegar' ? 0xdfd6ba : 0x9dc2bc, 0.9);
            this.pourStreamG.beginPath();
            this.pourStreamG.moveTo(662, 476);
            this.pourStreamG.lineTo(645, 625);
            this.pourStreamG.strokePath();
          }

          // Smooth pH needle
          this.currentPh += (this.targetPh - this.currentPh) * Math.min(1, dt * 8);
          this.phLabelTxt.setText(`pH ${this.currentPh.toFixed(1)}`);

          // Draw dynamic liquid inside flask
          this.liquidGraphics.clear();
          if (this.liquidMl > 0) {
            const ratio = Math.min(0.84, this.liquidMl / 220);
            const bottomY = 668;
            const topY = bottomY - 120 * ratio;
            const halfW = 36 + (1 - ratio) * 24;
            const colorHex =
              this.solids.orange > 0 && this.solids.mint > 0
                ? 0x7a9a58
                : this.solids.orange > 0
                ? 0xd98a2b
                : this.solids.cinnamon > 0
                ? 0xa85432
                : this.solids.mint > 0
                ? 0x4a7c59
                : 0xbfd8d2;

            this.liquidGraphics.fillStyle(colorHex, 0.82);
            this.liquidGraphics.beginPath();
            this.liquidGraphics.moveTo(640 - 62, bottomY);
            for (let x = -halfW; x <= halfW; x += 6) {
              const wy = Math.sin(this.wavePhase + x * 0.08) * this.waveAmp;
              this.liquidGraphics.lineTo(640 + x, topY + wy);
            }
            this.liquidGraphics.lineTo(640 + 62, bottomY);
            this.liquidGraphics.closePath();
            this.liquidGraphics.fillPath();
          }

          // Draw Brass pH Column
          this.phGraphics.clear();
          const px = 748;
          const py = 526;
          const phH = 140;
          this.phGraphics.fillStyle(0xf6f4ee, 0.95);
          this.phGraphics.lineStyle(2, 0x162a22, 0.85);
          this.phGraphics.fillRoundedRect(px, py, 16, phH, 7);
          this.phGraphics.strokeRoundedRect(px, py, 16, phH, 7);

          const [tMin, tMax] = this.currentOrder.targetPh;
          const y1 = py + ((tMin - 2) / 7) * phH;
          const y2 = py + ((tMax - 2) / 7) * phH;
          this.phGraphics.fillStyle(0x4a7c59, saveData.upgrades.labPhMeter ? 0.85 : 0.45);
          this.phGraphics.fillRect(px + 2, y1, 12, Math.max(8, y2 - y1));

          const ptrY = py + ((this.currentPh - 2) / 7) * phH;
          this.phGraphics.fillStyle(0xa85432, 1);
          this.phGraphics.fillTriangle(px + 18, ptrY, px + 28, ptrY - 5, px + 28, ptrY + 5);

          // Swirl ring
          this.swirlRingG.clear();
          if (this.phase === 'swirl') {
            this.swirlRingG.lineStyle(4, 0xd98a2b, 0.35);
            this.swirlRingG.strokeCircle(640, 585, 58);
            this.swirlRingG.lineStyle(5, 0xd98a2b, 1);
            this.swirlRingG.beginPath();
            this.swirlRingG.arc(640, 585, 58, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * this.swirlProgress) / 100);
            this.swirlRingG.strokePath();
          }

          // Patience countdown
          if (this.customerActive && (this.phase === 'brew' || this.phase === 'swirl')) {
            this.patienceLeft = Math.max(0, this.patienceLeft - dt);
            const pct = this.patienceLeft / this.patienceMax;
            this.patienceBar.clear();
            this.patienceBar.fillStyle(pct > 0.3 ? 0x4a7c59 : 0xa85432, 1);
            this.patienceBar.fillRoundedRect(-155, 76, 310 * pct, 10, 5);
          }
        }
      }

      // ===== TABLE SCENE (PHASE 3: SPRAY & WIPE ON TABLE_TOP) =====
      class TableScene extends Phaser.Scene {
        constructor() {
          super({ key: 'TableScene' });
        }

        init(data) {
          this.dataIn = data;
        }

        create() {
          this.cameras.main.fadeIn(280, 22, 42, 34);
          this.add.image(640, 360, 'table_top').setDisplaySize(1280, 720);

          const quality = this.dataIn.quality;
          const order = this.dataIn.order;

          // RenderTexture dirt layer across center tabletop
          this.rtX = 230;
          this.rtY = 140;
          this.rtW = 820;
          this.rtH = 440;
          this.dirtRt = this.add.renderTexture(this.rtX, this.rtY, this.rtW, this.rtH).setOrigin(0, 0).setDepth(5);

          // Stamp organic stains onto RenderTexture
          const stainColor =
            order.stainTheme === 'grease' || order.stainTheme === 'mixed'
              ? 0xb87624
              : order.stainTheme === 'mold'
              ? 0x526444
              : order.stainTheme === 'dust'
              ? 0x8e928c
              : 0xa85432;

          const stampG = this.make.graphics({ add: false });
          this.stains = [];
          for (let i = 0; i < 6; i++) {
            const sx = 140 + (i % 3) * 260 + Phaser.Math.Between(-35, 35);
            const sy = 120 + Math.floor(i / 3) * 195 + Phaser.Math.Between(-25, 25);
            this.stains.push({ x: this.rtX + sx, y: this.rtY + sy, sprayed: false });
            stampG.clear();
            stampG.fillStyle(stainColor, 0.72);
            stampG.fillCircle(80, 80, 58);
            stampG.fillStyle(stainColor, 0.45);
            stampG.fillCircle(42, 65, 32);
            stampG.fillCircle(118, 96, 28);
            this.dirtRt.draw(stampG, sx - 80, sy - 80);
          }

          this.tool = 'spray'; // 'spray' | 'cloth'
          this.cleanPct = 0;
          this.totalWipeMoves = 0;
          this.doneFlag = false;

          // Top cozy HUD
          const hudBg = this.add.graphics().setDepth(20);
          hudBg.fillStyle(0xf6f4ee, 0.95);
          hudBg.lineStyle(2, 0x162a22, 0.9);
          hudBg.fillRoundedRect(240, 18, 800, 48, 12);
          hudBg.strokeRoundedRect(240, 18, 800, 48, 12);

          this.statusTxt = this.add
            .text(640, 42, 'Bước 1: Bấm vào từng mảng bẩn để XỊT tinh dầu D-Limonene!', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              color: '#162A22'
            })
            .setOrigin(0.5)
            .setDepth(21);

          // Tool buttons at bottom
          this.sprayBtn = makeCozyButton(this, 535, 665, 190, 44, 'Chai xịt tinh dầu', 0xa85432, '#F6F4EE', () => {
            soundEngine.playClick();
            this.setTool('spray');
          }).setDepth(22);

          this.clothBtn = makeCozyButton(this, 745, 665, 190, 44, 'Khăn vải linen', 0xf6f4ee, '#162A22', () => {
            soundEngine.playClick();
            this.setTool('cloth');
          }).setDepth(22);

          // Active cursor prop follower
          this.cursorProp = this.add.image(640, 360, 'prop_spray').setDisplaySize(86, 100).setDepth(30).setAlpha(0.92);

          const wipeRadiusScale =
            (quality.rank === 'S' ? 1.25 : quality.rank === 'A' ? 0.95 : 0.65) *
            (saveData.upgrades.wideSpray ? 1.4 : 1.0);

          this.input.on('pointermove', (p) => {
            this.cursorProp.setPosition(p.x + 18, p.y - 12);
            if (!p.isDown || this.tool !== 'cloth' || this.doneFlag) return;
            const lx = p.x - this.rtX;
            const ly = p.y - this.rtY;
            if (lx >= -30 && lx <= this.rtW + 30 && ly >= -30 && ly <= this.rtH + 30) {
              const brush = this.make.image({ key: 'wipe_brush', add: false }).setScale(wipeRadiusScale);
              this.dirtRt.erase(brush, lx, ly);
              brush.destroy();
              soundEngine.playWipe();
              this.totalWipeMoves += 1;

              this.add.particles(p.x, p.y, 'dust_dot', {
                speed: { min: 20, max: 60 },
                scale: { start: 0.35, end: 0 },
                lifespan: 320,
                quantity: 2,
                emitting: false
              }).explode(2, p.x, p.y);

              const targetMoves = quality.rank === 'S' ? 32 : quality.rank === 'A' ? 48 : 68;
              this.cleanPct = Math.min(100, Math.round((this.totalWipeMoves / targetMoves) * 100));
              this.statusTxt.setText(`Bước 2: Kéo khăn lau sạch mặt bàn (${this.cleanPct}%)`);
              if (this.cleanPct >= 100) {
                this.finishCleaning();
              }
            }
          });

          this.input.on('pointerdown', (p) => {
            if (p.y > 615 || this.doneFlag) return;
            if (this.tool === 'spray') {
              soundEngine.playSpray();
              this.add.particles(p.x, p.y, 'oil_dot', {
                speed: { min: 40, max: 130 },
                scale: { start: 0.45, end: 0 },
                lifespan: 420,
                quantity: 16,
                emitting: false
              }).explode(16, p.x, p.y);

              this.stains.forEach((st) => {
                if (!st.sprayed && Phaser.Math.Distance.Between(p.x, p.y, st.x, st.y) < 95) {
                  st.sprayed = true;
                }
              });
              const doneSprays = this.stains.filter((s) => s.sprayed).length;
              if (doneSprays >= this.stains.length) {
                this.setTool('cloth');
              } else {
                this.statusTxt.setText(`Đã xịt ${doneSprays}/${this.stains.length} mảng bẩn — Chạm tiếp các vết còn lại!`);
              }
            }
          });
        }

        setTool(nextTool) {
          this.tool = nextTool;
          this.cursorProp.setTexture(nextTool === 'spray' ? 'prop_spray' : 'prop_cloth');
          this.cursorProp.setDisplaySize(nextTool === 'spray' ? 86 : 96, nextTool === 'spray' ? 100 : 80);
          if (nextTool === 'cloth') {
            this.statusTxt.setText(`Bước 2: Giữ & kéo khăn vải lau sạch các vết bẩn (${this.cleanPct}%)`);
          }
        }

        finishCleaning() {
          if (this.doneFlag) return;
          this.doneFlag = true;
          this.dirtRt.clear();
          this.statusTxt.setText('Mặt bàn đã sạch bóng tinh tươm!');
          this.cameras.main.fadeOut(380, 22, 42, 34);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ShopScene', {
              mode: 'cleaned',
              order: this.dataIn.order,
              customerNum: this.dataIn.customerNum,
              dayCoins: this.dataIn.dayCoins,
              quality: this.dataIn.quality
            });
          });
        }
      }

      activeGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'phaserMount',
        width: 1280,
        height: 720,
        backgroundColor: '#162A22',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [BootScene, ShopScene, TableScene]
      });
      activeGame._soundEngine = soundEngine;
    }
  };
})();
