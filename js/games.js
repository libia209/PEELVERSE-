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

  // ===== AUTO-VALLEY SLICING + BFS FLOOD-FILL + LARGEST COMPONENT + AUTO-TRIM =====
  function sliceSpriteSheetClean(scene, rawKey, keys2x4, isPropSheet) {
    const tex = scene.textures.get(rawKey);
    const srcImg = tex.getSourceImage();
    const W = srcImg.width;
    const H = srcImg.height;

    const fullC = document.createElement('canvas');
    fullC.width = W;
    fullC.height = H;
    const fullG = fullC.getContext('2d');
    fullG.drawImage(srcImg, 0, 0);
    const fullData = fullG.getImageData(0, 0, W, H).data;

    const isEmptyPx = (x, y) => {
      const i = (y * W + x) * 4;
      return fullData[i + 3] < 20 || (fullData[i] > 240 && fullData[i + 1] > 240 && fullData[i + 2] > 240);
    };

    // 1. Horizontal Projection Profile (35%..70% H) to find row gutter
    const yStart = Math.floor(H * 0.35);
    const yEnd = Math.floor(H * 0.7);
    let bestRowY = Math.floor(H * 0.5);
    let minRowInk = Infinity;
    let runStart = -1;
    let bestRunLen = 0;
    let bestRunMid = bestRowY;

    for (let y = yStart; y <= yEnd; y++) {
      let ink = 0;
      for (let x = 0; x < W; x += 2) {
        if (!isEmptyPx(x, y)) ink += 1;
      }
      if (ink === 0) {
        if (runStart === -1) runStart = y;
        const len = y - runStart + 1;
        if (len > bestRunLen) {
          bestRunLen = len;
          bestRunMid = Math.floor((runStart + y) / 2);
        }
      } else {
        runStart = -1;
        if (ink < minRowInk) {
          minRowInk = ink;
          bestRowY = y;
        }
      }
    }
    const splitY = bestRunLen > 0 ? bestRunMid : bestRowY;

    // 2. Vertical Projection Profile around 25%, 50%, 75% W to find 3 column gutters
    const findColSplit = (centerFrac) => {
      const cx0 = Math.floor(W * (centerFrac - 0.09));
      const cx1 = Math.floor(W * (centerFrac + 0.09));
      let minInk = Infinity;
      let fallbackX = Math.floor(W * centerFrac);
      let rStart = -1;
      let rBestLen = 0;
      let rBestMid = fallbackX;
      for (let x = cx0; x <= cx1; x++) {
        let ink = 0;
        for (let y = 0; y < H; y += 2) {
          if (!isEmptyPx(x, y)) ink += 1;
        }
        if (ink === 0) {
          if (rStart === -1) rStart = x;
          const len = x - rStart + 1;
          if (len > rBestLen) {
            rBestLen = len;
            rBestMid = Math.floor((rStart + x) / 2);
          }
        } else {
          rStart = -1;
          if (ink < minInk) {
            minInk = ink;
            fallbackX = x;
          }
        }
      }
      return rBestLen > 0 ? rBestMid : fallbackX;
    };

    const colBounds = [0, findColSplit(0.25), findColSplit(0.5), findColSplit(0.75), W];
    const rowBounds = [0, splitY, H];

    let flaskCavity = null;

    keys2x4.forEach((outKey, idx) => {
      if (scene.textures.exists(outKey)) return;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const sx = colBounds[col];
      const sy = rowBounds[row];
      const cw = colBounds[col + 1] - sx;
      const ch = rowBounds[row + 1] - sy;

      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const g = c.getContext('2d');
      g.drawImage(srcImg, sx, sy, cw, ch, 0, 0, cw, ch);

      const imgData = g.getImageData(0, 0, cw, ch);
      const data = imgData.data;

      // 2a. Edge-connected BFS Flood-Fill
      const visited = new Uint8Array(cw * ch);
      const queue = new Int32Array(cw * ch);
      let head = 0;
      let tail = 0;

      const pushIfBg = (x, y) => {
        if (x < 0 || x >= cw || y < 0 || y >= ch) return;
        const p = y * cw + x;
        if (visited[p]) return;
        const i = p * 4;
        if (data[i + 3] < 20 || (data[i] > 236 && data[i + 1] > 236 && data[i + 2] > 236)) {
          visited[p] = 1;
          queue[tail++] = p;
        }
      };

      for (let x = 0; x < cw; x++) {
        pushIfBg(x, 0);
        pushIfBg(x, ch - 1);
      }
      for (let y = 0; y < ch; y++) {
        pushIfBg(0, y);
        pushIfBg(cw - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        data[p * 4 + 3] = 0;
        const x = p % cw;
        const y = (p - x) / cw;
        pushIfBg(x + 1, y);
        pushIfBg(x - 1, y);
        pushIfBg(x, y + 1);
        pushIfBg(x, y - 1);
      }

      // 1px edge anti-alias feathering
      for (let y = 1; y < ch - 1; y++) {
        for (let x = 1; x < cw - 1; x++) {
          const p = y * cw + x;
          const i = p * 4;
          if (data[i + 3] === 0) continue;
          const touchTrans =
            data[(p - 1) * 4 + 3] === 0 ||
            data[(p + 1) * 4 + 3] === 0 ||
            data[(p - cw) * 4 + 3] === 0 ||
            data[(p + cw) * 4 + 3] === 0;
          if (touchTrans && data[i] > 215 && data[i + 1] > 215 && data[i + 2] > 215) {
            data[i + 3] = Math.round(data[i + 3] * 0.42);
          }
        }
      }

      // 3. Connected Components Filter (delete stray fragments < 5% of largest component)
      const compId = new Int32Array(cw * ch);
      const compSizes = [0];
      const bfsQ = new Int32Array(cw * ch);
      let nextComp = 1;
      let maxCompSize = 0;

      for (let p = 0; p < cw * ch; p++) {
        if (compId[p] !== 0 || data[p * 4 + 3] <= 20) continue;
        const cid = nextComp++;
        let qh = 0;
        let qt = 0;
        compId[p] = cid;
        bfsQ[qt++] = p;
        while (qh < qt) {
          const cur = bfsQ[qh++];
          const cx = cur % cw;
          const cy = (cur - cx) / cw;
          const nbrs = [
            cx > 0 ? cur - 1 : -1,
            cx < cw - 1 ? cur + 1 : -1,
            cy > 0 ? cur - cw : -1,
            cy < ch - 1 ? cur + cw : -1
          ];
          for (let k = 0; k < 4; k++) {
            const np = nbrs[k];
            if (np >= 0 && compId[np] === 0 && data[np * 4 + 3] > 20) {
              compId[np] = cid;
              bfsQ[qt++] = np;
            }
          }
        }
        compSizes[cid] = qt;
        if (qt > maxCompSize) maxCompSize = qt;
      }

      const minKeep = maxCompSize * 0.05;
      let minX = cw;
      let minY = ch;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const p = y * cw + x;
          const cid = compId[p];
          if (cid === 0 || compSizes[cid] < minKeep) {
            data[p * 4 + 3] = 0;
          } else if (data[p * 4 + 3] > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      g.putImageData(imgData, 0, 0);

      // 4. Auto-Trim with 2px padding
      const pad = 2;
      const tx0 = Math.max(0, minX - pad);
      const ty0 = Math.max(0, minY - pad);
      const tw = Math.max(16, Math.min(cw - tx0, maxX - minX + 1 + pad * 2));
      const th = Math.max(16, Math.min(ch - ty0, maxY - minY + 1 + pad * 2));

      const trimC = document.createElement('canvas');
      trimC.width = tw;
      trimC.height = th;
      const trimG = trimC.getContext('2d');
      trimG.drawImage(c, tx0, ty0, tw, th, 0, 0, tw, th);

      // Special Step A & B for prop_flask: Realistic Transparent Glass + Exact Inner Cavity Scan
      if (isPropSheet && outKey === 'prop_flask') {
        const fData = trimG.getImageData(0, 0, tw, th);
        const fd = fData.data;

        // Scan inner cavity per row BEFORE lowering glass opacity
        const innerLeft = new Int16Array(th).fill(-1);
        const innerRight = new Int16Array(th).fill(-1);
        let cavTop = Math.floor(th * 0.16);
        let cavBottom = th - 6;

        for (let y = cavTop; y <= cavBottom; y++) {
          // Find outer left dark ink wall, then exit ink into bright interior
          let x = 0;
          while (x < tw && fd[(y * tw + x) * 4 + 3] < 80) x++;
          while (x < tw) {
            const i = (y * tw + x) * 4;
            const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
            if (fd[i + 3] > 140 && lum < 165) break;
            x++;
          }
          while (x < tw) {
            const i = (y * tw + x) * 4;
            const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
            if (lum >= 165 || fd[i + 3] < 140) break;
            x++;
          }
          const leftIn = x + 3;

          // Find outer right dark ink wall, then exit ink into bright interior
          let rx = tw - 1;
          while (rx >= 0 && fd[(y * tw + rx) * 4 + 3] < 80) rx--;
          while (rx >= 0) {
            const i = (y * tw + rx) * 4;
            const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
            if (fd[i + 3] > 140 && lum < 165) break;
            rx--;
          }
          while (rx >= 0) {
            const i = (y * tw + rx) * 4;
            const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
            if (lum >= 165 || fd[i + 3] < 140) break;
            rx--;
          }
          const rightIn = rx - 3;

          if (rightIn > leftIn + 14) {
            innerLeft[y] = leftIn;
            innerRight[y] = rightIn;
          }
        }

        // Convert bright interior glass pixels to translucent glass (alpha 28..75) while keeping ink & ticks crisp
        for (let p = 0; p < tw * th; p++) {
          const i = p * 4;
          if (fd[i + 3] === 0) continue;
          const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
          if (lum < 155) {
            fd[i + 3] = 255;
          } else {
            const t = Math.min(1, (lum - 155) / 100);
            fd[i + 3] = Math.round(28 + t * 47);
          }
        }
        trimG.putImageData(fData, 0, 0);

        // Trim top/bottom valid cavity bounds
        while (cavTop < cavBottom && innerLeft[cavTop] < 0) cavTop++;
        while (cavBottom > cavTop && innerLeft[cavBottom] < 0) cavBottom--;
        flaskCavity = { w: tw, h: th, innerLeft, innerRight, topY: cavTop + 6, bottomY: cavBottom - 4 };
      }

      scene.textures.addCanvas(outKey, trimC);
    });

    return flaskCavity;
  }

  // Cozy Parchment / Raised Wood Button (NO #000 black borders)
  function makeCozyButton(scene, x, y, w, h, label, bgColor, textColor, onClick, borderColor = 0xa67c52) {
    const container = scene.add.container(x, y);
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x1c1008, 0.24);
    shadow.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, 10);

    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.lineStyle(1.5, borderColor, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const txt = scene.add
      .text(0, 0, label, {
        fontFamily: '"Be Vietnam Pro", sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        color: textColor
      })
      .setOrigin(0.5);

    container.add([shadow, bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 110, ease: 'Sine.easeOut' });
    });
    container.on('pointerout', () => {
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110, ease: 'Sine.easeOut' });
    });
    container.on('pointerdown', () => {
      scene.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
      if (onClick) onClick();
    });
    container.setLabel = (newLbl) => txt.setText(newLbl);
    return container;
  }

  // Circular Icon Button (Music / SFX / Fullscreen)
  function makeCircleIconButton(scene, x, y, drawIconFn, onClick) {
    const c = scene.add.container(x, y);
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x1c1008, 0.24);
    shadow.fillCircle(0, 2, 18);

    const bg = scene.add.graphics();
    const iconG = scene.add.graphics();

    const redraw = (active = true) => {
      bg.clear();
      bg.fillStyle(active ? 0xf5ecdc : 0xd9d0c1, active ? 0.96 : 0.72);
      bg.lineStyle(1.5, 0xa67c52, 0.95);
      bg.fillCircle(0, 0, 18);
      bg.strokeCircle(0, 0, 18);
      iconG.clear();
      drawIconFn(iconG, active);
    };
    redraw(true);

    c.add([shadow, bg, iconG]);
    c.setSize(38, 38);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => scene.tweens.add({ targets: c, scaleX: 1.08, scaleY: 1.08, duration: 100 }));
    c.on('pointerout', () => scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 100 }));
    c.on('pointerdown', () => {
      scene.tweens.add({ targets: c, scaleX: 0.92, scaleY: 0.92, duration: 70, yoyo: true });
      if (onClick) onClick(redraw);
    });
    c.setActiveState = redraw;
    return c;
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
        </div>
      `;

      const frameEl = container.querySelector('#peelLabFrame');
      const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
          if (frameEl && frameEl.requestFullscreen) frameEl.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      };

      // ===== BOOT SCENE: PRELOAD, BFS FLOOD-FILL & PROCEDURAL TEXTURES =====
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
          const cavity = sliceSpriteSheetClean(
            this,
            'props_raw',
            [
              'prop_flask',
              'prop_spray',
              'prop_vinegar',
              'prop_water',
              'prop_orange',
              'prop_cinnamon',
              'prop_mint',
              'prop_cloth'
            ],
            true
          );
          if (cavity) {
            this.registry.set('flaskCavity', cavity);
          }
          sliceSpriteSheetClean(
            this,
            'customers_raw',
            [
              'cust_0_sad',
              'cust_1_sad',
              'cust_2_sad',
              'cust_3_sad',
              'cust_0_happy',
              'cust_1_happy',
              'cust_2_happy',
              'cust_3_happy'
            ],
            false
          );

          // Warm golden sunlit dust particle
          const g1 = this.make.graphics({ x: 0, y: 0, add: false });
          g1.fillStyle(0xf7d996, 1);
          g1.fillCircle(8, 8, 8);
          g1.generateTexture('dust_dot', 16, 16);

          // Golden essential oil particle
          const g2 = this.make.graphics({ x: 0, y: 0, add: false });
          g2.fillStyle(0xd98a2b, 1);
          g2.fillCircle(8, 8, 8);
          g2.generateTexture('oil_dot', 16, 16);

          // Soft radial-gradient elliptical shadow (rgba(45, 25, 10, 0.34) -> transparent)
          const shC = document.createElement('canvas');
          shC.width = 160;
          shC.height = 48;
          const sg = shC.getContext('2d');
          sg.save();
          sg.translate(80, 24);
          sg.scale(1, 0.3);
          const rad = sg.createRadialGradient(0, 0, 8, 0, 0, 76);
          rad.addColorStop(0, 'rgba(45, 25, 10, 0.36)');
          rad.addColorStop(0.6, 'rgba(45, 25, 10, 0.16)');
          rad.addColorStop(1, 'rgba(45, 25, 10, 0)');
          sg.fillStyle = rad;
          sg.beginPath();
          sg.arc(0, 0, 76, 0, Math.PI * 2);
          sg.fill();
          sg.restore();
          this.textures.addCanvas('soft_shadow', shC);

          // Wipe brush for RenderTexture.erase()
          const g3 = this.make.graphics({ x: 0, y: 0, add: false });
          g3.fillStyle(0xffffff, 1);
          g3.fillCircle(32, 32, 32);
          g3.generateTexture('wipe_brush', 64, 64);

          this.scene.start('ShopScene', { mode: 'title' });
        }
      }

      // ===== SHOP SCENE =====
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

          // 20 warm golden sunlit dust motes drifting across the arched window
          this.add.particles(0, 0, 'dust_dot', {
            x: { min: 410, max: 870 },
            y: { min: 70, max: 460 },
            lifespan: 5800,
            speedY: { min: -10, max: 6 },
            speedX: { min: -8, max: 8 },
            scale: { start: 0.22, end: 0.05 },
            alpha: { start: 0.45, end: 0 },
            maxParticles: 22,
            frequency: 260
          });

          this.customerNum = this.entryData.customerNum || 1;
          this.dayCoins = this.entryData.dayCoins || 0;
          this.currentOrder = this.entryData.order || ORDERS[(saveData.day + this.customerNum - 2) % ORDERS.length];
          this.phase = 'brew';
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

          // Customer sprite behind wooden counter (y=520 lip mask)
          const custKey = `cust_${this.currentOrder.custIdx}_sad`;
          this.customerSprite = this.add.image(640, 392, custKey).setDisplaySize(236, 262).setAlpha(0);
          const maskG = this.make.graphics({ add: false });
          maskG.fillStyle(0xffffff);
          maskG.fillRect(260, 70, 760, 452);
          this.customerSprite.setMask(maskG.createGeometryMask());

          this.createCozyHud();
          this.createWorkbenchProps();
          this.createSpeechBubble();
          this.createModalContainer();

          if (this.entryData.mode === 'title') {
            this.phase = 'title';
            this.setPhVisible(false);
            this.showTitleOverlay();
          } else if (this.entryData.mode === 'cleaned') {
            this.phase = 'result';
            this.setPhVisible(false);
            this.handleCustomerResult(this.entryData);
          } else {
            this.setPhVisible(true);
            this.startCustomerVisit();
          }
        }

        createCozyHud() {
          const bar = this.add.container(0, 0).setDepth(30);

          // Top-left unified warm dark-wood status bar
          const leftShadow = this.add.graphics();
          leftShadow.fillStyle(0x1c1008, 0.25);
          leftShadow.fillRoundedRect(20, 17, 360, 40, 12);

          const leftBg = this.add.graphics();
          leftBg.fillStyle(0x261910, 0.84);
          leftBg.lineStyle(1.5, 0xa67c52, 0.9);
          leftBg.fillRoundedRect(20, 14, 360, 40, 12);
          leftBg.strokeRoundedRect(20, 14, 360, 40, 12);

          this.hudDayCustTxt = this.add.text(36, 25, `Ngày ${saveData.day}  •  Khách ${this.customerNum}/3`, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '13.5px',
            fontWeight: '600',
            color: '#F5ECDC'
          });

          // Bronze-gold coin icon
          const coinIcon = this.add.graphics();
          coinIcon.fillStyle(0xd98a2b, 1);
          coinIcon.lineStyle(1.5, 0xf5ecdc, 0.85);
          coinIcon.fillCircle(232, 34, 9);
          coinIcon.strokeCircle(232, 34, 9);

          this.hudCoinTxt = this.add.text(248, 25, `${saveData.coins} Xu`, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '13.5px',
            fontWeight: '700',
            color: '#F7D996'
          });

          // Combo pill (ONLY visible when combo >= 2)
          this.comboContainer = this.add.container(435, 34).setVisible(saveData.combo >= 2);
          const comboBg = this.add.graphics();
          comboBg.fillStyle(0xa85432, 0.96);
          comboBg.lineStyle(1.5, 0xf5ecdc, 0.7);
          comboBg.fillRoundedRect(-44, -16, 88, 32, 10);
          comboBg.strokeRoundedRect(-44, -16, 88, 32, 10);
          this.hudComboTxt = this.add
            .text(0, 0, `Combo x${saveData.combo}`, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#FAF4E6'
            })
            .setOrigin(0.5);
          this.comboContainer.add([comboBg, this.hudComboTxt]);

          bar.add([leftShadow, leftBg, this.hudDayCustTxt, coinIcon, this.hudCoinTxt, this.comboContainer]);

          // Top-right cluster: 2 parchment buttons + 3 circular icon buttons
          this.recipeBtn = makeCozyButton(this, 900, 34, 128, 36, 'Sổ công thức', 0xf5ecdc, '#3A2516', () => {
            soundEngine.playClick();
            this.openRecipeModal();
          });
          this.upgradeBtn = makeCozyButton(this, 1036, 34, 118, 36, 'Nâng cấp', 0xf5ecdc, '#3A2516', () => {
            soundEngine.playClick();
            this.openUpgradeModal();
          });

          // 1. Music Note icon
          this.musicIconBtn = makeCircleIconButton(
            this,
            1132,
            34,
            (g, active) => {
              g.lineStyle(2, 0x3a2516, active ? 1 : 0.45);
              g.fillStyle(0x3a2516, active ? 1 : 0.45);
              g.fillCircle(-3, 5, 3.2);
              g.fillCircle(5, 3, 3.2);
              g.beginPath();
              g.moveTo(0, 5);
              g.lineTo(0, -6);
              g.lineTo(8, -8);
              g.lineTo(8, 3);
              g.strokePath();
              if (!active) {
                g.lineStyle(2, 0xa85432, 1);
                g.lineBetween(-8, -8, 8, 8);
              }
            },
            (redraw) => {
              soundEngine.playClick();
              saveData.musicEnabled = !saveData.musicEnabled;
              writeSave(saveData);
              if (saveData.musicEnabled) soundEngine.startMusic();
              else soundEngine.stopMusic();
              redraw(saveData.musicEnabled);
            }
          );
          this.musicIconBtn.setActiveState(saveData.musicEnabled);

          // 2. Speaker SFX icon
          this.sfxIconBtn = makeCircleIconButton(
            this,
            1178,
            34,
            (g, active) => {
              g.fillStyle(0x3a2516, active ? 1 : 0.45);
              g.fillRect(-7, -3, 4, 6);
              g.fillTriangle(-3, -3, 3, -7, 3, 7);
              g.fillTriangle(-3, 3, -3, -3, 3, 7);
              if (active) {
                g.lineStyle(1.8, 0x3a2516, 1);
                g.beginPath();
                g.arc(4, 0, 5, -0.7, 0.7);
                g.strokePath();
              } else {
                g.lineStyle(2, 0xa85432, 1);
                g.lineBetween(-8, -8, 8, 8);
              }
            },
            (redraw) => {
              saveData.sfxEnabled = !saveData.sfxEnabled;
              writeSave(saveData);
              if (saveData.sfxEnabled) soundEngine.playClick();
              redraw(saveData.sfxEnabled);
            }
          );
          this.sfxIconBtn.setActiveState(saveData.sfxEnabled);

          // 3. Fullscreen icon
          this.fsIconBtn = makeCircleIconButton(
            this,
            1224,
            34,
            (g) => {
              g.lineStyle(2, 0x3a2516, 1);
              // 4 corner brackets
              g.lineBetween(-7, -3, -7, -7);
              g.lineBetween(-7, -7, -3, -7);
              g.lineBetween(3, -7, 7, -7);
              g.lineBetween(7, -7, 7, -3);
              g.lineBetween(-7, 3, -7, 7);
              g.lineBetween(-7, 7, -3, 7);
              g.lineBetween(3, 7, 7, 7);
              g.lineBetween(7, 7, 7, 3);
            },
            () => {
              soundEngine.playClick();
              toggleFullscreen();
            }
          );

          bar.add([this.recipeBtn, this.upgradeBtn, this.musicIconBtn, this.sfxIconBtn, this.fsIconBtn]);
        }

        createSpeechBubble() {
          this.bubble = this.add.container(940, 224).setDepth(20).setAlpha(0);
          const shadow = this.add.graphics();
          shadow.fillStyle(0x1c1008, 0.2);
          shadow.fillRoundedRect(-185, -104, 370, 206, 14);

          const bg = this.add.graphics();
          bg.fillStyle(0xfaf4e6, 0.97);
          bg.lineStyle(2, 0xa67c52, 0.95);
          bg.fillRoundedRect(-185, -108, 370, 206, 14);
          bg.strokeRoundedRect(-185, -108, 370, 206, 14);

          this.bubbleSpeaker = this.add.text(-165, -92, '', {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '21px',
            fontWeight: '700',
            color: '#A85432'
          });
          this.bubbleText = this.add.text(-165, -62, '', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '13.5px',
            color: '#3A2516',
            wordWrap: { width: 330 },
            lineSpacing: 5
          });
          this.bubbleHint = this.add.text(-165, 44, '', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            color: '#162A22'
          });

          const pTrack = this.add.graphics();
          pTrack.fillStyle(0xe5dccb, 1);
          pTrack.fillRoundedRect(-165, 72, 330, 9, 4.5);
          this.patienceBar = this.add.graphics();

          this.bubble.add([shadow, bg, this.bubbleSpeaker, this.bubbleText, this.bubbleHint, pTrack, this.patienceBar]);
        }

        makeCreamLabel(x, y, text, hintText) {
          const c = this.add.container(x, y).setDepth(15);
          const showInitHint = saveData.day === 1 && this.customerNum === 1;
          const w = Math.max(92, text.length * 8.5 + 24);
          const h = showInitHint ? 38 : 26;
          const bg = this.add.graphics();
          bg.fillStyle(0xf8f1e3, 0.94);
          bg.lineStyle(1, 0xc5a880, 0.95);
          bg.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
          bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);

          const t = this.add
            .text(0, showInitHint ? -6 : 0, text, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#3A2516'
            })
            .setOrigin(0.5);

          const hint = this.add
            .text(0, 10, hintText, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '10px',
              fontWeight: '500',
              color: '#7A5C43'
            })
            .setOrigin(0.5)
            .setAlpha(showInitHint ? 1 : 0);

          c.add([bg, t, hint]);
          c.hintObj = hint;
          c.titleObj = t;
          c.bgObj = bg;
          c.lblW = w;
          c.setHoverHint = (hovered) => {
            if (showInitHint) return;
            const nextH = hovered ? 38 : 26;
            bg.clear();
            bg.fillStyle(0xf8f1e3, 0.94);
            bg.lineStyle(1, 0xc5a880, 0.95);
            bg.fillRoundedRect(-w / 2, -nextH / 2, w, nextH, 7);
            bg.strokeRoundedRect(-w / 2, -nextH / 2, w, nextH, 7);
            t.setY(hovered ? -6 : 0);
            hint.setAlpha(hovered ? 1 : 0);
          };
          return c;
        }

        createWorkbenchProps() {
          // Center Flask (~17% larger) + Exact Inner Cavity Liquid CanvasTexture
          this.add.image(640, 650, 'soft_shadow').setDisplaySize(176, 36).setDepth(10);
          this.flaskCavity = this.registry.get('flaskCavity');
          this.floatingBits = [];
          this.bubbles = [];

          if (this.flaskCavity) {
            const liqKey = `flask_liq_${Date.now()}`;
            this.liquidCanvasTex = this.textures.createCanvas(liqKey, this.flaskCavity.w, this.flaskCavity.h);
            this.liquidSprite = this.add
              .image(640, 562, liqKey)
              .setDisplaySize(192, 214)
              .setDepth(11);
          }

          this.flaskSprite = this.add.image(640, 562, 'prop_flask').setDisplaySize(192, 214).setDepth(12);

          // Refined Brass & Glass pH Pill Tube (aligned right beside flask)
          this.phGraphics = this.add.graphics().setDepth(13);
          this.phLabelBg = this.add.graphics().setDepth(13);
          this.phLabelTxt = this.add
            .text(778, 466, 'pH 7.0', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#3A2516'
            })
            .setOrigin(0.5)
            .setDepth(14);

          this.pourStreamG = this.add.graphics().setDepth(14);
          this.swirlRingG = this.add.graphics().setDepth(15);
          this.swirlTxt = this.add
            .text(640, 444, '', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#3A2516',
              backgroundColor: '#FAF4E6',
              padding: { x: 10, y: 4 }
            })
            .setOrigin(0.5)
            .setDepth(16)
            .setAlpha(0);

          // Left Solids: Orange, Cinnamon, Mint (~16% larger, higher on oak counter)
          const solidDefs = [
            { id: 'orange', key: 'prop_orange', label: 'Vỏ cam', x: 150, y: 586, homeX: 150, homeY: 586, pitch: 360 },
            { id: 'cinnamon', key: 'prop_cinnamon', label: 'Quế', x: 300, y: 586, homeX: 300, homeY: 586, pitch: 280 },
            { id: 'mint', key: 'prop_mint', label: 'Lá bạc hà', x: 450, y: 586, homeX: 450, homeY: 586, pitch: 430 }
          ];
          this.solidSprites = [];
          solidDefs.forEach((def) => {
            this.add.image(def.x, def.y + 44, 'soft_shadow').setDisplaySize(134, 26).setDepth(10);
            const sp = this.add.image(def.x, def.y, def.key).setDisplaySize(140, 140).setDepth(14);
            sp.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(sp);
            const lbl = this.makeCreamLabel(def.x, def.y + 74, def.label, 'Kéo thả');

            sp.on('pointerover', () => {
              if (this.phase !== 'brew') return;
              this.tweens.add({ targets: sp, scaleX: sp.scaleX * 1.07, scaleY: sp.scaleY * 1.07, duration: 100 });
              lbl.setHoverHint(true);
            });
            sp.on('pointerout', () => {
              sp.setDisplaySize(140, 140);
              lbl.setHoverHint(false);
            });
            sp.on('drag', (_p, dx, dy) => {
              if (this.phase !== 'brew') return;
              sp.x = dx;
              sp.y = dy;
              sp.setDepth(22);
            });
            sp.on('dragend', () => {
              if (this.phase === 'brew' && Phaser.Math.Distance.Between(sp.x, sp.y, 640, 515) < 125) {
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

          // Right Liquids: Vinegar, Water (~16% larger, higher on oak counter)
          const liqDefs = [
            { id: 'vinegar', key: 'prop_vinegar', label: 'Giấm trắng', x: 920, y: 566, homeX: 920, homeY: 566 },
            { id: 'water', key: 'prop_water', label: 'Nước', x: 1095, y: 566, homeX: 1095, homeY: 566 }
          ];
          liqDefs.forEach((def) => {
            this.add.image(def.x, def.y + 62, 'soft_shadow').setDisplaySize(124, 26).setDepth(10);
            const sp = this.add.image(def.x, def.y, def.key).setDisplaySize(144, 168).setDepth(14);
            sp.setInteractive({ useHandCursor: true });
            const lbl = this.makeCreamLabel(def.x, def.y + 92, def.label, 'Nhấn giữ');

            sp.on('pointerover', () => {
              if (this.phase !== 'brew') return;
              lbl.setHoverHint(true);
            });
            sp.on('pointerout', () => {
              lbl.setHoverHint(false);
            });
            sp.on('pointerdown', () => {
              if (this.phase !== 'brew') return;
              this.pouringId = def.id;
              this.pouringSprite = sp;
              soundEngine.startPour();
              this.tweens.add({
                targets: sp,
                x: 730,
                y: 432,
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

          // Action buttons placed cleanly below flask
          this.swirlActionBtn = makeCozyButton(this, 685, 686, 178, 36, 'Khuấy chiết xuất →', 0xa85432, '#FAF4E6', () => {
            if (this.phase === 'brew' && this.liquidMl >= 90) {
              soundEngine.playClick();
              this.enterSwirlPhase();
            }
          });
          this.swirlActionBtn.setDepth(18).setVisible(false);

          this.resetFlaskBtn = makeCozyButton(this, 535, 686, 104, 34, 'Đổ làm lại', 0xf8f1e3, '#3A2516', () => {
            if (this.phase === 'brew') {
              soundEngine.playClick();
              this.resetFlask();
            }
          });
          this.resetFlaskBtn.setDepth(18).setVisible(false);
        }

        setPhVisible(visible) {
          this.phVisible = visible;
          if (this.phGraphics) this.phGraphics.setVisible(visible);
          if (this.phLabelBg) this.phLabelBg.setVisible(visible);
          if (this.phLabelTxt) this.phLabelTxt.setVisible(visible);
        }

        addSolid(id, pitch) {
          this.solids[id] = (this.solids[id] || 0) + 1;
          this.liquidMl = Math.min(220, this.liquidMl + 12);
          this.waveAmp = 5.5;
          soundEngine.playPlop(pitch);
          this.recomputePh();

          const bitCol = id === 'orange' ? '#E59228' : id === 'mint' ? '#4A7C59' : '#9B4D2B';
          for (let i = 0; i < 4; i++) {
            this.floatingBits.push({
              xFrac: 0.28 + Math.random() * 0.44,
              yOffset: Math.random() * 28,
              r: 3 + Math.random() * 2.5,
              color: bitCol,
              bobPhase: Math.random() * Math.PI * 2
            });
          }
          this.tweens.add({
            targets: this.flaskSprite,
            scaleX: this.flaskSprite.scaleX * 1.06,
            scaleY: this.flaskSprite.scaleY * 0.94,
            duration: 90,
            yoyo: true
          });
          this.add.particles(640, 495, 'oil_dot', {
            speed: { min: 40, max: 120 },
            angle: { min: 220, max: 320 },
            scale: { start: 0.45, end: 0 },
            lifespan: 450,
            quantity: 10,
            emitting: false
          }).explode(10, 640, 500);
        }

        resetFlask() {
          this.liquidMl = 0;
          this.vinegarMl = 0;
          this.waterMl = 0;
          this.solids = { orange: 0, cinnamon: 0, mint: 0 };
          this.floatingBits = [];
          this.bubbles = [];
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
            const ang = Phaser.Math.Angle.Between(640, 560, p.x, p.y);
            if (this.swirlAnglePrev !== null) {
              const delta = Phaser.Math.Angle.Wrap(ang - this.swirlAnglePrev);
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
          this.setPhVisible(true);
          soundEngine.playDoorbell();
          this.customerSprite.setTexture(`cust_${this.currentOrder.custIdx}_sad`).setPosition(470, 396).setAlpha(0);
          this.tweens.add({
            targets: this.customerSprite,
            x: 610,
            alpha: 1,
            duration: 460,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: this.customerSprite,
                scaleY: this.customerSprite.scaleY * 1.018,
                duration: 1350,
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
          this.setPhVisible(false);

          // Happy customer stands clearly in the LEFT half of the arched window
          this.customerSprite.setTexture(`cust_${ord.custIdx}_happy`).setPosition(495, 392).setAlpha(1);
          this.tweens.add({
            targets: this.customerSprite,
            y: 374,
            duration: 240,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: this.customerSprite,
                scaleY: this.customerSprite.scaleY * 1.02,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
              });
            }
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

          this.hudCoinTxt.setText(`${saveData.coins} Xu`);
          this.comboContainer.setVisible(saveData.combo >= 2);
          this.hudComboTxt.setText(`Combo x${saveData.combo}`);

          // Golden essential oil sparkles around happy customer
          this.add.particles(495, 310, 'oil_dot', {
            speed: { min: 65, max: 185 },
            scale: { start: 0.55, end: 0 },
            lifespan: 760,
            quantity: 24,
            emitting: false
          }).explode(24, 495, 310);

          // Completion Evaluation Slip on the RIGHT half (never covers customer!)
          const nextDayCoins = (res.dayCoins || 0) + earned;
          const card = this.add.container(895, 340).setDepth(45);
          const shadow = this.add.graphics();
          shadow.fillStyle(0x1c1008, 0.28);
          shadow.fillRoundedRect(-215, -150, 430, 310, 16);

          const bg = this.add.graphics();
          bg.fillStyle(0xfaf4e6, 0.99);
          bg.lineStyle(2, 0xa67c52, 1);
          bg.fillRoundedRect(-215, -155, 430, 310, 16);
          bg.strokeRoundedRect(-215, -155, 430, 310, 16);
          bg.lineStyle(1, 0xc5a880, 0.75);
          bg.strokeRoundedRect(-207, -147, 414, 294, 12);

          // Wax seal stamp in top-right corner of slip
          const sealColor = q.rank === 'S' ? 0x162a22 : q.rank === 'A' ? 0x4a7c59 : 0xa85432;
          const seal = this.add.graphics();
          seal.fillStyle(sealColor, 1);
          seal.fillCircle(165, -108, 26);
          seal.lineStyle(1.5, 0xfaf4e6, 0.7);
          seal.strokeCircle(165, -108, 21);
          const sealTxt = this.add
            .text(165, -108, q.rank, {
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '26px',
              fontWeight: '700',
              color: '#FAF4E6'
            })
            .setOrigin(0.5);

          // 3 golden stars popping sequentially
          const starCount = q.rank === 'S' ? 3 : q.rank === 'A' ? 2 : 1;
          for (let i = 0; i < 3; i++) {
            const sx = -155 + i * 32;
            const sy = -112;
            const sg = this.add.graphics();
            const lit = i < starCount;
            sg.fillStyle(lit ? 0xd98a2b : 0xdcd4c4, 1);
            sg.fillCircle(sx, sy, 10);
            sg.setScale(0.2);
            this.tweens.add({
              targets: sg,
              scaleX: 1,
              scaleY: 1,
              duration: 240,
              delay: 140 + i * 130,
              ease: 'Back.easeOut'
            });
            card.add(sg);
          }

          const tRecipe = this.add.text(-175, -78, ord.recipeName, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '26px',
            fontWeight: '700',
            color: '#162A22'
          });

          const coinRewardTxt = this.add.text(-175, -42, '+0 Xu Tinh Dầu', {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '16px',
            fontWeight: '800',
            color: '#A85432'
          });
          this.tweens.addCounter({
            from: 0,
            to: earned,
            duration: 600,
            onUpdate: (tw) => {
              coinRewardTxt.setText(`+${Math.round(tw.getValue())} Xu Tinh Dầu`);
            }
          });

          const tNote = this.add.text(-175, -6, q.reason, {
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: '13px',
            color: '#52463A',
            wordWrap: { width: 350 },
            lineSpacing: 5
          });

          const isEndOfDay = (res.customerNum || 1) >= 3;
          const nextBtn = makeCozyButton(
            this,
            0,
            106,
            235,
            44,
            isEndOfDay ? 'Xem Tổng Kết Ngày →' : 'Khách tiếp theo →',
            0x162a22,
            '#FAF4E6',
            () => {
              soundEngine.playClick();
              card.destroy();
              if (isEndOfDay) {
                this.showDaySummary(nextDayCoins);
              } else {
                this.scene.restart({ mode: 'play', customerNum: (res.customerNum || 1) + 1, dayCoins: nextDayCoins });
              }
            },
            0x162a22
          );

          card.add([shadow, bg, seal, sealTxt, tRecipe, coinRewardTxt, tNote, nextBtn]);
        }

        showDaySummary(dayCoins) {
          this.setPhVisible(false);
          const card = this.add.container(640, 360).setDepth(50);
          const shadow = this.add.graphics();
          shadow.fillStyle(0x1c1008, 0.3);
          shadow.fillRoundedRect(-260, -150, 520, 310, 16);

          const bg = this.add.graphics();
          bg.fillStyle(0xfaf4e6, 0.99);
          bg.lineStyle(2.5, 0xa67c52, 1);
          bg.fillRoundedRect(-260, -155, 520, 310, 16);
          bg.strokeRoundedRect(-260, -155, 520, 310, 16);

          const t1 = this.add
            .text(0, -108, `TỔNG KẾT NGÀY ${saveData.day}`, {
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '34px',
              fontWeight: '700',
              color: '#162A22'
            })
            .setOrigin(0.5);
          const t2 = this.add
            .text(0, -48, `Doanh thu hôm nay: +${dayCoins} Xu Tinh Dầu\nTổng quỹ tiệm hiện có: ${saveData.coins} Xu`, {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '15.5px',
              color: '#52463A',
              align: 'center',
              lineSpacing: 8
            })
            .setOrigin(0.5);

          const upgBtn = makeCozyButton(this, -118, 68, 200, 44, 'Nâng cấp Tiệm', 0xf5ecdc, '#3A2516', () => {
            soundEngine.playClick();
            this.openUpgradeModal();
          });
          const nextDayBtn = makeCozyButton(
            this,
            118,
            68,
            210,
            44,
            `Mở Ngày ${saveData.day + 1} →`,
            0x162a22,
            '#FAF4E6',
            () => {
              soundEngine.playClick();
              saveData.day += 1;
              writeSave(saveData);
              card.destroy();
              this.scene.restart({ mode: 'play', customerNum: 1, dayCoins: 0 });
            },
            0x162a22
          );

          card.add([shadow, bg, t1, t2, upgBtn, nextDayBtn]);
        }

        showTitleOverlay() {
          const ov = this.add.container(640, 360).setDepth(55);
          const dim = this.add.rectangle(0, 0, 1280, 720, 0x162a22, 0.42);
          const shadow = this.add.graphics();
          shadow.fillStyle(0x1c1008, 0.28);
          shadow.fillRoundedRect(-270, -165, 540, 340, 18);

          const card = this.add.graphics();
          card.fillStyle(0xfaf4e6, 0.99);
          card.lineStyle(2.5, 0xa67c52, 1);
          card.fillRoundedRect(-270, -170, 540, 340, 18);
          card.strokeRoundedRect(-270, -170, 540, 340, 18);

          const ey = this.add
            .text(0, -125, 'PEELVERSE • BOTANICAL LAB GAME', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '12px',
              fontWeight: '700',
              color: '#A85432'
            })
            .setOrigin(0.5);
          const title = this.add
            .text(0, -78, 'PEEL LAB', {
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '52px',
              fontWeight: '700',
              color: '#162A22'
            })
            .setOrigin(0.5);
          const sub = this.add
            .text(0, -24, 'Tiệm Pha Chế Tinh Dầu Vỏ Cam\nKéo thả nguyên liệu • Khuấy chiết xuất • Xịt & lau sạch bề mặt', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '14.5px',
              color: '#52463A',
              align: 'center',
              lineSpacing: 6
            })
            .setOrigin(0.5);

          const openBtn = makeCozyButton(
            this,
            0,
            62,
            260,
            48,
            `Mở cửa Tiệm (Ngày ${saveData.day})`,
            0x162a22,
            '#FAF4E6',
            () => {
              soundEngine.ensure();
              soundEngine.playClick();
              soundEngine.startMusic();
              ov.destroy();
              this.startCustomerVisit();
            },
            0x162a22
          );
          const upgBtn = makeCozyButton(this, 0, 124, 210, 40, `Nâng cấp Tiệm (${saveData.coins} Xu)`, 0xf5ecdc, '#3A2516', () => {
            soundEngine.ensure();
            soundEngine.playClick();
            this.openUpgradeModal();
          });

          ov.add([dim, shadow, card, ey, title, sub, openBtn, upgBtn]);
        }

        createModalContainer() {
          this.modalGroup = this.add.container(640, 360).setDepth(70).setVisible(false);
        }

        openUpgradeModal() {
          this.modalGroup.removeAll(true);
          const dim = this.add.rectangle(0, 0, 1280, 720, 0x162a22, 0.55).setInteractive();
          const bg = this.add.graphics();
          bg.fillStyle(0xfaf4e6, 1);
          bg.lineStyle(2.5, 0xa67c52, 1);
          bg.fillRoundedRect(-330, -230, 660, 460, 16);
          bg.strokeRoundedRect(-330, -230, 660, 460, 16);

          const title = this.add.text(-295, -200, `Cửa Hàng Nâng Cấp  •  Quỹ: ${saveData.coins} Xu`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#162A22'
          });
          const closeBtn = makeCozyButton(this, 275, -186, 70, 32, 'Đóng', 0x162a22, '#FAF4E6', () => {
            soundEngine.playClick();
            this.modalGroup.setVisible(false);
          }, 0x162a22);
          this.modalGroup.add([dim, bg, title, closeBtn]);

          UPGRADES.forEach((up, idx) => {
            const ry = -110 + idx * 82;
            const owned = Boolean(saveData.upgrades[up.id]);
            const rowBg = this.add.graphics();
            rowBg.fillStyle(0xffffff, 1);
            rowBg.lineStyle(1, 0xc5a880, 0.9);
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
              color: '#52463A'
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
                this.hudCoinTxt.setText(`${saveData.coins} Xu`);
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
          bg.fillStyle(0xfaf4e6, 1);
          bg.lineStyle(2.5, 0xa67c52, 1);
          bg.fillRoundedRect(-330, -240, 660, 480, 16);
          bg.strokeRoundedRect(-330, -240, 660, 480, 16);

          const title = this.add.text(-295, -210, `Sổ Công Thức (${saveData.unlockedRecipes.length}/${ORDERS.length})`, {
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#162A22'
          });
          const closeBtn = makeCozyButton(this, 275, -196, 70, 32, 'Đóng', 0x162a22, '#FAF4E6', () => {
            soundEngine.playClick();
            this.modalGroup.setVisible(false);
          }, 0x162a22);
          this.modalGroup.add([dim, bg, title, closeBtn]);

          ORDERS.forEach((ord, idx) => {
            const ry = -132 + idx * 72;
            const unlocked = saveData.unlockedRecipes.includes(ord.id);
            const rowBg = this.add.graphics();
            rowBg.fillStyle(unlocked ? 0xffffff : 0xede6d8, 1);
            rowBg.lineStyle(1, 0xc5a880, 0.85);
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
              color: '#52463A'
            });
            const badge = this.add
              .text(275, ry + 6, unlocked ? 'ĐÃ MỞ' : 'KHÓA', {
                fontFamily: '"Be Vietnam Pro", sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: unlocked ? '#162A22' : '#7A7D78'
              })
              .setOrigin(1, 0.5);
            this.modalGroup.add([rowBg, nm, ds, badge]);
          });
          this.modalGroup.setVisible(true);
        }

        update(_time, delta) {
          const dt = delta / 1000;
          this.wavePhase += dt * 5.2;
          this.waveAmp = Math.max(0.6, this.waveAmp * (1 - dt * 2.5));

          if (this.phase === 'brew' && this.pouringId && this.liquidMl < 220) {
            const add = 44 * dt;
            this.liquidMl = Math.min(220, this.liquidMl + add);
            if (this.pouringId === 'vinegar') this.vinegarMl += add;
            else this.waterMl += add;
            this.waveAmp = 5.5;
            this.recomputePh();

            this.pourStreamG.clear();
            this.pourStreamG.lineStyle(5, this.pouringId === 'vinegar' ? 0xefe7cf : 0xa5d5d2, 0.92);
            const pourCurve = new Phaser.Curves.QuadraticBezier(
              new Phaser.Math.Vector2(666, 448),
              new Phaser.Math.Vector2(648, 492),
              new Phaser.Math.Vector2(642, 608)
            );
            pourCurve.draw(this.pourStreamG, 18);
          }

          this.currentPh += (this.targetPh - this.currentPh) * Math.min(1, dt * 8);
          this.phLabelTxt.setText(`pH ${this.currentPh.toFixed(1)}`);

          // Dynamic liquid inside flask clipped strictly to inner cavity
          if (this.liquidCanvasTex && this.flaskCavity) {
            const cav = this.flaskCavity;
            const lctx = this.liquidCanvasTex.getContext();
            lctx.clearRect(0, 0, cav.w, cav.h);

            if (this.liquidMl > 0) {
              const ratio = Math.min(0.86, Math.max(0.06, this.liquidMl / 220));
              const cavSpan = Math.max(10, cav.bottomY - cav.topY);
              const surfaceBaseY = cav.bottomY - cavSpan * ratio;

              // Smooth color blend across active ingredients
              let rCol = 165, gCol = 213, bCol = 210; // aqua base
              if (this.solids.orange > 0 || this.solids.cinnamon > 0 || this.solids.mint > 0) {
                const wO = this.solids.orange * 1.2;
                const wM = this.solids.mint * 1.0;
                const wC = this.solids.cinnamon * 1.0;
                const wB = 0.35;
                const wSum = wO + wM + wC + wB;
                rCol = Math.round((wB * 165 + wO * 224 + wM * 74 + wC * 168) / wSum);
                gCol = Math.round((wB * 213 + wO * 142 + wM * 138 + wC * 84) / wSum);
                bCol = Math.round((wB * 210 + wO * 44 + wM * 94 + wC * 50) / wSum);
              }
              const fillRgb = `rgba(${rCol}, ${gCol}, ${bCol}, 0.84)`;
              const meniscusRgb = `rgba(${Math.min(255, rCol + 32)}, ${Math.min(255, gCol + 32)}, ${Math.min(255, bCol + 26)}, 0.72)`;

              lctx.save();
              lctx.beginPath();
              let started = false;
              for (let y = cav.topY; y <= cav.bottomY; y++) {
                const lx = cav.innerLeft[y];
                const rx = cav.innerRight[y];
                if (lx < 0 || rx <= lx) continue;
                if (!started) {
                  lctx.moveTo(lx, y);
                  started = true;
                } else {
                  lctx.lineTo(lx, y);
                }
              }
              for (let y = cav.bottomY; y >= cav.topY; y--) {
                const lx = cav.innerLeft[y];
                const rx = cav.innerRight[y];
                if (lx < 0 || rx <= lx) continue;
                lctx.lineTo(rx, y);
              }
              lctx.closePath();
              lctx.clip();

              // Liquid body with sine-wave top surface
              lctx.fillStyle = fillRgb;
              lctx.beginPath();
              lctx.moveTo(0, cav.bottomY + 2);
              for (let x = 0; x <= cav.w; x += 4) {
                const wy = Math.sin(this.wavePhase + x * 0.085) * this.waveAmp;
                lctx.lineTo(x, surfaceBaseY + wy);
              }
              lctx.lineTo(cav.w, cav.bottomY + 2);
              lctx.closePath();
              lctx.fill();

              // 3D meniscus ellipse at surface
              const surfRow = Math.max(cav.topY, Math.min(cav.bottomY, Math.round(surfaceBaseY)));
              const sL = cav.innerLeft[surfRow];
              const sR = cav.innerRight[surfRow];
              if (sL >= 0 && sR > sL + 4) {
                const cx = (sL + sR) * 0.5;
                const rx = (sR - sL) * 0.5;
                lctx.fillStyle = meniscusRgb;
                lctx.beginPath();
                lctx.ellipse(cx, surfaceBaseY, rx, 3.2, 0, 0, Math.PI * 2);
                lctx.fill();
              }

              // Floating solid ingredient bits
              for (let i = 0; i < this.floatingBits.length; i++) {
                const bit = this.floatingBits[i];
                const by = Math.min(cav.bottomY - 6, surfaceBaseY + 6 + bit.yOffset + Math.sin(this.wavePhase + bit.bobPhase) * 2.2);
                const rowY = Math.max(cav.topY, Math.min(cav.bottomY, Math.round(by)));
                const rowL = cav.innerLeft[rowY];
                const rowR = cav.innerRight[rowY];
                if (rowL >= 0 && rowR > rowL + 8) {
                  const bx = rowL + (rowR - rowL) * bit.xFrac;
                  lctx.fillStyle = bit.color;
                  lctx.beginPath();
                  lctx.arc(bx, by, bit.r, 0, Math.PI * 2);
                  lctx.fill();
                }
              }

              // Rising bubbles when pouring or swirling
              if ((this.pouringId || this.phase === 'swirl') && this.bubbles.length < 14 && Math.random() < 0.25) {
                this.bubbles.push({
                  xFrac: 0.22 + Math.random() * 0.56,
                  y: cav.bottomY - 4,
                  r: 1.5 + Math.random() * 2,
                  vy: 28 + Math.random() * 24
                });
              }
              lctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
              for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const bub = this.bubbles[i];
                bub.y -= bub.vy * dt;
                if (bub.y <= surfaceBaseY + 2) {
                  this.bubbles.splice(i, 1);
                  continue;
                }
                const bRow = Math.max(cav.topY, Math.min(cav.bottomY, Math.round(bub.y)));
                const bL = cav.innerLeft[bRow];
                const bR = cav.innerRight[bRow];
                if (bL >= 0 && bR > bL + 4) {
                  const bx = bL + (bR - bL) * bub.xFrac;
                  lctx.beginPath();
                  lctx.arc(bx, bub.y, bub.r, 0, Math.PI * 2);
                  lctx.fill();
                }
              }

              lctx.restore();
            }

            this.liquidCanvasTex.refresh();
          }

          // Brass & Glass pH Pill Tube (only drawn when phVisible)
          this.phGraphics.clear();
          this.phLabelBg.clear();
          if (this.phVisible) {
            const px = 768;
            const py = 492;
            const pw = 18;
            const phH = 148;

            // Glass tube pill with brass border (#B98B48)
            this.phGraphics.fillStyle(0xf8f1e3, 0.94);
            this.phGraphics.lineStyle(2, 0xb98b48, 1);
            this.phGraphics.fillRoundedRect(px, py, pw, phH, 9);
            this.phGraphics.strokeRoundedRect(px, py, pw, phH, 9);

            // Soft glowing target pH bracket inside tube
            const [tMin, tMax] = this.currentOrder.targetPh;
            const y1 = py + ((tMin - 2) / 7) * phH;
            const y2 = py + ((tMax - 2) / 7) * phH;
            this.phGraphics.fillStyle(0x4a7c59, saveData.upgrades.labPhMeter ? 0.88 : 0.45);
            this.phGraphics.fillRoundedRect(px + 3, y1, pw - 6, Math.max(10, y2 - y1), 4);

            // Indicator fluid fill up to pointer
            const ptrY = py + ((this.currentPh - 2) / 7) * phH;
            this.phGraphics.fillStyle(0xd98a2b, 0.5);
            this.phGraphics.fillRoundedRect(px + 5, ptrY, pw - 10, Math.max(6, py + phH - ptrY - 3), 3);

            // Brass needle pointer
            this.phGraphics.fillStyle(0xa85432, 1);
            this.phGraphics.fillTriangle(px + pw + 2, ptrY, px + pw + 11, ptrY - 5, px + pw + 11, ptrY + 5);

            // Attached cream label cap right above tube
            this.phLabelBg.fillStyle(0xf8f1e3, 0.96);
            this.phLabelBg.lineStyle(1.5, 0xb98b48, 1);
            this.phLabelBg.fillRoundedRect(748, 454, 60, 24, 6);
            this.phLabelBg.strokeRoundedRect(748, 454, 60, 24, 6);
          }

          // Swirl ring
          this.swirlRingG.clear();
          if (this.phase === 'swirl') {
            this.swirlRingG.lineStyle(4, 0xd98a2b, 0.35);
            this.swirlRingG.strokeCircle(640, 560, 62);
            this.swirlRingG.lineStyle(5, 0xd98a2b, 1);
            this.swirlRingG.beginPath();
            this.swirlRingG.arc(640, 560, 62, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * this.swirlProgress) / 100);
            this.swirlRingG.strokePath();
          }

          // Patience countdown
          if (this.customerActive && (this.phase === 'brew' || this.phase === 'swirl')) {
            this.patienceLeft = Math.max(0, this.patienceLeft - dt);
            const pct = this.patienceLeft / this.patienceMax;
            this.patienceBar.clear();
            this.patienceBar.fillStyle(pct > 0.3 ? 0x4a7c59 : 0xa85432, 1);
            this.patienceBar.fillRoundedRect(-165, 72, 330 * pct, 9, 4.5);
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

          this.rtX = 230;
          this.rtY = 140;
          this.rtW = 820;
          this.rtH = 440;
          this.dirtRt = this.add.renderTexture(this.rtX, this.rtY, this.rtW, this.rtH).setOrigin(0, 0).setDepth(5);

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

          this.tool = 'spray';
          this.cleanPct = 0;
          this.totalWipeMoves = 0;
          this.doneFlag = false;

          // Cozy parchment status pill (no #000 border)
          const hudBg = this.add.graphics().setDepth(20);
          hudBg.fillStyle(0xfaf4e6, 0.96);
          hudBg.lineStyle(2, 0xa67c52, 0.95);
          hudBg.fillRoundedRect(240, 18, 800, 48, 12);
          hudBg.strokeRoundedRect(240, 18, 800, 48, 12);

          this.statusTxt = this.add
            .text(640, 42, 'Bước 1: Bấm vào từng mảng bẩn để XỊT tinh dầu D-Limonene!', {
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              color: '#3A2516'
            })
            .setOrigin(0.5)
            .setDepth(21);

          this.sprayBtn = makeCozyButton(this, 535, 665, 190, 44, 'Chai xịt tinh dầu', 0xa85432, '#FAF4E6', () => {
            soundEngine.playClick();
            this.setTool('spray');
          }).setDepth(22);

          this.clothBtn = makeCozyButton(this, 745, 665, 190, 44, 'Khăn vải linen', 0xf5ecdc, '#3A2516', () => {
            soundEngine.playClick();
            this.setTool('cloth');
          }).setDepth(22);

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
